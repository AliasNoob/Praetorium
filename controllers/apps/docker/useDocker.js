const App = require('../../../models/App');
const axios = require('axios');
const Logger = require('../../../utils/Logger');
const logger = new Logger();
const loadConfig = require('../../../utils/loadConfig');
const Category = require('../../../models/Category');

const dockerDefaultCategory = {
  id: -2,
  name: 'Docker',
  type: 'apps',
  isPinned: true,
  orderId: 998,
};

const useDocker = async (apps) => {
  const {
    useOrdering: orderType,
    unpinStoppedApps,
    dockerHost: host,
  } = await loadConfig();

  let containers = null;

  // Get list of containers
  try {
    if (host.includes('localhost')) {
      // Use default host
      let { data } = await axios.get(
        `http://${host}/containers/json?{"status":["running"]}`,
        {
          socketPath: '/var/run/docker.sock',
        }
      );

      containers = data;
    } else {
      // Use custom host
      let { data } = await axios.get(
        `http://${host}/containers/json?{"status":["running"]}`
      );

      containers = data;
    }
  } catch {
    logger.log(`Can't connect to the Docker API on ${host}`, 'ERROR');
  }

  if (containers) {
    apps = await App.findAll({
      order: [[orderType, 'ASC']],
    });

    // Filter out containers without any annotations
    containers = containers.filter((e) => Object.keys(e.Labels).length !== 0);

    const dockerApps = [];

    const categories = await Category.findAll({
      where: {
        type: 'apps'
      },
      order: [[orderType, 'ASC']]
    });

    if (!categories.find(category => category.id === dockerDefaultCategory.id)) {
      categories.push(await Category.create(dockerDefaultCategory));
    }

    for (const container of containers) {
      let labels = container.Labels;

      // Traefik labels for URL configuration
      if (!('praetorium.url' in labels)) {
        for (const label of Object.keys(labels)) {
          if (/^traefik.*.frontend.rule/.test(label)) {
            // Traefik 1.x
            let value = labels[label];

            if (value.indexOf('Host') !== -1) {
              value = value.split('Host:')[1];
              labels['praetorium.url'] =
                'https://' + value.split(',').join(';https://');
            }
          } else if (/^traefik.*?\.rule/.test(label)) {
            // Traefik 2.x
            const value = labels[label];

            if (value.indexOf('Host') !== -1) {
              const regex = /\`([a-zA-Z0-9\.\-]+)\`/g;
              const domains = [];

              while ((match = regex.exec(value)) != null) {
                domains.push('http://' + match[1]);
              }

              if (domains.length > 0) {
                labels['praetorium.url'] = domains.join(';');
              }
            }
          }
        }
      }

      // add each container as praetorium formatted app
      if (
        'praetorium.name' in labels &&
        'praetorium.url' in labels &&
        /^app/.test(labels['praetorium.type'])
      ) {
        const names = labels['praetorium.name'].split(';');
        const urls = labels['praetorium.url'].split(';');
        const categoriesLabels = labels['praetorium.category'] ? labels['praetorium.category'].split(';') : [];
        const orders = labels['praetorium.order'] ? labels['praetorium.order'].split(';') : [];
        const icons = labels['praetorium.icon'] ? labels['praetorium.icon'].split(';') : [];

        for (let i = 0; i < names.length; i++) {     
          let category = categoriesLabels[i] ? categories.find(category => category.name.toUpperCase() === categoriesLabels[i].toUpperCase()) : dockerDefaultCategory;
          if (!category) {
            category = await createNewCategory(categoriesLabels[i]);
            if (category) {
              categories.push(category);
            } else {
              category = dockerDefaultCategory;
            }
          }

          dockerApps.push({
            name: names[i] || names[0],
            url: urls[i] || urls[0],
            icon: icons[i] || 'docker',
            categoryId: category.id,
            orderId: orders[i] || 500,
          });
        }
      }
    }

    if (unpinStoppedApps) {
      for (const app of apps) {
        await app.update({ isPinned: false });
      }
    }
    for (const item of dockerApps) {
      // If app already exists, update it
      if (apps.some((app) => app.name === item.name)) {
        const app = apps.find((a) => a.name === item.name);

        if (
          item.icon === 'custom' ||
          (item.icon === 'docker' && app.icon != 'docker')
        ) {
          // update without overriding icon
          await app.update({
            name: item.name,
            url: item.url,
            isPinned: true,
          });
        } else {
          await app.update({
            ...item,
            isPinned: true,
          });
        }
      } else {
        // else create new app
        await App.create({
          ...item,
          icon: item.icon === 'custom' ? 'docker' : item.icon,
          isPinned: true,
        });
      }
    }
  }
};

// TODO : Move somewhere else ?
async function createNewCategory(newCategoryName) {
  return await Category.create({
    name: newCategoryName,
    type: 'apps',
    isPinned: true,
    orderId: Number.MAX_SAFE_INTEGER //New category will always be last and can then be re-ordered manually by user
  });
}

module.exports = useDocker;

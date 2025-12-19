const { join } = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const DOCKER_HOSTS_FILE = join(__dirname, '../../../data/dockerHosts.json');

/**
 * Load Docker hosts from file
 */
const loadDockerHosts = async () => {
  try {
    const data = await fs.readFile(DOCKER_HOSTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist, create with default
    const defaultData = {
      hosts: [
        {
          id: 'local',
          name: 'Local Docker',
          host: 'localhost:2375',
          enabled: true,
        },
      ],
    };
    await fs.writeFile(DOCKER_HOSTS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
};

/**
 * Save Docker hosts to file
 */
const saveDockerHosts = async (data) => {
  await fs.writeFile(DOCKER_HOSTS_FILE, JSON.stringify(data, null, 2));
};

/**
 * @desc      Get all Docker hosts
 * @route     GET /api/docker/hosts
 * @access    Private
 */
const getDockerHosts = async (req, res, next) => {
  try {
    const data = await loadDockerHosts();
    res.status(200).json({
      success: true,
      data: data.hosts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc      Add a new Docker host
 * @route     POST /api/docker/hosts
 * @access    Private
 */
const addDockerHost = async (req, res, next) => {
  try {
    const { name, host, enabled = true } = req.body;

    if (!name || !host) {
      return res.status(400).json({
        success: false,
        error: 'Name and host are required',
      });
    }

    const data = await loadDockerHosts();
    
    const newHost = {
      id: uuidv4(),
      name: name.trim(),
      host: host.trim(),
      enabled,
    };

    data.hosts.push(newHost);
    await saveDockerHosts(data);

    res.status(201).json({
      success: true,
      data: newHost,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc      Update a Docker host
 * @route     PUT /api/docker/hosts/:id
 * @access    Private
 */
const updateDockerHost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, host, enabled } = req.body;

    const data = await loadDockerHosts();
    const hostIndex = data.hosts.findIndex((h) => h.id === id);

    if (hostIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Docker host not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) data.hosts[hostIndex].name = name.trim();
    if (host !== undefined) data.hosts[hostIndex].host = host.trim();
    if (enabled !== undefined) data.hosts[hostIndex].enabled = enabled;

    await saveDockerHosts(data);

    res.status(200).json({
      success: true,
      data: data.hosts[hostIndex],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc      Delete a Docker host
 * @route     DELETE /api/docker/hosts/:id
 * @access    Private
 */
const deleteDockerHost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await loadDockerHosts();
    const hostIndex = data.hosts.findIndex((h) => h.id === id);

    if (hostIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Docker host not found',
      });
    }

    const deletedHost = data.hosts.splice(hostIndex, 1)[0];
    await saveDockerHosts(data);

    res.status(200).json({
      success: true,
      data: deletedHost,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDockerHosts,
  addDockerHost,
  updateDockerHost,
  deleteDockerHost,
  loadDockerHosts,
};

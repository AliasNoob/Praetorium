const axios = require('axios');
const Logger = require('../../../utils/Logger');
const { loadDockerHosts } = require('./dockerHosts');

const logger = new Logger();

/**
 * Fetch containers from a single Docker host
 */
const fetchContainersFromHost = async (hostConfig) => {
  const host = (hostConfig.host || '').trim();
  
  let containers = null;
  let error = null;

  try {
    if (host === 'localhost:2375' || host === 'localhost' || host === '') {
      // For local Docker, try TCP first (Docker Desktop)
      try {
        const { data } = await axios.get(
          'http://localhost:2375/containers/json?all=true',
          { timeout: 5000 }
        );
        containers = data;
      } catch (tcpErr) {
        // If TCP fails, try the Unix socket (Linux/Mac)
        try {
          const { data } = await axios.get(
            'http://localhost/containers/json?all=true',
            { 
              socketPath: '/var/run/docker.sock', 
              timeout: 5000 
            }
          );
          containers = data;
        } catch (socketErr) {
          throw new Error('Could not connect via TCP (localhost:2375) or Unix socket');
        }
      }
    } else if (host.includes(':')) {
      // Host includes port (e.g., "192.168.1.100:2375")
      const { data } = await axios.get(
        `http://${host}/containers/json?all=true`,
        { timeout: 5000 }
      );
      containers = data;
    } else {
      // Host without port, assume default Docker port 2375
      const { data } = await axios.get(
        `http://${host}:2375/containers/json?all=true`,
        { timeout: 5000 }
      );
      containers = data;
    }
  } catch (err) {
    error = err.message;
  }

  return { containers, error };
};

/**
 * Transform raw container data into useful format
 */
const transformContainers = (containers, hostConfig) => {
  return containers.map((container) => {
    const labels = container.Labels || {};
    const names = container.Names?.map((n) => n.replace(/^\//, '')) || [];
    const ports = container.Ports || [];

    // Try to extract URL from various sources
    let suggestedUrl = '';

    // Check for Traefik 2.x labels
    for (const [key, value] of Object.entries(labels)) {
      if (/^traefik.*?\.rule/.test(key) && value.includes('Host')) {
        const match = value.match(/`([a-zA-Z0-9.\-]+)`/);
        if (match) {
          suggestedUrl = `https://${match[1]}`;
          break;
        }
      }
    }

    // Check for Traefik 1.x labels
    if (!suggestedUrl) {
      for (const [key, value] of Object.entries(labels)) {
        if (/^traefik.*.frontend.rule/.test(key) && value.includes('Host')) {
          const hostValue = value.split('Host:')[1];
          if (hostValue) {
            suggestedUrl = `https://${hostValue.split(',')[0]}`;
            break;
          }
        }
      }
    }

    // Helper to get the host address (without port)
    const getHostAddress = () => {
      if (!hostConfig.host) {
        return null;
      }
      return hostConfig.host.includes('localhost') 
        ? 'localhost' 
        : hostConfig.host.split(':')[0];
    };

    // Fallback: use exposed ports with host IP
    if (!suggestedUrl) {
      const hostAddress = getHostAddress();
      
      if (hostAddress && ports.length > 0) {
        // Try to use public port if available
        const port = ports.find((p) => p.PublicPort) || ports[0];
        if (port.PublicPort) {
          suggestedUrl = `http://${hostAddress}:${port.PublicPort}`;
        } else {
          // No public port available, use IP only
          suggestedUrl = `http://${hostAddress}`;
        }
      } else if (hostAddress) {
        // No ports at all, use IP only
        suggestedUrl = `http://${hostAddress}`;
      }
    }

    return {
      id: container.Id.substring(0, 12),
      name: names[0] || container.Id.substring(0, 12),
      image: container.Image,
      state: container.State,
      status: container.Status,
      ports: ports.map((p) => ({
        private: p.PrivatePort,
        public: p.PublicPort,
        type: p.Type,
      })),
      labels,
      suggestedUrl,
      suggestedIcon: 'docker',
      // Add host info so we know which server this came from
      hostId: hostConfig.id,
      hostName: hostConfig.name,
    };
  });
};

/**
 * @desc      Test a specific Docker host
 * @route     GET /api/docker/test/:id
 * @access    Private
 */
const testDockerHost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await loadDockerHosts();
    const hostConfig = data.hosts.find((h) => h.id === id);

    if (!hostConfig) {
      return res.status(404).json({
        success: false,
        error: 'Docker host not found',
      });
    }

    const { containers, error } = await fetchContainersFromHost(hostConfig);

    if (error) {
      logger.log(`Cannot connect to Docker API on ${hostConfig.name} (${hostConfig.host}): ${error}`, 'ERROR');
      return res.status(200).json({
        success: false,
        error: `Cannot connect to ${hostConfig.name} (${hostConfig.host}): ${error}`,
        data: null,
      });
    }

    const services = transformContainers(containers, hostConfig);

    res.status(200).json({
      success: true,
      data: {
        host: hostConfig,
        containerCount: services.length,
        services,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc      Test all enabled Docker hosts
 * @route     GET /api/docker/test
 * @access    Private
 */
const testAllDockerHosts = async (req, res, next) => {
  try {
    const data = await loadDockerHosts();
    const enabledHosts = data.hosts.filter((h) => h.enabled);

    const results = {
      hosts: [],
      totalContainers: 0,
      allServices: [],
    };

    for (const hostConfig of enabledHosts) {
      const { containers, error } = await fetchContainersFromHost(hostConfig);

      if (error) {
        logger.log(`Cannot connect to Docker API on ${hostConfig.name} (${hostConfig.host}): ${error}`, 'ERROR');
        results.hosts.push({
          ...hostConfig,
          success: false,
          error: error,
          containerCount: 0,
          services: [],
        });
      } else {
        const services = transformContainers(containers, hostConfig);
        results.hosts.push({
          ...hostConfig,
          success: true,
          error: null,
          containerCount: services.length,
          services,
        });
        results.totalContainers += services.length;
        results.allServices.push(...services);
      }
    }

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  testDockerHost,
  testAllDockerHosts,
};

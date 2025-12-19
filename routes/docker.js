const express = require('express');
const router = express.Router();

const { auth, requireAuth } = require('../middleware');
const { testDockerHost, testAllDockerHosts } = require('../controllers/apps/docker/testDocker');
const {
  getDockerHosts,
  addDockerHost,
  updateDockerHost,
  deleteDockerHost,
} = require('../controllers/apps/docker/dockerHosts');

// Docker hosts CRUD
router
  .route('/hosts')
  .get(auth, requireAuth, getDockerHosts)
  .post(auth, requireAuth, addDockerHost);

router
  .route('/hosts/:id')
  .put(auth, requireAuth, updateDockerHost)
  .delete(auth, requireAuth, deleteDockerHost);

// Test Docker connections
router.route('/test').get(auth, requireAuth, testAllDockerHosts);
router.route('/test/:id').get(auth, requireAuth, testDockerHost);

module.exports = router;

const express = require('express');
const router = express.Router();

// middleware
const { auth, requireAuth } = require('../middleware');

const {
  getCSS,
  updateCSS,
  getConfig,
  updateConfig,
  getLayout,
  updateLayout,
} = require('../controllers/config');

router.route('/').get(getConfig).put(auth, requireAuth, updateConfig);

router.route('/0/css').get(getCSS).put(auth, requireAuth, updateCSS);

router.route('/layout').get(auth, requireAuth, getLayout).put(auth, requireAuth, updateLayout);

module.exports = router;

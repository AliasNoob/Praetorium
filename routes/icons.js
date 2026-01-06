const express = require('express');
const router = express.Router();

// middleware
const { auth, requireAuth } = require('../middleware');

const {
  fetchFaviconController,
  clearIconCache,
  getCacheStats
} = require('../controllers/icons');

// POST /api/icons/fetch - Fetch favicon from URL
router
  .route('/fetch')
  .post(auth, requireAuth, fetchFaviconController);

// GET/DELETE /api/icons/cache - Cache management
router
  .route('/cache')
  .get(auth, requireAuth, getCacheStats)
  .delete(auth, requireAuth, clearIconCache);

module.exports = router;

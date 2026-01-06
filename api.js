const { join } = require('path');
const express = require('express');
const { errorHandler } = require('./middleware');

const api = express();

// Static files - order matters, these must come before the catch-all route
api.use(express.static(join(__dirname, 'public')));
api.use('/uploads', express.static(join(__dirname, 'data/uploads')));
api.use('/fetched-icons', express.static(join(__dirname, 'data/fetched-icons'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
    // Allow cross-origin requests for images
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Body parser
api.use(express.json());

// Link controllers with routes
api.use('/api/apps', require('./routes/apps'));
api.use('/api/config', require('./routes/config'));
api.use('/api/weather', require('./routes/weather'));
api.use('/api/categories', require('./routes/category'));
api.use('/api/bookmarks', require('./routes/bookmark'));
api.use('/api/queries', require('./routes/queries'));
api.use('/api/auth', require('./routes/auth'));
api.use('/api/themes', require('./routes/themes'));
api.use('/api/docker', require('./routes/docker'));
api.use('/api/icons', require('./routes/icons'));

// Catch-all for SPA - exclude API, uploads, and fetched-icons paths
api.get(/^\/(?!api|uploads|fetched-icons)/, (req, res) => {
  res.sendFile(join(__dirname, 'public/index.html'));
});

// Custom error handler
api.use(errorHandler);

module.exports = api;

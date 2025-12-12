const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { login, validate } = require('../controllers/auth');
const requireBody = require('../middleware/requireBody');

// Rate limiting for login endpoint - max 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    error: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.route('/').post(loginLimiter, requireBody(['password', 'duration']), login);

router.route('/validate').post(requireBody(['token']), validate);

module.exports = router;

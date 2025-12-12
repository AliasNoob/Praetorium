const crypto = require('crypto');
const asyncWrapper = require('../../middleware/asyncWrapper');
const ErrorResponse = require('../../utils/ErrorResponse');
const signToken = require('../../utils/signToken');

// Timing-safe comparison to prevent timing attacks
const timingSafeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Make a dummy comparison to avoid timing leak
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

// @desc      Login user
// @route     POST /api/auth/
// @access    Public
const login = asyncWrapper(async (req, res, next) => {
  const { password, duration } = req.body;

  const isMatch = timingSafeEqual(process.env.PASSWORD || '', password || '');

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  const token = signToken(duration);

  res.status(200).json({
    success: true,
    data: { token },
  });
});

module.exports = login;

const rateLimit = require('express-rate-limit');

// Create a no-op rate limiter that doesn't actually limit anything
const noOpLimiter = (req, res, next) => {
  // No rate limiting, just pass through
  next();
};

// Original rate limiter replaced with no-op limiter
const publicApiLimiter = noOpLimiter;

// Original auth limiter replaced with no-op limiter
const authLimiter = noOpLimiter;

module.exports = {
  publicApiLimiter,
  authLimiter
}; 
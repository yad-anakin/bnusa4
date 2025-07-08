const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/test
 * @desc    Test route to verify API is working
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Test route is working',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /api/test/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 
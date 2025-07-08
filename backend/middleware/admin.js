const User = require('../models/User');
const admin = require('../config/firebase-service-account');

/**
 * Middleware to verify if user has admin role
 * This should be used after the verifyFirebaseToken middleware
 */
const isAdmin = async (req, res, next) => {
  try {
    // First make sure user is authenticated
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required'
      });
    }
    
    // Find user in database
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    // Check if user exists and has admin role
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin privileges required'
      });
    }
    
    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin verification',
      error: error.message
    });
  }
};

module.exports = isAdmin; 
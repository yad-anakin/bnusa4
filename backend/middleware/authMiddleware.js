const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('../config/firebase-service-account');

exports.verifyAdminToken = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is an admin
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    
    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Authentication middleware for regular users
exports.checkAuthentication = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AuthMiddleware] Authentication failed: No token provided or invalid format');
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: No token provided or invalid format'
      });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Check if token is empty or invalid
    if (!idToken || idToken === 'undefined' || idToken === 'null') {
      console.log('[AuthMiddleware] Authentication failed: Token is undefined or null');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token format'
      });
    }
    
    // For development fallback - if Firebase admin is not configured
    if (!admin || !admin.auth) {
      console.log('[AuthMiddleware] Firebase admin not configured, using fallback authentication');
      const user = await User.findOne();
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'No users exist in the database. Please create a user first.' 
        });
      }
      
      // Attach user to request
      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        firebaseUid: user.firebaseUid || null
      };
      
      console.log(`[AuthMiddleware] Using fallback user: ${user.name} (${user._id})`);
      return next();
    }
    
    // Verify Firebase token
    console.log('[AuthMiddleware] Verifying Firebase token...');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('[AuthMiddleware] Token verified for Firebase UID:', decodedToken.uid);
    
    // Get MongoDB user from firebaseUid
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      console.log('[AuthMiddleware] MongoDB user not found for Firebase UID:', decodedToken.uid);
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }
    
    // Attach MongoDB user to request
    req.user = {
      id: user._id,
      uid: decodedToken.uid,
      name: user.name,
      email: user.email
    };
    
    console.log(`[AuthMiddleware] User authenticated successfully: ${user.name} (${user._id})`);
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Authentication error:', error.message);
    
    // Provide more specific error messages based on Firebase error codes
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Token has expired. Please sign in again.' 
      });
    } else if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Token has been revoked. Please sign in again.' 
      });
    } else if (error.code === 'auth/argument-error') {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Token is invalid or malformed' 
      });
    }
    
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed',
      error: error.message
    });
  }
}; 
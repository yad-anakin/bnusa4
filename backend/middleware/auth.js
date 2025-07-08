const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('../config/firebase-service-account');

/**
 * Authentication middleware that verifies Firebase tokens
 * and maps Firebase UIDs to MongoDB user IDs
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Authentication failed: No token provided or invalid format');
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: No token provided or invalid format'
      });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Check if token is empty or invalid
    if (!idToken || idToken === 'undefined' || idToken === 'null') {
      console.log('Authentication failed: Token is undefined or null');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token format'
      });
    }
    
    // For development fallback - if Firebase admin is not configured
    if (!admin || !admin.auth) {
      console.log('Firebase admin not configured, using fallback authentication');
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
      
      console.log(`Using fallback user: ${user.name} (${user._id})`);
      return next();
    }
    
    // Verify Firebase token
    console.log('Verifying Firebase token...');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Token verified for Firebase UID:', decodedToken.uid);
    
    // Find corresponding MongoDB user
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    // If no user found with this Firebase UID, try to find by email
    if (!user && decodedToken.email) {
      user = await User.findOne({ email: decodedToken.email });
      
      // If user found by email but no Firebase UID set, update it
      if (user && !user.firebaseUid) {
        user.firebaseUid = decodedToken.uid;
        await user.save();
        console.log(`Updated user ${user._id} with Firebase UID: ${decodedToken.uid}`);
      }
    }
    
    // If still no user found, create a new one
    if (!user) {
      console.log(`No user found for Firebase UID: ${decodedToken.uid}, creating new user...`);
      user = new User({
        name: decodedToken.name || 'User',
        email: decodedToken.email || 'no-email@example.com',
        username: (decodedToken.email || '').split('@')[0] || `user_${Date.now()}`,
        firebaseUid: decodedToken.uid,
        profileImage: decodedToken.picture || ''
      });
      
      await user.save();
      console.log(`Created new user with ID: ${user._id} for Firebase UID: ${decodedToken.uid}`);
    }
    
    // Attach user data to request
    req.user = {
      id: user._id,
      name: user.name || decodedToken.name,
      email: user.email || decodedToken.email,
      firebaseUid: decodedToken.uid
    };
    
    console.log(`Authenticated as: ${req.user.name} (MongoDB ID: ${req.user.id})`);
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    
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

module.exports = auth; 
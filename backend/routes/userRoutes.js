const express = require('express');
const router = express.Router();
const admin = require('../config/firebase-service-account');
const mongoose = require('mongoose');
const User = require('../models/User');
const UserImage = require('../models/UserImage');
const Article = require('../models/Article');
const { uploadImage, deleteImage, getDefaultImageUrl } = require('../utils/imageUpload');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Middleware to verify Firebase token
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Authentication failed: No token provided or invalid format');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No token provided or invalid format'
    });
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  
  if (!idToken || idToken === 'undefined' || idToken === 'null') {
    console.error('Authentication failed: Token is undefined or null');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token format'
    });
  }
  
  try {
    console.log('Verifying Firebase token...');
    
    // Safely check if Firebase Admin is initialized
    if (!admin || !admin.auth) {
      console.error('Firebase Admin SDK not properly initialized');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: Firebase Admin not properly initialized'
      });
    }
    
    // Double-check to make sure apps are initialized
    if (!admin.apps || !admin.apps.length) {
      console.error('Firebase Admin apps not initialized');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: Firebase Admin apps not initialized'
      });
    }
    
    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Token verified for UID:', decodedToken.uid);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    
    // Provide more specific error messages based on the error type
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
    
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token',
      error: error.message
    });
  }
};

// Add this helper function before the routes
const getUserImageData = async (userId) => {
  try {
    if (!userId) return null;
    
    let userImage = await UserImage.findOne({ userId });
    
    // If no UserImage document exists, create one from the User data
    if (!userImage) {
      const user = await User.findById(userId);
      if (!user) return null;
      
      console.log(`Creating missing UserImage for user ${userId}`);
      userImage = new UserImage({
        userId,
        profileImage: user.profileImage || '',
        bannerImage: user.bannerImage || '/images/deafult-banner.jpg',
      });
      
      try {
        await userImage.save();
        console.log(`Successfully created UserImage for user ${userId}`);
      } catch (saveError) {
        console.error(`Failed to create UserImage for user ${userId}:`, saveError);
        // Return null if we couldn't save, but continue execution
        return null;
      }
    }
    
    return userImage;
  } catch (error) {
    console.error('Error fetching user image data:', error);
    return null;
  }
};

// Add this helper function
const syncUserImages = async (userId, profileImage, bannerImage) => {
  try {
    if (!userId) {
      console.error('Cannot sync user images: userId is required');
      return null;
    }
    
    // Find existing userImage or create new one
    let userImage = await UserImage.findOne({ userId });
    let diagnosticInfo = { createdNew: false, changes: [] };
    
    if (userImage) {
      // Update existing document if new values are provided
      let hasChanges = false;
      
      if (profileImage !== undefined && userImage.profileImage !== profileImage) {
        console.log(`Updating profile image for user ${userId} from "${userImage.profileImage}" to "${profileImage}"`);
        diagnosticInfo.changes.push({
          field: 'profileImage',
          from: userImage.profileImage,
          to: profileImage
        });
        userImage.profileImage = profileImage;
        hasChanges = true;
      }
      
      if (bannerImage !== undefined && userImage.bannerImage !== bannerImage) {
        console.log(`Updating banner image for user ${userId} from "${userImage.bannerImage}" to "${bannerImage}"`);
        diagnosticInfo.changes.push({
          field: 'bannerImage',
          from: userImage.bannerImage,
          to: bannerImage
        });
        userImage.bannerImage = bannerImage;
        hasChanges = true;
      }
      
      if (hasChanges) {
        userImage.lastUpdated = Date.now();
        await userImage.save();
        console.log(`Updated UserImage for user ${userId}`);
      } else {
        console.log(`No changes needed for UserImage of user ${userId}`);
      }
    } else {
      // Get user data to fill in any missing values
      const user = await User.findById(userId);
      
      // Create new UserImage document
      userImage = new UserImage({
        userId,
        profileImage: profileImage !== undefined ? profileImage : (user?.profileImage || ''),
        bannerImage: bannerImage !== undefined ? bannerImage : (user?.bannerImage || '/images/deafult-banner.jpg'),
      });
      
      diagnosticInfo.createdNew = true;
      
      await userImage.save();
      console.log(`Created new UserImage for user ${userId}`);
    }
    
    return { userImage, diagnosticInfo };
  } catch (error) {
    console.error('Error syncing user images:', error);
    return { error: error.message };
  }
};

// @route   POST /api/users/register
// @desc    Register a new user with Firebase Auth in MongoDB
// @access  Private (requires Firebase token)
router.post('/register', verifyFirebaseToken, async (req, res) => {
  try {
    // Check if user already exists in MongoDB
    let existingUser = await User.findOne({ 
      $or: [
        { firebaseUid: req.user.uid },
        { email: req.user.email }
      ]
    });
    
    if (existingUser) {
      // If user exists but has no Firebase UID, update it
      if (!existingUser.firebaseUid) {
        existingUser.firebaseUid = req.user.uid;
        await existingUser.save();
      }
      
      return res.json({
        success: true,
        message: 'User already exists, Firebase UID updated if needed',
        user: {
          id: existingUser._id,
          firebaseUid: existingUser.firebaseUid,
          name: existingUser.name,
          username: existingUser.username,
          email: existingUser.email
        }
      });
    }
    
    // Extract user data from request
    const { name, username, email, profileImage } = req.body;
    
    // Generate username if not provided
    const generatedUsername = username || (email ? email.split('@')[0] : '');
    
    // Check if username already exists
    const usernameExists = await User.findOne({ username: generatedUsername });
    let finalUsername = generatedUsername;
    
    if (usernameExists) {
      // If username taken, add random suffix
      finalUsername = `${generatedUsername}${Math.floor(Math.random() * 1000)}`;
    }
    
    // Create new user in MongoDB
    const newUser = new User({
      firebaseUid: req.user.uid,
      name: name || req.user.name || '',
      username: finalUsername,
      email: email || req.user.email || '',
      profileImage: profileImage || req.user.picture || '',
    });
    
    await newUser.save();
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        firebaseUid: newUser.firebaseUid,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/username-available
// @desc    Check if a username is available
// @access  Public
router.get('/username-available', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username parameter is required'
      });
    }
    
    // Check if username exists in MongoDB
    const usernameExists = await User.findOne({ username });
    
    res.json({
      success: true,
      available: !usernameExists
    });
  } catch (error) {
    console.error('Error checking username availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    // Get user from MongoDB using Firebase UID
    let user = await User.findOne({ firebaseUid: req.user.uid });
    
    // Get default banner image from B2 or local fallback
    // First try to get the banner directly from the endpoint to ensure we get the B2 version
    let defaultBannerUrl;
    try {
      // Make a request to our own API endpoint to get the most current default banner URL
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/images/default/banner`);
      const data = await response.json();
      if (data.success && data.imageUrl) {
        defaultBannerUrl = data.imageUrl;
        console.log('Got B2 default banner URL:', defaultBannerUrl);
      } else {
        // Fallback to the utility function
        defaultBannerUrl = getDefaultImageUrl('banner');
        console.log('Falling back to utility function for banner URL:', defaultBannerUrl);
      }
    } catch (fetchErr) {
      console.error('Error fetching default banner URL, falling back to utility function:', fetchErr);
      defaultBannerUrl = getDefaultImageUrl('banner');
    }
    
    if (!user) {
      // If user doesn't exist in our database, create minimal record
      user = new User({
        firebaseUid: req.user.uid,
        name: req.user.name || '',
        email: req.user.email || '',
        username: req.user.email ? req.user.email.split('@')[0] : '',
        profileImage: req.user.picture || '',
        bannerImage: defaultBannerUrl, // Use default banner from B2
        bio: 'No bio available', // Add default bio
      });
      await user.save();
    }
    
    // Always ensure the user has the default banner image if they don't have a custom one
    // This fixes any users created before the default banner was set
    if (!user.bannerImage || user.bannerImage === '/images/placeholders/profile-banner-primary.jpg' || user.bannerImage === '/images/deafult-banner.jpg') {
      user.bannerImage = defaultBannerUrl;
      await user.save();
    }
    
    // Fetch the user's image data
    const userImageData = await getUserImageData(user._id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio || 'No bio available',
        profileImage: user.profileImage,
        bannerImage: user.bannerImage || defaultBannerUrl,
        followers: user.followers ? user.followers.length : 0,
        following: user.following ? user.following.length : 0,
        joinDate: user.joinDate,
        userImage: userImageData
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private (requires Firebase token)
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid: req.user.uid })
      .populate({
        path: 'articles',
        match: { status: 'published' }, // Only populate published articles
        select: 'title description slug categories createdAt coverImage',
        options: { sort: { createdAt: -1 } } // Sort by creation date (newest first)
      });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if this user has any published articles to confirm writer status
    const articlesCount = user.articles ? user.articles.length : 0;
    
    // Set isWriter flag based on articles (in case it wasn't updated earlier)
    if (articlesCount > 0 && !user.isWriter) {
      user.isWriter = true;
      await user.save();
    }
    
    // Fetch the user's image data
    const userImageData = await getUserImageData(user._id);
    console.log(`Fetched userImage data for profile of user ${user._id}:`, 
      userImageData ? 
        { 
          profileImage: userImageData.profileImage ? 'exists' : 'missing',
          bannerImage: userImageData.bannerImage ? 'exists' : 'missing',
          lastUpdated: userImageData.lastUpdated 
        } : 'missing');
    
    // Return user data
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage,
        socialMedia: user.socialMedia,
        followers: user.followers,
        following: user.following,
        articles: user.articles,
        articlesCount: articlesCount,
        isWriter: user.isWriter,
        joinDate: user.createdAt,
        userImage: userImageData
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { name, username, bio, socialMedia, profileImage, bannerImage } = req.body;
    
    // Get user from MongoDB
    let user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user in MongoDB
    user.name = name || user.name;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    
    // Update profile image if provided
    if (profileImage) {
      user.profileImage = profileImage;
    }
    
    // Update banner image if provided
    if (bannerImage) {
      user.bannerImage = bannerImage;
    }
    
    // Update social media if provided
    if (socialMedia) {
      user.socialMedia = {
        ...user.socialMedia,
        ...socialMedia
      };
    }
    
    await user.save();
    
    // Also update Firebase user profile
    const updateData = {
      displayName: name || user.name
    };
    
    // Update Firebase photo URL if profileImage provided
    if (profileImage) {
      updateData.photoURL = profileImage;
    }
    
    await admin.auth().updateUser(req.user.uid, updateData);
    
    // Sync with UserImage model
    await syncUserImages(user._id, profileImage, bannerImage);
    
    // Fetch the user's image data
    const userImageData = await getUserImageData(user._id);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage,
        socialMedia: user.socialMedia,
        followers: user.followers ? user.followers.length : 0,
        following: user.following ? user.following.length : 0,
        joinDate: user.joinDate,
        userImage: userImageData
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/users/profile-image
// @desc    Upload profile image
// @access  Private
router.post('/profile-image', verifyFirebaseToken, async (req, res) => {
  try {
    console.log('Profile image upload request received');
    
    // Check if using multer (req.file) or express-fileupload (req.files)
    let imageData, imageName, imageMimeType;
    
    if (req.file) {
      // Using multer
      console.log('Using multer for profile image upload');
      imageData = req.file.buffer;
      imageName = req.file.originalname;
      imageMimeType = req.file.mimetype;
    } else if (req.files && req.files.image) {
      // Using express-fileupload
      console.log('Using express-fileupload for profile image upload');
      const imageFile = req.files.image;
      imageData = imageFile.data;
      imageName = imageFile.name;
      imageMimeType = imageFile.mimetype;
    } else {
      console.log('No image file found in request');
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    console.log('Uploading profile image to B2:', { name: imageName, type: imageMimeType });
    
    // Upload image to Backblaze B2
    const imageUrl = await uploadImage(
      imageData,
      imageName,
      imageMimeType,
      'profiles'
    );
    
    console.log('Profile image uploaded successfully:', imageUrl);
    
    // Get user from MongoDB
    let user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete old image if it exists
    if (user.profileImage && user.profileImage.includes('bnusa-images')) {
      try {
        await deleteImage(user.profileImage);
        console.log('Old profile image deleted');
      } catch (error) {
        console.error('Error deleting old profile image:', error);
        // Continue even if old image deletion fails
      }
    }
    
    // Update user profile image in MongoDB
    user.profileImage = imageUrl;
    await user.save();
    
    // Sync with UserImage model
    await syncUserImages(user._id, imageUrl, undefined);
    
    try {
      // Also update photo URL in Firebase
      await admin.auth().updateUser(req.user.uid, {
        photoURL: imageUrl
      });
      console.log('Firebase user photo URL updated');
    } catch (firebaseError) {
      console.error('Error updating Firebase photo URL:', firebaseError);
      // Continue even if Firebase update fails
    }
    
    // Fetch the user's image data
    const userImageData = await getUserImageData(user._id);
    
    res.json({
      success: true,
      message: 'Profile image updated successfully',
      imageUrl,
      userImage: userImageData
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
      error: error.message
    });
  }
});

// @route   POST /api/users/banner-image
// @desc    Upload banner image
// @access  Private
router.post('/banner-image', verifyFirebaseToken, async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    const imageFile = req.files.image;
    
    // Log file details for debugging
    console.log('Banner image upload request received:', {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.mimetype,
      uid: req.user.uid
    });
    
    // Upload image to Backblaze B2
    let imageUrl;
    try {
      imageUrl = await uploadImage(
        imageFile.data,
        imageFile.name,
        imageFile.mimetype,
        'banners'
      );
    } catch (uploadError) {
      console.error('Error during B2 banner image upload:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload banner image to storage',
        details: uploadError.message
      });
    }
    
    // Get user from MongoDB
    let user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete old image if it exists
    if (user.bannerImage && user.bannerImage.includes('bnusa-images')) {
      try {
        await deleteImage(user.bannerImage);
      } catch (error) {
        console.error('Error deleting old banner image:', error);
        // Continue even if old image deletion fails
      }
    }
    
    // Update user banner image
    user.bannerImage = imageUrl;
    await user.save();
    
    // Sync with UserImage model
    await syncUserImages(user._id, undefined, imageUrl);
    
    // Fetch the user's image data
    const userImageData = await getUserImageData(user._id);
    
    res.json({
      success: true,
      message: 'Banner image updated successfully',
      imageUrl,
      userImage: userImageData
    });
  } catch (error) {
    console.error('Error uploading banner image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing banner image upload',
      error: error.message
    });
  }
});

// @route   POST /api/users/create
// @desc    Create a new user in MongoDB from Firebase user
// @access  Private (requires Firebase token)
router.post('/create', verifyFirebaseToken, async (req, res) => {
  try {
    console.log('Creating user in MongoDB for UID:', req.user.uid);
    
    // Check if user already exists in MongoDB by Firebase UID
    let existingUser = await User.findOne({ 
      $or: [
        { firebaseUid: req.user.uid },
        { email: req.user.email }
      ]
    });
    
    if (existingUser) {
      console.log('User already exists in MongoDB, returning existing user');
      
      // Before returning, ensure user has the default banner if needed
      // Get default banner from B2 - use the most reliable method
      let defaultBannerUrl;
      try {
        // Make a request to our own API endpoint to get the most current default banner URL
        const response = await fetch(`${req.protocol}://${req.get('host')}/api/images/default/banner`);
        const data = await response.json();
        if (data.success && data.imageUrl) {
          defaultBannerUrl = data.imageUrl;
          console.log('Got B2 default banner URL:', defaultBannerUrl);
        } else {
          // Fallback to the utility function
          defaultBannerUrl = getDefaultImageUrl('banner');
          console.log('Falling back to utility function for banner URL:', defaultBannerUrl);
        }
      } catch (fetchErr) {
        console.error('Error fetching default banner URL, falling back to utility function:', fetchErr);
        defaultBannerUrl = getDefaultImageUrl('banner');
      }
      
      if (!existingUser.bannerImage || 
          existingUser.bannerImage === '/images/placeholders/profile-banner-primary.jpg' ||
          existingUser.bannerImage === '/images/deafult-banner.jpg') {
        existingUser.bannerImage = defaultBannerUrl;
        await existingUser.save();
      }
      
      // Fetch the user's image data
      const userImageData = await getUserImageData(existingUser._id);
      
      return res.json({
        success: true,
        message: 'User already exists in MongoDB',
        user: {
          ...existingUser.toObject(),
          userImage: userImageData
        }
      });
    }
    
    // Extract user data from request body
    const { name, username, email, profileImage, bio, firebaseUid } = req.body;
    
    // Get default banner from B2 using the API endpoint
    let defaultBannerUrl;
    try {
      // Make a request to our own API endpoint to get the most current default banner URL
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/images/default/banner`);
      const data = await response.json();
      if (data.success && data.imageUrl) {
        defaultBannerUrl = data.imageUrl;
        console.log('Got B2 default banner URL for new user:', defaultBannerUrl);
      } else {
        // Fallback to the utility function
        defaultBannerUrl = getDefaultImageUrl('banner');
        console.log('Falling back to utility function for banner URL:', defaultBannerUrl);
      }
    } catch (fetchErr) {
      console.error('Error fetching default banner URL, falling back to utility function:', fetchErr);
      defaultBannerUrl = getDefaultImageUrl('banner');
    }
    
    // Generate base username if not provided
    let baseUsername = username || 
                     (email ? email.split('@')[0] : '') || 
                     (req.user.email ? req.user.email.split('@')[0] : '');
    
    // Add uniqueness by default with timestamp
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    
    // Try to find a unique username by checking existing usernames
    let finalUsername = baseUsername;
    let usernameTaken = true;
    let attempts = 0;
    
    while (usernameTaken && attempts < 5) {
      // Check if this username exists
      const existingUsername = await User.findOne({ username: finalUsername });
      
      if (!existingUsername) {
        usernameTaken = false; // Username is available
        console.log('Found available username:', finalUsername);
      } else {
        // Try with a more unique suffix
        finalUsername = `${baseUsername}_${timestamp.toString().slice(-4)}_${randomNum}`;
        console.log('Username taken, trying:', finalUsername);
        attempts++;
      }
    }
    
    console.log('Final username for new user:', finalUsername);
    
    // Create new user in MongoDB
    const newUser = new User({
      firebaseUid: firebaseUid || req.user.uid,
      name: name || req.user.name || '',
      username: finalUsername,
      email: email || req.user.email || '',
      profileImage: profileImage || req.user.picture || '',
      bannerImage: defaultBannerUrl, // Always use the default banner from B2
      bio: bio || 'No bio available', // Add default bio
      joinDate: new Date()
    });
    
    await newUser.save();
    console.log('User successfully saved to MongoDB');
    
    // Fetch the user's image data
    const userImageData = await getUserImageData(newUser._id);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully in MongoDB',
      user: {
        ...newUser.toObject(),
        userImage: userImageData
      }
    });
  } catch (error) {
    console.error('Error creating user in MongoDB:', error);
    
    // Handle specific errors
    if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      
      return res.status(400).json({
        success: false,
        message: `An account with that ${field} (${value}) already exists. Please use a different ${field}.`,
        error: 'Duplicate ' + field,
        field
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating user in MongoDB',
      error: error.message
    });
  }
});

// @route   GET /api/users/check-auth
// @desc    Check if Firebase authentication is working
// @access  Public
router.get('/check-auth', async (req, res) => {
  try {
    // Check if Firebase Admin is initialized
    const initialized = admin && admin.apps && admin.apps.length > 0;
    
    res.json({
      success: true,
      message: 'Auth system status',
      adminInitialized: initialized,
      adminVersion: admin ? admin.SDK_VERSION : 'unknown',
      appName: initialized ? admin.apps[0].name : 'none'
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking authentication',
      error: error.message
    });
  }
});

// @route   GET /api/users/:username
// @desc    Get user profile by username
// @access  Public
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find user by username
    const user = await User.findOne({ username })
      .populate({
        path: 'articles',
        match: { status: 'published' }, // Only include published articles
        select: 'title description slug categories createdAt coverImage'
      })
      .populate('followers', '_id name username profileImage')
      .populate('following', '_id name username profileImage');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Fetch the user's image data
    const userImageData = await getUserImageData(user._id);
    
    // Return the user profile
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage,
        socialMedia: user.socialMedia,
        followers: user.followers || [],
        following: user.following || [],
        joinDate: user.joinDate,
        articles: user.articles || [],
        isWriter: user.isWriter || false,
        userImage: userImageData
      }
    });
  } catch (error) {
    console.error('Error fetching user profile by username:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/users/follow/:userId
// @desc    Follow a user
// @access  Private
router.post('/follow/:userId', verifyFirebaseToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Get current user
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found'
      });
    }
    
    // Prevent following yourself
    if (currentUser._id.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }
    
    // Check if target user exists
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }
    
    // Check if already following - compare strings for proper equality check
    const isAlreadyFollowing = currentUser.following.some(id => 
      id.toString() === userId.toString()
    );
    
    if (isAlreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }
    
    // Add to following list for current user
    currentUser.following.push(userId);
    await currentUser.save();
    
    // Add to followers list for target user
    targetUser.followers.push(currentUser._id);
    await targetUser.save();
    
    res.json({
      success: true,
      message: `You are now following ${targetUser.name}`,
      following: currentUser.following.length,
      followers: targetUser.followers.length
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while following user',
      error: error.message
    });
  }
});

// @route   POST /api/users/unfollow/:userId
// @desc    Unfollow a user
// @access  Private
router.post('/unfollow/:userId', verifyFirebaseToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Get current user
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found'
      });
    }
    
    // Prevent unfollowing yourself
    if (currentUser._id.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot unfollow yourself'
      });
    }
    
    // Check if target user exists
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }
    
    // Check if already following
    const isFollowing = currentUser.following.some(id => 
      id.toString() === userId.toString()
    );
    
    if (!isFollowing) {
      return res.status(400).json({
        success: false,
        message: 'You are not following this user'
      });
    }
    
    // Remove from following list for current user
    currentUser.following = currentUser.following.filter(id => id.toString() !== userId.toString());
    await currentUser.save();
    
    // Remove from followers list for target user
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser._id.toString());
    await targetUser.save();
    
    res.json({
      success: true,
      message: `You have unfollowed ${targetUser.name}`,
      following: currentUser.following.length,
      followers: targetUser.followers.length
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unfollowing user',
      error: error.message
    });
  }
});

// @route   GET /api/users/follow/status/:userId
// @desc    Check if current user is following a specific user
// @access  Private
router.get('/follow/status/:userId', verifyFirebaseToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get current user
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found'
      });
    }
    
    // Check if following - compare strings for proper equality check
    const isFollowing = currentUser.following.some(id => 
      id.toString() === userId.toString()
    );
    
    res.json({
      success: true,
      isFollowing
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/users/follow/batch-status
// @desc    Check if current user is following multiple users
// @access  Private
router.post('/follow/batch-status', verifyFirebaseToken, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    // Always return a successful response with empty followStatus if no valid input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.log('Missing or empty userIds array');
      return res.json({
        success: true,
        followStatus: {}
      });
    }
    
    // Validate each userId is a valid MongoDB ObjectId
    const validUserIds = userIds.filter(userId => {
      if (!userId || typeof userId !== 'string') return false;
      return mongoose.Types.ObjectId.isValid(userId);
    });
    
    // Always return a successful response even with no valid IDs
    if (validUserIds.length === 0) {
      console.log('No valid MongoDB ObjectIds found in batch-status request');
      return res.json({
        success: true,
        followStatus: {}
      });
    }
    
    // Get current user
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!currentUser) {
      // Even if current user is not found, don't return an error
      console.log('Current user not found for batch-status');
      return res.json({
        success: true,
        followStatus: {}
      });
    }
    
    // Create a map of userId -> isFollowing status (only for valid IDs)
    const followStatus = {};
    validUserIds.forEach(userId => {
      // Compare strings for proper equality check
      followStatus[userId] = currentUser.following.some(id => 
        id.toString() === userId.toString()
      );
    });
    
    res.json({
      success: true,
      followStatus
    });
  } catch (error) {
    // Instead of returning an error, log it and return empty success response
    console.error('Error checking batch follow status:', error);
    res.json({
      success: true,
      followStatus: {}
    });
  }
});

// @route   GET /api/users/:userId/followers
// @desc    Get list of users who follow the specified user
// @access  Private
router.get('/:userId/followers', verifyFirebaseToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Find the user
    const user = await User.findById(userId)
      .populate('followers', '_id name username profileImage');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Enhance followers data with isWriter field
    const followersWithWriterStatus = await Promise.all(
      user.followers.map(async (follower) => {
        // A user is considered a writer if they have at least one article
        const articleCount = await Article.countDocuments({ author: follower._id });
        return {
          ...follower.toObject(),
          isWriter: articleCount > 0
        };
      })
    );
    
    res.json({
      success: true,
      followers: followersWithWriterStatus || []
    });
  } catch (error) {
    console.error('Error fetching user followers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/:userId/following
// @desc    Get list of users the specified user is following
// @access  Private
router.get('/:userId/following', verifyFirebaseToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Find the user
    const user = await User.findById(userId)
      .populate('following', '_id name username profileImage');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Enhance following data with isWriter field
    const followingWithWriterStatus = await Promise.all(
      user.following.map(async (followed) => {
        // A user is considered a writer if they have at least one article
        const articleCount = await Article.countDocuments({ author: followed._id });
        return {
          ...followed.toObject(),
          isWriter: articleCount > 0
        };
      })
    );
    
    res.json({
      success: true,
      following: followingWithWriterStatus || []
    });
  } catch (error) {
    console.error('Error fetching user following:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/update-all-banners
// @desc    Update all users to have the default banner image
// @access  Protected with secret key
router.get('/update-all-banners/:secretKey', async (req, res) => {
  try {
    // Simple protection with a secret key
    const providedKey = req.params.secretKey;
    const validKey = 'bnusa-admin-key'; // In production, this should be in env vars
    
    if (providedKey !== validKey) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid key'
      });
    }
    
    // Get default banner image - force refresh from B2 by recreating the URL
    // This ensures we're always using the latest version from cloud storage
    // instead of potentially cached local paths
    
    // First try to get the banner directly from the endpoint to ensure we get the B2 version
    let defaultBannerUrl;
    try {
      // Make a request to our own API endpoint to get the most current default banner URL
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/images/default/banner`);
      const data = await response.json();
      if (data.success && data.imageUrl) {
        defaultBannerUrl = data.imageUrl;
        console.log('Got B2 default banner URL:', defaultBannerUrl);
      } else {
        // Fallback to the utility function
        defaultBannerUrl = getDefaultImageUrl('banner');
        console.log('Falling back to utility function for banner URL:', defaultBannerUrl);
      }
    } catch (fetchErr) {
      console.error('Error fetching default banner URL, falling back to utility function:', fetchErr);
      defaultBannerUrl = getDefaultImageUrl('banner');
    }
    
    console.log('Using default banner URL for update:', defaultBannerUrl);
    
    // Update all users who don't have a banner or have the old default banner
    const result = await User.updateMany(
      { 
        $or: [
          { bannerImage: { $exists: false } },
          { bannerImage: null },
          { bannerImage: '' },
          { bannerImage: '/images/placeholders/profile-banner-primary.jpg' },
          { bannerImage: '/images/placeholders/banner-primary.png' },
          { bannerImage: '/images/deafult-banner.jpg' } // Also update users with the local path
        ]
      },
      { 
        $set: { bannerImage: defaultBannerUrl }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} users with default banner image`);
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} users with default banner image`,
      defaultBanner: defaultBannerUrl
    });
  } catch (error) {
    console.error('Error updating user banner images:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when updating banner images',
      error: error.message
    });
  }
});

// @route   GET /api/users/update-all-profiles
// @desc    Update all users with placeholder profile images to use empty string
// @access  Protected with secret key
router.get('/update-all-profiles/:secretKey', async (req, res) => {
  try {
    // Simple protection with a secret key
    const providedKey = req.params.secretKey;
    const validKey = 'bnusa-admin-key'; // In production, this should be in env vars
    
    if (providedKey !== validKey) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid key'
      });
    }
    
    // Update all users who have placeholder profile images
    const result = await User.updateMany(
      { 
        $or: [
          { profileImage: '/images/placeholders/avatar-default.png' },
          { profileImage: { $regex: /^\/images\/placeholders\/avatar-.*\.png$/ } },
          { profileImage: { $regex: /placeholder\.com/ } }
        ]
      },
      { 
        $set: { profileImage: '' }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} users with empty profile image`);
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} users to use empty profile image (blue background with initials will be shown)`
    });
  } catch (error) {
    console.error('Error updating user profile images:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when updating profile images',
      error: error.message
    });
  }
});

// @route   GET /api/users/byUsername/:username
// @desc    Get user profile by username
// @access  Public
router.get('/byUsername/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find user by username
    const user = await User.findOne({ username })
      .populate({
        path: 'articles',
        match: { status: 'published' }, // Only include published articles
        select: 'title description slug categories createdAt coverImage'
      })
      .populate('followers', '_id name username profileImage')
      .populate('following', '_id name username profileImage');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Count published articles
    const articlesCount = user.articles ? user.articles.length : 0;
    
    // Fetch the user's image data
    const userImageData = await getUserImageData(user._id);
    
    // Return the user profile
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage,
        socialMedia: user.socialMedia,
        followers: user.followers || [],
        following: user.following || [],
        joinDate: user.joinDate,
        articles: user.articles || [],
        isWriter: user.isWriter || false,
        userImage: userImageData
      }
    });
  } catch (error) {
    console.error('Error fetching user profile by username:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/users/remove-follower/:userId
// @desc    Remove a user from your followers
// @access  Private
router.post('/remove-follower/:userId', verifyFirebaseToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get current user
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found'
      });
    }
    
    // Check if target user exists
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }
    
    // Check if user is a follower - compare strings for proper equality check
    const isFollower = currentUser.followers.some(id => 
      id.toString() === userId.toString()
    );
    
    if (!isFollower) {
      return res.status(400).json({
        success: false,
        message: 'This user is not following you'
      });
    }
    
    // Remove from followers list for current user
    currentUser.followers = currentUser.followers.filter(id => id.toString() !== userId.toString());
    await currentUser.save();
    
    // Remove from following list for target user
    targetUser.following = targetUser.following.filter(id => id.toString() !== currentUser._id.toString());
    await targetUser.save();
    
    res.json({
      success: true,
      message: `Removed ${targetUser.name} from your followers`,
      following: currentUser.following.length,
      followers: currentUser.followers.length
    });
  } catch (error) {
    console.error('Error removing follower:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users
// @desc    Get all users with pagination and filtering options
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const isWriter = req.query.isWriter === 'true';
    const isSupervisor = req.query.isSupervisor === 'true';
    const isDesigner = req.query.isDesigner === 'true';
    const staffOnly = req.query.staffOnly === 'true';
    const skip = (page - 1) * limit;
    
    // Build query filters
    const filter = {};
    
    if (search) {
      // Use text search if available, otherwise fall back to regex
      if (search.trim() !== '') {
        filter.$text = { $search: search.trim() };
      } else {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
    }
    
    // Handle role-specific filters
    if (isWriter) {
      filter.isWriter = true;
    }
    
    if (isSupervisor) {
      filter.isSupervisor = true;
    }
    
    if (isDesigner) {
      filter.isDesigner = true;
    }
    
    // If staffOnly is true, include all staff types (writers, supervisors, designers)
    if (staffOnly) {
      filter.$or = [
        { isWriter: true },
        { isSupervisor: true },
        { isDesigner: true }
      ];
    }
    
    // Get users with pagination
    const users = await User.find(filter)
      .select('_id name username email profileImage bio isWriter isSupervisor isDesigner supervisorText designsCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    // For each user, fetch their published articles count and followers count
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const articles = await Article.find({ 
          author: user._id,
          status: 'published'
        })
        .select('_id title slug description categories coverImage createdAt')
        .lean();
        
        const followers = await User.countDocuments({
          following: user._id
        });
        
        return {
          ...user,
          articles,
          followers: user.followers || [],
          followersCount: followers
        };
      })
    );
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      users: usersWithDetails,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/profile-image-update
// @desc    Update only the profile image field
// @access  Private
router.put('/profile-image-update', verifyFirebaseToken, async (req, res) => {
  try {
    const { profileImage } = req.body;
    
    if (!profileImage) {
      return res.status(400).json({
        success: false,
        message: 'Profile image URL is required'
      });
    }
    
    // Get user from MongoDB
    let user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Store old image URL for deletion if needed
    const oldImageUrl = user.profileImage;
    
    // Update profile image
    user.profileImage = profileImage;
    await user.save();
    
    // Sync with UserImage model
    await syncUserImages(user._id, profileImage, undefined);
    
    // Fetch the user's image data
    const userImageData = await getUserImageData(user._id);
    
    res.json({
      success: true,
      message: 'Profile image updated successfully',
      profileImage,
      userImage: userImageData
    });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/banner-image-update
// @desc    Update only the banner image field
// @access  Private
router.put('/banner-image-update', verifyFirebaseToken, async (req, res) => {
  try {
    const { bannerImage } = req.body;
    
    if (!bannerImage) {
      return res.status(400).json({
        success: false,
        message: 'Banner image URL is required'
      });
    }
    
    // Get user from MongoDB
    let user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Store old image URL for deletion if needed
    const oldImageUrl = user.bannerImage;
    
    // Update banner image
    user.bannerImage = bannerImage;
    await user.save();
    
    // Sync with UserImage model
    await syncUserImages(user._id, undefined, bannerImage);
    
    res.json({
      success: true,
      message: 'Banner image updated successfully',
      bannerImage
    });
  } catch (error) {
    console.error('Error updating banner image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/users/profile
// @desc    Update or create user profile with profile and banner images
// @access  Private (requires Firebase token)
router.post('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { name, profileImage, bannerImage } = req.body;
    const userId = req.user.uid;
    
    // Find the user first
    let user = await User.findOne({ firebaseUid: userId });
    
    if (!user) {
      // Create a new user if not found
      user = new User({
        firebaseUid: userId,
        email: req.user.email || '',
        name: name || req.user.name || '',
        username: req.user.email ? req.user.email.split('@')[0] : crypto.randomBytes(8).toString('hex'),
        profileImage: profileImage || '',
        bannerImage: bannerImage || ''
      });
    } else {
      // Update existing user
      if (name) user.name = name;
      if (profileImage) user.profileImage = profileImage;
      if (bannerImage) user.bannerImage = bannerImage;
    }
    
    await user.save();
    
    // Sync with UserImage collection for redundancy and faster access
    const imageResult = await syncUserImages(
      user._id.toString(),
      profileImage,
      bannerImage
    );
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
});

module.exports = router; 
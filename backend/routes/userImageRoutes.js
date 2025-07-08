const express = require('express');
const router = express.Router();
const UserImage = require('../models/UserImage');
const { checkAuthentication } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Get user images by userId
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!mongoose.isValidObjectId(userId)) {
      console.log(`[UserImage API] Invalid user ID format: ${userId}`);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const userImage = await UserImage.findOne({ userId });
    
    if (!userImage) {
      console.log(`[UserImage API] User images not found for userId: ${userId}`);
      return res.status(404).json({ message: 'User images not found' });
    }
    
    console.log(`[UserImage API] Successfully retrieved userImage for userId: ${userId}`);
    res.status(200).json({
      success: true,
      userImage
    });
  } catch (error) {
    console.error('[UserImage API] Error fetching user images:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user images (requires authentication)
router.put('/', checkAuthentication, async (req, res) => {
  try {
    const { profileImage, bannerImage } = req.body;
    const userId = req.user.id;
    
    console.log(`[UserImage API] Updating user images for userId: ${userId}`, {
      profileImageUpdate: profileImage ? 'provided' : 'not provided',
      bannerImageUpdate: bannerImage ? 'provided' : 'not provided'
    });
    
    if (!mongoose.isValidObjectId(userId)) {
      console.error(`[UserImage API] Invalid MongoDB ObjectId: ${userId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Find the existing user image document or create a new one
    let userImage = await UserImage.findOne({ userId });
    let wasCreated = false;
    
    if (userImage) {
      console.log(`[UserImage API] Found existing UserImage document for userId: ${userId}`);
      // Update existing document
      if (profileImage !== undefined) {
        console.log(`[UserImage API] Updating profileImage from '${userImage.profileImage}' to '${profileImage}'`);
        userImage.profileImage = profileImage;
      }
      
      if (bannerImage !== undefined) {
        console.log(`[UserImage API] Updating bannerImage from '${userImage.bannerImage}' to '${bannerImage}'`);
        userImage.bannerImage = bannerImage;
      }
      
      userImage.lastUpdated = Date.now();
      
      await userImage.save();
      console.log(`[UserImage API] Successfully updated UserImage document for userId: ${userId}`);
    } else {
      // Create new document
      console.log(`[UserImage API] No existing UserImage document found, creating new one for userId: ${userId}`);
      userImage = new UserImage({
        userId,
        profileImage: profileImage || '',
        bannerImage: bannerImage || '/images/deafult-banner.jpg',
      });
      
      await userImage.save();
      wasCreated = true;
      console.log(`[UserImage API] Successfully created new UserImage document for userId: ${userId}`);
    }
    
    // Verify the update actually happened by fetching it again from the database
    const verifiedUserImage = await UserImage.findOne({ userId });
    
    if (profileImage && verifiedUserImage.profileImage !== profileImage) {
      console.error(`[UserImage API] Profile image verification failed! Expected: '${profileImage}', Found: '${verifiedUserImage.profileImage}'`);
    }
    
    if (bannerImage && verifiedUserImage.bannerImage !== bannerImage) {
      console.error(`[UserImage API] Banner image verification failed! Expected: '${bannerImage}', Found: '${verifiedUserImage.bannerImage}'`);
    }
    
    res.status(200).json({
      success: true,
      message: wasCreated ? 'UserImage document created' : 'UserImage document updated',
      userImage: verifiedUserImage
    });
  } catch (error) {
    console.error('[UserImage API] Error updating user images:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router; 
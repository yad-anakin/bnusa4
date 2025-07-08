const mongoose = require('mongoose');

const userImageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  bannerImage: {
    type: String,
    default: '/images/deafult-banner.jpg'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add a text index for better search performance
userImageSchema.index({ userId: 1 });

// Add a method to get image data
userImageSchema.methods.getImageData = function() {
  return {
    profileImage: this.profileImage,
    bannerImage: this.bannerImage
  };
};

// Add static method to sync with User model data
userImageSchema.statics.syncWithUser = async function(userId, profileImage, bannerImage) {
  try {
    const updates = {};
    let hasChanges = false;
    
    if (profileImage) {
      updates.profileImage = profileImage;
      hasChanges = true;
    }
    
    if (bannerImage) {
      updates.bannerImage = bannerImage;
      hasChanges = true;
    }
    
    if (!hasChanges) {
      return { synced: false, message: 'No changes needed' };
    }
    
    // Update the document with new data or create if doesn't exist
    const result = await this.findOneAndUpdate(
      { userId }, 
      { 
        ...updates,
        lastUpdated: Date.now()
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    return { 
      synced: true, 
      message: 'Sync successful',
      data: result
    };
  } catch (error) {
    console.error('Error syncing UserImage with User data:', error);
    return { 
      synced: false, 
      message: `Sync failed: ${error.message}` 
    };
  }
};

const UserImage = mongoose.model('UserImage', userImageSchema, 'userimages');

module.exports = UserImage; 
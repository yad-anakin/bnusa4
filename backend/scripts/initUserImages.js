#!/usr/bin/env node

/**
 * This script initializes the UserImage collection by creating entries for all existing users
 * It copies the profileImage and bannerImage from the User model to the UserImage model
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const UserImage = require('../models/UserImage');

// Load environment variables
dotenv.config();

async function initUserImages() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Get all users with their image fields
    const users = await User.find({}).select('_id profileImage bannerImage');
    console.log(`Found ${users.length} users to process`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Process each user
    for (const user of users) {
      // Check if user already has an entry in UserImage
      const existingUserImage = await UserImage.findOne({ userId: user._id });
      
      if (existingUserImage) {
        // Update existing entry if images are different
        let hasChanges = false;
        
        if (user.profileImage && existingUserImage.profileImage !== user.profileImage) {
          existingUserImage.profileImage = user.profileImage;
          hasChanges = true;
        }
        
        if (user.bannerImage && existingUserImage.bannerImage !== user.bannerImage) {
          existingUserImage.bannerImage = user.bannerImage;
          hasChanges = true;
        }
        
        if (hasChanges) {
          existingUserImage.lastUpdated = Date.now();
          await existingUserImage.save();
          updated++;
          console.log(`Updated UserImage for user ${user._id}`);
        } else {
          skipped++;
        }
      } else {
        // Create new entry
        const newUserImage = new UserImage({
          userId: user._id,
          profileImage: user.profileImage || '',
          bannerImage: user.bannerImage || '/images/deafult-banner.jpg',
        });
        
        await newUserImage.save();
        created++;
        console.log(`Created UserImage for user ${user._id}`);
      }
    }

    console.log(`Process complete: ${created} created, ${updated} updated, ${skipped} skipped`);
  } catch (error) {
    console.error('Error initializing user images:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the initialization
initUserImages(); 
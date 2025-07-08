#!/usr/bin/env node

/**
 * This script synchronizes user images between the User and UserImage collections.
 * It ensures that every user has a corresponding UserImage document with matching image URLs.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Import models from their files
const User = require('../models/User');
const UserImage = require('../models/UserImage');

async function syncUserImages() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Get all users with their image fields
    const users = await User.find({}).select('_id profileImage bannerImage');
    console.log(`Found ${users.length} users to process`);

    // Create a log file
    const logFile = path.join(__dirname, 'user_image_sync.log');
    fs.writeFileSync(logFile, `User Image Sync Log - ${new Date().toISOString()}\n\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each user
    for (const user of users) {
      try {
        // Find or create UserImage document
        let userImage = await UserImage.findOne({ userId: user._id });
        let action = '';
        
        if (userImage) {
          // Check if we need to update
          let hasChanges = false;
          let changes = [];
          
          if (user.profileImage && userImage.profileImage !== user.profileImage) {
            const oldValue = userImage.profileImage;
            userImage.profileImage = user.profileImage;
            hasChanges = true;
            changes.push(`profileImage: "${oldValue}" -> "${user.profileImage}"`);
          }
          
          if (user.bannerImage && userImage.bannerImage !== user.bannerImage) {
            const oldValue = userImage.bannerImage;
            userImage.bannerImage = user.bannerImage;
            hasChanges = true;
            changes.push(`bannerImage: "${oldValue}" -> "${user.bannerImage}"`);
          }
          
          if (hasChanges) {
            userImage.lastUpdated = Date.now();
            await userImage.save();
            updated++;
            action = `Updated: ${changes.join(', ')}`;
            console.log(`Updated UserImage for user ${user._id}`);
          } else {
            skipped++;
            action = 'Skipped: no changes needed';
            console.log(`No changes needed for user ${user._id}`);
          }
        } else {
          // Create new entry
          userImage = new UserImage({
            userId: user._id,
            profileImage: user.profileImage || '',
            bannerImage: user.bannerImage || '/images/deafult-banner.jpg',
          });
          
          await userImage.save();
          created++;
          action = `Created: profileImage="${user.profileImage}", bannerImage="${user.bannerImage}"`;
          console.log(`Created UserImage for user ${user._id}`);
        }
        
        // Log the action
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] User ${user._id}: ${action}\n`);
      } catch (error) {
        errors++;
        console.error(`Error processing user ${user._id}:`, error);
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] User ${user._id}: ERROR - ${error.message}\n`);
      }
    }

    console.log(`Process complete: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`);
    fs.appendFileSync(logFile, `\nSummary: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors\n`);
    
    console.log(`Log written to ${logFile}`);
  } catch (error) {
    console.error('Error synchronizing user images:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the synchronization
syncUserImages(); 
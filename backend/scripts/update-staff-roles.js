/**
 * Script to update user roles for staff page
 * Adds isSupervisor and isDesigner fields to selected users
 * 
 * Run with: node scripts/update-staff-roles.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function updateStaffRoles() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bunsa';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');

    // Get all users
    const users = await User.find().lean();
    console.log(`Found ${users.length} users`);

    // Select some users to be supervisors (e.g., every 5th user)
    const supervisorUpdates = [];
    for (let i = 0; i < users.length; i += 5) {
      if (i < users.length) {
        supervisorUpdates.push({
          userId: users[i]._id,
          name: users[i].name,
          username: users[i].username
        });
      }
    }

    console.log(`Selected ${supervisorUpdates.length} users to be supervisors`);
    
    // Update each selected user to be a supervisor
    for (const update of supervisorUpdates) {
      await User.findByIdAndUpdate(
        update.userId,
        { 
          isSupervisor: true,
          supervisorText: `سەرپەرشتیاری بەشی ${Math.random() > 0.5 ? 'وتار' : 'چیرۆک'}`
        }
      );
      console.log(`Updated ${update.name} (${update.username}) to be a supervisor`);
    }

    // Select some different users to be designers (e.g., every 7th user)
    const designerUpdates = [];
    for (let i = 2; i < users.length; i += 7) {
      if (i < users.length) {
        designerUpdates.push({
          userId: users[i]._id,
          name: users[i].name,
          username: users[i].username
        });
      }
    }

    console.log(`Selected ${designerUpdates.length} users to be designers`);
    
    // Update each selected user to be a designer
    for (const update of designerUpdates) {
      await User.findByIdAndUpdate(
        update.userId,
        { 
          isDesigner: true,
          designsCount: Math.floor(Math.random() * 20) + 5 // Random number between 5 and 24
        }
      );
      console.log(`Updated ${update.name} (${update.username}) to be a designer`);
    }

    console.log('\nStaff role updates completed successfully');
    
    // Print summary of staff counts
    const writerCount = await User.countDocuments({ isWriter: true });
    const supervisorCount = await User.countDocuments({ isSupervisor: true });
    const designerCount = await User.countDocuments({ isDesigner: true });
    
    console.log('\nStaff counts:');
    console.log(`- Writers: ${writerCount}`);
    console.log(`- Supervisors: ${supervisorCount}`);
    console.log(`- Designers: ${designerCount}`);
    
  } catch (error) {
    console.error('Error updating staff roles:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the function
updateStaffRoles(); 
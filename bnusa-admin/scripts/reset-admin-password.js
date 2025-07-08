// Reset admin password script for BNUSA Admin Dashboard
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';

// New admin credentials
const adminEmail = 'admin@bnusa.net'; // Based on logs
const adminUsername = 'admin'; // Based on logs
const newPassword = 'Admin@123'; // New password

async function resetAdminPassword() {
  let client;

  try {
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Find admin user by email or username
    const adminUser = await usersCollection.findOne({
      $or: [
        { email: adminEmail },
        { username: adminUsername }
      ]
    });
    
    if (!adminUser) {
      console.error('Admin user not found. Make sure the email or username is correct.');
      return;
    }
    
    console.log(`Found admin user: ${adminUser.username} (${adminUser.email})`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the admin password
    const result = await usersCollection.updateOne(
      { _id: adminUser._id },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount === 1) {
      console.log(`Successfully reset password for admin user: ${adminUser.username}`);
      console.log(`New password: ${newPassword}`);
    } else {
      console.log('No changes were made to the admin user.');
    }
    
  } catch (error) {
    console.error('Failed to reset admin password:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the script
resetAdminPassword().catch(console.error); 
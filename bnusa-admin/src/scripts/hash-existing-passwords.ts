import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';
const SALT_ROUNDS = 12;

/**
 * Script to securely hash all plain text passwords in the database
 * Run this once to upgrade security for existing users
 */
async function hashExistingPasswords() {
  let client: MongoClient | null = null;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Find all users with potential unhashed passwords
    // Bcrypt hashed passwords start with $2a$, $2b$ or $2y$
    const users = await usersCollection.find({
      password: { $not: /^\$2[aby]\$\d+\$/ }
    }).toArray();
    
    console.log(`Found ${users.length} users with potentially unhashed passwords`);
    
    // Create backup file
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.resolve(process.cwd(), `password-backup-${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(users, null, 2));
    console.log(`Backup created at ${backupPath}`);
    
    // Update each user with hashed password
    let updated = 0;
    for (const user of users) {
      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      
      // Update user with hashed password
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );
      
      updated++;
      console.log(`Updated user ${user._id} (${updated}/${users.length})`);
    }
    
    console.log(`Successfully updated ${updated} users with hashed passwords`);
    
  } catch (error) {
    console.error('Error hashing passwords:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the script
hashExistingPasswords(); 
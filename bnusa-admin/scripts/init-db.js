// MongoDB initialization script for BNUSA Admin Dashboard
// Creates necessary collections and initial admin user

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';

// Admin user credentials
const ADMIN_USER = {
  username: 'admin',
  email: 'admin@bnusa.com',
  password: 'Admin@123', // This will be hashed before storing
  name: 'Admin User',
  role: 'admin',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

async function initializeDatabase() {
  let client;

  try {
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    const db = client.db(DB_NAME);
    
    // Create collections if they don't exist
    console.log('Creating necessary collections...');
    await createCollectionsIfNotExist(db);
    
    // Create admin user if it doesn't exist
    console.log('Checking for admin user...');
    await createAdminUser(db);
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

async function createCollectionsIfNotExist(db) {
  // List of collections to create
  const collections = [
    'users',
    'articles',
    'categories',
    'settings',
    'logs'
  ];
  
  const existingCollections = await db.listCollections().toArray();
  const existingCollectionNames = existingCollections.map(c => c.name);
  
  for (const collectionName of collections) {
    if (!existingCollectionNames.includes(collectionName)) {
      await db.createCollection(collectionName);
      console.log(`Created collection: ${collectionName}`);
    } else {
      console.log(`Collection already exists: ${collectionName}`);
    }
  }
}

async function createAdminUser(db) {
  const usersCollection = db.collection('users');
  
  // Check if admin user already exists
  const existingAdmin = await usersCollection.findOne({ 
    $or: [
      { username: ADMIN_USER.username },
      { email: ADMIN_USER.email }
    ]
  });
  
  if (existingAdmin) {
    console.log(`Admin user already exists: ${existingAdmin.username} (${existingAdmin.email})`);
    return;
  }
  
  // Hash the password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(ADMIN_USER.password, salt);
  
  // Create admin user document
  const adminDoc = {
    ...ADMIN_USER,
    password: hashedPassword
  };
  
  await usersCollection.insertOne(adminDoc);
  console.log(`Created admin user: ${ADMIN_USER.username} (${ADMIN_USER.email})`);
  console.log(`Default password: ${ADMIN_USER.password} (please change on first login)`);
}

// Run the script
initializeDatabase().catch(console.error); 
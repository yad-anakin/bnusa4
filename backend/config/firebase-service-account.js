/**
 * Firebase Admin SDK configuration file
 * 
 * This file loads Firebase service account credentials from environment variables.
 * In a production environment, you should use a service account key file.
 * 
 * To set up:
 * 1. Go to Firebase Console > Project Settings > Service Accounts
 * 2. Click "Generate new private key"
 * 3. Save the JSON file securely
 * 4. Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the path of the JSON file,
 *    or copy the values into your .env file as shown below
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Don't initialize multiple times
if (!admin.apps.length) {
  try {
    console.log('Initializing Firebase Admin SDK...');
    // For local development, use environment variables
    if (process.env.FIREBASE_SERVICE_ACCOUNT_TYPE) {
      admin.initializeApp({
        credential: admin.credential.cert({
          type: process.env.FIREBASE_SERVICE_ACCOUNT_TYPE,
          project_id: process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_ID,
          auth_uri: process.env.FIREBASE_SERVICE_ACCOUNT_AUTH_URI,
          token_uri: process.env.FIREBASE_SERVICE_ACCOUNT_TOKEN_URI,
          auth_provider_x509_cert_url: process.env.FIREBASE_SERVICE_ACCOUNT_AUTH_PROVIDER_CERT_URL,
          client_x509_cert_url: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_CERT_URL
        })
      });
      console.log('Firebase Admin SDK initialized successfully with service account');
    } 
    // For production, use application default credentials
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log('Firebase Admin SDK initialized successfully with application default credentials');
    }
    // If neither is available, use a placeholder for development
    else {
      console.warn('No Firebase service account credentials found. Using a placeholder for development.');
      admin.initializeApp({
        // This will fail in production but allows development to continue
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder-project',
          clientEmail: 'placeholder@example.com',
          privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj\nMzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu\nNMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ\n-----END PRIVATE KEY-----\n',
        }),
      });
      
      console.warn('Add proper Firebase service account credentials to enable full functionality.');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

// Export the admin instance, not a new variable
module.exports = admin; 
// check-env.js - A utility to verify API key configuration
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

console.log('=== API Key Configuration Check ===');
console.log('This script checks if your API keys are properly configured.');

// API key used in validation
const validPrivateKey = process.env.API_KEY;
const validPublicKey = process.env.PUBLIC_API_KEY;

// Expected frontend key
const expectedFrontendKey = 'bnusa_pk_live_51NxK2pL9vM4qR8tY3wJ7hF5cD2mN6bX4vZ9yA1sE8uW0';

console.log('\nBackend API Keys:');
console.log('Private API Key defined:', validPrivateKey ? 'Yes' : 'No');
console.log('Public API Key defined:', validPublicKey ? 'Yes' : 'No');

console.log('\nFrontend API Key:');
console.log('Expected frontend key:', expectedFrontendKey);

// Check if keys match
const privateKeyMatches = validPrivateKey === expectedFrontendKey;
const publicKeyMatches = validPublicKey === expectedFrontendKey;

console.log('\nKey Matching:');
console.log('Frontend key matches backend private key:', privateKeyMatches ? 'Yes' : 'No');
console.log('Frontend key matches backend public key:', publicKeyMatches ? 'Yes' : 'No');

if (!privateKeyMatches && !publicKeyMatches) {
  console.log('\n⚠️ ERROR: The frontend API key does not match any backend keys!');
  console.log('To fix this, you need to either:');
  console.log('1. Set PUBLIC_API_KEY in your backend .env file to match the frontend key:');
  console.log(`   PUBLIC_API_KEY=${expectedFrontendKey}`);
  console.log('2. Or, update the frontend key to match your backend API_KEY');
} else {
  console.log('\n✅ API key configuration looks good!');
}

console.log('\nNote: If you\'re seeing signature errors, ensure both frontend and backend use');
console.log('the same signature generation algorithm.'); 
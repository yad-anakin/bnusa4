// simple-verify.js - A simpler test for signature generation
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Use the public API key - this should match what the frontend is using
const apiKey = process.env.PUBLIC_API_KEY;
console.log('API Key used:', apiKey);

// Test case using the values from the failed request
const method = 'GET';
const path = '/api/articles';
const body = '';
const timestamp = '1744382607457';

console.log('\nInput values:');
console.log('Method:', method);
console.log('Path:', path);
console.log('Body:', body);
console.log('Timestamp:', timestamp);

// Generate signature with the backend algorithm
const signatureString = `${method}${path}${JSON.stringify(body || '')}${timestamp}${apiKey}`;
console.log('\nSignature string:', signatureString);

const signature = crypto
  .createHash('sha256')
  .update(signatureString)
  .digest('hex');

console.log('\nGenerated signature:', signature);
console.log('Received signature: 0f963b50d4fd4eda223f4c17e0cbeb9298d344d69323b14a7beb94f2d9e5b4e5');

// Check if they match
const matches = signature === '0f963b50d4fd4eda223f4c17e0cbeb9298d344d69323b14a7beb94f2d9e5b4e5';
console.log('\nSignatures match:', matches ? '✅ YES' : '❌ NO');

// Try another approach with just the body string
const alternativeSignatureString = `${method}${path}${body}${timestamp}${apiKey}`;
console.log('\nAlternative signature string:', alternativeSignatureString);

const alternativeSignature = crypto
  .createHash('sha256')
  .update(alternativeSignatureString)
  .digest('hex');

console.log('\nAlternative signature:', alternativeSignature);
console.log('Received signature: 0f963b50d4fd4eda223f4c17e0cbeb9298d344d69323b14a7beb94f2d9e5b4e5');

// Check if they match
const alternativeMatches = alternativeSignature === '0f963b50d4fd4eda223f4c17e0cbeb9298d344d69323b14a7beb94f2d9e5b4e5';
console.log('\nAlternative signatures match:', alternativeMatches ? '✅ YES' : '❌ NO'); 
// verify-signature.js - Test if frontend and backend signatures match
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// API keys
const apiKey = process.env.PUBLIC_API_KEY;

// Test data
const testCases = [
  {
    method: 'GET',
    path: '/api/articles',
    body: '',
    timestamp: '1744382607457'
  },
  {
    method: 'GET',
    path: '/api/content-types',
    body: '',
    timestamp: '1744382607454'
  }
];

console.log('=== Signature Verification Tests ===');
console.log('Testing if signatures match between frontend and backend algorithms\n');

console.log('API Key used:', apiKey);
console.log('---------------------------------------\n');

// Backend algorithm - Signature Generation
function generateBackendSignature(method, path, body, timestamp, key) {
  // Body handling in backend
  let processedBody = JSON.stringify(body || '');
  
  const signatureString = `${method}${path}${processedBody}${timestamp}${key}`;
  console.log('Backend signature string:', signatureString);
  return crypto.createHash('sha256').update(signatureString).digest('hex');
}

// Frontend algorithm - Signature Generation (simplified version)
function generateFrontendSignature(method, path, body, timestamp, key) {
  // Body handling in frontend
  let bodyString = '';
  if (body) {
    if (typeof body === 'string') {
      try {
        // If it's a valid JSON string, use it as is
        JSON.parse(body);
        bodyString = body;
      } catch (e) {
        // If it's not valid JSON, stringify it
        bodyString = JSON.stringify(body);
      }
    } else {
      // Object/array gets stringified
      bodyString = JSON.stringify(body);
    }
  } else {
    // No body case
    bodyString = JSON.stringify('');
  }
  
  const signatureString = `${method}${path}${bodyString}${timestamp}${key}`;
  console.log('Frontend signature string:', signatureString);
  return crypto.createHash('sha256').update(signatureString).digest('hex');
}

// Run tests
testCases.forEach((testCase, index) => {
  console.log(`\nTest Case ${index + 1}:`);
  console.log(`Method: ${testCase.method}`);
  console.log(`Path: ${testCase.path}`);
  console.log(`Body: ${JSON.stringify(testCase.body)}`);
  console.log(`Timestamp: ${testCase.timestamp}`);
  
  const backendSignature = generateBackendSignature(
    testCase.method,
    testCase.path,
    testCase.body,
    testCase.timestamp,
    apiKey
  );
  
  const frontendSignature = generateFrontendSignature(
    testCase.method,
    testCase.path,
    testCase.body,
    testCase.timestamp,
    apiKey
  );
  
  console.log(`\nBackend Signature: ${backendSignature}`);
  console.log(`Frontend Signature: ${frontendSignature}`);
  
  const signaturesMatch = backendSignature === frontendSignature;
  console.log(`\nSignatures Match: ${signaturesMatch ? '✅ YES' : '❌ NO'}`);
  
  if (!signaturesMatch) {
    console.log('\nPOSSIBLE CAUSES OF MISMATCH:');
    console.log('1. Different handling of empty/null body');
    console.log('2. Double stringification in one implementation');
    console.log('3. Path handling differences (leading slash, etc.)');
    console.log('4. Different API key being used');
  }
  
  console.log('\n---------------------------------------');
});

// Troubleshooting guide
console.log('\nTROUBLESHOOTING GUIDE:');
console.log('1. Make sure both frontend and backend use EXACTLY the same API key');
console.log('2. Ensure body is stringified exactly once in both implementations');
console.log('3. Path formatting must be identical (same handling of slashes)');
console.log('4. Check timestamp handling (should be string in both places)');
console.log('5. Verify that query parameters are stripped properly');

console.log('\n=== End of Signature Verification ==='); 
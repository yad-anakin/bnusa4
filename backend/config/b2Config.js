const { S3Client } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require('@aws-sdk/node-http-handler');
const dotenv = require('dotenv');
dotenv.config();

// Backblaze B2 configuration
const b2Config = {
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION || 'us-west-002',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APP_KEY
  },
  // Needed for Backblaze B2
  forcePathStyle: true,
  // Custom user agent to help with support requests
  customUserAgent: 'Bnusa/1.0 B2Integration',
  // Use a more compatible HTTP implementation
  requestHandler: new NodeHttpHandler({
    requestTimeout: 30000 // 30 seconds timeout
  })
};

// Create S3 client with NO checksum middleware
const s3Client = new S3Client(b2Config);

// Remove the checksum middleware from the client's middleware stack
// This is done by adding custom logic to the client's build process
const originalSend = s3Client.send;
s3Client.send = async function(command, options) {
  // Disable checksums at the command level
  command.middlewareStack.remove('ChecksumAlgorithms');
  command.middlewareStack.remove('ContentMD5');
  command.middlewareStack.remove('ChecksumAlgorithmMiddleware');
  
  return originalSend.call(this, command, options);
};

module.exports = {
  s3Client,
  bucketName: process.env.B2_BUCKET_NAME
}; 
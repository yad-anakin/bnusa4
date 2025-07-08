const crypto = require('crypto');

const requestSigning = (req, res, next) => {
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];
  const apiKey = process.env.API_KEY;

  // Check if timestamp and signature are present
  if (!timestamp || !signature) {
    console.log('Request signing failed: Missing timestamp or signature');
    return res.status(401).json({
      success: false,
      error: 'Missing timestamp or signature'
    });
  }

  // Check if timestamp is within 5 minutes
  const timestampDate = new Date(parseInt(timestamp));
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;
  
  if (Math.abs(now - timestampDate) > fiveMinutes) {
    console.log('Request signing failed: Timestamp expired');
    return res.status(401).json({
      success: false,
      error: 'Request timestamp expired'
    });
  }

  // Create signature string
  const method = req.method;
  const path = req.path;
  const body = JSON.stringify(req.body || '');
  const signatureString = `${method}${path}${body}${timestamp}${apiKey}`;

  // Generate expected signature
  const expectedSignature = crypto
    .createHash('sha256')
    .update(signatureString)
    .digest('hex');

  // Compare signatures
  if (signature !== expectedSignature) {
    console.log('Request signing failed: Invalid signature');
    console.log('Expected:', expectedSignature);
    console.log('Received:', signature);
    return res.status(401).json({
      success: false,
      error: 'Invalid request signature'
    });
  }

  console.log('Request signing successful');
  next();
};

module.exports = requestSigning; 
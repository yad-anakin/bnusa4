const apiKeyAuth = (req, res, next) => {
  // Get API key from headers
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;

  // Log authentication attempt (without exposing the actual keys)
  console.log(`API Key authentication attempt for ${req.method} ${req.path}`);
  console.log(`API Key provided: ${apiKey ? 'Yes' : 'No'}`);

  // Check if API key is missing
  if (!apiKey) {
    console.log('Authentication failed: Missing API key');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing API key',
      message: 'Please provide an API key in the x-api-key header'
    });
  }

  // Check if API key is invalid
  if (apiKey !== validApiKey) {
    console.log('Authentication failed: Invalid API key');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid API key',
      message: 'The provided API key is invalid'
    });
  }

  // Authentication successful
  console.log('API Key authentication successful');
  next();
};

module.exports = apiKeyAuth; 
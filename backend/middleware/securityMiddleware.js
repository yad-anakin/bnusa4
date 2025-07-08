const crypto = require('crypto');
const url = require('url');

// Enhanced in-memory rate limiting with per-endpoint tracking
const rateLimit = {
  // Track requests by IP address
  requests: {},
  // Reset interval in milliseconds (1 hour)
  resetInterval: 60 * 60 * 1000,
  // Maximum requests per hour (increase to 500)
  maxRequests: 500,
  
  // Track rate limits per endpoint to allow more granular control
  endpointLimits: {
    // Define specific endpoints with custom limits
    '/api/users': 100,
    '/api/articles': 100,
    '/api/users/me': 50,
    // Default for any other endpoint
    'default': 50
  },
  
  // Check if an IP is rate limited - DISABLED - always return false
  isRateLimited: function(ip, endpoint) {
    // Completely disable rate limiting by always returning false
    return false;
    
    // Previous implementation kept for reference but not used
    /*
    const now = Date.now();
    
    // Initialize tracking for this IP if it doesn't exist
    if (!this.requests[ip]) {
      this.requests[ip] = {
        count: 0,
        endpoints: {},
        resetAt: now + this.resetInterval
      };
    }
    
    // Reset if the interval has passed
    if (now > this.requests[ip].resetAt) {
      this.requests[ip] = {
        count: 0,
        endpoints: {},
        resetAt: now + this.resetInterval
      };
    }
    
    // Initialize endpoint tracking
    if (!this.requests[ip].endpoints[endpoint]) {
      this.requests[ip].endpoints[endpoint] = 0;
    }
    
    // Increment request count
    this.requests[ip].count++;
    this.requests[ip].endpoints[endpoint]++;
    
    // Get the limit for this endpoint
    const endpointBase = endpoint.split('/').slice(0, 3).join('/');
    const endpointLimit = this.endpointLimits[endpointBase] || this.endpointLimits['default'];
    
    // Check if over global limit or endpoint limit
    const isOverGlobalLimit = this.requests[ip].count > this.maxRequests;
    const isOverEndpointLimit = this.requests[ip].endpoints[endpoint] > endpointLimit;
    
    return isOverGlobalLimit || isOverEndpointLimit;
    */
  },
  
  // Get remaining requests for an IP - now always returns max
  getRemainingRequests: function(ip) {
    return this.maxRequests; // Always return max remaining
  }
};

/**
 * Enhanced security middleware that handles API authentication with more flexibility
 * Supports multiple signature formats to be compatible with different frontend implementations
 */
const securityMiddleware = (req, res, next) => {
  // Get client IP
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Get the full URL path for signature validation 
  const fullPath = req.originalUrl || req.url;
  
  // Strip query parameters for signature check
  const parsedUrl = url.parse(fullPath);
  const pathWithoutQuery = parsedUrl.pathname;
  
  console.log(`[${new Date().toISOString()}] Security check for: ${req.method} ${fullPath}`);

  // Rate limiting check - pass the endpoint
  if (rateLimit.isRateLimited(clientIP, pathWithoutQuery)) {
    console.log(`Rate limit exceeded for IP: ${clientIP} on endpoint: ${pathWithoutQuery}`);
    return res.status(429).json({
      success: false,
      error: "Too many authentication attempts from this IP, please try again after an hour"
    });
  }

  // 1. API Key Check
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;
  const validPublicKey = process.env.PUBLIC_API_KEY;

  // Check if the API key matches either the private or public key
  if (!apiKey || (apiKey !== validApiKey && apiKey !== validPublicKey)) {
    console.log('Authentication failed: Invalid or missing API key');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing API key'
    });
  }

  // 2. Timestamp Check
  const timestamp = req.headers['x-timestamp'];
  if (!timestamp) {
    console.log('Authentication failed: Missing timestamp');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing timestamp'
    });
  }

  // Validate timestamp is within 5 minutes
  const timestampDate = new Date(parseInt(timestamp));
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;

  if (Math.abs(now - timestampDate) > fiveMinutes) {
    console.log('Authentication failed: Timestamp expired');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Request timestamp expired'
    });
  }

  // 3. Signature Check
  const signature = req.headers['x-signature'];
  if (!signature) {
    console.log('Authentication failed: Missing signature');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing signature'
    });
  }

  // Generate expected signature - use the same key that the client used
  const method = req.method;
  const keyToUse = apiKey === validPublicKey ? validPublicKey : validApiKey;
  
  // Create multiple signature formats to handle various frontend implementations
  // This is the key to our flexible solution
  let matchFound = false;
  const signatureFormats = [];
  
  // Format 1: No body at all
  signatureFormats.push({
    name: "No Body",
    string: `${method}${pathWithoutQuery}${timestamp}${keyToUse}`,
    description: "Method + Path + Timestamp + Key"
  });
  
  // Format 2: Empty string literals
  signatureFormats.push({
    name: "Empty String Literals",
    string: `${method}${pathWithoutQuery}""${timestamp}${keyToUse}`,
    description: 'Method + Path + "" + Timestamp + Key'
  });
  
  // Format 3: JSON stringified empty string
  signatureFormats.push({
    name: "Stringified Empty String",
    string: `${method}${pathWithoutQuery}${JSON.stringify("")}${timestamp}${keyToUse}`,
    description: 'Method + Path + JSON.stringify("") + Timestamp + Key'
  });
  
  // Format 4: Empty object literals
  signatureFormats.push({
    name: "Empty Object Literals",
    string: `${method}${pathWithoutQuery}{}${timestamp}${keyToUse}`,
    description: 'Method + Path + {} + Timestamp + Key'
  });
  
  // Format 5: JSON stringified empty object
  signatureFormats.push({
    name: "Stringified Empty Object",
    string: `${method}${pathWithoutQuery}${JSON.stringify({})}${timestamp}${keyToUse}`,
    description: 'Method + Path + JSON.stringify({}) + Timestamp + Key'
  });
  
  // If there's a body, add formats with the actual body
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyStr = JSON.stringify(req.body);
    signatureFormats.push({
      name: "Actual Body",
      string: `${method}${pathWithoutQuery}${bodyStr}${timestamp}${keyToUse}`,
      description: 'Method + Path + JSON.stringify(actualBody) + Timestamp + Key'
    });
  }
  
  // Log signature validation attempts
  console.log('Signature validation details:');
  console.log('Method:', method);
  console.log('Path without query:', pathWithoutQuery);
  console.log('Timestamp:', timestamp);
  console.log('Received signature:', signature);
  
  // Try all signature formats
  let matchedFormat = null;
  for (const format of signatureFormats) {
    const generatedSignature = crypto
      .createHash('sha256')
      .update(format.string)
      .digest('hex');
      
    format.signature = generatedSignature;
    
    if (generatedSignature === signature) {
      matchFound = true;
      matchedFormat = format;
      break;
    }
  }
  
  // For debugging, show all attempted formats
  console.log('\nAttempted signature formats:');
  signatureFormats.forEach(format => {
    console.log(`- ${format.name} (${format.signature === signature ? 'MATCH ✅' : 'no match ❌'}): ${format.description}`);
  });
  
  // If no match found, return error
  if (!matchFound) {
    console.log('\nAuthentication failed: Invalid signature - none of the formats matched');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid signature'
    });
  }
  
  console.log(`\nSignature matched using format: ${matchedFormat.name}`);

  // 4. IP Whitelist Check - Skip in development
  if (process.env.NODE_ENV !== 'development') {
    const whitelistedIPs = process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [];

    if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(clientIP)) {
      console.log('Access denied: IP not whitelisted:', clientIP);
      return res.status(403).json({
        success: false,
        error: 'Access denied: IP not whitelisted'
      });
    }
  }

  // Add rate limit headers
  // Set unlimited rate limits in headers
  res.setHeader('X-RateLimit-Limit', 'unlimited');
  res.setHeader('X-RateLimit-Remaining', 'unlimited');
  res.setHeader('X-RateLimit-Reset', 'n/a');
  
  // Log that rate limiting is disabled
  console.log(`Rate limiting is disabled for ${clientIP} on endpoint: ${pathWithoutQuery}`);

  // All security checks passed
  console.log('Security checks passed for:', fullPath);
  next();
};

module.exports = securityMiddleware; 
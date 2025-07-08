const methodRestrictor = (req, res, next) => {
  console.log(`[methodRestrictor] Request: ${req.method} ${req.originalUrl}`);
  
  // Always allow these paths for POST requests
  const allowedPostPaths = [
    '/api/images/upload',
    '/api/images/profile',
    '/api/images/banner',
    '/api/images/upload-multiple',
    '/api/articles'
  ];
  
  // Check if current request is for an allowed endpoint
  const isAllowedPostRequest = allowedPostPaths.some(path => req.originalUrl.includes(path));
  
  if (isAllowedPostRequest) {
    console.log(`[methodRestrictor] Allowing request: ${req.method} ${req.originalUrl}`);
    return next();
  }
  
  // Only allow GET requests for other public endpoints
  if (req.method !== 'GET') {
    console.log(`[methodRestrictor] Blocking non-GET request: ${req.method} ${req.originalUrl}`);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Only GET requests are permitted for this endpoint.'
    });
  }
  
  console.log(`[methodRestrictor] Allowing GET request: ${req.originalUrl}`);
  next();
};

module.exports = methodRestrictor; 
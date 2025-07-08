const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

// Import models for initialization
const User = require('./models/User');
const UserImage = require('./models/UserImage');

// Import middlewares
const { publicApiLimiter, authLimiter } = require('./middleware/rateLimiter');
const methodRestrictor = require('./middleware/methodRestrictor');
const securityMiddleware = require('./middleware/securityMiddleware');

// Load env vars from local .env
dotenv.config();

// Function to initialize/sync UserImage collection
const initUserImages = async () => {
  try {
    console.log('[Database] Initializing UserImage collection...');
    
    // Get all users with their image fields
    const users = await User.find({}).select('_id profileImage bannerImage');
    console.log(`[Database] Found ${users.length} users to process for UserImage initialization`);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each user
    for (const user of users) {
      try {
        // Check if user already has an entry in UserImage
        const existingUserImage = await UserImage.findOne({ userId: user._id });
        
        if (existingUserImage) {
          // Update existing entry if images are different
          let hasChanges = false;
          
          if (user.profileImage && existingUserImage.profileImage !== user.profileImage) {
            console.log(`[Database] Updating profile image for user ${user._id} from "${existingUserImage.profileImage}" to "${user.profileImage}"`);
            existingUserImage.profileImage = user.profileImage;
            hasChanges = true;
          }
          
          if (user.bannerImage && existingUserImage.bannerImage !== user.bannerImage) {
            console.log(`[Database] Updating banner image for user ${user._id} from "${existingUserImage.bannerImage}" to "${user.bannerImage}"`);
            existingUserImage.bannerImage = user.bannerImage;
            hasChanges = true;
          }
          
          if (hasChanges) {
            existingUserImage.lastUpdated = Date.now();
            await existingUserImage.save();
            updated++;
            console.log(`[Database] Updated UserImage for user ${user._id}`);
          } else {
            skipped++;
            console.log(`[Database] No changes needed for user ${user._id}`);
          }
        } else {
          // Create new entry
          console.log(`[Database] Creating new UserImage entry for user ${user._id} with profileImage: "${user.profileImage}" and bannerImage: "${user.bannerImage}"`);
          const newUserImage = new UserImage({
            userId: user._id,
            profileImage: user.profileImage || '',
            bannerImage: user.bannerImage || '/images/deafult-banner.jpg',
          });
          
          const savedDoc = await newUserImage.save();
          created++;
          console.log(`[Database] Created UserImage for user ${user._id}, saved document: ${JSON.stringify(savedDoc)}`);
        }
      } catch (userError) {
        errors++;
        console.error(`[Database] Error processing user ${user._id}:`, userError);
      }
    }

    console.log(`[Database] UserImage initialization complete: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`);
  } catch (error) {
    console.error('[Database] Error initializing user images:', error);
  }
};

// Determine if we're using local DB
const isLocalDB = process.env.USE_LOCAL_DB === 'true';
console.log(`Connecting to MongoDB ${isLocalDB ? 'locally' : 'Atlas'}...`);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log(`MongoDB ${isLocalDB ? 'local' : 'Atlas'} Connected Successfully`);
    console.log(`Using database: ${mongoose.connection.name}`);
    
    // Set Mongoose options to avoid type issues
    mongoose.set('strictQuery', false);
    
    // Initialize UserImage collection after successful connection
    await initUserImages();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    if (isLocalDB) {
      console.log('\nLocal MongoDB Connection Troubleshooting:');
      console.log('1. Ensure MongoDB is installed and running on localhost:27017');
      console.log('2. Install MongoDB Compass from https://www.mongodb.com/try/download/compass');
      console.log('3. Use MongoDB Compass to create a database named "bunsa"');
    } else {
      console.log('\nMongoDB Atlas Connection Troubleshooting:');
      console.log('1. Confirm your IP is whitelisted in MongoDB Atlas Network Access settings');
      console.log('2. Check if your password contains special characters that need URL encoding');
      console.log('3. Ensure your network allows outbound connections to MongoDB Atlas (port 27017)');
      console.log('4. Try setting USE_LOCAL_DB=true in .env to use a local MongoDB instead');
    }
  });

const app = express();

// Import routes
const testRoutes = require('./routes/testRoute');
const contentTypeRoutes = require('./routes/contentTypeRoutes');
const articles = require('./routes/articles');
const bookRoutes = require('./routes/bookRoutes');
const writers = require('./routes/writers');
const imageRoutes = require('./routes/imageRoutes');
const userRoutes = require('./routes/userRoutes');
const userImageRoutes = require('./routes/userImageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const healthRoute = require('./routes/healthRoute');

// Middleware
// Set up CORS options from environment variable or use defaults
let allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
if (process.env.CORS_ALLOWED_ORIGINS) {
  allowedOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',');
  console.log('Using CORS allowed origins from environment:', allowedOrigins);
}

// IP Whitelist middleware
const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const whitelistedIPs = process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [];
  
  // Allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(clientIP)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: IP not whitelisted'
    });
  }
  
  next();
};

// Debug middleware to log requests
const debugMiddleware = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  // Special debug for article submissions
  if (req.method === 'POST' && req.path === '/api/articles') {
    console.log('=== Article Submission Debug ===');
    console.log('Content-Type:', req.headers['content-type']);
    
    // Log the raw body for article submissions
    if (req.body) {
      console.log('Request body type:', typeof req.body);
      console.log('Request body keys:', Object.keys(req.body));
      
      // Focus on arrays
      if (req.body.youtubeLinks) {
        console.log('youtubeLinks FOUND in request:', JSON.stringify(req.body.youtubeLinks));
        console.log('youtubeLinks type:', typeof req.body.youtubeLinks);
        console.log('youtubeLinks isArray:', Array.isArray(req.body.youtubeLinks));
        console.log('youtubeLinks length:', Array.isArray(req.body.youtubeLinks) ? req.body.youtubeLinks.length : 'N/A');
      } else {
        console.log('youtubeLinks NOT FOUND in request body');
      }
      
      if (req.body.resourceLinks) {
        console.log('resourceLinks FOUND in request:', JSON.stringify(req.body.resourceLinks));
        console.log('resourceLinks type:', typeof req.body.resourceLinks);
        console.log('resourceLinks isArray:', Array.isArray(req.body.resourceLinks));
        console.log('resourceLinks length:', Array.isArray(req.body.resourceLinks) ? req.body.resourceLinks.length : 'N/A');
      } else {
        console.log('resourceLinks NOT FOUND in request body');
      }
    }
    console.log('=== End Article Submission Debug ===');
  }
  
  console.log('Headers:', req.headers);
  next();
};

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-api-key', 
    'x-timestamp', 
    'x-signature',
    'x-has-arrays',
    'x-youtube-links-type',
    'x-youtube-links-length',
    'x-resource-links-type',
    'x-resource-links-length',
    'x-cache-control',
    'Cache-Control',
    'X-Image-Cache'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
// Increase JSON body size limit and ensure proper parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply debug middleware to all routes
app.use(debugMiddleware);

// Health check route - must be before other routes to avoid middleware restrictions
app.use('/api', healthRoute);

// Define public and private API routes
const publicRoutes = [
  { path: '/api/writers', router: writers },
  { path: '/api/content-types', router: contentTypeRoutes },
  { path: '/api/books', router: bookRoutes },
  { path: '/api/test', router: testRoutes }
];

// Routes that need special handling to allow POST requests
const specialRoutes = [
  { path: '/api/images', router: imageRoutes },
  { path: '/api/articles', router: articles }
];

// Private routes
const privateRoutes = [
  { path: '/api/users', router: userRoutes },
  { path: '/api/user-images', router: userImageRoutes },
  { path: '/api/admin', router: adminRoutes }
];

// Apply security middleware to special routes but skip methodRestrictor
specialRoutes.forEach(({ path, router }) => {
  app.use(path,
    securityMiddleware,         // Security checks
    publicApiLimiter,          // Rate limiting
    router                     // Route handler directly
  );
});

// Apply security middleware to all other public routes
publicRoutes.forEach(({ path, router }) => {
  app.use(path, 
    securityMiddleware,           // Security checks
    publicApiLimiter,            // Rate limiting
    methodRestrictor,            // Method restriction
    router                       // Route handler
  );
});

// Apply security middleware to private routes
privateRoutes.forEach(({ path, router }) => {
  app.use(path,
    securityMiddleware,          // Security checks
    authLimiter,                // Stricter rate limiting
    router                      // Route handler
  );
});

// Root endpoint (unprotected)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Bunsa API',
    database: isLocalDB ? 'Local MongoDB' : 'MongoDB Atlas'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

const port = process.env.PORT || 5003;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`API available at http://localhost:${port}/api`);
  console.log(`Health check available at http://localhost:${port}/api/health`);
  console.log('Protected routes:', publicRoutes.map(r => r.path).concat(privateRoutes.map(r => r.path)).join(', '));
}); 
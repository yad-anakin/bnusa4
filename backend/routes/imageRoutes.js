const express = require('express');
const { upload, uploadImage, deleteImage } = require('../utils/imageUpload');
const auth = require('../middleware/auth');
const User = require('../models/User');
const crypto = require('crypto');

const router = express.Router();

/**
 * @route   POST /api/images/upload
 * @desc    Upload a single image to B2
 * @access  Public/Private (can be both, auth is optional)
 */
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    console.log('Received image upload request');
    
    // Check if file exists in the request (multer adds it to req.file)
    if (!req.file) {
      console.log('No file found in request', { body: req.body });
      return res.status(400).json({
        success: false,
        message: 'No image file provided or the image field name should be "image"'
      });
    }
    
    // Since we're using multer, we can access file details directly
    const imageBuffer = req.file.buffer;
    const imageName = req.file.originalname;
    const imageMimeType = req.file.mimetype;
    
    // Get folder from request body (optional)
    const folder = req.body.folder || '';
    console.log(`Uploading to folder: ${folder}, file: ${imageName}, size: ${imageBuffer.length} bytes`);
    
    // Check if the client wants specific cache-control headers
    const cacheControl = req.headers['x-cache-control'] || 'max-age=2592000'; // Default 30 days
    
    // Generate a hash of the file to use for cache validation
    const fileHash = crypto.createHash('md5').update(imageBuffer).digest('hex').substring(0, 10);
    
    // Upload the image
    const imageUrl = await uploadImage(
      imageBuffer,
      imageName,
      imageMimeType,
      folder
    );
    
    console.log('Image uploaded successfully', { imageUrl });
    
    // Set cache headers for the response
    res.set({
      'Cache-Control': cacheControl,
      'ETag': `"${fileHash}"`,
      'Vary': 'Accept-Encoding'
    });
    
    // Return the URL
    res.json({
      success: true,
      imageUrl,
      cacheHash: fileHash
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/images/upload-multiple
 * @desc    Upload multiple images to B2
 * @access  Private (requires authentication)
 */
router.post('/upload-multiple', auth, upload.array('images', 10), async (req, res) => {
  try {
    // Check if files exist in the request
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No images provided' 
      });
    }

    // Optional folder parameter
    const { folder } = req.body;
    
    // Upload each image to B2
    const uploadPromises = req.files.map(file => 
      uploadImage(file.buffer, file.originalname, file.mimetype, folder)
    );
    
    // Wait for all uploads to complete
    const imageUrls = await Promise.all(uploadPromises);

    // Return the URLs
    res.status(200).json({
      success: true,
      imageUrls,
      message: 'Images uploaded successfully'
    });
  } catch (error) {
    console.error('Multiple image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading images'
    });
  }
});

/**
 * @route   DELETE /api/images/delete
 * @desc    Delete an image from B2
 * @access  Private
 */
router.delete('/delete', auth, async (req, res) => {
  try {
    // Get the image URL from request body
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'No image URL provided'
      });
    }
    
    // Delete the image
    const success = await deleteImage(imageUrl);
    
    // Return the result
    res.json({
      success
    });
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/images/profile
 * @desc    Upload a profile image
 * @access  Private
 */
router.post('/profile', auth, upload.single('image'), async (req, res) => {
  try {
    // Check if we have a file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    // Generate a hash of the file for cache validation
    const fileHash = crypto.createHash('md5').update(req.file.buffer).digest('hex').substring(0, 10);
    
    // Upload the image to the profiles folder
    const imageUrl = await uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'profiles'
    );
    
    // Set cache headers for the response
    res.set({
      'Cache-Control': 'max-age=2592000', // 30 days
      'ETag': `"${fileHash}"`,
      'Vary': 'Accept-Encoding'
    });
    
    // Return the URL
    res.json({
      success: true,
      imageUrl,
      cacheHash: fileHash
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile image',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/images/banner
 * @desc    Upload a banner image
 * @access  Private
 */
router.post('/banner', auth, upload.single('image'), async (req, res) => {
  try {
    // Check if we have a file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    // Upload the image to the banners folder
    const imageUrl = await uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'banners'
    );
    
    // Return the URL
    res.json({
      success: true,
      imageUrl
    });
  } catch (error) {
    console.error('Banner image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading banner image',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/images/article
 * @desc    Upload an article cover image
 * @access  Private
 */
router.post('/article', auth, upload.single('image'), async (req, res) => {
  try {
    // Check if we have a file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    // Generate a hash of the file for cache validation
    const fileHash = crypto.createHash('md5').update(req.file.buffer).digest('hex').substring(0, 10);
    
    // Upload the image to the articles folder
    const imageUrl = await uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'articles'
    );
    
    // Set cache headers for the response
    res.set({
      'Cache-Control': 'max-age=2592000', // 30 days
      'ETag': `"${fileHash}"`,
      'Vary': 'Accept-Encoding'
    });
    
    // Return the URL
    res.json({
      success: true,
      imageUrl,
      cacheHash: fileHash
    });
  } catch (error) {
    console.error('Article image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading article image',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/images/content
 * @desc    Upload a content image (for rich text editor)
 * @access  Private
 */
router.post('/content', auth, upload.single('image'), async (req, res) => {
  try {
    // Check if we have a file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    // Generate a hash of the file for cache validation
    const fileHash = crypto.createHash('md5').update(req.file.buffer).digest('hex').substring(0, 10);
    
    // Upload the image to the content folder
    const imageUrl = await uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'content'
    );
    
    // Set cache headers for the response
    res.set({
      'Cache-Control': 'max-age=2592000', // 30 days
      'ETag': `"${fileHash}"`,
      'Vary': 'Accept-Encoding'
    });
    
    // Return the URL with the format expected by TinyMCE
    res.json({
      success: true,
      imageUrl,
      location: imageUrl, // TinyMCE expects this property
      cacheHash: fileHash
    });
  } catch (error) {
    console.error('Content image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading content image',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/images/check-config
 * @desc    Check Backblaze B2 configuration
 * @access  Public
 */
router.get('/check-config', async (req, res) => {
  try {
    console.log('Checking B2 configuration');
    console.log({
      B2_KEY_ID: process.env.B2_KEY_ID?.slice(0, 8) + '...',
      B2_BUCKET_NAME: process.env.B2_BUCKET_NAME,
      B2_REGION: process.env.B2_REGION,
      B2_ENDPOINT: process.env.B2_ENDPOINT
    });
    
    // Test B2 authentication without trying to upload
    // We'll create a simple test file in memory
    try {
      const testBuffer = Buffer.from('test');
      const testFolder = 'test-uploads';
      const testFileName = 'connectivity-test.txt';
      const testMimeType = 'text/plain';
      
      // This will attempt to authenticate with B2 without actually completing the upload
      console.log('Testing B2 authentication...');
      const { authToken, apiUrl, downloadUrl, bucketId } = await require('../utils/imageUpload').getB2Auth();
      
      res.json({
        success: true,
        message: 'B2 configuration check passed',
        authStatus: 'Authenticated successfully',
        bucketId,
        apiUrl: apiUrl ? 'Connected' : 'Failed',
        downloadUrl: downloadUrl ? 'Available' : 'Failed'
      });
    } catch (b2Error) {
      console.error('B2 authentication test failed:', b2Error);
      res.status(500).json({
        success: false,
        message: 'B2 configuration check failed',
        error: b2Error.message,
        stack: b2Error.stack
      });
    }
  } catch (error) {
    console.error('Config check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking configuration',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * @route   GET /api/images/default/banner
 * @desc    Get the default banner image URL
 * @access  Public
 */
router.get('/default/banner', async (req, res) => {
  try {
    const { getDefaultImageUrl } = require('../utils/imageUpload');
    const defaultBannerUrl = getDefaultImageUrl('banner');
    
    res.json({
      success: true,
      imageUrl: defaultBannerUrl
    });
  } catch (error) {
    console.error('Error getting default banner URL:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/images/default/profile
 * @desc    Get the default profile image URL
 * @access  Public
 */
router.get('/default/profile', async (req, res) => {
  try {
    // We no longer use placeholder profile images
    // Return an empty string to let the front-end handle fallbacks with blue background + initials
    res.json({
      success: true,
      imageUrl: ''
    });
  } catch (error) {
    console.error('Error getting default profile URL:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router; 
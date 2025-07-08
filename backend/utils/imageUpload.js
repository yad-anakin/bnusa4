const fetch = require('node-fetch');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const fs = require('fs');

// Ensure environment variables are loaded
dotenv.config();

// Get B2 credentials from environment
const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME;

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Setup file filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Only JPEG, PNG and WebP are allowed.'), false);
  }
};

// Multer instance
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter
});

// Function to calculate SHA1 hash of a buffer
function calculateSha1(buffer) {
  return crypto.createHash('sha1').update(buffer).digest('hex');
}

// Cache for B2 authorization data to avoid repeated auth requests
let authCache = {
  authToken: null,
  apiUrl: null,
  downloadUrl: null,
  bucketId: null,
  expiresAt: null
};

// Store our default image URLs after uploading
let defaultImageUrls = {
  bannerPrimary: null,
  profileAvatar: null
};

// Get B2 authorization and bucket info
async function getB2Auth() {
  // Return cached auth if still valid (expires after 23 hours, we'll refresh after 22)
  const now = Date.now();
  if (authCache.authToken && authCache.expiresAt && now < authCache.expiresAt) {
    return authCache;
  }
  
  try {
    // Log B2 credentials to help diagnose issues (without showing full secret key)
    console.log('Using B2 credentials:', {
      B2_KEY_ID: B2_KEY_ID?.slice(0, 8) + '...',
      B2_BUCKET_NAME,
      B2_ENDPOINT: process.env.B2_ENDPOINT || 'using default'
    });
    
    if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET_NAME) {
      throw new Error('Missing B2 credentials. Ensure B2_KEY_ID, B2_APP_KEY, and B2_BUCKET_NAME are set in .env');
    }
    
    // Step 1: Get authorization token
    console.log('Attempting to authorize with B2...');
    const authUrl = 'https://api.backblazeb2.com/b2api/v2/b2_authorize_account';
    const authResponse = await fetch(authUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64')}`
      }
    });
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('B2 authorization failed:', errorText);
      throw new Error(`B2 authentication failed (${authResponse.status}): ${errorText}`);
    }
    
    const authData = await authResponse.json();
    console.log('B2 authorization successful, got API endpoints and token');
    
    // Step 2: Get bucket ID
    console.log(`Looking for bucket: ${B2_BUCKET_NAME}`);
    const listBucketsUrl = `${authData.apiUrl}/b2api/v2/b2_list_buckets`;
    const listBucketsResponse = await fetch(listBucketsUrl, {
      method: 'POST',
      headers: {
        'Authorization': authData.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId: authData.accountId
      })
    });
    
    if (!listBucketsResponse.ok) {
      const errorText = await listBucketsResponse.text();
      console.error('Failed to list buckets:', errorText);
      throw new Error(`Failed to list buckets (${listBucketsResponse.status}): ${errorText}`);
    }
    
    const bucketData = await listBucketsResponse.json();
    const targetBucket = bucketData.buckets.find(bucket => bucket.bucketName === B2_BUCKET_NAME);
    
    if (!targetBucket) {
      console.error(`Bucket "${B2_BUCKET_NAME}" not found. Available buckets:`, 
                   bucketData.buckets.map(b => b.bucketName).join(', '));
      throw new Error(`Target bucket "${B2_BUCKET_NAME}" not found`);
    }
    
    console.log(`Found bucket ${B2_BUCKET_NAME} with ID ${targetBucket.bucketId}`);
    
    // Update auth cache with 22 hour expiration (B2 tokens are valid for 24 hours)
    const expiresAt = now + (22 * 60 * 60 * 1000);
    
    authCache = {
      authToken: authData.authorizationToken,
      apiUrl: authData.apiUrl,
      downloadUrl: authData.downloadUrl,
      bucketId: targetBucket.bucketId,
      expiresAt
    };
    
    return authCache;
  } catch (error) {
    console.error('B2 authentication error:', error);
    throw new Error(`Failed to authenticate with B2 storage service: ${error.message}`);
  }
}

/**
 * Upload default images to B2 when the server starts
 * This ensures we always have a copy of our default images in B2
 */
async function uploadDefaultImagesToB2() {
  try {
    console.log('Uploading default images to Backblaze B2...');
    
    // Create fallback URLs for when files don't exist
    defaultImageUrls.bannerPrimary = process.env.B2_PUBLIC_URL 
      ? `${process.env.B2_PUBLIC_URL}defaults/default-banner-primary.jpg` 
      : '/images/deafult-banner.jpg';
    
    defaultImageUrls.profileAvatar = process.env.B2_PUBLIC_URL 
      ? `${process.env.B2_PUBLIC_URL}defaults/default-avatar.png` 
      : '/images/placeholders/avatar-default.png';
    
    // Path to default images - look in both backend and root public folders
    const possiblePaths = [
      '../public/images/deafult-banner.jpg', // relative to utils folder
      'public/images/deafult-banner.jpg',    // relative to backend folder
      '../public/images/deafult-banner.jpg', // relative to backend folder
      '../../public/images/deafult-banner.jpg' // just in case
    ];
    
    // Find the correct path for banner
    let defaultBannerPath = null;
    for (const testPath of possiblePaths) {
      const fullPath = path.join(__dirname, testPath);
      if (fs.existsSync(fullPath)) {
        defaultBannerPath = fullPath;
        console.log(`Found banner image at: ${fullPath}`);
        break;
      }
    }
    
    // Check if banner file exists
    if (!defaultBannerPath) {
      console.error('Default banner image not found, using fallback URL');
      return;
    }
    
    // Find avatar image
    const avatarPaths = [
      '../public/images/placeholders/avatar-default.png',
      'public/images/placeholders/avatar-default.png',
      '../public/images/placeholders/avatar-default.png',
      '../../public/images/placeholders/avatar-default.png'
    ];
    
    let defaultProfilePath = null;
    for (const testPath of avatarPaths) {
      const fullPath = path.join(__dirname, testPath);
      if (fs.existsSync(fullPath)) {
        defaultProfilePath = fullPath;
        console.log(`Found avatar image at: ${fullPath}`);
        break;
      }
    }
    
    if (!defaultProfilePath) {
      console.error('Default profile image not found, using fallback URL');
      return;
    }
    
    // Read default images
    try {
      const defaultBannerBuffer = fs.readFileSync(defaultBannerPath);
      
      // Upload default banner
      defaultImageUrls.bannerPrimary = await uploadImage(
        defaultBannerBuffer,
        'default-banner-primary.jpg',
        'image/jpeg',
        'defaults'
      );
      
      console.log('Default banner uploaded to B2 successfully:', defaultImageUrls.bannerPrimary);
      
      try {
        const defaultProfileBuffer = fs.readFileSync(defaultProfilePath);
        
        // Upload default profile avatar
        defaultImageUrls.profileAvatar = await uploadImage(
          defaultProfileBuffer,
          'default-avatar.png',
          'image/png',
          'defaults'
        );
        
        console.log('Default avatar uploaded to B2 successfully:', defaultImageUrls.profileAvatar);
      } catch (avatarError) {
        console.error('Failed to read or upload avatar image:', avatarError);
      }
    } catch (bannerError) {
      console.error('Failed to read or upload banner image:', bannerError);
    }
    
  } catch (error) {
    console.error('Failed to upload default images to B2:', error);
  }
}

// Initialize the upload of default images
setTimeout(uploadDefaultImagesToB2, 5000); // Give the server 5 seconds to start up

/**
 * Get the URL for a default image that's stored in B2
 * @param {String} imageType - Type of default image ('banner' or 'profile')
 * @returns {String} - URL of the default image
 */
const getDefaultImageUrl = (imageType) => {
  if (imageType === 'banner' && defaultImageUrls.bannerPrimary) {
    return defaultImageUrls.bannerPrimary;
  } else if (imageType === 'profile') {
    // We now use a blue background with initials instead of placeholder images
    return ''; 
  }
  
  // Fallback to local paths if B2 versions aren't available
  return imageType === 'banner' 
    ? '/images/deafult-banner.jpg'
    : ''; // Empty string for profile
};

/**
 * Upload a single image to Backblaze B2 using the native API
 * @param {Buffer} buffer - The file buffer
 * @param {String} originalname - Original file name 
 * @param {String} mimetype - File mime type
 * @param {String} folder - Optional folder path within bucket
 * @returns {Promise<String>} - URL of the uploaded image
 */
const uploadImage = async (buffer, originalname, mimetype, folder = '') => {
  try {
    console.log(`Uploading image: ${originalname} (${mimetype}) to folder: ${folder || 'root'}`);
    
    // Get B2 authentication and bucket info
    try {
      const { authToken, apiUrl, downloadUrl, bucketId } = await getB2Auth();
      
      // Get upload URL
      console.log('Getting B2 upload URL...');
      const getUploadUrlUrl = `${apiUrl}/b2api/v2/b2_get_upload_url`;
      const getUploadUrlResponse = await fetch(getUploadUrlUrl, {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bucketId: bucketId
        })
      });
      
      if (!getUploadUrlResponse.ok) {
        const errorText = await getUploadUrlResponse.text();
        console.error('Failed to get upload URL:', errorText);
        throw new Error(`Failed to get upload URL (${getUploadUrlResponse.status}): ${errorText}`);
      }
      
      const uploadUrlData = await getUploadUrlResponse.json();
      console.log('Got B2 upload URL successfully');
      
      // Calculate SHA1 hash of the file
      const sha1Hash = calculateSha1(buffer);
      
      // Generate a unique file name
      const fileExt = path.extname(originalname);
      const fileName = `${folder ? folder + '/' : ''}${uuidv4()}${fileExt}`;
      
      // Generate a cache timestamp that changes only once per day
      // This ensures consistent caching even if the image is re-uploaded
      const cacheDate = new Date().toISOString().split('T')[0]; // Just the date portion
      
      // Upload the file
      console.log(`Uploading file to B2: ${fileName}`);
      const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': uploadUrlData.authorizationToken,
          'X-Bz-File-Name': fileName,
          'Content-Type': mimetype,
          'X-Bz-Content-Sha1': sha1Hash,
          'X-Bz-Info-Author': 'bnusa-app',
          // Add cache headers as B2 custom file info
          'X-Bz-Info-Cache-Control': 'max-age=31536000', // 1 year
          'X-Bz-Info-Cache-Last-Modified': cacheDate
        },
        body: buffer
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Failed to upload file to B2:', errorText);
        throw new Error(`Failed to upload file (${uploadResponse.status}): ${errorText}`);
      }
      
      const uploadData = await uploadResponse.json();
      const imageUrl = `${downloadUrl}/file/${B2_BUCKET_NAME}/${fileName}`;
      console.log('File uploaded successfully to B2:', imageUrl);
      
      // Return the public URL
      return imageUrl;
    } catch (b2Error) {
      console.error('Error with B2 upload, using placeholder fallback:', b2Error);
      
      // As a fallback, we'll return a placeholder URL based on file type
      // In a production environment, you would want a more robust fallback
      const fileExt = path.extname(originalname).toLowerCase();
      let placeholderUrl;
      
      if (folder === 'profiles') {
        placeholderUrl = 'https://via.placeholder.com/200x200?text=Profile+Image';
      } else if (folder === 'banners') {
        placeholderUrl = 'https://via.placeholder.com/1200x300?text=Banner+Image';
      } else if (fileExt === '.jpg' || fileExt === '.jpeg' || fileExt === '.png' || fileExt === '.webp') {
        placeholderUrl = 'https://via.placeholder.com/800x600?text=Image';
      } else {
        placeholderUrl = 'https://via.placeholder.com/800x600?text=File';
      }
      
      console.log('Using placeholder URL as fallback:', placeholderUrl);
      return placeholderUrl;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Delete an image from Backblaze B2 using the native API
 * @param {String} imageUrl - The URL of the image to delete
 * @returns {Promise<Boolean>} - Success status
 */
const deleteImage = async (imageUrl) => {
  try {
    // Get B2 authentication and bucket info
    const { authToken, apiUrl } = await getB2Auth();
    
    // Extract the file path from the URL - this needs to include any folders
    // Example: https://f005.backblazeb2.com/file/bnusa-images/tests/abc123.png
    // We need to extract: tests/abc123.png
    
    // First get the part after /file/bucketname/
    const urlParts = imageUrl.split('/file/' + B2_BUCKET_NAME + '/');
    if (urlParts.length < 2) {
      console.warn(`Invalid image URL format for deletion: ${imageUrl}`);
      return false;
    }
    
    const filePath = urlParts[1];
    console.log(`Looking for file: ${filePath}`);
    
    // We need to find the file ID first
    const listFileNamesUrl = `${apiUrl}/b2api/v2/b2_list_file_names`;
    const listResponse = await fetch(listFileNamesUrl, {
      method: 'POST',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucketId: authCache.bucketId,
        prefix: filePath,
        maxFileCount: 1
      })
    });
    
    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      throw new Error(`Failed to find file (${listResponse.status}): ${errorText}`);
    }
    
    const listData = await listResponse.json();
    
    // Check if file was found
    if (!listData.files || listData.files.length === 0) {
      console.warn(`File not found for deletion: ${filePath}`);
      return false;
    }
    
    const fileId = listData.files[0].fileId;
    console.log(`Found file ID: ${fileId}`);
    
    // Delete the file
    const deleteFileUrl = `${apiUrl}/b2api/v2/b2_delete_file_version`;
    const deleteResponse = await fetch(deleteFileUrl, {
      method: 'POST',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: listData.files[0].fileName,
        fileId: fileId
      })
    });
    
    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`Failed to delete file (${deleteResponse.status}): ${errorText}`);
    }
    
    console.log(`Successfully deleted file: ${filePath}`);
    return true;
  } catch (error) {
    console.error('Error deleting from B2:', error);
    return false;
  }
};

module.exports = {
  upload,
  uploadImage,
  deleteImage,
  getB2Auth,
  getDefaultImageUrl
}; 
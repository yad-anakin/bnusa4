import crypto from 'crypto';
import { auth } from '../config/firebaseConfig';

// API key and base URL from environment variables
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'bnusa_pk_live_51NxK2pL9vM4qR8tY3wJ7hF5cD2mN6bX4vZ9yA1sE8uW0';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

// Simple in-memory cache to reduce API calls
interface CacheItem {
  data: any;
  timestamp: number;
}

// Define the cache options interface
interface CacheOptions {
  useCache?: boolean;
  cacheDuration?: number;
}

// Track all loaded images to prevent duplicate downloads
// This will be a global registry of images already loaded in this session
interface ImageRegistry {
  [url: string]: {
    timestamp: number;
    loadCount: number;
    lastSize?: string; // Track the size requested
    width?: number;    // Track actual dimensions used
    height?: number;
    loaded: boolean;   // Track if image was successfully loaded
  }
}

// Global in-memory caches
const cache: { [key: string]: CacheItem } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache by default
const IMAGE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for images by default
const B2_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for B2 images
const SESSION_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for session cache

// Local storage cache keys
const IMAGE_CACHE_KEY = 'bnusa_image_cache_metadata';
const IMAGE_REGISTRY_KEY = 'bnusa_image_registry';
const LAST_CACHE_CLEANUP_KEY = 'bnusa_last_cache_cleanup';

// Global registry to track loaded images and prevent duplicates
let imageRegistry: ImageRegistry = {};

// Helper to check if a URL is a Backblaze B2 URL
const isB2ImageUrl = (url: string): boolean => {
  return Boolean(url && (
    url.includes('b-cdn.net') || 
    url.includes('backblazeb2.com') ||
    url.includes('bnusaimages')
  ));
};

// Helper to get optimal cache duration for a resource
const getCacheDuration = (path: string, data: any): number => {
  // Images from B2 should be cached longer to reduce bandwidth costs
  if (path.includes('/api/images') || path.includes('/images/')) {
    return B2_CACHE_DURATION;
  }
  
  // If the response contains image URLs, determine if they are B2 URLs
  if (data && typeof data === 'object') {
    let hasB2Images = false;
    
    // Function to recursively check for B2 image URLs in the response
    const checkForB2Images = (obj: any) => {
      if (!obj) return;
      
      if (typeof obj === 'string' && isB2ImageUrl(obj)) {
        hasB2Images = true;
        return;
      }
      
      if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
          obj.forEach(item => checkForB2Images(item));
        } else {
          Object.values(obj).forEach(value => checkForB2Images(value));
        }
      }
    };
    
    checkForB2Images(data);
    
    if (hasB2Images) {
      return IMAGE_CACHE_DURATION;
    }
  }
  
  return CACHE_DURATION;
};

// Get standardized image URL (strip cache busting params)
const getStandardizedImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    // Create URL object to manipulate params
    const urlObj = new URL(url);
    
    // Remove common cache busting parameters
    urlObj.searchParams.delete('t');
    urlObj.searchParams.delete('_t');
    urlObj.searchParams.delete('cache');
    urlObj.searchParams.delete('timestamp');
    
    // Keep only essential parameters like width, height, quality
    const essentialParams = ['w', 'h', 'q', 'width', 'height', 'quality', 'fit'];
    const allParams = Array.from(urlObj.searchParams.keys());
    allParams.forEach(param => {
      if (!essentialParams.includes(param)) {
        urlObj.searchParams.delete(param);
      }
    });
    
    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, just return the original
    return url;
  }
};

// Initialize image cache from localStorage on client side
const initImageCache = () => {
  if (typeof window !== 'undefined') {
    try {
      // Check if we should clean up the cache (once per day)
      const now = Date.now();
      const lastCleanup = localStorage.getItem(LAST_CACHE_CLEANUP_KEY) 
        ? parseInt(localStorage.getItem(LAST_CACHE_CLEANUP_KEY) || '0', 10)
        : 0;
      
      // Clean up caches if last cleanup was more than a day ago
      if (now - lastCleanup > 24 * 60 * 60 * 1000) {
        cleanupCaches();
        localStorage.setItem(LAST_CACHE_CLEANUP_KEY, now.toString());
      }
      
      // Load image cache metadata
      const storedMetadata = localStorage.getItem(IMAGE_CACHE_KEY);
      if (storedMetadata) {
        const metadata = JSON.parse(storedMetadata);
        
        // Only import metadata for URLs that are likely still valid
        Object.keys(metadata).forEach(url => {
          const entry = metadata[url];
          if (entry && (now - entry.timestamp) < B2_CACHE_DURATION) {
            // Add to runtime cache
            cache[`GET:/api/images/proxy:{"url":"${url}"}`] = {
              data: { success: true, imageUrl: url },
              timestamp: entry.timestamp
            };
          }
        });
      }
      
      // Load image registry
      const storedRegistry = localStorage.getItem(IMAGE_REGISTRY_KEY);
      if (storedRegistry) {
        try {
          const registry = JSON.parse(storedRegistry);
          // Filter out old entries
          Object.keys(registry).forEach(url => {
            if (now - registry[url].timestamp > B2_CACHE_DURATION) {
              delete registry[url];
            }
          });
          
          imageRegistry = registry;
        } catch (e) {
          imageRegistry = {};
        }
      }
    } catch (error) {
      // console.warn('Error initializing image cache:', error);
    }
  }
};

// Cleanup all caches to prevent memory bloat
const cleanupCaches = () => {
  if (typeof window !== 'undefined') {
    try {
      const now = Date.now();
      
      // Clean up in-memory cache
      Object.keys(cache).forEach(key => {
        const item = cache[key];
        // Remove items older than their appropriate duration
        const duration = key.includes('/api/images') || key.includes('/images/') 
          ? B2_CACHE_DURATION 
          : CACHE_DURATION;
          
        if (now - item.timestamp > duration) {
          delete cache[key];
        }
      });
      
      // Clean up image registry
      const registryCount = Object.keys(imageRegistry).length;
      Object.keys(imageRegistry).forEach(url => {
        if (now - imageRegistry[url].timestamp > B2_CACHE_DURATION) {
          delete imageRegistry[url];
        }
      });
      
      // Clean localStorage caches
      try {
        // Clean image cache metadata
        const storedMetadata = localStorage.getItem(IMAGE_CACHE_KEY);
        if (storedMetadata) {
          const metadata = JSON.parse(storedMetadata);
          let cleaned = 0;
          
          Object.keys(metadata).forEach(url => {
            if (now - metadata[url].timestamp > B2_CACHE_DURATION) {
              delete metadata[url];
              cleaned++;
            }
          });
          
          localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(metadata));
        }
      } catch (e) {
        // console.warn('Error cleaning localStorage caches:', e);
      }
    } catch (e) {
      // console.warn('Error in cache cleanup:', e);
    }
  }
};

// Save image registry to localStorage
const saveImageRegistry = () => {
  if (typeof window !== 'undefined') {
    try {
      // Only save if we have a substantial number of entries
      if (Object.keys(imageRegistry).length > 0) {
        localStorage.setItem(IMAGE_REGISTRY_KEY, JSON.stringify(imageRegistry));
      }
    } catch (e) {
      // console.warn('Error saving image registry to localStorage:', e);
    }
  }
};

// Register image load to prevent duplicate downloads
const registerImageLoad = (url: string, size?: string, width?: number, height?: number) => {
  if (!url) return;
  
  const standardUrl = getStandardizedImageUrl(url);
  
  if (imageRegistry[standardUrl]) {
    // Increment the load count for this image
    imageRegistry[standardUrl].loadCount++;
    imageRegistry[standardUrl].timestamp = Date.now();
    imageRegistry[standardUrl].loaded = true;
    if (size) imageRegistry[standardUrl].lastSize = size;
    if (width) imageRegistry[standardUrl].width = width;
    if (height) imageRegistry[standardUrl].height = height;
  } else {
    // First time seeing this image
    imageRegistry[standardUrl] = {
      timestamp: Date.now(),
      loadCount: 1,
      lastSize: size,
      width,
      height,
      loaded: true
    };
  }
  
  // Save registry periodically, not on every image
  // This reduces localStorage writes which can be expensive
  if (Object.keys(imageRegistry).length % 10 === 0) {
    saveImageRegistry();
  }
};

// Check if an image has already been loaded
const isImageAlreadyLoaded = (url: string): boolean => {
  if (!url) return false;
  
  const standardUrl = getStandardizedImageUrl(url);
  return !!imageRegistry[standardUrl] && imageRegistry[standardUrl].loaded === true;
};

// Call initialization
initImageCache();

// Set up periodic saving of image registry and cleanup
if (typeof window !== 'undefined') {
  // Save registry every minute
  setInterval(saveImageRegistry, 60000);
  
  // Cleanup caches every hour
  setInterval(() => {
    // Only clean up if there's a lot of entries to avoid unnecessary work
    if (Object.keys(cache).length > 100 || Object.keys(imageRegistry).length > 100) {
      cleanupCaches();
    }
  }, 60 * 60 * 1000);
}

/**
 * Generate request signature for API authentication
 */
const generateSignature = (method: string, fullPath: string, body: any, timestamp: string): string => {
  // Strip query parameters for signature check (same as server)
  const pathname = fullPath.split('?')[0];
  
  // Make sure body is properly formatted as JSON string
  const bodyString = JSON.stringify(body || '');
  
  const signatureString = `${method}${pathname}${bodyString}${timestamp}${API_KEY}`;
  return crypto.createHash('sha256').update(signatureString).digest('hex');
};

/**
 * Makes an authenticated API request with optional caching
 */
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  cacheOptions: CacheOptions = {}
): Promise<any> => {
  const method = options.method || 'GET';
  const timestamp = Date.now().toString();
  
  // Make sure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Create cache key for GET requests
  const cacheKey = `${method}:${path}:${JSON.stringify(options.body || '')}`;
  
  // Check if this is an image request
  const isImageRequest = path.includes('/api/images/') || path.includes('/images/');
  
  // For image requests, check if we've already loaded this image in this session
  if (isImageRequest && method === 'GET') {
    // Try to extract the image URL from the request
    let imageUrl = '';
    
    if (path.includes('/api/images/proxy')) {
      try {
        const body = options.body ? JSON.parse(options.body as string) : null;
        if (body && body.url) {
          imageUrl = body.url;
        } else if (path.includes('?url=')) {
          const urlMatch = path.match(/\?url=([^&]+)/);
          if (urlMatch && urlMatch[1]) {
            imageUrl = decodeURIComponent(urlMatch[1]);
          }
        }
      } catch (e) {
        // If parsing fails, continue with normal flow
      }
    } else if (path.includes('/images/')) {
      imageUrl = path;
    }
    
    // If we identified an image URL and it's already loaded, use a special cached response
    if (imageUrl && isImageAlreadyLoaded(imageUrl)) {
      return { success: true, imageUrl, fromRegistry: true };
    }
  }
  
  // Check cache for GET requests if caching is enabled
  const useCache = cacheOptions.useCache !== false && method === 'GET';
  if (useCache && cache[cacheKey]) {
    const cachedItem = cache[cacheKey];
    // Use provided cache duration, or determine based on content type
    const cacheDuration = cacheOptions.cacheDuration || 
                         (isImageRequest ? B2_CACHE_DURATION : CACHE_DURATION);
    const isValid = (Date.now() - cachedItem.timestamp) < cacheDuration;
    
    if (isValid) {
      // Use cached response instead of making a new request
      // For images, register that we "loaded" this image again
      if (isImageRequest && cachedItem.data && cachedItem.data.imageUrl) {
        registerImageLoad(cachedItem.data.imageUrl);
      }
      return cachedItem.data;
    } else {
      // Cache expired, remove it
      delete cache[cacheKey];
    }
  }
  
  // Get body for signature
  let body = null;
  if (options.body) {
    if (typeof options.body === 'string') {
      try {
        body = JSON.parse(options.body);
      } catch (e) {
        body = options.body;
      }
    } else {
      body = options.body;
    }
  }

  // Defensive: Prevent sending empty userIds to batch-status endpoint
  if (
    path.includes('/api/users/follow/batch-status') &&
    method === 'POST' &&
    body &&
    Array.isArray(body.userIds) &&
    body.userIds.length === 0
  ) {
    return { success: true, followStatus: {} };
  }
  
  // Generate signature with the full path
  const signature = generateSignature(
    method,
    path,
    body,
    timestamp
  );

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    'x-timestamp': timestamp,
    'x-signature': signature,
    ...options.headers as Record<string, string>,
  };
  
  // Add cache control headers for images
  if (isImageRequest) {
    headers['Cache-Control'] = 'max-age=604800, stale-while-revalidate=86400'; // 7 days + 1 day stale
    headers['X-Image-Cache'] = 'true';
  }
  
  // Add Firebase authentication token if available
  // This is needed for authenticated endpoints like followers/following
  if (typeof window !== 'undefined') {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        // console.error('Error getting Firebase token:', error);
      }
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method,
      headers,
      // Add cache control for images
      cache: isImageRequest ? 'force-cache' : 'default',
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle specific API errors based on status and content
      const isInvalidUserIdError = 
        response.status === 400 && 
        errorText.includes('Invalid user ID format') &&
        path.includes('/api/users/follow/batch-status');
      
      // Suppress logging for 'Cannot follow yourself' errors
      const isCannotFollowYourselfError =
        response.status === 400 &&
        errorText.includes('Cannot follow yourself');
      
      // Only log errors that aren't expected
      if (!isInvalidUserIdError && !isCannotFollowYourselfError) {
        // console.error(`API error: ${response.status}`, errorText);
      }
      
      // Special handling for rate limiting errors
      if (response.status === 429) {
        // console.warn("Rate limit hit, using cached data if available");
        
        // Try to find any cached version of this request
        if (cache[cacheKey]) {
          return cache[cacheKey].data;
        }
        
        // If we have any cached data for similar endpoints, return the most recent
        const similarKeys = Object.keys(cache).filter(k => k.includes(path.split('?')[0]));
        if (similarKeys.length > 0) {
          // Find the most recent cached item
          const mostRecentKey = similarKeys.reduce((latest, key) => {
            return cache[key].timestamp > cache[latest].timestamp ? key : latest;
          }, similarKeys[0]);
          
          return cache[mostRecentKey].data;
        }
      }
      
      // For invalid user ID errors in batch status requests, return a success response with empty data
      // This matches the backend behavior for invalid IDs
      if (isInvalidUserIdError) {
        return {
          success: true,
          followStatus: {}
        };
      }
      
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Cache successful GET responses
    if (useCache && method === 'GET') {
      // Store in memory cache
      cache[cacheKey] = {
        data,
        timestamp: Date.now()
      };
      
      // For image requests, register this image and save to localStorage
      if (isImageRequest && typeof window !== 'undefined' && data.imageUrl) {
        // Register that we loaded this image
        let width = 0;
        let height = 0;
        
        // Extract size parameters if present
        let size = '';
        if (data.imageUrl.includes('?')) {
          const params = new URLSearchParams(data.imageUrl.split('?')[1]);
          width = parseInt(params.get('w') || params.get('width') || '0', 10);
          height = parseInt(params.get('h') || params.get('height') || '0', 10);
          
          if (width || height) {
            size = `${width || 'auto'}x${height || 'auto'}`;
          }
        }
        
        // Register the image with size info
        registerImageLoad(data.imageUrl, size, width, height);
        
        try {
          // Update the image cache metadata in localStorage
          const storedMetadata = localStorage.getItem(IMAGE_CACHE_KEY) || '{}';
          const metadata = JSON.parse(storedMetadata);
          
          // Add or update this image URL
          metadata[data.imageUrl] = { 
            timestamp: Date.now(),
            url: data.imageUrl,
            size
          };
          
          // Clean up old entries to prevent localStorage from getting too large
          const now = Date.now();
          Object.keys(metadata).forEach(url => {
            if ((now - metadata[url].timestamp) > B2_CACHE_DURATION) {
              delete metadata[url];
            }
          });
          
          localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(metadata));
        } catch (error) {
          // console.warn('Error updating localStorage image cache:', error);
        }
      }
    }
    
    return data;
  } catch (error) {
    // Check if this is an invalid user ID format error for batch status
    const isInvalidUserIdError = 
      error instanceof Error && 
      error.message.includes('Invalid user ID format') &&
      path.includes('/api/users/follow/batch-status');
    // Suppress logging for 'Cannot follow yourself' errors
    const isCannotFollowYourselfError =
      error instanceof Error &&
      error.message.includes('Cannot follow yourself');
    // Only log unexpected errors
    if (!isInvalidUserIdError && !isCannotFollowYourselfError) {
      // console.error('API request failed:', error);
    }
    
    // Return success with empty data for batch status invalid ID errors
    if (isInvalidUserIdError) {
      return {
        success: true,
        followStatus: {}
      };
    }
    
    throw error;
  }
};

// Make these functions available on the api object
const apiExtensions = {
  isImageAlreadyLoaded,
  registerImageLoad,
  getStandardizedImageUrl,
  getImageRegistryStats: () => {
    return {
      totalImagesLoaded: Object.keys(imageRegistry).length,
      totalLoads: Object.values(imageRegistry).reduce((sum, item) => sum + item.loadCount, 0),
      oldestImage: Object.entries(imageRegistry).reduce((oldest, [url, data]) => {
        return oldest.timestamp < data.timestamp ? oldest : { url, timestamp: data.timestamp };
      }, { url: '', timestamp: Date.now() }),
      mostLoadedImage: Object.entries(imageRegistry).reduce((most, [url, data]) => {
        return most.loadCount > data.loadCount ? most : { url, loadCount: data.loadCount };
      }, { url: '', loadCount: 0 })
    };
  }
};

// API utility functions for different request types
const api = {
  get: (endpoint: string, options: RequestInit = {}, cacheOptions: CacheOptions = { useCache: true }) => {
    // Determine if this is an image request for special caching rules
    const isImageRequest = endpoint.includes('/api/images') || endpoint.includes('/images');
    
    // Add timestamp for cache-busting on user profile endpoints
    let modifiedEndpoint = endpoint;
    
    // Apply different caching rules based on endpoint type
    if (endpoint.includes('/api/users/profile') || 
        endpoint.includes('/api/users/byUsername/') || 
        endpoint.includes('/api/users/') ||
        endpoint.includes('/api/user-images/')) {
      // Add timestamp to user-related endpoints to prevent excessive caching
      const separator = endpoint.includes('?') ? '&' : '?';
      modifiedEndpoint = `${endpoint}${separator}_t=${Date.now()}`;
    } else if (isImageRequest && !cacheOptions.cacheDuration) {
      // Use long-term caching for images to reduce B2 costs
      cacheOptions.cacheDuration = B2_CACHE_DURATION;
    }
    
    return apiRequest(modifiedEndpoint, { ...options, method: 'GET' }, cacheOptions);
  },

  post: (endpoint: string, data: any, options: RequestInit = {}) => {
    // Process arrays to ensure they're properly preserved in JSON
    const prepareData = (data: any): any => {
      if (!data) return data;
      
      // Handle arrays
      if (Array.isArray(data)) {
        // Create a new array with processed values
        return data.map(item => prepareData(item));
      }
      
      // Handle objects (recursively process nested objects and arrays)
      if (typeof data === 'object' && data !== null) {
        const result: any = {};
        for (const key in data) {
          // Skip prototype properties
          if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
          
          const value = data[key];
          
          // Special handling for YouTube and Resource links
          if ((key === 'youtubeLinks' || key === 'resourceLinks') && value !== undefined) {
            if (Array.isArray(value)) {
              // Ensure the array is properly copied
              result[key] = [...value.map(item => prepareData(item))];
            } else {
              // If somehow not an array, create an empty array
              result[key] = [];
            }
          }
          // Specifically ensure other arrays are preserved
          else if (Array.isArray(value)) {
            // Create a clean copy of the array
            result[key] = [...value.map(item => prepareData(item))];
          } else if (typeof value === 'object' && value !== null) {
            // Recursively process nested objects
            result[key] = prepareData(value);
          } else {
            // For primitive values, just copy them
            result[key] = value;
          }
        }
        return result;
      }
      
      // Return primitives as is
      return data;
    };
    
    // Process data to ensure arrays are preserved
    const processedData = prepareData(data);
    
    // Add metadata to the body instead of using headers
    const enhancedData = {
      ...processedData,
      __metadata: {
        hasArrays: true,
        youtubeLinksInfo: processedData.youtubeLinks ? {
          isArray: Array.isArray(processedData.youtubeLinks),
          length: Array.isArray(processedData.youtubeLinks) ? processedData.youtubeLinks.length : 0
        } : null,
        resourceLinksInfo: processedData.resourceLinks ? {
          isArray: Array.isArray(processedData.resourceLinks),
          length: Array.isArray(processedData.resourceLinks) ? processedData.resourceLinks.length : 0
        } : null
      }
    };
    
    // Create the actual request body that will be sent
    const requestBody = JSON.stringify(enhancedData);
    
    // Use standard headers that don't cause CORS issues
    const headers = {
      ...(options.headers || {}),
      'Content-Type': 'application/json'
    };
    
    return apiRequest(endpoint, { 
      ...options, 
      method: 'POST', 
      body: requestBody,
      headers
    });
  },

  put: (endpoint: string, data: any, options: RequestInit = {}) => {
    // Force cache clearing for user-related PUT requests and content that might impact UI
    if (endpoint.includes('/api/users/') || 
        endpoint.includes('/api/user-images/') ||
        endpoint.includes('/api/articles/')) {
      api.clearUserCache();
    }
    return apiRequest(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(data)
    });
  },

  delete: (endpoint: string, options: RequestInit = {}) =>
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
    
  clearCache: () => {
    // Clear in-memory cache
    Object.keys(cache).forEach(key => delete cache[key]);
    
    // Don't clear image cache from localStorage to save on B2 bandwidth
  },
  
  // Specifically clear user-related cache
  clearUserCache: () => {
    // Clear in-memory API cache for user-related data
    Object.keys(cache).forEach(key => {
      if (key.includes('/api/users/') || 
          key.includes('/api/user-images/') ||
          key.includes('/profile')) {
        delete cache[key];
      }
    });
    
    // Also try to clear browser image cache by preloading with new timestamp
    if (typeof window !== 'undefined') {
      try {
        // We'll append a unique timestamp to a request to the API server
        // This forces the browser to invalidate any cached images from that domain
        const cacheBuster = new window.Image();
        cacheBuster.src = `${API_BASE_URL}/api/cache-buster?t=${Date.now()}`;
      } catch (error) {
        // console.error('Error with browser cache busting:', error);
      }
    }
  },
  
  // Force refresh a specific image URL in the cache
  refreshImageCache: (imageUrl: string) => {
    if (!imageUrl) return;
    
    // Clear from in-memory cache
    Object.keys(cache).forEach(key => {
      if (key.includes(imageUrl)) {
        delete cache[key];
      }
    });
    
    // Remove from image registry
    const standardUrl = getStandardizedImageUrl(imageUrl);
    if (imageRegistry[standardUrl]) {
      delete imageRegistry[standardUrl];
      saveImageRegistry();
    }
    
    // Clear from localStorage cache
    if (typeof window !== 'undefined') {
      try {
        const storedMetadata = localStorage.getItem(IMAGE_CACHE_KEY);
        if (storedMetadata) {
          const metadata = JSON.parse(storedMetadata);
          if (metadata[imageUrl]) {
            delete metadata[imageUrl];
            localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(metadata));
          }
        }
      } catch (error) {
        // console.warn('Error refreshing image cache:', error);
      }
    }
  },
  
  // Force refresh user data
  forceRefreshUserData: async () => {
    api.clearUserCache();
    try {
      const result = await api.noCache.get('/api/users/profile');
      return result;
    } catch (error) {
      // console.error('Error force refreshing user data:', error);
      throw error;
    }
  },
  
  // Skip cache variant for all endpoints
  noCache: {
    get: (endpoint: string, options: RequestInit = {}) =>
      apiRequest(endpoint, { ...options, method: 'GET' }, { useCache: false }),
    post: (endpoint: string, data: any, options: RequestInit = {}) => 
      apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
    put: (endpoint: string, data: any, options: RequestInit = {}) => 
      apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
    delete: (endpoint: string, options: RequestInit = {}) => 
      apiRequest(endpoint, { ...options, method: 'DELETE' })
  },
  
  // Add specialized method for image uploads
  uploadImage: async (file: File, folder: string = 'articles') => {
    try {
      // Check if we have this file cached already using its name and size as unique identifier
      const fileId = `${file.name}-${file.size}-${file.lastModified}`;
      const cachedUrl = localStorage.getItem(`image_upload_${fileId}`);
      
      // If we have a cached URL for this exact file, return it immediately
      if (cachedUrl) {
        // Register the image in our registry
        registerImageLoad(cachedUrl);
        return { success: true, imageUrl: cachedUrl };
      }
      
      // Check if we're online
      if (!navigator.onLine) {
        // console.log('User is offline, saving image upload to IndexedDB for later processing');
        
        try {
          // Import the IndexedDB utility dynamically to prevent issues on initial load
          const { addPendingUpload, registerBackgroundSync } = await import('./indexedDB');
          
          // Add the upload to IndexedDB for processing when back online
          const uploadId = await addPendingUpload({
            file,
            fileName: file.name,
            mimeType: file.type,
            folder,
            headers: {
              'x-api-key': API_KEY,
              'x-timestamp': Date.now().toString(),
              'Authorization': '', // Will be filled when online
            }
          });
          
          // Register for background sync
          registerBackgroundSync();
          
          // For offline mode, we'll generate a temporary local URL
          // In a real app, you might want to read the file and store it in IndexedDB too
          const tempUrl = URL.createObjectURL(file);
          
          // Save reference to pending upload
          const pendingUploads = JSON.parse(localStorage.getItem('pending_uploads') || '[]');
          pendingUploads.push({
            id: uploadId,
            tempUrl,
            fileId,
            timestamp: Date.now()
          });
          localStorage.setItem('pending_uploads', JSON.stringify(pendingUploads));
          
          // Return the temporary URL with a flag indicating it's pending upload
          return { 
            success: true, 
            imageUrl: tempUrl,
            isPending: true,
            uploadId,
            offlineMode: true
          };
        } catch (offlineError) {
          // console.error('Failed to save for offline upload:', offlineError);
          throw new Error('Cannot upload image while offline');
        }
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', file, file.name);
      formData.append('folder', folder);
      
      // Use apiRequest but with special handling for form data
      const timestamp = Date.now().toString();
      const path = '/api/images/upload';
      const signature = generateSignature('POST', path, null, timestamp);
      
      let token = '';
      
      // Get authentication token if available
      if (typeof window !== 'undefined' && auth && auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (e) {
          // console.warn('Failed to get auth token:', e);
        }
      }
      
      // Show loading progress for better UX
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Add a timeout to abort the request if it takes too long
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'x-timestamp': timestamp,
          'x-signature': signature,
          'Authorization': token ? `Bearer ${token}` : '',
            'x-cache-control': 'max-age=31536000', // Tell server to add cache headers (1 year)
        },
          body: formData,
          signal
      });
        
        clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        // console.error(`Image upload failed: ${response.status}`, errorText);
        throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.imageUrl) {
        throw new Error('Invalid response from server');
      }
      
        // Cache the URL for this file to avoid re-uploading the same file
      if (data.imageUrl) {
          localStorage.setItem(`image_upload_${fileId}`, data.imageUrl);
          
          // Also preload the image to warm the browser cache
          const img = new Image();
          img.src = data.imageUrl;
          
          // Register the uploaded image in our registry
        registerImageLoad(data.imageUrl);
          
          // Also cache in IndexedDB for offline access if available
          try {
            const { saveImageCache } = await import('./indexedDB');
            saveImageCache({
              url: data.imageUrl,
              metadata: {
                originalName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                folder,
                uploadDate: new Date().toISOString()
              }
            });
          } catch (cacheError) {
            // console.warn('Failed to cache image in IndexedDB:', cacheError);
          }
      }
      
      return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      // console.error('Upload error:', error);
      throw error;
    }
  },
  
  // Export image registry utilities
  ...apiExtensions
};

export default api; 
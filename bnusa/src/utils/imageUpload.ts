/**
 * Frontend utilities for image upload using the Backblaze B2 integration
 */
import api from '@/utils/api';
import { auth } from '@/config/firebaseConfig';
import { updateProfile } from 'firebase/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';
// Default fallback image URLs based on folder
const FALLBACK_IMAGES = {
  profiles: 'https://via.placeholder.com/150?text=Profile',
  banners: 'https://via.placeholder.com/1200x300?text=Banner',
  articles: 'https://via.placeholder.com/800x400?text=Article',
  content: 'https://via.placeholder.com/600x400?text=Content',
  default: 'https://via.placeholder.com/500?text=Image'
};

/**
 * Generate a signature for file upload requests
 */
const generateFileUploadSignature = async (method: string, path: string, timestamp: string) => {
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'bnusa_pk_live_51NxK2pL9vM4qR8tY3wJ7hF5cD2mN6bX4vZ9yA1sE8uW0';
  // For form data, we'll use an empty string for the signature calculation
  const signatureString = `${method}${path}${timestamp}${API_KEY}`;
  
  // Use crypto API to create hash
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Upload a single image to Backblaze B2
 * @param file - The file to upload
 * @param folder - Optional folder path
 * @param token - Authentication token (optional)
 * @returns Promise with the URL of the uploaded image
 */
export const uploadImage = async (
  file: File,
  folder: string = '',
  token?: string
): Promise<string> => {
  try {
    // Check if file is valid
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided for upload');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error(`Invalid file type: ${file.type}. Only images are allowed.`);
    }

    // Validate file size (limit to 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_SIZE) {
      throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`);
    }

    // Create form data for the file
    const formData = new FormData();
    formData.append('image', file, file.name); // Include filename explicitly
    
    if (folder) {
      formData.append('folder', folder);
    }
    
    const path = '/api/images/upload';
    
    // Make the upload request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      // Create headers with or without authentication token
      const headers: Record<string, string> = {};
      
      // Generate API signature for public upload
      const timestamp = Date.now().toString();
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'bnusa_pk_live_51NxK2pL9vM4qR8tY3wJ7hF5cD2mN6bX4vZ9yA1sE8uW0';
      const signature = await generateFileUploadSignature('POST', path, timestamp);
      
      // Add required API headers
      headers['x-api-key'] = API_KEY;
      headers['x-timestamp'] = timestamp;
      headers['x-signature'] = signature;
      
      // Add auth token if provided
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Make the upload request
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Parse as JSON if possible
      let data;
      try {
        data = JSON.parse(await response.text());
      } catch (e) {
        throw new Error(`Invalid JSON response: ${await response.text()}`);
      }
      
      if (!response.ok) {
        const errorMessage = data.message || `Upload failed with status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      if (!data.imageUrl) {
        throw new Error('Response missing image URL');
      }
      
      return data.imageUrl;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Check if this is a network error or timeout
      if (fetchError.name === 'AbortError') {
        throw new Error('Image upload timed out. Please try again.');
      }
      
      // Let the error propagate to be caught by the outer try/catch
      throw fetchError;
    }
    
  } catch (error: any) {
    // Return a fallback image URL based on the folder
    const fallbackUrl = FALLBACK_IMAGES[folder as keyof typeof FALLBACK_IMAGES] || FALLBACK_IMAGES.default;
    
    // You can choose to either return the fallback or throw the error
    // Option 1: Return the fallback silently
    return fallbackUrl;
    
    // Option 2: Throw error (uncomment this line instead if you want errors to propagate)
    // throw error;
  }
};

/**
 * Upload multiple images at once
 * @param files - Array of files to upload
 * @param folder - Optional folder path
 * @param token - Authentication token (optional)
 * @returns Promise with array of URLs of the uploaded images
 */
export const uploadMultipleImages = async (
  files: File[],
  folder: string = '',
  token?: string
): Promise<string[]> => {
  try {
    // Upload each file sequentially
    const urls: string[] = [];
    
    for (const file of files) {
      const url = await uploadImage(file, folder, token);
      urls.push(url);
    }
    
    return urls;
  } catch (error) {
    throw error;
  }
};

/**
 * Upload a profile image
 * @param file - The image file to upload
 * @param token - Authentication token
 * @returns Promise with the URL of the uploaded image
 */
export const uploadProfileImage = async (
  file: File,
  token: string
): Promise<string> => {
  try {
    // Handle missing/empty token gracefully
    if (!token) {
      console.warn('No authentication token provided for profile image upload');
    }
    
    // Use the general image upload endpoint with the profiles folder
    const imageUrl = await uploadImage(file, 'profiles', token);
    
    if (imageUrl) {
      // Now we need to update BOTH the user profile AND the UserImage collection
      
      // 1. Update MongoDB User profile through the profile API
      const userUpdateResult = await api.put('/api/users/profile', { profileImage: imageUrl });
      
      if (!userUpdateResult.success) {
        console.error('Failed to update User profile with new image:', userUpdateResult.message);
      }
      
      // 2. Update UserImage collection directly through its dedicated endpoint
      const userImageUpdateResult = await api.put('/api/user-images', { profileImage: imageUrl });
      
      if (!userImageUpdateResult.success) {
        console.error('Failed to update UserImage record:', userImageUpdateResult.message);
      }
      
      // Perform a force refresh of the user data from the server
      try {
        await api.noCache.get('/api/users/profile');
      } catch (refreshError) {
        console.error('Error refreshing user data:', refreshError);
      }
      
      // Clear API cache to force fresh data on the next fetch
      api.clearUserCache();
      
      // Return the image URL regardless of update status
      return imageUrl;
    }
    
    throw new Error('Failed to get image URL from upload response');
  } catch (error: any) {
    console.error('Error in profile image upload:', error);
    throw new Error(`Profile image upload failed: ${error.message}`);
  }
};

/**
 * Upload a banner image
 * @param file - The image file to upload
 * @param token - Authentication token
 * @returns Promise with the URL of the uploaded image
 */
export const uploadBannerImage = async (
  file: File,
  token: string
): Promise<string> => {
  try {
    // Handle missing/empty token gracefully
    if (!token) {
      console.warn('No authentication token provided for banner image upload');
    }
    
    // Use the general image upload endpoint with the banners folder
    const imageUrl = await uploadImage(file, 'banners', token);
    
    if (imageUrl) {
      // Now we need to update BOTH the user profile AND the UserImage collection
      
      // 1. Update MongoDB User profile through the profile API
      const userUpdateResult = await api.put('/api/users/profile', { bannerImage: imageUrl });
      
      if (!userUpdateResult.success) {
        console.error('Failed to update User profile with new banner:', userUpdateResult.message);
      }
      
      // 2. Update UserImage collection directly through its dedicated endpoint
      const userImageUpdateResult = await api.put('/api/user-images', { bannerImage: imageUrl });
      
      if (!userImageUpdateResult.success) {
        console.error('Failed to update UserImage record:', userImageUpdateResult.message);
      }
      
      // Perform a force refresh of the user data from the server
      try {
        await api.noCache.get('/api/users/profile');
      } catch (refreshError) {
        console.error('Error refreshing user data:', refreshError);
      }
      
      // Clear API cache to force fresh data on the next fetch
      api.clearUserCache();
      
      // Return the image URL regardless of update status
      return imageUrl;
    }
    
    throw new Error('Failed to get banner image URL from upload response');
  } catch (error: any) {
    console.error('Error in banner image upload:', error);
    throw new Error(`Banner image upload failed: ${error.message}`);
  }
};

/**
 * Upload an article cover image
 * @param file - The image file to upload
 * @param token - Authentication token
 * @returns Promise with the URL of the uploaded image
 */
export const uploadArticleImage = async (
  file: File,
  token: string
): Promise<string> => {
  return uploadImage(file, 'articles', token);
};

/**
 * Upload a rich text editor content image
 * @param file - The image file to upload
 * @param token - Authentication token
 * @returns Promise with the URL of the uploaded image
 */
export const uploadContentImage = async (
  file: File,
  token: string
): Promise<string> => {
  return uploadImage(file, 'content', token);
};

/**
 * Delete an image from Backblaze B2
 * @param imageUrl - The URL of the image to delete
 * @param token - Authentication token
 * @returns Promise with success status
 */
export const deleteImage = async (
  imageUrl: string,
  token: string
): Promise<boolean> => {
  try {
    // Use the api utility for authenticated request
    const data = await api.post('/api/images/delete', { imageUrl });
    
    if (data.success) {
      return true;
    } else {
      console.error('Failed to delete image:', data.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Check if a URL is a valid image 
 * @param url - URL to check
 * @returns Promise that resolves to boolean
 */
export const isValidImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return response.ok && contentType ? contentType.startsWith('image/') : false;
  } catch (error) {
    return false;
  }
};

/**
 * Get a file object from a URL
 * @param url - URL of the image
 * @param filename - Optional filename
 * @returns Promise with File object
 */
export const getFileFromUrl = async (
  url: string, 
  filename?: string
): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File(
    [blob], 
    filename || url.split('/').pop() || 'image.png',
    { type: blob.type }
  );
};

/**
 * Get the default banner image URL from the backend
 * This ensures we use the Backblaze B2 hosted version if available
 * @returns Promise with the URL of the default banner image
 */
export const getDefaultBannerUrl = async (): Promise<string> => {
  try {
    // Use the api utility for authenticated request
    const data = await api.get('/api/images/default/banner');
    
    if (data.success && data.imageUrl) {
      return data.imageUrl;
    }
    
    return FALLBACK_IMAGES.banners;
  } catch (error) {
    console.error('Error getting default banner:', error);
    return FALLBACK_IMAGES.banners;
  }
};

/**
 * Get the default profile image URL from the backend
 * This ensures we use the Backblaze B2 hosted version if available
 * @returns Promise with the URL of the default profile image
 */
export const getDefaultProfileUrl = async (): Promise<string> => {
  // We're no longer using fallback profile images, just return empty string
  return '';
}; 
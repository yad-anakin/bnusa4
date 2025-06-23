/**
 * User API utilities for interacting with MongoDB backend
 * These replace Firestore operations with calls to our REST API
 */
import api from '@/utils/api';

/**
 * User profile structure from MongoDB
 */
export interface UserProfile {
  id: string;
  firebaseUid: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  profileImage?: string;
  bannerImage?: string;
  followers?: number;
  following?: number;
  joinDate?: string;
}

/**
 * Get API base URL from environment
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

/**
 * Gets the current user's profile from MongoDB
 */
export const getCurrentUserProfile = async (token: string): Promise<UserProfile> => {
  try {
    // Use the api utility with authentication
    const data = await api.get('/api/users/me');
    return data.user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Updates the user's profile in MongoDB
 */
export const updateUserProfile = async (token: string, profileData: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    // Use the api utility with authentication
    const data = await api.put('/api/users/profile', profileData);
    return data.user;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Check if a username is available
 */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    // Use the api utility
    const data = await api.get(`/api/users/username-available?username=${encodeURIComponent(username)}`);
    return data.available;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
};

/**
 * Helper function to upload an image
 */
export const uploadImage = async (token: string, file: File, type: 'profile' | 'banner'): Promise<string> => {
  try {
    // Create form data for the file
    const formData = new FormData();
    formData.append('image', file);
    
    console.log(`Uploading ${type} image`, { fileName: file.name, fileSize: file.size, fileType: file.type });
    
    // Get the appropriate endpoint
    const endpoint = type === 'profile' ? 'profile-image' : 'banner-image';
    const url = `/api/users/${endpoint}`;
    
    console.log(`Making upload request to: ${url}`);
    
    // Make the API request (for file uploads, we use a custom fetch with formData)
    // This is a special case where we can't use the api.post method directly
    // because it automatically stringifies the data
    
    // Create custom headers for this request
    const timestamp = Date.now().toString();
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'bnusa_pk_live_51NxK2pL9vM4qR8tY3wJ7hF5cD2mN6bX4vZ9yA1sE8uW0';
    
    // For form data, we'll use an empty string for the signature calculation
    // This matches what the backend is expecting for FormData
    const signatureString = `POST${url}${timestamp}${API_KEY}`;
    const signature = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(signatureString));
    
    // Convert the digest to a hex string
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}${url}`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'x-timestamp': timestamp,
        'x-signature': signatureHex
      },
      body: formData
    });
    
    console.log('Upload response status:', response.status);
    
    // Get the raw text first for debugging
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
    
    // Check if the response is successful
    if (!response.ok) {
      throw new Error(data.message || `Failed to upload ${type} image: ${response.statusText}`);
    }
    
    if (!data.imageUrl) {
      throw new Error(`Response missing image URL for ${type} image`);
    }
    
    console.log(`${type} image uploaded successfully:`, data.imageUrl);
    return data.imageUrl;
  } catch (error) {
    console.error(`Error uploading ${type} image:`, error);
    throw error;
  }
}; 
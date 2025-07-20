'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/ImageWithFallback';
import { uploadProfileImage, uploadBannerImage } from '@/utils/imageUpload';
import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from '@/components/auth/LogoutButton';
import api from '@/utils/api';
import { useToast } from '@/context/ToastContext';
import { updateProfile } from 'firebase/auth';

// Define types for user data
interface User {
  name: string;
  username: string;
  email: string;
  bio: string;
  profileImage: string;
  bannerImage: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  userImage?: {
    userId?: string;
    profileImage?: string;
    bannerImage?: string;
    lastUpdated?: string;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading, updateUserProfile } = useAuth();
  const { showToast } = useToast();
  
  // Form data state
  const [formData, setFormData] = useState<User>({
    name: '',
    username: '',
    email: '',
    bio: '',
    bannerImage: '/images/deafult-banner.jpg',
    profileImage: '/images/placeholders/avatar-default.png',
    socialMedia: {
      twitter: '',
      facebook: '',
      instagram: '',
      linkedin: '',
      github: '',
      website: ''
    }
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Fetch user data when component mounts
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/signin');
      return;
    }

    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        
        // Use a cache-friendly approach - don't force no-cache for initial load
        const data = await api.get('/api/users/profile');
        
        if (data.success && data.user) {
          // Fix typo in default banner image path
          setFormData({
            name: data.user.name || '',
            username: data.user.username || '',
            email: data.user.email || '',
            bio: data.user.bio || '',
            profileImage: data.user.profileImage || '/images/placeholders/avatar-default.png',
            bannerImage: data.user.bannerImage || '/images/default-banner.jpg',
            socialMedia: data.user.socialMedia || {
              twitter: '',
              facebook: '',
              instagram: '',
              linkedin: '',
              github: '',
              website: ''
            },
            userImage: data.user.userImage || {
              userId: '',
              profileImage: '',
              bannerImage: '',
              lastUpdated: ''
            }
          });
        }
      } catch (err) {
        setErrorMessage('کێشەیەک هەبوو لە وەرگرتنی زانیارییەکانت');
        showToast('error', 'کێشەیەک هەبوو لە وەرگرتنی زانیارییەکانت');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, authLoading, router, showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Check if this is a social media field
    if (name.startsWith('social_')) {
      const platform = name.replace('social_', '');
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [platform]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Function to handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profileImage' | 'bannerImage') => {
    const file = e.target.files?.[0];
    if (!file) {
      showToast('error', 'No file selected');
      return;
    }
    
    if (!currentUser) {
      showToast('error', 'You must be logged in to upload images');
      router.push('/signin');
      return;
    }
    
    try {
      setIsUploading(true);
      setErrorMessage('');
      
      // Use the utility function for uploads instead of manual implementation
      let uploadedImageUrl;
      if (type === 'profileImage') {
        uploadedImageUrl = await uploadProfileImage(file, await currentUser.getIdToken());
      } else {
        uploadedImageUrl = await uploadBannerImage(file, await currentUser.getIdToken());
      }
      
      // Update the form data with the new image URL
      setFormData(prev => ({
        ...prev,
        [type]: uploadedImageUrl
      }));
      
      // Also update userImage field to ensure it's shown in the UI
      if (type === 'profileImage') {
        setFormData(prev => ({
          ...prev,
          userImage: {
            ...(prev.userImage || {}),
            profileImage: uploadedImageUrl,
            lastUpdated: new Date().toISOString()
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          userImage: {
            ...(prev.userImage || {}),
            bannerImage: uploadedImageUrl,
            lastUpdated: new Date().toISOString()
          }
        }));
      }
      
      // Show success message
      setSuccessMessage(`وێنەی ${type === 'profileImage' ? 'کەسی' : 'بانەر'} بە سەرکەوتوویی باکرا.`);
      showToast('success', 'وێنە بە سەرکەوتوویی نوێکرایەوە');
      
      // Refresh the page data after a short delay to show the updated image
      setTimeout(() => {
        fetchUserProfile();
      }, 1000);
      
    } catch (error: any) {
      setErrorMessage(`کێشەیەک هەبوو لە باکردنی وێنەی ${type === 'profileImage' ? 'کەسی' : 'بانەر'}: ${error.message || 'Unknown error'}`);
      showToast('error', 'Error uploading image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Function to fetch the latest user profile data
  const fetchUserProfile = async () => {
    try {
      // Use noCache only when explicitly refreshing the profile
      api.clearCache();
      const userData = await api.get('/api/users/profile');
      
      if (userData.success && userData.user) {
        setFormData(prev => ({
          ...prev,
          name: userData.user.name || prev.name,
          username: userData.user.username || prev.username,
          email: userData.user.email || prev.email,
          bio: userData.user.bio || prev.bio,
          profileImage: userData.user.profileImage || prev.profileImage,
          bannerImage: userData.user.bannerImage || prev.bannerImage,
          socialMedia: userData.user.socialMedia || prev.socialMedia,
          userImage: userData.user.userImage || prev.userImage
        }));
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setErrorMessage('پێویستە چوونە ژوورەوە بکەیت بۆ نوێکردنەوەی زانیارییەکان');
      showToast('error', 'پێویستە چوونە ژوورەوە بکەیت بۆ نوێکردنەوەی زانیارییەکان');
      return;
    }
    
    try {
      setSuccessMessage('');
      setErrorMessage('');
      
      // CRITICAL: Update MongoDB first (this is the source of truth for user data)
      // Try up to 3 times to ensure the data is properly saved
      let mongoUpdateSuccess = false;
      let mongoResponse = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const data = await api.put('/api/users/profile', {
            name: formData.name,
            username: formData.username.startsWith('@') ? formData.username.substring(1) : formData.username,
            bio: formData.bio,
            socialMedia: formData.socialMedia,
            profileImage: formData.profileImage,
            bannerImage: formData.bannerImage
          });
          
          mongoResponse = data;
          
          if (data.success) {
            mongoUpdateSuccess = true;
            break;
          } else {
            if (attempt < 3) await new Promise(r => setTimeout(r, 500 * attempt));
          }
        } catch (err) {
          if (attempt < 3) await new Promise(r => setTimeout(r, 500 * attempt));
        }
      }
      
      if (!mongoUpdateSuccess) {
        throw new Error(mongoResponse?.message || 'Failed to update profile after multiple attempts');
      }
      
      // MongoDB update successful
      setSuccessMessage('زانیارییەکانت بە سەرکەوتوویی نوێ کرانەوە');
      showToast('success', 'زانیارییەکانت بە سەرکەوتوویی نوێ کرانەوە');
      
      // Force refresh API data
      api.clearCache();
      
      // Secondarily, try to update Firebase display name and photo
      // This is not critical for app function since Firebase is just for auth
      try {
        if (currentUser) {
          await updateProfile(currentUser, {
            displayName: formData.name,
            photoURL: formData.profileImage
          }).catch(err => {
            console.warn('Failed to update Firebase profile directly, but MongoDB was updated:', err);
          });
        }
      } catch (firebaseError) {
        console.warn('Failed to update Firebase profile, but MongoDB was updated:', firebaseError);
        // Continue execution - MongoDB update is what matters
        }
        
        // Redirect back to profile after a short delay
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
    } catch (error: any) {
      const errorMessage = `کێشەیەک هەبوو لە نوێکردنەوەی زانیارییەکان: ${error.message}`;
      setErrorMessage(errorMessage);
      showToast('error', errorMessage);
    }
  };

  const handleLogoutSuccess = () => {
    setToast({ 
      show: true, 
      message: 'Successfully logged out!', 
      type: 'success' 
    });
    
    // Small delay before redirect to show the success message
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getBannerImageUrl = (userData: any) => {
    if (!userData) return 'https://f005.backblazeb2.com/file/bnusa-images/banners/9935e1b6-4094-45b9-aafd-05ea6c6a1816.jpg';
    if (userData.userImage?.bannerImage) {
      return userData.userImage.bannerImage;
    }
    if (userData.bannerImage) {
      return userData.bannerImage;
    }
    // Fallback to the new Backblaze B2 default
    return 'https://f005.backblazeb2.com/file/bnusa-images/banners/9935e1b6-4094-45b9-aafd-05ea6c6a1816.jpg';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">ڕێکخستنەکانی هەژمار</h1>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            {/* Settings Navigation Sidebar */}
            <div className="w-full md:w-64 bg-white rounded-lg p-6 h-fit">
              <nav className="space-y-1">
                <a href="#profile-images" className="block px-3 py-2 rounded-md bg-blue-50 text-blue-700 font-medium">
                  وێنەکان
                </a>
                <a href="#basic-info" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                  زانیاری بنەڕەتی
                </a>
                <a href="#social-media" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                  تۆڕی کۆمەڵایەتی
                </a>
                <a href="#account-actions" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                  کارەکانی هەژمار
                </a>
              </nav>
            </div>

            {/* Main Settings Content */}
            <div className="flex-1">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Profile Images Section */}
                <div id="profile-images" className="bg-white rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6">وێنەکان</h2>
                  
                  <div className="space-y-6">
                    {/* Profile Image */}
                    <div className="mb-10">
                      <h3 className="text-lg font-bold mb-4">وێنەی پرۆفایل</h3>
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white">
                          {isLoading ? (
                            <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                          ) : (
                            <ImageWithFallback
                              src={
                                formData.userImage?.profileImage && formData.userImage.profileImage.startsWith('https://')
                                  ? formData.userImage.profileImage
                                  : currentUser?.photoURL && currentUser.photoURL.startsWith('https://')
                                    ? currentUser.photoURL
                                    : formData.profileImage || '/images/placeholders/avatar-default.png'
                              }
                              alt={formData.name}
                              fill
                              style={{ objectFit: 'cover' }}
                              sizes="128px"
                              priority={true}
                              placeholderSize="avatar"
                              onLoadFailure={(err) => console.error('Failed to load profile image:', err)}
                            />
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'profileImage')}
                            className="hidden"
                            id="profile-image"
                          />
                          <label
                            htmlFor="profile-image"
                            className={`btn ${isUploading ? 'btn-disabled' : 'btn-outline'} py-2 px-4 cursor-pointer inline-block`}
                          >
                            {isUploading ? (
                              <span className="flex items-center">
                                <span className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                وێنە باردەکرێت...
                              </span>
                            ) : (
                              'گۆڕینی وێنەی کەسی'
                            )}
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Banner Image */}
                    <div className="mb-10">
                      <h3 className="text-lg font-bold mb-4">وێنەی بانەر</h3>
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative w-full h-36 rounded-lg overflow-hidden border-2 border-gray-200">
                          {isLoading ? (
                            <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                          ) : (
                            <ImageWithFallback
                              src={getBannerImageUrl(formData)}
                              alt="Banner"
                              fill
                              style={{ objectFit: 'cover' }}
                              placeholderSize="banner"
                              withPattern={true}
                              sizes="(max-width: 768px) 100vw, 800px"
                              priority
                              onLoadFailure={(err) => console.error('Failed to load banner image:', err)}
                            />
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'bannerImage')}
                          className="hidden"
                          id="banner-image"
                        />
                        <label
                          htmlFor="banner-image"
                          className={`btn ${isUploading ? 'btn-disabled' : 'btn-outline'} py-2 px-4 cursor-pointer inline-block`}
                        >
                          {isUploading ? (
                            <span className="flex items-center">
                              <span className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                              وێنە باردەکرێت...
                            </span>
                          ) : (
                            'گۆڕینی وێنەی بانەر'
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
    
                {/* Basic Info Section */}
                <div id="basic-info" className="bg-white rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6">زانیاری بنەڕەتی</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-[var(--grey-dark)] mb-2">ناو</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:border-[var(--primary)] focus:outline-none"
                      />
                    </div>
    
                    <div>
                      <label htmlFor="username" className="block text-[var(--grey-dark)] mb-2">ناوی بەکارهێنەر</label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:border-[var(--primary)] focus:outline-none"
                      />
                    </div>
    
                    <div>
                      <label htmlFor="email" className="block text-[var(--grey-dark)] mb-2">ئیمەیل</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:border-[var(--primary)] focus:outline-none"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed. It's tied to your authentication account.</p>
                    </div>
    
                    <div>
                      <label htmlFor="bio" className="block text-[var(--grey-dark)] mb-2">دەربارە</label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-2 border rounded-md focus:border-[var(--primary)] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
    
                {/* Social Media Section */}
                <div id="social-media" className="bg-white rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6">تۆڕی کۆمەڵایەتی</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="social_twitter" className="block text-[var(--grey-dark)] mb-2">Twitter</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">@</span>
                        <input
                          type="text"
                          id="social_twitter"
                          name="social_twitter"
                          value={formData.socialMedia?.twitter || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 pl-8 border rounded-md focus:border-[var(--primary)] focus:outline-none"
                          placeholder="username"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="social_facebook" className="block text-[var(--grey-dark)] mb-2">Facebook</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">facebook.com/</span>
                        <input
                          type="text"
                          id="social_facebook"
                          name="social_facebook"
                          value={formData.socialMedia?.facebook || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 pl-28 border rounded-md focus:border-[var(--primary)] focus:outline-none"
                          placeholder="username"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="social_instagram" className="block text-[var(--grey-dark)] mb-2">Instagram</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">@</span>
                        <input
                          type="text"
                          id="social_instagram"
                          name="social_instagram"
                          value={formData.socialMedia?.instagram || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 pl-8 border rounded-md focus:border-[var(--primary)] focus:outline-none"
                          placeholder="username"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="social_linkedin" className="block text-[var(--grey-dark)] mb-2">LinkedIn</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">linkedin.com/in/</span>
                        <input
                          type="text"
                          id="social_linkedin"
                          name="social_linkedin"
                          value={formData.socialMedia?.linkedin || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 pl-32 border rounded-md focus:border-[var(--primary)] focus:outline-none"
                          placeholder="username"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="social_github" className="block text-[var(--grey-dark)] mb-2">GitHub</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">github.com/</span>
                        <input
                          type="text"
                          id="social_github"
                          name="social_github"
                          value={formData.socialMedia?.github || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 pl-24 border rounded-md focus:border-[var(--primary)] focus:outline-none"
                          placeholder="username"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="social_website" className="block text-[var(--grey-dark)] mb-2">Website</label>
                      <input
                        type="url"
                        id="social_website"
                        name="social_website"
                        value={formData.socialMedia?.website || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:border-[var(--primary)] focus:outline-none"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Account Actions Section */}
                <div id="account-actions" className="bg-white rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6">کارەکانی هەژمار</h2>
                  
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-3">سێشنەکان</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      ئێستا لەسەر ئەم ئامێرە چوویتە ژوورەوە. دەرچوون تەنها دەبێتە هۆی کۆتایی هاتنی سێشنەکەت لەسەر ئەم ئامێرە.
                    </p>
                    
                    <div className="p-4 bg-white border border-gray-200 rounded-md mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">ئامێری ئێستا</p>
                          <p className="text-sm text-gray-600">
                            وێبگەڕ • دوایین چالاکی ئێستا
                          </p>
                        </div>
                        <div className="text-green-600 text-sm font-medium">
                          چالاک
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Log Out Button */}
                  <div className="space-y-4">
                    <div>
                      <LogoutButton
                        variant="primary"
                        showIcon={true}
                        showConfirmation={true}
                        onLogoutSuccess={handleLogoutSuccess}
                        className="w-full justify-center py-3 text-base font-medium bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      />
                    </div>
                  </div>
                </div>
    
                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn btn-primary py-2 px-6"
                  >
                    نوێکردنەوەی زانیارییەکان
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-md ${
          toast.type === 'success' ? 'bg-green-500' : 
          toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white z-50 transition-opacity duration-300`}>
          {toast.message}
        </div>
      )}
    </div>
  );
} 
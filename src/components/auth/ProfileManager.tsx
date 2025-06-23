import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadImage, deleteImage } from '../../utils/imageUpload';
import api from '../../utils/api';

const ProfileManager: React.FC = () => {
  const { currentUser, updateUserProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPhotoPreview(currentUser.photoURL || null);
    }
  }, [currentUser]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Reset any previous upload errors
      setUploadError(null);
      
      // Validate file size before setting
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        setUploadError(`قەبارەی فایل زۆر گەورەیە (${(file.size / 1024 / 1024).toFixed(2)}MB). گەورەترین قەبارە 5MB یە.`);
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError(`جۆری فایل دروست نییە: ${file.type}. تەنها وێنە ڕێگەپێدراوە.`);
        return;
      }
      
      setPhotoFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    // Clear any previous messages
    setMessage('');
    setIsSuccess(false);
    
    // Validate display name
    if (!displayName.trim()) {
      setMessage('ناوی پیشاندان نابێت بەتاڵ بێت');
      setIsSuccess(false);
      return;
    }
    
    try {
      setLoading(true);
      
      let photoURL = currentUser.photoURL || '';
      let usedFallbackImage = false;
      let imageUpdated = false;
      
      // If a new photo was selected, upload it
      if (photoFile) {
        try {
          console.log('ئامادەکردن بۆ بارکردنی وێنەی پرۆفایل');
          // Get auth token for the API request
          const token = await currentUser.getIdToken();
          
          // Upload the new photo
          console.log('دەستپێکردنی بارکردنی وێنە');
          photoURL = await uploadImage(photoFile, 'profiles', token);
          console.log('وێنە بە سەرکەوتوویی بارکرا:', photoURL);
          imageUpdated = true;
          
          // Check if we got a fallback image (placeholder URL)
          if (photoURL.includes('placeholder.com')) {
            usedFallbackImage = true;
            console.log('بەکارهێنانی وێنەی ڕێگری بەهۆی کێشەی بارکردن');
          } else {
            // If we had a previous photo and it's from our domain, delete it
            if (currentUser.photoURL && currentUser.photoURL.includes('bnusa-images')) {
              try {
                await deleteImage(currentUser.photoURL, token);
                console.log('وێنەی کۆن بە سەرکەوتوویی سڕایەوە');
              } catch (deleteError) {
                console.error('هەڵە لە سڕینەوەی وێنەی کۆن:', deleteError);
                // Continue even if delete fails
              }
            }
          }
        } catch (uploadError: any) {
          console.error('هەڵە لە بارکردنی وێنەی پرۆفایل:', uploadError);
          setMessage(`سەرکەوتوو نەبوو لە بارکردنی وێنەی پرۆفایل: ${uploadError.message || 'هەڵەی نەناسراو'}`);
          setIsSuccess(false);
          setLoading(false);
          return; // Stop the submission if photo upload fails
        }
      }
      
      // Update the user profile
      await updateUserProfile(displayName, photoURL);
      
      if (usedFallbackImage) {
        setMessage("پرۆفایل نوێکرایەوە، بەڵام وێنەکە نەتوانرا بۆ سێرڤەرەکانمان باربکرێت. وێنەیەکی کاتی بەکارهێنراوە.");
      } else {
        setMessage('پرۆفایل بە سەرکەوتوویی نوێکرایەوە!');
      }
      setIsSuccess(true);
      
      // If profile image was updated, force refresh after a delay
      if (photoFile) {
        setTimeout(async () => {
          setRedirecting(true);
          setMessage('دووبارە بارکردنەوەی زانیاریەکان...');
          try {
            // Force refresh user data from server
            await api.forceRefreshUserData();
            // Navigate to profile with a timestamp to prevent caching
            window.location.href = `/profile?refresh=${Date.now()}`;
          } catch (error) {
            console.error('Error refreshing before redirect:', error);
            // Redirect anyway even if refresh fails
            window.location.href = `/profile?refresh=${Date.now()}`;
          }
        }, 1500);
      }
    } catch (error: any) {
      console.error('هەڵە لە نوێکردنەوەی پرۆفایل:', error);
      setIsSuccess(false);
      setMessage('سەرکەوتوو نەبوو لە نوێکردنەوەی پرۆفایل: ' + (error.message || 'هەڵەی نەناسراو'));
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div className="text-center text-[var(--grey-dark)] py-8">پێویستە بچیتە ژوورەوە بۆ بینینی ئەم پەڕەیە.</div>;
  }

  return (
    <div className="w-full bg-white rounded-xl">
      <h2 className="text-2xl font-bold mb-6 text-[var(--primary)] text-right">پرۆفایلەکەت</h2>

      {message && (
        <div
          className={`${
            isSuccess ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'
          } px-4 py-3 rounded-lg mb-6 border text-right`}
          role="alert"
        >
          <span className="block sm:inline">{message}</span>
          {redirecting && (
            <div className="mt-2 flex justify-center">
              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col items-center mb-4">
          <div className="relative w-24 h-24 mb-3">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="پێشبینینی پرۆفایل"
                className="w-24 h-24 rounded-full object-cover border-2 border-[var(--grey-light)]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[var(--grey-light)] flex items-center justify-center text-[var(--grey-dark)]">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
            
            <label
              htmlFor="photo-upload"
              className="absolute bottom-0 right-0 bg-[var(--primary)] rounded-full p-1 text-white cursor-pointer hover:bg-[var(--primary-dark)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              disabled={loading}
            />
          </div>
          {uploadError ? (
            <p className="text-sm text-red-600 mb-2 text-center">{uploadError}</p>
          ) : (
            <p className="text-sm text-[var(--grey-dark)] text-center">کرتە لەسەر ئایکۆنی کامێرا بکە بۆ نوێکردنەوەی وێنەکەت</p>
          )}
          <p className="text-xs text-[var(--grey-dark)] text-center">گەورەترین قەبارە: 5MB</p>
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-[var(--grey-dark)] mb-1 text-right">
            ناوی پیشاندان
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 border border-[var(--grey-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent transition-all text-right"
            disabled={loading}
            required
            dir="rtl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--grey-dark)] mb-1 text-right">ئیمەیل</label>
          <div className="px-4 py-3 border border-[var(--grey-light)] rounded-lg bg-gray-50 text-[var(--grey-dark)] text-right" dir="rtl">
            {currentUser.email}
          </div>
          <p className="mt-1 text-xs text-[var(--grey-dark)] text-right">ئیمەیل ناتوانرێت بگۆڕدرێت</p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || redirecting}
            className={`w-full py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-colors ${
              loading || redirecting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'نوێدەکرێتەوە...' : redirecting ? 'دووبارە باردەکرێتەوە...' : 'نوێکردنەوەی پرۆفایل'}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-4 border-t border-[var(--grey-light)]">
        <button
          onClick={() => signOut()}
          className="w-full py-3 px-4 border border-[var(--grey-light)] rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          دەرچوون
        </button>
      </div>
    </div>
  );
};

export default ProfileManager; 
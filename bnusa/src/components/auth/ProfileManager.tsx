import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadImage, deleteImage } from '../../utils/imageUpload';
import api from '../../utils/api';
import { useRouter } from 'next/navigation';

const ProfileManager: React.FC = () => {
  const { currentUser, updateUserProfile, signOut } = useAuth();
  const router = useRouter();
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

  // Profile editing is disabled - removed handlePhotoChange and handleSubmit functions

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

      <div className="space-y-5">
        <div className="flex flex-col items-center mb-4">
          <div className="relative w-24 h-24 mb-3">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="وێنەی پرۆفایل"
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
          </div>
          <p className="text-sm text-[var(--grey-dark)] text-center">وێنەی پرۆفایل</p>
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-[var(--grey-dark)] mb-1 text-right">
            ناوی پیشاندان
          </label>
          <div className="px-4 py-3 border border-[var(--grey-light)] rounded-lg bg-gray-50 text-[var(--grey-dark)] text-right" dir="rtl">
            {displayName || 'هیچ ناوێک دانەمەزراوە'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--grey-dark)] mb-1 text-right">ئیمەیل</label>
          <div className="px-4 py-3 border border-[var(--grey-light)] rounded-lg bg-gray-50 text-[var(--grey-dark)] text-right" dir="rtl">
            {currentUser.email}
          </div>
          <p className="mt-1 text-xs text-[var(--grey-dark)] text-right">ئیمەیل ناتوانرێت بگۆڕدرێت</p>
        </div>

        <div className="pt-4">
          <div className="w-full py-3 px-4 border border-[var(--grey-light)] rounded-lg text-sm font-medium text-[var(--grey-dark)] bg-gray-50 text-center">
            دەتوانیت زانیاریەکانت لە ڕێکخستنەکاندا بگۆڕیت
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-[var(--grey-light)]">
        <button
          onClick={async () => { await signOut(); router.push('/signin'); }}
          className="w-full py-3 px-4 border border-[var(--grey-light)] rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          دەرچوون
        </button>
      </div>
    </div>
  );
};

export default ProfileManager; 
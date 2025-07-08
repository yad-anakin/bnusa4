import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { generateProfileImage } from '@/utils/profileImageGenerator';
import api from '@/utils/api';

const SignInForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setErrorMessage('تکایە ئیمەیل و وشەی نهێنی بنووسە');
      return;
    }
    
    try {
      setLoading(true);
      setErrorMessage('');
      await signIn(email, password);
      router.push('/dashboard'); // Redirect to dashboard after sign in
    } catch (error: any) {
      console.error('Sign in error:', error);
      setErrorMessage(
        error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
          ? 'ئیمەیل یان وشەی نهێنی هەڵەیە'
          : error.code === 'auth/too-many-requests'
          ? 'هەوڵی زۆردان بۆ چوونە ژوورەوە. تکایە دواتر هەوڵبدەوە'
          : 'نەتوانرا بچیتە ژوورەوە. تکایە دووبارە هەوڵبدەوە'
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper function to update profile image in MongoDB
  const updateProfileImageInDB = async (user: any, profileImageUrl: string) => {
    try {
      await api.post('/api/users/profile', {
        name: user.displayName || '',
        profileImage: profileImageUrl,
      });
      // console.log('Saved profile image to MongoDB');
    } catch (err) {
      console.error('Failed to save profile image to database', err);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const result = await signInWithGoogle();
      
      // Check if user has a profile picture from Google
      if (result && result.user) {
        let profileUpdated = false;
        
        if (!result.user.photoURL) {
          // If not, generate and set our default profile image
          const profileImageUrl = generateProfileImage();
          try {
            await updateProfile(result.user, {
              photoURL: profileImageUrl
            });
            // console.log('Added default profile image for Google user');
            
            // Also update in MongoDB
            await updateProfileImageInDB(result.user, profileImageUrl);
            profileUpdated = true;
          } catch (err) {
            console.error('Failed to update Google user profile image', err);
          }
        }
        
        // Even if user has a Google profile photo, still make sure it's in MongoDB
        if (!profileUpdated && result.user.photoURL) {
          await updateProfileImageInDB(result.user, result.user.photoURL);
        }
      }
      
      router.push('/dashboard'); // Redirect to dashboard after sign in
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setErrorMessage(
        error.code === 'auth/popup-closed-by-user'
          ? 'چوونە ژوورەوە هەڵوەشێنرایەوە'
          : 'نەتوانرا بە Google بچیتە ژوورەوە. تکایە دووبارە هەوڵبدەوە'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-right" role="alert">
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--grey-dark)] mb-1 text-right">
            ئیمەیل
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-[var(--grey-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent transition-all text-right bg-[#f0f6ff]"
            placeholder="ئیمەیڵەکەت بنووسە"
            disabled={loading}
            required
            dir="rtl"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm">
              <Link href="/forgot-password" className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
                وشەی نهێنیت لەبیرچووە؟
              </Link>
            </div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--grey-dark)] text-right">
              وشەی نهێنی
            </label>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-[var(--grey-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent transition-all text-right bg-[#f0f6ff]"
            placeholder="وشەی نهێنی بنووسە"
            disabled={loading}
            required
            dir="rtl"
          />
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary-light)] border-[var(--grey-light)] rounded"
          />
          <label htmlFor="remember-me" className="mr-2 block text-sm text-[var(--grey-dark)]">
            لەبیرم بێت
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-colors ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'چاوەڕوانبە...' : 'چوونە ژوورەوە'}
          </button>
          <p className="mt-2 text-xs text-gray-500 text-right">دوای چوونە ژوورەوە ڕاستەوخۆ دەبرێیت بۆ داشبۆرد</p>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--grey-light)]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-[var(--grey-dark)]">یان بەردەوام بە بە</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full flex justify-center items-center py-3 px-4 border border-[var(--grey-light)] rounded-lg bg-white text-sm font-bold text-[var(--grey-dark)] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-light)] transition-all ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <svg className="h-5 w-5 ml-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Google
          </button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-[var(--grey-dark)]">
          هەژمارت نییە؟{' '}
          <Link href="/signup" className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors font-medium">
            هەژمار دروست بکە
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignInForm; 
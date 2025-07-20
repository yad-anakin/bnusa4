'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignInForm from '../../components/auth/SignInForm';
import { useAuth } from '../../contexts/AuthContext';
import Image from 'next/image';

export default function SignInPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!loading && currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, loading, router]);

  // Don't render anything if still checking auth or if user is logged in
  if (loading || currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white px-4 sm:px-8 font-rabar">
      <div className="w-full h-full min-h-screen bg-white/80 rounded-none backdrop-blur-md flex flex-col items-center justify-center p-0">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-[var(--primary)] flex items-center justify-center gap-2">
            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            بەخێربێیتەوە
          </h1>
          <p className="text-[var(--grey-dark)] text-base">بۆ چوونە ژوورەوەی هەژمارەکەت، زانیارییەکانت بنووسە</p>
        </div>
        <div className="w-full max-w-md mx-auto">
          <SignInForm />
        </div>
      </div>
    </div>
  );
} 
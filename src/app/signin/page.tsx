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
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary-light)]/10 to-[var(--secondary-light)]/10 flex items-center justify-center px-4 sm:px-6 lg:px-8 font-rabar">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden md:flex">
        <div className="w-full p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-[var(--primary)]">بەخێر بگەڕێیتەوە</h1>
            <p className="text-[var(--grey-dark)]">بۆ چوونە ژوورەوەی هەژمارەکەت، زانیارییەکانت بنووسە</p>
          </div>
          <SignInForm />
        </div>
      </div>
    </div>
  );
} 
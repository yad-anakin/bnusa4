'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPasswordPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary-light)]/5 to-[var(--secondary-light)]/5">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          <p className="mt-4 text-[var(--grey-dark)]">چاوەڕوانبە...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary-light)]/10 to-[var(--secondary-light)]/10 flex items-center justify-center px-4 sm:px-6 lg:px-8 font-rabar">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden md:flex">
        <div className="w-full p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-[var(--primary)]">گەڕاندنەوەی وشەی نهێنی</h1>
            <p className="text-[var(--grey-dark)]">ئیمەیلەکەت بنووسە بۆ وەرگرتنی لینکی گەڕاندنەوە</p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
} 
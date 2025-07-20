'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignUpForm from '../../components/auth/SignUpForm';
import { useAuth } from '../../contexts/AuthContext';
import Image from 'next/image';

export default function SignUpPage() {
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
      <div className="w-full h-full min-h-screen bg-white/80 rounded-none backdrop-blur-md flex flex-col items-center justify-center p-0 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-[var(--primary)] flex items-center justify-center gap-2">
            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            بەشداربە لە بنووسە
          </h1>
          <p className="text-[var(--grey-dark)] text-base">هەژمارێک دروست بکە بۆ دەستپێکردن</p>
        </div>
        <div className="w-full max-w-md mx-auto">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
} 
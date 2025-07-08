'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ArticlesPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to publishes page
    router.push('/publishes');
  }, [router]);
  
  // Show minimal loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
            <p className="mt-4 text-[var(--grey-dark)]">گواستنەوە بۆ پەڕەی وتارەکان...</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
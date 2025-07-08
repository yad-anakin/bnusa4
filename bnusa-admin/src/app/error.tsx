'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated
    if (!isAuthenticated()) {
      // If not authenticated, redirect to login page with the current path
      const currentPath = window.location.pathname;
      router.replace(`/login?from=${encodeURIComponent(currentPath)}`);
    }
    
    // Log the error to an error reporting service
    console.error('Page error:', error);
  }, [error, router]);

  // Only show the error page if authenticated
  if (!isAuthenticated()) {
    return null; // Return nothing while redirecting
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-red-600">Something went wrong!</h1>
        <p className="mt-4 text-gray-600">
          An error occurred while loading this page.
        </p>
        <div className="mt-6 space-y-4">
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try again
          </button>
          <div>
            <Link
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Return to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
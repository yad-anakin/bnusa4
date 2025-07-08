'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('HomePage component mounted');
    
    try {
      // Short delay to ensure all JavaScript is loaded
      setTimeout(() => {
        // If user is authenticated, redirect to dashboard
        // Otherwise redirect to login
        const authenticated = isAuthenticated();
        console.log('Authentication check result:', authenticated);
        
        if (authenticated) {
          console.log('Redirecting to dashboard...');
          router.replace('/dashboard');
        } else {
          console.log('Redirecting to login...');
          router.replace('/login');
        }
        
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error('Error during authentication check:', err);
      setError('An error occurred. Please try refreshing the page.');
      setLoading(false);
    }
  }, [router]);

  // Show a loading indicator while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">BNUSA Admin</h1>
        <p className="text-gray-600 mb-4">Loading application...</p>
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show error if something went wrong
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">BNUSA Admin</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Return minimal content while redirecting to prevent any UI flashing
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">BNUSA Admin</h1>
      <p className="text-gray-600">Redirecting...</p>
    </div>
  );
} 
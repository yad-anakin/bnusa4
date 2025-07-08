'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { login, isAuthenticated } from '@/lib/auth';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptedRoute, setAttemptedRoute] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get the redirectUrl from the query params (the page the user was trying to access)
  const redirectPath = searchParams.get('from') || '/dashboard';

  useEffect(() => {
    // Store the attempted route for better UX messages
    if (redirectPath !== '/dashboard') {
      setAttemptedRoute(redirectPath);
    }
    
    // Check if already authenticated, redirect to original destination or dashboard
    if (isAuthenticated()) {
      router.replace(redirectPath);
    }

    // Fetch CSRF token from server
    fetch('/api/auth/csrf')
      .then(res => res.json())
      .then(data => {
        setCsrfToken(data.csrfToken);
      })
      .catch(err => {
        console.error('Failed to get CSRF token:', err);
        setError('Security initialization failed. Please try again.');
      });
  }, [redirectPath, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Pass CSRF token with login request
      const result = await login(identifier, password, csrfToken);

      if (result.success) {
        // Redirect to the original destination or dashboard
        router.replace(redirectPath);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            BNUSA Admin Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
          {attemptedRoute && (
            <div className="mt-2 text-center">
              <p className="text-sm text-red-600 font-medium">
                Authentication Required
              </p>
              <p className="text-xs text-gray-600">
                You need to log in to access: <span className="font-semibold">{decodeURI(attemptedRoute)}</span>
              </p>
            </div>
          )}
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Authentication Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="login-identifier" className="sr-only">
                Email or Username
              </label>
              <input
                id="login-identifier"
                name="identifier"
                type="text"
                autoComplete="username email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.trim())}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email or Username"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !csrfToken}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? 'Signing in...' : (csrfToken ? 'Sign in' : 'Initializing...')}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Only administrators with valid credentials can access this dashboard.
          </p>
        </div>
      </div>
    </div>
  );
} 
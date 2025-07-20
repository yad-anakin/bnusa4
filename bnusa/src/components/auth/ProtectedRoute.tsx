import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if not loading and no user
    if (!loading && !currentUser) {
      router.push('/signin');
    }
  }, [currentUser, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary-light)]/5 to-[var(--secondary-light)]/5 font-rabar">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          <p className="mt-4 text-[var(--grey-dark)]">پشکنینی دۆخی چوونە ژوورەوە...</p>
        </div>
      </div>
    );
  }

  // If not loading and we have a user, render the children
  return currentUser ? <>{children}</> : null;
};

export default ProtectedRoute; 
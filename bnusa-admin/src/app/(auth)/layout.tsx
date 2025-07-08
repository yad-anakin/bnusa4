'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toggle sidebar state
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  // Toggle mobile menu
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  useEffect(() => {
    // Check if the user is authenticated
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      
      if (!authenticated) {
        // Redirect to login page with the current path as the redirect target
        const currentPath = window.location.pathname;
        router.replace(`/login?from=${encodeURIComponent(currentPath)}`);
      } else {
        // User is authenticated, allow rendering the protected content
        setAuthorized(true);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Show nothing while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render the layout and children if authorized
  if (!authorized) {
    return null; // Render nothing while redirecting
  }

  // Render the authenticated layout with the page content
  return (
    <div className="min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} toggleMobileMenu={toggleMobileMenu} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} isMobileOpen={mobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 
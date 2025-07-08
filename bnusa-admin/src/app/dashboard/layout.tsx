'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Check for authentication and admin role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const userStr = localStorage.getItem('adminUser');
        
        if (!token || !userStr) {
          router.push('/login');
          return;
        }
        
        // Parse the user object
        const user = JSON.parse(userStr);
        
        // Verify the user has admin role
        if (user.role !== 'admin') {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/login');
          return;
        }
        
        setUser(user);
        setIsLoading(false);
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return <>{children}</>;
} 
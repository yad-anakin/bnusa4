import React from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin } from '../api';
import { logout as authLogout } from '../auth';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

interface AuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: () => boolean;
}

export default function useAuth(): AuthReturn {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  // Check if user is logged in on mount
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
          setUser(null);
          return;
        }
        
        // In a real app, you'd verify the token with the server here
        // For now, we'll just assume it's valid if it exists
        
        // Check if we have user data in localStorage
        const userData = localStorage.getItem('adminUser');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Authentication error');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<LoginResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiLogin(username, password);
      
      // Save token and user data
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('adminUser', JSON.stringify(response.user));
      
      setUser(response.user);
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    // First update local state
    setUser(null);
    
    // Then call the improved logout function
    // This will handle clearing localStorage and redirecting
    authLogout(true);
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin,
  };
} 
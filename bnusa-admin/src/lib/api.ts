import crypto from 'crypto';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api';

interface RequestOptions extends RequestInit {
  body?: any;
  headers?: Record<string, string>;
}

// Types
interface PaginationResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  profileImage?: string;
  role: string;
  active: boolean;
  articles: string[];
  createdAt: string;
}

interface Article {
  _id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  categories: string[];
  tags: string[];
  author: {
    _id: string;
    name: string;
    username: string;
  };
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
}

interface Settings {
  maintenance: boolean;
  allowNewRegistrations: boolean;
  allowNewArticles: boolean;
  featuredCategories: string[];
  siteTitle: string;
  contactEmail: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

/**
 * Generate request signature for API authentication
 */
const generateSignature = (method: string, path: string, body: any, timestamp: string): string => {
  const signatureString = `${method}${path}${JSON.stringify(body || '')}${timestamp}${API_KEY}`;
  return crypto.createHash('sha256').update(signatureString).digest('hex');
};

/**
 * Make an authenticated API request
 */
const apiRequest = async (
  endpoint: string,
  options: RequestOptions = {}
): Promise<any> => {
  const method = options.method || 'GET';
  const timestamp = Date.now().toString();
  
  // Generate signature
  const signature = generateSignature(
    method,
    endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
    options.body,
    timestamp
  );

  // Get authentication token if available
  let authHeader = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) {
      authHeader = { Authorization: `Bearer ${token}` };
    }
  }

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY || '',
    'x-timestamp': timestamp,
    'x-signature': signature,
    ...authHeader,
    ...options.headers,
  };

  // Prepare request options
  const requestOptions: RequestOptions = {
    ...options,
    method,
    headers,
    credentials: 'include',
  };

  // Add body if present
  if (options.body) {
    requestOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
    const data = await response.json();

    if (!response.ok) {
      // Handle unauthorized errors
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
      }
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * API utility functions for different request types
 */
const api = {
  get: (endpoint: string, options: RequestOptions = {}) =>
    apiRequest(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, body: any, options: RequestOptions = {}) =>
    apiRequest(endpoint, { ...options, method: 'POST', body }),

  put: (endpoint: string, body: any, options: RequestOptions = {}) =>
    apiRequest(endpoint, { ...options, method: 'PUT', body }),

  delete: (endpoint: string, options: RequestOptions = {}) =>
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

// Export API functions using the secure client
export const fetchUsers = async (page = 1, limit = 10, search = ''): Promise<{ users: User[], pagination: PaginationResponse }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (search) {
    params.append('search', search);
  }
  
  return api.get(`/admin/users?${params.toString()}`);
};

export const fetchArticles = async (page = 1, limit = 10, search = ''): Promise<{ articles: Article[], pagination: PaginationResponse }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (search) {
    params.append('search', search);
  }
  
  return api.get(`/admin/articles?${params.toString()}`);
};

export const fetchSettings = async (): Promise<Settings> => {
  return api.get('/admin/settings');
};

export const updateSettings = async (settings: Partial<Settings>): Promise<Settings> => {
  return api.put('/admin/settings', settings);
};

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  return api.post('/admin/login', { username, password });
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  return api.put(`/admin/users/${userId}`, userData);
};

export const deleteArticle = async (articleId: string): Promise<{ success: boolean, message: string }> => {
  return api.delete(`/admin/articles/${articleId}`);
};

// Export the secure API client
export default api; 
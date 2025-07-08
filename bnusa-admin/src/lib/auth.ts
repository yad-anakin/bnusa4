/**
 * Authentication helper functions
 */

/**
 * Parse JWT token without verification
 * Only used for simple client-side role checks
 */
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT', e);
    return null;
  }
}

/**
 * Check if the user is authenticated and has admin role
 * This is a client-side check that verifies if the user has a valid session
 * 
 * @returns boolean indicating if the user is authenticated and is an admin
 */
export function isAuthenticated(): boolean {
  // In a real implementation, this would check for a valid auth token or session
  if (typeof window !== 'undefined') {
    console.log('Checking authentication status...');
    
    // Check for both possible token keys for backward compatibility
    const authToken = localStorage.getItem('authToken');
    const adminToken = localStorage.getItem('adminToken');
    const token = authToken || adminToken;
    
    console.log('Auth token exists:', !!token);
    
    if (!token) return false;
    
    // Parse token to check for admin role
    try {
      const payload = parseJwt(token);
      console.log('Token payload:', payload);
      
      if (!payload) {
        console.warn('Failed to parse token');
        return false;
      }
      
      // Verify role is admin
      if (payload.role !== 'admin') {
        console.warn('User does not have admin role');
        return false;
      }
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        console.warn('Token has expired');
        return false;
      }
      
      console.log('User is authenticated with admin role');
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }
  console.log('Window is undefined (server-side rendering)');
  return false;
}

/**
 * Log the user in
 * 
 * @param identifier User's email or username
 * @param password User's password
 * @param csrfToken CSRF token for security
 * @returns Promise that resolves to a success status and message
 */
export async function login(identifier: string, password: string, csrfToken: string): Promise<{ success: boolean; message: string }> {
  if (!identifier || !password || !csrfToken) {
    return { success: false, message: 'Email/username, password, and security token are required' };
  }

  try {
    console.log('Attempting login for:', identifier);
    
    // Sanitize inputs
    identifier = identifier.trim();

    // Determine if the identifier is an email or username
    const isEmail = identifier.includes('@');

    // Construct the request body
    const body = isEmail 
      ? { email: identifier, password, csrfToken }
      : { username: identifier, password, csrfToken };

    // Make API call to authenticate
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include' // Include cookies
    });

    // Parse the response
    const data = await response.json();
    console.log('Login response:', data);

    if (response.ok && data.success) {
      // Store the token in localStorage for client-side checks
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        // Store user data if available
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify(data.user));
        }
        console.log('Auth token stored successfully');
      }
      
      return { success: true, message: 'Login successful' };
    }
    
    return { success: false, message: data.message || 'Authentication failed' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An error occurred during authentication' };
  }
}

/**
 * Log the user out
 * 
 * @param redirect Whether to automatically redirect to login page
 * @returns Promise that resolves when logout is complete
 */
export async function logout(redirect: boolean = true): Promise<void> {
  console.log("Logging out user...");
  
  // Clear the token from both localStorage keys
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    // Clear any other auth-related items
    sessionStorage.removeItem('user');
    
    console.log("Auth tokens removed from localStorage");
  }
  
  try {
    // In a real implementation, this would make an API call to invalidate the session
    console.log("Calling logout API endpoint");
    await fetch('/api/auth/logout', {
      method: 'POST',
    });
    
    // Force redirect to login page to prevent dashboard loop
    if (redirect && typeof window !== 'undefined') {
      console.log("Redirecting to login page");
      
      // Use a small timeout to ensure state is cleared before redirect
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if API call fails, still redirect user
    if (redirect && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}

/**
 * Get the current authenticated user's token
 * @returns The JWT token or null if not authenticated
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Try authToken first, then adminToken
  const authToken = localStorage.getItem('authToken');
  const adminToken = localStorage.getItem('adminToken');
  
  return authToken || adminToken;
}

/**
 * Set the authentication token in localStorage
 * @param token The JWT token to store
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Store in both keys
  localStorage.setItem('authToken', token);
  localStorage.setItem('adminToken', token);
}

/**
 * Remove the authentication token from localStorage
 */
export function removeToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Remove from both keys
  localStorage.removeItem('authToken');
  localStorage.removeItem('adminToken');
} 
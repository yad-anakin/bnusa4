import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/csrf',
  '/_next',
  '/favicon.ico',
  '/images',
  '/assets',
];

// Function to check if a route is public
function isPublicRoute(path: string): boolean {
  return publicRoutes.some(route => path.startsWith(route));
}

// Function to check if a token is present in cookies or authorization header
function hasAuthToken(request: NextRequest): boolean {
  const authToken = request.cookies.get('authToken')?.value;
  const adminToken = request.cookies.get('adminToken')?.value;
  const authHeader = request.headers.get('authorization');
  
  return !!(authToken || adminToken || (authHeader && authHeader.startsWith('Bearer ')));
}

/**
 * Add security headers to the response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  const isDev = process.env.NODE_ENV !== 'production';
  const scriptPolicy = isDev 
    ? "'self' 'unsafe-inline' 'unsafe-eval'" 
    : "'self' 'unsafe-inline'";
  
  // Content Security Policy - Strict settings for admin dashboard
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src ${scriptPolicy}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://localhost:* http://localhost:* ${isDev ? 'ws:' : ''}; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none';`
  );
  
  // Prevent XSS attacks
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Strict Transport Security (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  
  // Referrer Policy - Stricter than before
  response.headers.set('Referrer-Policy', 'same-origin');
  
  // Permissions Policy (Feature Policy) - More comprehensive
  // Remove document-domain since it's causing a warning
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), accelerometer=(), autoplay=(), encrypted-media=(), fullscreen=(), gyroscope=(), magnetometer=(), midi=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), xr-spatial-tracking=()'
  );

  // Cache control for dynamic content
  if (!response.headers.has('Cache-Control')) {
    response.headers.set(
      'Cache-Control', 
      'no-store, max-age=0, must-revalidate'
    );
  }
  
  // Prevent caching of sensitive information
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip checking static files completely
  if (
    pathname.includes('/_next/') || 
    pathname.includes('/images/') || 
    pathname.includes('/assets/') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js')
  ) {
    // Even for static files, add security headers
    return addSecurityHeaders(NextResponse.next());
  }
  
  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }
  
  // Handle API routes differently - they should use our withAuth wrapper
  if (pathname.startsWith('/api/')) {
    // API routes will use the withAuth wrapper, but this catches any
    // potential routes that aren't properly protected
    if (!hasAuthToken(request)) {
      const response = NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
      return addSecurityHeaders(response);
    }
    return addSecurityHeaders(NextResponse.next());
  }
  
  // For browser routes, if no auth token, redirect immediately to login
  if (!hasAuthToken(request)) {
    // Redirect to login page with original URL as redirect parameter
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', encodeURI(pathname));
    
    // Use redirect instead of rewrite for immediate redirect without showing any UI
    const response = NextResponse.redirect(loginUrl);
    return addSecurityHeaders(response);
  }
  
  // User has authentication token, allow access
  return addSecurityHeaders(NextResponse.next());
}

// Match all routes except static assets and specific public routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. _next/static (static files)
     * 2. _next/image (image optimization files)
     * 3. favicon.ico, manifest.json, robots.txt (common public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt).*)',
  ],
}; 
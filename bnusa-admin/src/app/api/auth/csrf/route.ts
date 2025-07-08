import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateCSRFToken } from '@/lib/security';

/**
 * GET /api/auth/csrf
 * Generates a CSRF token and sets it as a cookie
 * Returns the token to the client to be included in forms
 */
export async function GET() {
  // Generate a new CSRF token
  const csrfToken = generateCSRFToken();
  
  // Store the token in an HttpOnly cookie
  cookies().set('csrfToken', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3600 // 1 hour
  });
  
  // Return the token to the client
  return NextResponse.json({
    csrfToken
  });
} 
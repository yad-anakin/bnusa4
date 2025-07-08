import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Handles user logout by invalidating the session
 */
export async function POST() {
  try {
    // In a more complex implementation, this would invalidate the token
    // in a database or token blacklist
    
    // Create a response object
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
    
    // Clear any auth cookies
    response.cookies.set('authToken', '', { 
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'strict'
    });
    
    response.cookies.set('auth', '', { 
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'strict'
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Error during logout' },
      { status: 500 }
    );
  }
} 
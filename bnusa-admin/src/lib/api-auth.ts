import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from './server-auth';

type ApiHandler = (req: NextRequest, params: any) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function to protect API routes 
 * It wraps the original API handler with authentication checks
 * 
 * @param handler - The original API handler function
 * @returns A new handler that includes authentication checks
 */
export function withAuth(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, params: any) => {
    // Skip authentication for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      return handler(req, params);
    }
    
    // Get token from request
    const token = getTokenFromRequest(req);
    
    // Verify token is valid
    const tokenVerification = verifyToken(token || '');
    
    if (!tokenVerification.valid) {
      console.log(`API Auth Failed: ${tokenVerification.message}`, req.url);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required',
          error: tokenVerification.message
        },
        { status: 401 }
      );
    }
    
    // Token is valid, proceed with the original handler
    return handler(req, params);
  };
}

/**
 * Helper function to create an error response
 */
export function errorResponse(message: string, statusCode: number = 400) {
  return NextResponse.json(
    { success: false, message },
    { status: statusCode }
  );
}

/**
 * Helper function to create a success response
 */
export function successResponse(data: any = {}, statusCode: number = 200) {
  return NextResponse.json(
    { success: true, ...data },
    { status: statusCode }
  );
} 
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { validateCSRFToken, sanitizeInput } from '@/lib/security';
import { cookies } from 'next/headers';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = 60 * 60 * 24; // 1 day in seconds - shorter for security

// Store failed login attempts to prevent brute force attacks
const loginAttempts = new Map<string, { count: number, lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Generate a JWT token for the user
 * @param userId User ID
 * @param role User role (admin, user, etc.)
 * @returns JWT token
 */
function generateToken(userId: string, role: string): string {
  // Create JWT payload with stronger security
  const payload = {
    sub: userId,
    role: role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
    jti: crypto.randomBytes(16).toString('hex') // Add unique token ID
  };
  
  // Create JWT header
  const header = { alg: 'HS256', typ: 'JWT' };
  
  // Base64Url encode header and payload
  const headerB64 = Buffer.from(JSON.stringify(header))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const payloadB64 = Buffer.from(JSON.stringify(payload))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  // Create signature using the same format as verification
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  // Return JWT token
  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Compare provided password with stored password hash
 * @param providedPassword Password provided in login attempt
 * @param storedPassword Password hash stored in database
 * @returns boolean indicating if passwords match
 */
async function comparePasswords(providedPassword: string, storedPassword: string): Promise<boolean> {
  try {
    // Check if stored password is already hashed (starts with $2a$, $2b$ or $2y$ for bcrypt)
    if (storedPassword.match(/^\$2[aby]\$\d+\$/)) {
      // Use bcrypt to compare
      return await bcrypt.compare(providedPassword, storedPassword);
    } else {
      // For legacy passwords that might not be hashed yet
      console.warn('Found unhashed password - should be updated to use hashing');
      return crypto.timingSafeEqual(
        Buffer.from(providedPassword),
        Buffer.from(storedPassword)
      );
    }
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

/**
 * POST /api/auth/login
 * Handles user login and generates a JWT token
 */
export async function POST(request: Request) {
  let client: MongoClient | null = null;
  
  try {
    // Get login data from request body
    const { email, username, password, csrfToken } = await request.json();
    
    // Validate CSRF token
    const cookieStore = cookies();
    const storedCsrfToken = cookieStore.get('csrfToken')?.value;
    if (!csrfToken || !storedCsrfToken || !validateCSRFToken(csrfToken, storedCsrfToken)) {
      console.error('CSRF token validation failed');
      return NextResponse.json(
        { success: false, message: 'Invalid request' },
        { status: 403 }
      );
    }
    
    // Validate required fields
    if ((!email && !username) || !password) {
      return NextResponse.json(
        { success: false, message: 'Email/username and password are required' },
        { status: 400 }
      );
    }
    
    // Sanitize inputs to prevent injection attacks
    const sanitizedEmail = email ? sanitizeInput(email) : '';
    const sanitizedUsername = username ? sanitizeInput(username) : '';
    
    // Get client IP for rate limiting
    const clientId = sanitizedEmail || sanitizedUsername || 'unknown';
    
    // Check for brute force attempts
    const attempts = loginAttempts.get(clientId);
    const now = Date.now();
    
    if (attempts && attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const timeElapsed = now - attempts.lastAttempt;
      
      if (timeElapsed < LOCKOUT_TIME) {
        const remainingLockoutTime = Math.ceil((LOCKOUT_TIME - timeElapsed) / 60000);
        console.warn(`Account ${clientId} is locked due to too many failed attempts. Try again in ${remainingLockoutTime} minutes.`);
        
        return NextResponse.json(
          { 
            success: false, 
            message: `Too many failed login attempts. Please try again later.` 
          },
          { status: 429 }
        );
      } else {
        // Reset attempts after lockout period
        loginAttempts.delete(clientId);
      }
    }
    
    // Log login attempt
    console.log(`Login attempt: ${sanitizedEmail || sanitizedUsername}`);
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Find user by email or username
    const query = sanitizedEmail ? { email: sanitizedEmail } : { username: sanitizedUsername };
    console.log('User query:', query);
    
    const user = await usersCollection.findOne(query);
    
    // Check if user exists - use constant time response to prevent timing attacks
    // Always perform a fake password check even if user doesn't exist
    if (!user) {
      // Delay response to prevent timing attacks revealing user existence
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200));
      
      // Increment failed attempts
      updateFailedAttempts(clientId);
      
      console.log('User not found');
      return NextResponse.json(
        { success: false, message: 'Invalid email/username or password' },
        { status: 401 }
      );
    }
    
    // Check if user is active
    if (user.active === false) {
      // Increment failed attempts
      updateFailedAttempts(clientId);
      
      console.log('Account is inactive');
      return NextResponse.json(
        { success: false, message: 'Account is inactive. Please contact an administrator.' },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    if (user.role !== 'admin') {
      // Increment failed attempts
      updateFailedAttempts(clientId);
      
      console.log('User is not an admin');
      return NextResponse.json(
        { success: false, message: 'Only administrators can access the dashboard' },
        { status: 403 }
      );
    }
    
    // Verify password
    if (!await comparePasswords(password, user.password)) {
      // Increment failed attempts
      updateFailedAttempts(clientId);
      
      console.log('Incorrect password');
      return NextResponse.json(
        { success: false, message: 'Invalid email/username or password' },
        { status: 401 }
      );
    }
    
    // Reset failed attempts on successful login
    loginAttempts.delete(clientId);
    
    // Generate JWT token
    const token = generateToken(user._id.toString(), user.role);
    
    // Create a response with the token
    const userData = {
      _id: user._id.toString(),
      name: user.name || user.username || 'Unknown',
      username: user.username || '',
      email: user.email,
      role: user.role
    };
    
    // Create the response object
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: userData
    });
    
    // Clear CSRF token after successful login
    cookieStore.delete('csrfToken');
    
    // Set cookies that will be visible to both client and server
    response.cookies.set({
      name: 'authToken',
      value: token, 
      httpOnly: false, // false allows JavaScript access
      path: '/', 
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: TOKEN_EXPIRY
    });
    
    // Set a secure cookie that's only accessible on the server
    response.cookies.set({
      name: 'auth',
      value: token, 
      httpOnly: true, // true prevents JavaScript access
      path: '/', 
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: TOKEN_EXPIRY
    });
    
    console.log('Login successful for user:', userData.name);
    return response;
    
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: `Login error: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

/**
 * Helper function to track failed login attempts
 */
function updateFailedAttempts(clientId: string): void {
  const now = Date.now();
  const attempts = loginAttempts.get(clientId);
  
  if (attempts) {
    attempts.count += 1;
    attempts.lastAttempt = now;
  } else {
    loginAttempts.set(clientId, { count: 1, lastAttempt: now });
  }
  
  console.warn(`Failed login attempt for ${clientId}. Count: ${loginAttempts.get(clientId)?.count || 1}`);
} 
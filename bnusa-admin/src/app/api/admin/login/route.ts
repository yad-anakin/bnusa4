import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

export async function POST(request: Request) {
  let client: MongoClient | null = null;
  
  try {
    console.log('Login API route called');
    
    // Parse request body
    const body = await request.json();
    const { email, password } = body;
    
    console.log(`Login attempt for email: ${email}`);
    console.log(`Database being used: ${DB_NAME}`);
    console.log(`JWT Secret length: ${JWT_SECRET.length} chars`);

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Find user by email
    console.log(`Looking for user with email: ${email}`);
    const user = await usersCollection.findOne({ email });
    
    // Check if user exists
    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log(`User found: ${user.name}, Role: ${user.role}`);
    
    // Check if the user is active
    if (!user.active) {
      return NextResponse.json(
        { success: false, message: 'Your account is inactive. Please contact the administrator.' },
        { status: 403 }
      );
    }
    
    // Check if user has admin role
    if (user.role !== 'admin') {
      console.log('User does not have admin role');
      return NextResponse.json(
        { message: 'Access denied. Only administrators can access the dashboard.' },
        { status: 403 }
      );
    }
    
    // Check password
    console.log('Verifying password');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Invalid password');
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create JWT token
    console.log('Creating JWT token');
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    
    console.log('Login successful');
    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error: any) {
    console.error('Login error:', error.message);
    console.error(error.stack);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  } finally {
    // Close the MongoDB connection
    if (client) {
      console.log('Closing MongoDB connection');
      await client.close();
    }
  }
} 
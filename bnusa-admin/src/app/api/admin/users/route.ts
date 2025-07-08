import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { withAuth, successResponse, errorResponse } from '@/lib/api-auth';
import { getToken } from '@/lib/auth';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';

// Helper to verify JWT token from headers
async function verifyToken(request: NextRequest) {
  // Get authorization header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  // Extract token
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return false;
  }
  
  try {
    // Here you would normally verify the token with JWT library
    // This is a simplified check - in a real app you'd decode and verify the token
    // For now, just check if a token exists
    return !!token;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

async function getUsers(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Verify token first
    const isAuthenticated = await verifyToken(request);
    if (!isAuthenticated) {
      return errorResponse('Unauthorized: Invalid or missing authentication token', 401);
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Build query
    let query: any = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build sort
    const sort: any = {};
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;
    
    // Get users with pagination and sorting
    const users = await usersCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .project({ password: 0 }) // Exclude password
      .toArray();
    
    // Get total count for pagination
    const total = await usersCollection.countDocuments(query);
    
    // Format users for frontend
    const formattedUsers = users.map(user => ({
      _id: user._id.toString(),
      name: user.name || 'Unknown',
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'user',
      active: user.active !== false, // Default to true if not specified
      createdAt: user.createdAt || new Date().toISOString()
    }));
    
    return successResponse({
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return errorResponse(`Error fetching users: ${error.message}`, 500);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Apply authentication protection to the users endpoint
export const GET = withAuth(getUsers);

// Create a new user (protected by auth)
async function createUser(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password) {
      return errorResponse('Email and password are required', 400);
    }
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: body.email });
    if (existingUser) {
      return errorResponse('User with this email already exists', 400);
    }
    
    // Create new user
    const newUser = {
      name: body.name || '',
      email: body.email,
      password: body.password, // In a real app, hash this password!
      role: body.role || 'user',
      createdAt: new Date().toISOString(),
      active: true
    };
    
    const result = await usersCollection.insertOne(newUser);
    
    return successResponse({
      message: 'User created successfully',
      userId: result.insertedId.toString()
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return errorResponse(`Error creating user: ${error.message}`, 500);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Apply authentication protection to the create user endpoint
export const POST = withAuth(createUser); 
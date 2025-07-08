import { NextResponse, NextRequest } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { withAuth, successResponse, errorResponse } from '@/lib/api-auth';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa'; // Use the correct database name from env

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

async function getDashboardData(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    console.log('Dashboard API route called');
    
    // Verify token first
    const isAuthenticated = await verifyToken(request);
    if (!isAuthenticated) {
      return errorResponse('Unauthorized: Invalid or missing authentication token', 401);
    }
    
    // Connect to MongoDB
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    const articlesCollection = db.collection('articles');
    
    // Get counts
    const totalUsers = await usersCollection.countDocuments();
    const totalArticles = await articlesCollection.countDocuments();
    const newUsers = await usersCollection.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
    });
    const newArticles = await articlesCollection.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
    });
    const pendingArticles = await articlesCollection.countDocuments({ status: 'pending' });
    
    // Get recent users
    const recentUsers = await usersCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .project({ password: 0 }) // Exclude password
      .toArray();
    
    // Get recent articles
    const recentArticles = await articlesCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
      
    // Format for frontend
    const formattedUsers = recentUsers.map(user => ({
      _id: user._id.toString(),
      name: user.name || user.username || 'Unknown',
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'user',
      createdAt: user.createdAt || new Date().toISOString()
    }));
    
    const formattedArticles = recentArticles.map(article => ({
      _id: article._id.toString(),
      title: article.title || 'Untitled',
      slug: article.slug || '',
      status: article.status || 'draft',
      createdAt: article.createdAt || new Date().toISOString(),
      author: {
        name: typeof article.author === 'object' ? article.author.name || 'Unknown' : 'Unknown',
        username: typeof article.author === 'object' ? article.author.username || '' : ''
      }
    }));
    
    // Return stats and recent data
    return successResponse({
      data: {
        stats: {
          totalUsers,
          totalArticles,
          newUsers,
          newArticles,
          pendingArticles
        },
        recentUsers: formattedUsers,
        recentArticles: formattedArticles
      }
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return errorResponse(`Error fetching dashboard data: ${error.message}`, 500);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Apply authentication protection to the dashboard endpoint
export const GET = withAuth(getDashboardData); 
import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';

// Helper function to connect to MongoDB
async function connectToMongoDB() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  // Calculate skip value for pagination
  const skip = (page - 1) * limit;
  
  let client: MongoClient | null = null;
  
  try {
    // Validate user ID
    if (!params.id || !ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    const userId = params.id;
    
    // Connect to MongoDB
    client = await connectToMongoDB();
    const db = client.db(DB_NAME);
    
    // Check if user exists
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get articles by this user
    const articlesCollection = db.collection('articles');
    
    // Fetch total articles count for this user
    const total = await articlesCollection.countDocuments({ author: new ObjectId(userId) });
    
    // Fetch articles with pagination
    const articlesCursor = articlesCollection
      .find({ author: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Convert MongoDB documents to plain objects and resolve ObjectIds
    const articlesData = await articlesCursor.toArray();
    
    const articles = await Promise.all(articlesData.map(async (article) => {
      // Ensure article has consistent format
      return {
        _id: article._id.toString(),
        title: article.title || '',
        slug: article.slug || '',
        content: article.content || '',
        excerpt: article.excerpt || '',
        coverImage: article.coverImage || '',
        categories: article.categories || [],
        tags: article.tags || [],
        published: article.published !== false,
        createdAt: article.createdAt || new Date().toISOString(),
        updatedAt: article.updatedAt || article.createdAt || new Date().toISOString(),
        authorName: user.name || user.username || 'Unknown Author'
      };
    }));
    
    // Create pagination data
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
    
    return NextResponse.json({
      success: true,
      articles,
      pagination,
      user: {
        _id: user._id.toString(),
        name: user.name || user.username || 'Unknown',
        username: user.username || '',
      }
    });
  } catch (error: any) {
    console.error('Error fetching user articles:', error);
    return NextResponse.json(
      { 
        success: false,
        message: `Error fetching user articles: ${error.message}` 
      },
      { status: 500 }
    );
  } finally {
    // Close the MongoDB connection
    if (client) {
      await client.close();
    }
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import { withAuth, successResponse, errorResponse } from '@/lib/api-auth';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa'; // Use the correct database name from env

async function getArticles(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || ''; // Add status parameter
  
  // Calculate skip value for pagination
  const skip = (page - 1) * limit;
  
  let client: MongoClient | null = null;
  
  try {
    console.log('Articles API route called');
    console.log(`Page: ${page}, Limit: ${limit}, Search: ${search}, Status: ${status}`);
    
    // Connect to MongoDB
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const articlesCollection = db.collection('articles');
    
    // Create query object
    const query: any = {};
    
    // Add search functionality if search parameter is provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add status filter if status parameter is provided
    if (status && ['published', 'pending', 'rejected', 'draft'].includes(status)) {
      query.status = status;
    }
    
    // Get total count for pagination with the current query
    const total = await articlesCollection.countDocuments(query);
    
    // Try different sort fields depending on the schema
    let sortField: any = { createdAt: -1 };
    
    // Check if any articles have createdAt field
    const hasCreatedAt = await articlesCollection.countDocuments({ createdAt: { $exists: true } });
    if (hasCreatedAt === 0) {
      // If no documents have createdAt, try publishedAt
      const hasPublishedAt = await articlesCollection.countDocuments({ publishedAt: { $exists: true } });
      if (hasPublishedAt > 0) {
        sortField = { publishedAt: -1 };
      } else {
        // If neither exists, don't sort
        sortField = {};
      }
    }
    
    // Get articles with pagination
    const articlesData = await articlesCollection
      .find(query)
      .sort(sortField)
      .skip(skip)
      .limit(limit)
      .toArray();
      
    // Map articles to consistent format for frontend
    const articles = await Promise.all(articlesData.map(async article => {
      // Handle different author formats (string ID or embedded object)
      let authorName = '';
      let authorUsername = '';
      
      if (article.author) {
        if (typeof article.author === 'object') {
          authorName = article.author.name || '';
          authorUsername = article.author.username || '';
        } else if (typeof article.author === 'string') {
          // Author is an ID, look up the user information
          try {
            const usersCollection = db.collection('users');
            if (ObjectId.isValid(article.author)) {
              const user = await usersCollection.findOne({ _id: new ObjectId(article.author) });
              if (user) {
                authorName = user.name || 'Unknown Author';
                authorUsername = user.username || 'unknown';
              } else {
                authorName = 'Unknown Author';
                authorUsername = 'unknown';
              }
            } else {
              authorName = 'Invalid Author ID';
              authorUsername = 'unknown';
            }
          } catch (err) {
            console.error(`Error looking up author with ID ${article.author}:`, err);
            authorName = 'Author ID: ' + article.author;
            authorUsername = 'unknown';
          }
        }
      }
      
      return {
        _id: article._id.toString(),
        title: article.title || 'Untitled',
        slug: article.slug || '',
        description: article.description || '',
        categories: Array.isArray(article.categories) ? article.categories : [],
        createdAt: article.createdAt || article.publishedAt || new Date().toISOString(),
        author: {
          name: authorName,
          username: authorUsername
        },
        status: article.status || 'published', // Default to published for legacy articles
        likes: typeof article.likes === 'number' ? article.likes : 
               (Array.isArray(article.likes) ? article.likes.length : 0),
        comments: typeof article.comments === 'number' ? article.comments : 
                 (Array.isArray(article.comments) ? article.comments.length : 0)
      };
    }));
    
    // Create pagination data
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
    
    return successResponse({
      articles,
      pagination
    });
  } catch (error: any) {
    console.error('Error fetching articles:', error.message);
    return errorResponse(`Error fetching articles: ${error.message}`, 500);
  } finally {
    // Close the MongoDB connection
    if (client) {
      await client.close();
    }
  }
}

// Apply authentication protection to the articles endpoint
export const GET = withAuth(getArticles); 
import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';

export async function GET(request: Request) {
  const articleId = '6809065bc0f07639bb9c2f9a'; // You can replace this with the actual ID
  let client: MongoClient | null = null;
  
  try {
    console.log(`Testing article retrieval with ID: ${articleId}`);
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const articlesCollection = db.collection('articles');
    
    // Get article by ID
    const article = await articlesCollection.findOne({ _id: new ObjectId(articleId) });
    
    if (!article) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }
    
    // Collect debug information
    const debugInfo = {
      id: article._id.toString(),
      title: article.title,
      hasYoutubeLinks: article.youtubeLinks !== undefined,
      hasResourceLinks: article.resourceLinks !== undefined,
      youtubeLinksType: article.youtubeLinks ? typeof article.youtubeLinks : 'undefined',
      resourceLinksType: article.resourceLinks ? typeof article.resourceLinks : 'undefined',
      youtubeLinksIsArray: article.youtubeLinks ? Array.isArray(article.youtubeLinks) : false,
      resourceLinksIsArray: article.resourceLinks ? Array.isArray(article.resourceLinks) : false,
      youtubeLinksLength: article.youtubeLinks && Array.isArray(article.youtubeLinks) ? article.youtubeLinks.length : 'n/a',
      resourceLinksLength: article.resourceLinks && Array.isArray(article.resourceLinks) ? article.resourceLinks.length : 'n/a',
      youtubeLinks: article.youtubeLinks,
      resourceLinks: article.resourceLinks,
      articleKeys: Object.keys(article)
    };
    
    return NextResponse.json({
      success: true,
      debugInfo: debugInfo
    });
  } catch (error: any) {
    console.error(`Error testing article ${articleId}:`, error.message);
    return NextResponse.json(
      { success: false, message: `Error: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
} 
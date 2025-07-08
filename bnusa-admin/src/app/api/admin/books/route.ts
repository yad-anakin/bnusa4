import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { withAuth, successResponse, errorResponse } from '@/lib/api-auth';

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';

// Helper function to connect to MongoDB
async function connectToMongoDB() {
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('Connected to MongoDB successfully');
  return client;
}

// GET handler for retrieving books with search, pagination, and filters
async function getBooks(request: NextRequest) {
  // Extract query parameters
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50); // Cap at 50
  const search = url.searchParams.get('search') || '';
  const genre = url.searchParams.get('genre') || '';
  const language = url.searchParams.get('language') || '';

  let client;
  try {
    // Connect to MongoDB
    client = await connectToMongoDB();
    const db = client.db(DB_NAME);
    const books = db.collection('books');

    // Build query
    const query: any = {};

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { writer: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add genre filter if provided
    if (genre) {
      query.genre = { $regex: new RegExp(genre, 'i') };
    }

    // Add language filter if provided
    if (language) {
      query.language = { $regex: new RegExp(language, 'i') };
    }

    // Count total documents for pagination
    const total = await books.countDocuments(query);

    // Calculate pages for pagination
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Fetch books with pagination
    const booksList = await books
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Return books with pagination info
    return successResponse({
      books: booksList,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    });
  } catch (error: any) {
    console.error('Error fetching books:', error);
    return errorResponse(error.message || 'Failed to fetch books', 500);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// POST handler for creating a new book
async function createBook(request: NextRequest) {
  let client;
  try {
    // Parse request body
    const bookData = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'writer', 'genre', 'year', 'description', 'image', 'downloadLink'];
    for (const field of requiredFields) {
      if (!bookData[field]) {
        return errorResponse(`Missing required field: ${field}`, 400);
      }
    }

    // Connect to MongoDB
    client = await connectToMongoDB();
    const db = client.db(DB_NAME);
    const books = db.collection('books');

    // Prepare book object
    const newBook = {
      ...bookData,
      downloads: 0,
      rating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert book
    const result = await books.insertOne(newBook);

    // Return success response
    return successResponse({
      message: 'Book created successfully',
      bookId: result.insertedId
    });
  } catch (error: any) {
    console.error('Error creating book:', error);
    return errorResponse(error.message || 'Failed to create book', 500);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Apply authentication protection to the endpoints
export const GET = withAuth(getBooks);
export const POST = withAuth(createBook); 
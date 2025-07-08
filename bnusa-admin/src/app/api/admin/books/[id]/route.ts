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

// GET handler for retrieving a single book by ID
async function getBook(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  try {
    // Connect to MongoDB
    client = await connectToMongoDB();
    const db = client.db(DB_NAME);
    const books = db.collection('books');

    // Validate ObjectId
    if (!ObjectId.isValid(params.id)) {
      return errorResponse('Invalid book ID', 400);
    }

    // Find the book
    const book = await books.findOne({ _id: new ObjectId(params.id) });

    if (!book) {
      return errorResponse('Book not found', 404);
    }

    // Return the book
    return successResponse({ book });
  } catch (error: any) {
    console.error('Error fetching book:', error);
    return errorResponse(error.message || 'Failed to fetch book', 500);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// PUT handler for updating a book
async function updateBook(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  try {
    // Validate ObjectId
    if (!ObjectId.isValid(params.id)) {
      return errorResponse('Invalid book ID', 400);
    }

    // Parse request body
    const bookData = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'writer', 'language', 'genre', 'year', 'description', 'image', 'downloadLink'];
    for (const field of requiredFields) {
      if (!bookData[field]) {
        return errorResponse(`Missing required field: ${field}`, 400);
      }
    }

    // Connect to MongoDB
    client = await connectToMongoDB();
    const db = client.db(DB_NAME);
    const books = db.collection('books');

    // Prepare update object
    const updateData = {
      ...bookData,
      updatedAt: new Date()
    };
    
    delete updateData._id; // Remove _id field if present

    // Update book
    const result = await books.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return errorResponse('Book not found', 404);
    }

    // Return success response
    return successResponse({ message: 'Book updated successfully' });
  } catch (error: any) {
    console.error('Error updating book:', error);
    return errorResponse(error.message || 'Failed to update book', 500);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// DELETE handler for removing a book
async function deleteBook(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  try {
    // Validate ObjectId
    if (!ObjectId.isValid(params.id)) {
      return errorResponse('Invalid book ID', 400);
    }

    // Connect to MongoDB
    client = await connectToMongoDB();
    const db = client.db(DB_NAME);
    const books = db.collection('books');

    // Delete the book
    const result = await books.deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount === 0) {
      return errorResponse('Book not found', 404);
    }

    // Return success response
    return successResponse({ message: 'Book deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting book:', error);
    return errorResponse(error.message || 'Failed to delete book', 500);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Apply authentication to all handlers
export const GET = withAuth(getBook);
export const PUT = withAuth(updateBook);
export const DELETE = withAuth(deleteBook); 
import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';

// GET a single user by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let client: MongoClient | null = null;
  
  try {
    // Validate user ID
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Find user by ID
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Don't return sensitive info like password
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        _id: userWithoutPassword._id.toString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json({
      success: false,
      message: `Error fetching user: ${error.message}`
    }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// PUT to update a user
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  let client: MongoClient | null = null;
  
  try {
    // Validate user ID
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }
    
    // Get update data from request body
    const updateData = await request.json();
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Create a valid MongoDB update object with only allowed fields
    const allowedFields = ['name', 'username', 'email', 'active', 'role', 'isWriter'];
    const validUpdateData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (field in updateData) {
        validUpdateData[field] = updateData[field];
      }
    }
    
    // If no valid fields were provided, return an error
    if (Object.keys(validUpdateData).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid fields to update'
      }, { status: 400 });
    }
    
    console.log(`Updating user ${userId} with:`, validUpdateData);
    
    // Update the user
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: validUpdateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      message: `Error updating user: ${error.message}`
    }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// DELETE a user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  let client: MongoClient | null = null;
  
  try {
    // Validate user ID
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    const articlesCollection = db.collection('articles');
    
    // Get the user first to check if it exists
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    console.log(`Deleting user: ${userId}`);
    
    // Delete the user
    const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Failed to delete user'
      }, { status: 500 });
    }
    
    // Update any articles by this user to mark them as orphaned
    await articlesCollection.updateMany(
      { 'author._id': userId },
      { $set: { 'author.deleted': true } }
    );
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      message: `Error deleting user: ${error.message}`
    }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
} 
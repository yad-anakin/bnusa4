import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';

async function connectToMongoDB() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client;
}

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  let client;
  try {
    const { slug } = params;
    client = await connectToMongoDB();
    const db = client.db(DB_NAME);
    const articles = db.collection('articles');

    // Try to find by slug (number as string)
    let article = await articles.findOne({ slug });

    // Fallback: if not found and slug looks like an ObjectId, try by _id
    if (!article && ObjectId.isValid(slug)) {
      article = await articles.findOne({ _id: new ObjectId(slug) });
    }

    if (!article) {
      return NextResponse.json({ success: false, message: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, article });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch article' }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
} 
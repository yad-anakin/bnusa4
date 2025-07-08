/**
 * Utility script to rebuild MongoDB text indexes
 * Run with: node utils/rebuildIndexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Article = require('../models/Article');
const Book = require('../models/Book');
const Writer = require('../models/Writer');
const User = require('../models/User');

async function rebuildIndexes() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bunsa';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');

    // Rebuild Article indexes
    console.log('\nRebuilding Article indexes...');
    await Article.collection.dropIndexes();
    console.log('Dropped existing Article indexes');
    
    // Create text index
    await Article.collection.createIndex(
      { 
        title: 'text', 
        description: 'text',
        categories: 'text'
      },
      {
        weights: {
          title: 10,
          description: 5,
          categories: 3
        },
        name: "article_search_index"
      }
    );
    console.log('Created Article text search index');
    
    // Create compound index for category and status filtering
    await Article.collection.createIndex({ categories: 1, status: 1 });
    console.log('Created Article category/status compound index');
    
    // Create slug index
    await Article.collection.createIndex({ slug: 1 }, { unique: true });
    console.log('Created Article slug index');

    // Rebuild Book indexes
    console.log('\nRebuilding Book indexes...');
    await Book.collection.dropIndexes();
    console.log('Dropped existing Book indexes');
    
    // Create text index for books
    await Book.collection.createIndex(
      { 
        title: 'text', 
        writer: 'text',
        description: 'text',
        genre: 'text'
      },
      {
        weights: {
          title: 10,
          writer: 8,
          genre: 5,
          description: 3
        },
        name: "book_search_index"
      }
    );
    console.log('Created Book text search index');
    
    // Create filter indexes for books
    await Book.collection.createIndex({ genre: 1 });
    await Book.collection.createIndex({ year: 1 });
    await Book.collection.createIndex({ featured: 1 });
    await Book.collection.createIndex({ slug: 1 }, { unique: true });
    console.log('Created Book filter indexes');

    // Rebuild Writer indexes
    console.log('\nRebuilding Writer indexes...');
    await Writer.collection.dropIndexes();
    console.log('Dropped existing Writer indexes');
    
    // Create text index for writers
    await Writer.collection.createIndex(
      { 
        bio: 'text',
        categories: 'text'
      },
      {
        weights: {
          bio: 5,
          categories: 10
        },
        name: "writer_search_index"
      }
    );
    console.log('Created Writer text search index');
    
    // Create filter indexes for writers
    await Writer.collection.createIndex({ featured: 1 });
    await Writer.collection.createIndex({ articlesCount: -1 });
    console.log('Created Writer filter indexes');

    // Rebuild User indexes
    console.log('\nRebuilding User indexes...');
    await User.collection.dropIndexes();
    console.log('Dropped existing User indexes');
    
    // Create text index for users
    await User.collection.createIndex(
      { 
        name: 'text',
        username: 'text',
        bio: 'text'
      },
      {
        weights: {
          username: 10,
          name: 8,
          bio: 5
        },
        name: "user_search_index"
      }
    );
    console.log('Created User text search index');
    
    // Create filter indexes for users
    await User.collection.createIndex({ isWriter: 1 });
    await User.collection.createIndex({ isSupervisor: 1 });
    await User.collection.createIndex({ isDesigner: 1 });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    console.log('Created User filter indexes');

    console.log('\nAll indexes rebuilt successfully');
    
    // List all indexes
    console.log('\nCurrent Article indexes:');
    const articleIndexes = await Article.collection.indexes();
    console.log(JSON.stringify(articleIndexes, null, 2));
    
    console.log('\nCurrent Book indexes:');
    const bookIndexes = await Book.collection.indexes();
    console.log(JSON.stringify(bookIndexes, null, 2));
    
    console.log('\nCurrent Writer indexes:');
    const writerIndexes = await Writer.collection.indexes();
    console.log(JSON.stringify(writerIndexes, null, 2));
    
    console.log('\nCurrent User indexes:');
    const userIndexes = await User.collection.indexes();
    console.log(JSON.stringify(userIndexes, null, 2));

  } catch (error) {
    console.error('Error rebuilding indexes:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the function
rebuildIndexes(); 
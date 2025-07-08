/**
 * Script to remove all books with a null slug
 * Run with: node backend/scripts/fix-book-slug.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('../models/Book');

async function fixBookSlug() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bunsa';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');

    // Remove all books with a null slug
    const result = await Book.deleteMany({ slug: null });
    console.log(`Removed ${result.deletedCount} books with null slug`);

    // Optionally, print a summary of slugs
    const nullSlugCount = await Book.countDocuments({ slug: null });
    const totalBooks = await Book.countDocuments();
    console.log(`Books with null slug after cleanup: ${nullSlugCount}`);
    console.log(`Total books remaining: ${totalBooks}`);

  } catch (error) {
    console.error('Error removing books with null slug:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

fixBookSlug(); 
/**
 * Script to remove the language field from all books
 * Run with: node backend/scripts/fix-book-language.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('../models/Book');

async function fixBookLanguage() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bunsa';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');

    // Remove the language field from all books
    const result = await Book.updateMany(
      { language: { $exists: true } },
      { $unset: { language: "" } }
    );
    console.log(`Removed language field from ${result.modifiedCount} books`);

    // Optionally, print a summary of language values
    const languageSummary = await Book.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } }
    ]);
    console.log('Language summary after update:', languageSummary);

  } catch (error) {
    console.error('Error updating book languages:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

fixBookLanguage(); 
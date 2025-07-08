const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// @route   GET /api/books
// @desc    Get all books (paginated)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 12, 50); // Cap at 50
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const genre = req.query.genre || '';
    const year = req.query.year || '';
    const language = req.query.language || '';
    const sort = req.query.sort || 'createdAt'; // Default sort by creation date

    // Build query
    const query = {};

    // Add search filter if provided
    if (search && search.trim() !== '') {
      // Use text index search for better performance
      query.$text = { $search: search.trim() };
    }

    // Add genre filter if provided
    if (genre && genre !== 'all') {
      query.genre = genre; // Using exact match since we have an index on genre
    }

    // Add year filter if provided
    if (year && year !== 'all') {
      query.year = parseInt(year);
    }

    // Add language filter if provided
    if (language && language !== 'all') {
      query.language = language; // Using exact match since we have an index on language
    }

    console.log('Query:', JSON.stringify(query));

    // Set up book query
    let bookQuery = Book.find(query);
    
    // Determine sort order
    if (search && search.trim() !== '') {
      // If searching, sort by text relevance score
      bookQuery = bookQuery
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      // Otherwise use requested sort option
      let sortOption = { createdAt: -1 }; // Default newest first
      
      if (sort === 'downloads') {
        sortOption = { downloads: -1 }; // Most downloads first
      } else if (sort === 'rating') {
        sortOption = { rating: -1 }; // Highest rating first
      } else if (sort === 'title') {
        sortOption = { title: 1 }; // Alphabetical by title
      } else if (sort === 'year') {
        sortOption = { year: -1 }; // Newest year first
      }
      
      bookQuery = bookQuery.sort(sortOption);
    }

    // Count total documents for pagination
    const total = await Book.countDocuments(query);

    // Calculate pages for pagination
    const pages = Math.ceil(total / limit);

    // Fetch books with pagination
    const books = await bookQuery
      .skip(skip)
      .limit(limit)
      .lean();

    // Get unique genres, years, and languages for dynamic filtering
    const uniqueGenres = await Book.distinct('genre');
    const uniqueYears = await Book.distinct('year');
    const uniqueLanguages = await Book.distinct('language');

    // Return books with pagination info and filter options
    return res.json({
      success: true,
      books,
      pagination: {
        total,
        page,
        limit,
        pages
      },
      filters: {
        genres: uniqueGenres,
        years: uniqueYears,
        languages: uniqueLanguages
      }
    });
  } catch (err) {
    console.error('Error fetching books:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to fetch books' 
    });
  }
});

// @route   GET /api/books/featured
// @desc    Get featured books
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const books = await Book.find({ 
      featured: true
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    res.json({
      success: true,
      count: books.length,
      books
    });
  } catch (err) {
    console.error('Error fetching featured books:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/books/:slugOrId
// @desc    Get book by slug or ID
// @access  Public
router.get('/:slugOrId', async (req, res) => {
  try {
    const slugOrId = req.params.slugOrId;
    console.log(`Finding book with slug or ID: ${slugOrId}`);
    
    // Try to find by slug first
    let book = await Book.findOne({ slug: slugOrId }).lean();
    
    // If not found by slug, try by ID
    if (!book && mongoose.Types.ObjectId.isValid(slugOrId)) {
      console.log(`Slug not found, trying by ID: ${slugOrId}`);
      book = await Book.findOne({ _id: slugOrId }).lean();
    }
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    // Increment download count if download parameter is present
    if (req.query.download === 'true') {
      await Book.findByIdAndUpdate(
        book._id,
        { $inc: { downloads: 1 } }
      );
    }
    
    res.json({
      success: true,
      book
    });
  } catch (err) {
    console.error('Error fetching book:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 
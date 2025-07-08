const express = require('express');
const ContentType = require('../models/ContentType');

const router = express.Router();

// @route   GET /api/content-types
// @desc    Get all content types
// @access  Public
router.get('/', async (req, res) => {
  try {
    const contentTypes = await ContentType.find().sort({ order: 1 });
    res.json({ 
      success: true, 
      count: contentTypes.length,
      contentTypes 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch content types',
      details: err.message
    });
  }
});

// @route   GET /api/content-types/:id
// @desc    Get content type by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const contentType = await ContentType.findOne({ id: req.params.id });
    
    if (!contentType) {
      return res.status(404).json({ 
        success: false, 
        error: 'Content type not found' 
      });
    }
    
    res.json({ 
      success: true, 
      contentType 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch content type',
      details: err.message
    });
  }
});

// @route   POST /api/content-types
// @desc    Create a new content type
// @access  Protected (would be admin only in a real app)
router.post('/', async (req, res) => {
  try {
    const { id, title, description, gradient, iconPath, iconStrokeWidth, order } = req.body;
    
    // Check if content type with this ID already exists
    const existingContentType = await ContentType.findOne({ id });
    if (existingContentType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Content type with this ID already exists' 
      });
    }
    
    // Create new content type
    const contentType = new ContentType({
      id,
      title,
      description,
      gradient,
      iconPath,
      iconStrokeWidth,
      order
    });
    
    await contentType.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Content type created successfully',
      contentType
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create content type',
      details: err.message
    });
  }
});

// @route   POST /api/content-types/seed
// @desc    Seed initial content types
// @access  Protected (would be admin only in a real app)
router.post('/seed', async (req, res) => {
  try {
    // First remove any existing content types to avoid duplicates
    await ContentType.deleteMany({});
    
    // Define initial content types
    const initialContentTypes = [
      {
        id: 'articles',
        title: 'وتار و لێکۆڵینەوە',
        description: 'وتاری درێژ و قووڵ و لێکۆڵینەوەی تایبەت لەسەر هەر بابەتێک کە حەز دەکەیت بنووسی.',
        gradient: 'from-blue-50 to-indigo-50 shadow-blue-200/20',
        iconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        order: 1
      },
      {
        id: 'stories',
        title: 'چیرۆک و داستان',
        description: 'بەهرە و ئەزموونی خۆت لە نووسینی چیرۆک و داستاندا پێشان بدە و بەشی بکە لەگەڵ خوێنەران.',
        gradient: 'from-purple-50 to-pink-50 shadow-purple-200/20',
        iconPath: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
        order: 2
      },
      {
        id: 'poems',
        title: 'شیعر و هۆنراوە',
        description: 'شیعر و هۆنراوەکانت بە شێوەیەکی جوان و ڕێکوپێک بڵاو بکەوە لەگەڵ ڕەنگ و دیزاینی تایبەت.',
        gradient: 'from-pink-50 to-rose-50 shadow-pink-200/20',
        iconPath: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2',
        order: 3
      },
      {
        id: 'analysis',
        title: 'شیکاری و بۆچوون',
        description: 'شیکاری و بۆچوونەکانت لەسەر بابەتە هەنووکەییەکان بنووسە و کاریگەری لەسەر کۆمەڵگاکەت دابنێ.',
        gradient: 'from-emerald-50 to-teal-50 shadow-emerald-200/20',
        iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        order: 4
      }
    ];
    
    // Insert the content types
    await ContentType.insertMany(initialContentTypes);
    
    res.json({ 
      success: true, 
      message: 'Content types seeded successfully',
      count: initialContentTypes.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to seed content types',
      details: err.message
    });
  }
});

module.exports = router; 
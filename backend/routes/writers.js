const express = require('express');
const router = express.Router();
const Writer = require('../models/Writer');
const User = require('../models/User');
const Article = require('../models/Article');
const auth = require('../middleware/auth');

// @route   GET /api/writers/stats/count
// @desc    Get total number of writers for statistics
// @access  Public
// @PUBLIC_ENDPOINT - This endpoint bypasses security middleware
router.get('/stats/count', async (req, res) => {
  try {
    // Count users with isWriter=true instead of counting Writer documents
    const count = await User.countDocuments({ isWriter: true });
    
    res.json({
      success: true,
      count
    });
  } catch (err) {
    console.error('Error counting writers:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/writers
// @desc    Get all writers (paginated)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    // Build query
    const query = {};
    
    // Add search filter if provided
    if (search && search.trim() !== '') {
      // We'll need to search across both Writer and User collections
      // First, find users matching the search term
      const users = await User.find({ $text: { $search: search.trim() } })
        .select('_id')
        .lean();
      
      const userIds = users.map(user => user._id);
      
      if (userIds.length > 0) {
        // If we found matching users, look for writers with those user IDs or matching bio/categories
        query.$or = [
          { user: { $in: userIds } },
          { $text: { $search: search.trim() } }
        ];
      } else {
        // Otherwise just search in writer fields
        query.$text = { $search: search.trim() };
      }
    }
    
    // Add category filter if provided
    if (category && category !== 'all') {
      query.categories = category;
    }
    
    console.log('Writer query:', JSON.stringify(query));
    
    // Set up writer query
    let writerQuery = Writer.find(query);
    
    // If searching, sort by relevance, otherwise by articlesCount
    if (search && search.trim() !== '') {
      writerQuery = writerQuery
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      writerQuery = writerQuery.sort({ articlesCount: -1 });
    }
    
    const writers = await writerQuery
      .skip(skip)
      .limit(limit)
      .populate('user', 'name username email profileImage bio bannerImage')
      .lean();
    
    const total = await Writer.countDocuments(query);
    
    res.json({
      success: true,
      count: writers.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      writers
    });
  } catch (err) {
    console.error('Error fetching writers:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/writers/featured
// @desc    Get featured writers for homepage
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const writers = await Writer.find({ featured: true })
      .sort({ articlesCount: -1 })
      .limit(limit)
      .populate('user', 'name username profileImage')
      .lean();
    
    res.json({
      success: true,
      count: writers.length,
      writers
    });
  } catch (err) {
    console.error('Error fetching featured writers:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/writers/:username
// @desc    Get writer profile by username
// @access  Public
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('name username profileImage');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Writer not found' });
    }
    
    const writer = await Writer.findOne({ user: user._id });
    
    if (!writer) {
      return res.status(404).json({ success: false, message: 'Writer profile not found' });
    }
    
    // Get writer's published articles
    const articles = await Article.find({
      author: user._id,
      status: 'published'
    })
      .sort({ createdAt: -1 })
      .select('title description slug categories createdAt')
      .lean();
    
    res.json({
      success: true,
      writer: {
        ...writer.toObject(),
        user,
        articles
      }
    });
  } catch (err) {
    console.error('Error fetching writer:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/writers/seed
// @desc    Seed writers for development
// @access  Public (should be protected in production)
router.post('/seed', async (req, res) => {
  try {
    // Get users to assign as writers
    const users = await User.find().limit(8);
    
    if (users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No users found. Please create users first.' 
      });
    }
    
    // Sample writers data
    const writersData = [
      {
        user: users[0]._id,
        bio: 'زانایەکی ژینگەیی کە جەخت لەسەر کشتوکاڵی بەردەوام و گۆڕانی کەش و هەوا لە کوردستان دەکات.',
        featured: true,
        articlesCount: 8,
        followers: 342,
        categories: ['ژینگە', 'زانست'],
        socialLinks: {
          twitter: 'https://twitter.com/azadkarim',
          facebook: 'https://facebook.com/azadkarim'
        }
      },
      {
        user: users[1]._id,
        bio: 'شارەزایی مۆسیقا و مێژووی کلتوور کە تایبەتمەندە لە مۆسیقای نەریتی کوردی و گەشەسەندنەکەی.',
        featured: true,
        articlesCount: 12,
        followers: 567,
        categories: ['مێژوو', 'هونەر'],
        socialLinks: {
          twitter: 'https://twitter.com/leilaahmed',
          instagram: 'https://instagram.com/leilaahmed'
        }
      },
      {
        user: users[2]._id,
        bio: 'پرۆفیسۆری فەلسەفە بە تایبەتمەندی لە فەلسەفەی ئیسلامی و کاریگەریەکەی لەسەر بیرکردنەوەی نوێ.',
        featured: true,
        articlesCount: 15,
        followers: 421,
        categories: ['فەلسەفە', 'مێژوو'],
        socialLinks: {
          linkedin: 'https://linkedin.com/in/darahassan',
          website: 'https://darahassan.com'
        }
      },
      {
        user: users[3]._id,
        bio: 'ڕەخنەگری ئەدەبی و نووسەر کە جەخت لەسەر ئەدەبی هاوچەرخی کوردی و نووسەرە نوێیەکان دەکات.',
        featured: false,
        articlesCount: 9,
        followers: 289,
        categories: ['ئەدەب'],
        socialLinks: {
          twitter: 'https://twitter.com/shirinbarzani',
          facebook: 'https://facebook.com/shirinbarzani'
        }
      },
      {
        user: users[4]._id,
        bio: 'ئافرێنەری بواری تەکنەلۆژیا و شیکەرەوە کە باس لە ئیکۆسیستەمی تەکنەلۆژیای گەشەسەندوو لە کوردستان و ڕۆژهەڵاتی ناوەڕاست دەکات.',
        featured: false,
        articlesCount: 6,
        followers: 312,
        categories: ['تەکنەلۆژیا'],
        socialLinks: {
          twitter: 'https://twitter.com/rebazali',
          linkedin: 'https://linkedin.com/in/rebazali'
        }
      },
      {
        user: users[5]._id,
        bio: 'مرۆڤناس و پارێزەری کلتووری کە پیشەی نەریتی کوردی و ڕێوڕەسمەکان دۆکیومێنت دەکات.',
        featured: true,
        articlesCount: 11,
        followers: 378,
        categories: ['هونەر', 'مێژوو'],
        socialLinks: {
          instagram: 'https://instagram.com/narinrashid',
          facebook: 'https://facebook.com/narinrashid'
        }
      }
    ];
    
    // Delete existing writers if any
    await Writer.deleteMany({});
    
    // Insert new writers
    await Writer.insertMany(writersData);
    
    res.json({
      success: true,
      message: 'Writers seeded successfully',
      count: writersData.length
    });
  } catch (err) {
    console.error('Error seeding writers:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 
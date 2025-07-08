const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Article = require('../models/Article');
const verifyFirebaseToken = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const mongoose = require('mongoose');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const Writer = require('../models/Writer');

// Apply both middlewares for all admin routes
router.use(verifyFirebaseToken, isAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard stats
 * @access  Admin only
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Gather key statistics
    const totalUsers = await User.countDocuments();
    const totalArticles = await Article.countDocuments();
    const newUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });
    const newArticles = await Article.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });
    
    // Additional stats
    const writers = await User.countDocuments({
      articles: { $exists: true, $ne: [] }
    });
    
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name username email profileImage createdAt');
    
    const recentArticles = await Article.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'name username')
      .select('title slug createdAt');
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        totalArticles,
        newUsers,
        newArticles,
        writers
      },
      recentUsers,
      recentArticles
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination
 * @access  Admin only
 */
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    
    // Build search query
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    // Get users with pagination
    const users = await User.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name username email profileImage role isActive createdAt lastLogin followers following articles');
    
    // Get total count for pagination
    const total = await User.countDocuments(searchQuery);
    
    res.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user role or status
 * @access  Admin only
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const userId = req.params.id;
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user fields if provided
    if (role !== undefined) {
      // Validate role
      if (!['user', 'admin', 'editor'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be "user", "admin", or "editor"'
        });
      }
      user.role = role;
    }
    
    if (isActive !== undefined) {
      user.isActive = isActive;
    }
    
    // Save updates
    await user.save();
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/articles
 * @desc    Get all articles with pagination
 * @access  Admin only
 */
router.get('/articles', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    
    // Build search query
    let searchQuery = {};
    
    // Add text search if search term provided
    if (search && search.trim() !== '') {
      searchQuery.$text = { $search: search.trim() };
    }
    
    // Add status filter if provided
    if (status && ['pending', 'published', 'rejected', 'draft'].includes(status)) {
      searchQuery.status = status;
    }
    
    console.log(`Admin fetching articles with query:`, {
      search: search || 'none',
      status: status || 'all',
      page,
      limit,
      query: JSON.stringify(searchQuery)
    });
    
    // Set up article query
    let articleQuery = Article.find(searchQuery);
    
    // If using text search, add text score for sorting by relevance
    if (search && search.trim() !== '') {
      articleQuery = articleQuery
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      // Default sorting by creation date if not searching
      articleQuery = articleQuery.sort({ createdAt: -1 });
    }
    
    // Get articles with pagination
    const articles = await articleQuery
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username')
      .select('title slug description categories createdAt author likes comments status images youtubeLinks resourceLinks');
    
    // Get total count for pagination
    const total = await Article.countDocuments(searchQuery);
    
    res.json({
      success: true,
      articles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/articles/:id
 * @desc    Delete an article
 * @access  Admin only
 */
router.delete('/articles/:id', async (req, res) => {
  try {
    const articleId = req.params.id;
    
    // Validate article ID
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid article ID format'
      });
    }
    
    // Find and delete article
    const article = await Article.findById(articleId);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    // Remove article from user's articles array
    await User.updateOne(
      { _id: article.author },
      { $pull: { articles: articleId } }
    );
    
    // Delete article
    await Article.deleteOne({ _id: articleId });
    
    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting article',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/settings
 * @desc    Get admin settings
 * @access  Admin only
 */
router.get('/settings', async (req, res) => {
  try {
    // In a real app, you'd retrieve settings from a database
    // For now, we'll return placeholder values
    res.json({
      success: true,
      settings: {
        maintenance: false,
        allowNewRegistrations: true,
        allowNewArticles: true,
        featuredCategories: ['technology', 'science', 'history'],
        siteTitle: 'بنووسە',
        contactEmail: 'admin@example.com'
      }
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin settings',
      error: error.message
    });
  }
});

// Admin authentication routes
router.post('/login', adminController.login);
router.get('/auth-status', authMiddleware.verifyAdminToken, adminController.authStatus);

// Dashboard routes
router.get('/dashboard-stats', authMiddleware.verifyAdminToken, adminController.getDashboardStats);

// User management routes
router.get('/users', authMiddleware.verifyAdminToken, adminController.getUsers);
router.get('/users/:id', authMiddleware.verifyAdminToken, adminController.getUserById);
router.post('/users', authMiddleware.verifyAdminToken, adminController.createUser);
router.put('/users/:id', authMiddleware.verifyAdminToken, adminController.updateUser);
router.delete('/users/:id', authMiddleware.verifyAdminToken, adminController.deleteUser);

// Product management routes
router.get('/products', authMiddleware.verifyAdminToken, adminController.getProducts);
router.get('/products/:id', authMiddleware.verifyAdminToken, adminController.getProductById);
router.post('/products', authMiddleware.verifyAdminToken, adminController.createProduct);
router.put('/products/:id', authMiddleware.verifyAdminToken, adminController.updateProduct);
router.delete('/products/:id', authMiddleware.verifyAdminToken, adminController.deleteProduct);

// Order management routes
router.get('/orders', authMiddleware.verifyAdminToken, adminController.getOrders);
router.get('/orders/:id', authMiddleware.verifyAdminToken, adminController.getOrderById);
router.put('/orders/:id/status', authMiddleware.verifyAdminToken, adminController.updateOrderStatus);

// @route   PUT /api/admin/articles/:id/status
// @desc    Update article status (Admin route)
// @access  Private/Admin
router.put('/articles/:id/status', authMiddleware.verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'published', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    // Find the article
    const article = await Article.findById(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    const oldStatus = article.status;
    article.status = status;
    
    // If publishing, set publishedAt date
    if (status === 'published' && oldStatus !== 'published') {
      article.publishedAt = new Date();
      console.log(`Article ${id} is being published. Setting publishedAt: ${article.publishedAt}`);
      
      // Get author info and mark them as a writer
      const authorId = article.author;
      const user = await User.findById(authorId);
      
      if (user) {
        // Update user to show they're a writer
        await User.findByIdAndUpdate(authorId, { isWriter: true });
        console.log(`User ${user.name} (${authorId}) is now marked as a writer`);
        
        // Also create/update writer profile for search and display purposes
        const existingWriter = await Writer.findOne({ user: authorId });
        
        if (!existingWriter) {
          console.log(`Creating writer profile for user ${user.name} (${authorId})`);
          
          // Count user's published articles
          const userArticlesCount = await Article.countDocuments({
            author: authorId,
            status: 'published'
          });
          
          // Create new writer profile
          const newWriterProfile = new Writer({
            user: authorId,
            bio: user.bio || "Writer at Bnusa Platform",
            featured: false,
            articlesCount: userArticlesCount || 1,
            categories: article.categories || [],
            socialLinks: {
              twitter: user.socialMedia?.twitter || '',
              facebook: user.socialMedia?.facebook || '',
              instagram: user.socialMedia?.instagram || '',
              linkedin: user.socialMedia?.linkedin || '',
              website: user.socialMedia?.website || ''
            }
          });
          
          await newWriterProfile.save();
          console.log(`Created writer profile for user ${user.name}`);
        } else {
          console.log(`User ${user.name} already has a writer profile. Updating it...`);
          
          // Count user's published articles
          const userArticlesCount = await Article.countDocuments({
            author: authorId,
            status: 'published'
          });
          
          // Add any new categories from this article
          const existingCategories = existingWriter.categories || [];
          const articleCategories = article.categories || [];
          const uniqueCategories = Array.from(new Set([...existingCategories, ...articleCategories]));
          
          await Writer.findByIdAndUpdate(
            existingWriter._id,
            { 
              $set: { 
                articlesCount: userArticlesCount,
                categories: uniqueCategories
              } 
            }
          );
          console.log(`Updated writer profile for user ${user.name}`);
        }
      }
    }
    
    await article.save();
    
    res.json({
      success: true,
      message: `Article status updated to ${status}`,
      article
    });
  } catch (err) {
    console.error('Error updating article status:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

module.exports = router; 
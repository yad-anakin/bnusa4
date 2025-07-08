const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const auth = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');
const Writer = require('../models/Writer');

// @route   GET /api/articles/stats/count
// @desc    Get total number of published articles for statistics
// @access  Public
router.get('/stats/count', async (req, res) => {
  try {
    // Count only published articles
    const count = await Article.countDocuments({ status: 'published' });
    
    res.json({
      success: true,
      count
    });
  } catch (err) {
    console.error('Error counting articles:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/articles
// @desc    Get all published articles (paginated)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    
    // Look for search parameter in multiple possible keys
    const search = req.query.search || req.query.searchTerm || '';
    
    // Log all request parameters for debugging
    console.log('Article search request parameters:', {
      page,
      limit,
      category,
      search,
      allParams: req.query
    });

    let query = { status: 'published' };
    
    // Add category filter if not 'All'
    if (category && category !== 'هەموو') {
      query.categories = category;
    }
    
    // Add search filter if search parameter is provided
    if (search && search.trim() !== '') {
      // Clean up the search term - trim and normalize
      const cleanSearch = search.trim();
      console.log(`Processing search request with term: "${cleanSearch}"`);
      
      // Use MongoDB text search for more efficient searching
      query = {
        ...query,
        $text: { $search: cleanSearch }
      };
      
      console.log(`Search query constructed: ${JSON.stringify(query, null, 2)}`);
    }

    console.log('Final MongoDB query:', JSON.stringify(query, null, 2));

    let articleQuery = Article.find(query);
    
    // If using text search, add text score for sorting by relevance
    if (search && search.trim() !== '') {
      articleQuery = articleQuery
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      // Default sorting by creation date if not searching
      articleQuery = articleQuery.sort({ createdAt: -1 });
    }
    
    const articles = await articleQuery
      .skip(skip)
      .limit(limit)
      .populate('author', 'name profileImage username')
      .lean();

    const total = await Article.countDocuments(query);
    
    console.log(`Found ${articles.length} articles matching criteria (total: ${total})`);
    
    // Log article titles for debugging
    if (articles.length > 0) {
      console.log('Article titles returned:');
      articles.forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title}`);
      });
    } else {
      console.log('No articles matched the search criteria');
    }
    
    res.json({
      success: true,
      count: articles.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      articles
    });
  } catch (err) {
    console.error('Error fetching articles:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/articles/featured
// @desc    Get featured articles for homepage
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const articles = await Article.find({ 
      status: 'published',
      featured: true 
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'name profileImage username')
      .lean();
    
    res.json({
      success: true,
      count: articles.length,
      articles
    });
  } catch (err) {
    console.error('Error fetching featured articles:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/articles/latest
// @desc    Get latest articles
// @access  Public
router.get('/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const articles = await Article.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'name profileImage username')
      .lean();
    
    res.json({
      success: true,
      count: articles.length,
      articles
    });
  } catch (err) {
    console.error('Error fetching latest articles:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/articles/pending
// @desc    Get all pending articles (for testing only)
// @access  Public
router.get('/pending', async (req, res) => {
  try {
    const pendingArticles = await Article.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('author', 'name profileImage username');
    
    // Log detailed info about the pending articles
    console.log(`Found ${pendingArticles.length} pending articles`);
    
    // Print article IDs and titles
    pendingArticles.forEach((article, index) => {
      console.log(`${index + 1}. [${article._id}] ${article.title} - Status: ${article.status}`);
    });
    
    res.json({
      success: true,
      count: pendingArticles.length,
      articles: pendingArticles
    });
  } catch (err) {
    console.error('Error fetching pending articles:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/articles/:slugOrId
// @desc    Get article by slug or ID
// @access  Public
router.get('/:slugOrId', async (req, res) => {
  try {
    const slugOrId = req.params.slugOrId;
    console.log(`Finding article with slug or ID: ${slugOrId}`);
    
    // Try to find by slug first
    let article = await Article.findOne({ 
      slug: slugOrId,
      status: 'published'
    })
      .populate('author', 'name profileImage username')
      .populate('comments.user', 'name profileImage username')
      .lean();
    
    // If not found by slug, try by ID
    if (!article && mongoose.Types.ObjectId.isValid(slugOrId)) {
      console.log(`Slug not found, trying by ID: ${slugOrId}`);
      article = await Article.findOne({ 
        _id: slugOrId,
        status: 'published'
      })
        .populate('author', 'name profileImage username')
        .populate('comments.user', 'name profileImage username')
        .lean();
    }
    
    if (!article) {
      console.log(`Article not found with slug or ID: ${slugOrId}`);
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    
    // Increment view count
    await Article.findByIdAndUpdate(article._id, { $inc: { views: 1 } });
    
    res.json({
      success: true,
      article
    });
  } catch (err) {
    console.error('Error fetching article:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/articles
// @desc    Create a new article
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    // Extract article data and metadata
    const { __metadata, ...articleData } = req.body;
    const { title, description, content, categories, coverImage, slug, images, youtubeLinks, resourceLinks } = articleData;
    
    // Log metadata and arrays for debugging
    console.log('Request metadata:', __metadata ? JSON.stringify(__metadata) : 'None');
    console.log('YouTube Links received:', Array.isArray(youtubeLinks) ? youtubeLinks : 'Not an array');
    console.log('Resource Links received:', Array.isArray(resourceLinks) ? resourceLinks : 'Not an array');
    console.log('ACTUAL REQUEST BODY:', JSON.stringify(articleData));
    
    // Check for array metadata
    const hasArrays = __metadata && __metadata.hasArrays === true;
    const resourceLinksInfo = __metadata && __metadata.resourceLinksInfo;
    
    // Parse resourceLinks if it's a string
    let parsedResourceLinks = resourceLinks;
    if (typeof resourceLinks === 'string') {
      try {
        parsedResourceLinks = JSON.parse(resourceLinks);
      } catch (e) {
        console.error('Error parsing resourceLinks string:', e);
        parsedResourceLinks = [];
      }
    } else if (!Array.isArray(resourceLinks) && resourceLinks) {
      // If it's not an array but exists, wrap it in an array
      parsedResourceLinks = [resourceLinks];
    } else if (!resourceLinks) {
      parsedResourceLinks = [];
    }
    
    // Ensure resource links have the required fields
    if (Array.isArray(parsedResourceLinks)) {
      parsedResourceLinks = parsedResourceLinks.map(link => {
        if (typeof link === 'object' && link !== null) {
          return {
            url: link.url || '',
            title: link.title || '',
            type: link.type || 'web'
          };
        }
        return null;
      }).filter(link => link !== null && link.url && link.title);
    }
    
    // Log processed resource links
    console.log('Processed resourceLinks:', Array.isArray(parsedResourceLinks) 
      ? JSON.stringify(parsedResourceLinks) 
      : 'Not an array after processing');
    
    // Validate that coverImage is now a URL (should be a B2 URL)
    if (coverImage && !coverImage.startsWith('http')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cover image must be a valid URL. Please upload the image first.' 
      });
    }
    
    // Validate images are URLs if provided
    if (images && images.length > 0) {
      const validImages = images.every(img => img.startsWith('http'));
      if (!validImages) {
        return res.status(400).json({ 
          success: false, 
          message: 'All images must be valid URLs. Please upload images first.' 
        });
      }
    }
    
    // Normalize YouTube links
    const parsedYoutubeLinks = Array.isArray(youtubeLinks) ? youtubeLinks : (youtubeLinks ? [youtubeLinks] : []);
    
    // Create new article
    const article = new Article({
      title,
      description,
      content,
      categories,
      author: req.user.id,
      coverImage,
      images: images || [],
      youtubeLinks: parsedYoutubeLinks,
      resourceLinks: parsedResourceLinks,
      slug: slug || undefined // Will be generated from title if not provided
    });
    
    // Force mark arrays as modified to ensure they're saved
    article.markModified('youtubeLinks');
    article.markModified('resourceLinks');
    article.markModified('images');
    
    console.log('Article before save:', {
      title: article.title,
      youtubeLinks: article.youtubeLinks,
      youtubeLinksType: typeof article.youtubeLinks, 
      youtubeLinksIsArray: Array.isArray(article.youtubeLinks),
      resourceLinks: article.resourceLinks,
      resourceLinksType: typeof article.resourceLinks,
      resourceLinksIsArray: Array.isArray(article.resourceLinks),
      images: article.images,
      imagesCount: Array.isArray(article.images) ? article.images.length : 0
    });
    
    await article.save();
    
    // Add article ID to user's articles array
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { articles: article._id } },
      { new: true }
    );
    
    // Check if this is the user's first article and if they're not already a writer
    const existingWriter = await Writer.findOne({ user: req.user.id });
    
    if (!existingWriter) {
      console.log(`No writer profile found for user ${req.user.id}. Checking if this is their first article...`);
      
      // Count user's articles (including the newly added one)
      const articlesCount = user.articles.length;
      
      // If this is their first article, create a writer profile
      if (articlesCount === 1) {
        console.log(`This is the first article for user ${req.user.id}. Creating writer profile...`);
        
        // Create a new writer profile
        const writerProfile = new Writer({
          user: req.user.id,
          bio: user.bio || "Writer at Bnusa Platform", // Use existing bio or default
          featured: false,
          articlesCount: 1,
          followers: 0,
          categories: categories, // Use the categories from the first article
          socialLinks: {
            // Copy any social media links from user profile if available
            twitter: user.socialMedia?.twitter || '',
            facebook: user.socialMedia?.facebook || '',
            instagram: user.socialMedia?.instagram || '',
            linkedin: user.socialMedia?.linkedin || '',
            website: user.socialMedia?.website || ''
          }
        });
        
        await writerProfile.save();
        console.log(`Writer profile created for user ${req.user.id}`);
      }
    } else {
      // Update the existing writer's articlesCount and categories
      console.log(`Updating existing writer profile for user ${req.user.id}`);
      
      // Add any new categories to the writer's existing categories
      const updatedCategories = [...new Set([...existingWriter.categories, ...categories])]; // Combine and deduplicate
      
      await Writer.findByIdAndUpdate(
        existingWriter._id,
        { 
          $inc: { articlesCount: 1 },
          categories: updatedCategories
        }
      );
    }
    
    res.status(201).json({
      success: true,
      article
    });
    
    // Log the response data for debugging
    console.log('Response article data:', {
      id: article._id,
      youtubeLinks: article.youtubeLinks,
      youtubeLinksExists: article.youtubeLinks !== undefined,
      youtubeLinksIsArray: Array.isArray(article.youtubeLinks),
      youtubeLinksLength: Array.isArray(article.youtubeLinks) ? article.youtubeLinks.length : 'N/A',
      resourceLinks: article.resourceLinks,
      resourceLinksExists: article.resourceLinks !== undefined,
      resourceLinksIsArray: Array.isArray(article.resourceLinks),
      resourceLinksLength: Array.isArray(article.resourceLinks) ? article.resourceLinks.length : 'N/A'
    });
  } catch (err) {
    console.error('Error creating article:', err.message);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Server error' 
    });
  }
});

// @route   POST /api/articles/seed
// @desc    Seed articles for development
// @access  Public (should be protected in production)
router.post('/seed', async (req, res) => {
  try {
    // Get a user to assign as author
    const user = await User.findOne();
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'No users found. Please create a user first.' 
      });
    }
    
    // Sample articles data
    const articlesData = [
      {
        title: 'کاریگەری گۆڕانی کەش و هەوا لەسەر کشتوکاڵی کوردستان',
        description: 'شیکاریەکی قووڵ لەسەر چۆنیەتی کاریگەری گۆڕانی کەش و هەوا بەسەر کشتوکاڵ لە کوردستان و ئەو چارەسەرە بەردەوامانەی کە جێبەجێ دەکرێن.',
        content: 'لەم وتارەدا، دەڕوانینە کاریگەری گۆڕانی کەش و هەوا لەسەر کشتوکاڵی کوردستان...',
        author: user._id,
        categories: ['ژینگە', 'زانست'],
        slug: 'climate-change-kurdish-agriculture',
        status: 'published',
        featured: true
      },
      {
        title: 'مۆسیقای کوردی بە درێژایی مێژوو: دیدگایەکی مێژوویی',
        description: 'کاوە لە مێژووی دەوڵەمەندی مۆسیقای کوردی، لە گۆرانی گەلییە نەریتیەکانەوە تا سەرنجدانە هاوچەرخەکان و گرنگی کەلتوریان.',
        content: 'مۆسیقای کوردی خاوەنی مێژوویەکی دەوڵەمەندە کە بۆ سەدان ساڵ دەگەڕێتەوە...',
        author: user._id,
        categories: ['مێژوو', 'هونەر'],
        slug: 'kurdish-music-historical-perspective',
        status: 'published',
        featured: true
      },
      {
        title: 'فەلسەفەی ئیبن سینا و گرنگیەکەی لە ئەمڕۆدا',
        description: 'کاوە لە کارە فەلسەفیەکانی ئیبن سینا (ئەڤیچێنا) و چۆن بیرۆکەکانی بەردەوامن لە کاریگەری لەسەر بیرکردنەوەی هاوچەرخ لە پزیشکی و فەلسەفەدا.',
        content: 'ئیبن سینا، کە لە ڕۆژئاوا بە ئەڤیچێنا ناسراوە، یەکێک بوو لە گەورەترین بیرمەندانی سەردەمی زێڕینی ئیسلام...',
        author: user._id,
        categories: ['فەلسەفە', 'مێژوو'],
        slug: 'ibn-sina-philosophy-relevance',
        status: 'published'
      },
      {
        title: 'ئەدەبی هاوچەرخی کوردی: نووسەران و تێماکانی نوێ',
        description: 'دۆزینەوەی نەوەی نوێی نووسەرانی کورد و تێما هاوچەرخانەی کە لە کارەکانیاندا کاوە دەکەن.',
        content: 'ئەدەبی هاوچەرخی کوردی گەشەسەندنێکی بەرچاوی بەخۆیەوە بینیوە لە دەیەکانی دواییدا...',
        author: user._id,
        categories: ['ئەدەب'],
        slug: 'modern-kurdish-literature',
        status: 'published'
      },
      {
        title: 'داهێنانی تەکنۆلۆژی لە کوردستان: کۆمپانیا نوێیەکان',
        description: 'سەرنجێک لەسەر ژینگەی تەکنۆلۆژیای گەشەسەندوو لە کوردستان و ئەو داهێنانە نوێیانەی کە لە ناوچەکەدا شەپۆل دروست دەکەن.',
        content: 'لە ساڵانی دواییدا، کوردستان بووەتە شوێنێکی سەرنجڕاکێش بۆ داهێنان و گەشەی تەکنۆلۆژیا...',
        author: user._id,
        categories: ['تەکنەلۆژیا'],
        slug: 'tech-innovation-kurdistan',
        status: 'published',
        featured: true
      },
      {
        title: 'هونەری قاڵی چنینی کوردی: پاراستنی پیشەی نەریتی',
        description: 'فێربە دەربارەی هونەری دێرینی قاڵی چنینی کوردی، گرنگی کەلتوریەکەی، و هەوڵەکان بۆ پاراستنی ئەم پیشە نەریتیە.',
        content: 'قاڵی چنینی کوردی یەکێکە لە کۆنترین و جوانترین هونەرە دەستییەکان لە ناوچەکەدا...',
        author: user._id,
        categories: ['هونەر', 'مێژوو'],
        slug: 'kurdish-carpet-weaving',
        status: 'published'
      }
    ];
    
    // Delete existing articles if any
    await Article.deleteMany({});
    
    // Insert new articles
    await Article.insertMany(articlesData);
    
    res.json({
      success: true,
      message: 'Articles seeded successfully',
      count: articlesData.length
    });
  } catch (err) {
    console.error('Error seeding articles:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/articles/:id
// @desc    Update an article
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, content, categories, coverImage, images, status, youtubeLinks, resourceLinks } = req.body;
    
    // Validate that coverImage is now a URL (should be a B2 URL)
    if (coverImage && !coverImage.startsWith('http')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cover image must be a valid URL. Please upload the image first.' 
      });
    }
    
    // Validate images are URLs if provided
    if (images && images.length > 0) {
      const validImages = images.every(img => img.startsWith('http'));
      if (!validImages) {
        return res.status(400).json({ 
          success: false, 
          message: 'All images must be valid URLs. Please upload images first.' 
        });
      }
    }
    
    // Find the article
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        message: 'Article not found' 
      });
    }
    
    // Check if the user is the author of the article
    if (article.author.toString() !== req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to update this article' 
      });
    }
    
    // Update the article
    const updatedFields = {};
    if (title) updatedFields.title = title;
    if (description) updatedFields.description = description;
    if (content) updatedFields.content = content;
    if (categories) updatedFields.categories = categories;
    if (coverImage) updatedFields.coverImage = coverImage;
    if (images) updatedFields.images = images;
    if (status) updatedFields.status = status;
    if (youtubeLinks) updatedFields.youtubeLinks = youtubeLinks;
    if (resourceLinks) updatedFields.resourceLinks = resourceLinks;
    
    // If title is updated, regenerate the slug
    if (title && title !== article.title) {
      updatedFields.slug = title
        .toLowerCase()
        .replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
    
    console.log('Updating article with fields:', {
      ...Object.keys(updatedFields).reduce((acc, key) => {
        if (key === 'youtubeLinks') {
          acc[key] = `${updatedFields[key]?.length || 0} links`;
        } else if (key === 'resourceLinks') {
          acc[key] = `${updatedFields[key]?.length || 0} resources`;
        } else if (key === 'content') {
          acc[key] = 'content updated';
        } else {
          acc[key] = updatedFields[key];
        }
        return acc;
      }, {})
    });
    
    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true }
    ).populate('author', 'name profileImage username');
    
    // Check if status changed to 'published' and ensure user has a writer profile
    if (status === 'published' && article.status !== 'published') {
      console.log(`Article ${article._id} status changed to published. Checking writer profile...`);
      
      const authorId = article.author;
      const user = await User.findById(authorId);
      
      if (user) {
        // Check if user already has a writer profile
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
            categories: categories || article.categories || [],
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
    
    // Mark arrays as modified to ensure they're saved
    updatedArticle.markModified('youtubeLinks');
    updatedArticle.markModified('resourceLinks');
    updatedArticle.markModified('images');
    await updatedArticle.save();
    
    res.json({
      success: true,
      article: updatedArticle
    });
  } catch (err) {
    console.error('Error updating article:', err.message);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Server error' 
    });
  }
});

// @route   POST /api/articles/:id/like
// @desc    Like or unlike an article
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { action } = req.body;

    console.log(`Like/Unlike request - Article ID: ${id}, User ID: ${userId}, Action: ${action}`);

    if (!['like', 'unlike'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be "like" or "unlike"' });
    }

    // First check if the article exists
    const articleExists = await Article.findById(id);
    if (!articleExists) {
      console.log(`Article not found with ID: ${id}`);
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Check if user already liked the article
    const userLiked = articleExists.likes.some(like => like.toString() === userId);
    console.log(`Current status: User ${userId} has ${userLiked ? 'already liked' : 'not liked'} article ${id}`);
    console.log(`Current likes count: ${articleExists.likes.length}`);

    let result;
    let updatedHasLiked;
    
    if (action === 'like' && !userLiked) {
      // Use $addToSet to add the user ID to the likes array
      // This ensures no duplicates even if called multiple times
      result = await Article.findByIdAndUpdate(
        id,
        { $addToSet: { likes: userId } },
        { new: true }
      );
      
      updatedHasLiked = true;
      console.log(`User ${userId} liked article ${id}. New likes count: ${result.likes.length}`);
      
    } else if (action === 'unlike' && userLiked) {
      // Use $pull to remove the user ID from the likes array directly
      result = await Article.findByIdAndUpdate(
        id,
        { $pull: { likes: userId } },
        { new: true }
      );
      
      updatedHasLiked = false;
      console.log(`User ${userId} unliked article ${id}. New likes count: ${result.likes.length}`);
      
    } else {
      // No changes needed, but still return the current article
      result = articleExists;
      updatedHasLiked = userLiked;
      console.log(`No action needed: User ${userId} is trying to ${action} but has ${userLiked ? 'already liked' : 'not liked'} article ${id}`);
    }
    
    // Verify the updated article's likes
    if (result) {
      const updatedLikes = result.likes.map(like => like.toString());
      const hasUserLike = updatedLikes.includes(userId);
      console.log(`After operation: Article has ${result.likes.length} likes, user liked status: ${hasUserLike}`);
      
      // Ensure the hasLiked value matches the actual state in the database
      updatedHasLiked = hasUserLike;
    }
    
    // Return the response
    return res.json({
      success: true,
      message: action === 'like' 
        ? (userLiked ? 'Article already liked' : 'Article liked successfully')
        : (userLiked ? 'Article unliked successfully' : 'Article not liked'),
      likes: result.likes.length,
      hasLiked: updatedHasLiked
    });
    
  } catch (err) {
    console.error('Error handling article like:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 
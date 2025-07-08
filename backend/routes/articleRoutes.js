const express = require('express');
const Article = require('../models/Article');
const User = require('../models/User');
const Writer = require('../models/Writer');

const router = express.Router();

// @route   GET /api/articles
// @desc    Get all articles
// @access  Public
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find().populate('author', 'name username profileImage');
    res.json({ 
      success: true, 
      count: articles.length,
      articles 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch articles',
      details: err.message
    });
  }
});

// @route   GET /api/articles/:id
// @desc    Get article by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate('author', 'name username profileImage');
    
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article not found' 
      });
    }
    
    // Increment view count
    article.views += 1;
    await article.save();
    
    res.json({ 
      success: true, 
      article 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch article',
      details: err.message
    });
  }
});

// @route   POST /api/articles
// @desc    Create a new article
// @access  Public (would be protected in a real app)
router.post('/', async (req, res) => {
  try {
    const { title, description, content, categories, author, coverImage, images, youtubeLinks, resourceLinks } = req.body;
    
    // Log raw request for debugging
    console.log('Raw youtubeLinks:', JSON.stringify(youtubeLinks));
    console.log('Raw resourceLinks:', JSON.stringify(resourceLinks));
    
    // Ensure youtubeLinks is a valid array with strong type checking
    if (!youtubeLinks || !Array.isArray(youtubeLinks)) {
      youtubeLinks = [];
      console.log('youtubeLinks was not a valid array, initializing as empty array');
    }
    
    // Ensure resourceLinks is a valid array with strong type checking
    if (!resourceLinks || !Array.isArray(resourceLinks)) {
      resourceLinks = [];
      console.log('resourceLinks was not a valid array, initializing as empty array');
    }
    
    // More detailed debug log of the request body
    console.log('Article creation request details:', {
      title,
      description: description?.substring(0, 50) + '...',
      categories,
      author,
      hasContent: !!content,
      hasCoverImage: !!coverImage,
      imagesCount: images?.length || 0,
      youtubeLinksRaw: youtubeLinks,
      youtubeLinksCount: youtubeLinks.length,
      youtubeLinksIsArray: Array.isArray(youtubeLinks),
      resourceLinksRaw: resourceLinks,
      resourceLinksCount: resourceLinks.length,
      resourceLinksIsArray: Array.isArray(resourceLinks)
    });
    
    // Validate required fields
    if (!title || !description || !content || !categories || !author) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide all required fields' 
      });
    }
    
    // Create article with all data at once
    const articleData = {
      title,
      description,
      content,
      categories,
      author,
      coverImage: coverImage || '/images/placeholders/article-default.jpg',
      status: 'pending', // Set to pending by default, requires admin approval
      images: Array.isArray(images) ? images : [],
      youtubeLinks: Array.isArray(youtubeLinks) ? youtubeLinks : [],
      resourceLinks: Array.isArray(resourceLinks) ? resourceLinks : []
    };
    
    // Debug log
    console.log('Full article data to be saved:', {
      ...articleData,
      content: 'content text...', // don't log full content for brevity
      youtubeLinksCount: articleData.youtubeLinks.length,
      resourceLinksCount: articleData.resourceLinks.length
    });
    
    // Create document directly with all data
    const article = new Article(articleData);
    
    // Force direct setting of array properties to avoid any schema issues
    article.markModified('youtubeLinks');
    article.markModified('resourceLinks');
    
    await article.save();
    
    // Verify that youtubeLinks and resourceLinks were saved correctly
    const savedArticle = await Article.findById(article._id);
    console.log('Article saved with fields:', {
      _id: savedArticle._id,
      title: savedArticle.title,
      hasYoutubeLinks: !!savedArticle.youtubeLinks,
      youtubeLinksIsArray: Array.isArray(savedArticle.youtubeLinks),
      youtubeLinksCount: Array.isArray(savedArticle.youtubeLinks) ? savedArticle.youtubeLinks.length : 0,
      youtubeLinksValues: savedArticle.youtubeLinks,
      hasResourceLinks: !!savedArticle.resourceLinks,
      resourceLinksIsArray: Array.isArray(savedArticle.resourceLinks),
      resourceLinksCount: Array.isArray(savedArticle.resourceLinks) ? savedArticle.resourceLinks.length : 0,
      resourceLinksValues: savedArticle.resourceLinks
    });
    
    // Log after saving to confirm ID
    console.log('Article saved successfully with ID:', article._id);
    
    // Update the user's articles array
    const user = await User.findByIdAndUpdate(
      author,
      { $push: { articles: article._id } },
      { new: true }
    );
    
    console.log('User articles array updated');

    // We don't create a writer profile here since article is in 'pending' status
    // Writer profiles are created when article is approved/published by an admin
    
    res.status(201).json({ 
      success: true, 
      message: 'Article submitted successfully and pending review',
      article
    });
  } catch (err) {
    console.error('Error creating article:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create article',
      details: err.message
    });
  }
});

// @route   POST /api/articles/examples
// @desc    Create example articles (for development/testing)
// @access  Public
router.post('/examples', async (req, res) => {
  try {
    // First get a user to be the author
    let author = await User.findOne();
    
    if (!author) {
      // Create a user if none exists
      author = new User({
        name: 'ئاکۆ محەمەد',
        username: 'ako_m',
        email: 'ako.m@example.com',
        password: 'password123',
        bio: 'نووسەر و ڕۆژنامەنووس لە بواری تەکنەلۆژیا و زانست. خوێندکاری دکتۆرا لە زانکۆی سلێمانی.'
      });
      await author.save();
    }
    
    // Example articles
    const exampleArticles = [
      {
        title: 'کاریگەری زیرەکی دەستکرد لەسەر داهاتووی مرۆڤایەتی',
        description: 'لەم وتارەدا باس لە گرنگترین گۆڕانکارییەکانی زیرەکی دەستکرد و کاریگەرییەکانی لەسەر ژیانی مرۆڤ دەکەین...',
        content: `<p>لەم وتارەدا باس لە گرنگترین گۆڕانکارییەکانی زیرەکی دەستکرد و کاریگەرییەکانی لەسەر ژیانی مرۆڤ دەکەین...</p>
        <p>ئەم تەکنەلۆژیایە دەتوانێت ژیانی مرۆڤەکان بە شێوەیەکی بنەڕەتی بگۆڕێت بە باشتر یاخود بە خراپتر، ئەمە بەستراوەتەوە بە چۆنیەتی بەکارهێنانی.</p>
        <p>زیرەکی دەستکرد لە بوارە جیاوازەکانی ژیانی مرۆڤ کاریگەری هەیە، بە تایبەت لە بواری تەندروستی، پیشەسازی، پەروەردە و گواستنەوە.</p>
        <p>لەم وتارەدا، ئێمە تیشک دەخەینە سەر ئەو ئەرێنی و نەرێنیانەی کە زیرەکی دەستکرد دەیهێنێتە ژیانی مرۆڤایەتی لە داهاتوودا.</p>`,
        categories: ['زانست', 'تەکنەلۆژیا'],
        coverImage: '/images/placeholders/article-1.jpg',
        author: author._id,
        views: 45,
      },
      {
        title: 'گەشتێک بە مێژووی کوردستاندا',
        description: 'گەشتێکی مێژوویی بە شارە کۆنەکانی کوردستاندا، لە ئاماژە بە گرنگترین ڕووداوە مێژووییەکان...',
        content: `<p>گەشتێکی مێژوویی بە شارە کۆنەکانی کوردستاندا، لە ئاماژە بە گرنگترین ڕووداوە مێژووییەکان...</p>
        <p>کوردستان خاوەنی مێژوویەکی دەوڵەمەند و کەلتوورێکی بەهێزە کە شایانی توێژینەوەیە.</p>
        <p>شارەکانی کوردستان هەڵگری کۆمەڵێک لە میراتی مێژوویی و کەلتووری، کە بەشێکی گرنگ و بەنرخی مێژووی ناوچەکەیە.</p>
        <p>لەم وتارەدا، باس لە گەشتێکی مێژوویی لە کوردستان دەکەین و گرنگترین شوێنەوارە مێژووییەکان و بایەخیان دەخەینە ڕوو.</p>`,
        categories: ['مێژوو', 'گەشتیاری'],
        coverImage: '/images/placeholders/article-2.jpg',
        author: author._id,
        views: 67,
      }
    ];
    
    // Delete any existing example articles with same titles to avoid duplicates
    for (const article of exampleArticles) {
      await Article.deleteOne({ title: article.title });
    }
    
    // Create the articles
    const createdArticles = await Article.insertMany(exampleArticles);
    
    // Update the author's articles array
    await User.findByIdAndUpdate(
      author._id,
      { $push: { articles: { $each: createdArticles.map(article => article._id) } } },
      { new: true }
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Example articles created successfully',
      count: createdArticles.length,
      articles: createdArticles
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create example articles',
      details: err.message
    });
  }
});

// @route   PUT /api/articles/:id/status
// @desc    Update article status (Admin route that gets called when approving articles)
// @access  Private/Admin
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`Updating article ${id} status to ${status}`);
    
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
    
    // Only update publishedAt if status is changing to published
    if (status === 'published' && oldStatus !== 'published') {
      article.publishedAt = new Date();
    }
    
    await article.save();
    
    // If article is being published, ensure the author has a writer profile
    if (status === 'published' && oldStatus !== 'published') {
      console.log(`Article ${id} is being published. Checking writer profile for author...`);
      
      // Get author info
      const authorId = article.author;
      const user = await User.findById(authorId);
      
      if (user) {
        // Check if author already has a writer profile
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

// @route   PUT /api/articles/:id
// @desc    Update an article
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { title, description, content, categories, coverImage, images, status, youtubeLinks, resourceLinks } = req.body;
    
    // Debug - log YouTube and Resource Links
    console.log('Update received with arrays:');
    console.log('youtubeLinks:', JSON.stringify(youtubeLinks));
    console.log('resourceLinks:', JSON.stringify(resourceLinks));
    
    // Find the article
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        message: 'Article not found' 
      });
    }
    
    // Create a complete update object with all fields
    // Using MongoDB's $set operator to explicitly set array values
    const update = {
      $set: {
        title: title !== undefined ? title : article.title,
        description: description !== undefined ? description : article.description,
        content: content !== undefined ? content : article.content,
        categories: categories !== undefined ? categories : article.categories,
        coverImage: coverImage !== undefined ? coverImage : article.coverImage,
        status: status !== undefined ? status : article.status,
        images: Array.isArray(images) ? images : article.images,
        youtubeLinks: Array.isArray(youtubeLinks) ? youtubeLinks : article.youtubeLinks,
        resourceLinks: Array.isArray(resourceLinks) ? resourceLinks : article.resourceLinks
      }
    };
    
    // If title is updated, regenerate the slug
    if (title && title !== article.title) {
      update.$set.slug = title
        .toLowerCase()
        .replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
    
    // Log the update operation
    console.log('Updating article with data:', {
      ...update.$set,
      content: '(content text)', // Don't log full content
      youtubeLinks: Array.isArray(update.$set.youtubeLinks) 
        ? `[${update.$set.youtubeLinks.length} links]` 
        : update.$set.youtubeLinks,
      resourceLinks: Array.isArray(update.$set.resourceLinks) 
        ? `[${update.$set.resourceLinks.length} resources]` 
        : update.$set.resourceLinks
    });
    
    // Update in a single operation
    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      update,
      { 
        new: true,
        runValidators: true 
      }
    ).populate('author', 'name profileImage username');
    
    // Mark arrays as modified to ensure they're saved
    updatedArticle.markModified('youtubeLinks');
    updatedArticle.markModified('resourceLinks');
    await updatedArticle.save();
    
    res.json({
      success: true,
      message: 'Article updated successfully',
      article: updatedArticle
    });
  } catch (err) {
    console.error('Error updating article:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

module.exports = router; 
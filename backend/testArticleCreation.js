const mongoose = require('mongoose');
const Article = require('./models/Article');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bunsa')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function createTestArticle() {
  try {
    console.log('Creating test article with YouTube and resource links...');
    
    // Find a user to be the author
    const author = await User.findOne();
    
    if (!author) {
      console.error('No users found in the database. Please create a user first.');
      return;
    }
    
    // Generate a unique slug
    const timestamp = Date.now().toString().slice(-6);
    const slug = `test-article-${timestamp}`;
    
    // Prepare test data
    const articleData = {
      title: 'Test Article with YouTube and Resource Links',
      slug: slug,
      description: 'This is a test article created via script to test array fields.',
      content: '<p>This is test content.</p>',
      categories: ['تەکنەلۆژیا'],
      author: author._id,
      status: 'pending',
      youtubeLinks: ['https://www.youtube.com/watch?v=test1', 'https://www.youtube.com/watch?v=test2'],
      resourceLinks: [
        { 
          url: 'https://example.com/test.pdf', 
          title: 'Test PDF', 
          type: 'pdf' 
        },
        { 
          url: 'https://example.com/test.doc', 
          title: 'Test Document', 
          type: 'doc' 
        }
      ]
    };
    
    console.log('Creating article with data:', JSON.stringify(articleData, null, 2));
    
    // Create the article
    const article = new Article(articleData);
    
    // Log article data before saving
    console.log('Article model before saving:');
    console.log('- YouTube Links:', article.youtubeLinks);
    console.log('- Resource Links:', article.resourceLinks);
    
    try {
      // Save the article
      await article.save();
      console.log('Article saved with ID:', article._id);
      
      // Retrieve the saved article to verify
      const savedArticle = await Article.findById(article._id);
      console.log('\nRetrieved article data:');
      console.log('- ID:', savedArticle._id);
      console.log('- Title:', savedArticle.title);
      console.log('- Has youtubeLinks:', !!savedArticle.youtubeLinks);
      console.log('- YouTube Links array:', savedArticle.youtubeLinks);
      console.log('- YouTube Links count:', Array.isArray(savedArticle.youtubeLinks) ? savedArticle.youtubeLinks.length : 'not an array');
      console.log('- Has resourceLinks:', !!savedArticle.resourceLinks);
      console.log('- Resource Links array:', savedArticle.resourceLinks);
      console.log('- Resource Links count:', Array.isArray(savedArticle.resourceLinks) ? savedArticle.resourceLinks.length : 'not an array');
      
      console.log('\nTest completed successfully!');
    } catch (saveError) {
      console.error('Error saving article:', saveError);
      if (saveError.errors) {
        // Print validation errors
        Object.keys(saveError.errors).forEach(field => {
          console.error(`- ${field}: ${saveError.errors[field].message}`);
        });
      }
    }
  } catch (error) {
    console.error('Error creating test article:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
createTestArticle();
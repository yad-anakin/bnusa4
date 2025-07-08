const mongoose = require('mongoose');
const Article = require('./models/Article');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bunsa')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function updateArticles() {
  try {
    console.log('Starting schema update...');
    
    // Find all articles without youtubeLinks or resourceLinks arrays
    const articles = await Article.find({
      $or: [
        { youtubeLinks: { $exists: false } },
        { resourceLinks: { $exists: false } }
      ]
    });
    
    console.log(`Found ${articles.length} articles that need to be updated`);
    
    // Update each article
    let updateCount = 0;
    for (const article of articles) {
      const updates = {};
      
      if (!article.youtubeLinks) {
        updates.youtubeLinks = [];
        console.log(`Article ${article._id}: Adding missing youtubeLinks array`);
      }
      
      if (!article.resourceLinks) {
        updates.resourceLinks = [];
        console.log(`Article ${article._id}: Adding missing resourceLinks array`);
      }
      
      if (Object.keys(updates).length > 0) {
        await Article.updateOne({ _id: article._id }, { $set: updates });
        updateCount++;
      }
    }
    
    console.log(`Updated ${updateCount} articles successfully`);
    
    // Verify the updates
    const remainingArticles = await Article.find({
      $or: [
        { youtubeLinks: { $exists: false } },
        { resourceLinks: { $exists: false } }
      ]
    });
    
    if (remainingArticles.length > 0) {
      console.log(`WARNING: ${remainingArticles.length} articles still need updates`);
    } else {
      console.log('All articles have been updated successfully!');
    }
    
    // Perform a direct MongoDB update as a fallback
    console.log('Performing fallback update directly on MongoDB...');
    const result = await Article.collection.updateMany(
      { 
        $or: [
          { youtubeLinks: { $exists: false } },
          { resourceLinks: { $exists: false } }
        ]
      },
      { 
        $set: { 
          youtubeLinks: [],
          resourceLinks: []
        } 
      }
    );
    
    console.log(`Fallback update result: ${result.modifiedCount} articles updated`);
    
  } catch (error) {
    console.error('Error updating articles:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the update function
updateArticles(); 
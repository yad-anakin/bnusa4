/**
 * Script to update writer badges based on published articles
 * 
 * This script:
 * 1. Finds users with published articles and sets isWriter=true
 * 2. Finds users without published articles and sets isWriter=false
 * 
 * Usage:
 * node scripts/update-writer-badges.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../backend/models/User');
const Article = require('../backend/models/Article');

async function connectToMongoDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bunsa';
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    console.log(`پەیوەندی دەکرێت بە بنکەی داتا: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('پەیوەندی بە سەرکەوتوویی دامەزرا');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('هەڵە لە پەیوەندی بنکەی داتا:', error);
    process.exit(1);
  }
}

async function updateWriterBadges() {
  try {
    console.log('Finding users with published articles...');
    console.log('بەکارهێنەران بە ووتارەکانیانەوە دەدۆزرێنەوە...');
    
    // Find all published articles
    const publishedArticles = await Article.find({ status: 'published' });
    console.log(`Found ${publishedArticles.length} published articles`);
    console.log(`${publishedArticles.length} ووتاری بڵاوکراوە دۆزرایەوە`);
    
    // Extract unique author IDs
    const authorIds = [...new Set(publishedArticles.map(article => 
      article.author.toString()
    ))];
    
    console.log(`Found ${authorIds.length} unique authors with published articles`);
    console.log(`${authorIds.length} نووسەری جیاواز بە ووتاری بڵاوکراوە دۆزرایەوە`);
    
    // 1. Add writer badges to users with published articles
    const addResult = await User.updateMany(
      { _id: { $in: authorIds }, isWriter: { $ne: true } },
      { $set: { isWriter: true } }
    );
    
    console.log(`Added writer badges to ${addResult.modifiedCount} users`);
    console.log(`نیشانەی نووسەر زیاد کرا بۆ ${addResult.modifiedCount} بەکارهێنەر`);
    
    // 2. Remove writer badges from users without published articles
    const removeResult = await User.updateMany(
      { _id: { $nin: authorIds }, isWriter: true },
      { $set: { isWriter: false } }
    );
    
    console.log(`Removed writer badges from ${removeResult.modifiedCount} users who no longer have published articles`);
    console.log(`نیشانەی نووسەر لابرا بۆ ${removeResult.modifiedCount} بەکارهێنەر کە ووتاری بڵاوکراوەیان نییە`);
    
    // Get details about users who received badges
    if (addResult.modifiedCount > 0) {
      const newWriters = await User.find({ _id: { $in: authorIds }, isWriter: true })
        .select('name username')
        .limit(10); // Limit to 10 to avoid large output
      
      console.log('\nUsers now having writer badges (sample):');
      console.log('بەکارهێنەرانی نوێ کە نیشانەی نووسەریان وەرگرتووە:');
      newWriters.forEach(user => {
        console.log(`- ${user.name} (@${user.username})`);
      });
    }
    
    // Get details about users who lost badges
    if (removeResult.modifiedCount > 0) {
      const formerWriters = await User.find({ isWriter: false })
        .select('name username')
        .limit(10); // Limit to 10 to avoid large output
      
      console.log('\nUsers who lost writer badges (sample):');
      console.log('بەکارهێنەران کە نیشانەی نووسەریان لابراوە:');
      formerWriters.forEach(user => {
        console.log(`- ${user.name} (@${user.username})`);
      });
    }
    
    console.log('\nWriter badge update completed.');
    console.log('نوێکردنەوەی نیشانەی نووسەر تەواو بوو.');
    
  } catch (error) {
    console.error('Error updating writer badges:', error);
    console.error('هەڵە لە نوێکردنەوەی نیشانەی نووسەر:', error);
  }
}

async function main() {
  try {
    await connectToMongoDB();
    await updateWriterBadges();
  } catch (error) {
    console.error('An error occurred:', error);
    console.error('هەڵەیەک ڕوویدا:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    console.log('پەیوەندی بنکەی داتا داخرا.');
  }
}

main(); 
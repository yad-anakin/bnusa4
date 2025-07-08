const { MongoClient } = require('mongodb');
require('dotenv').config();

// Connection URI
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bunsa';

// Create a new MongoClient
const client = new MongoClient(uri);

async function updateDatabase() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Connected successfully to MongoDB");
    
    // Get the database and collection
    const database = client.db();
    const articles = database.collection('articles');
    
    // First, check for articles missing arrays
    const missingArrays = await articles.countDocuments({
      $or: [
        { youtubeLinks: { $exists: false } },
        { resourceLinks: { $exists: false } }
      ]
    });
    
    console.log(`Found ${missingArrays} articles with missing arrays`);
    
    if (missingArrays > 0) {
      // Update all articles to ensure they have both arrays
      const updateResult = await articles.updateMany(
        { youtubeLinks: { $exists: false } },
        { $set: { youtubeLinks: [] } }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} articles to have youtubeLinks`);
      
      const updateResult2 = await articles.updateMany(
        { resourceLinks: { $exists: false } },
        { $set: { resourceLinks: [] } }
      );
      
      console.log(`Updated ${updateResult2.modifiedCount} articles to have resourceLinks`);
      
      // Verify the update
      const remainingMissing = await articles.countDocuments({
        $or: [
          { youtubeLinks: { $exists: false } },
          { resourceLinks: { $exists: false } }
        ]
      });
      
      if (remainingMissing === 0) {
        console.log("All articles now have both arrays!");
      } else {
        console.log(`Warning: ${remainingMissing} articles still missing arrays`);
        
        // Get IDs of articles still missing arrays for manual review
        const stillMissing = await articles.find({
          $or: [
            { youtubeLinks: { $exists: false } },
            { resourceLinks: { $exists: false } }
          ]
        }).project({ _id: 1 }).toArray();
        
        console.log("Articles still missing arrays:", stillMissing.map(a => a._id));
      }
    }
    
    // Finally, ensure all articles have empty arrays rather than null
    const fixNullArrays = await articles.updateMany(
      { $or: [
          { youtubeLinks: null },
          { resourceLinks: null }
        ]
      },
      { $set: { 
          youtubeLinks: [],
          resourceLinks: []
        }
      }
    );
    
    console.log(`Fixed ${fixNullArrays.modifiedCount} articles with null arrays`);
    
    console.log("Database update complete!");
  } catch (err) {
    console.error("Error updating database:", err);
  } finally {
    // Close the client
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

// Run the update function
updateDatabase(); 
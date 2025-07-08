import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';

// Helper function to connect to MongoDB
async function connectToMongoDB() {
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('Connected to MongoDB successfully');
  return client;
}

// GET an article by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  let client: MongoClient | null = null;
  
  try {
    console.log(`Fetching article with ID: ${id}`);
    
    // Validate the ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid article ID format' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const articlesCollection = db.collection('articles');
    
    // Show the fields we're projecting in the query for debugging
    console.log('MongoDB query for article ID:', id);
    
    // Get article by ID
    const article = await articlesCollection.findOne({ _id: new ObjectId(id) });
    
    if (!article) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }
    
    // Critical debugging: Log the raw document to see if YouTube and resource links exist in the DB
    console.log('Raw MongoDB document for article:', JSON.stringify(article));
    
    // Debug fields more explicitly
    console.log('YouTube links from DB:', {
      exists: article.youtubeLinks !== undefined,
      isArray: Array.isArray(article.youtubeLinks),
      value: JSON.stringify(article.youtubeLinks)
    });
    
    console.log('Resource links from DB:', {
      exists: article.resourceLinks !== undefined,
      isArray: Array.isArray(article.resourceLinks),
      value: JSON.stringify(article.resourceLinks)
    });
    
    // Log the raw MongoDB document
    console.log('Raw MongoDB document for article:', {
      id: article._id.toString(),
      hasYoutubeLinks: article.youtubeLinks !== undefined,
      hasResourceLinks: article.resourceLinks !== undefined,
      youtubeLinksType: article.youtubeLinks ? typeof article.youtubeLinks : 'undefined',
      resourceLinksType: article.resourceLinks ? typeof article.resourceLinks : 'undefined',
      firstFewFields: Object.keys(article).slice(0, 10)
    });
    
    // Debug: Check for image tags in content
    if (article.content && article.content.includes('<img')) {
      console.log('Article content contains image tags:', 
        article.content.match(/<img[^>]+>/g));
    }
    
    // Debug: Check for featuredImage
    if (article.featuredImage) {
      console.log('Article has featuredImage:', article.featuredImage);
    }
    
    // Debug: Check for images array
    if (article.images && Array.isArray(article.images)) {
      console.log(`Article has ${article.images.length} images in the images array:`, article.images);
    }
    
    // Debug: Check for youtubeLinks array
    if (article.youtubeLinks && Array.isArray(article.youtubeLinks)) {
      console.log(`Article has ${article.youtubeLinks.length} YouTube links:`, article.youtubeLinks);
    } else {
      console.log('Article youtubeLinks property is missing or not an array:', article.youtubeLinks);
    }
    
    // Debug: Check for resourceLinks array
    if (article.resourceLinks && Array.isArray(article.resourceLinks)) {
      console.log(`Article has ${article.resourceLinks.length} resource links:`, article.resourceLinks);
    } else {
      console.log('Article resourceLinks property is missing or not an array:', article.resourceLinks);
    }
    
    // Format article for response
    let authorData = { 
      _id: '', 
      name: '', 
      username: '' 
    };
    
    // Handle different author formats
    if (typeof article.author === 'object' && article.author) {
      authorData = { 
        _id: article.author._id?.toString() || '',
        name: article.author.name || '',
        username: article.author.username || ''
      };
    } else if (typeof article.author === 'string' && article.author) {
      // Author is an ID - look up author information
      try {
        const usersCollection = db.collection('users');
        if (ObjectId.isValid(article.author)) {
          const user = await usersCollection.findOne({ _id: new ObjectId(article.author) });
          if (user) {
            authorData = {
              _id: user._id.toString(),
              name: user.name || 'Unknown Author',
              username: user.username || 'unknown'
            };
          } else {
            authorData = {
              _id: article.author,
              name: 'Unknown Author',
              username: 'unknown'
            };
          }
        }
      } catch (err) {
        console.error(`Error looking up author with ID ${article.author}:`, err);
        authorData = {
          _id: article.author,
          name: 'Author ID: ' + article.author,
          username: 'unknown'
        };
      }
    }
    
    // Copy YouTube and resource links directly from MongoDB document
    const youtubeLinks = Array.isArray(article.youtubeLinks) ? article.youtubeLinks : [];
    const resourceLinks = Array.isArray(article.resourceLinks) ? article.resourceLinks : [];
    
    console.log('Extracted youtubeLinks:', youtubeLinks);
    console.log('Extracted resourceLinks:', resourceLinks);
    
    const formattedArticle = {
      _id: article._id.toString(),
      title: article.title || '',
      slug: article.slug || '',
      description: article.description || '',
      content: article.content || '',
      featuredImage: article.featuredImage || article.coverImage || '',
      categories: Array.isArray(article.categories) ? article.categories : [],
      tags: Array.isArray(article.tags) ? article.tags : [],
      author: authorData,
      images: Array.isArray(article.images) ? article.images : [],
      // Use the extracted YouTube and resource links to ensure they're properly included
      youtubeLinks: youtubeLinks,
      resourceLinks: resourceLinks,
      createdAt: article.createdAt || article.publishedAt || new Date().toISOString(),
      updatedAt: article.updatedAt || article.createdAt || new Date().toISOString(),
      status: article.status || 'published',
      likes: typeof article.likes === 'number' ? article.likes : 
             (Array.isArray(article.likes) ? article.likes.length : 0),
      comments: typeof article.comments === 'number' ? article.comments : 
               (Array.isArray(article.comments) ? article.comments.length : 0)
    };
    
    // Final verification of formatted article data
    console.log('Formatted article youtubeLinks:', JSON.stringify(formattedArticle.youtubeLinks));
    console.log('Formatted article resourceLinks:', JSON.stringify(formattedArticle.resourceLinks));
    
    return NextResponse.json({
      success: true,
      article: formattedArticle
    });
  } catch (error: any) {
    console.error(`Error fetching article ${id}:`, error.message);
    return NextResponse.json(
      { success: false, message: `Error fetching article: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}

// PUT to update an article
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  let client: MongoClient | null = null;
  
  try {
    // Validate the ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid article ID format' },
        { status: 400 }
      );
    }
    
    const updateData = await request.json();
    console.log(`Updating article ${id} with data:`, updateData);
    
    // Enhanced debugging for arrays
    if (updateData.images && Array.isArray(updateData.images)) {
      console.log(`Article update includes ${updateData.images.length} images in the images array`);
    }
    
    if (updateData.youtubeLinks && Array.isArray(updateData.youtubeLinks)) {
      console.log(`Article update includes ${updateData.youtubeLinks.length} YouTube links:`, updateData.youtubeLinks);
    } else {
      console.log('No youtubeLinks in update data or not an array:', updateData.youtubeLinks);
    }
    
    if (updateData.resourceLinks && Array.isArray(updateData.resourceLinks)) {
      console.log(`Article update includes ${updateData.resourceLinks.length} resource links:`, updateData.resourceLinks);
    } else {
      console.log('No resourceLinks in update data or not an array:', updateData.resourceLinks);
    }
    
    // Debug: check for image tags in content
    if (updateData.content && updateData.content.includes('<img')) {
      console.log('Content contains image tags:', 
        updateData.content.match(/<img[^>]+>/g));
    }
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const articlesCollection = db.collection('articles');
    
    // Check if the article exists
    const existingArticle = await articlesCollection.findOne({ _id: new ObjectId(id) });
    if (!existingArticle) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }
    
    // Prepare the update data
    const updateFields: any = {
      updatedAt: new Date().toISOString()
    };
    
    // Only include fields that are provided in the request
    if (updateData.title !== undefined) updateFields.title = updateData.title;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.content !== undefined) updateFields.content = updateData.content;
    if (updateData.categories !== undefined) updateFields.categories = updateData.categories;
    if (updateData.featuredImage !== undefined) updateFields.featuredImage = updateData.featuredImage;
    if (updateData.status !== undefined) updateFields.status = updateData.status;
    if (updateData.tags !== undefined) updateFields.tags = updateData.tags;
    
    // ALWAYS include these arrays in updates, ensuring they're properly set
    // This ensures they're included in the update even if they're empty arrays
    updateFields.images = Array.isArray(updateData.images) ? updateData.images : [];
    updateFields.youtubeLinks = Array.isArray(updateData.youtubeLinks) ? updateData.youtubeLinks : [];
    updateFields.resourceLinks = Array.isArray(updateData.resourceLinks) ? updateData.resourceLinks : [];
    
    // Log the update fields for debugging
    console.log('Final update fields being sent to MongoDB:', {
      hasYoutubeLinks: updateFields.youtubeLinks !== undefined,
      youtubeLinksCount: Array.isArray(updateFields.youtubeLinks) ? updateFields.youtubeLinks.length : 'not an array',
      hasResourceLinks: updateFields.resourceLinks !== undefined,
      resourceLinksCount: Array.isArray(updateFields.resourceLinks) ? updateFields.resourceLinks.length : 'not an array'
    });
    
    // Update the article
    const result = await articlesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'No changes were made to the article' },
        { status: 400 }
      );
    }
    
    console.log(`Article ${id} updated successfully:`, result.modifiedCount);
    
    // Get the updated article
    const updatedArticle = await articlesCollection.findOne({ _id: new ObjectId(id) });
    
    // Debug: check article content after update
    if (updatedArticle?.content?.includes('<img')) {
      console.log('Updated article contains image tags:',
        updatedArticle.content.match(/<img[^>]+>/g));
    }
    
    // Debug: check arrays after update
    if (updatedArticle?.images && Array.isArray(updatedArticle.images)) {
      console.log(`Updated article has ${updatedArticle.images.length} images in the images array`);
    }
    
    if (updatedArticle?.youtubeLinks && Array.isArray(updatedArticle.youtubeLinks)) {
      console.log(`Updated article has ${updatedArticle.youtubeLinks.length} YouTube links`);
    }
    
    if (updatedArticle?.resourceLinks && Array.isArray(updatedArticle.resourceLinks)) {
      console.log(`Updated article has ${updatedArticle.resourceLinks.length} resource links`);
    }
    
    // Get the complete article and ensure all fields are included in the response
    const updatedArticleComplete = await articlesCollection.findOne({ _id: new ObjectId(id) });
    
    // Ensure proper formatting of the response
    const formattedArticle = {
      _id: updatedArticleComplete?._id.toString(),
      title: updatedArticleComplete?.title || '',
      description: updatedArticleComplete?.description || '',
      content: updatedArticleComplete?.content || '',
      categories: Array.isArray(updatedArticleComplete?.categories) ? updatedArticleComplete.categories : [],
      tags: Array.isArray(updatedArticleComplete?.tags) ? updatedArticleComplete.tags : [],
      featuredImage: updatedArticleComplete?.featuredImage || updatedArticleComplete?.coverImage || '',
      status: updatedArticleComplete?.status || 'draft',
      createdAt: updatedArticleComplete?.createdAt || new Date().toISOString(),
      updatedAt: updatedArticleComplete?.updatedAt || new Date().toISOString(),
      images: Array.isArray(updatedArticleComplete?.images) ? updatedArticleComplete.images : [],
      youtubeLinks: Array.isArray(updatedArticleComplete?.youtubeLinks) ? updatedArticleComplete.youtubeLinks : [],
      resourceLinks: Array.isArray(updatedArticleComplete?.resourceLinks) ? updatedArticleComplete.resourceLinks : [],
      // Include other fields as needed
      author: updatedArticleComplete?.author || {},
      likes: typeof updatedArticleComplete?.likes === 'number' ? updatedArticleComplete.likes : 
             (Array.isArray(updatedArticleComplete?.likes) ? updatedArticleComplete.likes.length : 0),
      comments: typeof updatedArticleComplete?.comments === 'number' ? updatedArticleComplete.comments : 
               (Array.isArray(updatedArticleComplete?.comments) ? updatedArticleComplete.comments.length : 0)
    };
    
    // Log final state of arrays for debugging
    console.log('Final youtubeLinks in response:', formattedArticle.youtubeLinks);
    console.log('Final resourceLinks in response:', formattedArticle.resourceLinks);
    
    return NextResponse.json({
      success: true,
      message: 'Article updated successfully',
      article: formattedArticle
    });
  } catch (error: any) {
    console.error(`Error updating article ${id}:`, error.message);
    return NextResponse.json(
      { success: false, message: `Error updating article: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}

// DELETE an article
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  let client: MongoClient | null = null;
  
  try {
    console.log(`Deleting article with ID: ${id}`);
    
    // Validate the ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid article ID format' },
        { status: 400 }
      );
    }
    
    client = await connectToMongoDB();
    const db = client.db(DB_NAME);
    const articlesCollection = db.collection('articles');
    const usersCollection = db.collection('users');
    
    // Get the article to find the author
    const article = await articlesCollection.findOne({ _id: new ObjectId(id) });
    
    if (!article) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }
    
    // Delete the article
    const result = await articlesCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete article' },
        { status: 500 }
      );
    }
    
    // If article has an author reference, remove this article from the author's articles array
    if (article.author) {
      let authorId;
      
      // Check if author is an object with _id or a string ID
      if (typeof article.author === 'object' && article.author._id) {
        authorId = article.author._id;
      } else if (typeof article.author === 'string') {
        authorId = article.author;
      }
      
      if (authorId && ObjectId.isValid(authorId)) {
        await usersCollection.updateOne(
          { _id: new ObjectId(authorId.toString()) },
          { $pull: { articles: new ObjectId(id) } }
        );
        console.log(`Removed article reference from author's articles array`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error: any) {
    console.error(`Error deleting article ${id}:`, error.message);
    return NextResponse.json(
      { success: false, message: `Error deleting article: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
} 
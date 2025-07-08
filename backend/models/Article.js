const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverImage: {
    type: String,
    default: '/images/placeholders/article-default.jpg'
  },
  images: [{
    type: String
  }],
  youtubeLinks: {
    type: [String],
    default: []
  },
  resourceLinks: {
    type: [{
      url: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true
      }
    }],
    default: []
  },
  categories: [{
    type: String,
    required: true,
    enum: ['زانست', 'مێژوو', 'هونەر', 'فەلسەفە', 'تەکنەلۆژیا', 'ئەدەب', 
           'سیاسەت', 'ئابووری', 'تەندروستی', 'وەرزش', 'ژینگە', 'گەشتیاری']
  }],
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'rejected'],
    default: 'pending'
  },
  readTime: {
    type: Number,
    default: 5
  },
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Ensure arrays are properly handled
      if (ret.youtubeLinks === null || ret.youtubeLinks === undefined) {
        ret.youtubeLinks = [];
      }
      if (ret.resourceLinks === null || ret.resourceLinks === undefined) {
        ret.resourceLinks = [];
      }
      return ret;
    }
  }
});

// Create text index for efficient searching
articleSchema.index(
  { 
    title: 'text', 
    description: 'text',
    categories: 'text'
  },
  {
    weights: {
      title: 10,
      description: 5,
      categories: 3
    },
    name: "article_search_index"
  }
);

// Create compound index for category and status filtering
articleSchema.index({ categories: 1, status: 1 });

// Calculate read time before saving
articleSchema.pre('save', function(next) {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  this.readTime = Math.ceil(wordCount / wordsPerMinute);
  next();
});

// Create slug from title if not provided
articleSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9 -]/g, '') // keep arabic, numbers, spaces, hyphens
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

// Ensure arrays are initialized
articleSchema.pre('save', function(next) {
  // Initialize youtubeLinks if not set
  if (!this.youtubeLinks) {
    this.youtubeLinks = [];
    console.log('Initializing missing youtubeLinks array for article:', this._id);
  } else if (!Array.isArray(this.youtubeLinks)) {
    this.youtubeLinks = typeof this.youtubeLinks === 'string' ? [this.youtubeLinks] : [];
    console.log('Converting youtubeLinks to array for article:', this._id);
  }
  
  // Initialize resourceLinks if not set
  if (!this.resourceLinks) {
    this.resourceLinks = [];
    console.log('Initializing missing resourceLinks array for article:', this._id);
  } else if (!Array.isArray(this.resourceLinks)) {
    // Handle string parsing if needed
    try {
      if (typeof this.resourceLinks === 'string') {
        this.resourceLinks = JSON.parse(this.resourceLinks);
        if (!Array.isArray(this.resourceLinks)) {
          this.resourceLinks = [];
        }
      } else {
        this.resourceLinks = [];
      }
    } catch (e) {
      console.error('Error parsing resourceLinks:', e);
      this.resourceLinks = [];
    }
    console.log('Converting resourceLinks to array for article:', this._id);
  }
  
  // Ensure each resourceLink is properly formatted
  if (Array.isArray(this.resourceLinks)) {
    this.resourceLinks = this.resourceLinks.map(link => {
      if (typeof link === 'object' && link !== null) {
        return {
          url: link.url || '',
          title: link.title || '',
          type: link.type || 'web'
        };
      }
      return null;
    }).filter(link => link !== null);
  }
  
  next();
});

// Log when articles are retrieved
articleSchema.pre('findOne', function() {
  console.log('Finding an article:', this.getQuery());
});

articleSchema.post('findOne', function(doc) {
  if (doc) {
    console.log('Article found with ID:', doc._id);
    console.log('Article has youtubeLinks:', doc.youtubeLinks ? 'Yes' : 'No');
    console.log('Article has resourceLinks:', doc.resourceLinks ? 'Yes' : 'No');
    if (doc.youtubeLinks) {
      console.log('youtubeLinks count:', Array.isArray(doc.youtubeLinks) ? doc.youtubeLinks.length : 'not an array');
    }
    if (doc.resourceLinks) {
      console.log('resourceLinks count:', Array.isArray(doc.resourceLinks) ? doc.resourceLinks.length : 'not an array');
    }
  } else {
    console.log('No article found with the given query');
  }
});

const Article = mongoose.model('Article', articleSchema);

module.exports = Article; 
const mongoose = require('mongoose');

const writerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bio: {
    type: String,
    required: true,
    trim: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  articlesCount: {
    type: Number,
    default: 0
  },
  followers: {
    type: Number,
    default: 0
  },
  categories: [{
    type: String,
    enum: ['زانست', 'مێژوو', 'هونەر', 'فەلسەفە', 'تەکنەلۆژیا', 'ئەدەب', 
           'سیاسەت', 'ئابووری', 'تەندروستی', 'وەرزش', 'ژینگە', 'گەشتیاری']
  }],
  socialLinks: {
    twitter: String,
    facebook: String,
    instagram: String,
    linkedin: String,
    website: String
  }
}, {
  timestamps: true
});

// Create text index for efficient searching
writerSchema.index(
  { 
    bio: 'text',
    categories: 'text'
  },
  {
    weights: {
      bio: 5,
      categories: 10
    },
    name: "writer_search_index"
  }
);

// Create index for featured writers
writerSchema.index({ featured: 1 });

// Create index for sorting by articlesCount
writerSchema.index({ articlesCount: -1 });

// Virtual to get full writer profile with user info
writerSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.user.name,
    username: this.user.username,
    bio: this.bio,
    avatar: this.user.profileImage,
    articlesCount: this.articlesCount,
    followers: this.followers,
    featured: this.featured,
    categories: this.categories,
    socialLinks: this.socialLinks
  };
});

const Writer = mongoose.model('Writer', writerSchema);

module.exports = Writer; 
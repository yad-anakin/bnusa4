const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  writer: {
    type: String,
    required: [true, 'Writer name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Publication year is required']
  },
  image: {
    type: String,
    default: '/images/placeholders/book-default.jpg'
  },
  fileUrl: {
    type: String,
    required: [true, 'Book file URL is required']
  },
  pages: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, {
  timestamps: true
});

// Create text index for efficient searching
bookSchema.index(
  { 
    title: 'text', 
    writer: 'text',
    description: 'text',
    genre: 'text'
  },
  {
    weights: {
      title: 10,
      writer: 8,
      genre: 5,
      description: 3
    },
    name: "book_search_index"
  }
);

// Create compound indexes for common filters
bookSchema.index({ genre: 1 });
bookSchema.index({ year: 1 });
bookSchema.index({ featured: 1 });

// Create slug from title if not provided
bookSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9 -]/g, '') // keep arabic, numbers, spaces, hyphens
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema); 
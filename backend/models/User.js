const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true  // Allows null values and maintains uniqueness for non-null values
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    // Not required because Firebase users won't have a password in MongoDB
    select: false
  },
  bio: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  bannerImage: {
    type: String,
    default: '/images/deafult-banner.jpg'
  },
  // Social media profiles
  socialMedia: {
    twitter: {
      type: String,
      default: ''
    },
    facebook: {
      type: String,
      default: ''
    },
    instagram: {
      type: String,
      default: ''
    },
    linkedin: {
      type: String,
      default: ''
    },
    github: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    }
  },
  articles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  joinDate: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'editor'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isWriter: {
    type: Boolean,
    default: false
  },
  isSupervisor: {
    type: Boolean,
    default: false
  },
  isDesigner: {
    type: Boolean,
    default: false
  },
  supervisorText: {
    type: String,
    default: ''
  },
  designsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create text index for efficient searching
userSchema.index(
  { 
    name: 'text',
    username: 'text',
    bio: 'text'
  },
  {
    weights: {
      username: 10,
      name: 8,
      bio: 5
    },
    name: "user_search_index"
  }
);

// Create index for writer filtering
userSchema.index({ isWriter: 1 });

// Create index for supervisor filtering
userSchema.index({ isSupervisor: 1 });

// Create index for designer filtering
userSchema.index({ isDesigner: 1 });

// Create index for role-based queries
userSchema.index({ role: 1 });

// Hash password before saving if password field is modified
userSchema.pre('save', async function(next) {
  if (this.password && this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 
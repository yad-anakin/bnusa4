const mongoose = require('mongoose');

const contentTypeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  gradient: {
    type: String,
    required: true,
    default: 'from-blue-50 to-indigo-50 shadow-blue-200/20'
  },
  iconPath: {
    type: String,
    required: true
  },
  iconStrokeWidth: {
    type: Number,
    default: 1.5
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const ContentType = mongoose.model('ContentType', contentTypeSchema);

module.exports = ContentType; 
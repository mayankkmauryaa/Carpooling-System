const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  type: {
    type: String,
    enum: ['driver-to-rider', 'rider-to-driver'],
    required: true
  },
  
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  comment: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  
  isVisible: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

reviewSchema.index({ tripId: 1 });
reviewSchema.index({ reviewerId: 1 });
reviewSchema.index({ revieweeId: 1 });

module.exports = mongoose.model('Review', reviewSchema);

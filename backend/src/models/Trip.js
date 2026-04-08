const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  ridePoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RidePool',
    required: true
  },
  
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  riderIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  startTime: {
    type: Date
  },
  
  endTime: {
    type: Date
  },
  
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  
  totalFare: {
    type: Number,
    default: 0
  },
  
  actualDistance: {
    type: Number
  },
  
  actualDuration: {
    type: Number
  },
  
  startLocation: {
    coordinates: [Number],
    address: String
  },
  
  endLocation: {
    coordinates: [Number],
    address: String
  }
}, {
  timestamps: true
});

tripSchema.index({ ridePoolId: 1 });
tripSchema.index({ driverId: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ 'riderIds': 1 });

module.exports = mongoose.model('Trip', tripSchema);

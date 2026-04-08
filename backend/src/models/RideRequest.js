const mongoose = require('mongoose');

const rideRequestSchema = new mongoose.Schema({
  ridePoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RidePool',
    required: true
  },
  
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  
  pickupLocation: {
    coordinates: [Number],
    address: String
  },
  
  dropLocation: {
    coordinates: [Number],
    address: String
  },
  
  requestedAt: {
    type: Date,
    default: Date.now
  },
  
  approvedAt: {
    type: Date
  },
  
  rejectedAt: {
    type: Date
  },
  
  rejectionReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

rideRequestSchema.index({ ridePoolId: 1 });
rideRequestSchema.index({ riderId: 1 });
rideRequestSchema.index({ status: 1 });

module.exports = mongoose.model('RideRequest', rideRequestSchema);

const mongoose = require('mongoose');

const ridePoolSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    },
    s2CellId: String
  },
  
  dropLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    },
    s2CellId: String
  },
  
  departureTime: {
    type: Date,
    required: true
  },
  
  availableSeats: {
    type: Number,
    required: true,
    min: [1, 'At least 1 seat required'],
    max: [8, 'Maximum 8 seats']
  },
  
  pricePerSeat: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  
  preferences: {
    smoking: { type: Boolean, default: false },
    pets: { type: Boolean, default: false },
    femaleOnly: { type: Boolean, default: false },
    music: { type: Boolean, default: true }
  },
  
  routeData: {
    waypoints: [[Number]],
    distance: Number,
    duration: Number
  },
  
  bookedSeats: {
    type: Number,
    default: 0
  },
  
  passengers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    joinedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

ridePoolSchema.index({ pickupLocation: '2dsphere' });
ridePoolSchema.index({ dropLocation: '2dsphere' });
ridePoolSchema.index({ departureTime: 1 });
ridePoolSchema.index({ status: 1 });
ridePoolSchema.index({ driverId: 1 });

module.exports = mongoose.model('RidePool', ridePoolSchema);

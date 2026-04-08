const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Driver is required']
  },
  
  model: {
    type: String,
    required: [true, 'Car model is required'],
    trim: true,
    maxlength: [100, 'Model name too long']
  },
  
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  
  color: {
    type: String,
    required: [true, 'Car color is required'],
    trim: true
  },
  
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [8, 'Capacity cannot exceed 8']
  },
  
  preferences: {
    smoking: { type: Boolean, default: false },
    pets: { type: Boolean, default: false },
    music: { type: Boolean, default: true }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  registrationExpiry: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

vehicleSchema.index({ driverId: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);

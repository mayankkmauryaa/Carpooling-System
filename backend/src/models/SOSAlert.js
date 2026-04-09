const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ridePoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RidePool',
    index: true
  },
  message: {
    type: String,
    maxlength: 500
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved'],
    default: 'active',
    index: true
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

sosAlertSchema.index({ createdAt: -1 });
sosAlertSchema.index({ status: 1, createdAt: -1 });

sosAlertSchema.index({ location: '2dsphere' });

sosAlertSchema.methods.acknowledge = async function(adminId) {
  this.status = 'acknowledged';
  this.acknowledgedBy = adminId;
  this.acknowledgedAt = new Date();
  return await this.save();
};

sosAlertSchema.methods.resolve = async function(notes = '') {
  this.status = 'resolved';
  this.notes = notes;
  this.resolvedAt = new Date();
  return await this.save();
};

const SOSAlert = mongoose.model('SOSAlert', sosAlertSchema);

module.exports = SOSAlert;

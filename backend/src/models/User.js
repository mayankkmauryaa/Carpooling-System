const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  
  password: {
    type: String,
    required: false,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name too long']
  },
  
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name too long']
  },
  
  phone: {
    type: String,
    required: false,
    trim: true
  },
  
  role: {
    type: String,
    enum: ['driver', 'rider', 'admin'],
    default: 'rider'
  },
  
  profilePicture: {
    type: String,
    default: null
  },
  
  isProfileBlurred: {
    type: Boolean,
    default: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  totalReviews: {
    type: Number,
    default: 0
  },

  googleId: {
    type: String,
    unique: true,
    sparse: true
  },

  isGoogleUser: {
    type: Boolean,
    default: false
  },

  emailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

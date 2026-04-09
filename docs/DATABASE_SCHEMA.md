# Database Schema - Carpooling System

## 📋 Overview

This document defines the MongoDB database schema for the carpooling system using Mongoose ODM.

---

## 🏗️ Schema Design Principles (OOPS)

1. **Encapsulation**: Hide internal data, expose controlled interfaces
2. **Validation**: Use Mongoose validators for data integrity
3. **Relationships**: Proper references between collections
4. **Indexes**: Optimize query performance
5. **Virtuals**: Computed properties for convenience

---

## 📦 Collections

### 1. User Model (`users`)

```javascript
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Invalid email"],
    },

    password: {
      type: String,
      required: false, // Optional for Google Sign-In users
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name too long"],
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name too long"],
    },

    phone: {
      type: String,
      required: false, // Optional for Google Sign-In users
      trim: true,
    },

    role: {
      type: String,
      enum: ["driver", "rider", "admin"],
      default: "rider",
    },

    profilePicture: {
      type: String,
      default: null,
    },

    isProfileBlurred: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    // Google Sign-In fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined while keeping unique constraint
    },

    isGoogleUser: {
      type: Boolean,
      default: false,
    },

    emailVerified: {
      type: Boolean,
      default: false, // True for Google users (pre-verified)
    },
  },
  {
    timestamps: true,
  },
);

// ENCAPSULATION: Hide password in JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

// ENCAPSULATION: Password hashing pre-save (skip for Google users)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ENCAPSULATION: Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// INDEX: For faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ googleId: 1 });

module.exports = mongoose.model("User", userSchema);
```

---

### 2. Vehicle Model (`vehicles`)

```javascript
const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Driver is required"],
      validate: {
        validator: async function (value) {
          const user = await mongoose.model("User").findById(value);
          return user && user.role === "driver";
        },
        message: "User must be a driver",
      },
    },

    model: {
      type: String,
      required: [true, "Car model is required"],
      trim: true,
      maxlength: [100, "Model name too long"],
    },

    licensePlate: {
      type: String,
      required: [true, "License plate is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    color: {
      type: String,
      required: [true, "Car color is required"],
      trim: true,
    },

    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
      max: [8, "Capacity cannot exceed 8"],
    },

    preferences: {
      smoking: { type: Boolean, default: false },
      pets: { type: Boolean, default: false },
      music: { type: Boolean, default: true },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    registrationExpiry: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// INDEX
vehicleSchema.index({ driverId: 1 });
vehicleSchema.index({ licensePlate: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);
```

---

### 3. RidePool Model (`ridePools`)

```javascript
const mongoose = require("mongoose");

const ridePoolSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    pickupLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      s2CellId: String, // For efficient geospatial queries
    },

    dropLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      s2CellId: String,
    },

    departureTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Departure time must be in the future",
      },
    },

    availableSeats: {
      type: Number,
      required: true,
      min: [1, "At least 1 seat required"],
      max: [8, "Maximum 8 seats"],
    },

    pricePerSeat: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },

    preferences: {
      smoking: { type: Boolean, default: false },
      pets: { type: Boolean, default: false },
      femaleOnly: { type: Boolean, default: false },
      music: { type: Boolean, default: true },
    },

    routeData: {
      waypoints: [{ type: Array }],
      distance: Number, // in km
      duration: Number, // in minutes
    },

    bookedSeats: {
      type: Number,
      default: 0,
    },

    passengers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["confirmed", "cancelled"] },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// GEOSPATIAL INDEX: For location-based queries
ridePoolSchema.index({ pickupLocation: "2dsphere" });
ridePoolSchema.index({ dropLocation: "2dsphere" });
ridePoolSchema.index({ departureTime: 1 });
ridePoolSchema.index({ status: 1 });

module.exports = mongoose.model("RidePool", ridePoolSchema);
```

---

### 4. RideRequest Model (`rideRequests`)

```javascript
const mongoose = require("mongoose");

const rideRequestSchema = new mongoose.Schema(
  {
    ridePoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RidePool",
      required: true,
    },

    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },

    pickupLocation: {
      coordinates: [Number],
      address: String,
    },

    dropLocation: {
      coordinates: [Number],
      address: String,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    approvedAt: {
      type: Date,
    },

    rejectedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

// INDEX
rideRequestSchema.index({ ridePoolId: 1 });
rideRequestSchema.index({ riderId: 1 });
rideRequestSchema.index({ status: 1 });

module.exports = mongoose.model("RideRequest", rideRequestSchema);
```

---

### 5. Trip Model (`trips`)

```javascript
const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    ridePoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RidePool",
      required: true,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    riderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    startTime: {
      type: Date,
    },

    endTime: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },

    totalFare: {
      type: Number,
      default: 0,
    },

    actualDistance: {
      type: Number,
    },

    actualDuration: {
      type: Number,
    },

    startLocation: {
      coordinates: [Number],
      address: String,
    },

    endLocation: {
      coordinates: [Number],
      address: String,
    },
  },
  {
    timestamps: true,
  },
);

// INDEX
tripSchema.index({ ridePoolId: 1 });
tripSchema.index({ driverId: 1 });
tripSchema.index({ status: 1 });

module.exports = mongoose.model("Trip", tripSchema);
```

---

### 6. Review Model (`reviews`)

```javascript
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["driver-to-rider", "rider-to-driver"],
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    isVisible: {
      type: Boolean,
      default: false, // Only visible after trip completion
    },
  },
  {
    timestamps: true,
  },
);

// INDEX
reviewSchema.index({ tripId: 1 });
reviewSchema.index({ reviewerId: 1 });
reviewSchema.index({ revieweeId: 1 });

module.exports = mongoose.model("Review", reviewSchema);
```

---

### 7. Message Model (`messages`) - For In-App Messaging

```javascript
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    ridePoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RidePool",
    },

    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    isSystemMessage: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// INDEX
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
```

---

### 8. SOSAlert Model (`sosAlerts`) - Emergency Alerts

```javascript
const mongoose = require("mongoose");

const sosAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    ridePoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RidePool",
    },

    location: {
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
      },
    },

    message: {
      type: String,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["active", "acknowledged", "resolved"],
      default: "active",
    },

    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    acknowledgedAt: {
      type: Date,
    },

    notes: {
      type: String,
      maxlength: 1000,
    },

    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// INDEX
sosAlertSchema.index({ userId: 1 });
sosAlertSchema.index({ ridePoolId: 1 });
sosAlertSchema.index({ status: 1 });
sosAlertSchema.index({ createdAt: -1 });

module.exports = mongoose.model("SOSAlert", sosAlertSchema);
```

---

## 🔗 Relationships Diagram

```
┌─────────┐      ┌─────────┐      ┌──────────┐
│  User   │──────│Vehicle  │      │ RidePool │
│ (Driver)│      │         │      │          │
└────┬────┘      └────┬────┘      └────┬─────┘
     │                │                │
     │         ┌──────┴──────┐   ┌─────┴──────┐
     │         │             │   │            │
     ▼         ▼             ▼   ▼            ▼
┌─────────┐  ┌─────────┐  ┌──────────┐  ┌───────────┐
│ RideReq │  │  Trip   │  │  Review  │  │  Message  │
└─────────┘  └─────────┘  └──────────┘  └───────────┘
     │
     ▼
┌─────────┐
│ SOSAlert│  (Emergency alerts)
└─────────┘
```

---

## 📊 Query Optimization Indexes

| Collection   | Index                            | Purpose               |
| ------------ | -------------------------------- | --------------------- |
| users        | `{ email: 1 }`                   | Login queries         |
| users        | `{ role: 1 }`                    | Filter by role        |
| users        | `{ googleId: 1 }`                | Google Sign-In lookup |
| ridePools    | `{ pickupLocation: '2dsphere' }` | Geo queries           |
| ridePools    | `{ departureTime: 1 }`           | Time-based filtering  |
| ridePools    | `{ status: 1 }`                  | Status filtering      |
| rideRequests | `{ ridePoolId: 1 }`              | Get requests for ride |
| trips        | `{ driverId: 1 }`                | Driver's trip history |
| sosAlerts    | `{ userId: 1 }`                  | User's SOS history    |
| sosAlerts    | `{ status: 1 }`                  | Active alerts filter  |
| sosAlerts    | `{ createdAt: -1 }`              | Recent alerts         |

---

## 🧪 Sample Data Structures

### User Document

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "driver",
  "isProfileBlurred": true,
  "rating": 4.5,
  "totalReviews": 23,
  "googleId": null,
  "isGoogleUser": false,
  "emailVerified": false,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Google User Document

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "email": "john.doe@gmail.com",
  "password": null,
  "firstName": "John",
  "lastName": "Doe",
  "phone": null,
  "role": "rider",
  "isProfileBlurred": true,
  "rating": 4.8,
  "totalReviews": 5,
  "googleId": "google_123456789",
  "isGoogleUser": true,
  "emailVerified": true,
  "profilePicture": "https://lh3.googleusercontent.com/...",
  "createdAt": "2024-01-20T10:00:00Z",
  "updatedAt": "2024-01-20T10:00:00Z"
}
```

### RidePool Document

```json
{
  "_id": "507f1f77bcf86cd799439022",
  "driverId": "507f1f77bcf86cd799439011",
  "vehicleId": "507f1f77bcf86cd799439033",
  "pickupLocation": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749],
    "address": "123 Main St, San Francisco, CA"
  },
  "dropLocation": {
    "type": "Point",
    "coordinates": [-122.0869, 37.4028],
    "address": "456 Oak Ave, Palo Alto, CA"
  },
  "departureTime": "2024-01-20T09:00:00Z",
  "availableSeats": 3,
  "pricePerSeat": 25,
  "status": "active",
  "preferences": {
    "smoking": false,
    "pets": false,
    "femaleOnly": false
  },
  "routeData": {
    "distance": 45.2,
    "duration": 45
  },
  "bookedSeats": 1,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### SOSAlert Document

```json
{
  "_id": "507f1f77bcf86cd799439099",
  "userId": "507f1f77bcf86cd799439011",
  "ridePoolId": "507f1f77bcf86cd799439055",
  "location": {
    "coordinates": [-122.4194, 37.7749],
    "address": "123 Main St, San Francisco, CA"
  },
  "message": "Feeling unsafe, please help",
  "status": "active",
  "acknowledgedBy": null,
  "acknowledgedAt": null,
  "notes": null,
  "resolvedAt": null,
  "createdAt": "2024-01-20T14:30:00Z",
  "updatedAt": "2024-01-20T14:30:00Z"
}
```

---

_Schema designed with OOPS principles: encapsulation, validation, and proper relationships._

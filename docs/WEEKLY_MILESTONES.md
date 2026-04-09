# Weekly Milestones - Carpooling System

## 🎯 Overview

This document tracks weekly progress and milestones for the carpooling system development using **Node.js + Express + PostgreSQL (Neon) + Prisma**.

---

## 📅 Week 1: Foundation - Node.js & REST API

### Dates

**Duration:** Days 1-7

### Learning Objectives

- Understand Node.js fundamentals
- Learn REST API design principles
- Set up Express.js server
- Understand HTTP methods and status codes

### Tasks

- [ ] Initialize Node.js project
- [ ] Install dependencies (express, cors, dotenv)
- [ ] Create basic Express server
- [ ] Define API route structure
- [ ] Create first GET endpoint
- [ ] Test with Postman/curl

### Console Demo Goal

Create a simple API that returns carpooling statistics

### Key Concepts

```
REST API Structure:
GET    /api/health          → Health check
GET    /api/stats           → System statistics
POST   /api/test            → Test endpoint
```

### Deliverables

- Working Express server
- Basic API structure
- Console demo script

---

## 📅 Week 2: Database & Prisma Models

### Dates

**Duration:** Days 8-14

### Learning Objectives

- Connect to PostgreSQL (Neon DB)
- Design Prisma schemas with relations
- Understand type safety in data models
- Implement CRUD operations

### Tasks

- [x] Install Prisma and PostgreSQL dependencies
- [x] Create database connection config
- [x] Design User model (schema)
- [x] Design Vehicle model
- [x] Implement CRUD operations with repositories
- [x] Learn: Relations, enums, type safety

### Console Demo Goal

Perform CRUD operations on User and Vehicle tables

### Key Concepts

```prisma
// User Model with Relations
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  firstName String
  role      Role     @default(RIDER)

  vehicles  Vehicle[]
}

enum Role {
  DRIVER
  RIDER
  ADMIN
}

// Vehicle with Foreign Key
model Vehicle {
  id        Int   @id @default(autoincrement())
  driverId  Int
  model     String

  driver    User  @relation(fields: [driverId], references: [id])
}
```

### Deliverables

- PostgreSQL (Neon) connection
- User and Vehicle models
- CRUD API endpoints with repositories
- Console demo with database operations

---

## 📅 Week 3: Supply Service - Driver Management

### Dates

**Duration:** Days 15-21

### Learning Objectives

- Understand geospatial data handling
- Learn S2 cell concept (simplified)
- Implement real-time location tracking
- Create ride pool management

### Tasks

- [ ] Create RidePool model
- [ ] Add geospatial fields (pickup, drop locations)
- [ ] Implement driver location update API
- [ ] Create S2 cell helper functions
- [ ] Build ride pool creation endpoint
- [ ] Implement driver availability toggle

### Console Demo Goal

Simulate driver location updates and ride pool creation

### Key Concepts

```
Geospatial Query:
{
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [lon, lat] },
      $maxDistance: 5000  // 5km
    }
  }
}

S2 Cell (Simplified):
- Divide map into grid cells
- Use cell ID for quick lookup
- Much faster than lat/long queries
```

### Deliverables

- RidePool model with geospatial support
- Location tracking API
- S2 cell implementation
- Console demo for supply service

---

## 📅 Week 4: Route Matching Algorithm

### Dates

**Duration:** Days 22-28

### Learning Objectives

- Implement route match percentage calculation
- Learn algorithm complexity (O(n))
- Build proximity matching
- Create search and filter logic

### Tasks

- [ ] Implement calculateRouteMatchPercentage() function
- [ ] Build proximity calculation (Haversine formula)
- [ ] Create ride search API with filters
- [ ] Implement preference matching (smoking, pets, etc.)
- [ ] Add sorting by match percentage

### Console Demo Goal

Test matching algorithm with sample data

### Key Algorithms

```javascript
// Haversine Formula (Distance)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Route Match Percentage
function calculateMatchPercentage(driverRoute, riderRequest) {
  const startMatch = proximityScore(driverStart, riderStart);
  const endMatch = proximityScore(driverEnd, riderEnd);
  const routeMatch = routeOverlapScore(driverRoute, riderRoute);
  return startMatch * 0.3 + endMatch * 0.3 + routeMatch * 0.4;
}
```

### Deliverables

- Matching algorithm implementation
- Search API with filters
- Match percentage display
- Console demo testing matching

---

## 📅 Week 5: Demand & Dispatch Service

### Dates

**Duration:** Days 29-35

### Learning Objectives

- Handle rider ride requests
- Build dispatch matching engine
- Implement ETA calculation
- Manage ride approval workflow

### Tasks

- [ ] Create RideRequest model
- [ ] Implement request to join ride
- [ ] Build dispatch matching logic
- [ ] Implement ETA calculation (simplified)
- [ ] Create approve/reject endpoint
- [ ] Handle ride status updates

### Console Demo Goal

Full ride matching simulation from request to approval

### Key Concepts

```
Dispatch Flow:
1. Rider searches for rides
2. System calculates matches
3. Rider sends join request
4. Driver approves/rejects
5. Both parties confirmed

ETA Calculation (Simplified):
- Distance / Average Speed
- Consider traffic factor
- Use road distance, not straight line
```

### Deliverables

- RideRequest model and APIs
- Dispatch engine
- ETA calculation
- Complete matching workflow

---

## 📅 Week 6: Privacy & Security

### Dates

**Duration:** Days 36-42

### Learning Objectives

- Implement JWT authentication
- Create password hashing
- Build privacy features
- Learn security best practices

### Tasks

- [ ] Setup JWT authentication middleware
- [ ] Implement bcrypt password hashing
- [ ] Create masked phone number generator
- [ ] Build in-app messaging structure
- [ ] Implement profile blurring logic
- [ ] Create SOS endpoint structure

### Console Demo Goal

Test authentication and privacy features

### Key Implementations

```javascript
// JWT Authentication
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
  expiresIn: "7d",
});

// Masked Phone Number
function maskPhoneNumber(phone) {
  return phone.slice(0, 3) + "****" + phone.slice(-4);
}

// Profile Blurring
function getBlurredProfile(user, isRideConfirmed) {
  if (!isRideConfirmed) {
    return { name: user.firstName, photo: "blurred" };
  }
  return user;
}
```

### Deliverables

- JWT authentication
- Password security
- Privacy features
- Console demo for security

---

## 📅 Week 7: Caching & Performance

### Dates

**Duration:** Days 43-49

### Learning Objectives

- Integrate Redis caching
- Learn caching strategies
- Implement performance optimization
- Add rate limiting

### Tasks

- [ ] Setup Redis connection (or in-memory fallback)
- [ ] Cache frequently accessed rides
- [ ] Implement user session caching
- [ ] Add API rate limiting
- [ ] Optimize database queries

### Console Demo Goal

Benchmark performance with and without caching

### Caching Strategies

```
Cache-Aside Pattern:
1. Check cache for data
2. If miss, get from DB
3. Store in cache
4. Return data

Eviction Policies:
- LRU (Least Recently Used)
- TTL (Time To Live)
- Max memory limit
```

### Deliverables

- Redis integration
- Caching layer
- Performance benchmarks

---

## 📅 Week 8: React Frontend

### Dates

**Duration:** Days 50-56

### Learning Objectives

- Build React components
- Manage state with hooks
- Connect to backend APIs
- Create responsive UI

### Tasks

- [ ] Setup React project
- [ ] Install dependencies (axios, react-router)
- [ ] Create authentication pages
- [ ] Build rider dashboard
- [ ] Build driver dashboard
- [ ] Implement ride search UI
- [ ] Add ride creation form

### Console Demo Goal

Connect frontend to backend and test full flow

### Key Components

```
Pages:
- Login / Register
- Dashboard (different for rider/driver)
- Ride Search
- Ride Details
- Create Ride Pool
- My Rides
```

### Deliverables

- React application
- All major pages
- API integration

---

## 📅 Week 9: Error Handling & Logging

### Dates

**Duration:** Days 57-63

### Learning Objectives

- Implement global error handlers
- Create structured logging
- Handle exceptions gracefully
- Add retry mechanisms

### Tasks

- [ ] Create global error handler middleware
- [ ] Implement structured logging
- [ ] Add custom error classes
- [ ] Create retry logic for failed requests
- [ ] Add input validation
- [ ] Implement circuit breaker pattern

### Console Demo Goal

Test various error scenarios

### Error Handling Patterns

```javascript
// Custom Error Class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Global Error Handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  res.status(err.statusCode).json({
    status: "error",
    message: err.message,
  });
});
```

### Deliverables

- Error handling middleware
- Logging system
- Validation

---

## 📅 Week 10: Testing & Deployment

### Dates

**Duration:** Days 64-70

### Learning Objectives

- Write unit tests
- Test API endpoints
- Document the project
- Prepare for deployment

### Tasks

- [ ] Write unit tests for core functions
- [ ] Test all API endpoints
- [ ] Create README documentation
- [ ] Prepare demonstration
- [ ] Final code cleanup
- [ ] Submit to GitHub

### Final Deliverables

- Complete working application
- Documentation
- Unit tests
- GitHub repository

---

## 📊 Progress Tracker

| Week | Topic                | Status     | Notes                                     |
| ---- | -------------------- | ---------- | ----------------------------------------- |
| 1    | Node.js & REST API   | ✅ Done    | Backend structure created, Express server |
| 2    | Database & OOPS      | ✅ Done    | Prisma models with PostgreSQL/Neon        |
| 3    | Supply Service       | ✅ Done    | RidePool model, location tracking         |
| 4    | Route Matching       | ✅ Done    | Algorithm implemented, tested in console  |
| 5    | Demand & Dispatch    | ✅ Done    | Ride request handling, matching           |
| 6    | Privacy & Security   | ✅ Done    | JWT auth, Google OAuth, privacy features  |
| 7    | Caching              | ✅ Done    | Redis integration, rate limiting          |
| 8    | React Frontend       | ⏳ Pending | Not started                               |
| 9    | Error Handling       | ✅ Done    | Error middleware created                  |
| 10   | Testing & Deployment | ✅ Done    | API testing, documentation complete       |

---

_Milestones updated: [Current Date]_

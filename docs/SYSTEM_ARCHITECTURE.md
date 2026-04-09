# System Architecture - Carpooling System

## 📐 Architecture Overview

The system follows a **Service-Oriented Architecture (SOA)** similar to Uber's design, implemented with the MERN stack.

```
                              ┌─────────────────────────────────────────────────────────────────────┐
                              │                          CLIENT APPS                                │
                              │              ┌─────────────┐          ┌─────────────┐               │
                              │              │  Driver App │          │  Rider App  │               │
                              │              └──────┬──────┘          └───────┬─────┘               │
                              └─────────────────────┼─────────────────────────┼─────────────────────┘
                                                    │                         │
                                                    └──────────┬──────────────┘
                                                               │
                                                      ┌────────▼────────┐
                                                      │   API Gateway   │
                                                      │   (Express.js)  │
                                                      └────────┬────────┘
                                                               │
                                       ┌────────────────────────┼─────────────────────────┐
                                       │                        │                         │
                               ┌───────▼───────┐    ┌───────────▼───────────┐    ┌────────▼────────┐
                               │ Auth Service  │    │   Ride Service        │    │ Privacy Service │
                               │ - JWT Auth    │    │   - Supply (Drivers)  │    │ - Masked Calls  │
                               │ - Google OAuth│    │   - Demand (Riders)   │    │ - Profile Mask  │
                               │ - bcrypt      │    │   - Dispatch Matching │    │ - SOS Alerts    │
                               └───────┬───────┘    │   - Dispatch Matching │    └───────┬─────────┘
                                       │            └───────────┬───────────┘            │
                                       │                        │                        │
                                       └────────────────────────┼────────────────────────┘
                                                                │
                                                   ┌────────────▼────────────┐
                                                   │    Message Queue        │
                                                   │    (Event-based)        │
                                                   └───────────┬─────────────┘
                                                               │
                                        ┌──────────────────────┼─────────────────────┐
                                        │                      │                     │
                                   ┌────▼─────┐         ┌──────▼──────┐        ┌─────▼──────┐
                                   │ MongoDB  │         │    Redis    │        │ Analytics  │
                                   │ Primary  │         │    Cache    │        │   Pipeline │
                                   └──────────┘         └─────────────┘        └────────────┘
```

---

### 1. Authentication Service

**Responsibility:** Handle user registration, login, and token management

```javascript
// Features:
- JWT-based authentication
- Password hashing with bcrypt
- Google OAuth Sign-In
- Account linking (Google ↔ Email)
- Role-based access (driver, rider, admin)
- Token refresh mechanism
```

### Google Sign-In Flow

```
┌─────────┐      ┌─────────────┐     ┌─────────────┐
│  User   │────▶│  Backend    │────▶│   Google    │
│         │      │ /auth/google│     │   OAuth     │
└─────────┘      └─────────────┘     └─────────────┘
                      │
                      ▼
               ┌─────────────┐
               │ Find/Create │
               │   User      │
               └─────────────┘
                      │
              ┌───────┴───────┐
              ▼               ▼
        ┌───────────┐  ┌──────────┐
        │ Email     │  │ Email    │
        │ Exists?   │  │ New?     │
        │ → Link    │  │ → Create │
        └───────────┘  └──────────┘
              │               │
              └───────┬───────┘
                      ▼
               ┌─────────────┐
               │  Return JWT │
               └─────────────┘
```

---

## 🔄 API Architecture

### RESTful Endpoints Structure

```
/api/v1
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /refresh
│   ├── POST /logout
│   ├── GET  /me
│   ├── GET  /verify
│   ├── GET  /google          (Google OAuth redirect)
│   ├── GET  /google/callback (OAuth callback)
│   ├── POST /google/mobile   (Mobile Google auth)
│   └── POST /google/link     (Link Google to account)
│
├── /users
│   ├── GET  /profile
│   ├── PUT  /profile
│   ├── PUT  /password
│   ├── GET  /:id
│   ├── GET  /:userId/reviews
│   ├── GET  /
│   ├── GET  /drivers
│   ├── GET  /riders
│   ├── PUT  /:id/status
│   └── DELETE /:id
│
├── /vehicles
│   ├── POST /
│   ├── GET  /
│   ├── GET  /all
│   ├── GET  /:id
│   ├── PUT  /:id
│   ├── DELETE /:id
│   ├── PUT  /:id/status
│   └── GET  /driver/:driverId
│
├── /rides
│   ├── POST / (create ride pool)
│   ├── GET  / (search rides)
│   ├── GET  /search
│   ├── GET  /recommendations
│   ├── GET  /all
│   ├── GET  /:id
│   ├── PUT  /:id
│   ├── DELETE /:id
│   ├── GET  /:id/requests
│   ├── PUT  /:id/requests/:riderId
│   ├── POST /:id/join
│   ├── GET  /my-requests
│   ├── DELETE /:id/join
│   ├── PUT  /:id/status
│   ├── GET  /driver/:driverId
│   ├── GET  /date/:date
│   ├── GET  /upcoming
│   └── GET  /nearby
│
├── /trips
│   ├── GET  /
│   ├── GET  /all
│   ├── GET  /:id
│   ├── POST /:id/start
│   ├── POST /:id/complete
│   ├── POST /:id/cancel
│   ├── GET  /driver/:driverId
│   ├── GET  /rider/:riderId
│   ├── GET  /ridepool/:ridePoolId
│   ├── GET  /date/:date
│   ├── GET  /status/:status
│   ├── GET  /upcoming
│   └── GET  /stats
│
├── /privacy
│   ├── POST /call/initiate
│   ├── POST /call/end
│   ├── GET  /masked-phone/:userId
│   ├── POST /sos/alert
│   ├── GET  /sos/history
│   ├── GET  /settings
│   ├── PUT  /settings
│   ├── GET  /profile-visibility
│   └── PUT  /profile-visibility
│
├── /reviews
│   ├── POST /
│   ├── GET  /user/:userId
│   ├── GET  /trip/:tripId
│   ├── GET  /all
│   ├── GET  /my-reviews
│   ├── GET  /:id
│   ├── DELETE /:id
│   └── GET  /stats/user/:userId
│
├── /messages
│   ├── GET  /
│   ├── GET  /conversations
│   ├── GET  /unread-count
│   ├── GET  /conversation/:userId
│   ├── POST /
│   ├── PUT  /read
│   ├── PUT  /read/:userId
│   ├── DELETE /:messageId
│   └── DELETE /conversation/:userId
│
└── (health, stats, etc.)
```

---

## 📦 Core Services

### 1. Authentication Service

**Responsibility:** Handle user registration, login, and token management

```javascript
// Features:
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access (driver, rider, admin)
- Token refresh mechanism
```

### 2. Supply Service (Driver Management)

**Responsibility:** Manage driver profiles, vehicles, and availability

```javascript
// Features:
- Driver profile CRUD
- Vehicle management
- Real-time location tracking
- Availability status (available/busy/offline)
- S2 cell-based location storage
```

### 3. Demand Service (Rider Management)

**Responsibility:** Handle rider requests and ride searching

```javascript
// Features:
- Ride search with filters
- Preference matching
- Join request management
- Ride history
```

### 4. Dispatch Service (Matching Engine)

**Responsibility:** Match riders with compatible drivers

```javascript
// Features:
- Route matching algorithm
- ETA calculation
- Real-time dispatch
- Supply-demand balancing
```

### 5. Privacy Service

**Responsibility:** Ensure user privacy and security

```javascript
// Features:
- Masked phone numbers
- In-app messaging (VoIP)
- Profile blurring
- SOS emergency features
```

### 6. Notification Service

**Responsibility:** Send push notifications and alerts

```javascript
// Features:
- Push notifications
- In-app alerts
- Email notifications (optional)
- SMS alerts (optional)
```

### 7. Payment Service

**Responsibility:** Handle fare calculation and payments

```javascript
// Features:
- Fare calculation
- Payment integration (Stripe/PayPal)
- Transaction history
- Refund handling
```

---

## 🗄️ Database Design

### Primary Database: MongoDB

#### Collections

**users**

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed, optional for Google users),
  firstName: String,
  lastName: String,
  phone: String (optional for Google users),
  role: Enum ['driver', 'rider', 'admin'],
  profilePicture: String,
  isProfileBlurred: Boolean,
  rating: Number (0-5),
  totalReviews: Number,
  googleId: String (unique, sparse - for Google Sign-In),
  isGoogleUser: Boolean,
  emailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**vehicles**

```javascript
{
  _id: ObjectId,
  driverId: ObjectId (ref: users),
  model: String,
  licensePlate: String (unique),
  color: String,
  capacity: Number,
  preferences: {
    smoking: Boolean,
    pets: Boolean,
    music: Boolean
  },
  isActive: Boolean,
  createdAt: Date
}
```

**ridePools**

```javascript
{
  _id: ObjectId,
  driverId: ObjectId (ref: users),
  vehicleId: ObjectId (ref: vehicles),
  pickupLocation: {
    type: 'Point',
    coordinates: [longitude, latitude],
    address: String,
    s2CellId: String
  },
  dropLocation: {
    type: 'Point',
    coordinates: [longitude, latitude],
    address: String,
    s2CellId: String
  },
  departureTime: Date,
  availableSeats: Number,
  bookedSeats: Number,
  pricePerSeat: Number,
  status: Enum ['active', 'completed', 'cancelled'],
  preferences: {
    smoking: Boolean,
    pets: Boolean,
    femaleOnly: Boolean,
    music: Boolean
  },
  passengers: [{
    userId: ObjectId,
    status: 'confirmed' | 'cancelled',
    joinedAt: Date
  }],
  createdAt: Date
}
```

**rideRequests**

```javascript
{
  _id: ObjectId,
  ridePoolId: ObjectId (ref: ridePools),
  riderId: ObjectId (ref: users),
  status: Enum ['pending', 'approved', 'rejected', 'cancelled'],
  pickupLocation: { coordinates: [Number], address: String },
  dropLocation: { coordinates: [Number], address: String },
  requestedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String
}
```

**trips**

```javascript
{
  _id: ObjectId,
  ridePoolId: ObjectId (ref: ridePools),
  driverId: ObjectId (ref: users),
  riderIds: [ObjectId],
  startTime: Date,
  endTime: Date,
  status: Enum ['scheduled', 'in-progress', 'completed', 'cancelled'],
  totalFare: Number,
  actualDistance: Number,
  actualDuration: Number,
  startLocation: { coordinates: [Number], address: String },
  endLocation: { coordinates: [Number], address: String },
  createdAt: Date
}
```

**reviews**

```javascript
{
  _id: ObjectId,
  tripId: ObjectId (ref: trips),
  reviewerId: ObjectId (ref: users),
  revieweeId: ObjectId (ref: users),
  type: Enum ['driver-to-rider', 'rider-to-driver'],
  rating: Number (1-5),
  comment: String,
  isVisible: Boolean,
  createdAt: Date
}
```

**sosAlerts**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  ridePoolId: ObjectId (ref: ridePools),
  location: {
    coordinates: [Number],
    address: String
  },
  message: String,
  status: Enum ['active', 'acknowledged', 'resolved'],
  acknowledgedBy: ObjectId,
  acknowledgedAt: Date,
  notes: String,
  resolvedAt: Date,
  createdAt: Date
}
```

---

## 🔄 API Gateway Design

### Middleware Stack

```
Request → CORS → Rate Limit → Auth → Validation → Controller → Response
```

| Middleware   | Purpose                      |
| ------------ | ---------------------------- |
| cors         | Enable cross-origin requests |
| rateLimit    | Prevent API abuse            |
| auth         | JWT token verification       |
| validate     | Joi input validation         |
| errorHandler | Global error handling        |

---

## 🔒 Security Architecture

### Authentication Flow

```
Email/Password:
1. User sends credentials
2. Server validates and returns JWT
3. Client stores token
4. Subsequent requests include token
5. Server validates token on each request

Google Sign-In:
1. User clicks "Sign in with Google"
2. Backend redirects to Google OAuth consent
3. User grants permission
4. Google redirects back with authorization code
5. Backend exchanges code for tokens
6. Backend verifies Google ID token
7. Backend creates/links user account
8. Backend returns JWT token
```

### Privacy Implementation

```
Phone Number Masking:
- Generate temporary number
- Route calls through proxy
- Disconnect after ride ends

Profile Blurring:
- Hide full name (show first name only)
- Blur profile picture until confirmed
- Show only necessary trip details

SOS Emergency:
- One-tap alert button
- Automatic location capture
- Admin notification system
- Status tracking (active → acknowledged → resolved)
```

---

## 📊 Scalability Design

### Current Architecture (Single Server)

- Express.js server
- MongoDB instance
- In-memory cache (fallback)
- JWT authentication with Google OAuth

### Scaling Strategy (Future)

- **Load Balancer**: Distribute traffic
- **Database Sharding**: Split by region (S2 cells)
- **Microservices**: Separate services for each domain
- **Message Queue**: Kafka for async processing

---

## 🔍 Monitoring & Logging

### Logging Strategy

```javascript
// Log levels
- error: System errors (SOS alerts, auth failures)
- warn: Warnings (rate limits, invalid inputs)
- info: General info (registrations, logins, trips)
- debug: Debug info (database queries)
```

### Key Metrics

- API response time
- Database query time
- Cache hit rate
- Error rate
- Active users
- Google OAuth success rate

---

## ⚠️ Trade-offs Documented

| Aspect         | Decision             | Rationale                                 |
| -------------- | -------------------- | ----------------------------------------- |
| Database       | MongoDB vs SQL       | Flexible schema for evolving requirements |
| Caching        | In-memory vs Redis   | Simplified setup for learning             |
| Maps           | Mock vs Real API     | Focus on algorithm learning               |
| Real-time      | Polling vs WebSocket | Simplified implementation                 |
| Authentication | JWT + Google OAuth   | Stateless, supports social login          |

---

## 🧪 Testing Strategy

| Test Type         | Coverage                           |
| ----------------- | ---------------------------------- |
| Unit Tests        | Individual functions, algorithms   |
| Integration Tests | API endpoints, database operations |
| Manual Testing    | User flows, API testing            |
| Load Testing      | Performance under load             |

---

## 🛠️ Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration (env, db, jwt, google)
│   ├── constants/       # App constants (roles, etc.)
│   ├── controllers/     # Request handlers
│   ├── dto/             # Data transfer objects
│   ├── exceptions/      # Custom exceptions
│   ├── middleware/     # Auth, validation, rate limiting
│   ├── models/         # MongoDB schemas (Mongoose)
│   ├── repositories/    # Data access layer
│   ├── routes/         # Express routes
│   ├── services/       # Business logic layer
│   ├── utils/          # Helper functions
│   ├── validators/     # Joi validation schemas
│   └── app.js          # Express app setup
│
├── tests/              # Unit tests
├── .env.example       # Environment template
└── package.json
```

---

_Architecture designed for learning purposes with scalability in mind._

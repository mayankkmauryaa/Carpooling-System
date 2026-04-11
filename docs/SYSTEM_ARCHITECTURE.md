# System Architecture - Carpooling System

## Architecture Overview

The system follows a **Service-Oriented Architecture (SOA)** similar to Uber's design, implemented with **Node.js + Express + PostgreSQL (Neon)**.

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
                                                      └──────────┬──────┘
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
                                    ┌────▼────────┐       ┌──────▼──────┐       ┌────────────┐
                                    │ PostgreSQL  │       │    Redis    │       │ Analytics  │
                                    │ (Neon DB)   │       │    Cache    │       │  Pipeline  │
                                    └─────────────┘       └─────────────┘       └────────────┘
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

## API Architecture

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

## Core Services

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

## Database Design

### Primary Database: PostgreSQL (Neon DB)

#### Tables

**users**

| Column           | Type             | Description                           |
| ---------------- | ---------------- | ------------------------------------- |
| id               | Int (PK)         | Auto-increment ID                     |
| email            | String (unique)  | User email                            |
| password         | String?          | Hashed password (optional for Google) |
| firstName        | String           | First name                            |
| lastName         | String           | Last name                             |
| phone            | String?          | Phone (optional for Google)           |
| role             | Enum             | DRIVER, RIDER, ADMIN                  |
| profilePicture   | String?          | Profile image URL                     |
| isProfileBlurred | Boolean          | Privacy setting                       |
| rating           | Float            | Average rating (0-5)                  |
| totalReviews     | Int              | Total review count                    |
| googleId         | String? (unique) | Google Sign-In ID                     |
| isGoogleUser     | Boolean          | Is Google account                     |
| emailVerified    | Boolean          | Email verified                        |
| createdAt        | DateTime         | Creation timestamp                    |
| updatedAt        | DateTime         | Last update                           |

**vehicles**

| Column             | Type            | Description                |
| ------------------ | --------------- | -------------------------- |
| id                 | Int (PK)        | Auto-increment ID          |
| driverId           | Int (FK)        | Reference to User          |
| model              | String          | Car model                  |
| licensePlate       | String (unique) | License plate              |
| color              | String          | Car color                  |
| capacity           | Int             | Passenger capacity         |
| preferences        | JSON            | Smoking, pets, music prefs |
| isActive           | Boolean         | Active status              |
| registrationExpiry | DateTime        | Registration expiry        |

**ridePools**

| Column         | Type     | Description                              |
| -------------- | -------- | ---------------------------------------- |
| id             | Int (PK) | Auto-increment ID                        |
| driverId       | Int (FK) | Reference to User                        |
| vehicleId      | Int (FK) | Reference to Vehicle                     |
| pickupLocation | JSON     | { type, coordinates, address, s2CellId } |
| dropLocation   | JSON     | { type, coordinates, address, s2CellId } |
| departureTime  | DateTime | Scheduled departure                      |
| availableSeats | Int      | Available seats                          |
| bookedSeats    | Int      | Booked seats                             |
| pricePerSeat   | Float    | Price per seat                           |
| status         | Enum     | ACTIVE, COMPLETED, CANCELLED             |
| preferences    | JSON     | Ride preferences                         |
| passengers     | JSON     | Array of passenger info                  |
| routeData      | JSON?    | Route waypoints, distance                |

**trips**

| Column         | Type      | Description                                  |
| -------------- | --------- | -------------------------------------------- |
| id             | Int (PK)  | Auto-increment ID                            |
| ridePoolId     | Int (FK)  | Reference to RidePool                        |
| driverId       | Int (FK)  | Reference to User (driver)                   |
| riderIds       | Int[]     | Array of User IDs                            |
| startTime      | DateTime? | Trip start                                   |
| endTime        | DateTime? | Trip end                                     |
| status         | Enum      | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| totalFare      | Float     | Total fare                                   |
| actualDistance | Float?    | Actual distance traveled                     |
| actualDuration | Int?      | Actual duration (minutes)                    |

**reviews**

| Column     | Type     | Description                      |
| ---------- | -------- | -------------------------------- |
| id         | Int (PK) | Auto-increment ID                |
| tripId     | Int (FK) | Reference to Trip                |
| reviewerId | Int (FK) | Reference to User                |
| revieweeId | Int (FK) | Reference to User                |
| type       | Enum     | DRIVER_TO_RIDER, RIDER_TO_DRIVER |
| rating     | Int      | Rating (1-5)                     |
| comment    | String?  | Review comment                   |
| isVisible  | Boolean  | Visibility status                |

**sosAlerts**

| Column         | Type      | Description                    |
| -------------- | --------- | ------------------------------ |
| id             | Int (PK)  | Auto-increment ID              |
| userId         | Int (FK)  | Reference to User              |
| ridePoolId     | Int? (FK) | Reference to RidePool          |
| location       | JSON?     | { type, coordinates, address } |
| message        | String?   | Alert message                  |
| status         | Enum      | ACTIVE, ACKNOWLEDGED, RESOLVED |
| acknowledgedBy | Int?      | Admin who acknowledged         |
| acknowledgedAt | DateTime? | Acknowledged time              |
| notes          | String?   | Resolution notes               |
| resolvedAt     | DateTime? | Resolution time               |

**bookings** - NEW

| Column          | Type      | Description                       |
| --------------- | --------- | --------------------------------- |
| id              | Int (PK)  | Auto-increment ID                 |
| ridePoolId      | Int (FK)  | Reference to RidePool              |
| riderId         | Int (FK)  | Reference to User                  |
| rideRequestId   | Int?      | Reference to RideRequest           |
| status          | Enum      | PENDING, CONFIRMED, CANCELLED     |
| pickupLocation   | JSON?     | Pickup coordinates                |
| dropLocation     | JSON?     | Dropoff coordinates               |
| totalAmount     | Float     | Total booking amount              |
| paymentOrderId  | String?   | Razorpay order ID                 |

**payouts** - NEW

| Column             | Type      | Description                       |
| ----------------- | --------- | --------------------------------- |
| id                | Int (PK)  | Auto-increment ID                 |
| driverId          | Int (FK)  | Reference to User                 |
| tripId            | Int (FK)  | Reference to Trip                 |
| amount            | Float     | Payout amount (80% of fare)      |
| platformFee       | Float     | Platform fee (20%)                |
| razorpayPayoutId  | String?   | Razorpay payout ID               |
| status            | Enum      | PENDING, PROCESSING, COMPLETED    |

**sagaLogs** - NEW

| Column       | Type      | Description                    |
| ------------ | --------- | ------------------------------ |
| id           | Int (PK)  | Auto-increment ID              |
| sagaType     | String    | BOOKING, PAYOUT               |
| status       | Enum      | PENDING, IN_PROGRESS, COMPLETED |
| currentStep  | Int       | Current step index            |
| totalSteps   | Int       | Total number of steps         |
| errorMessage | String?   | Error message if failed       |
| context      | JSON?     | Saga context data             |
| completedAt  | DateTime? | Completion timestamp           |

**sagaStepLogs** - NEW

| Column     | Type      | Description                 |
| ---------- | --------- | --------------------------- |
| id         | Int (PK)  | Auto-increment ID           |
| sagaId     | Int (FK)  | Reference to SagaLog        |
| stepName   | String    | Step name                  |
| status     | String    | SUCCESS, COMPENSATED, FAILED |
| result     | String?   | Step result JSON            |
| executedAt | DateTime  | Execution timestamp          |

---

## API Gateway Design

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

## Security Architecture

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

## Scalability Design

### Current Architecture (Single Server)

- Express.js server
- PostgreSQL (Neon DB)
- In-memory cache (fallback)
- JWT authentication with Google OAuth

### Scaling Strategy (Future)

- **Load Balancer**: Distribute traffic
- **Database Sharding**: Split by region (S2 cells)
- **Microservices**: Separate services for each domain
- **Message Queue**: Kafka for async processing

---

## Monitoring & Logging

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

## Trade-offs Documented

| Aspect         | Decision           | Rationale                               |
| -------------- | ------------------ | --------------------------------------- |
| Database       | PostgreSQL (Neon)  | Type safety, relations, ACID compliance |
| ORM            | Prisma             | Type safety, migrations, IDE support    |
| Caching        | In-memory vs Redis | Simplified setup for learning           |
| Maps           | Mock vs Real API   | Focus on algorithm learning             |
| Real-time      | Socket.IO          | Full-duplex, multiple namespaces        |
| Authentication | JWT + Google OAuth | Stateless, supports social login        |
| Deployment     | Neon (serverless)  | Auto-scaling, pay-per-use               |
| Payments       | Razorpay           | India-focused, easy integration         |
| File Storage   | Cloudinary         | CDN, optimization, easy API             |
| Email          | Nodemailer + Gmail | Free, reliable for development          |
| Container      | Docker + Compose   | Reproducible, production-ready          |
| Testing        | Jest               | Fast, comprehensive coverage            |

---

## Testing Strategy

| Test Type         | Coverage                           |
| ----------------- | ---------------------------------- |
| Unit Tests        | Utilities, middleware, services    |
| Integration Tests | API endpoints, database operations |
| Manual Testing    | User flows, API testing            |
| Load Testing      | Performance under load             |

---

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma      # Prisma schema (PostgreSQL models)
├── src/
│   ├── config/            # Configuration (env, db, jwt, google)
│   ├── constants/          # App constants (roles, statuses)
│   ├── controllers/        # Request handlers
│   ├── database/          # Prisma client connection
│   ├── dto/               # Data transfer objects
│   ├── exceptions/        # Custom exceptions
│   ├── middleware/
│   │   ├── auth.js        # JWT authentication
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   ├── security/      # Sanitization, helmet, cors
│   │   └── upload/       # Multer configuration
│   ├── repositories/       # Data access layer (Prisma)
│   ├── routes/v1/
│   │   ├── admin.routes.js
│   │   ├── payments.routes.js
│   │   └── uploads.routes.js
│   ├── services/
│   │   ├── adminService.js
│   │   ├── emailService.js
│   │   ├── paymentService.js
│   │   └── uploadService.js
│   ├── socket/             # Socket.IO
│   ├── utils/             # Helper functions
│   ├── validators/        # Joi validation schemas
│   ├── app.js             # Express app setup
│   └── server.js          # Entry point
├── tests/                 # Jest unit tests
├── Dockerfile             # Production Docker
├── Dockerfile.dev         # Development Docker
├── docker-compose.yml     # Production compose
├── docker-compose.dev.yml # Development compose
├── Makefile              # Docker commands
└── package.json
```

---

## Implementation Status

| Component       | Status | Notes                             |
| --------------- | ------ | --------------------------------- |
| Backend API     | 100%   | All endpoints complete            |
| Database        | 100%   | PostgreSQL/Prisma                 |
| Authentication  | 100%   | JWT + Google OAuth                |
| Real-time       | 100%   | Socket.IO complete                |
| File Upload     | 100%   | Cloudinary integrated             |
| Email           | 100%   | All templates complete            |
| Admin Panel     | 100%   | Full dashboard + analytics        |
| Payments        | 100%   | Razorpay integrated              |
| Testing         | 100%   | Comprehensive unit tests          |
| Docker          | 100%   | Production-ready                 |
| Documentation   | 100%   | All docs updated                 |
| Google Maps     | 100%   | Distance Matrix, Directions API   |
| Event-Driven    | 100%   | Kafka + in-memory fallback       |
| Circuit Breaker | 100%   | Custom implementation            |
| Saga Pattern    | 100%   | Booking + Payout sagas           |
| Frontend        | 0%     | React app pending                |

---

## New Services Added

### 7. Payment Service

**Responsibility:** Handle fare calculation and payments

```javascript
// Features:
- Razorpay integration
- Order creation and capture
- Refund handling (full/partial)
- Customer management
- Subscriptions
- Wallet system (recharge/debit)
- Driver payouts (80% split)
- Webhook handling
```

### 8. File Upload Service

**Responsibility:** Handle file uploads and storage

```javascript
// Features:
- Cloudinary integration
- Multiple file type support
- Image optimization
- User profile uploads
- Vehicle document uploads
- Secure file deletion
```

### 9. Admin Service

**Responsibility:** Admin dashboard and management

```javascript
// Features:
- Dashboard statistics
- User management
- Vehicle verification
- Ride management
- Review moderation
- SOS alert management
- Analytics (users, rides, revenue)
- Popular routes analysis
- Peak hours detection
```

### 10. Real-time Service

**Responsibility:** Handle real-time communication

```javascript
// Features:
- Socket.IO integration
- Multiple namespaces (/rides, /users, /chat, /notifications)
- Driver location tracking
- Chat messaging
- Typing indicators
- Online status
- Notifications
```

### 11. Google Maps Service - NEW

**Responsibility:** Real distance and ETA calculations

```javascript
// Features:
- Distance Matrix API integration
- Directions API with polyline decoding
- Geocoding and reverse geocoding
- Traffic-aware ETA calculation
- In-memory caching
- Fallback to Haversine when API unavailable
```

### 12. Circuit Breaker - NEW

**Responsibility:** Resilience for external service failures

```javascript
// Features:
- State machine: CLOSED -> OPEN -> HALF_OPEN
- Configurable failure/success thresholds
- Applied to: Payment, Email, Maps services
- Automatic recovery
- Logging and metrics
```

### 13. Kafka Event Bus - NEW

**Responsibility:** Event-driven async processing

```javascript
// Features:
- Event bus with Kafka + in-memory fallback
- Topics: trip-events, payment-events, notification-events
- Publishers: Trip, Payment, Notification
- Subscribers: Trip, Payment
- Message buffering when Kafka unavailable
```

### 14. Saga Orchestrator - NEW

**Responsibility:** Distributed transaction management

```javascript
// Features:
- Booking Saga: reserve -> payment -> approve -> confirm
- Payout Saga: validate -> calculate -> process -> notify
- Compensation/rollback support
- Saga log persistence
- State tracking per saga
```

---

## Security Architecture

### Input Sanitization

```
SQL Injection Protection:
- Blocks: SELECT, INSERT, DROP, UNION, ALTER, etc.
- Pattern matching for dangerous SQL keywords

XSS Protection:
- Removes script tags, event handlers
- Escapes HTML entities

NoSQL Injection Protection:
- Blocks: $where, $ne, $gt, $regex, etc.

Prototype Pollution Protection:
- Blocks: __proto__, constructor, prototype

HTTP Parameter Pollution:
- HPP middleware for duplicate params
```

---

## Real-time Architecture

### Socket.IO Namespaces

```
/rides - Driver location updates, ride status, ETA
/users - Online status, driver availability
/chat - Conversations, messages, typing indicators
/notifications - Push notifications
```

---

_Architecture updated: April 11, 2026_
_All new services documented: Admin, Payments, Uploads, Real-time, Email, Security, Maps, Circuit Breaker, Kafka, Saga_

## Critical Bug Fixes (April 11, 2026)

### Schema Updates
- Added `verificationStatus` enum to Vehicle model
- Added `isSuspended`, `suspendedReason` to User model
- Added `make` field to Vehicle model
- Added `distance`, `estimatedDuration` to Trip and RidePool models
- Added `seatsBooked` to Booking model
- Fixed LocationHistory relation (user -> User)

### Code Fixes
- Fixed Jest version (v30 -> v29.7.0)
- Fixed adminService.js field references (name -> firstName/lastName)
- Fixed SOSAlert references (sOS -> sOSAlert)
- Fixed paymentService wallet recharge flow
- Fixed socketManager JWT field (id -> userId)
- Fixed Kafka eventBus local emission
- Fixed bookings route import paths
- Added all missing service exports
- Added bookingValidator export

### New Features
- Health check endpoints (/health/live, /health/ready)
- Token blacklist in auth middleware with Redis persistence
- Graceful shutdown handling
- Payment webhook handlers (captured, failed, refund, subscription)
- VoIP TODO comments for Twilio integration
- Booking saga wired to booking creation
- Payout saga wired to trip completion
- Notification event consumer
- User event consumer
- Socket.IO integrated with app.js
- Enhanced health checks with Redis/Kafka status

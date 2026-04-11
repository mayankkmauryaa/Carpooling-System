# Project Plan - Carpooling System

## Objective

Build a complete carpooling application using Node.js + Express + PostgreSQL (Neon) + Prisma while learning core system design concepts through pair programming.

---

## Phase Breakdown

### Phase 1: Foundation (Week 1-2) - COMPLETE

**Goal:** Set up backend infrastructure and understand REST API design

#### Week 1: Node.js & Express Setup - COMPLETE

- [x] Initialize Node.js project with package.json
- [x] Install dependencies: express, dotenv, cors, bcryptjs, jsonwebtoken, prisma
- [x] Create basic Express server structure
- [x] Setup development environment (nodemon)
- [x] Learn: REST API conventions, HTTP methods

#### Week 2: Database & Models (OOPS Focus) - COMPLETE

- [x] Connect to PostgreSQL (Neon DB)
- [x] Initialize Prisma with PostgreSQL
- [x] Create User model with proper relations
- [x] Create Vehicle model
- [x] Implement CRUD operations with repositories
- [x] Learn: Prisma relations, type safety, enums

---

### Phase 2: Core Backend (Week 3-5) - COMPLETE

**Goal:** Build supply, demand, and dispatch services

#### Week 3: Supply Service (Driver Management) - COMPLETE

- [x] Create RidePool model
- [x] Implement driver location tracking
- [x] Build S2 cell concept (simplified version)
- [x] Create ride pool creation API
- [x] Learn: Geospatial queries, real-time data

#### Week 4: Route Matching Algorithm - COMPLETE

- [x] Implement route match percentage calculation
- [x] Build proximity-based matching
- [x] Create search and filter APIs
- [x] Learn: Algorithm complexity, matching logic

#### Week 5: Demand & Dispatch - COMPLETE

- [x] Implement rider request handling
- [x] Build dispatch/matching engine
- [x] Create ETA calculation (simplified)
- [x] Handle ride approval/rejection
- [x] Learn: Dispatch optimization, real-time matching

---

### Phase 3: Privacy & Security (Week 6) - COMPLETE

**Goal:** Implement privacy features and secure authentication

#### Week 6: Privacy & Auth - COMPLETE

- [x] Setup JWT authentication
- [x] Implement password hashing with bcrypt
- [x] Implement Google OAuth Sign-In
- [x] Create account linking (Google - Email)
- [x] Create masked phone number logic
- [x] Build in-app messaging structure
- [x] Implement SOS feature structure
- [x] Add profile security (blurring)
- [x] Learn: Security best practices, token management

---

### Phase 4: Performance & Caching (Week 7) - COMPLETE

**Goal:** Optimize performance and implement caching

#### Week 7: Caching & Optimization - COMPLETE

- [x] Integrate Redis (or in-memory fallback)
- [x] Cache frequently accessed rides
- [x] Implement session caching
- [x] Add rate limiting
- [x] Learn: Caching strategies, performance optimization

---

### Phase 5: Backend Infrastructure (Week 8) - COMPLETE - NEW

**Goal:** Add production-ready infrastructure features

#### Week 8: Infrastructure & DevOps - COMPLETE

- [x] Docker configuration (Dockerfile, docker-compose)
- [x] Multi-stage production builds
- [x] Development with hot reload
- [x] Database readiness scripts
- [x] Environment configuration templates

---

### Phase 6: Testing (Week 9) - COMPLETE - NEW

**Goal:** Add comprehensive unit tests

#### Week 9: Testing & Quality Assurance - COMPLETE

- [x] Jest testing infrastructure
- [x] Unit tests for utilities (distance, ETA, routeMatcher)
- [x] Unit tests for middleware (auth, errorHandler)
- [x] Unit tests for services
- [x] Unit tests for controllers
- [x] Test mock utilities (Prisma, Redis)

---

### Phase 7: Security & Real-time (Week 10) - COMPLETE - NEW

**Goal:** Implement advanced security and real-time communication

#### Week 10: Security & WebSocket - COMPLETE

- [x] Input sanitization middleware (SQL injection, XSS, NoSQL injection)
- [x] Prototype pollution protection
- [x] HTTP Parameter Pollution (HPP) protection
- [x] Socket.IO real-time communication
- [x] Chat namespace (conversations, messages, typing)
- [x] Rides namespace (location tracking, status updates)
- [x] Users namespace (online status, availability)
- [x] Notifications namespace

---

### Phase 8: File & Email Services (Week 11) - COMPLETE - NEW

**Goal:** Add file uploads and email notifications

#### Week 11: File Upload & Email - COMPLETE

- [x] Cloudinary integration for file uploads
- [x] Multer configuration for file handling
- [x] Support for images, documents, video, audio
- [x] User profile uploads
- [x] Vehicle document uploads
- [x] Nodemailer SMTP configuration
- [x] Email templates (welcome, verification, password reset)
- [x] Ride notification emails
- [x] Review request emails
- [x] SOS alert emails

---

### Phase 9: Admin & Payments (Week 12) - COMPLETE - NEW

**Goal:** Admin panel and payment integration

#### Week 12: Admin API & Payments - COMPLETE

**Admin API:**

- [x] Dashboard with statistics
- [x] User management (suspend, delete, activate)
- [x] Vehicle verification (approve/reject)
- [x] Ride management (view, cancel)
- [x] Analytics (users, rides, revenue, popular routes, peak hours)

**Payment Integration (Razorpay):**

- [x] Order creation and payment capture
- [x] Refunds (full/partial)
- [x] Customer management
- [x] Subscriptions
- [x] Wallet system (recharge, debit, balance)
- [x] Driver payouts (80% split)
- [x] Webhook handling

---

### Phase 10: Frontend (Week 13) - PENDING

**Goal:** Build React user interface

#### Week 13: React Frontend - PENDING

- [ ] Setup React with Create React App or Vite
- [ ] Install dependencies: axios, react-router-dom
- [ ] Create authentication pages (Login/Register)
- [ ] Build dashboard for riders and drivers
- [ ] Implement ride search and creation UI
- [ ] Add ride details and matching display
- [ ] Learn: React components, state management

---

### Phase 11: Testing & Polish (Week 14) - COMPLETE

**Goal:** Ensure system reliability and complete documentation

#### Week 14: Final Polish - COMPLETE

- [x] Implement global error handlers
- [x] Add structured logging
- [x] Create custom error classes
- [x] Implement retry mechanisms
- [x] Add input validation
- [x] Complete documentation

---

### Phase 12: Advanced Features (Week 15) - COMPLETE - NEW

**Goal:** Add production-ready advanced features from industry standards

#### Week 15: Advanced Integrations - COMPLETE - NEW

**Vehicle Brand Field:**

- [x] Add brand field to Vehicle model
- [x] Update validators and DTOs
- [x] Add brand filtering to search

**Google Maps API Integration:**

- [x] Distance Matrix API for real distance calculation
- [x] Directions API with route polyline decoding
- [x] Geocoding and reverse geocoding
- [x] Traffic-aware ETA calculation
- [x] Fallback to Haversine when API unavailable

**Circuit Breakers:**

- [x] Custom circuit breaker implementation
- [x] State machine (CLOSED, OPEN, HALF_OPEN)
- [x] Applied to Payment, Email, Maps services
- [x] Configurable thresholds per service

**Kafka Event-Driven Architecture:**

- [x] Event bus with Kafka and in-memory fallback
- [x] Trip events publisher and subscriber
- [x] Payment events publisher and subscriber
- [x] Notification events publisher
- [x] Topics: trip-events, payment-events, notification-events

**Saga Pattern:**

- [x] Saga orchestrator with state tracking
- [x] Booking saga (reserve, payment, approve, confirm)
- [x] Payout saga (validate, calculate, process, notify)
- [x] Compensation/rollback support
- [x] Saga log persistence

---

## Technical Requirements

### Backend - COMPLETE

- [x] Node.js v14+
- [x] Express.js
- [x] PostgreSQL with Prisma ORM
- [x] Neon DB (serverless PostgreSQL)
- [x] JWT for authentication
- [x] bcryptjs for password hashing
- [x] Google OAuth 2.0
- [x] Redis caching
- [x] Socket.IO for real-time
- [x] Cloudinary for file uploads
- [x] Nodemailer for emails
- [x] Razorpay for payments
- [x] Jest for testing
- [x] Docker & Docker Compose
- [x] Google Maps API
- [x] Kafka message broker
- [x] Circuit breakers (custom)
- [x] Saga pattern

### Frontend - PENDING

- [ ] React 18+
- [ ] React Router v6
- [ ] Axios for API calls
- [ ] CSS or styled-components

---

## Evaluation Criteria Mapping

| Criterion               | Implementation Week                  |
| ----------------------- | ------------------------------------ |
| Authentication          | Week 6                               |
| Time & Space Complexity | Week 4 (Algorithm)                   |
| Handling System Failure | Week 14 + Week 15 (Circuit Breakers) |
| OOPS                    | Week 2 (Models)                      |
| Trade-offs              | Throughout (Documentation)           |
| System Monitoring       | Week 14 (Logging)                    |
| Caching                 | Week 7                               |
| Error Handling          | Week 14 + Week 15                    |
| Docker/Containers       | Week 8                               |
| Real-time Communication | Week 10 (Socket.IO)                  |
| File Uploads            | Week 11 (Cloudinary)                 |
| Email Notifications     | Week 11 (Nodemailer)                 |
| Admin Dashboard         | Week 12                              |
| Payments                | Week 12 (Razorpay)                   |
| Google Maps Integration | Week 15                              |
| Event-Driven Arch       | Week 15 (Kafka)                      |
| Saga Pattern            | Week 15                              |

---

### Phase 13: Bug Fixes & Polish (Week 16) - COMPLETE

**Goal:** Fix critical bugs and polish the system

#### Week 16: Bug Fixes - COMPLETE

**Schema Updates:**

- [x] Add `verificationStatus` enum to Vehicle model
- [x] Add `isSuspended`, `suspendedReason` to User model
- [x] Add `make` field to Vehicle model
- [x] Add `distance`, `estimatedDuration` to Trip and RidePool models
- [x] Add `seatsBooked` to Booking model
- [x] Add VerificationStatus enum

**Critical Bug Fixes:**

- [x] Fix Jest version (v30 -> v29.7.0)
- [x] Fix adminService.js field references (name -> firstName/lastName)
- [x] Fix SOSAlert references (sOS -> sOSAlert)
- [x] Fix paymentService wallet recharge flow
- [x] Fix socketManager JWT field (id -> userId)
- [x] Fix Kafka eventBus local emission
- [x] Fix bookings route import paths
- [x] Add all missing service exports
- [x] Add bookingValidator export

**Infrastructure:**

- [x] Health check endpoints (/health/live, /health/ready)
- [x] Token blacklist in auth middleware with Redis persistence
- [x] Graceful shutdown handling
- [x] Updated schema.sql with all new fields
- [x] Updated .env.example with all variables

---

### Phase 14: High Priority Features (Week 17) - COMPLETE

**Goal:** Implement critical features and integrations

#### Week 17: High Priority Features - COMPLETE

**Payment Webhooks:**

- [x] Implement handlePaymentCaptured - updates booking status, sends notifications
- [x] Implement handlePaymentFailed - handles failure, notifies user
- [x] Implement handleRefundProcessed - updates refund status
- [x] Implement handleSubscriptionActivated - activates subscription
- [x] Implement handleSubscriptionCancelled - deactivates subscription

**VoIP Integration:**

- [x] Add TODO comments for Twilio integration in privacyController
- [x] Add MASKED_CALL_VALIDITY_HOURS config variable

**Saga Pattern Integration:**

- [x] Wire executeBookingSaga to POST /bookings route
- [x] Wire executePayoutSaga to trip completion
- [x] Automatic payout calculation on trip completion

---

### Phase 15: Medium Priority Improvements (Week 18) - COMPLETE

**Goal:** Improve system resilience and monitoring

#### Week 18: Medium Priority - COMPLETE

**Socket.IO Integration:**

- [x] Add Socket.IO to app.js
- [x] Export setSocketServer for integration
- [x] Export getServer for Socket.IO access

**Token Blacklist:**

- [x] Persist token blacklist in Redis
- [x] Fallback to in-memory if Redis unavailable
- [x] Automatic TTL based on token expiration

**Event Consumers:**

- [x] Create notificationConsumer.js with email/SMS/push handlers
- [x] Create userEventConsumer.js for user lifecycle events
- [x] Create consumers/index.js for easy initialization

**Health Checks:**

- [x] Enhanced /health/ready with database, Redis, Kafka checks
- [x] Enhanced /health with all service checks
- [x] Return 503 if any service is degraded

---

## IMPLEMENTATION SUMMARY

### Completed Features (All Backend)

| Feature                  | Status | Commit    |
| ------------------------ | ------ | --------- |
| Docker Configuration     | Done   | `66518e4` |
| Unit Tests (Jest)        | Done   | `93ceb08` |
| Input Sanitization       | Done   | `1721d38` |
| WebSocket (Socket.IO)    | Done   | `fe2c991` |
| File Upload (Cloudinary) | Done   | `9bb851e` |
| Email (Nodemailer)       | Done   | `76c03f6` |
| Admin API                | Done   | `374cdef` |
| Razorpay Payments        | Done   | `36cbfc9` |
| Car Brand Field          | Done   | `fc36c99` |
| Google Maps API          | Done   | `1ed7339` |
| Circuit Breakers         | Done   | `7571a29` |
| Kafka Event-Driven       | Done   | `cccdc2e` |
| Saga Pattern             | Done   | `b7cec95` |
| Critical Bug Fixes       | Done   | Pending   |

---

_Last Updated: April 11, 2026_

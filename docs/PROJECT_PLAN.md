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

### Frontend - PENDING

- [ ] React 18+
- [ ] React Router v6
- [ ] Axios for API calls
- [ ] CSS or styled-components

---

## Evaluation Criteria Mapping

| Criterion               | Implementation Week        |
| ----------------------- | -------------------------- |
| Authentication          | Week 6                     |
| Time & Space Complexity | Week 4 (Algorithm)         |
| Handling System Failure | Week 14                    |
| OOPS                    | Week 2 (Models)            |
| Trade-offs              | Throughout (Documentation) |
| System Monitoring       | Week 14 (Logging)          |
| Caching                 | Week 7                     |
| Error Handling          | Week 14                    |
| Docker/Containers       | Week 8                     |
| Real-time Communication | Week 10 (Socket.IO)        |
| File Uploads            | Week 11 (Cloudinary)       |
| Email Notifications     | Week 11 (Nodemailer)       |
| Admin Dashboard         | Week 12                    |
| Payments                | Week 12 (Razorpay)         |

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

---

_Last Updated: April 10, 2026_

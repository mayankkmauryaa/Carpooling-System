# Project Plan - Carpooling System

## 🎯 Objective

Build a complete carpooling application using MERN stack while learning core system design concepts through pair programming.

---

## 📋 Phase Breakdown

### Phase 1: Foundation (Week 1-2)

**Goal:** Set up backend infrastructure and understand REST API design

#### Week 1: Node.js & Express Setup

- [ ] Initialize Node.js project with package.json
- [ ] Install dependencies: express, mongoose, dotenv, cors, bcryptjs, jsonwebtoken
- [ ] Create basic Express server structure
- [ ] Setup development environment (nodemon)
- [ ] Learn: REST API conventions, HTTP methods

**Console Demo:** Test basic API endpoints

#### Week 2: Database & Models (OOPS Focus)

- [ ] Connect to MongoDB
- [ ] Create User model with proper encapsulation
- [ ] Create Vehicle model
- [ ] Implement CRUD operations
- [ ] Learn: Encapsulation in Mongoose, schema design

**Console Demo:** Perform CRUD operations on users and vehicles

---

### Phase 2: Core Backend (Week 3-5)

**Goal:** Build supply, demand, and dispatch services

#### Week 3: Supply Service (Driver Management)

- [ ] Create RidePool model
- [ ] Implement driver location tracking
- [ ] Build S2 cell concept (simplified version)
- [ ] Create ride pool creation API
- [ ] Learn: Geospatial queries, real-time data

**Console Demo:** Simulate driver location updates

#### Week 4: Route Matching Algorithm

- [ ] Implement route match percentage calculation
- [ ] Build proximity-based matching
- [ ] Create search and filter APIs
- [ ] Learn: Algorithm complexity, matching logic

**Console Demo:** Test route matching with sample data

#### Week 5: Demand & Dispatch

- [ ] Implement rider request handling
- [ ] Build dispatch/matching engine
- [ ] Create ETA calculation (simplified)
- [ ] Handle ride approval/rejection
- [ ] Learn: Dispatch optimization, real-time matching

**Console Demo:** Full ride matching simulation

---

### Phase 3: Privacy & Security (Week 6) ✅ COMPLETE

**Goal:** Implement privacy features and secure authentication

**Status:** All tasks completed including Google OAuth Sign-In

#### Week 6: Privacy & Auth

- [x] Setup JWT authentication
- [x] Implement password hashing with bcrypt
- [x] Implement Google OAuth Sign-In
- [x] Create account linking (Google ↔ Email)
- [x] Create masked phone number logic
- [x] Build in-app messaging structure
- [x] Implement SOS feature structure
- [x] Add profile security (blurring)
- [x] Learn: Security best practices, token management

**Console Demo:** Test authentication flow

---

### Phase 4: Performance & Caching (Week 7) ✅ COMPLETE

**Goal:** Optimize performance and implement caching

#### Week 7: Caching & Optimization

- [x] Integrate Redis (or in-memory fallback)
- [x] Cache frequently accessed rides
- [x] Implement session caching
- [x] Add rate limiting
- [x] Learn: Caching strategies, performance optimization

**Console Demo:** Benchmark caching performance

---

### Phase 5: Frontend (Week 8)

**Goal:** Build React user interface

#### Week 8: React Frontend

- [ ] Setup React with Create React App or Vite
- [ ] Install dependencies: axios, react-router-dom
- [ ] Create authentication pages (Login/Register)
- [ ] Build dashboard for riders and drivers
- [ ] Implement ride search and creation UI
- [ ] Add ride details and matching display
- [ ] Learn: React components, state management

**Console Demo:** Connect frontend to backend APIs

---

### Phase 6: Testing & Polish (Week 9-10) ✅ COMPLETE

**Goal:** Ensure system reliability and complete documentation

#### Week 9: Error Handling & Logging

- [x] Implement global error handlers
- [x] Add structured logging
- [x] Create custom error classes
- [x] Implement retry mechanisms
- [x] Add input validation
- [x] Learn: Error handling patterns

**Console Demo:** Test error scenarios

#### Week 10: Final Testing & Documentation

- [x] Write unit tests for core functionality
- [x] Test API endpoints
- [x] Document all components
- [x] Create user guide
- [x] Prepare demonstration
- [x] Submit to GitHub

---

## 🛠️ Technical Requirements

### Backend

- Node.js v14+
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

### Frontend

- React 18+
- React Router v6
- Axios for API calls
- CSS or styled-components

### Console Demo

- Node.js
- In-memory data store (for learning)

---

## 📊 Evaluation Criteria Mapping

| Criterion               | Implementation Week        |
| ----------------------- | -------------------------- |
| Authentication          | Week 6                     |
| Time & Space Complexity | Week 4 (Algorithm)         |
| Handling System Failure | Week 9                     |
| OOPS                    | Week 2 (Models)            |
| Trade-offs              | Throughout (Documentation) |
| System Monitoring       | Week 9 (Logging)           |
| Caching                 | Week 7                     |
| Error Handling          | Week 9                     |

---

## 📝 Deliverables

1. **Backend API** - Full REST API with all services
2. **Database Models** - MongoDB schemas with OOPS principles
3. **Console Demos** - Learning exercises for each concept
4. **Frontend** - React application with key features
5. **Documentation** - README, API docs, architecture docs
6. **Tests** - Basic unit tests
7. **GitHub Repository** - Complete source code

---

## 🔄 Feedback Loop

After each week:

1. Review what was learned
2. Test the implemented features
3. Document challenges faced
4. Plan improvements for next week

---

_This plan will be updated as we progress through the learning journey._

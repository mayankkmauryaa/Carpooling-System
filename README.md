# Carpooling System - A MERN Stack Ride-Sharing Application with Privacy-Focused Features

![MERN Stack](https://img.shields.io/badge/MERN-Stack-4A154B?style=for-the-badge&logo=mongodb&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Status](https://img.shields.io/badge/Status-In_Development-orange)

## 📋 Project Overview

This is a full-stack carpooling application built with the MERN stack, designed to connect riders and drivers efficiently while ensuring privacy and convenience.

### Architecture (Backend Only - No Frontend Yet)

#### Technology Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcryptjs for password hashing
- Google OAuth 2.0 for authentication

### Key Features Implemented

1. **Authentication** - JWT-based auth with register/login/refresh/logout
2. **Google Sign-In** - OAuth 2.0 integration with account linking support
3. **User Management** - Profile, password change, role-based access
4. **Vehicle Management** - CRUD for driver vehicles
5. **Ride Pool** - Create rides, search, join, request management
6. **Trip Management** - Start/complete/cancel trips
7. **Privacy Features** - Masked phone numbers, blurred profiles, SOS alerts
8. **Messaging** - In-app messaging between users
9. **Reviews** - Driver/rider rating system
10. **Algorithms** - Route matching, distance calculation, ETA, S2 cell geohashing
11. **Caching** - Redis support with fallback to in-memory cache
12. **Rate Limiting** - Custom rate limiter middleware

### Project Status

#### ✅ Complete: Backend API (~50+ Source Files)

1. **Core Features - All Implemented:**
   - Authentication (JWT + Google OAuth) ✓
   - User management ✓
   - Vehicle management ✓
   - Ride pool management ✓
   - Trip management ✓
   - Privacy features ✓
   - Messaging ✓
   - Reviews ✓
   - Route matching algorithm ✓
   - Caching system ✓
   - Rate limiting ✓
   - Error handling ✓
   - Logging ✓

2. **Architecture:**
   - Repository pattern with services layer ✓
   - Custom exceptions ✓
   - Validation middleware (Joi) ✓
   - DTO/Response formatters ✓

3. **Potential Missing Items:**
   - Frontend doesn't exist yet
   - No WebSocket for real-time features
   - No payment integration
   - No email notifications
   - No file upload for profile pictures

### Evaluation Criteria Addressed

1. ✅ Authentication - JWT + bcrypt security
2. ✅ Time & Space Complexity - Efficient algorithms with O(log n) geospatial queries
3. ✅ Handling System Failure Cases - Error handling, retry mechanisms
4. ✅ Object-Oriented Programming - Proper encapsulation, inheritance in models
5. ✅ Trade-offs in System - Documented design decisions
6. ✅ System Monitoring - Logging and error tracking
7. ✅ Caching - Redis for frequently accessed data
8. ✅ Error & Exception Handling - Global error handlers

---

## 🏗️ Project Structure

```
carpooling-system/
├── backend/                 # Node.js REST API ✅ Complete
│   ├── src/
│   │   ├── config/         # Database, JWT, Google OAuth config
│   │   ├── constants/      # App constants (roles)
│   │   ├── controllers/    # API handlers
│   │   ├── dto/           # Response formatters (ApiResponse, PaginatedResponse)
│   │   ├── exceptions/     # Custom exceptions (NotFound, Conflict, etc.)
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # MongoDB schemas
│   │   ├── repositories/   # Data access layer
│   │   ├── routes/         # REST endpoints (v1/)
│   │   ├── services/       # Business logic layer
│   │   ├── utils/         # Algorithms & helpers
│   │   ├── validators/    # Joi validation schemas
│   │   ├── app.js          # Express app setup
│   │   └── server.js      # Entry point
│   └── package.json
│
├── docs/                   # Documentation
│   ├── API_ENDPOINTS.md
│   ├── API_TESTING.md
│   ├── DATABASE_SCHEMA.md
│   ├── POSTMAN.md
│   ├── SYSTEM_ARCHITECTURE.md
│   └── WORKFLOW.md
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd carpooling-system
   ```

2. **Setup Backend**

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your MongoDB URI
   npm install
   npm run dev
   ```

3. **Run Tests**
   ```bash
   cd backend
   node tests/algorithms.js
   ```

---

## 📚 Learning Path (Completed)

| Week | Topic                | Status         | Key Concepts                      |
| ---- | -------------------- | -------------- | --------------------------------- |
| 1    | REST API Design      | ✅ Complete    | HTTP methods, RESTful conventions |
| 2    | MongoDB & Mongoose   | ✅ Complete    | OOPS encapsulation, schemas       |
| 3    | Geospatial Data      | ✅ Complete    | Location tracking, S2 cells       |
| 4    | Route Matching       | ✅ Complete    | Algorithm implementation          |
| 5    | Dispatch Logic       | ✅ Complete    | Matching engine, ETA              |
| 6    | Privacy & Security   | ✅ Complete    | JWT, masked data                  |
| 7    | Caching              | ✅ Complete    | Redis optimization                |
| 8    | React Frontend       | ⏳ Not Started | Components, state                 |
| 9    | Error Handling       | ✅ Complete    | Try-catch, logging                |
| 10   | Testing & Deployment | 🔄 Partial     | CI/CD, production                 |

---

## 📖 Documentation

- [System Architecture](./docs/SYSTEM_ARCHITECTURE.md) - Technical design
- [Database Schema](./docs/DATABASE_SCHEMA.md) - MongoDB models
- [API Endpoints](./docs/API_ENDPOINTS.md) - REST API documentation
- [API Testing Guide](./docs/API_TESTING.md) - Comprehensive API testing
- [Postman Collection](./docs/POSTMAN.md) - Pre-configured Postman tests
- [Workflow](./docs/WORKFLOW.md) - Complete code flow documentation

---

## 🤝 Contributing

This is a learning project. Feel free to fork and enhance!

---

## 📅 Timeline

**Backend Completed:** April 2026  
**Duration:** Ongoing development  
**Frontend:** To be determined

---

_Built with ❤️ for learning purposes_

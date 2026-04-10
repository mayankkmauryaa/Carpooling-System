# Carpooling System - A Ride-Sharing Application with Privacy-Focused Features

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Status](https://img.shields.io/badge/Status-Backend_Complete-green)

## Project Overview

This is a full-stack carpooling application built with Node.js + Express + PostgreSQL (Neon), designed to connect riders and drivers efficiently while ensuring privacy and convenience.

### Technology Stack

- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL + Prisma ORM (Neon DB)
- **Real-time:** Socket.IO
- **Authentication:** JWT + Google OAuth 2.0
- **File Storage:** Cloudinary
- **Email:** Nodemailer + Gmail SMTP
- **Payments:** Razorpay
- **Caching:** Redis (with in-memory fallback)
- **Testing:** Jest
- **Containerization:** Docker + Docker Compose

---

## Complete Backend Features

### Core Features

| Feature            | Status | Description                              |
| ------------------ | ------ | ---------------------------------------- |
| Authentication     | Done   | JWT + Google OAuth with account linking  |
| User Management    | Done   | CRUD, profiles, password change          |
| Vehicle Management | Done   | CRUD with verification status            |
| Ride Pool          | Done   | Create, search, join, request management |
| Trip Management    | Done   | Start/complete/cancel trips              |
| Privacy Features   | Done   | Masked phone, blurred profiles, SOS      |
| Messaging          | Done   | In-app messaging with conversations      |
| Reviews            | Done   | Driver/rider rating system               |
| Route Matching     | Done   | Haversine algorithm, proximity matching  |
| Admin Panel        | Done   | Dashboard, user management, analytics    |

### Infrastructure

| Feature     | Status | Description                            |
| ----------- | ------ | -------------------------------------- |
| Docker      | Done   | Multi-stage Dockerfile, docker-compose |
| Testing     | Done   | Jest unit tests (19 test files)        |
| Security    | Done   | Input sanitization, rate limiting      |
| Real-time   | Done   | Socket.IO chat, location tracking      |
| File Upload | Done   | Cloudinary integration                 |
| Email       | Done   | Nodemailer with templates              |
| Payments    | Done   | Razorpay with wallet & payouts         |
| Caching     | Done   | Redis with in-memory fallback          |

---

## Project Structure

```
carpooling-system/
├── backend/                    # Node.js REST API
│   ├── prisma/
│   │   └── schema.prisma      # Prisma schema
│   ├── src/
│   │   ├── config/            # Database, JWT, Google, Redis config
│   │   ├── constants/          # App constants (roles, statuses)
│   │   ├── controllers/        # API handlers
│   │   ├── database/          # Prisma client connection
│   │   ├── dto/               # Response formatters
│   │   ├── exceptions/         # Custom exceptions
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT authentication
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js
│   │   │   ├── security/       # Sanitization, helmet, cors
│   │   │   └── upload/         # Multer configuration
│   │   ├── repositories/       # Data access layer
│   │   ├── routes/v1/
│   │   │   ├── admin.routes.js
│   │   │   ├── payments.routes.js
│   │   │   └── uploads.routes.js
│   │   ├── services/
│   │   │   ├── adminService.js
│   │   │   ├── emailService.js
│   │   │   ├── paymentService.js
│   │   │   └── uploadService.js
│   │   ├── socket/               # Socket.IO
│   │   ├── utils/              # Algorithms & helpers
│   │   ├── validators/          # Joi validation schemas
│   │   ├── app.js             # Express app setup
│   │   └── server.js           # Entry point
│   ├── tests/                  # Jest unit tests
│   ├── Dockerfile              # Production Docker
│   ├── Dockerfile.dev          # Development Docker
│   ├── docker-compose.yml      # Production compose
│   ├── docker-compose.dev.yml  # Development compose
│   ├── Makefile               # Docker commands
│   └── package.json
│
├── docs/                       # Documentation (Updated)
│   ├── API_ENDPOINTS.md       # All endpoints including new ones
│   ├── SYSTEM_ARCHITECTURE.md  # Architecture with new services
│   ├── PROJECT_PLAN.md         # 14-week plan with all features
│   ├── WEEKLY_MILESTONES.md   # Progress tracker
│   └── ...
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (v14+)
- Docker & Docker Compose (optional)
- PostgreSQL (Neon DB) or local
- Redis (optional)

### Quick Start (Docker)

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
docker-compose up -d
```

### Quick Start (Local)

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npx prisma db push
npx prisma generate
npm run dev
```

### Environment Variables

Create `.env` file with:

```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

---

## API Documentation

### REST Endpoints

| Category     | Endpoints                                      | Count |
| ------------ | ---------------------------------------------- | ----- |
| Auth         | register, login, refresh, logout, Google OAuth | 8     |
| Users        | profile, password, CRUD                        | 10    |
| Vehicles     | CRUD, status toggle                            | 8     |
| Rides        | create, search, join, requests                 | 15+   |
| Trips        | start, complete, cancel, stats                 | 12+   |
| Reviews      | create, get, delete                            | 8     |
| Messages     | conversations, send, read                      | 10    |
| Privacy      | masked phone, SOS, visibility                  | 10+   |
| **Uploads**  | file, profile, vehicle, metadata               | 10    |
| **Payments** | order, wallet, payout, webhook                 | 16    |
| **Admin**    | dashboard, analytics, management               | 25+   |

### WebSocket Namespaces

- `/rides` - Driver location, ride status
- `/users` - Online status, availability
- `/chat` - Real-time messaging
- `/notifications` - Push notifications

---

## Evaluation Criteria Addressed

| Criterion               | Implementation                     | Status |
| ----------------------- | ---------------------------------- | ------ |
| Authentication          | JWT + bcrypt + Google OAuth        | Done   |
| Time & Space Complexity | Route matching algorithm O(n)      | Done   |
| Handling System Failure | Error handling, retry, logging     | Done   |
| OOPS                    | Repository pattern, encapsulation  | Done   |
| Trade-offs              | Documented design decisions        | Done   |
| System Monitoring       | Logging, error tracking            | Done   |
| Caching                 | Redis + in-memory fallback         | Done   |
| Error Handling          | Global handlers, custom exceptions | Done   |
| Docker                  | Containerization, docker-compose   | Done   |
| Real-time               | Socket.IO chat & tracking          | Done   |
| File Uploads            | Cloudinary integration             | Done   |
| Email                   | Nodemailer + templates             | Done   |
| Payments                | Razorpay + wallet                  | Done   |
| Admin Dashboard         | Analytics + management             | Done   |

---

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- --testPathPattern=auth
```

---

## Docker Commands

```bash
# Build
make build

# Development
make dev

# Production
make up

# Stop
make down

# Logs
make logs

# Shell
make shell
```

---

## Documentation

- [System Architecture](./docs/SYSTEM_ARCHITECTURE.md) - Full architecture with all services
- [API Endpoints](./docs/API_ENDPOINTS.md) - Complete REST API documentation
- [Database Schema](./docs/DATABASE_SCHEMA.md) - PostgreSQL/Prisma models
- [Project Plan](./docs/PROJECT_PLAN.md) - 14-week implementation plan
- [Weekly Milestones](./docs/WEEKLY_MILESTONES.md) - Progress tracker

---

## Implementation Summary

### Commits (Last 8 Features)

| Commit    | Feature                      |
| --------- | ---------------------------- |
| `36cbfc9` | Razorpay Payment Integration |
| `374cdef` | Admin API with Analytics     |
| `76c03f6` | Nodemailer Email Service     |
| `9bb851e` | Cloudinary File Upload       |
| `fe2c991` | Socket.IO Real-time          |
| `1721d38` | Input Sanitization           |
| `93ceb08` | Jest Unit Tests              |
| `66518e4` | Docker Configuration         |

### Progress

```
███████████████░░░░░ 85% Backend Complete
████████████████░░░ 90% Documentation Updated
████████░░░░░░░░░░░░░░ 10% Frontend Pending
```

---

## Next Steps

1. **Frontend** - React application
2. **Mobile** - React Native app
3. **Push Notifications** - FCM/APNs
4. **Maps** - Google Maps/Mapbox integration
5. **SMS** - Twilio integration
6. **Analytics Dashboard** - Real-time admin panel

---

**Backend Status:** Complete  
**Frontend Status:** Pending  
**Last Updated:** April 10, 2026

---

_Built for learning purposes_

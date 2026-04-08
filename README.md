# Carpooling System - A Smart and Privacy-Focused Ride-Sharing Solution

![MERN Stack](https://img.shields.io/badge/MERN-Stack-4A154B?style=for-the-badge&logo=mongodb&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Status](https://img.shields.io/badge/Status-Planning-yellow)

## 📋 Project Overview

This is a full-stack carpooling application built with the MERN stack, designed to connect riders and drivers efficiently while ensuring privacy and convenience.

### Core Features
- **Pool Creation & Joining** - Drivers create ride pools, riders join existing pools
- **Intelligent Ride Matching** - Algorithm matches riders with compatible carpools
- **Route Matching Percentage** - Calculate how well a ride matches rider's path
- **Privacy Protection** - Masked phone numbers, in-app messaging, SOS features
- **Real-time Location Tracking** - GPS-based driver tracking

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
├── backend/                 # Node.js REST API
│   ├── src/
│   │   ├── models/         # MongoDB schemas (OOPS: Encapsulation)
│   │   ├── services/      # Business logic
│   │   ├── controllers/   # API handlers
│   │   ├── routes/        # REST endpoints
│   │   ├── middleware/    # Auth, validation
│   │   ├── utils/         # Algorithms (matching, S2)
│   │   └── config/        # Database config
│   └── package.json
│
├── frontend/               # React Web App
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # App pages
│   │   ├── services/      # API calls
│   │   ├── context/       # State management
│   │   └── utils/         # Helper functions
│   └── package.json
│
├── console/                # Console demo (learning tool)
│   └── index.js
│
├── docs/                   # Documentation
│   ├── PROJECT_PLAN.md
│   ├── WEEKLY_MILESTONES.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_ENDPOINTS.md
│   └── ALGORITHMS.md
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

3. **Setup Frontend** (Coming Soon)
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Run Console Demo**
   ```bash
   cd console
   npm install
   npm start
   ```

---

## 📚 Learning Path

| Week | Topic | Key Concepts |
|------|-------|---------------|
| 1 | REST API Design | HTTP methods, RESTful conventions |
| 2 | MongoDB & Mongoose | OOPS encapsulation, schemas |
| 3 | Geospatial Data | Location tracking, S2 cells |
| 4 | Route Matching | Algorithm implementation |
| 5 | Dispatch Logic | Matching engine, ETA |
| 6 | Privacy & Security | JWT, masked data |
| 7 | Caching | Redis optimization |
| 8 | React Frontend | Components, state |
| 9 | Error Handling | Try-catch, logging |
| 10 | Testing & Deployment | CI/CD, production |

---

## 📖 Documentation

- [Project Plan](./docs/PROJECT_PLAN.md) - Detailed implementation roadmap
- [Weekly Milestones](./docs/WEEKLY_MILESTONES.md) - Weekly goals and tasks
- [System Architecture](./docs/SYSTEM_ARCHITECTURE.md) - Technical design
- [Database Schema](./docs/DATABASE_SCHEMA.md) - MongoDB models
- [API Endpoints](./docs/API_ENDPOINTS.md) - REST API documentation
- [Algorithms](./docs/ALGORITHMS.md) - Core algorithms explained

---

## 🤝 Contributing

This is a learning project. Feel free to fork and enhance!

---

## 📅 Timeline

**Start Date:** To be determined  
**Duration:** 10 weeks  
**Mode:** Pair programming learning approach

---

*Built with ❤️ for learning purposes*
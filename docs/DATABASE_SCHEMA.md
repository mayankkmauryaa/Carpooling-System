# Database Schema - Carpooling System

## 📋 Overview

This document defines the PostgreSQL database schema for the carpooling system using **Prisma ORM** with **Neon DB** (serverless PostgreSQL).

---

## 🏗️ Schema Design Principles

1. **Type Safety**: Prisma provides TypeScript types for all models
2. **Relations**: Proper foreign key relationships between tables
3. **Indexes**: Optimize query performance
4. **Enums**: Type-safe status and role fields
5. **JSON Fields**: Store flexible data (preferences, locations) as JSON

---

## 🗄️ Database: PostgreSQL (Neon)

### Connection String Format

```
postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

---

## 📦 Tables

### 1. User (`users`)

```prisma
model User {
  id              Int       @id @default(autoincrement())
  email           String    @unique
  password        String?   // Optional for Google Sign-In users
  firstName       String
  lastName        String
  phone           String?   // Optional for Google Sign-In users
  role            Role      @default(RIDER)
  profilePicture  String?
  isProfileBlurred Boolean  @default(true)
  isActive        Boolean   @default(true)
  rating          Float     @default(0)
  totalReviews    Int       @default(0)
  googleId        String?   @unique  // For Google Sign-In
  isGoogleUser    Boolean   @default(false)
  emailVerified   Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  vehicles        Vehicle[]
  ridePools       RidePool[]
  tripsAsDriver   Trip[]    @relation("DriverTrips")
  tripsAsRider    Trip[]    @relation("RiderTrips")
  sentMessages    Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
  reviewsGiven    Review[]  @relation("ReviewsGiven")
  reviewsReceived Review[]  @relation("ReviewsReceived")
  sosAlerts       SOSAlert[]
  rideRequests    RideRequest[]

  @@index([email])
  @@index([role])
  @@index([googleId])
}

enum Role {
  DRIVER
  RIDER
  ADMIN
}
```

---

### 2. Vehicle (`vehicles`)

```prisma
model Vehicle {
  id                  Int       @id @default(autoincrement())
  driverId            Int
  model               String
  licensePlate        String    @unique
  color               String
  capacity            Int
  preferences         Json      @default("{\"smoking\": false, \"pets\": false, \"music\": true}")
  isActive            Boolean   @default(true)
  registrationExpiry  DateTime
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  driver              User      @relation(fields: [driverId], references: [id])
  ridePools           RidePool[]

  @@index([driverId])
}
```

---

### 3. RidePool (`ridePools`)

```prisma
model RidePool {
  id              Int       @id @default(autoincrement())
  driverId        Int
  vehicleId       Int
  pickupLocation  Json      // { type: 'Point', coordinates: [lng, lat], address: String, s2CellId: String }
  dropLocation    Json      // { type: 'Point', coordinates: [lng, lat], address: String, s2CellId: String }
  departureTime   DateTime
  availableSeats  Int
  pricePerSeat    Float
  status          RideStatus @default(ACTIVE)
  preferences     Json      @default("{\"smoking\": false, \"pets\": false, \"femaleOnly\": false, \"music\": true}")
  routeData       Json?     // { waypoints: [[lng, lat]], distance: Float, duration: Int }
  bookedSeats     Int       @default(0)
  passengers      Json      @default("[]")  // [{ userId: Int, status: String, joinedAt: DateTime }]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  driver          User      @relation(fields: [driverId], references: [id])
  vehicle         Vehicle   @relation(fields: [vehicleId], references: [id])
  trips           Trip[]
  messages        Message[]
  rideRequests    RideRequest[]
  sosAlerts       SOSAlert[]

  @@index([pickupLocation])
  @@index([dropLocation])
  @@index([departureTime])
  @@index([status])
  @@index([driverId])
}

enum RideStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}
```

---

### 4. RideRequest (`rideRequests`)

```prisma
model RideRequest {
  id              Int             @id @default(autoincrement())
  ridePoolId      Int
  riderId         Int
  status          RequestStatus   @default(PENDING)
  pickupLocation  Json?
  dropLocation    Json?
  requestedAt     DateTime        @default(now())
  approvedAt      DateTime?
  rejectedAt      DateTime?
  rejectionReason String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  ridePool        RidePool        @relation(fields: [ridePoolId], references: [id])
  rider           User            @relation(fields: [riderId], references: [id])

  @@index([ridePoolId])
  @@index([riderId])
  @@index([status])
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

---

### 5. Trip (`trips`)

```prisma
model Trip {
  id              Int       @id @default(autoincrement())
  ridePoolId      Int
  driverId        Int
  riderIds        Int[]     // Array of user IDs
  startTime       DateTime?
  endTime         DateTime?
  status          TripStatus @default(SCHEDULED)
  totalFare      Float     @default(0)
  actualDistance Float?
  actualDuration Int?
  startLocation  Json?     // { coordinates: [lng, lat], address: String }
  endLocation    Json?     // { coordinates: [lng, lat], address: String }
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  ridePool        RidePool  @relation(fields: [ridePoolId], references: [id])
  driver          User      @relation("DriverTrips", fields: [driverId], references: [id])
  riders          User[]    @relation("RiderTrips")
  reviews         Review[]

  @@index([ridePoolId])
  @@index([driverId])
  @@index([status])
}

enum TripStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

---

### 6. Review (`reviews`)

```prisma
model Review {
  id          Int       @id @default(autoincrement())
  tripId      Int
  reviewerId  Int
  revieweeId  Int
  type        ReviewType
  rating      Int       // 1-5
  comment     String?
  isVisible   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  trip        Trip      @relation(fields: [tripId], references: [id])
  reviewer    User      @relation("ReviewsGiven", fields: [reviewerId], references: [id])
  reviewee    User      @relation("ReviewsReceived", fields: [revieweeId], references: [id])

  @@index([tripId])
  @@index([reviewerId])
  @@index([revieweeId])
}

enum ReviewType {
  DRIVER_TO_RIDER
  RIDER_TO_DRIVER
}
```

---

### 7. Message (`messages`) - For In-App Messaging

```prisma
model Message {
  id              Int       @id @default(autoincrement())
  senderId        Int
  receiverId      Int
  ridePoolId      Int?
  content         String
  isRead          Boolean   @default(false)
  isSystemMessage Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  sender          User      @relation("SentMessages", fields: [senderId], references: [id])
  receiver        User      @relation("ReceivedMessages", fields: [receiverId], references: [id])
  ridePool        RidePool? @relation(fields: [ridePoolId], references: [id])

  @@index([senderId, receiverId])
  @@index([createdAt])
}
```

---

### 8. SOSAlert (`sOSAlerts`) - Emergency Alerts

```prisma
model SOSAlert {
  id              Int         @id @default(autoincrement())
  userId          Int
  ridePoolId      Int?
  message         String?
  location        Json?       // { type: 'Point', coordinates: [lng, lat], address: String }
  status          SOSStatus   @default(ACTIVE)
  acknowledgedBy  Int?
  acknowledgedAt  DateTime?
  resolvedAt      DateTime?
  notes           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation(fields: [userId], references: [id])
  ridePool        RidePool?   @relation(fields: [ridePoolId], references: [id])

  @@index([userId])
  @@index([ridePoolId])
  @@index([status])
  @@index([createdAt])
}

enum SOSStatus {
  ACTIVE
  ACKNOWLEDGED
  RESOLVED
}
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

| Table        | Index                   | Purpose               |
| ------------ | ----------------------- | --------------------- |
| users        | `email` (unique)        | Login queries         |
| users        | `role`                  | Filter by role        |
| users        | `googleId` (unique)     | Google Sign-In lookup |
| vehicles     | `licensePlate` (unique) | Vehicle lookup        |
| ridePools    | `departureTime`         | Time-based filtering  |
| ridePools    | `status`                | Status filtering      |
| ridePools    | `driverId`              | Driver's rides        |
| rideRequests | `ridePoolId`            | Get requests for ride |
| trips        | `driverId`              | Driver's trip history |
| sosAlerts    | `userId`                | User's SOS history    |
| sosAlerts    | `status`                | Active alerts filter  |

---

## 🧪 Sample Data Structures

### User Record

```json
{
  "id": 1,
  "email": "john@example.com",
  "password": "$2a$12$...",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "DRIVER",
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

### Google User Record

```json
{
  "id": 2,
  "email": "john.doe@gmail.com",
  "password": null,
  "firstName": "John",
  "lastName": "Doe",
  "phone": null,
  "role": "RIDER",
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

### RidePool Record

```json
{
  "id": 1,
  "driverId": 1,
  "vehicleId": 1,
  "pickupLocation": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749],
    "address": "123 Main St, San Francisco, CA",
    "s2CellId": "89c25a4c"
  },
  "dropLocation": {
    "type": "Point",
    "coordinates": [-122.0869, 37.4028],
    "address": "456 Oak Ave, Palo Alto, CA",
    "s2CellId": "89c259fc"
  },
  "departureTime": "2024-01-20T09:00:00Z",
  "availableSeats": 3,
  "pricePerSeat": 25.0,
  "status": "ACTIVE",
  "preferences": {
    "smoking": false,
    "pets": false,
    "femaleOnly": false,
    "music": true
  },
  "bookedSeats": 1,
  "passengers": "[{\"userId\": 2, \"status\": \"confirmed\", \"joinedAt\": \"2024-01-19T15:00:00Z\"}]",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### SOSAlert Record

```json
{
  "id": 1,
  "userId": 1,
  "ridePoolId": 5,
  "location": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749],
    "address": "123 Main St, San Francisco, CA"
  },
  "message": "Feeling unsafe, please help",
  "status": "ACTIVE",
  "acknowledgedBy": null,
  "acknowledgedAt": null,
  "notes": null,
  "resolvedAt": null,
  "createdAt": "2024-01-20T14:30:00Z"
}
```

---

## 🔄 Database Migration History

### Key Differences (Previous → Current)

| Aspect        | Previous (MongoDB)    | Current (PostgreSQL)    |
| ------------- | --------------------- | ----------------------- |
| ORM           | Mongoose              | Prisma                  |
| ID Type       | ObjectId (`_id`)      | Int (`id`)              |
| Collections   | Collections           | Tables                  |
| Relationships | `ref` + `.populate()` | `@relation` + `include` |
| Enums         | String + validation   | Native enum types       |
| Timestamps    | Manual                | `@default(now())`       |
| JSON Storage  | Embedded documents    | `Json` type             |

### Prisma Commands

```bash
# Initialize Prisma with PostgreSQL
npx prisma init --datasource-provider postgresql

# Generate Prisma Client
npx prisma generate

# Push schema to database (creates/updates tables)
npx prisma db push

# Open Prisma Studio (GUI)
npx prisma studio
```

---

_Prisma schema designed for type safety, performance, and maintainability._

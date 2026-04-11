# Database Schema - Carpooling System

> **Last Updated:** April 11, 2026  
> **Changes:** Added unique constraints to DriverDocument, VehicleDocument, OwnerDocument

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

## CheckOut Database Diagram : [Diagram](https://drawsql.app/draw?t=b0eb68fc-6703-42d5-999d-b99ded4a514c&view=1)

- click on the `Fit Content within View` at the bottom right button like this :
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="30px">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"></path>
  </svg>

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
  id                Int       @id @default(autoincrement())
  email             String    @unique
  password          String?   // Optional for Google Sign-In users
  firstName         String
  lastName          String
  phone             String?
  role              Role      @default(RIDER)
  profilePicture    String?
  isProfileBlurred  Boolean   @default(true)
  isActive          Boolean   @default(true)
  isSuspended       Boolean   @default(false)
  suspendedReason   String?
  rating            Float     @default(0)
  totalReviews      Int       @default(0)
  googleId          String?   @unique  // For Google Sign-In
  isGoogleUser      Boolean   @default(false)
  emailVerified     Boolean   @default(false)
  razorpayAccountId String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  vehicles          Vehicle[]          @relation("DriverVehicles")
  ownedVehicles     Vehicle[]         @relation("OwnerVehicles")
  ridePools         RidePool[]
  tripsAsDriver     Trip[]             @relation("DriverTrips")
  tripsAsRider      Trip[]            @relation("RiderTrips")
  sentMessages      Message[]          @relation("SentMessages")
  receivedMessages  Message[]         @relation("ReceivedMessages")
  reviewsGiven     Review[]           @relation("ReviewsGiven")
  reviewsReceived  Review[]          @relation("ReviewsReceived")
  sosAlerts        SOSAlert[]
  rideRequests     RideRequest[]
  bookings         Booking[]
  payouts          Payout[]
  driverLocations  DriverLocation[]
  locationHistories LocationHistory[]
  payments         Payment[]
  wallet           Wallet?
  razorpayCustomer RazorpayCustomer[]
  driverDocuments  DriverDocument[]   @relation("DriverDocuments")
  paymentMethods   PaymentMethod[]
  owner            Owner?
  ownerDocuments   OwnerDocument[]    @relation("OwnerDocuments")

  @@index([email])
  @@index([role])
  @@index([googleId])
}

enum Role {
  DRIVER
  RIDER
  ADMIN
  OWNER
}
```

---

### 2. Vehicle (`vehicles`)

```prisma
model Vehicle {
  id                  Int                @id @default(autoincrement())
  driverId            Int
  ownerId             Int?
  brand               String
  make                String?
  model               String
  licensePlate        String              @unique
  color               String
  capacity            Int
  vehicleType         VehicleType        @default(SEDAN)
  verificationStatus  VerificationStatus @default(PENDING)
  preferences         Json               @default("{\"smoking\": false, \"pets\": false, \"music\": true}")
  isActive            Boolean            @default(true)
  registrationExpiry  DateTime
  pricePerDay         Float              @default(0)
  pricePerKm          Float              @default(0)
  minimumCharge       Float              @default(0)
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  driver    User       @relation("DriverVehicles", fields: [driverId], references: [id])
  owner     User?      @relation("OwnerVehicles", fields: [ownerId], references: [id])
  ridePools RidePool[]
  documents VehicleDocument[]

  @@index([driverId])
  @@index([ownerId])
  @@index([brand])
  @@index([verificationStatus])
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

### 9. PaymentMethod (`paymentMethods`) - Saved Payment Methods

```prisma
model PaymentMethod {
  id        Int      @id @default(autoincrement())
  userId    Int
  type      String   // CARD, UPI, BANK_ACCOUNT, WALLET, CASH
  isDefault Boolean  @default(false)
  details   Json     // { last4: String, bank: String, etc. }
  status    String   @default("ACTIVE")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([type])
  @@index([status])
}
```

---

### 10. Owner (`owners`) - Fleet/Owner Registration

```prisma
model Owner {
  id                 Int      @id @default(autoincrement())
  userId             Int      @unique
  businessName       String?
  gstNumber          String?
  panNumber          String?
  rejectionReason    String?
  verificationStatus DocStatus @default(PENDING)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user      User            @relation(fields: [userId], references: [id])
  documents OwnerDocument[]

  @@index([userId])
}

enum DocStatus {
  PENDING
  UPLOADED
  UNDER_REVIEW
  APPROVED
  REJECTED
  EXPIRED
}
```

---

### 11. DriverDocument (`driverDocuments`) - Driver Verification Documents

```prisma
model DriverDocument {
  id             Int                @id @default(autoincrement())
  driverId       Int
  documentType   DriverDocumentType
  url            String
  status         DocStatus          @default(PENDING)
  verifiedAt     DateTime?
  verifiedBy     Int?
  rejectedReason String?
  expiresAt      DateTime?
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  driver         User @relation("DriverDocuments", fields: [driverId], references: [id])
  verifiedByUser User? @relation("VerifiedDriverDocs", fields: [verifiedBy], references: [id])

  @@unique([driverId, documentType])
  @@index([driverId])
  @@index([documentType])
  @@index([status])
  @@index([expiresAt])
}

enum DriverDocumentType {
  AADHAAR
  PAN
  PASSPORT_PHOTO
  DRIVING_LICENSE
  POLICE_VERIFICATION
  BANK_DETAILS
  BADGE
  MEDICAL_FITNESS
}
```

---

### 12. VehicleDocument (`vehicleDocuments`) - Vehicle Verification Documents

```prisma
model VehicleDocument {
  id             Int                   @id @default(autoincrement())
  vehicleId      Int
  documentType   VehicleDocumentType
  url            String
  status         DocStatus             @default(PENDING)
  verifiedAt     DateTime?
  verifiedBy     Int?
  rejectedReason String?
  expiresAt      DateTime?
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt

  vehicle       Vehicle @relation(fields: [vehicleId], references: [id])
  verifiedByUser User?   @relation("VerifiedVehicleDocs", fields: [verifiedBy], references: [id])

  @@unique([vehicleId, documentType])
  @@index([vehicleId])
  @@index([documentType])
  @@index([status])
  @@index([expiresAt])
}

enum VehicleDocumentType {
  RC
  PERMIT
  INSURANCE
  FITNESS_CERTIFICATE
  PUC
  FASTAG
}
```

---

### 13. OwnerDocument (`ownerDocuments`) - Owner Business Documents

```prisma
model OwnerDocument {
  id             Int                @id @default(autoincrement())
  ownerId        Int
  documentType   OwnerDocumentType
  url            String
  status         DocStatus          @default(PENDING)
  verifiedAt     DateTime?
  verifiedBy     Int?
  rejectedReason String?
  expiresAt      DateTime?
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  owner         Owner  @relation(fields: [ownerId], references: [id])
  verifiedByUser User?  @relation("VerifiedOwnerDocs", fields: [verifiedBy], references: [id])

  @@unique([ownerId, documentType])
  @@index([ownerId])
  @@index([documentType])
  @@index([status])
  @@index([expiresAt])
}

enum OwnerDocumentType {
  GST
  PAN
  BUSINESS_LICENSE
  ADDRESS_PROOF
}
```

---

### 14. VehicleType Enum (Updated)

```prisma
enum VehicleType {
  SEDAN
  SUV
  HATCHBACK
  MINIVAN
  TEMPO
  MOTORCYCLE
  AUTO
  EV_SEDAN
  EV_SUV
  EV_HATCHBACK
  EV_AUTO
  EV_MOTORCYCLE
  LUXURY
  PREMIUM
  ECONOMY
  PICKUP
  TRUCK
  VAN
}
```

---

### 15. VerificationStatus Enum

```prisma
enum VerificationStatus {
  PENDING
  VERIFIED
  REJECTED
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

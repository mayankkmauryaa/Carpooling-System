# Carpooling System - Console Demo

> Interactive CLI for testing the backend API

## Prerequisites

1. Backend server must be running (`npm run dev`)
2. Database must be connected (Neon PostgreSQL)
3. Environment variables configured in `.env`

## Quick Start

```bash
cd backend
npm run dev
```

In another terminal:

```bash
cd backend
node src/console.js
```

---

## Menu Structure

```
╔════════════════════════════════════════════════════════════════════╗
║                   CARPOOLING SYSTEM CONSOLE DEMO                   ║
╠════════════════════════════════════════════════════════════════════╣
║  1. AUTHENTICATION                                                 ║
║  2. USER MANAGEMENT                                                ║
║  3. VEHICLE MANAGEMENT                                             ║
║  4. RIDE MANAGEMENT                                                ║
║  5. TRIP MANAGEMENT                                                ║
║  6. MESSAGING                                                      ║
║  7. REVIEWS                                                        ║
║  8. PRIVACY FEATURES                                               ║
║  9. ADMIN FUNCTIONS                                                ║
║  0. EXIT                                                           ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 1. Authentication

```
┌─────────────────────────────────────────────────────────────────┐
│ AUTHENTICATION                                                  │
├─────────────────────────────────────────────────────────────────┤
│ 1.1 Register as Rider                                           │
│ 1.2 Register as Driver                                          │
│ 1.3 Login                                                       │
│ 1.4 Login with Google (Mobile)                                  │
│ 1.5 Get Current User                                            │
│ 1.6 Refresh Token                                               │
│ 1.7 Link Google Account                                         │
│ 0. Back to Main Menu                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 1.1 Register as Rider

```
Input: email, password, firstName, lastName, phone
Action: POST /api/v1/auth/register
Output: { user, token }
```

### 1.2 Register as Driver

```
Input: email, password, firstName, lastName, phone
Action: POST /api/v1/auth/register (role=DRIVER)
Output: { user, token }
```

### 1.3 Login

```
Input: email, password
Action: POST /api/v1/auth/login
Output: { user, token }
```

---

## 2. User Management

```
┌─────────────────────────────────────────────────────────────────┐
│ USER MANAGEMENT                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 2.1 View My Profile                                             │
│ 2.2 Update My Profile                                           │
│ 2.3 Change Password                                             │
│ 2.4 View User by ID (Admin)                                     │
│ 2.5 List All Users (Admin)                                      │
│ 2.6 List All Drivers (Admin)                                    │
│ 2.7 List All Riders (Admin)                                     │
│ 2.8 Toggle User Status (Admin)                                  │
│ 0. Back to Main Menu                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Update My Profile

```
Input: firstName, lastName, phone, profilePicture, isProfileBlurred
Action: PUT /api/v1/users/profile
```

### 2.3 Change Password

```
Input: currentPassword, newPassword
Action: PUT /api/v1/users/password
```

---

## 3. Vehicle Management

```
┌─────────────────────────────────────────────────────────────────┐
│ VEHICLE MANAGEMENT                                              │
├─────────────────────────────────────────────────────────────────┤
│ 3.1 Create Vehicle (Driver only)                                │
│ 3.2 View My Vehicles                                            │
│ 3.3 View Vehicle by ID                                          │
│ 3.4 Update Vehicle                                              │
│ 3.5 Delete Vehicle                                              │
│ 3.6 Toggle Vehicle Status                                       │
│ 3.7 List All Vehicles (Admin)                                   │
│ 0. Back to Main Menu                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1 Create Vehicle

```
Input: model, licensePlate, color, capacity, registrationExpiry, preferences
Action: POST /api/v1/vehicles
Example:
  - model: Toyota Camry
  - licensePlate: ABC-1234
  - color: Silver
  - capacity: 4
  - registrationExpiry: 2027-12-31
```

---

## 4. Ride Management

```
┌─────────────────────────────────────────────────────────────────┐
│ RIDE MANAGEMENT                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 4.1 Create Ride (Driver only)                                   │
│ 4.2 View My Rides                                               │
│ 4.3 Search Rides                                                │
│ 4.4 Get Recommendations                                         │
│ 4.5 View Ride by ID                                             │
│ 4.6 Update Ride                                                 │
│ 4.7 Cancel Ride                                                 │
│ 4.8 Get Ride Requests (Driver)                                  │
│ 4.9 Respond to Request (Driver)                                 │
│ 4.10 Request to Join Ride                                       │
│ 4.11 Get My Requests                                            │
│ 4.12 Cancel Join Request                                        │
│ 4.13 Get Nearby Rides                                           │
│ 4.14 Get Upcoming Rides                                         │
│ 4.15 List All Rides (Admin)                                     │
│ 0. Back to Main Menu                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 4.1 Create Ride

```
Input: vehicleId, pickupLocation, dropLocation, departureTime, availableSeats, pricePerSeat
Action: POST /api/v1/rides

Example:
  - vehicleId: 1
  - pickupLocation: { "coordinates": [-122.4194, 37.7749], "address": "San Francisco, CA" }
  - dropLocation: { "coordinates": [-122.0869, 37.4028], "address": "Palo Alto, CA" }
  - departureTime: 2026-04-15T09:00:00Z
  - availableSeats: 3
  - pricePerSeat: 25.00
```

### 4.3 Search Rides

```
Input: pickupLat, pickupLng, dropLat, dropLng, radius, departureDate, availableSeats
Action: GET /api/v1/rides/search

Example:
  - pickupLat: 37.7749
  - pickupLng: -122.4194
  - dropLat: 37.4028
  - dropLng: -122.0869
  - radius: 15 (km)
  - departureDate: 2026-04-15
  - availableSeats: 2
```

### 4.9 Respond to Request

```
Input: rideId, riderId, action (approve/reject), reason
Action: PUT /api/v1/rides/:id/requests/:riderId?action=approve
```

---

## 5. Trip Management

```
┌─────────────────────────────────────────────────────────────────┐
│ TRIP MANAGEMENT                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 5.1 View My Trips                                               │
│ 5.2 View Trip by ID                                             │
│ 5.3 Start Trip (Driver only)                                    │
│ 5.4 Complete Trip (Driver only)                                 │
│ 5.5 Cancel Trip                                                 │
│ 5.6 Get Trip by RidePool                                        │
│ 5.7 Get Trips by Date                                           │
│ 5.8 Get Upcoming Trips                                          │
│ 5.9 Get Trip Stats (Admin)                                      │
│ 5.10 List All Trips (Admin)                                     │
│ 0. Back to Main Menu                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Start Trip

```
Input: tripId
Action: POST /api/v1/trips/:id/start
```

### 5.4 Complete Trip

```
Input: tripId, actualDistance, actualDuration, endLocation
Action: POST /api/v1/trips/:id/complete

Example:
  - actualDistance: 45.5
  - actualDuration: 50 (minutes)
  - endLocation: { "coordinates": [-122.0869, 37.4028], "address": "Palo Alto, CA" }
```

---

## 6. Messaging

```
┌─────────────────────────────────────────────────────────────────┐
│ MESSAGING                                                       │
├─────────────────────────────────────────────────────────────────┤
│ 6.1 Send Message                                                │
│ 6.2 View Conversations                                          │
│ 6.3 View Conversation with User                                 │
│ 6.4 Get Unread Count                                            │
│ 6.5 Mark Messages as Read                                       │
│ 6.6 Delete Message                                              │
│ 6.7 Delete Conversation                                         │
│ 0. Back to Main Menu                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 6.1 Send Message

```
Input: receiverId, ridePoolId (optional), content
Action: POST /api/v1/messages
```

---

## 7. Reviews

```
┌─────────────────────────────────────────────────────────────────┐
│ REVIEWS                                                         │
├─────────────────────────────────────────────────────────────────┤
│ 7.1 Create Review                                               │
│ 7.2 View My Reviews                                             │
│ 7.3 View User Reviews                                           │
│ 7.4 View Trip Reviews                                           │
│ 7.5 View Review Stats                                           │
│ 7.6 Delete Review                                               │
│ 7.7 List All Reviews (Admin)                                    │
│ 0. Back to Main Menu                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 7.1 Create Review

```
Input: tripId, revieweeId, type, rating, comment
Action: POST /api/v1/reviews

Example:
  - tripId: 1
  - revieweeId: 2
  - type: RIDER_TO_DRIVER
  - rating: 5
  - comment: Great ride! Very friendly driver.
```

---

## 8. Privacy Features

```
┌─────────────────────────────────────────────────────────────────┐
│ PRIVACY FEATURES                                                │
├─────────────────────────────────────────────────────────────────┤
│ 8.1 Initiate Call                                               │
│ 8.2 End Call                                                    │
│ 8.3 Get Masked Phone                                            │
│ 8.4 Send SOS Alert                                              │
│ 8.5 View SOS History                                            │
│ 8.6 Get Privacy Settings                                        │
│ 8.7 Update Privacy Settings                                     │
│ 8.8 Get Profile Visibility                                      │
│ 0. Back to Main Menu                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Get Masked Phone

```
Input: userId
Action: GET /api/v1/privacy/masked-phone/:userId
Output: { maskedPhone: "+1***-***-4567" }
```

### 8.5 Send SOS Alert

```
Input: ridePoolId, message, location
Action: POST /api/v1/privacy/sos/alert

Example:
  - ridePoolId: 1
  - message: Emergency! Need help.
  - location: { "coordinates": [-122.4194, 37.7749], "address": "San Francisco, CA" }
```

---

## 9. Admin Functions

```
┌─────────────────────────────────────────────────────────────────┐
│ ADMIN FUNCTIONS                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 9.1 System Health Check                                         │
│ 9.2 View System Stats                                           │
│ 9.3 Toggle User Status                                          │
│ 9.4 Delete User                                                 │
│ 9.5 Update Ride Status                                          │
│ 9.6 View All Vehicles                                           │
│ 9.7 View All Rides                                              │
│ 9.8 View All Trips                                              │
│ 9.9 View All Reviews                                            │
│ 0. Back to Main Menu                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Demo Scenarios

### Scenario 1: Driver Creates Ride and Accepts Rider

```
1. Register as Driver
   → Save driverToken, driverId

2. Register as Rider
   → Save riderToken, riderId

3. (Driver) Create Vehicle
   → Save vehicleId

4. (Driver) Create Ride
   → Save ridePoolId

5. (Rider) Search/View Rides
   → Find the ride

6. (Rider) Request to Join
   → Creates PENDING request

7. (Driver) View Ride Requests
   → Shows rider's request

8. (Driver) Approve Request
   → Creates Trip with status SCHEDULED

9. (Driver) Start Trip
   → Trip status = IN_PROGRESS

10. (Driver) Complete Trip
    → Trip status = COMPLETED

11. (Rider) Create Review
    → Review created for driver
```

### Scenario 2: SOS Emergency

```
1. (Rider) On trip, send SOS Alert
   → Status: ACTIVE

2. (Admin) View System Stats
   → See active SOS alerts

3. (Admin) Acknowledge SOS (via database)
   → Status: ACKNOWLEDGED

4. (Admin) Resolve SOS (via database)
   → Status: RESOLVED
```

---

## Sample Test Data

### Test Users

```javascript
const testUsers = {
  driver: {
    email: "driver@test.com",
    password: "password123",
    firstName: "John",
    lastName: "Driver",
    role: "DRIVER",
  },
  rider: {
    email: "rider@test.com",
    password: "password123",
    firstName: "Jane",
    lastName: "Rider",
    role: "RIDER",
  },
  admin: {
    email: "admin@test.com",
    password: "password123",
    firstName: "Admin",
    lastName: "User",
    role: "ADMIN",
  },
};
```

### Test Locations

```javascript
const testLocations = {
  sanFrancisco: {
    coordinates: [-122.4194, 37.7749],
    address: "San Francisco, CA",
  },
  paloAlto: {
    coordinates: [-122.0869, 37.4028],
    address: "Palo Alto, CA",
  },
  berkeley: {
    coordinates: [-122.2711, 37.8716],
    address: "Berkeley, CA",
  },
  oakland: {
    coordinates: [-122.2711, 37.8044],
    address: "Oakland, CA",
  },
};
```

### Test Vehicle

```javascript
const testVehicle = {
  model: "Toyota Camry",
  licensePlate: "TEST-001",
  color: "Silver",
  capacity: 4,
  registrationExpiry: "2027-12-31",
};
```

---

## Troubleshooting

### "Connection refused"

- Backend server not running
- Run: `npm run dev`

### "401 Unauthorized"

- Token expired
- Login again to get new token

### "403 Forbidden"

- Insufficient permissions
- Check your role (DRIVER/RIDER/ADMIN)

### "404 Not Found"

- Wrong endpoint
- Check API prefix (/api/v1/)

### "Validation Error"

- Invalid input data
- Check required fields and formats

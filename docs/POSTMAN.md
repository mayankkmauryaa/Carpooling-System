# Carpooling System API - Postman Collection

## How to Import

1. Open Postman
2. Click "Import" button
3. Select this JSON file
4. Collection will be imported with all endpoints

---

## API Versions

| Version                  | Base URL                       | Status              |
| ------------------------ | ------------------------------ | ------------------- |
| **API v1 (Recommended)** | `http://localhost:3000/api/v1` | Current             |
| **Legacy API**           | `http://localhost:3000/api`    | Backward Compatible |

---

## Postman Variables

Create the following variables in your Postman collection:

| Variable     | Initial Value                | Description              |
| ------------ | ---------------------------- | ------------------------ |
| `baseUrl`    | http://localhost:3000/api    | Legacy API Base URL      |
| `baseUrlV1`  | http://localhost:3000/api/v1 | New API v1 Base URL      |
| `token`      | (empty)                      | JWT token from login     |
| `userId`     | (empty)                      | Current user ID          |
| `ridePoolId` | (empty)                      | Ride pool ID for testing |
| `tripId`     | (empty)                      | Trip ID for testing      |
| `vehicleId`  | (empty)                      | Vehicle ID for testing   |

---

## Authentication Token

Most endpoints require `Authorization: Bearer {{token}}` header.
Use the login response to set the `token` variable.

---

# =============================================================================

# LEGACY API (/api/)

# =============================================================================

## 🔐 LEGACY AUTHENTICATION

### 1. Register User (Legacy)

```
POST {{baseUrl}}/auth/register
```

**Body (JSON):**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "rider"
}
```

### 2. Login (Legacy)

```
POST {{baseUrl}}/auth/login
```

**Body (JSON):**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 3. Get Current User (Legacy)

```
GET {{baseUrl}}/auth/me
```

**Headers:** `Authorization: Bearer {{token}}`

### 4. Verify Token (Legacy)

```
GET {{baseUrl}}/auth/verify
```

**Headers:** `Authorization: Bearer {{token}}`

### 5. Refresh Token (Legacy)

```
POST {{baseUrl}}/auth/refresh
```

**Headers:** `Authorization: Bearer {{token}}`

### 6. Logout (Legacy)

```
POST {{baseUrl}}/auth/logout
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 👤 LEGACY USERS

### 7. Get My Profile (Legacy)

```
GET {{baseUrl}}/users/profile
```

**Headers:** `Authorization: Bearer {{token}}`

### 8. Update Profile (Legacy)

```
PUT {{baseUrl}}/users/profile
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "profilePicture": "https://example.com/photo.jpg",
  "isProfileBlurred": true
}
```

### 9. Change Password (Legacy)

```
PUT {{baseUrl}}/users/password
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

### 10. Get User by ID (Legacy)

```
GET {{baseUrl}}/users/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 11. Get User Reviews (Legacy)

```
GET {{baseUrl}}/users/:userId/reviews
```

**Headers:** `Authorization: Bearer {{token}}`

### 12. Get All Users (Legacy)

```
GET {{baseUrl}}/users?page=1&limit=20&role=driver&search=john&isActive=true
```

**Headers:** `Authorization: Bearer {{token}}`

### 13. Get All Drivers (Legacy - Admin)

```
GET {{baseUrl}}/users/drivers?page=1&limit=20&isActive=true&search=john
```

**Headers:** `Authorization: Bearer {{token}}`

### 14. Get All Riders (Legacy - Admin)

```
GET {{baseUrl}}/users/riders?page=1&limit=20&isActive=true&search=john
```

**Headers:** `Authorization: Bearer {{token}}`

### 15. Toggle User Status (Legacy - Admin)

```
PUT {{baseUrl}}/users/:id/status
```

**Headers:** `Authorization: Bearer {{token}}`

### 16. Delete User (Legacy - Admin)

```
DELETE {{baseUrl}}/users/:id
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 🚗 LEGACY VEHICLES

### 17. Create Vehicle (Legacy - Driver Only)

```
POST {{baseUrl}}/vehicles
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "model": "Toyota Camry",
  "licensePlate": "ABC-1234",
  "color": "Silver",
  "capacity": 4,
  "preferences": {
    "smoking": false,
    "pets": false,
    "music": true
  },
  "registrationExpiry": "2027-12-31"
}
```

### 18. Get My Vehicles (Legacy)

```
GET {{baseUrl}}/vehicles
```

**Headers:** `Authorization: Bearer {{token}}`

### 19. Get All Vehicles (Legacy - Admin)

```
GET {{baseUrl}}/vehicles/all?page=1&limit=20&isActive=true&model=Camry&color=Silver
```

**Headers:** `Authorization: Bearer {{token}}`

### 20. Get Vehicle by ID (Legacy)

```
GET {{baseUrl}}/vehicles/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 21. Update Vehicle (Legacy)

```
PUT {{baseUrl}}/vehicles/:id
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "model": "Toyota Camry",
  "color": "Black",
  "capacity": 4
}
```

### 22. Delete Vehicle (Legacy)

```
DELETE {{baseUrl}}/vehicles/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 23. Toggle Vehicle Status (Legacy)

```
PUT {{baseUrl}}/vehicles/:id/status
```

**Headers:** `Authorization: Bearer {{token}}`

### 24. Get Vehicles by Driver (Legacy - Admin)

```
GET {{baseUrl}}/vehicles/driver/:driverId?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 🚙 LEGACY RIDES (RidePool)

### 25. Create Ride (Legacy - Driver Only)

```
POST {{baseUrl}}/rides
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "vehicleId": "VEHICLE_ID_HERE",
  "pickupLocation": {
    "coordinates": [-122.4194, 37.7749],
    "address": "San Francisco, CA"
  },
  "dropLocation": {
    "coordinates": [-122.0869, 37.4028],
    "address": "Palo Alto, CA"
  },
  "departureTime": "2026-04-15T09:00:00Z",
  "availableSeats": 3,
  "pricePerSeat": 25,
  "preferences": {
    "smoking": false,
    "pets": false,
    "femaleOnly": false,
    "music": true
  }
}
```

### 26. Get My Rides (Legacy)

```
GET {{baseUrl}}/rides?status=active&page=1&limit=10
```

**Headers:** `Authorization: Bearer {{token}}`

### 27. Search Rides (Legacy)

```
GET {{baseUrl}}/rides/search?pickupLat=37.7749&pickupLng=-122.4194&dropLat=37.4028&dropLng=-122.0869&radius=15&departureDate=2026-04-15&availableSeats=2
```

**Headers:** `Authorization: Bearer {{token}}`

### 28. Get Recommendations (Legacy)

```
GET {{baseUrl}}/rides/recommendations
```

**Headers:** `Authorization: Bearer {{token}}`

### 29. Get All Rides (Legacy - Admin)

```
GET {{baseUrl}}/rides/all?page=1&limit=20&status=active&minSeats=2&maxPrice=30
```

**Headers:** `Authorization: Bearer {{token}}`

### 30. Get Ride by ID (Legacy)

```
GET {{baseUrl}}/rides/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 31. Update Ride (Legacy)

```
PUT {{baseUrl}}/rides/:id
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "availableSeats": 2,
  "pricePerSeat": 20
}
```

### 32. Cancel Ride (Legacy)

```
DELETE {{baseUrl}}/rides/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 33. Get Ride Requests (Legacy - Driver)

```
GET {{baseUrl}}/rides/:id/requests
```

**Headers:** `Authorization: Bearer {{token}}`

### 34. Respond to Request (Legacy - Driver)

```
PUT {{baseUrl}}/rides/:id/requests/:riderId?action=approve
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "action": "approve",
  "reason": "Welcome aboard!"
}
```

### 35. Request to Join Ride (Legacy)

```
POST {{baseUrl}}/rides/:id/join
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "pickupLocation": {
    "coordinates": [-122.4194, 37.7749],
    "address": "San Francisco, CA"
  },
  "dropLocation": {
    "coordinates": [-122.0869, 37.4028],
    "address": "Palo Alto, CA"
  }
}
```

### 36. Get My Requests (Legacy)

```
GET {{baseUrl}}/rides/my-requests
```

**Headers:** `Authorization: Bearer {{token}}`

### 37. Cancel Join Request (Legacy)

```
DELETE {{baseUrl}}/rides/:id/join
```

**Headers:** `Authorization: Bearer {{token}}`

### 38. Update Ride Status (Legacy - Admin)

```
PUT {{baseUrl}}/rides/:id/status
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "status": "completed"
}
```

### 39. Get Rides by Driver (Legacy - Admin)

```
GET {{baseUrl}}/rides/driver/:driverId?page=1&limit=20&status=active
```

**Headers:** `Authorization: Bearer {{token}}`

### 40. Get Rides by Date (Legacy)

```
GET {{baseUrl}}/rides/date/2026-04-15?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 41. Get Upcoming Rides (Legacy)

```
GET {{baseUrl}}/rides/upcoming?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 42. Get Nearby Rides (Legacy)

```
GET {{baseUrl}}/rides/nearby?lat=37.7749&lng=-122.4194&radius=10
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 📍 LEGACY TRIPS

### 43. Get My Trips (Legacy)

```
GET {{baseUrl}}/trips?status=completed&page=1&limit=10
```

**Headers:** `Authorization: Bearer {{token}}`

### 44. Get All Trips (Legacy - Admin)

```
GET {{baseUrl}}/trips/all?page=1&limit=20&status=completed&startDate=2026-01-01&endDate=2026-04-30
```

**Headers:** `Authorization: Bearer {{token}}`

### 45. Get Trip by ID (Legacy)

```
GET {{baseUrl}}/trips/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 46. Start Trip (Legacy - Driver)

```
POST {{baseUrl}}/trips/:id/start
```

**Headers:** `Authorization: Bearer {{token}}`

### 47. Complete Trip (Legacy - Driver)

```
POST {{baseUrl}}/trips/:id/complete
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "actualDistance": 45.5,
  "actualDuration": 50,
  "endLocation": {
    "coordinates": [-122.0869, 37.4028],
    "address": "Palo Alto, CA"
  }
}
```

### 48. Cancel Trip (Legacy)

```
POST {{baseUrl}}/trips/:id/cancel
```

**Headers:** `Authorization: Bearer {{token}}`

### 49. Get Trips by Driver (Legacy - Admin)

```
GET {{baseUrl}}/trips/driver/:driverId?page=1&limit=20&status=completed
```

**Headers:** `Authorization: Bearer {{token}}`

### 50. Get Trips by Rider (Legacy - Admin)

```
GET {{baseUrl}}/trips/rider/:riderId?page=1&limit=20&status=completed
```

**Headers:** `Authorization: Bearer {{token}}`

### 51. Get Trip by RidePool (Legacy)

```
GET {{baseUrl}}/trips/ridepool/:ridePoolId
```

**Headers:** `Authorization: Bearer {{token}}`

### 52. Get Trips by Date (Legacy)

```
GET {{baseUrl}}/trips/date/2026-04-15?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 53. Get Trips by Status (Legacy)

```
GET {{baseUrl}}/trips/status/completed?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 54. Get Upcoming Trips (Legacy)

```
GET {{baseUrl}}/trips/upcoming?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 55. Get Trip Stats (Legacy - Admin)

```
GET {{baseUrl}}/trips/stats
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 🔒 LEGACY PRIVACY

### 56. Initiate Call (Legacy)

```
POST {{baseUrl}}/privacy/call/initiate
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "targetUserId": "USER_ID_HERE"
}
```

### 57. End Call (Legacy)

```
POST {{baseUrl}}/privacy/call/end
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "callId": "CALL_ID_HERE"
}
```

### 58. Send In-App Message (Legacy)

```
POST {{baseUrl}}/privacy/message/send
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "receiverId": "USER_ID_HERE",
  "ridePoolId": "RIDE_POOL_ID_HERE",
  "content": "Hello! Are you still available for the ride?"
}
```

### 59. Get Conversation (Legacy)

```
GET {{baseUrl}}/privacy/message/conversation/:userId?page=1&limit=50
```

**Headers:** `Authorization: Bearer {{token}}`

### 60. Get Masked Phone (Legacy)

```
GET {{baseUrl}}/privacy/masked-phone/:userId
```

**Headers:** `Authorization: Bearer {{token}}`

### 61. Send SOS Alert (Legacy)

```
POST {{baseUrl}}/privacy/sos/alert
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "ridePoolId": "RIDE_POOL_ID_HERE",
  "message": "Emergency! Something wrong.",
  "location": {
    "coordinates": [-122.4194, 37.7749],
    "address": "San Francisco, CA"
  }
}
```

### 62. Get SOS History (Legacy)

```
GET {{baseUrl}}/privacy/sos/history
```

**Headers:** `Authorization: Bearer {{token}}`

### 63. Get Privacy Settings (Legacy)

```
GET {{baseUrl}}/privacy/settings
```

**Headers:** `Authorization: Bearer {{token}}`

### 64. Update Privacy Settings (Legacy)

```
PUT {{baseUrl}}/privacy/settings
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "isProfileBlurred": true
}
```

### 65. Get Profile Visibility (Legacy)

```
GET {{baseUrl}}/privacy/profile-visibility
```

**Headers:** `Authorization: Bearer {{token}}`

### 66. Update Profile Visibility (Legacy)

```
PUT {{baseUrl}}/privacy/profile-visibility
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "isProfileBlurred": true
}
```

---

## ⭐ LEGACY REVIEWS

### 67. Create Review (Legacy)

```
POST {{baseUrl}}/reviews
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "tripId": "TRIP_ID_HERE",
  "revieweeId": "USER_ID_HERE",
  "type": "rider-to-driver",
  "rating": 5,
  "comment": "Great ride! Very friendly driver."
}
```

### 68. Get User Reviews (Legacy)

```
GET {{baseUrl}}/reviews/user/:userId?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 69. Get Trip Reviews (Legacy)

```
GET {{baseUrl}}/reviews/trip/:tripId
```

**Headers:** `Authorization: Bearer {{token}}`

### 70. Get All Reviews (Legacy - Admin)

```
GET {{baseUrl}}/reviews/all?page=1&limit=20&type=driver-to-rider&minRating=3&maxRating=5
```

**Headers:** `Authorization: Bearer {{token}}`

### 71. Get My Reviews (Legacy)

```
GET {{baseUrl}}/reviews/my-reviews?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 72. Get Review by ID (Legacy)

```
GET {{baseUrl}}/reviews/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 73. Delete Review (Legacy)

```
DELETE {{baseUrl}}/reviews/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 74. Get User Review Stats (Legacy)

```
GET {{baseUrl}}/reviews/stats/user/:userId
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 💬 LEGACY MESSAGES

### 75. Get Messages (Legacy)

```
GET {{baseUrl}}/messages?userId=USER_ID_HERE&ridePoolId=RIDE_POOL_ID_HERE&page=1&limit=50
```

**Headers:** `Authorization: Bearer {{token}}`

### 76. Get Conversations (Legacy)

```
GET {{baseUrl}}/messages/conversations
```

**Headers:** `Authorization: Bearer {{token}}`

### 77. Get Unread Count (Legacy)

```
GET {{baseUrl}}/messages/unread-count
```

**Headers:** `Authorization: Bearer {{token}}`

### 78. Get Conversation by User (Legacy)

```
GET {{baseUrl}}/messages/conversation/:userId?page=1&limit=50
```

**Headers:** `Authorization: Bearer {{token}}`

### 79. Send New Message (Legacy)

```
POST {{baseUrl}}/messages
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "receiverId": "USER_ID_HERE",
  "ridePoolId": "RIDE_POOL_ID_HERE",
  "content": "Hi! Is the ride still available?"
}
```

### 80. Mark Messages as Read (Legacy)

```
PUT {{baseUrl}}/messages/read
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "userId": "USER_ID_HERE"
}
```

### 81. Mark Conversation as Read (Legacy)

```
PUT {{baseUrl}}/messages/read/:userId
```

**Headers:** `Authorization: Bearer {{token}}`

### 82. Delete Message (Legacy)

```
DELETE {{baseUrl}}/messages/:messageId
```

**Headers:** `Authorization: Bearer {{token}}`

### 83. Delete Conversation (Legacy)

```
DELETE {{baseUrl}}/messages/conversation/:userId
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 🌐 LEGACY SYSTEM

### 84. Health Check (Legacy)

```
GET {{baseUrl}}/health
```

### 85. System Stats (Legacy - Admin)

```
GET {{baseUrl}}/stats
```

---

# =============================================================================

# NEW API v1 (/api/v1/) - RECOMMENDED

# =============================================================================

## 🔐 API v1 AUTHENTICATION

### 1. Register User

```
POST {{baseUrlV1}}/auth/register
```

**Body (JSON):**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "rider"
}
```

### 2. Login

```
POST {{baseUrlV1}}/auth/login
```

**Body (JSON):**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 3. Get Current User

```
GET {{baseUrlV1}}/auth/me
```

**Headers:** `Authorization: Bearer {{token}}`

### 4. Verify Token

```
GET {{baseUrlV1}}/auth/verify
```

**Headers:** `Authorization: Bearer {{token}}`

### 5. Refresh Token

```
POST {{baseUrlV1}}/auth/refresh
```

**Headers:** `Authorization: Bearer {{token}}`

### 6. Logout

```
POST {{baseUrlV1}}/auth/logout
```

**Headers:** `Authorization: Bearer {{token}}`

### 7. Google Sign-In (Web - Redirect)

```
GET {{baseUrlV1}}/auth/google
```

**Description:** Redirects to Google OAuth consent screen. After user consent, Google redirects to callback URL with authorization code.

**Response:** Redirects to `https://accounts.google.com/o/oauth2/v2/auth?...`

### 8. Google OAuth Callback (Web)

```
GET {{baseUrlV1}}/auth/google/callback?code=AUTHORIZATION_CODE
```

**Description:** Handles Google OAuth callback, exchanges code for tokens, and returns user data.

**Response (200 - Existing user):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "profilePicture": "https://...",
      "isGoogleUser": true,
      "emailVerified": true
    },
    "token": "jwt_token_here",
    "isNewUser": false
  }
}
```

**Response (201 - New user):**

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token_here",
    "isNewUser": true
  }
}
```

### 9. Google Sign-In (Mobile/Frontend)

```
POST {{baseUrlV1}}/auth/google/mobile
```

**Description:** For mobile apps or frontend that already has Google ID token.

**Body (JSON):**

```json
{
  "idToken": "google_id_token_from_google_sign_in"
}
```

**Response (200/201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "profilePicture": "https://...",
      "isGoogleUser": true,
      "emailVerified": true
    },
    "token": "jwt_token_here",
    "isNewUser": true
  }
}
```

### 10. Link Google Account (Existing User)

```
POST {{baseUrlV1}}/auth/google/link
```

**Description:** Links Google account to an already logged-in user.

**Headers:** `Authorization: Bearer {{token}}`

**Body (JSON):**

```json
{
  "idToken": "google_id_token_from_google_sign_in"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "message": "Google account linked successfully"
  }
}
```

---

## 👤 API v1 USERS

### 7. Get My Profile

```
GET {{baseUrlV1}}/users/profile
```

**Headers:** `Authorization: Bearer {{token}}`

### 8. Update Profile

```
PUT {{baseUrlV1}}/users/profile
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "profilePicture": "https://example.com/photo.jpg",
  "isProfileBlurred": true
}
```

### 9. Change Password

```
PUT {{baseUrlV1}}/users/password
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

### 10. Get User by ID

```
GET {{baseUrlV1}}/users/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 11. Get User Reviews

```
GET {{baseUrlV1}}/users/:userId/reviews
```

**Headers:** `Authorization: Bearer {{token}}`

### 12. Get All Users

```
GET {{baseUrlV1}}/users?page=1&limit=20&role=driver&search=john&isActive=true
```

**Headers:** `Authorization: Bearer {{token}}`

### 13. Get All Drivers (Admin)

```
GET {{baseUrlV1}}/users/drivers?page=1&limit=20&isActive=true&search=john
```

**Headers:** `Authorization: Bearer {{token}}`

### 14. Get All Riders (Admin)

```
GET {{baseUrlV1}}/users/riders?page=1&limit=20&isActive=true&search=john
```

**Headers:** `Authorization: Bearer {{token}}`

### 15. Toggle User Status (Admin)

```
PUT {{baseUrlV1}}/users/:id/status
```

**Headers:** `Authorization: Bearer {{token}}`

### 16. Delete User (Admin)

```
DELETE {{baseUrlV1}}/users/:id
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 🚗 API v1 VEHICLES

### 17. Create Vehicle (Driver Only)

```
POST {{baseUrlV1}}/vehicles
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "model": "Toyota Camry",
  "licensePlate": "ABC-1234",
  "color": "Silver",
  "capacity": 4,
  "preferences": {
    "smoking": false,
    "pets": false,
    "music": true
  },
  "registrationExpiry": "2027-12-31"
}
```

### 18. Get My Vehicles

```
GET {{baseUrlV1}}/vehicles
```

**Headers:** `Authorization: Bearer {{token}}`

### 19. Get All Vehicles (Admin)

```
GET {{baseUrlV1}}/vehicles/all?page=1&limit=20&isActive=true&model=Camry&color=Silver
```

**Headers:** `Authorization: Bearer {{token}}`

### 20. Get Vehicle by ID

```
GET {{baseUrlV1}}/vehicles/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 21. Update Vehicle

```
PUT {{baseUrlV1}}/vehicles/:id
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "model": "Toyota Camry",
  "color": "Black",
  "capacity": 4
}
```

### 22. Delete Vehicle

```
DELETE {{baseUrlV1}}/vehicles/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 23. Toggle Vehicle Status

```
PUT {{baseUrlV1}}/vehicles/:id/status
```

**Headers:** `Authorization: Bearer {{token}}`

### 24. Get Vehicles by Driver (Admin)

```
GET {{baseUrlV1}}/vehicles/driver/:driverId?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 🚙 API v1 RIDES (RidePool)

### 25. Create Ride (Driver Only)

```
POST {{baseUrlV1}}/rides
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "vehicleId": "VEHICLE_ID_HERE",
  "pickupLocation": {
    "coordinates": [-122.4194, 37.7749],
    "address": "San Francisco, CA"
  },
  "dropLocation": {
    "coordinates": [-122.0869, 37.4028],
    "address": "Palo Alto, CA"
  },
  "departureTime": "2026-04-15T09:00:00Z",
  "availableSeats": 3,
  "pricePerSeat": 25,
  "preferences": {
    "smoking": false,
    "pets": false,
    "femaleOnly": false,
    "music": true
  }
}
```

### 26. Get My Rides

```
GET {{baseUrlV1}}/rides?status=active&page=1&limit=10
```

**Headers:** `Authorization: Bearer {{token}}`

### 27. Search Rides

```
GET {{baseUrlV1}}/rides/search?pickupLat=37.7749&pickupLng=-122.4194&dropLat=37.4028&dropLng=-122.0869&radius=15&departureDate=2026-04-15&availableSeats=2
```

**Headers:** `Authorization: Bearer {{token}}`

### 28. Get Recommendations

```
GET {{baseUrlV1}}/rides/recommendations
```

**Headers:** `Authorization: Bearer {{token}}`

### 29. Get All Rides (Admin)

```
GET {{baseUrlV1}}/rides/all?page=1&limit=20&status=active&minSeats=2&maxPrice=30
```

**Headers:** `Authorization: Bearer {{token}}`

### 30. Get Ride by ID

```
GET {{baseUrlV1}}/rides/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 31. Update Ride

```
PUT {{baseUrlV1}}/rides/:id
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "availableSeats": 2,
  "pricePerSeat": 20
}
```

### 32. Cancel Ride

```
DELETE {{baseUrlV1}}/rides/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 33. Get Ride Requests (Driver)

```
GET {{baseUrlV1}}/rides/:id/requests
```

**Headers:** `Authorization: Bearer {{token}}`

### 34. Respond to Request (Driver)

```
PUT {{baseUrlV1}}/rides/:id/requests/:riderId?action=approve
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "action": "approve",
  "reason": "Welcome aboard!"
}
```

### 35. Request to Join Ride

```
POST {{baseUrlV1}}/rides/:id/join
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "pickupLocation": {
    "coordinates": [-122.4194, 37.7749],
    "address": "San Francisco, CA"
  },
  "dropLocation": {
    "coordinates": [-122.0869, 37.4028],
    "address": "Palo Alto, CA"
  }
}
```

### 36. Get My Requests

```
GET {{baseUrlV1}}/rides/my-requests
```

**Headers:** `Authorization: Bearer {{token}}`

### 37. Cancel Join Request

```
DELETE {{baseUrlV1}}/rides/:id/join
```

**Headers:** `Authorization: Bearer {{token}}`

### 38. Update Ride Status (Admin)

```
PUT {{baseUrlV1}}/rides/:id/status
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "status": "completed"
}
```

### 39. Get Rides by Driver (Admin)

```
GET {{baseUrlV1}}/rides/driver/:driverId?page=1&limit=20&status=active
```

**Headers:** `Authorization: Bearer {{token}}`

### 40. Get Rides by Date

```
GET {{baseUrlV1}}/rides/date/2026-04-15?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 41. Get Upcoming Rides

```
GET {{baseUrlV1}}/rides/upcoming?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 42. Get Nearby Rides

```
GET {{baseUrlV1}}/rides/nearby?lat=37.7749&lng=-122.4194&radius=10
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 📍 API v1 TRIPS

### 43. Get My Trips

```
GET {{baseUrlV1}}/trips?status=completed&page=1&limit=10
```

**Headers:** `Authorization: Bearer {{token}}`

### 44. Get All Trips (Admin)

```
GET {{baseUrlV1}}/trips/all?page=1&limit=20&status=completed&startDate=2026-01-01&endDate=2026-04-30
```

**Headers:** `Authorization: Bearer {{token}}`

### 45. Get Trip by ID

```
GET {{baseUrlV1}}/trips/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 46. Start Trip (Driver)

```
POST {{baseUrlV1}}/trips/:id/start
```

**Headers:** `Authorization: Bearer {{token}}`

### 47. Complete Trip (Driver)

```
POST {{baseUrlV1}}/trips/:id/complete
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "actualDistance": 45.5,
  "actualDuration": 50,
  "endLocation": {
    "coordinates": [-122.0869, 37.4028],
    "address": "Palo Alto, CA"
  }
}
```

### 48. Cancel Trip

```
POST {{baseUrlV1}}/trips/:id/cancel
```

**Headers:** `Authorization: Bearer {{token}}`

### 49. Get Trips by Driver (Admin)

```
GET {{baseUrlV1}}/trips/driver/:driverId?page=1&limit=20&status=completed
```

**Headers:** `Authorization: Bearer {{token}}`

### 50. Get Trips by Rider (Admin)

```
GET {{baseUrlV1}}/trips/rider/:riderId?page=1&limit=20&status=completed
```

**Headers:** `Authorization: Bearer {{token}}`

### 51. Get Trip by RidePool

```
GET {{baseUrlV1}}/trips/ridepool/:ridePoolId
```

**Headers:** `Authorization: Bearer {{token}}`

### 52. Get Trips by Date

```
GET {{baseUrlV1}}/trips/date/2026-04-15?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 53. Get Trips by Status

```
GET {{baseUrlV1}}/trips/status/completed?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 54. Get Upcoming Trips

```
GET {{baseUrlV1}}/trips/upcoming?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 55. Get Trip Stats (Admin)

```
GET {{baseUrlV1}}/trips/stats
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 🔒 API v1 PRIVACY

### 56. Initiate Call

```
POST {{baseUrlV1}}/privacy/call/initiate
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "targetUserId": "USER_ID_HERE"
}
```

### 57. End Call

```
POST {{baseUrlV1}}/privacy/call/end
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "callId": "CALL_ID_HERE"
}
```

### 58. Send In-App Message

```
POST {{baseUrlV1}}/privacy/message/send
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "receiverId": "USER_ID_HERE",
  "ridePoolId": "RIDE_POOL_ID_HERE",
  "content": "Hello! Are you still available for the ride?"
}
```

### 59. Get Conversation

```
GET {{baseUrlV1}}/privacy/message/conversation/:userId?page=1&limit=50
```

**Headers:** `Authorization: Bearer {{token}}`

### 60. Get Masked Phone

```
GET {{baseUrlV1}}/privacy/masked-phone/:userId
```

**Headers:** `Authorization: Bearer {{token}}`

### 61. Send SOS Alert

```
POST {{baseUrlV1}}/privacy/sos/alert
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "ridePoolId": "RIDE_POOL_ID_HERE",
  "message": "Emergency! Something wrong.",
  "location": {
    "coordinates": [-122.4194, 37.7749],
    "address": "San Francisco, CA"
  }
}
```

### 62. Get SOS History

```
GET {{baseUrlV1}}/privacy/sos/history
```

**Headers:** `Authorization: Bearer {{token}}`

### 63. Get Privacy Settings

```
GET {{baseUrlV1}}/privacy/settings
```

**Headers:** `Authorization: Bearer {{token}}`

### 64. Update Privacy Settings

```
PUT {{baseUrlV1}}/privacy/settings
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "isProfileBlurred": true
}
```

### 65. Get Profile Visibility

```
GET {{baseUrlV1}}/privacy/profile-visibility
```

**Headers:** `Authorization: Bearer {{token}}`

### 66. Update Profile Visibility

```
PUT {{baseUrlV1}}/privacy/profile-visibility
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "isProfileBlurred": true
}
```

---

## ⭐ API v1 REVIEWS

### 67. Create Review

```
POST {{baseUrlV1}}/reviews
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "tripId": "TRIP_ID_HERE",
  "revieweeId": "USER_ID_HERE",
  "type": "rider-to-driver",
  "rating": 5,
  "comment": "Great ride! Very friendly driver."
}
```

### 68. Get User Reviews

```
GET {{baseUrlV1}}/reviews/user/:userId?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 69. Get Trip Reviews

```
GET {{baseUrlV1}}/reviews/trip/:tripId
```

**Headers:** `Authorization: Bearer {{token}}`

### 70. Get All Reviews (Admin)

```
GET {{baseUrlV1}}/reviews/all?page=1&limit=20&type=driver-to-rider&minRating=3&maxRating=5
```

**Headers:** `Authorization: Bearer {{token}}`

### 71. Get My Reviews

```
GET {{baseUrlV1}}/reviews/my-reviews?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

### 72. Get Review by ID

```
GET {{baseUrlV1}}/reviews/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 73. Delete Review

```
DELETE {{baseUrlV1}}/reviews/:id
```

**Headers:** `Authorization: Bearer {{token}}`

### 74. Get User Review Stats

```
GET {{baseUrlV1}}/reviews/stats/user/:userId
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 💬 API v1 MESSAGES

### 75. Get Messages

```
GET {{baseUrlV1}}/messages?userId=USER_ID_HERE&ridePoolId=RIDE_POOL_ID_HERE&page=1&limit=50
```

**Headers:** `Authorization: Bearer {{token}}`

### 76. Get Conversations

```
GET {{baseUrlV1}}/messages/conversations
```

**Headers:** `Authorization: Bearer {{token}}`

### 77. Get Unread Count

```
GET {{baseUrlV1}}/messages/unread-count
```

**Headers:** `Authorization: Bearer {{token}}`

### 78. Get Conversation by User

```
GET {{baseUrlV1}}/messages/conversation/:userId?page=1&limit=50
```

**Headers:** `Authorization: Bearer {{token}}`

### 79. Send New Message

```
POST {{baseUrlV1}}/messages
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "receiverId": "USER_ID_HERE",
  "ridePoolId": "RIDE_POOL_ID_HERE",
  "content": "Hi! Is the ride still available?"
}
```

### 80. Mark Messages as Read

```
PUT {{baseUrlV1}}/messages/read
```

**Headers:** `Authorization: Bearer {{token}}`
**Body (JSON):**

```json
{
  "userId": "USER_ID_HERE"
}
```

### 81. Mark Conversation as Read

```
PUT {{baseUrlV1}}/messages/read/:userId
```

**Headers:** `Authorization: Bearer {{token}}`

### 82. Delete Message

```
DELETE {{baseUrlV1}}/messages/:messageId
```

**Headers:** `Authorization: Bearer {{token}}`

### 83. Delete Conversation

```
DELETE {{baseUrlV1}}/messages/conversation/:userId
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 🌐 API v1 SYSTEM

### 84. Health Check

```
GET {{baseUrlV1}}/health
```

### 85. System Stats (Admin)

```
GET {{baseUrlV1}}/stats
```

---

# =============================================================================

# TESTING FLOW

# =============================================================================

## Recommended Testing Order

### Phase 1: Authentication

1. **Register** → `POST {{baseUrlV1}}/auth/register`
2. **Login** → `POST {{baseUrlV1}}/auth/login` → Save token
3. **Get Profile** → `GET {{baseUrlV1}}/users/profile`

### Phase 2: Vehicles & Rides

4. **Create Vehicle** → `POST {{baseUrlV1}}/vehicles` (as driver)
5. **Create Ride** → `POST {{baseUrlV1}}/rides`
6. **Search Rides** → `GET {{baseUrlV1}}/rides/search`

### Phase 3: Trip Lifecycle

7. **Request to Join** → `POST {{baseUrlV1}}/rides/:id/join`
8. **Get My Trips** → `GET {{baseUrlV1}}/trips`
9. **Start Trip** → `POST {{baseUrlV1}}/trips/:id/start`
10. **Complete Trip** → `POST {{baseUrlV1}}/trips/:id/complete`

### Phase 4: Communication

11. **Send Message** → `POST {{baseUrlV1}}/messages`
12. **Get Conversations** → `GET {{baseUrlV1}}/messages/conversations`

### Phase 5: Reviews

13. **Create Review** → `POST {{baseUrlV1}}/reviews`

---

## API Versioning Strategy

| Aspect       | Legacy     | API v1      |
| ------------ | ---------- | ----------- |
| Base URL     | `/api/`    | `/api/v1/`  |
| Status       | Compatible | Recommended |
| New Features | No         | Yes         |
| Deprecation  | Future     | Current     |

---

_Generated for Carpooling System API Testing - April 2026_

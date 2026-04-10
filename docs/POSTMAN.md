# Carpooling System API - Postman Collection (v2)

> **Updated for PostgreSQL + Prisma ORM Architecture**

## How to Import

1. Open Postman
2. Click "Import" button
3. Select this JSON file or copy content below
4. Collection will be imported with all endpoints

---

## API Base URL

| Environment | Base URL                         |
| ----------- | -------------------------------- |
| Local       | `http://localhost:3000/api/v1`   |
| Production  | `https://your-domain.com/api/v1` |

---

## Postman Variables

Create these variables in your Postman collection:

| Variable       | Initial Value                | Description          |
| -------------- | ---------------------------- | -------------------- |
| `baseUrl`      | http://localhost:3000/api/v1 | API Base URL         |
| `token`        | (empty)                      | JWT token from login |
| `refreshToken` | (empty)                      | Refresh token        |
| `userId`       | (empty)                      | Current user ID      |
| `driverId`     | (empty)                      | Driver user ID       |
| `riderId`      | (empty)                      | Rider user ID        |
| `vehicleId`    | (empty)                      | Vehicle ID           |
| `ridePoolId`   | (empty)                      | Ride pool ID         |
| `tripId`       | (empty)                      | Trip ID              |
| `messageId`    | (empty)                      | Message ID           |

---

## Authentication

Most endpoints require `Authorization: Bearer {{token}}` header.

---

# =============================================================================

# AUTHENTICATION (/auth/)

# =============================================================================

## 1. Register User

```
POST {{baseUrl}}/auth/register
```

**Body:**

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

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "RIDER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 2. Login

```
POST {{baseUrl}}/auth/login
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "RIDER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 3. Get Current User

```
GET {{baseUrl}}/auth/me
```

**Headers:** `Authorization: Bearer {{token}}`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "role": "RIDER",
      "rating": 0,
      "totalReviews": 0,
      "isProfileBlurred": true,
      "isActive": true
    }
  }
}
```

---

## 4. Verify Token

```
GET {{baseUrl}}/auth/verify
```

**Headers:** `Authorization: Bearer {{token}}`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "valid": true,
    "userId": 1
  }
}
```

---

## 5. Refresh Token

```
POST {{baseUrl}}/auth/refresh
```

**Headers:** `Authorization: Bearer {{token}}`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 6. Logout

```
POST {{baseUrl}}/auth/logout
```

**Headers:** `Authorization: Bearer {{token}}`

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 7. Google Sign-In (Web - Redirect)

```
GET {{baseUrl}}/auth/google
```

**Description:** Redirects to Google OAuth consent screen.

**Response:** 302 Redirect to Google

---

## 8. Google OAuth Callback (Web)

```
GET {{baseUrl}}/auth/google/callback?code=AUTH_CODE
```

**Response (200 - Existing user):**

```json
{
  "success": true,
  "message": "Logged in with Google",
  "data": {
    "user": {
      "id": 1,
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "profilePicture": "https://...",
      "isGoogleUser": true,
      "emailVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "isNewUser": false
  }
}
```

**Response (201 - New user):**

```json
{
  "success": true,
  "message": "Account created with Google",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "isNewUser": true
  }
}
```

---

## 9. Google Sign-In (Mobile)

```
POST {{baseUrl}}/auth/google/mobile
```

**Body:**

```json
{
  "idToken": "google_id_token_here"
}
```

**Response:** Same as Google OAuth Callback

---

## 10. Link Google Account

```
POST {{baseUrl}}/auth/google/link
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "idToken": "google_id_token_here"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Google account linked successfully",
  "data": {
    "user": { ... },
    "message": "Google account linked successfully"
  }
}
```

---

# =============================================================================

# USERS (/users/)

# =============================================================================

## 11. Get My Profile

```
GET {{baseUrl}}/users/profile
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 12. Update Profile

```
PUT {{baseUrl}}/users/profile
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1987654321",
  "profilePicture": "https://example.com/new-photo.jpg",
  "isProfileBlurred": false
}
```

---

## 13. Change Password

```
PUT {{baseUrl}}/users/password
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

---

## 14. Get User by ID

```
GET {{baseUrl}}/users/:id
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 15. Get User Reviews

```
GET {{baseUrl}}/users/:userId/reviews?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 16. Get All Users (Admin)

```
GET {{baseUrl}}/users?page=1&limit=20&role=driver&search=john&isActive=true
```

**Headers:** `Authorization: Bearer {{token}}`

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `role` - Filter by role (DRIVER, RIDER, ADMIN)
- `search` - Search by name or email
- `isActive` - Filter by active status (true/false)

---

## 17. Get All Drivers (Admin)

```
GET {{baseUrl}}/users/drivers?page=1&limit=20&isActive=true&search=john
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 18. Get All Riders (Admin)

```
GET {{baseUrl}}/users/riders?page=1&limit=20&isActive=true&search=jane
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 19. Toggle User Status (Admin)

```
PUT {{baseUrl}}/users/:id/status
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "isActive": false
}
```

---

## 20. Delete User (Admin)

```
DELETE {{baseUrl}}/users/:id
```

**Headers:** `Authorization: Bearer {{token}}`

---

# =============================================================================

# VEHICLES (/vehicles/)

# =============================================================================

## 21. Create Vehicle (Driver Only)

```
POST {{baseUrl}}/vehicles
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

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

**Response (201):**

```json
{
  "success": true,
  "message": "Vehicle created successfully",
  "data": {
    "vehicle": {
      "id": 1,
      "driverId": 1,
      "model": "Toyota Camry",
      "licensePlate": "ABC-1234",
      "color": "Silver",
      "capacity": 4,
      "isActive": true
    }
  }
}
```

---

## 22. Get My Vehicles

```
GET {{baseUrl}}/vehicles?page=1&limit=10&isActive=true
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 23. Get All Vehicles (Admin)

```
GET {{baseUrl}}/vehicles/all?page=1&limit=20&isActive=true&model=Camry&color=Silver
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 24. Get Vehicle by ID

```
GET {{baseUrl}}/vehicles/:id
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 25. Update Vehicle

```
PUT {{baseUrl}}/vehicles/:id
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "model": "Honda Accord",
  "color": "Black",
  "capacity": 5
}
```

---

## 26. Delete Vehicle

```
DELETE {{baseUrl}}/vehicles/:id
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 27. Toggle Vehicle Status

```
PUT {{baseUrl}}/vehicles/:id/status
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "isActive": false
}
```

---

## 28. Get Vehicles by Driver (Admin)

```
GET {{baseUrl}}/vehicles/driver/:driverId?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

---

# =============================================================================

# RIDES (/rides/)

# =============================================================================

## 29. Create Ride (Driver Only)

```
POST {{baseUrl}}/rides
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "vehicleId": 1,
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
  "pricePerSeat": 25.0,
  "preferences": {
    "smoking": false,
    "pets": false,
    "femaleOnly": false,
    "music": true
  }
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Ride created successfully",
  "data": {
    "ride": {
      "id": 1,
      "driverId": 1,
      "vehicleId": 1,
      "pickupLocation": { ... },
      "dropLocation": { ... },
      "departureTime": "2026-04-15T09:00:00Z",
      "availableSeats": 3,
      "pricePerSeat": 25.00,
      "status": "ACTIVE",
      "bookedSeats": 0
    }
  }
}
```

---

## 30. Get My Rides

```
GET {{baseUrl}}/rides?status=active&page=1&limit=10
```

**Headers:** `Authorization: Bearer {{token}}`

**Query Parameters:**

- `status` - ACTIVE, COMPLETED, CANCELLED
- `page` - Page number
- `limit` - Items per page

---

## 31. Search Rides

```
GET {{baseUrl}}/rides/search?pickupLat=37.7749&pickupLng=-122.4194&dropLat=37.4028&dropLng=-122.0869&radius=15&departureDate=2026-04-15&availableSeats=2
```

**Headers:** `Authorization: Bearer {{token}}`

**Query Parameters:**

- `pickupLat` - Pickup latitude
- `pickupLng` - Pickup longitude
- `dropLat` - Drop latitude
- `dropLng` - Drop longitude
- `radius` - Search radius in km (default: 10)
- `departureDate` - Filter by date (YYYY-MM-DD)
- `availableSeats` - Minimum available seats

---

## 32. Get Recommendations

```
GET {{baseUrl}}/rides/recommendations
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 33. Get All Rides (Admin)

```
GET {{baseUrl}}/rides/all?page=1&limit=20&status=active&minSeats=2&maxPrice=30
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 34. Get Ride by ID

```
GET {{baseUrl}}/rides/:id
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 35. Update Ride

```
PUT {{baseUrl}}/rides/:id
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "availableSeats": 2,
  "pricePerSeat": 20.0,
  "departureTime": "2026-04-15T10:00:00Z"
}
```

---

## 36. Cancel Ride

```
DELETE {{baseUrl}}/rides/:id
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 37. Get Ride Requests (Driver)

```
GET {{baseUrl}}/rides/:id/requests
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 38. Respond to Request (Driver)

```
PUT {{baseUrl}}/rides/:id/requests/:riderId?action=approve
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "action": "approve",
  "reason": "Welcome aboard!"
}
```

**Query Parameters:**

- `action` - approve, reject

---

## 39. Request to Join Ride

```
POST {{baseUrl}}/rides/:id/join
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

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

---

## 40. Get My Requests

```
GET {{baseUrl}}/rides/my-requests
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 41. Cancel Join Request

```
DELETE {{baseUrl}}/rides/:id/join
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 42. Update Ride Status (Admin)

```
PUT {{baseUrl}}/rides/:id/status
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "status": "completed"
}
```

---

## 43. Get Rides by Driver (Admin)

```
GET {{baseUrl}}/rides/driver/:driverId?page=1&limit=20&status=active
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 44. Get Rides by Date

```
GET {{baseUrl}}/rides/date/2026-04-15?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 45. Get Upcoming Rides

```
GET {{baseUrl}}/rides/upcoming?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 46. Get Nearby Rides

```
GET {{baseUrl}}/rides/nearby?lat=37.7749&lng=-122.4194&radius=10
```

**Headers:** `Authorization: Bearer {{token}}`

---

# =============================================================================

# TRIPS (/trips/)

# =============================================================================

## 47. Get My Trips

```
GET {{baseUrl}}/trips?status=completed&page=1&limit=10
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 48. Get All Trips (Admin)

```
GET {{baseUrl}}/trips/all?page=1&limit=20&status=completed&startDate=2026-01-01&endDate=2026-04-30
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 49. Get Trip by ID

```
GET {{baseUrl}}/trips/:id
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 50. Start Trip (Driver)

```
POST {{baseUrl}}/trips/:id/start
```

**Headers:** `Authorization: Bearer {{token}}`

**Response (200):**

```json
{
  "success": true,
  "message": "Trip started successfully",
  "data": {
    "trip": {
      "id": 1,
      "status": "IN_PROGRESS",
      "startTime": "2026-04-15T09:00:00Z"
    }
  }
}
```

---

## 51. Complete Trip (Driver)

```
POST {{baseUrl}}/trips/:id/complete
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

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

---

## 52. Cancel Trip

```
POST {{baseUrl}}/trips/:id/cancel
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "reason": "Vehicle breakdown"
}
```

---

## 53. Get Trips by Driver (Admin)

```
GET {{baseUrl}}/trips/driver/:driverId?page=1&limit=20&status=completed
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 54. Get Trips by Rider (Admin)

```
GET {{baseUrl}}/trips/rider/:riderId?page=1&limit=20&status=completed
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 55. Get Trip by RidePool

```
GET {{baseUrl}}/trips/ridepool/:ridePoolId
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 56. Get Trips by Date

```
GET {{baseUrl}}/trips/date/2026-04-15?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 57. Get Trips by Status

```
GET {{baseUrl}}/trips/status/completed?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 58. Get Upcoming Trips

```
GET {{baseUrl}}/trips/upcoming?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 59. Get Trip Stats (Admin)

```
GET {{baseUrl}}/trips/stats
```

**Headers:** `Authorization: Bearer {{token}}`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalTrips": 150,
    "completedTrips": 120,
    "cancelledTrips": 10,
    "inProgressTrips": 5,
    "totalRevenue": 4500.0,
    "averageTripDistance": 25.5,
    "averageTripDuration": 35
  }
}
```

---

# =============================================================================

# PRIVACY (/privacy/)

# =============================================================================

## 60. Initiate Call

```
POST {{baseUrl}}/privacy/call/initiate
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "targetUserId": 2
}
```

---

## 61. End Call

```
POST {{baseUrl}}/privacy/call/end
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "callId": "call_abc123"
}
```

---

## 62. Get Masked Phone

```
GET {{baseUrl}}/privacy/masked-phone/:userId
```

**Headers:** `Authorization: Bearer {{token}}`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "maskedPhone": "+1***-***-4567"
  }
}
```

---

## 63. Send SOS Alert

```
POST {{baseUrl}}/privacy/sos/alert
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "ridePoolId": 1,
  "message": "Emergency! Need help.",
  "location": {
    "coordinates": [-122.4194, 37.7749],
    "address": "San Francisco, CA"
  }
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "SOS alert sent successfully",
  "data": {
    "sosAlert": {
      "id": 1,
      "status": "ACTIVE",
      "createdAt": "2026-04-15T09:00:00Z"
    }
  }
}
```

---

## 64. Get SOS History

```
GET {{baseUrl}}/privacy/sos/history
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 65. Get Privacy Settings

```
GET {{baseUrl}}/privacy/settings
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 66. Update Privacy Settings

```
PUT {{baseUrl}}/privacy/settings
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "isProfileBlurred": true
}
```

---

## 67. Get Profile Visibility

```
GET {{baseUrl}}/privacy/profile-visibility
```

**Headers:** `Authorization: Bearer {{token}}`

---

# =============================================================================

# REVIEWS (/reviews/)

# =============================================================================

## 68. Create Review

```
POST {{baseUrl}}/reviews
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "tripId": 1,
  "revieweeId": 2,
  "type": "RIDER_TO_DRIVER",
  "rating": 5,
  "comment": "Great ride! Very friendly driver."
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "review": {
      "id": 1,
      "tripId": 1,
      "reviewerId": 1,
      "revieweeId": 2,
      "type": "RIDER_TO_DRIVER",
      "rating": 5,
      "comment": "Great ride! Very friendly driver.",
      "isVisible": false,
      "createdAt": "2026-04-15T10:00:00Z"
    }
  }
}
```

---

## 69. Get User Reviews

```
GET {{baseUrl}}/reviews/user/:userId?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 70. Get Trip Reviews

```
GET {{baseUrl}}/reviews/trip/:tripId
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 71. Get All Reviews (Admin)

```
GET {{baseUrl}}/reviews/all?page=1&limit=20&type=DRIVER_TO_RIDER&minRating=3&maxRating=5
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 72. Get My Reviews

```
GET {{baseUrl}}/reviews/my-reviews?page=1&limit=20
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 73. Get Review by ID

```
GET {{baseUrl}}/reviews/:id
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 74. Delete Review

```
DELETE {{baseUrl}}/reviews/:id
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 75. Get User Review Stats

```
GET {{baseUrl}}/reviews/stats/user/:userId
```

**Headers:** `Authorization: Bearer {{token}}`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "averageRating": 4.5,
    "totalReviews": 25,
    "fiveStars": 15,
    "fourStars": 5,
    "threeStars": 3,
    "twoStars": 1,
    "oneStar": 1
  }
}
```

---

# =============================================================================

# MESSAGES (/messages/)

# =============================================================================

## 76. Get Messages

```
GET {{baseUrl}}/messages?userId=2&ridePoolId=1&page=1&limit=50
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 77. Get Conversations

```
GET {{baseUrl}}/messages/conversations
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 78. Get Unread Count

```
GET {{baseUrl}}/messages/unread-count
```

**Headers:** `Authorization: Bearer {{token}}`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

## 79. Get Conversation by User

```
GET {{baseUrl}}/messages/conversation/:userId?page=1&limit=50
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 80. Send Message

```
POST {{baseUrl}}/messages
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "receiverId": 2,
  "ridePoolId": 1,
  "content": "Hi! Is the ride still available?"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": 1,
      "senderId": 1,
      "receiverId": 2,
      "ridePoolId": 1,
      "content": "Hi! Is the ride still available?",
      "isRead": false,
      "createdAt": "2026-04-15T09:00:00Z"
    }
  }
}
```

---

## 81. Mark Messages as Read

```
PUT {{baseUrl}}/messages/read
```

**Headers:** `Authorization: Bearer {{token}}`

**Body:**

```json
{
  "userId": 2
}
```

---

## 82. Mark Conversation as Read

```
PUT {{baseUrl}}/messages/read/:userId
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 83. Delete Message

```
DELETE {{baseUrl}}/messages/:messageId
```

**Headers:** `Authorization: Bearer {{token}}`

---

## 84. Delete Conversation

```
DELETE {{baseUrl}}/messages/conversation/:userId
```

**Headers:** `Authorization: Bearer {{token}}`

---

# =============================================================================

# SYSTEM ENDPOINTS

# =============================================================================

## 85. Health Check

```
GET {{baseUrl}}/health
```

**Response (200):**

```json
{
  "status": "success",
  "message": "API is running",
  "data": {
    "timestamp": "2026-04-15T09:00:00Z",
    "uptime": 3600
  }
}
```

---

## 86. System Stats (Admin)

```
GET {{baseUrl}}/stats
```

**Headers:** `Authorization: Bearer {{token}}`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 100,
      "drivers": 30,
      "riders": 70
    },
    "vehicles": {
      "total": 45
    },
    "rides": {
      "total": 200,
      "active": 50,
      "completed": 150
    },
    "trips": {
      "total": 180,
      "inProgress": 5
    }
  }
}
```

---

# =============================================================================

# TESTING WORKFLOW

# =============================================================================

## Recommended Testing Order

1. **Register Users** (endpoints 1, 1)
   - Register a driver
   - Register a rider

2. **Login** (endpoints 2, 2)
   - Login as driver → save token
   - Login as rider → save token

3. **Create Vehicle** (endpoint 21)
   - Use driver token

4. **Create Ride** (endpoint 29)
   - Use driver token

5. **Join Ride** (endpoint 39)
   - Use rider token

6. **Respond to Request** (endpoint 38)
   - Use driver token

7. **Start/Complete Trip** (endpoints 50, 51)
   - Use driver token

8. **Send Message** (endpoint 80)
   - Use either token

9. **Create Review** (endpoint 68)
   - Use rider token

10. **Test Privacy Features** (endpoints 60-67)
    - Test SOS, masked phone, etc.

---

# =============================================================================

# ERROR RESPONSES

# =============================================================================

## Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Common Error Codes

| Code               | HTTP Status | Description              |
| ------------------ | ----------- | ------------------------ |
| `VALIDATION_ERROR` | 400         | Invalid input data       |
| `UNAUTHORIZED`     | 401         | Invalid or expired token |
| `FORBIDDEN`        | 403         | Insufficient permissions |
| `NOT_FOUND`        | 404         | Resource not found       |
| `CONFLICT`         | 409         | Resource already exists  |
| `RATE_LIMITED`     | 429         | Too many requests        |
| `SERVER_ERROR`     | 500         | Internal server error    |

# API Endpoints - Carpooling System

## 📋 Overview

Complete REST API documentation for all carpooling system endpoints.

---

## 🏷️ Authentication Endpoints

### POST /api/v1/auth/register

Register a new user (driver or rider).

**Request:**

```json
{
  "email": "john@example.com",
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
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "rider",
      "isGoogleUser": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST /api/v1/auth/login

Authenticate user and get JWT token.

**Request:**

```json
{
  "email": "john@example.com",
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
      "email": "john@example.com",
      "firstName": "John",
      "role": "rider"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST /api/v1/auth/refresh

Refresh JWT token.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token..."
  }
}
```

---

### POST /api/v1/auth/logout

Logout user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/v1/auth/google

Initiate Google OAuth flow (redirects to Google).

**Response:** Redirects to `https://accounts.google.com/o/oauth2/v2/auth?...`

---

### GET /api/v1/auth/google/callback

Google OAuth callback endpoint.

**Query Parameters:**

- `code`: Authorization code from Google

**Response (200 - Existing user):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "john@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "isGoogleUser": true,
      "emailVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isNewUser": true
  }
}
```

---

### POST /api/v1/auth/google/mobile

Google Sign-In for mobile apps (direct token).

**Request:**

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
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isNewUser": true
  }
}
```

---

### POST /api/v1/auth/google/link

Link Google account to existing logged-in user.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "idToken": "google_id_token"
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

## 👤 User Endpoints

### GET /api/v1/users/profile

Get current user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "rider",
    "profilePicture": null,
    "rating": 4.5,
    "totalReviews": 10,
    "isGoogleUser": false
  }
}
```

---

### PUT /api/v1/users/profile

Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "profilePicture": "https://example.com/photo.jpg",
  "isProfileBlurred": true
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### PUT /api/v1/users/password

Change password.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## 🚗 Vehicle Endpoints

### POST /api/v1/vehicles

Add a new vehicle (Driver only).

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "model": "Toyota Camry",
  "licensePlate": "ABC123",
  "color": "Silver",
  "capacity": 4,
  "preferences": {
    "smoking": false,
    "pets": true,
    "music": true
  },
  "registrationExpiry": "2025-12-31"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Vehicle created successfully",
  "data": {
    "id": 2,
    "driverId": 1,
    "model": "Toyota Camry",
    "licensePlate": "ABC123",
    "capacity": 4
  }
}
```

---

### GET /api/v1/vehicles

Get all vehicles for current driver.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 2,
        "model": "Toyota Camry",
        "licensePlate": "ABC123",
        "capacity": 4,
        "isActive": true
      }
    ],
    "total": 1,
    "page": 1,
    "pages": 1
  }
}
```

---

### PUT /api/v1/vehicles/:id

Update vehicle details.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "model": "Toyota Camry Hybrid",
  "isActive": false
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 2,
    "model": "Toyota Camry Hybrid"
  }
}
```

---

### DELETE /api/v1/vehicles/:id

Delete a vehicle.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Vehicle deleted successfully"
}
```

---

### PUT /api/v1/vehicles/:id/status

Toggle vehicle status.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 2,
    "isActive": false
  }
}
```

---

## 🚙 Ride Pool Endpoints (Drivers)

### POST /api/rides

Create a new ride pool.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "vehicleId": 2,
  "pickupLocation": {
    "coordinates": [-122.4194, 37.7749],
    "address": "123 Main St, San Francisco, CA"
  },
  "dropLocation": {
    "coordinates": [-122.0869, 37.4028],
    "address": "456 Oak Ave, Palo Alto, CA"
  },
  "departureTime": "2024-01-20T09:00:00Z",
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

**Response (201):**

```json
{
  "status": "success",
  "data": {
    "id": 3,
    "driverId": 1,
    "pickupLocation": {
      "coordinates": [-122.4194, 37.7749],
      "address": "123 Main St, San Francisco, CA"
    },
    "dropLocation": {
      "coordinates": [-122.0869, 37.4028],
      "address": "456 Oak Ave, Palo Alto, CA"
    },
    "departureTime": "2024-01-20T09:00:00Z",
    "availableSeats": 3,
    "status": "active"
  }
}
```

---

### GET /api/rides

Get all rides for current driver.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `status`: filter by status (active, completed, cancelled)
- `page`: page number
- `limit`: items per page

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "rides": [...],
    "total": 10,
    "page": 1,
    "pages": 1
  }
}
```

---

### GET /api/rides/:id

Get ride pool details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": 3,
    "driver": {
      "firstName": "John",
      "rating": 4.5
    },
    "vehicle": {
      "model": "Toyota Camry",
      "color": "Silver"
    },
    "pickupLocation": {...},
    "dropLocation": {...},
    "departureTime": "2024-01-20T09:00:00Z",
    "availableSeats": 3,
    "passengers": [...]
  }
}
```

---

### PUT /api/rides/:id

Update ride pool details.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "availableSeats": 2,
  "departureTime": "2024-01-20T10:00:00Z"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": 3,
    "availableSeats": 2
  }
}
```

---

### DELETE /api/rides/:id

Cancel a ride pool.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "message": "Ride cancelled successfully"
}
```

---

### GET /api/rides/:id/requests

Get all join requests for a ride.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "requests": [
      {
        "id": 4,
        "riderId": "507f1f77bcf86cd799439077",
        "status": "pending",
        "requestedAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### PUT /api/rides/:id/requests/:riderId

Approve or reject a join request.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "action": "approve", // or "reject"
  "reason": "Optional rejection reason"
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Request approved"
}
```

---

## 🔍 Ride Search Endpoints (Riders)

### GET /api/rides/search

Search for available rides.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `pickupLat`: Pickup latitude
- `pickupLng`: Pickup longitude
- `dropLat`: Drop latitude
- `dropLng`: Drop longitude
- `radius`: Search radius in km (default: 10)
- `departureDate`: Date filter (YYYY-MM-DD)
- `availableSeats`: Minimum seats needed
- `preferences`: Filter preferences (smoking, pets, femaleOnly)
- `page`: Page number
- `limit`: Results per page

**Example:**

```
GET /api/rides/search?pickupLat=37.7749&pickupLng=-122.4194&dropLat=37.4028&dropLng=-122.0869&radius=15
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "rides": [
      {
        "id": 3,
        "driver": {
          "firstName": "John",
          "rating": 4.5
        },
        "vehicle": {
          "model": "Toyota Camry"
        },
        "pickupLocation": {...},
        "dropLocation": {...},
        "departureTime": "2024-01-20T09:00:00Z",
        "availableSeats": 3,
        "pricePerSeat": 25,
        "matchPercentage": 85
      }
    ],
    "total": 5,
    "page": 1,
    "pages": 1
  }
}
```

---

### GET /api/rides/recommendations

Get personalized ride recommendations.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "recommendations": [...]
  }
}
```

---

### POST /api/rides/:id/join

Request to join a ride pool.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "pickupLocation": {
    "coordinates": [-122.4194, 37.7749],
    "address": "Near 123 Main St"
  },
  "dropLocation": {
    "coordinates": [-122.0869, 37.4028],
    "address": "Near 456 Oak Ave"
  }
}
```

**Response (201):**

```json
{
  "status": "success",
  "message": "Join request sent",
  "data": {
    "requestId": 4,
    "status": "pending"
  }
}
```

---

### GET /api/rides/my-requests

Get all join requests made by current rider.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "requests": [...]
  }
}
```

---

### DELETE /api/rides/:id/join

Cancel join request.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "message": "Join request cancelled"
}
```

---

## 🔒 Privacy Endpoints

### POST /api/privacy/call/initiate

Initiate a masked call.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "targetUserId": "507f1f77bcf86cd799439088"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "maskedNumber": "+1-555-XXXX-1234",
    "callId": "507f1f77bcf86cd799439099"
  }
}
```

---

### POST /api/privacy/message/send

Send an in-app message.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "receiverId": "507f1f77bcf86cd799439088",
  "ridePoolId": 3,
  "content": "Hello! I'm interested in your ride."
}
```

**Response (201):**

```json
{
  "status": "success",
  "data": {
    "messageId": "507f1f77bcf86cd7994390aa",
    "sentAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### POST /api/privacy/sos/alert

Send SOS emergency alert.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "ridePoolId": 3,
  "message": "Emergency: Feeling unsafe",
  "location": {
    "coordinates": [-122.4194, 37.7749]
  }
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "SOS alert sent. Authorities have been notified."
}
```

---

### GET /api/privacy/masked-phone/:userId

Get masked phone number for a user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "maskedNumber": "+1-555-XXXX-1234",
    "validUntil": "2024-01-20T10:00:00Z"
  }
}
```

---

## 📊 Trip Endpoints

### GET /api/trips

Get all trips for current user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `status`: Filter by status
- `page`, `limit`: Pagination

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "trips": [...]
  }
}
```

---

### GET /api/trips/:id

Get trip details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": 5,
    "ridePool": {...},
    "driver": {...},
    "riders": [...],
    "startTime": "2024-01-20T09:00:00Z",
    "endTime": "2024-01-20T10:00:00Z",
    "status": "completed",
    "totalFare": 75
  }
}
```

---

### POST /api/trips/:id/start

Start a trip (Driver only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "message": "Trip started",
  "data": {
    "startTime": "2024-01-20T09:00:00Z",
    "status": "in-progress"
  }
}
```

---

### POST /api/trips/:id/complete

Complete a trip (Driver only).

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "actualDistance": 45.2,
  "actualDuration": 45
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Trip completed",
  "data": {
    "endTime": "2024-01-20T10:00:00Z",
    "totalFare": 75,
    "status": "completed"
  }
}
```

---

## ⭐ Review Endpoints

### POST /api/reviews

Submit a review after trip completion.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "tripId": 5,
  "revieweeId": "507f1f77bcf86cd799439088",
  "type": "rider-to-driver",
  "rating": 5,
  "comment": "Great driver, very polite!"
}
```

**Response (201):**

```json
{
  "status": "success",
  "message": "Review submitted"
}
```

---

### GET /api/reviews/user/:userId

Get reviews for a user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "reviews": [...],
    "averageRating": 4.5,
    "totalReviews": 10
  }
}
```

---

## 📬 Message Endpoints

### GET /api/messages

Get conversation with another user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `userId`: Other user in conversation
- `ridePoolId`: Related ride (optional)
- `page`, `limit`: Pagination

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "messages": [...]
  }
}
```

---

### GET /api/messages/conversations

Get all conversations.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "conversations": [
      {
        "userId": "507f1f77bcf86cd799439088",
        "lastMessage": "See you tomorrow!",
        "unreadCount": 2
      }
    ]
  }
}
```

---

## ⚙️ Utility Endpoints

### GET /api/health

Health check endpoint (no auth required).

**Response (200):**

```json
{
  "status": "success",
  "message": "API is running",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

### GET /api/stats

Get system statistics (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "totalUsers": 1000,
    "activeDrivers": 50,
    "totalRides": 500,
    "completedTrips": 450
  }
}
```

---

## 📝 Error Responses

### 400 - Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### 401 - Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 - Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to perform this action"
  }
}
```

### 404 - Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 409 - Conflict

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Email already registered"
  }
}
```

### 500 - Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong. Please try again later."
  }
}
```

---

## 📊 Pagination Response Format

All list endpoints return paginated results:

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

## 🔐 Pagination Parameters

Query parameters for paginated endpoints:

| Parameter | Type   | Default | Description    |
| --------- | ------ | ------- | -------------- |
| `page`    | number | 1       | Page number    |
| `limit`   | number | 20      | Items per page |

---

_API endpoints designed following RESTful conventions with proper HTTP status codes._

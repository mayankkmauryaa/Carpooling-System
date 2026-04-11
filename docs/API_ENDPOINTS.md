# API Endpoints - Carpooling System

## Overview

Complete REST API documentation for all carpooling system endpoints.

---

## Authentication Endpoints

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

## User Endpoints

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

## Vehicle Endpoints

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

## Ride Pool Endpoints (Drivers)

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

## Ride Search Endpoints (Riders)

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

## Privacy Endpoints

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

## Trip Endpoints

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

## Review Endpoints

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

## Booking Endpoints

Booking management for riders. Integrated with Saga pattern for distributed transactions.

### POST /api/v1/bookings

Create a new booking request.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "rideId": 3,
  "pickupLocation": {
    "address": "123 Main St, San Francisco, CA",
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "dropLocation": {
    "address": "456 Oak Ave, Palo Alto, CA",
    "latitude": 37.4028,
    "longitude": -122.0869
  },
  "seatsBooked": 1,
  "paymentMethod": "razorpay"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "status": "PENDING",
    "rideId": 3,
    "riderId": 1,
    "seatsBooked": 1,
    "totalAmount": 25.00,
    "sagaState": "IN_PROGRESS"
  }
}
```

---

### GET /api/v1/bookings

Get all bookings for current user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `status`: Filter by status (PENDING, APPROVED, PAID, ACTIVE, COMPLETED, CANCELLED, FAILED)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking_123",
        "status": "COMPLETED",
        "ride": {
          "pickupLocation": "123 Main St",
          "dropLocation": "456 Oak Ave"
        },
        "seatsBooked": 1,
        "totalAmount": 25.00
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### GET /api/v1/bookings/:bookingId

Get booking details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "status": "PAID",
    "ride": {
      "id": 3,
      "driver": {
        "firstName": "John",
        "phone": "+1234567890"
      },
      "vehicle": {
        "brand": "Toyota",
        "model": "Camry",
        "licensePlate": "ABC123"
      },
      "departureTime": "2024-01-20T09:00:00Z"
    },
    "pickupLocation": {...},
    "dropLocation": {...},
    "seatsBooked": 1,
    "totalAmount": 25.00,
    "payment": {
      "id": "pay_123",
      "status": "captured"
    },
    "sagaState": "COMPLETED"
  }
}
```

---

### PUT /api/v1/bookings/:bookingId/cancel

Cancel a booking using CancellationSaga.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "reason": "Changed plans"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "bookingId": "booking_123",
    "cancelled": true,
    "refundEligible": true,
    "refundAmount": 21.25,
    "refundPolicy": "100% refund (48h+ notice)"
  }
}
```

---

### GET /api/v1/bookings/:bookingId/cancellation

Get cancellation details and refund eligibility.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "bookingId": "booking_123",
    "bookingStatus": "PENDING",
    "totalAmount": 25.00,
    "originalAmount": 25.00,
    "refundPercentage": 1.0,
    "refundAmount": 21.25,
    "actualRefundToUser": 21.25,
    "hoursUntilTrip": 60,
    "refundPolicy": "100% refund (48h+ notice)",
    "isEligibleForRefund": true
  }
}
```

---

### GET /api/v1/bookings/:bookingId/refund-status

Get refund status for a cancelled booking.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "bookingId": "booking_123",
    "refundStatus": "COMPLETED",
    "refundAmount": 21.25,
    "razorpayRefundId": "rfnd_123",
    "processedAt": "2024-01-20T10:00:00Z",
    "speed": "optimum"
  }
}
```

---

### GET /api/v1/bookings/calculate-price

Calculate price for rental or ride.

**Query Parameters (Rental):**
- `vehicleId`: Vehicle ID
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Query Parameters (Ride):**
- `ridePoolId`: Ride pool ID
- `seats`: Number of seats

**Example (Rental):**
```
GET /api/v1/bookings/calculate-price?vehicleId=1&startDate=2024-01-20&endDate=2024-01-25
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "days": 5,
    "breakdown": {
      "pricePerDay": 1000,
      "numberOfDays": 5,
      "basePrice": 5000,
      "platformFee": 750,
      "platformFeePercentage": 15,
      "insurance": 250,
      "insurancePerDay": 50,
      "subtotal": 6000,
      "taxes": 1080,
      "taxPercentage": 18
    },
    "totalPrice": 7080.00,
    "currency": "INR"
  }
}
```

---

### GET /api/v1/bookings/ride/:rideId

Get all bookings for a specific ride (Driver only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking_123",
        "rider": {
          "firstName": "Jane",
          "rating": 4.8
        },
        "status": "APPROVED",
        "seatsBooked": 1
      }
    ],
    "totalBookedSeats": 2,
    "availableSeats": 2
  }
}
```

---

## Message Endpoints

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

## Utility Endpoints

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

## Health Check Endpoints - NEW

Kubernetes-compatible health endpoints for container orchestration.

### GET /health/live

Liveness probe - Check if the process is running.

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

### GET /health/ready

Readiness probe - Check if all dependencies are available.

**Response (200):**

```json
{
  "status": "ok",
  "checks": {
    "database": true,
    "redis": true,
    "eventBus": false
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Response (503 - Degraded):**

```json
{
  "status": "degraded",
  "checks": {
    "database": true,
    "redis": false,
    "eventBus": false
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

### GET /health

Full health check with all service statuses.

**Response (200 - Healthy):**

```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "redis": true,
    "eventBus": true
  },
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Response (503 - Unhealthy):**

```json
{
  "status": "unhealthy",
  "checks": {
    "database": true,
    "redis": false,
    "eventBus": false
  },
  "version": "1.0.0",
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

## Error Responses

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

## Pagination Response Format

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

## Pagination Parameters

Query parameters for paginated endpoints:

| Parameter | Type   | Default | Description    |
| --------- | ------ | ------- | -------------- |
| `page`    | number | 1       | Page number    |
| `limit`   | number | 20      | Items per page |

---

## Upload Endpoints

File upload endpoints using Cloudinary.

### POST /api/v1/uploads/file

Upload single file.

**Headers:** `Authorization: Bearer <token>`

**Body:** `multipart/form-data`

- `file`: File to upload

**Response:**

```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "carpooling/uploads/abc123",
    "format": "jpg",
    "width": 800,
    "height": 600,
    "bytes": 102400
  }
}
```

### POST /api/v1/uploads/files

Upload multiple files (up to 10).

### POST /api/v1/uploads/profile

Upload profile image.

### POST /api/v1/uploads/vehicle/:vehicleId/image

Upload single vehicle image.

### POST /api/v1/uploads/vehicle/:vehicleId/images

Upload multiple vehicle images.

### POST /api/v1/uploads/driver/document

Upload driver document (license, etc.).

### DELETE /api/v1/uploads/:publicId

Delete uploaded file.

### GET /api/v1/uploads/metadata/:publicId

Get file metadata.

### GET /api/v1/uploads/optimize/:publicId

Get optimized image URL.

### GET /api/v1/uploads/thumbnail/:publicId

Get thumbnail URL.

---

## Payment Endpoints

Razorpay payment integration.

### POST /api/v1/payments/order

Create payment order.

### POST /api/v1/payments/verify

Verify payment signature.

### POST /api/v1/payments/capture

Capture authorized payment.

### POST /api/v1/payments/refund

Initiate refund.

### GET /api/v1/payments/payment/:paymentId

Get payment details.

### POST /api/v1/payments/customer

Create Razorpay customer.

### GET /api/v1/payments/customer/:customerId

Get customer details.

### POST /api/v1/payments/subscription

Create subscription.

### DELETE /api/v1/payments/subscription/:subscriptionId

Cancel subscription.

### POST /api/v1/payments/wallet/recharge

Recharge wallet.

### POST /api/v1/payments/wallet/debit

Debit wallet.

### GET /api/v1/payments/wallet/balance

Get wallet balance.

### GET /api/v1/payments/wallet/transactions

Get wallet transaction history.

### POST /api/v1/payments/payout

Create driver payout (Admin only).

### POST /api/v1/payments/transfer

Create transfer (Admin only).

### POST /api/v1/payments/webhook

Razorpay webhook endpoint.

---

## Admin Endpoints

Admin dashboard and management endpoints.

### GET /api/v1/admin/dashboard

Get dashboard statistics.

### GET /api/v1/admin/analytics/users

Get user analytics.

### GET /api/v1/admin/analytics/rides

Get ride analytics.

### GET /api/v1/admin/analytics/revenue

Get revenue analytics.

### GET /api/v1/admin/analytics/popular-routes

Get popular routes.

### GET /api/v1/admin/analytics/peak-hours

Get peak hours analysis.

### User Management

| Method | Endpoint                         | Description        |
| ------ | -------------------------------- | ------------------ |
| GET    | `/admin/users`                   | List all users     |
| GET    | `/admin/users/:userId`           | Get user details   |
| PUT    | `/admin/users/:userId/status`    | Update user status |
| POST   | `/admin/users/:userId/suspend`   | Suspend user       |
| POST   | `/admin/users/:userId/unsuspend` | Unsuspend user     |
| DELETE | `/admin/users/:userId`           | Delete user        |

### Vehicle Management

| Method | Endpoint                                  | Description                |
| ------ | ----------------------------------------- | -------------------------- |
| GET    | `/admin/vehicles`                         | List all vehicles          |
| GET    | `/admin/vehicles/:vehicleId`              | Get vehicle details        |
| POST   | `/admin/vehicles`                         | Create vehicle             |
| PUT    | `/admin/vehicles/:vehicleId`              | Update vehicle             |
| DELETE | `/admin/vehicles/:vehicleId`              | Delete vehicle             |
| PUT    | `/admin/vehicles/:vehicleId/verification` | Update verification status |

#### POST /api/v1/admin/vehicles

Create a new vehicle for a driver.

**Request:**

```json
{
  "driverId": 5,
  "brand": "Toyota",
  "model": "Camry",
  "licensePlate": "ABC123",
  "color": "Silver",
  "capacity": 4,
  "preferences": {
    "smoking": false,
    "pets": false,
    "music": true
  },
  "registrationExpiry": "2025-12-31"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": 10,
    "driverId": 5,
    "brand": "Toyota",
    "model": "Camry",
    "licensePlate": "ABC123",
    "capacity": 4,
    "verificationStatus": "PENDING"
  }
}
```

#### PUT /api/v1/admin/vehicles/:vehicleId

Update vehicle details.

**Request:**

```json
{
  "brand": "Honda",
  "model": "Accord",
  "color": "Black",
  "capacity": 5,
  "isActive": true
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 10,
    "brand": "Honda",
    "model": "Accord"
  }
}
```

#### DELETE /api/v1/admin/vehicles/:vehicleId

Delete a vehicle.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "deleted": true,
    "vehicleId": 10
  }
}
```

### Ride Management

| Method | Endpoint                      | Description      |
| ------ | ----------------------------- | ---------------- |
| GET    | `/admin/rides`                | List all rides   |
| GET    | `/admin/rides/:rideId`        | Get ride details |
| POST   | `/admin/rides/:rideId/cancel` | Cancel ride      |

### SOS Management

| Method | Endpoint                     | Description         |
| ------ | ---------------------------- | ------------------- |
| GET    | `/admin/sos`                 | List SOS alerts     |
| PUT    | `/admin/sos/:alertId/status` | Update alert status |

---

## WebSocket Namespaces

Real-time communication using Socket.IO.

### /rides Namespace

**Events (Client → Server):**

| Event              | Payload                              | Description            |
| ------------------ | ------------------------------------ | ---------------------- |
| `joinRide`         | `rideId`                             | Join ride room         |
| `leaveRide`        | `rideId`                             | Leave ride room        |
| `updateLocation`   | `{rideId, lat, lng, heading, speed}` | Update driver location |
| `updateRideStatus` | `{rideId, status, eta, distance}`    | Update ride status     |

**Events (Server → Client):**

| Event                   | Payload                                | Description      |
| ----------------------- | -------------------------------------- | ---------------- |
| `userJoined`            | `{userId, timestamp}`                  | User joined ride |
| `userLeft`              | `{userId, timestamp}`                  | User left ride   |
| `driverLocationUpdated` | `{driverId, lat, lng, heading, speed}` | Location update  |
| `rideStatusChanged`     | `{rideId, status, eta, distance}`      | Status changed   |

### /chat Namespace

**Events (Client → Server):**

| Event              | Payload                           | Description       |
| ------------------ | --------------------------------- | ----------------- |
| `joinConversation` | `conversationId`                  | Join conversation |
| `sendMessage`      | `{conversationId, message, type}` | Send message      |
| `typing`           | `conversationId`                  | User typing       |

**Events (Server → Client):**

| Event        | Payload                              | Description |
| ------------ | ------------------------------------ | ----------- |
| `newMessage` | `{id, conversationId, message, ...}` | New message |
| `userTyping` | `{userId, conversationId}`           | User typing |

---

## Upload File Types

| Type      | Formats                                   | Max Size |
| --------- | ----------------------------------------- | -------- |
| Images    | jpg, jpeg, png, gif, webp, bmp, svg       | 10 MB    |
| Documents | pdf, doc, docx, xls, xlsx, ppt, pptx, txt | 10 MB    |
| Video     | mp4, webm, mov, avi, mkv                  | 100 MB   |
| Audio     | mp3, wav, ogg, m4a, aac, flac             | 20 MB    |

---

## Google Maps Integration - NEW

Distance and route calculations using Google Maps API.

### Distance & ETA

Calculated automatically in ride search response:

```json
{
  "rides": [{
    "id": 3,
    "matchPercentage": 85,
    "distanceToPickup": 2.5,
    "distanceToPickupText": "2.5 km",
    "totalDistance": 25.3,
    "totalDistanceText": "25.3 km",
    "estimatedDuration": 1800,
    "estimatedDurationText": "30 min"
  }]
}
```

---

## Event-Driven Architecture - NEW

Kafka topics for async event processing.

### Kafka Topics

| Topic | Events |
|-------|--------|
| `trip-events` | TRIP_CREATED, TRIP_STARTED, TRIP_COMPLETED, TRIP_CANCELLED |
| `payment-events` | PAYMENT_INITIATED, PAYMENT_SUCCESS, PAYMENT_FAILED, PAYOUT_COMPLETED |
| `notification-events` | EMAIL_NOTIFICATION, PUSH_NOTIFICATION, SOS_ALERT |

### Kafka Consumers - NEW

#### TripConsumer
Listens to:
- `trip.created` - Send confirmation notifications
- `trip.started` - Update trip status, start location tracking
- `trip.completed` - Calculate earnings, trigger payout, send notifications
- `trip.cancelled` - Notify riders, release seats
- `booking.created` - Initiate payment
- `booking.cancelled` - Process refund
- `seat.reserved` / `seat.released` - Update seat counts

#### PaymentConsumer
Listens to:
- `payment.initiated` - Create payment record
- `payment.captured` - Update booking to PAID
- `payment.failed` - Mark booking as FAILED, release seats
- `refund.initiated` - Update booking refund status
- `refund.processed` - Complete refund tracking
- `payout.calculate` - Calculate driver earnings
- `payout.processed` - Complete payout record

### Event Flow

```
Booking Created
    |
    v
[payment.initiated] -> [PaymentConsumer] -> [booking.confirmed]
    |
    v
[booking.cancelled] -> [CancellationSaga] -> [seat.released] -> [refund.process]
    |
    v
[Trip Completed] -> [TripConsumer] -> [payout.calculate] -> [PaymentConsumer] -> [notification.send]
```

---

## Saga Patterns - NEW

Distributed transaction management for critical flows.

### Booking Saga Steps

```
1. Reserve Seat (PENDING) -> 2. Process Payment -> 3. Approve Request -> 4. Confirm Booking
         |                              |                    |
         v                              v                    v
    ROLLBACK                    ROLLBACK              ROLLBACK
```

### Payout Saga Steps

```
1. Validate Trip -> 2. Calculate Payout -> 3. Process Payout -> 4. Update Earnings -> 5. Notify Driver
         |               |                    |                |
         v               v                    v                v
     ROLLBACK        ROLLBACK             ROLLBACK         ROLLBACK
```

### Cancellation Saga - NEW

```
1. Validate Booking -> 2. Update Status to CANCELLED -> 3. Release Seats -> 4. Process Refund -> 5. Send Notification
         |                     |                            |                |                    |
         v                     v                            v                v                    v
     ROLLBACK           ROLLBACK                    ROLLBACK      ROLLBACK           ROLLBACK
```

#### Cancellation Refund Policy

| Hours Before Trip | Refund Percentage |
|-------------------|------------------|
| 48+ hours | 100% refund |
| 24-48 hours | 50% refund |
| 12-24 hours | 25% refund |
| < 12 hours | No refund |

Note: Platform fee (15%) is non-refundable.

### Saga States

| State | Description |
|-------|-------------|
| PENDING | Saga created, not started |
| IN_PROGRESS | Executing steps |
| COMPLETED | All steps successful |
| FAILED | Step failed |
| COMPENSATING | Rolling back |
| ROLLED_BACK | Rollback complete |

---

## Circuit Breakers - NEW

Resilience pattern for external service failures.

### Protected Services

| Service | Failure Threshold | Timeout |
|---------|-------------------|---------|
| razorpay | 5 failures | 30s |
| email | 3 failures | 15s |
| maps | 5 failures | 10s |
| redis | 10 failures | 5s |

### Circuit States

```
CLOSED -> (5 failures) -> OPEN -> (30s) -> HALF_OPEN -> (success) -> CLOSED
                                          |
                                          v (failure)
                                          OPEN
```

---

## Environment Validation - NEW

Startup validation for required environment variables.

### Required Variables

| Variable | Description | Required In |
|----------|-------------|-------------|
| `NODE_ENV` | Environment (development/production) | All |
| `PORT` | Server port | All |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | All |
| `DATABASE_URL` | PostgreSQL connection string | All |
| `RAZORPAY_KEY_ID` | Razorpay API key | Production |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | Production |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | Production |
| `CLOUDINARY_*` | Cloudinary credentials | Production |
| `SMTP_*` | Email SMTP settings | Production |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection (fallback: in-memory) |
| `KAFKA_BROKERS` | Kafka broker addresses |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth |
| `FACEBOOK_CLIENT_ID/SECRET` | Facebook OAuth |
| `APPLE_*` | Apple Sign In |

### Validation Behavior

```
Production: Fails on missing required vars
Development: Warns on missing optional vars
Test: Skips validation
```

---

## Graceful Shutdown - NEW

Proper process termination for zero-downtime deployments.

### Shutdown Sequence

```
1. Close HTTP server (stop accepting new connections)
2. Disconnect Socket.IO
3. Close Event Bus (Kafka producer)
4. Close Redis connection
5. Close Database connection
```

### Supported Signals

| Signal | Description |
|--------|-------------|
| `SIGTERM` | Kubernetes/Container stop |
| `SIGINT` | Ctrl+C local shutdown |
| `SIGUSR1/2` | User-defined signals |

### Shutdown Timeout

Default: 30 seconds
Forces exit if graceful shutdown exceeds timeout.

### PM2 Integration

```bash
pm2 stop ecosystem.config.js    # Graceful SIGTERM
pm2 kill                        # Force kill
pm2 restart ecosystem.config.js # Graceful restart
```

---

_API endpoints designed following RESTful conventions with proper HTTP status codes._
_Last Updated: April 11, 2026_

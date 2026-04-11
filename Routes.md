# 🚗 Complete API Routes - Carpooling System

> **Total Endpoints:** 217  
> **Base URL:** `/api/v1`  
> **Last Updated:** April 11, 2026  
> **Status:** PRODUCTION-READY ✅

---

## 🌐 Root Endpoints (No Auth Required)

| Method | Endpoint          | Description        |
| :----: | :---------------- | :----------------- |
|  GET   | `/`               | Root API info      |
|  GET   | `/api/health`     | Health check       |
|  GET   | `/api/v1/health`  | V1 health check    |
|  GET   | `/health/live`    | Liveness probe     |
|  GET   | `/health/ready`   | Readiness probe    |
|  GET   | `/health`         | Full health check  |
|  GET   | `/metrics`        | Prometheus metrics |
|  GET   | `/api/v1/metrics` | V1 metrics         |
|  GET   | `/api/stats`      | API statistics     |

---

## 🔐 /api/v1/auth (10 endpoints)

Authentication & Authorization

| Method | Endpoint                       | Auth | Description         |
| :----: | :----------------------------- | :--- | :------------------ |
|  POST  | `/api/v1/auth/register`        | ❌   | Register new user   |
|  POST  | `/api/v1/auth/login`           | ❌   | User login          |
|  POST  | `/api/v1/auth/refresh`         | ✅   | Refresh token       |
|  POST  | `/api/v1/auth/logout`          | ✅   | User logout         |
|  GET   | `/api/v1/auth/me`              | ✅   | Get current user    |
|  GET   | `/api/v1/auth/verify`          | ✅   | Verify token        |
|  GET   | `/api/v1/auth/google`          | ❌   | Google OAuth init   |
|  GET   | `/api/v1/auth/google/callback` | ❌   | Google callback     |
|  POST  | `/api/v1/auth/google/mobile`   | ❌   | Google mobile login |
|  POST  | `/api/v1/auth/google/link`     | ✅   | Link Google account |

---

## 👤 /api/v1/users (10 endpoints)

User Profile Management

| Method | Endpoint                                                 | Auth     | Description        |
| :----: | :------------------------------------------------------- | :------- | :----------------- |
|  GET   | `/api/v1/users/profile`                                  | ✅       | Get own profile    |
|  PUT   | `/api/v1/users/profile`                                  | ✅       | Update profile     |
|  PUT   | `/api/v1/users/password`                                 | ✅       | Change password    |
|  GET   | `/api/v1/users/:id`                                      | ✅       | Get user by ID     |
|  GET   | `/api/v1/users/:userId/reviews?page=1&limit=10`          | ✅       | Get user reviews   |
|  GET   | `/api/v1/users/?role=DRIVER&search=test&page=1&limit=10` | ✅       | Get all users      |
|  GET   | `/api/v1/users/drivers`                                  | ✅ ADMIN | Get all drivers    |
|  GET   | `/api/v1/users/riders`                                   | ✅ ADMIN | Get all riders     |
|  PUT   | `/api/v1/users/:id/status`                               | ✅ ADMIN | Toggle user status |
| DELETE | `/api/v1/users/:id`                                      | ✅ ADMIN | Delete user        |

**Query Params:** `role`, `search`, `page`, `limit`

---

## 🚗 /api/v1/rides (18 endpoints)

Ride Pool Management

| Method | Endpoint                                                                              | Auth      | Description         |
| :----: | :------------------------------------------------------------------------------------ | :-------- | :------------------ |
|  POST  | `/api/v1/rides`                                                                       | ✅ DRIVER | Create ride         |
|  GET   | `/api/v1/rides`                                                                       | ✅        | Get my rides        |
|  GET   | `/api/v1/rides/search?pickupLat=&pickupLng=&dropLat=&dropLng=&radius=5&date=&seats=1` | ✅        | Search rides        |
|  GET   | `/api/v1/rides/recommendations`                                                       | ✅        | Get recommendations |
|  GET   | `/api/v1/rides/all`                                                                   | ✅ ADMIN  | Get all rides       |
|  GET   | `/api/v1/rides/:id`                                                                   | ✅        | Get ride by ID      |
|  PUT   | `/api/v1/rides/:id`                                                                   | ✅        | Update ride         |
| DELETE | `/api/v1/rides/:id`                                                                   | ✅        | Cancel ride         |
|  GET   | `/api/v1/rides/:id/requests`                                                          | ✅ DRIVER | Get ride requests   |
|  PUT   | `/api/v1/rides/:id/requests/:riderId`                                                 | ✅ DRIVER | Respond to request  |
|  POST  | `/api/v1/rides/:id/join`                                                              | ✅        | Request to join     |
|  GET   | `/api/v1/rides/my-requests`                                                           | ✅        | Get my requests     |
| DELETE | `/api/v1/rides/:id/join`                                                              | ✅        | Cancel join request |
|  PUT   | `/api/v1/rides/:id/status`                                                            | ✅ ADMIN  | Update ride status  |
|  GET   | `/api/v1/rides/driver/:driverId`                                                      | ✅ ADMIN  | Get rides by driver |
|  GET   | `/api/v1/rides/date/:date`                                                            | ✅        | Get rides by date   |
|  GET   | `/api/v1/rides/upcoming`                                                              | ✅        | Get upcoming rides  |
|  GET   | `/api/v1/rides/nearby`                                                                | ✅        | Get nearby rides    |

**Search Query Params:** `pickupLat`, `pickupLng`, `dropLat`, `dropLng`, `radius`, `date`, `seats`

---

## ���� /api/v1/bookings (12 endpoints)

Booking Management

| Method | Endpoint                                              | Auth     | Description              |
| :----: | :---------------------------------------------------- | :------- | :----------------------- |
|  POST  | `/api/v1/bookings`                                    | ✅       | Create booking           |
|  GET   | `/api/v1/bookings/my-bookings`                        | ✅       | Get my bookings          |
|  GET   | `/api/v1/bookings/calculate-price?ridePoolId=&seats=` | ✅       | Calculate price          |
|  GET   | `/api/v1/bookings/:id`                                | ✅       | Get booking by ID        |
|  GET   | `/api/v1/bookings/:id/cancellation`                   | ✅       | Get cancellation details |
|  GET   | `/api/v1/bookings/:id/refund-status`                  | ✅       | Get refund status        |
|  PUT   | `/api/v1/bookings/:id/cancel`                         | ✅       | Cancel booking           |
|  PUT   | `/api/v1/bookings/:id/status`                         | ✅ ADMIN | Update status            |
|  GET   | `/api/v1/bookings/`                                   | ✅ ADMIN | Get all bookings         |
|  PUT   | `/api/v1/bookings/:id/approve`                        | ✅ ADMIN | Approve booking          |
|  PUT   | `/api/v1/bookings/:id/reject`                         | ✅ ADMIN | Reject booking           |
|  GET   | `/api/v1/bookings/stats/admin`                        | ✅ ADMIN | Booking stats            |

---

## 🚕 /api/v1/trips (13 endpoints)

Trip Lifecycle Management

| Method | Endpoint                                                | Auth      | Description           |
| :----: | :------------------------------------------------------ | :-------- | :-------------------- |
|  GET   | `/api/v1/trips/?status=COMPLETED&date=&page=1&limit=10` | ✅        | Get my trips          |
|  GET   | `/api/v1/trips/all`                                     | ✅ ADMIN  | Get all trips         |
|  GET   | `/api/v1/trips/:id`                                     | ✅        | Get trip by ID        |
|  POST  | `/api/v1/trips/:id/start`                               | ✅ DRIVER | Start trip            |
|  POST  | `/api/v1/trips/:id/complete`                            | ✅ DRIVER | Complete trip         |
|  POST  | `/api/v1/trips/:id/cancel`                              | ✅        | Cancel trip           |
|  GET   | `/api/v1/trips/driver/:driverId`                        | ✅ ADMIN  | Get trips by driver   |
|  GET   | `/api/v1/trips/rider/:riderId`                          | ✅ ADMIN  | Get trips by rider    |
|  GET   | `/api/v1/trips/ridepool/:ridePoolId`                    | ✅        | Get trip by ride pool |
|  GET   | `/api/v1/trips/date/:date`                              | ✅        | Get trips by date     |
|  GET   | `/api/v1/trips/status/:status`                          | ✅        | Get trips by status   |
|  GET   | `/api/v1/trips/upcoming`                                | ✅        | Get upcoming trips    |
|  GET   | `/api/v1/trips/stats`                                   | ✅ ADMIN  | Trip stats            |

**Query Params:** `status`, `date`, `page`, `limit`

---

## 🚙 /api/v1/vehicles (8 endpoints)

Vehicle Management

| Method | Endpoint                                                         | Auth      | Description            |
| :----: | :--------------------------------------------------------------- | :-------- | :--------------------- |
|  POST  | `/api/v1/vehicles`                                               | ✅ DRIVER | Create vehicle         |
|  GET   | `/api/v1/vehicles/?brand=&model=&color=&search=&page=1&limit=10` | ✅        | Get my vehicles        |
|  GET   | `/api/v1/vehicles/all`                                           | ✅ ADMIN  | Get all vehicles       |
|  GET   | `/api/v1/vehicles/:id`                                           | ✅        | Get vehicle by ID      |
|  PUT   | `/api/v1/vehicles/:id`                                           | ✅        | Update vehicle         |
| DELETE | `/api/v1/vehicles/:id`                                           | ✅        | Delete vehicle         |
|  PUT   | `/api/v1/vehicles/:id/status`                                    | ✅        | Toggle status          |
|  GET   | `/api/v1/vehicles/driver/:driverId`                              | ✅ ADMIN  | Get vehicles by driver |

**Query Params:** `brand`, `model`, `color`, `search`, `page`, `limit`

---

## 💳 /api/v1/payments (17 endpoints)

Payment Processing & Wallets

| Method | Endpoint                                        | Auth     | Description          |
| :----: | :---------------------------------------------- | :------- | :------------------- |
|  POST  | `/api/v1/payments/order`                        | ✅       | Create order         |
|  POST  | `/api/v1/payments/verify`                       | ❌       | Verify payment       |
|  POST  | `/api/v1/payments/capture`                      | ✅       | Capture payment      |
|  POST  | `/api/v1/payments/refund`                       | ✅       | Refund payment       |
|  GET   | `/api/v1/payments/payment/:paymentId`           | ✅       | Get payment details  |
|  POST  | `/api/v1/payments/customer`                     | ✅       | Create customer      |
|  GET   | `/api/v1/payments/customer/:customerId`         | ✅       | Get customer         |
|  POST  | `/api/v1/payments/subscription`                 | ✅       | Create subscription  |
| DELETE | `/api/v1/payments/subscription/:subscriptionId` | ✅       | Cancel subscription  |
|  POST  | `/api/v1/payments/wallet/recharge`              | ✅       | Wallet recharge      |
|  POST  | `/api/v1/payments/wallet/debit`                 | ✅       | Wallet debit         |
|  GET   | `/api/v1/payments/wallet/balance`               | ✅       | Get balance          |
|  GET   | `/api/v1/payments/wallet/transactions`          | ✅       | Wallet transactions  |
|  POST  | `/api/v1/payments/payout`                       | ✅ ADMIN | Create driver payout |
|  POST  | `/api/v1/payments/transfer`                     | ✅ ADMIN | Create transfer      |
|  POST  | `/api/v1/payments/webhook`                      | ❌       | Payment webhook      |

---

## ⚙️ /api/v1/admin (45 endpoints)

Admin Dashboard & Management

| Method | Endpoint                                              | Auth     | Description          |
| :----: | :---------------------------------------------------- | :------- | :------------------- |
|  GET   | `/api/v1/admin/dashboard`                             | ✅ ADMIN | Admin dashboard      |
|  GET   | `/api/v1/admin/analytics/users?startDate=&endDate=`   | ✅ ADMIN | User analytics       |
|  GET   | `/api/v1/admin/analytics/rides?startDate=&endDate=`   | ✅ ADMIN | Ride analytics       |
|  GET   | `/api/v1/admin/analytics/revenue?startDate=&endDate=` | ✅ ADMIN | Revenue analytics    |
|  GET   | `/api/v1/admin/analytics/popular-routes`              | ✅ ADMIN | Popular routes       |
|  GET   | `/api/v1/admin/analytics/peak-hours`                  | ✅ ADMIN | Peak hours           |
|  GET   | `/api/v1/admin/users`                                 | ✅ ADMIN | Get all users        |
|  GET   | `/api/v1/admin/users/:userId`                         | ✅ ADMIN | Get user details     |
|  PUT   | `/api/v1/admin/users/:userId/status`                  | ✅ ADMIN | Update status        |
|  POST  | `/api/v1/admin/users/:userId/suspend`                 | ✅ ADMIN | Suspend user         |
|  POST  | `/api/v1/admin/users/:userId/unsuspend`               | ✅ ADMIN | Unsuspend user       |
| DELETE | `/api/v1/admin/users/:userId`                         | ✅ ADMIN | Delete user          |
|  GET   | `/api/v1/admin/vehicles`                              | ✅ ADMIN | Get all vehicles     |
|  GET   | `/api/v1/admin/vehicles/:vehicleId`                   | ✅ ADMIN | Get vehicle          |
|  POST  | `/api/v1/admin/vehicles`                              | ✅ ADMIN | Create vehicle       |
|  PUT   | `/api/v1/admin/vehicles/:vehicleId`                   | ✅ ADMIN | Update vehicle       |
| DELETE | `/api/v1/admin/vehicles/:vehicleId`                   | ✅ ADMIN | Delete vehicle       |
|  PUT   | `/api/v1/admin/vehicles/:vehicleId/verification`      | ✅ ADMIN | Update verification  |
|  GET   | `/api/v1/admin/rides`                                 | ✅ ADMIN | Get all rides        |
|  GET   | `/api/v1/admin/rides/:rideId`                         | ✅ ADMIN | Get ride details     |
|  POST  | `/api/v1/admin/rides/:rideId/cancel`                  | ✅ ADMIN | Cancel ride          |
|  GET   | `/api/v1/admin/trips`                                 | ✅ ADMIN | Get all trips        |
|  GET   | `/api/v1/admin/trips/:tripId`                         | ✅ ADMIN | Get trip details     |
|  GET   | `/api/v1/admin/reviews`                               | ✅ ADMIN | Get all reviews      |
| DELETE | `/api/v1/admin/reviews/:reviewId`                     | ✅ ADMIN | Delete review        |
|  GET   | `/api/v1/admin/sos`                                   | ✅ ADMIN | Get SOS alerts       |
|  PUT   | `/api/v1/admin/sos/:alertId/status`                   | ✅ ADMIN | Update SOS status    |
|  GET   | `/api/v1/admin/messages`                              | ✅ ADMIN | Get messages         |
|  GET   | `/api/v1/admin/driver-documents/pending`              | ✅ ADMIN | Pending driver docs  |
|  PUT   | `/api/v1/admin/driver-documents/:documentId/verify`   | ✅ ADMIN | Verify doc           |
|  PUT   | `/api/v1/admin/driver-documents/:documentId/reject`   | ✅ ADMIN | Reject doc           |
|  GET   | `/api/v1/admin/driver-documents/:documentId`          | ✅ ADMIN | Get doc              |
|  GET   | `/api/v1/admin/vehicle-documents/pending`             | ✅ ADMIN | Pending vehicle docs |
|  PUT   | `/api/v1/admin/vehicle-documents/:documentId/verify`  | ✅ ADMIN | Verify doc           |
|  PUT   | `/api/v1/admin/vehicle-documents/:documentId/reject`  | ✅ ADMIN | Reject doc           |
|  GET   | `/api/v1/admin/vehicle-documents/:documentId`         | ✅ ADMIN | Get doc              |
|  GET   | `/api/v1/admin/owners`                                | ✅ ADMIN | Get all owners       |
|  GET   | `/api/v1/admin/owners/pending`                        | ✅ ADMIN | Pending owners       |
|  PUT   | `/api/v1/admin/owners/:ownerId/verify`                | ✅ ADMIN | Verify owner         |
|  PUT   | `/api/v1/admin/owners/:ownerId/reject`                | ✅ ADMIN | Reject owner         |
|  GET   | `/api/v1/admin/owners/:ownerId`                       | ✅ ADMIN | Get owner            |
|  GET   | `/api/v1/admin/fleets/performance?period=`            | ✅ ADMIN | Fleet performance    |
|  GET   | `/api/v1/admin/fleets/vehicles`                       | ✅ ADMIN | Fleet vehicles       |
|  GET   | `/api/v1/admin/owner-documents/pending`               | ✅ ADMIN | Pending owner docs   |
|  PUT   | `/api/v1/admin/owner-documents/:documentId/verify`    | ✅ ADMIN | Verify doc           |
|  PUT   | `/api/v1/admin/owner-documents/:documentId/reject`    | ✅ ADMIN | Reject doc           |
|  GET   | `/api/v1/admin/owner-documents/:documentId`           | ✅ ADMIN | Get doc              |
|  GET   | `/api/v1/admin/documents/expiring`                    | ✅ ADMIN | Expiring docs        |
|  POST  | `/api/v1/admin/documents/check-expiry`                | ✅ ADMIN | Run expiry check     |

**Analytics Query Params:** `startDate`, `endDate`

---

## 🔒 /api/v1/privacy (8 endpoints)

Privacy & Safety Features

| Method | Endpoint                               | Auth | Description          |
| :----: | :------------------------------------- | :--- | :------------------- |
|  POST  | `/api/v1/privacy/call/initiate`        | ✅   | Initiate call        |
|  POST  | `/api/v1/privacy/call/end`             | ✅   | End call             |
|  GET   | `/api/v1/privacy/masked-phone/:userId` | ✅   | Get masked phone     |
|  POST  | `/api/v1/privacy/sos/alert`            | ✅   | SOS alert            |
|  GET   | `/api/v1/privacy/sos/history`          | ✅   | SOS history          |
|  GET   | `/api/v1/privacy/settings`             | ✅   | Get privacy settings |
|  PUT   | `/api/v1/privacy/settings`             | ✅   | Update settings      |
|  GET   | `/api/v1/privacy/profile-visibility`   | ✅   | Profile visibility   |

---

## 💬 /api/v1/messages (9 endpoints)

Messaging System

| Method | Endpoint                                                | Auth | Description         |
| :----: | :------------------------------------------------------ | :--- | :------------------ |
|  GET   | `/api/v1/messages/?userId=&ridePoolId=&page=1&limit=20` | ✅   | Get messages        |
|  GET   | `/api/v1/messages/conversations`                        | ✅   | Get conversations   |
|  GET   | `/api/v1/messages/unread-count`                         | ✅   | Unread count        |
|  GET   | `/api/v1/messages/conversation/:userId`                 | ✅   | Get conversation    |
|  POST  | `/api/v1/messages`                                      | ✅   | Send message        |
|  PUT   | `/api/v1/messages/read`                                 | ✅   | Mark as read        |
|  PUT   | `/api/v1/messages/read/:userId`                         | ✅   | Mark conv as read   |
| DELETE | `/api/v1/messages/:messageId`                           | ✅   | Delete message      |
| DELETE | `/api/v1/messages/conversation/:userId`                 | ✅   | Delete conversation |

**Query Params:** `userId`, `ridePoolId`, `page`, `limit`

---

## ⭐ /api/v1/reviews (8 endpoints)

Trip Reviews & Ratings

| Method | Endpoint                                                                   | Auth     | Description       |
| :----: | :------------------------------------------------------------------------- | :------- | :---------------- |
|  POST  | `/api/v1/reviews`                                                          | ✅       | Create review     |
|  GET   | `/api/v1/reviews/user/:userId?type=&minRating=&maxRating=&page=1&limit=10` | ✅       | User reviews      |
|  GET   | `/api/v1/reviews/trip/:tripId`                                             | ✅       | Trip reviews      |
|  GET   | `/api/v1/reviews/all`                                                      | ✅ ADMIN | All reviews       |
|  GET   | `/api/v1/reviews/my-reviews`                                               | ✅       | My reviews        |
|  GET   | `/api/v1/reviews/:id`                                                      | ✅       | Get review by ID  |
| DELETE | `/api/v1/reviews/:id`                                                      | ✅       | Delete review     |
|  GET   | `/api/v1/reviews/stats/user/:userId`                                       | ✅       | User review stats |

**Query Params:** `type`, `minRating`, `maxRating`, `page`, `limit`

---

## 📁 /api/v1/uploads (12 endpoints)

File Upload Service

| Method | Endpoint                                       | Auth | Description        |
| :----: | :--------------------------------------------- | :--- | :----------------- |
|  POST  | `/api/v1/uploads/file`                         | ✅   | Upload single file |
|  POST  | `/api/v1/uploads/files`                        | ✅   | Upload multiple    |
|  POST  | `/api/v1/uploads/profile`                      | ✅   | Upload profile     |
|  POST  | `/api/v1/uploads/vehicle/:vehicleId/image`     | ✅   | Vehicle image      |
|  POST  | `/api/v1/uploads/vehicle/:vehicleId/images`    | ✅   | Vehicle images     |
|  POST  | `/api/v1/uploads/driver/document`              | ✅   | Driver document    |
|  POST  | `/api/v1/uploads/vehicle/:vehicleId/documents` | ✅   | Vehicle docs       |
| DELETE | `/api/v1/uploads/:publicId`                    | ✅   | Delete file        |
| DELETE | `/api/v1/uploads/`                             | ✅   | Delete multiple    |
|  GET   | `/api/v1/uploads/metadata/:publicId`           | ✅   | File metadata      |
|  GET   | `/api/v1/uploads/optimize/:publicId`           | ✅   | Optimized image    |
|  GET   | `/api/v1/uploads/thumbnail/:publicId`          | ✅   | Thumbnail          |

---

## 📄 /api/v1/driver-documents (6 endpoints)

Driver Document Management

| Method | Endpoint                                 | Auth      | Description       |
| :----: | :--------------------------------------- | :-------- | :---------------- |
|  POST  | `/api/v1/driver-documents`               | ✅ DRIVER | Upload document   |
|  GET   | `/api/v1/driver-documents`               | ✅ DRIVER | Get my documents  |
|  GET   | `/api/v1/driver-documents/status`        | ✅ DRIVER | Document status   |
|  POST  | `/api/v1/driver-documents/submit-review` | ✅ DRIVER | Submit for review |
|  GET   | `/api/v1/driver-documents/:documentId`   | ✅ DRIVER | Get document      |
| DELETE | `/api/v1/driver-documents/:documentId`   | ✅ DRIVER | Delete document   |

---

## 🚘 /api/v1/vehicle-documents (8 endpoints)

Vehicle Document Management

| Method | Endpoint                                                     | Auth            | Description      |
| :----: | :----------------------------------------------------------- | :-------------- | :--------------- |
|  POST  | `/api/v1/vehicle-documents`                                  | ✅ DRIVER/OWNER | Upload doc       |
|  POST  | `/api/v1/vehicle-documents/batch`                            | ✅ DRIVER/OWNER | Batch upload     |
|  GET   | `/api/v1/vehicle-documents/my-vehicles`                      | ✅ DRIVER/OWNER | My vehicles docs |
|  GET   | `/api/v1/vehicle-documents/vehicle/:vehicleId`               | ✅ DRIVER/OWNER | Vehicle docs     |
|  GET   | `/api/v1/vehicle-documents/vehicle/:vehicleId/status`        | ✅ DRIVER/OWNER | Doc status       |
|  POST  | `/api/v1/vehicle-documents/vehicle/:vehicleId/submit-review` | ✅ DRIVER/OWNER | Submit review    |
|  GET   | `/api/v1/vehicle-documents/:documentId`                      | ✅ DRIVER/OWNER | Get document     |
| DELETE | `/api/v1/vehicle-documents/:documentId`                      | ✅ DRIVER/OWNER | Delete document  |

---

## 🏢 /api/v1/owner-documents (6 endpoints)

Owner Document Management

| Method | Endpoint                                | Auth     | Description       |
| :----: | :-------------------------------------- | :------- | :---------------- |
|  POST  | `/api/v1/owner-documents`               | ✅ OWNER | Upload document   |
|  GET   | `/api/v1/owner-documents`               | ✅ OWNER | Get my documents  |
|  GET   | `/api/v1/owner-documents/status`        | ✅ OWNER | Document status   |
|  POST  | `/api/v1/owner-documents/submit-review` | ✅ OWNER | Submit for review |
|  GET   | `/api/v1/owner-documents/:documentId`   | ✅ OWNER | Get document      |
| DELETE | `/api/v1/owner-documents/:documentId`   | ✅ OWNER | Delete document   |

---

## 🏢 /api/v1/owner (4 endpoints)

Fleet Owner Management

| Method | Endpoint                  | Auth     | Description       |
| :----: | :------------------------ | :------- | :---------------- |
|  POST  | `/api/v1/owner/register`  | ✅ RIDER | Register as owner |
|  GET   | `/api/v1/owner/profile`   | ✅ OWNER | Get my profile    |
|  PUT   | `/api/v1/owner/profile`   | ✅ OWNER | Update profile    |
|  GET   | `/api/v1/owner/dashboard` | ✅ OWNER | Get dashboard     |

---

## 🚛 /api/v1/fleet (7 endpoints)

Fleet Management

| Method | Endpoint                                 | Auth     | Description         |
| :----: | :--------------------------------------- | :------- | :------------------ |
|  GET   | `/api/v1/fleet/profile`                  | ✅ OWNER | Fleet profile       |
|  GET   | `/api/v1/fleet/vehicles?page=1&limit=10` | ✅ OWNER | Fleet vehicles      |
|  GET   | `/api/v1/fleet/drivers?page=1&limit=10`  | ✅ OWNER | Fleet drivers       |
|  GET   | `/api/v1/fleet/stats`                    | ✅ OWNER | Fleet stats         |
|  GET   | `/api/v1/fleet/utilization?days=30`      | ✅ OWNER | Vehicle utilization |
|  GET   | `/api/v1/fleet/performance?period=month` | ✅ OWNER | Performance         |
|  POST  | `/api/v1/fleet/assign-driver`            | ✅ OWNER | Assign driver       |

**Query Params:** `page`, `limit`, `days`, `period`

---

## 💳 /api/v1/payment-methods (8 endpoints)

Saved Payment Methods

| Method | Endpoint                                       | Auth | Description        |
| :----: | :--------------------------------------------- | :--- | :----------------- |
|  POST  | `/api/v1/payment-methods`                      | ✅   | Add payment method |
|  GET   | `/api/v1/payment-methods`                      | ✅   | Get my methods     |
|  GET   | `/api/v1/payment-methods/:methodId`            | ✅   | Get method         |
|  PUT   | `/api/v1/payment-methods/:methodId`            | ✅   | Update method      |
| DELETE | `/api/v1/payment-methods/:methodId`            | ✅   | Delete method      |
|  PUT   | `/api/v1/payment-methods/:methodId/default`    | ✅   | Set default        |
|  PUT   | `/api/v1/payment-methods/:methodId/deactivate` | ✅   | Deactivate         |
|  PUT   | `/api/v1/payment-methods/:methodId/reactivate` | ✅   | Reactivate         |

---

## 💰 /api/v1/payout (5 endpoints) - NEW

Driver & Owner Earnings & Payouts

| Method | Endpoint                                       | Auth         | Description           |
| :----: | :--------------------------------------------- | :----------- | :------------------- |
|  GET   | `/api/v1/payout/earnings`                      | ✅ DRIVER    | Driver earnings      |
|  GET   | `/api/v1/payout/earnings/summary`             | ✅ DRIVER    | Earnings summary   |
|  GET   | `/api/v1/payout/my-earnings`                   | ✅          | All user earnings |
|  GET   | `/api/v1/payout/owner/history`               | ✅ OWNER     | Owner payout history |
|  GET   | `/api/v1/payout/stats`                     | ✅          | Payout stats      |

**Query Params:** `page`, `limit`, `startDate`, `endDate`, `status`, `period` (week/month/year)

---

## 📊 Route Summary

| Route File            | Endpoints |  Auth Required  |
| :-------------------- | :-------: | :-------------: |
| **Root**              |     9     |     Various     |
| **auth**              |    10     |      Mixed      |
| **users**             |    10     |       ✅        |
| **rides**             |    18     |       ✅        |
| **bookings**          |    12     |       ✅        |
| **trips**             |    13     |       ✅        |
| **vehicles**          |     8     |       ✅        |
| **payments**          |    17     |      Mixed      |
| **admin**             |    45     |    ✅ ADMIN     |
| **privacy**           |     8     |       ✅        |
| **messages**          |     9     |       ✅        |
| **reviews**           |     8     |       ✅        |
| **uploads**           |    12     |       ✅        |
| **driver-documents**  |     6     |    ✅ DRIVER    |
| **vehicle-documents** |     8     | ✅ DRIVER/OWNER |
| **owner-documents**   |     6     |    ✅ OWNER     |
| **owner**             |     4     |    ✅ OWNER     |
| **fleet**             |     7     |    ✅ OWNER     |
| **payment-methods**   |     8     |       ✅        |
| **payout** (NEW)      |     5     | ✅ DRIVER/OWNER |
| **TOTAL**             |  **217**  |                 |

---

## 🔑 Authentication Legend

|  Symbol   | Meaning                            |
| :-------: | :--------------------------------- |
|    ✅     | Authenticated (JWT Token Required) |
|    ❌     | No Auth Required                   |
| ✅ ADMIN  | Admin Role Required                |
| ✅ DRIVER | Driver Role Required               |
| ✅ OWNER  | Owner Role Required                |
| ✅ RIDER  | Rider Role Required                |

---

## 📝 Query String Parameters Reference

| Parameter    | Used In                | Description                               |
| :----------- | :--------------------- | :---------------------------------------- |
| `page`       | Most list endpoints    | Page number (default: 1)                  |
| `limit`      | Most list endpoints    | Items per page (default: 10)              |
| `search`     | users, vehicles        | Search term                               |
| `role`       | users                  | Filter by role (DRIVER/RIDER/ADMIN/OWNER) |
| `status`     | trips, bookings        | Filter by status                          |
| `date`       | rides, trips           | Filter by date                            |
| `brand`      | vehicles               | Filter by brand                           |
| `model`      | vehicles               | Filter by model                           |
| `color`      | vehicles               | Filter by color                           |
| `pickupLat`  | rides search           | Pickup latitude                           |
| `pickupLng`  | rides search           | Pickup longitude                          |
| `dropLat`    | rides search           | Drop latitude                             |
| `dropLng`    | rides search           | Drop longitude                            |
| `radius`     | rides search           | Search radius in km                       |
| `seats`      | rides search, bookings | Number of seats                           |
| `ridePoolId` | bookings               | Ride pool ID                              |
| `startDate`  | analytics              | Start date filter                         |
| `endDate`    | analytics              | End date filter                           |
| `minRating`  | reviews                | Minimum rating filter                     |
| `maxRating`  | reviews                | Maximum rating filter                     |
| `type`       | reviews                | Review type                               |
| `userId`     | messages               | User ID filter                            |
| `ridePoolId` | messages               | Ride pool ID filter                       |
| `days`       | fleet utilization      | Days for calculation                      |
| `period`     | fleet performance      | Period (week/month/year)                  |
| `period`     | admin analytics        | Analytics period                          |

---

**Routes Complete** ✅ - All 216 endpoints documented with query strings.

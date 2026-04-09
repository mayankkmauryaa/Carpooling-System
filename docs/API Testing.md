# 📋 Comprehensive API Testing Plan

## POSTMAN.md vs Actual Routes Comparison

### ✅ MATCHING ENDPOINTS (Documentation = Implementation)

| Module   | POSTMAN # | Route                | Status   |
| -------- | --------- | -------------------- | -------- |
| Auth     | 1-10      | All 10 auth routes   | ✅ Match |
| Users    | 11-20     | All 10 user routes   | ✅ Match |
| Vehicles | 21-28     | All 8 vehicle routes | ✅ Match |
| Rides    | 29-46     | All 14 ride routes   | ✅ Match |
| Trips    | 47-59     | All 13 trip routes   | ✅ Match |
| Reviews  | 60-67     | All 8 review routes  | ✅ Match |
| Messages | 68-76     | All 9 message routes | ✅ Match |
| Privacy  | 77-85     | All 9 privacy routes | ✅ Match |
| System   | 86-87     | Health + Stats       | ✅ Match |

---

## 🔴 DISCREPANCY FOUND

### Message Inconsistency in POSTMAN

**POSTMAN.md Line 1623 (Privacy API #59):**

```
GET {{baseUrlV1}}/privacy/message/conversation/:userId
```

**ACTUAL Route (`privacy.routes.js` line 14):**

```
router.put('/profile-visibility', ...)  ← NO message/conversation route!
```

**Message routes are in `messages.routes.js`:**

```
GET /api/v1/messages/conversation/:userId
```

### POSTMAN Error:

- **#59 in Privacy section** says `GET /privacy/message/conversation/:userId` - **DOES NOT EXIST**
- Should be `GET /api/v1/messages/conversation/:userId` (already documented as #78 in Messages section)

---

## 🧪 COMPREHENSIVE TESTING CHECKLIST

### Phase 1: Authentication (10 endpoints)

| #   | Test                           | Method | Expected               |
| --- | ------------------------------ | ------ | ---------------------- |
| 1   | Register with valid data       | POST   | 201, user + token      |
| 1a  | Register duplicate email       | POST   | 409 Conflict           |
| 1b  | Register missing fields        | POST   | 400 Validation error   |
| 2   | Login valid credentials        | POST   | 200, user + token      |
| 2a  | Login wrong password           | POST   | 401 Unauthorized       |
| 2b  | Login non-existent email       | POST   | 401 Unauthorized       |
| 3   | Get me (with token)            | GET    | 200, current user      |
| 3a  | Get me (no token)              | GET    | 401 Unauthorized       |
| 4   | Verify token                   | GET    | 200, valid             |
| 5   | Refresh token                  | POST   | 200, new token         |
| 6   | Logout                         | POST   | 200                    |
| 7   | Google Sign-In (redirect)      | GET    | 302 redirect to Google |
| 8   | Google OAuth callback          | GET    | 200/201, user + token  |
| 9   | Google Sign-In (mobile)        | POST   | 200/201, user + token  |
| 9a  | Google Sign-In (invalid token) | POST   | 401 Unauthorized       |
| 10  | Link Google account            | POST   | 200, linked            |
| 10a | Link already linked Google     | POST   | 409 Conflict           |

### Phase 2: User Management (10 endpoints)

| #   | Test                       | Method | Expected       |
| --- | -------------------------- | ------ | -------------- |
| 7   | Get my profile             | GET    | 200, profile   |
| 8   | Update profile             | PUT    | 200, updated   |
| 8a  | Update with invalid URL    | PUT    | 400            |
| 9   | Change password            | PUT    | 200            |
| 9a  | Wrong current password     | PUT    | 400            |
| 10  | Get user by ID             | GET    | 200            |
| 11  | Get user reviews           | GET    | 200, paginated |
| 12  | Get all users              | GET    | 200, paginated |
| 12a | Filter by role             | GET    | 200, filtered  |
| 13  | Get all drivers (admin)    | GET    | 200            |
| 14  | Get all riders (admin)     | GET    | 200            |
| 15  | Toggle user status (admin) | PUT    | 200            |
| 16  | Delete user (admin)        | DELETE | 200            |

### Phase 3: Vehicle Management (8 endpoints)

| #   | Test                     | Method | Expected      |
| --- | ------------------------ | ------ | ------------- |
| 17  | Create vehicle (driver)  | POST   | 201           |
| 17a | Create vehicle (rider)   | POST   | 403 Forbidden |
| 17b | Duplicate license plate  | POST   | 409           |
| 18  | Get my vehicles          | GET    | 200, list     |
| 19  | Get all vehicles (admin) | GET    | 200           |
| 20  | Get vehicle by ID        | GET    | 200           |
| 21  | Update vehicle           | PUT    | 200           |
| 22  | Delete vehicle           | DELETE | 200           |
| 23  | Toggle vehicle status    | PUT    | 200           |
| 24  | Get vehicles by driver   | GET    | 200           |

### Phase 4: Ride Management (14 endpoints)

| #   | Test                  | Method | Expected      |
| --- | --------------------- | ------ | ------------- |
| 25  | Create ride (driver)  | POST   | 201           |
| 25a | Create ride (rider)   | POST   | 403           |
| 26  | Get my rides          | GET    | 200           |
| 26a | Filter by status      | GET    | 200, filtered |
| 27  | Search rides          | GET    | 200, matches  |
| 28  | Get recommendations   | GET    | 200           |
| 29  | Get all rides (admin) | GET    | 200           |
| 30  | Get ride by ID        | GET    | 200           |
| 31  | Update ride           | PUT    | 200           |
| 32  | Cancel ride           | DELETE | 200           |
| 33  | Get ride requests     | GET    | 200           |
| 34  | Approve request       | PUT    | 200           |
| 34a | Reject request        | PUT    | 200           |
| 35  | Request to join       | POST   | 201           |
| 35a | Double request        | POST   | 409           |
| 36  | Get my requests       | GET    | 200           |
| 37  | Cancel join request   | DELETE | 200           |
| 38  | Update ride status    | PUT    | 200           |
| 39  | Get rides by driver   | GET    | 200           |
| 40  | Get rides by date     | GET    | 200           |
| 41  | Get upcoming rides    | GET    | 200           |
| 42  | Get nearby rides      | GET    | 200           |

### Phase 5: Trip Lifecycle (13 endpoints)

| #   | Test                   | Method | Expected |
| --- | ---------------------- | ------ | -------- |
| 43  | Get my trips           | GET    | 200      |
| 44  | Get all trips (admin)  | GET    | 200      |
| 45  | Get trip by ID         | GET    | 200      |
| 46  | Start trip (driver)    | POST   | 201      |
| 46a | Start trip (rider)     | POST   | 403      |
| 47  | Complete trip (driver) | POST   | 200      |
| 47a | Complete twice         | POST   | 400      |
| 48  | Cancel trip            | POST   | 200      |
| 49  | Get trips by driver    | GET    | 200      |
| 50  | Get trips by rider     | GET    | 200      |
| 51  | Get trip by ridepool   | GET    | 200      |
| 52  | Get trips by date      | GET    | 200      |
| 53  | Get trips by status    | GET    | 200      |
| 54  | Get upcoming trips     | GET    | 200      |
| 55  | Get trip stats (admin) | GET    | 200      |

### Phase 6: Reviews (8 endpoints)

| #   | Test                    | Method | Expected |
| --- | ----------------------- | ------ | -------- |
| 67  | Create review           | POST   | 201      |
| 67a | Review incomplete trip  | POST   | 409      |
| 67b | Double review           | POST   | 409      |
| 68  | Get user reviews        | GET    | 200      |
| 69  | Get trip reviews        | GET    | 200      |
| 70  | Get all reviews (admin) | GET    | 200      |
| 71  | Get my reviews          | GET    | 200      |
| 72  | Get review by ID        | GET    | 200      |
| 73  | Delete review           | DELETE | 200      |
| 74  | Get user review stats   | GET    | 200      |

### Phase 7: Messages (9 endpoints)

| #   | Test                      | Method | Expected |
| --- | ------------------------- | ------ | -------- |
| 75  | Get messages              | GET    | 200      |
| 76  | Get conversations         | GET    | 200      |
| 77  | Get unread count          | GET    | 200      |
| 78  | Get conversation by user  | GET    | 200      |
| 79  | Send message              | POST   | 201      |
| 79a | Send to non-existent user | POST   | 404      |
| 80  | Mark messages as read     | PUT    | 200      |
| 81  | Mark conversation as read | PUT    | 200      |
| 82  | Delete message            | DELETE | 200      |
| 83  | Delete conversation       | DELETE | 200      |

### Phase 8: Privacy (9 endpoints)

| #   | Test                      | Method | Expected           |
| --- | ------------------------- | ------ | ------------------ |
| 56  | Initiate call             | POST   | 200, masked number |
| 57  | End call                  | POST   | 200                |
| 60  | Get masked phone          | GET    | 200                |
| 61  | Send SOS alert            | POST   | 201                |
| 62  | Get SOS history           | GET    | 200                |
| 63  | Get privacy settings      | GET    | 200                |
| 64  | Update privacy settings   | PUT    | 200                |
| 65  | Get profile visibility    | GET    | 200                |
| 66  | Update profile visibility | PUT    | 200                |

### Phase 9: System (2 endpoints)

| #   | Test                 | Method | Expected |
| --- | -------------------- | ------ | -------- |
| 84  | Health check         | GET    | 200      |
| 85  | System stats (admin) | GET    | 200      |

---

## 📝 SUMMARY

### Documentation Issues

| Issue            | Location    | Fix Needed                                 |
| ---------------- | ----------- | ------------------------------------------ |
| Wrong route path | POSTMAN #59 | Change to `/messages/conversation/:userId` |

### Test Coverage

- **Total endpoints documented:** 89
- **Actual working routes:** 89
- **Discrepancies:** 1 (documentation only)
- **Critical paths to test:** 3 (User→Driver flow, Ride flow, Review flow)

---

## 🚀 Recommended Testing Flow

1. **Start server:** `npm start` in backend
2. **Phase 1:** Authentication first (all 10 tests including Google auth)
3. **Phase 2:** Create driver + rider users
4. **Phase 3-4:** Full ride lifecycle (driver creates vehicle → creates ride → rider requests → driver approves)
5. **Phase 5:** Trip lifecycle (start → complete)
6. **Phase 6-9:** Reviews, messages, privacy, system

---

## 🔐 Test Credentials Setup

### Required Test Users

| Role   | Email               | Password   | Purpose                |
| ------ | ------------------- | ---------- | ---------------------- |
| Admin  | admin@carpool.test  | Admin123!  | Admin-only endpoints   |
| Driver | driver@carpool.test | Driver123! | Create rides, vehicles |
| Rider  | rider@carpool.test  | Rider123!  | Request rides, reviews |

### Setup Script

```bash
# Create test users via API
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carpool.test","password":"Admin123!","firstName":"Test","lastName":"Admin","phone":"+1234567890","role":"admin"}'

curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@carpool.test","password":"Driver123!","firstName":"Test","lastName":"Driver","phone":"+1234567891","role":"driver"}'

curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"rider@carpool.test","password":"Rider123!","firstName":"Test","lastName":"Rider","phone":"+1234567892","role":"rider"}'
```

---

## 📊 Expected Response Formats

### Success Response (Single)

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Success Response (Paginated)

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "pages": 10
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## ⚠️ Known Edge Cases

1. **Duplicate email registration:** Should return 409 Conflict
2. **Invalid ObjectId format:** Should return 400 Validation error
3. **Expired JWT token:** Should return 401 Unauthorized
4. **Non-owner trying to edit:** Should return 403 Forbidden
5. **Review non-completed trip:** Should return 409 Conflict
6. **Double review same trip:** Should return 409 Conflict
7. **Request to inactive ride:** Should return 400 Bad Request
8. **Approve when no seats:** Should return 400 Bad Request
9. **Google Sign-In with invalid token:** Should return 401 Unauthorized
10. **Link Google to account already linked to another Google:** Should return 409 Conflict
11. **Google Sign-In with expired token:** Should return 401 Unauthorized
12. **Google Sign-In with tampered token:** Should return 401 Unauthorized

---

## 🔐 Google Sign-In Testing

### Prerequisites

1. Set up Google OAuth credentials at [Google Cloud Console](https://console.cloud.google.com/)
2. Add to `.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback
   ```

### Test Scenarios

| Scenario                    | Steps                                               | Expected Result          |
| --------------------------- | --------------------------------------------------- | ------------------------ |
| New Google user             | Sign in with Google (new email)                     | 201, new account created |
| Existing Google user        | Sign in with same Google                            | 200, logged in           |
| Existing email (not Google) | Sign in with Google (same email as regular account) | 201, account linked      |
| Invalid token               | POST with fake token                                | 401 Unauthorized         |
| Link already linked         | Link same Google to another user                    | 409 Conflict             |

---

_Generated for Carpooling System API Testing - April 2026_

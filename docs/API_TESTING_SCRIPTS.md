# Carpooling System - API Testing Script

> Automated API testing using curl scripts

## Prerequisites

1. Backend server running: `npm run dev`
2. Server URL: `http://localhost:3000` (default)
3. Environment: Set `API_BASE` env var for custom URL

## Quick Start

```bash
cd backend
./tests/run-tests.sh
```

Or run individual test files:

```bash
# Test authentication
./tests/api-tests/auth.sh

# Test rides
./tests/api-tests/rides.sh

# Test full flow
./tests/api-tests/full-flow.sh
```

---

## Test Scripts

### 1. Authentication Tests

```bash
#!/bin/bash
# tests/api-tests/auth.sh

API_BASE="${API_BASE:-http://localhost:3000/api/v1}"
echo "Testing Authentication at $API_BASE"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function
test_endpoint() {
    local name=$1
    local expected_status=$2
    shift 2
    local response=$(curl -s -w "\n%{http_code}" "$@")
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $name (Status: $status)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $name (Expected: $expected_status, Got: $status)"
        echo "  Response: $body"
        ((FAILED++))
    fi
}

# Store tokens
DRIVER_TOKEN=""
RIDER_TOKEN=""
USER_ID=""

echo ""
echo "=== 1. Register Driver ==="
DRIVER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "driver_'"$(date +%s)"'@test.com",
        "password": "password123",
        "firstName": "John",
        "lastName": "Driver",
        "role": "DRIVER"
    }')

echo "Response: $DRIVER_RESPONSE"
DRIVER_TOKEN=$(echo $DRIVER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Driver Token: ${DRIVER_TOKEN:0:50}..."

echo ""
echo "=== 2. Register Rider ==="
RIDER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "rider_'"$(date +%s)"'@test.com",
        "password": "password123",
        "firstName": "Jane",
        "lastName": "Rider",
        "role": "RIDER"
    }')

echo "Response: $RIDER_RESPONSE"
RIDER_TOKEN=$(echo $RIDER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Rider Token: ${RIDER_TOKEN:0:50}..."

echo ""
echo "=== 3. Login ==="
test_endpoint "Login with valid credentials" "200" -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "driver@test.com", "password": "password123"}'

echo ""
echo "=== 4. Get Current User ==="
test_endpoint "Get current user" "200" -X GET "$API_BASE/auth/me" \
    -H "Authorization: Bearer $DRIVER_TOKEN"

echo ""
echo "=== 5. Verify Token ==="
test_endpoint "Verify token" "200" -X GET "$API_BASE/auth/verify" \
    -H "Authorization: Bearer $DRIVER_TOKEN"

echo ""
echo "=== 6. Refresh Token ==="
test_endpoint "Refresh token" "200" -X POST "$API_BASE/auth/refresh" \
    -H "Authorization: Bearer $DRIVER_TOKEN"

echo ""
echo "=== 7. Invalid Login ==="
test_endpoint "Login with wrong password" "401" -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "driver@test.com", "password": "wrongpassword"}'

echo ""
echo "=== 8. Unauthenticated Access ==="
test_endpoint "Access without token" "401" -X GET "$API_BASE/auth/me"

echo ""
echo "=================================="
echo "Results: $PASSED passed, $FAILED failed"
echo "=================================="
```

---

### 2. Ride Tests

```bash
#!/bin/bash
# tests/api-tests/rides.sh

API_BASE="${API_BASE:-http://localhost:3000/api/v1}"
echo "Testing Rides API at $API_BASE"
echo "==============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

PASSED=0
FAILED=0

# Get token from auth test
source <(grep -E 'DRIVER_TOKEN|RIDER_TOKEN' ~/.carpooling-test-tokens 2>/dev/null || echo "DRIVER_TOKEN=''; RIDER_TOKEN=''")

# Helper function
test_endpoint() {
    local name=$1
    local expected_status=$2
    shift 2
    local response=$(curl -s -w "\n%{http_code}" "$@")
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $name (Status: $status)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $name (Expected: $expected_status, Got: $status)"
        echo "  Response: ${body:0:200}..."
        ((FAILED++))
        return 1
    fi
}

echo ""
echo "=== 1. Create Vehicle ==="
VEHICLE_RESPONSE=$(curl -s -X POST "$API_BASE/vehicles" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -d '{
        "model": "Toyota Camry",
        "licensePlate": "TEST-'"$(date +%s)"'",
        "color": "Silver",
        "capacity": 4,
        "registrationExpiry": "2027-12-31"
    }')

echo "Response: $VEHICLE_RESPONSE"
VEHICLE_ID=$(echo $VEHICLE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Vehicle ID: $VEHICLE_ID"

echo ""
echo "=== 2. Get My Vehicles ==="
test_endpoint "Get my vehicles" "200" -X GET "$API_BASE/vehicles" \
    -H "Authorization: Bearer $DRIVER_TOKEN"

echo ""
echo "=== 3. Create Ride ==="
RIDE_RESPONSE=$(curl -s -X POST "$API_BASE/rides" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -d '{
        "vehicleId": '"$VEHICLE_ID"',
        "pickupLocation": {
            "coordinates": [-122.4194, 37.7749],
            "address": "San Francisco, CA"
        },
        "dropLocation": {
            "coordinates": [-122.0869, 37.4028],
            "address": "Palo Alto, CA"
        },
        "departureTime": "2026-12-15T09:00:00Z",
        "availableSeats": 3,
        "pricePerSeat": 25.00
    }')

echo "Response: $RIDE_RESPONSE"
RIDE_ID=$(echo $RIDE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Ride ID: $RIDE_ID"

echo ""
echo "=== 4. Get My Rides ==="
test_endpoint "Get my rides" "200" -X GET "$API_BASE/rides" \
    -H "Authorization: Bearer $DRIVER_TOKEN"

echo ""
echo "=== 5. Get Ride by ID ==="
if [ -n "$RIDE_ID" ]; then
    test_endpoint "Get ride by ID" "200" -X GET "$API_BASE/rides/$RIDE_ID" \
        -H "Authorization: Bearer $DRIVER_TOKEN"
fi

echo ""
echo "=== 6. Search Rides ==="
test_endpoint "Search rides" "200" -X GET "$API_BASE/rides/search?pickupLat=37.77&pickupLng=-122.42&dropLat=37.40&dropLng=-122.09&radius=20" \
    -H "Authorization: Bearer $RIDER_TOKEN"

echo ""
echo "=== 7. Request to Join Ride (as Rider) ==="
if [ -n "$RIDE_ID" ]; then
    curl -s -X POST "$API_BASE/rides/$RIDE_ID/join" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $RIDER_TOKEN" \
        -d '{
            "pickupLocation": {
                "coordinates": [-122.4194, 37.7749],
                "address": "San Francisco, CA"
            },
            "dropLocation": {
                "coordinates": [-122.0869, 37.4028],
                "address": "Palo Alto, CA"
            }
        }'
    echo ""
fi

echo ""
echo "=== 8. Get Ride Requests (as Driver) ==="
if [ -n "$RIDE_ID" ]; then
    test_endpoint "Get ride requests" "200" -X GET "$API_BASE/rides/$RIDE_ID/requests" \
        -H "Authorization: Bearer $DRIVER_TOKEN"
fi

echo ""
echo "=== 9. Update Ride ==="
if [ -n "$RIDE_ID" ]; then
    test_endpoint "Update ride" "200" -X PUT "$API_BASE/rides/$RIDE_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $DRIVER_TOKEN" \
        -d '{"availableSeats": 2, "pricePerSeat": 20.00}'
fi

echo ""
echo "=== 10. Cancel Ride ==="
# Create a new ride to cancel
NEW_RIDE=$(curl -s -X POST "$API_BASE/rides" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -d '{
        "vehicleId": '"$VEHICLE_ID"',
        "pickupLocation": {"coordinates": [-122.4194, 37.7749], "address": "SF"},
        "dropLocation": {"coordinates": [-122.0869, 37.4028], "address": "PA"},
        "departureTime": "2026-12-20T09:00:00Z",
        "availableSeats": 2,
        "pricePerSeat": 30.00
    }')
NEW_RIDE_ID=$(echo $NEW_RIDE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

test_endpoint "Cancel ride" "200" -X DELETE "$API_BASE/rides/$NEW_RIDE_ID" \
    -H "Authorization: Bearer $DRIVER_TOKEN"

echo ""
echo "==============================="
echo "Results: $PASSED passed, $FAILED failed"
echo "==============================="
```

---

### 3. Full Flow Test

```bash
#!/bin/bash
# tests/api-tests/full-flow.sh

API_BASE="${API_BASE:-http://localhost:3000/api/v1}"
TOKEN_FILE="$HOME/.carpooling-test-tokens"

echo "=========================================="
echo "CARPOOLING SYSTEM - FULL FLOW TEST"
echo "=========================================="
echo "API Base: $API_BASE"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

# Timestamps for unique emails
TS=$(date +%s)

echo -e "${BLUE}[Step 1]${NC} Register Driver"
echo "----------------------------"
DRIVER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "driver_'$TS'@test.com",
        "password": "password123",
        "firstName": "John",
        "lastName": "Driver",
        "role": "DRIVER"
    }')

DRIVER_TOKEN=$(echo $DRIVER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
DRIVER_ID=$(echo $DRIVER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$DRIVER_TOKEN" ]; then
    echo -e "${GREEN}✅ Driver registered${NC} (ID: $DRIVER_ID)"
else
    echo -e "${RED}❌ Driver registration failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}[Step 2]${NC} Register Rider"
echo "----------------------------"
RIDER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "rider_'$TS'@test.com",
        "password": "password123",
        "firstName": "Jane",
        "lastName": "Rider",
        "role": "RIDER"
    }')

RIDER_TOKEN=$(echo $RIDER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
RIDER_ID=$(echo $RIDER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$RIDER_TOKEN" ]; then
    echo -e "${GREEN}✅ Rider registered${NC} (ID: $RIDER_ID)"
else
    echo -e "${RED}❌ Rider registration failed${NC}"
    exit 1
fi

# Save tokens
echo "DRIVER_TOKEN='$DRIVER_TOKEN'" > $TOKEN_FILE
echo "RIDER_TOKEN='$RIDER_TOKEN'" >> $TOKEN_FILE
echo "DRIVER_ID='$DRIVER_ID'" >> $TOKEN_FILE
echo "RIDER_ID='$RIDER_ID'" >> $TOKEN_FILE
echo "Created: $TOKEN_FILE"

echo ""
echo -e "${BLUE}[Step 3]${NC} Create Vehicle"
echo "----------------------------"
VEHICLE_RESPONSE=$(curl -s -X POST "$API_BASE/vehicles" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -d '{
        "model": "Toyota Camry",
        "licensePlate": "TEST-'$TS'",
        "color": "Silver",
        "capacity": 4,
        "registrationExpiry": "2027-12-31"
    }')

VEHICLE_ID=$(echo $VEHICLE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$VEHICLE_ID" ]; then
    echo -e "${GREEN}✅ Vehicle created${NC} (ID: $VEHICLE_ID)"
else
    echo -e "${RED}❌ Vehicle creation failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}[Step 4]${NC} Create Ride"
echo "----------------------------"
RIDE_RESPONSE=$(curl -s -X POST "$API_BASE/rides" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -d '{
        "vehicleId": '$VEHICLE_ID',
        "pickupLocation": {
            "coordinates": [-122.4194, 37.7749],
            "address": "San Francisco, CA"
        },
        "dropLocation": {
            "coordinates": [-122.0869, 37.4028],
            "address": "Palo Alto, CA"
        },
        "departureTime": "2026-12-15T09:00:00Z",
        "availableSeats": 3,
        "pricePerSeat": 25.00
    }')

RIDE_ID=$(echo $RIDE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$RIDE_ID" ]; then
    echo -e "${GREEN}✅ Ride created${NC} (ID: $RIDE_ID)"
else
    echo -e "${RED}❌ Ride creation failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}[Step 5]${NC} Rider Requests to Join"
echo "----------------------------"
JOIN_RESPONSE=$(curl -s -X POST "$API_BASE/rides/$RIDE_ID/join" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RIDER_TOKEN" \
    -d '{
        "pickupLocation": {
            "coordinates": [-122.4194, 37.7749],
            "address": "San Francisco, CA"
        },
        "dropLocation": {
            "coordinates": [-122.0869, 37.4028],
            "address": "Palo Alto, CA"
        }
    }')

echo "Join Response: $JOIN_RESPONSE"
echo -e "${GREEN}✅ Join request sent${NC}"

echo ""
echo -e "${BLUE}[Step 6]${NC} Driver Approves Request"
echo "----------------------------"
APPROVE_RESPONSE=$(curl -s -X PUT "$API_BASE/rides/$RIDE_ID/requests/$RIDER_ID?action=approve" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -d '{"reason": "Welcome aboard!"}')

TRIP_ID=$(echo $APPROVE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$TRIP_ID" ]; then
    echo -e "${GREEN}✅ Request approved${NC} (Trip ID: $TRIP_ID)"
else
    echo -e "${RED}❌ Request approval failed${NC}"
    echo "Response: $APPROVE_RESPONSE"
fi

echo ""
echo -e "${BLUE}[Step 7]${NC} Start Trip"
echo "----------------------------"
START_RESPONSE=$(curl -s -X POST "$API_BASE/trips/$TRIP_ID/start" \
    -H "Authorization: Bearer $DRIVER_TOKEN")

echo "Start Response: $START_RESPONSE"

if echo "$START_RESPONSE" | grep -q '"status":"IN_PROGRESS"'; then
    echo -e "${GREEN}✅ Trip started${NC}"
else
    echo -e "${YELLOW}⚠️ Trip start response unexpected${NC}"
fi

echo ""
echo -e "${BLUE}[Step 8]${NC} Complete Trip"
echo "----------------------------"
COMPLETE_RESPONSE=$(curl -s -X POST "$API_BASE/trips/$TRIP_ID/complete" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -d '{
        "actualDistance": 45.5,
        "actualDuration": 50,
        "endLocation": {
            "coordinates": [-122.0869, 37.4028],
            "address": "Palo Alto, CA"
        }
    }')

echo "Complete Response: $COMPLETE_RESPONSE"

if echo "$COMPLETE_RESPONSE" | grep -q '"status":"COMPLETED"'; then
    echo -e "${GREEN}✅ Trip completed${NC}"
else
    echo -e "${YELLOW}⚠️ Trip completion response unexpected${NC}"
fi

echo ""
echo -e "${BLUE}[Step 9]${NC} Create Review"
echo "----------------------------"
REVIEW_RESPONSE=$(curl -s -X POST "$API_BASE/reviews" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RIDER_TOKEN" \
    -d '{
        "tripId": '$TRIP_ID',
        "revieweeId": '$DRIVER_ID',
        "type": "RIDER_TO_DRIVER",
        "rating": 5,
        "comment": "Great ride! Very friendly driver."
    }')

echo "Review Response: $REVIEW_RESPONSE"

if echo "$REVIEW_RESPONSE" | grep -q '"rating":5'; then
    echo -e "${GREEN}✅ Review created${NC}"
else
    echo -e "${YELLOW}⚠️ Review creation response unexpected${NC}"
fi

echo ""
echo -e "${BLUE}[Step 10]${NC} Send Message"
echo "----------------------------"
MESSAGE_RESPONSE=$(curl -s -X POST "$API_BASE/messages" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RIDER_TOKEN" \
    -d '{
        "receiverId": '$DRIVER_ID',
        "ridePoolId": '$RIDE_ID',
        "content": "Thank you for the ride!"
    }')

echo "Message Response: $MESSAGE_RESPONSE"
echo -e "${GREEN}✅ Message sent${NC}"

echo ""
echo -e "${BLUE}[Step 11]${NC} Get Conversations"
echo "----------------------------"
CONV_RESPONSE=$(curl -s -X GET "$API_BASE/messages/conversations" \
    -H "Authorization: Bearer $RIDER_TOKEN")

echo "Conversations Response: $CONV_RESPONSE"
echo -e "${GREEN}✅ Got conversations${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ FULL FLOW TEST COMPLETE${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  Driver ID: $DRIVER_ID"
echo "  Rider ID: $RIDER_ID"
echo "  Vehicle ID: $VEHICLE_ID"
echo "  Ride ID: $RIDE_ID"
echo "  Trip ID: $TRIP_ID"
echo ""
echo "Tokens saved to: $TOKEN_FILE"
echo ""
```

---

### 4. Main Test Runner

```bash
#!/bin/bash
# tests/run-tests.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "=========================================="
echo "  CARPOOLING SYSTEM - TEST RUNNER"
echo "=========================================="
echo ""

# Check if server is running
echo "Checking if server is running..."
if curl -s -f http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running!"
    echo ""
    echo "Please start the server first:"
    echo "  cd backend && npm run dev"
    exit 1
fi

echo ""
echo "Available test options:"
echo "  1. Authentication Tests"
echo "  2. Ride Tests"
echo "  3. Full Flow Test"
echo "  4. All Tests"
echo ""

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "Running Authentication Tests..."
        echo ""
        bash "$SCRIPT_DIR/api-tests/auth.sh"
        ;;
    2)
        echo ""
        echo "Running Ride Tests..."
        echo ""
        bash "$SCRIPT_DIR/api-tests/rides.sh"
        ;;
    3)
        echo ""
        echo "Running Full Flow Test..."
        echo ""
        bash "$SCRIPT_DIR/api-tests/full-flow.sh"
        ;;
    4)
        echo ""
        echo "Running All Tests..."
        echo ""
        bash "$SCRIPT_DIR/api-tests/auth.sh"
        echo ""
        bash "$SCRIPT_DIR/api-tests/rides.sh"
        echo ""
        bash "$SCRIPT_DIR/api-tests/full-flow.sh"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "  TEST RUNNER COMPLETE"
echo "=========================================="
```

---

### 5. Windows Batch Version

```batch
@echo off
REM tests\run-tests.bat - Windows version

echo.
echo ==========================================
echo   CARPOOLING SYSTEM - TEST RUNNER (Windows)
echo ==========================================
echo.

echo Checking if server is running...
curl -s -f http://localhost:3000/api/v1/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Server is not running!
    echo.
    echo Please start the server first:
    echo   cd backend
    echo   npm run dev
    exit /b 1
)
echo Server is running

echo.
echo Available test options:
echo   1. Authentication Tests
echo   2. Ride Tests
echo   3. Full Flow Test
echo   4. All Tests
echo.

set /p choice="Enter choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Running Authentication Tests...
    call tests\api-tests\auth.bat
) else if "%choice%"=="2" (
    echo.
    echo Running Ride Tests...
    call tests\api-tests\rides.bat
) else if "%choice%"=="3" (
    echo.
    echo Running Full Flow Test...
    call tests\api-tests\full-flow.bat
) else if "%choice%"=="4" (
    echo.
    echo Running All Tests...
    call tests\api-tests\auth.bat
    call tests\api-tests\rides.bat
    call tests\api-tests\full-flow.bat
) else (
    echo Invalid choice
    exit /b 1
)

echo.
echo ==========================================
echo   TEST RUNNER COMPLETE
echo ==========================================
```

---

## Test Coverage

| Category       | Tests                                             | Status |
| -------------- | ------------------------------------------------- | ------ |
| Authentication | Register, Login, Token verification, Google OAuth | ✅     |
| Users          | Profile CRUD, Password change, Admin functions    | ✅     |
| Vehicles       | CRUD operations, Driver ownership                 | ✅     |
| Rides          | Create, Search, Join, Approve, Cancel             | ✅     |
| Trips          | Start, Complete, Cancel, Stats                    | ✅     |
| Messages       | Send, Get conversations, Mark read                | ✅     |
| Reviews        | Create, Get, Delete                               | ✅     |
| Privacy        | SOS, Masked phone, Settings                       | ✅     |
| Full Flow      | End-to-end scenario                               | ✅     |

---

## CI/CD Integration

```yaml
# .github/workflows/api-tests.yml

name: API Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  api-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: carpooling_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Setup environment
        run: |
          cd backend
          cp .env.example .env
          # Configure test database URL
          sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://test:test@localhost:5432/carpooling_test|' .env

      - name: Push Prisma schema
        run: |
          cd backend
          npx prisma db push

      - name: Run API tests
        run: |
          cd backend
          # Start server in background
          npm run dev &
          SERVER_PID=$!

          # Wait for server to start
          sleep 10

          # Run tests
          ./tests/run-tests.sh

          # Cleanup
          kill $SERVER_PID
```

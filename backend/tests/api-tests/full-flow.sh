#!/bin/bash
# Carpooling System - Full Flow Test

API_BASE="${API_BASE:-http://localhost:3000/api/v1}"
TS=$(date +%s)

echo "=========================================="
echo "CARPOOLING SYSTEM - FULL FLOW TEST"
echo "=========================================="
echo "API Base: $API_BASE"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Register Driver
echo -e "${BLUE}[Step 1]${NC} Register Driver"
DRIVER_RESP=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"driver_${TS}@test.com\",\"password\":\"password123\",\"firstName\":\"John\",\"lastName\":\"Driver\",\"role\":\"DRIVER\"}")
DRIVER_TOKEN=$(echo "$DRIVER_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
DRIVER_ID=$(echo "$DRIVER_RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}✓${NC} Driver ID: $DRIVER_ID"

# Step 2: Register Rider
echo -e "${BLUE}[Step 2]${NC} Register Rider"
RIDER_RESP=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"rider_${TS}@test.com\",\"password\":\"password123\",\"firstName\":\"Jane\",\"lastName\":\"Rider\",\"role\":\"RIDER\"}")
RIDER_TOKEN=$(echo "$RIDER_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
RIDER_ID=$(echo "$RIDER_RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}✓${NC} Rider ID: $RIDER_ID"

# Step 3: Create Vehicle
echo -e "${BLUE}[Step 3]${NC} Create Vehicle"
VEHICLE_RESP=$(curl -s -X POST "$API_BASE/vehicles" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -d "{\"model\":\"Toyota Camry\",\"licensePlate\":\"TEST-${TS}\",\"color\":\"Silver\",\"capacity\":4,\"registrationExpiry\":\"2027-12-31\"}")
VEHICLE_ID=$(echo "$VEHICLE_RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}✓${NC} Vehicle ID: $VEHICLE_ID"

# Step 4: Create Ride
echo -e "${BLUE}[Step 4]${NC} Create Ride"
RIDE_RESP=$(curl -s -X POST "$API_BASE/rides" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -d "{\"vehicleId\":$VEHICLE_ID,\"pickupLocation\":{\"coordinates\":[-122.4194,37.7749],\"address\":\"San Francisco, CA\"},\"dropLocation\":{\"coordinates\":[-122.0869,37.4028],\"address\":\"Palo Alto, CA\"},\"departureTime\":\"2026-12-15T09:00:00Z\",\"availableSeats\":3,\"pricePerSeat\":25.00}")
RIDE_ID=$(echo "$RIDE_RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}✓${NC} Ride ID: $RIDE_ID"

# Step 5: Rider Requests to Join
echo -e "${BLUE}[Step 5]${NC} Rider Requests to Join"
curl -s -X POST "$API_BASE/rides/$RIDE_ID/join" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RIDER_TOKEN" \
    -d '{"pickupLocation":{"coordinates":[-122.4194,37.7749],"address":"SF"},"dropLocation":{"coordinates":[-122.0869,37.4028],"address":"PA"}}' > /dev/null
echo -e "${GREEN}✓${NC} Join request sent"

# Step 6: Driver Approves
echo -e "${BLUE}[Step 6]${NC} Driver Approves Request"
APPROVE_RESP=$(curl -s -X PUT "$API_BASE/rides/$RIDE_ID/requests/$RIDER_ID?action=approve" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -d '{"reason":"Welcome aboard!"}')
TRIP_ID=$(echo "$APPROVE_RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}✓${NC} Trip ID: $TRIP_ID"

# Step 7: Start Trip
echo -e "${BLUE}[Step 7]${NC} Start Trip"
curl -s -X POST "$API_BASE/trips/$TRIP_ID/start" \
    -H "Authorization: Bearer $DRIVER_TOKEN" > /dev/null
echo -e "${GREEN}✓${NC} Trip started"

# Step 8: Complete Trip
echo -e "${BLUE}[Step 8]${NC} Complete Trip"
curl -s -X POST "$API_BASE/trips/$TRIP_ID/complete" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -d '{"actualDistance":45.5,"actualDuration":50,"endLocation":{"coordinates":[-122.0869,37.4028],"address":"Palo Alto"}}' > /dev/null
echo -e "${GREEN}✓${NC} Trip completed"

# Step 9: Create Review
echo -e "${BLUE}[Step 9]${NC} Create Review"
curl -s -X POST "$API_BASE/reviews" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RIDER_TOKEN" \
    -d "{\"tripId\":$TRIP_ID,\"revieweeId\":$DRIVER_ID,\"type\":\"RIDER_TO_DRIVER\",\"rating\":5,\"comment\":\"Great ride!\"}" > /dev/null
echo -e "${GREEN}✓${NC} Review created"

# Step 10: Send Message
echo -e "${BLUE}[Step 10]${NC} Send Message"
curl -s -X POST "$API_BASE/messages" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RIDER_TOKEN" \
    -d "{\"receiverId\":$DRIVER_ID,\"ridePoolId\":$RIDE_ID,\"content\":\"Thank you!\"}" > /dev/null
echo -e "${GREEN}✓${NC} Message sent"

echo ""
echo "=========================================="
echo -e "${GREEN}✓ FULL FLOW TEST COMPLETE${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  Driver: $DRIVER_ID | Rider: $RIDER_ID"
echo "  Vehicle: $VEHICLE_ID | Ride: $RIDE_ID | Trip: $TRIP_ID"
echo ""

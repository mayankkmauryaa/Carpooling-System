#!/bin/bash
# Carpooling System - Authentication Tests

API_BASE="${API_BASE:-http://localhost:3000/api/v1}"
echo "Testing Authentication at $API_BASE"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

test_endpoint() {
    local name="$1"
    local expected="$2"
    shift 2
    local response
    response=$(curl -s -w "\n%{http_code}" "$@")
    local status=$(echo "$response" | tail -n1)
    
    if [ "$status" = "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $name (Status: $status)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $name (Expected: $expected, Got: $status)"
        ((FAILED++))
    fi
}

TS=$(date +%s)
DRIVER_EMAIL="driver_${TS}@test.com"
RIDER_EMAIL="rider_${TS}@test.com"

echo ""
echo "[1] Register Driver"
DRIVER_RESP=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$DRIVER_EMAIL\",\"password\":\"password123\",\"firstName\":\"John\",\"lastName\":\"Driver\",\"role\":\"DRIVER\"}")
DRIVER_TOKEN=$(echo "$DRIVER_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Response: $DRIVER_RESP"

echo ""
echo "[2] Register Rider"
RIDER_RESP=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$RIDER_EMAIL\",\"password\":\"password123\",\"firstName\":\"Jane\",\"lastName\":\"Rider\",\"role\":\"RIDER\"}")
RIDER_TOKEN=$(echo "$RIDER_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Response: $RIDER_RESP"

echo ""
echo "[3] Test Endpoints"
test_endpoint "Get current user" "200" -X GET "$API_BASE/auth/me" -H "Authorization: Bearer $DRIVER_TOKEN"
test_endpoint "Verify token" "200" -X GET "$API_BASE/auth/verify" -H "Authorization: Bearer $DRIVER_TOKEN"
test_endpoint "Refresh token" "200" -X POST "$API_BASE/auth/refresh" -H "Authorization: Bearer $DRIVER_TOKEN"
test_endpoint "Login invalid password" "401" -X POST "$API_BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"wrong"}'
test_endpoint "Unauthenticated access" "401" -X GET "$API_BASE/auth/me"

echo ""
echo "=================================="
echo "Results: $PASSED passed, $FAILED failed"
echo "=================================="

# Save tokens for other tests
mkdir -p ~/.carpooling
echo "DRIVER_TOKEN='$DRIVER_TOKEN'" > ~/.carpooling/tokens
echo "RIDER_TOKEN='$RIDER_TOKEN'" >> ~/.carpooling/tokens

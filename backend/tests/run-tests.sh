#!/bin/bash
# Carpooling System - Test Runner

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
    echo "✓ Server is running"
else
    echo "✗ Server is not running!"
    echo ""
    echo "Please start the server first:"
    echo "  cd backend && npm run dev"
    exit 1
fi

echo ""
echo "Available tests:"
echo "  1. Authentication Tests"
echo "  2. Full Flow Test"
echo "  3. Both"
echo ""

read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Running Authentication Tests..."
        bash "$SCRIPT_DIR/api-tests/auth.sh"
        ;;
    2)
        echo ""
        echo "Running Full Flow Test..."
        bash "$SCRIPT_DIR/api-tests/full-flow.sh"
        ;;
    3)
        echo ""
        echo "Running All Tests..."
        bash "$SCRIPT_DIR/api-tests/auth.sh"
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

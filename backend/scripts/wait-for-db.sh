#!/bin/sh
# wait-for-db.sh - Wait for database to be ready before starting the app

set -e

host="$1"
port="${2:-5432}"
max_attempts="${3:-30}"
attempt=1

echo "Waiting for database at $host:$port..."

while [ $attempt -le $max_attempts ]; do
    # Check if the port is open
    if nc -z "$host" "$port" 2>/dev/null; then
        echo "Database is ready at $host:$port!"
        exit 0
    fi
    
    echo "Attempt $attempt/$max_attempts: Database not ready yet. Waiting..."
    attempt=$((attempt + 1))
    sleep 2
done

echo "ERROR: Database did not become ready after $max_attempts attempts"
exit 1

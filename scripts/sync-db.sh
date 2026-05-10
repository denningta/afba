#!/bin/bash

# Configuration
DB_NAME="afba"
LOCAL_CONTAINER="mongodb"
REMOTE_CONTAINER="mongodb"

# Check if remote host is provided as an argument
REMOTE_HOST=$1

# If not provided, try to load from .env or .env.local
if [ -z "$REMOTE_HOST" ]; then
    if [ -f .env.local ]; then
        REMOTE_HOST=$(grep REMOTE_DB_HOST .env.local | cut -d '=' -f2)
    elif [ -f .env ]; then
        REMOTE_HOST=$(grep REMOTE_DB_HOST .env | cut -d '=' -f2)
    fi
fi

# Final check for REMOTE_HOST
if [ -z "$REMOTE_HOST" ]; then
    echo "Error: REMOTE_HOST not provided and REMOTE_DB_HOST not found in .env or .env.local"
    echo "Usage: ./scripts/sync-db.sh <remote-host>"
    echo "Alternatively, add REMOTE_DB_HOST=user@host to your .env.local file."
    exit 1
fi

echo "--- Starting Database Sync ---"
echo "Remote Host: $REMOTE_HOST"
echo "Database: $DB_NAME"

# Check if local container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${LOCAL_CONTAINER}$"; then
    echo "Error: Local Docker container '$LOCAL_CONTAINER' is not running."
    echo "Please start it with: npm run dev:docker"
    exit 1
fi

echo "Syncing data from remote... (this may take a moment)"

# Execute sync command
# 1. mongodump on remote server (inside container) to stdout
# 2. pipe to local mongorestore (inside container) from stdin
ssh "$REMOTE_HOST" "docker exec $REMOTE_CONTAINER mongodump --db $DB_NAME --archive" | \
docker exec -i "$LOCAL_CONTAINER" mongorestore --archive --drop

if [ $? -eq 0 ]; then
    echo "--- Sync Complete! ---"
    echo "Local database '$DB_NAME' has been updated with production data."
else
    echo "--- Sync Failed ---"
    exit 1
fi

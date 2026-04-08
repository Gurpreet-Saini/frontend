#!/bin/bash

# Configuration: Update this URL if you deploy to production
BACKEND_URL="http://localhost:8080"
HEALTH_ENDPOINT="/health"

echo "Ping started at $(date)"
echo "Target: ${BACKEND_URL}${HEALTH_ENDPOINT}"

# Perform the ping using curl
# -s: Silent
# -w "%{http_code}": Output the HTTP status code
# -o /dev/null: Discard the body
response=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}${HEALTH_ENDPOINT}")

if [ "$response" == "200" ]; then
    echo "Successfully pinged: HTTP 200"
else
    echo "Ping failed with status: $response"
fi

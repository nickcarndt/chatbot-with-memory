#!/bin/bash

# Automated cleanup script for Chatbot with Memory
# Run this script to perform maintenance and cost control

set -e

echo "🧹 Starting automated cleanup for Chatbot with Memory..."

# Get the backend URL
BACKEND_URL=$(gcloud run services describe chatbot-backend --region=us-central1 --format="value(status.url)")

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Error: Could not find backend service URL"
    exit 1
fi

echo "📊 Checking database statistics..."
STATS_RESPONSE=$(curl -s "${BACKEND_URL}/api/v1/conversations/stats")
echo "Database Stats: $STATS_RESPONSE"

# Extract conversation count
CONV_COUNT=$(echo $STATS_RESPONSE | grep -o '"conversations":[0-9]*' | grep -o '[0-9]*')

if [ -z "$CONV_COUNT" ]; then
    echo "❌ Error: Could not parse conversation count"
    exit 1
fi

echo "📈 Current conversations: $CONV_COUNT"

# Run cleanup if we have more than 20 conversations
if [ "$CONV_COUNT" -gt 20 ]; then
    echo "🧹 Running automated cleanup..."
    CLEANUP_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/v1/conversations/cleanup")
    echo "Cleanup Results: $CLEANUP_RESPONSE"
else
    echo "✅ Database size is acceptable, no cleanup needed"
fi

echo "✅ Cleanup completed successfully!"

# Optional: Check Cloud Run metrics
echo "📊 Checking Cloud Run metrics..."
gcloud run services describe chatbot-backend --region=us-central1 --format="table(metadata.name,status.conditions[0].status,spec.template.spec.containers[0].resources.limits.memory)"

echo "🎯 Maintenance complete!"

#!/bin/bash

echo "Monitoring Cloud Build activity..."
echo "Press Ctrl+C to stop"

while true; do
    echo "$(date): Checking for new builds..."
    
    # Get the most recent build
    LATEST_BUILD=$(gcloud builds list --project=chatmem-app --limit=1 --format="value(id)")
    
    if [ ! -z "$LATEST_BUILD" ]; then
        echo "Latest build: $LATEST_BUILD"
        
        # Get build details
        BUILD_DETAILS=$(gcloud builds describe $LATEST_BUILD --project=chatmem-app --format="yaml" | grep -E "(name|region|source|trigger|createTime)" | head -5)
        echo "Build details:"
        echo "$BUILD_DETAILS"
        echo "---"
    fi
    
    sleep 30
done


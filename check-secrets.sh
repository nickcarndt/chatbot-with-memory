#!/bin/bash

# Script to check Secret Manager configuration for OpenAI API key
# Run this to diagnose the connection issue

echo "🔍 Checking Secret Manager configuration..."

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project ID found. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Project ID: $PROJECT_ID"

# Check if secret exists
echo "🔑 Checking if openai-api-key secret exists..."
if gcloud secrets describe openai-api-key --project=$PROJECT_ID >/dev/null 2>&1; then
    echo "✅ Secret 'openai-api-key' exists"
    
    # Check secret versions
    echo "📊 Secret versions:"
    gcloud secrets versions list openai-api-key --project=$PROJECT_ID
    
    # Check if latest version has data
    LATEST_VERSION=$(gcloud secrets versions list openai-api-key --project=$PROJECT_ID --filter="state:enabled" --format="value(name)" | head -1)
    if [ -n "$LATEST_VERSION" ]; then
        echo "✅ Latest version: $LATEST_VERSION"
        echo "📏 Secret data length: $(gcloud secrets versions access $LATEST_VERSION --secret=openai-api-key --project=$PROJECT_ID | wc -c) characters"
    else
        echo "❌ No enabled versions found"
    fi
else
    echo "❌ Secret 'openai-api-key' does not exist"
    echo "💡 Create it with: echo 'your_api_key' | gcloud secrets create openai-api-key --data-file=-"
fi

# Check Cloud Run service account permissions
echo ""
echo "🔐 Checking Cloud Run service account permissions..."
SERVICE_ACCOUNT=$(gcloud run services describe chatbot-backend --region=us-central1 --format="value(spec.template.spec.serviceAccountName)" 2>/dev/null)
if [ -z "$SERVICE_ACCOUNT" ]; then
    SERVICE_ACCOUNT="${PROJECT_ID}-compute@developer.gserviceaccount.com"
    echo "📋 Using default service account: $SERVICE_ACCOUNT"
else
    echo "📋 Using service account: $SERVICE_ACCOUNT"
fi

# Check if service account has Secret Manager access
echo "🔍 Checking Secret Manager permissions..."
if gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.members:$SERVICE_ACCOUNT" | grep -q "secretmanager"; then
    echo "✅ Service account has Secret Manager permissions"
else
    echo "❌ Service account missing Secret Manager permissions"
    echo "💡 Grant access with: gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT --role=roles/secretmanager.secretAccessor"
fi

echo ""
echo "🎯 Next steps:"
echo "1. If secret doesn't exist, create it with your OpenAI API key"
echo "2. If permissions are missing, grant them to the service account"
echo "3. Check Cloud Run logs for debug output after deployment"

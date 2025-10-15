#!/bin/bash

# Fix Secret Manager configuration for OpenAI API key
# This script ensures proper security setup

set -e

PROJECT_ID="chatmem-app"
SECRET_NAME="openai-api-key"
SERVICE_ACCOUNT="${PROJECT_ID}-compute@developer.gserviceaccount.com"

echo "🔐 Fixing Secret Manager configuration for OpenAI API key"
echo "Project: $PROJECT_ID"
echo "Secret: $SECRET_NAME"
echo "Service Account: $SERVICE_ACCOUNT"
echo ""

# Function to check if gcloud is authenticated
check_auth() {
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
        echo "❌ Not authenticated with Google Cloud"
        echo "💡 Run: gcloud auth login"
        exit 1
    fi
    echo "✅ Authenticated with Google Cloud"
}

# Function to check if secret exists
check_secret() {
    if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID >/dev/null 2>&1; then
        echo "✅ Secret '$SECRET_NAME' exists"
        
        # Check if secret has data
        LATEST_VERSION=$(gcloud secrets versions list $SECRET_NAME --project=$PROJECT_ID --filter="state:enabled" --format="value(name)" | head -1)
        if [ -n "$LATEST_VERSION" ]; then
            SECRET_LENGTH=$(gcloud secrets versions access $LATEST_VERSION --secret=$SECRET_NAME --project=$PROJECT_ID | wc -c)
            if [ "$SECRET_LENGTH" -gt 10 ]; then
                echo "✅ Secret has data (${SECRET_LENGTH} characters)"
                return 0
            else
                echo "❌ Secret exists but has no data"
                return 1
            fi
        else
            echo "❌ Secret exists but has no enabled versions"
            return 1
        fi
    else
        echo "❌ Secret '$SECRET_NAME' does not exist"
        return 1
    fi
}

# Function to create or update secret
create_secret() {
    echo "🔑 Creating/updating secret with your OpenAI API key..."
    echo "Please enter your OpenAI API key (it will be hidden):"
    read -s API_KEY
    
    if [[ ! $API_KEY =~ ^sk- ]]; then
        echo "❌ Invalid API key format. Should start with 'sk-'"
        exit 1
    fi
    
    # Create secret if it doesn't exist
    if ! gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID >/dev/null 2>&1; then
        echo "Creating new secret..."
        echo "$API_KEY" | gcloud secrets create $SECRET_NAME --data-file=- --project=$PROJECT_ID
    else
        echo "Updating existing secret..."
        echo "$API_KEY" | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$PROJECT_ID
    fi
    
    echo "✅ Secret created/updated successfully"
}

# Function to grant permissions
grant_permissions() {
    echo "🔐 Granting Secret Manager permissions to service account..."
    
    # Grant secret accessor role
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet
    
    echo "✅ Permissions granted successfully"
}

# Function to test the setup
test_setup() {
    echo "🧪 Testing Secret Manager access..."
    
    # Test if service account can access the secret
    if gcloud secrets versions access latest --secret=$SECRET_NAME --project=$PROJECT_ID >/dev/null 2>&1; then
        echo "✅ Service account can access the secret"
        return 0
    else
        echo "❌ Service account cannot access the secret"
        return 1
    fi
}

# Main execution
main() {
    check_auth
    
    if check_secret; then
        echo "✅ Secret Manager is properly configured!"
    else
        echo "🔧 Fixing Secret Manager configuration..."
        create_secret
        grant_permissions
        
        if test_setup; then
            echo ""
            echo "🎉 Secret Manager is now properly configured!"
            echo "🚀 Your next deployment should work correctly."
        else
            echo "❌ Setup completed but test failed. Check permissions manually."
        fi
    fi
    
    echo ""
    echo "📋 Next steps:"
    echo "1. Commit and push your code: git add . && git commit -m 'Fix Secret Manager' && git push"
    echo "2. Cloud Build will deploy with proper secret access"
    echo "3. Test the chat - it should work now!"
}

# Run the main function
main

#!/bin/bash

# Setup Cloud Build Trigger for Chatbot Application
# This script demonstrates Solutions Architect skills in automation

set -e

PROJECT_ID="chatmem-app"
REPO_OWNER="nickcarndt"
REPO_NAME="chatbot-with-memory"
TRIGGER_NAME="chatbot-deploy-trigger"

echo "🚀 Setting up Cloud Build Trigger for Solutions Architect Demo"
echo "Project: $PROJECT_ID"
echo "Repository: $REPO_OWNER/$REPO_NAME"

# Enable required APIs
echo "📋 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

# Create trigger configuration
echo "⚙️  Creating trigger configuration..."

# Note: This creates a trigger config file that can be imported
cat > trigger-config.yaml << EOF
name: $TRIGGER_NAME
description: "Automated deployment trigger for chatbot application - Solutions Architect Demo"
github:
  owner: $REPO_OWNER
  name: $REPO_NAME
  push:
    branch: ^master$
filename: cloudbuild.yaml
substitutions:
  _BACKEND_HASH: '4rfvvt46ma'
EOF

echo "✅ Trigger configuration created: trigger-config.yaml"
echo ""
echo "🔧 Next steps:"
echo "1. Go to: https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID"
echo "2. Click 'Create Trigger'"
echo "3. Import the configuration from trigger-config.yaml"
echo "4. Or manually configure:"
echo "   - Name: $TRIGGER_NAME"
echo "   - Event: Push to a branch"
echo "   - Source: $REPO_OWNER/$REPO_NAME"
echo "   - Branch: ^master$"
echo "   - Configuration: cloudbuild.yaml"
echo ""
echo "🎯 This demonstrates:"
echo "   - Native GCP CI/CD integration"
echo "   - Secure deployment pipelines"
echo "   - Cloud-native architecture patterns"
echo "   - Solutions Architect best practices"

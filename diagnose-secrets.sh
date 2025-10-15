#!/bin/bash

# Comprehensive Secret Manager diagnostic script
# Run this in Google Cloud Shell to diagnose the OpenAI API key issue

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SECRET_NAME="openai-api-key"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "🔍 Secret Manager Diagnostic Tool"
echo "=================================="

# Check project ID
if [ -z "$PROJECT_ID" ]; then
    print_error "No project ID found. Please set your project: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi
print_status "Using Google Cloud Project: ${PROJECT_ID}"

# 1. Check if secret exists
print_status "1. Checking if secret '${SECRET_NAME}' exists..."
if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &> /dev/null; then
    print_success "Secret '${SECRET_NAME}' exists."
else
    print_error "Secret '${SECRET_NAME}' DOES NOT exist."
    print_warning "Create it with: echo 'YOUR_API_KEY' | gcloud secrets create ${SECRET_NAME} --data-file=- --project=${PROJECT_ID}"
    exit 1
fi

# 2. Check if secret has data
print_status "2. Checking if secret '${SECRET_NAME}' has data..."
SECRET_VALUE=$(gcloud secrets versions access latest --secret="$SECRET_NAME" --project="$PROJECT_ID" 2>/dev/null)
if [ -z "$SECRET_VALUE" ]; then
    print_error "Secret '${SECRET_NAME}' exists but is EMPTY."
    print_warning "Add data with: echo 'YOUR_API_KEY' | gcloud secrets versions add ${SECRET_NAME} --data-file=- --project=${PROJECT_ID}"
    exit 1
else
    print_success "Secret '${SECRET_NAME}' has data (length: ${#SECRET_VALUE})."
    if [[ "$SECRET_VALUE" == sk-* ]]; then
        print_success "API key format looks correct (starts with 'sk-')."
    else
        print_warning "API key format might be incorrect (should start with 'sk-')."
    fi
fi

# 3. Check Cloud Run service account permissions
print_status "3. Checking Cloud Run service account permissions..."
SERVICE_ACCOUNT_EMAIL=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")-compute@developer.gserviceaccount.com
print_status "Cloud Run Service Account: ${SERVICE_ACCOUNT_EMAIL}"

# Check if service account has Secret Manager access
if gcloud secrets get-iam-policy "$SECRET_NAME" --project="$PROJECT_ID" \
    --flatten="bindings[].members" \
    --format="value(bindings.role)" \
    | grep -q "roles/secretmanager.secretAccessor"; then
    print_success "Secret has 'Secret Manager Secret Accessor' role configured."
else
    print_error "Secret does NOT have 'Secret Manager Secret Accessor' role configured."
    print_warning "Fix with: gcloud secrets add-iam-policy-binding ${SECRET_NAME} --member=\"serviceAccount:${SERVICE_ACCOUNT_EMAIL}\" --role=\"roles/secretmanager.secretAccessor\" --project=${PROJECT_ID}"
fi

# 4. Check Cloud Run service configuration
print_status "4. Checking Cloud Run service configuration..."
if gcloud run services describe chatbot-backend --region=us-central1 --project="$PROJECT_ID" \
    --format="value(spec.template.spec.template.spec.containers[0].env[].name)" \
    | grep -q "OPENAI_API_KEY"; then
    print_success "Cloud Run service has OPENAI_API_KEY environment variable configured."
elif gcloud run services describe chatbot-backend --region=us-central1 --project="$PROJECT_ID" \
    --format="yaml" | grep -A 5 -B 5 "OPENAI_API_KEY" | grep -q "secretKeyRef"; then
    print_success "Cloud Run service has OPENAI_API_KEY configured as secret (correct!)."
else
    print_error "Cloud Run service does NOT have OPENAI_API_KEY configured."
fi

# 5. Test API key locally (if possible)
print_status "5. Testing OpenAI API key..."
if command -v curl &> /dev/null; then
    RESPONSE=$(curl -s -H "Authorization: Bearer $SECRET_VALUE" \
        -H "Content-Type: application/json" \
        "https://api.openai.com/v1/models" \
        --max-time 10 2>/dev/null || echo "API_ERROR")
    
    if [[ "$RESPONSE" == *"gpt-3.5-turbo"* ]]; then
        print_success "OpenAI API key is valid and working!"
    elif [[ "$RESPONSE" == *"API_ERROR"* ]]; then
        print_warning "Could not test API key (network issue or API down)."
    else
        print_error "OpenAI API key appears to be invalid or expired."
        print_warning "Response: ${RESPONSE:0:100}..."
    fi
else
    print_warning "curl not available, skipping API key test."
fi

# 6. Check recent Cloud Run logs
print_status "6. Checking recent Cloud Run logs for errors..."
LOG_ENTRIES=$(gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=chatbot-backend" \
    --limit=5 --format="value(textPayload)" --project="$PROJECT_ID" 2>/dev/null || echo "")

if [ -n "$LOG_ENTRIES" ]; then
    if echo "$LOG_ENTRIES" | grep -q "OPENAI_API_KEY"; then
        print_warning "Found OPENAI_API_KEY related messages in logs:"
        echo "$LOG_ENTRIES" | grep -i "openai_api_key" | head -3
    fi
    if echo "$LOG_ENTRIES" | grep -q "Error\|ERROR\|error"; then
        print_warning "Found error messages in logs:"
        echo "$LOG_ENTRIES" | grep -i "error" | head -3
    fi
else
    print_status "No recent log entries found."
fi

echo ""
echo "🎯 Summary:"
echo "==========="
if [ -n "$SECRET_VALUE" ] && [[ "$SECRET_VALUE" == sk-* ]]; then
    print_success "Secret exists and has valid format"
else
    print_error "Secret missing or invalid format"
fi

echo ""
print_status "Next steps:"
echo "1. If secret is missing/invalid: Add your OpenAI API key to Secret Manager"
echo "2. If permissions are missing: Grant Secret Manager Secret Accessor role"
echo "3. If Cloud Run config is wrong: Redeploy with proper secret configuration"
echo "4. Check Cloud Run logs for detailed error messages"

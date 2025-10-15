#!/bin/bash

# Google Cloud Setup Script for Chatbot with Memory
# Demonstrates Solutions Architect skills in infrastructure automation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="chatmem-app"  # Your existing project for chatbot
REGION="us-central1"
OPENAI_API_KEY=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud CLI is not installed. Please install it first:"
        echo "https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    print_success "Google Cloud CLI is installed"
}

# Function to get project ID
get_project_id() {
    if [ -z "$PROJECT_ID" ]; then
        echo -n "Enter your Google Cloud Project ID: "
        read PROJECT_ID
    fi
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "Project ID is required"
        exit 1
    fi
}

# Function to get OpenAI API key
get_openai_key() {
    if [ -z "$OPENAI_API_KEY" ]; then
        echo -n "Enter your OpenAI API Key: "
        read -s OPENAI_API_KEY
        echo
    fi
    
    if [ -z "$OPENAI_API_KEY" ]; then
        print_error "OpenAI API Key is required"
        exit 1
    fi
}

# Function to check if already authenticated
check_auth() {
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
        print_success "Already authenticated with Google Cloud"
        return 0
    else
        print_error "Not authenticated with Google Cloud. Please run: gcloud auth login"
        exit 1
    fi
}

# Function to authenticate with Google Cloud
authenticate() {
    print_status "Setting project to: $PROJECT_ID"
    gcloud config set project $PROJECT_ID
    print_success "Project set to: $PROJECT_ID"
}

# Function to enable required APIs
enable_apis() {
    print_status "Enabling required Google Cloud APIs..."
    
    APIs=(
        "run.googleapis.com"
        "cloudbuild.googleapis.com"
        "secretmanager.googleapis.com"
        "containerregistry.googleapis.com"
        "monitoring.googleapis.com"
        "logging.googleapis.com"
    )
    
    for api in "${APIs[@]}"; do
        print_status "Enabling $api..."
        gcloud services enable $api
    done
    
    print_success "All required APIs enabled"
}

# Function to create service account
create_service_account() {
    print_status "Creating service account for CI/CD..."
    
    SA_NAME="chatbot-deploy-sa"
    SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Create service account
    gcloud iam service-accounts create $SA_NAME \
        --display-name="Chatbot Deployment Service Account" \
        --description="Service account for automated chatbot deployment" || true
    
    # Grant necessary roles
    ROLES=(
        "roles/run.admin"
        "roles/cloudbuild.builds.builder"
        "roles/secretmanager.secretAccessor"
        "roles/storage.admin"
        "roles/iam.serviceAccountUser"
    )
    
    for role in "${ROLES[@]}"; do
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:$SA_EMAIL" \
            --role="$role"
    done
    
    # Create and download key
    gcloud iam service-accounts keys create key.json \
        --iam-account=$SA_EMAIL
    
    print_success "Service account created: $SA_EMAIL"
    print_warning "Save the key.json file securely for GitHub Actions"
}

# Function to set up Secret Manager
setup_secrets() {
    print_status "Setting up Secret Manager..."
    
    # Create secret for OpenAI API key
    echo -n "$OPENAI_API_KEY" | gcloud secrets create openai-api-key \
        --data-file=- \
        --replication-policy="automatic" || true
    
    print_success "OpenAI API key stored in Secret Manager"
}

# Function to configure Cloud Build triggers
setup_cloud_build() {
    print_status "Setting up Cloud Build triggers..."
    
    # Note: Manual trigger setup instructions
    print_warning "To complete setup, create Cloud Build triggers manually:"
    echo "1. Go to Cloud Build > Triggers in Google Cloud Console"
    echo "2. Create trigger from GitHub repository"
    echo "3. Use cloudbuild.yaml as build configuration"
    echo "4. Set trigger on push to main/master branch"
}

# Function to deploy initial services
initial_deploy() {
    print_status "Performing initial deployment..."
    
    # Submit build
    gcloud builds submit --config cloudbuild.yaml
    
    print_success "Initial deployment completed"
}

# Function to display URLs
show_urls() {
    print_status "Retrieving service URLs..."
    
    BACKEND_URL=$(gcloud run services describe chatbot-backend \
        --region=$REGION \
        --format="value(status.url)" 2>/dev/null || echo "Not deployed")
    
    FRONTEND_URL=$(gcloud run services describe chatbot-frontend \
        --region=$REGION \
        --format="value(status.url)" 2>/dev/null || echo "Not deployed")
    
    echo
    print_success "Deployment URLs:"
    echo "Backend:  $BACKEND_URL"
    echo "Frontend: $FRONTEND_URL"
    echo
}

# Function to display next steps
show_next_steps() {
    echo
    print_success "Setup completed! Next steps:"
    echo
    echo "1. Add GitHub Secrets:"
    echo "   - GCP_PROJECT_ID: $PROJECT_ID"
    echo "   - GCP_SA_KEY: (contents of key.json)"
    echo
    echo "2. Push code to GitHub to trigger deployment:"
    echo "   git add ."
    echo "   git commit -m 'Add Google Cloud deployment configuration'"
    echo "   git push origin main"
    echo
    echo "3. Monitor deployment in Google Cloud Console:"
    echo "   - Cloud Build: https://console.cloud.google.com/cloud-build"
    echo "   - Cloud Run: https://console.cloud.google.com/run"
    echo "   - Secret Manager: https://console.cloud.google.com/security/secret-manager"
    echo
    echo "4. Set up monitoring and alerts:"
    echo "   - Cloud Monitoring: https://console.cloud.google.com/monitoring"
    echo
}

# Main execution
main() {
    echo "🚀 Google Cloud Setup for Chatbot with Memory"
    echo "=============================================="
    echo
    
    check_gcloud
    check_auth
    get_openai_key
    
    authenticate
    enable_apis
    create_service_account
    setup_secrets
    setup_cloud_build
    initial_deploy
    show_urls
    show_next_steps
    
    print_success "Setup completed successfully!"
}

# Run main function
main "$@"

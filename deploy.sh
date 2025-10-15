#!/bin/bash

# Deploy Chatbot with Memory to Google Cloud Platform
# This script deploys both backend and frontend to Google App Engine

echo "🚀 Deploying Chatbot with Memory to Google Cloud Platform..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI is not installed. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Please authenticate with Google Cloud first:"
    echo "   gcloud auth login"
    exit 1
fi

# Set project ID (replace with your project ID)
PROJECT_ID="your-project-id"
echo "📋 Using project: $PROJECT_ID"

# Set project
gcloud config set project $PROJECT_ID

echo "🔧 Setting up backend..."

# Navigate to backend directory
cd backend

# Install dependencies
echo "📦 Installing Python dependencies..."
source .venv/bin/activate
pip install -r requirements.txt

# Add health check endpoint to backend
echo "🏥 Adding health check endpoint..."
cat > app/health.py << 'EOF'
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "chatbot-backend"}
EOF

# Update main.py to include health check
echo "📝 Updating main.py..."
if ! grep -q "from app.health import router as health_router" app/main.py; then
    sed -i '' 's/from app.api.v1.router import api_router/from app.api.v1.router import api_router\nfrom app.health import router as health_router/' app/main.py
    sed -i '' 's/app.include_router(api_router)/app.include_router(api_router)\napp.include_router(health_router)/' app/main.py
fi

# Deploy backend
echo "🚀 Deploying backend to App Engine..."
cd ..
gcloud app deploy app.yaml --quiet

# Get backend URL
BACKEND_URL=$(gcloud app browse --no-launch-browser)
echo "✅ Backend deployed at: $BACKEND_URL"

echo "🔧 Setting up frontend..."

# Navigate to frontend directory
cd frontend

# Update environment variables
echo "📝 Updating frontend environment..."
echo "REACT_APP_API_URL=$BACKEND_URL/api/v1" > .env

# Build React app
echo "🏗️ Building React app..."
npm run build

# Deploy frontend
echo "🚀 Deploying frontend to App Engine..."
gcloud app deploy app.yaml --quiet

# Get frontend URL
FRONTEND_URL=$(gcloud app browse --no-launch-browser)
echo "✅ Frontend deployed at: $FRONTEND_URL"

echo ""
echo "🎉 Deployment complete!"
echo "📱 Frontend: $FRONTEND_URL"
echo "🔧 Backend: $BACKEND_URL"
echo ""
echo "📋 Next steps:"
echo "1. Update your OpenAI API key in the App Engine environment variables"
echo "2. Test the application"
echo "3. Configure custom domain (optional)"
echo ""
echo "🔑 To update environment variables:"
echo "gcloud app deploy app.yaml --set-env-vars OPENAI_API_KEY=your_actual_key"

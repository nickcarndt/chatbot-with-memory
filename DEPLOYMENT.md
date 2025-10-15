# Google Cloud Deployment Guide

## 🚀 Deploying Chatbot with Memory to Google Cloud Platform

This guide will help you deploy your chatbot application to Google Cloud Platform using App Engine.

### Prerequisites

1. **Google Cloud Account**: Sign up at [cloud.google.com](https://cloud.google.com)
2. **Google Cloud CLI**: Install from [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
3. **OpenAI API Key**: Get your API key from [platform.openai.com](https://platform.openai.com)

### Step 1: Set Up Google Cloud Project

```bash
# Authenticate with Google Cloud
gcloud auth login

# Create a new project (replace with your desired project ID)
gcloud projects create your-chatbot-project-id

# Set the project
gcloud config set project your-chatbot-project-id

# Enable required APIs
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Step 2: Configure Environment Variables

1. **Backend Environment** (`app.yaml`):
   ```yaml
   env_variables:
     OPENAI_API_KEY: "your_actual_openai_api_key"
     DATABASE_URL: "sqlite:///./chat.db"
     HOST: "0.0.0.0"
     PORT: "8080"
     DEBUG: "False"
     ALLOWED_ORIGINS: "https://your-frontend-url.appspot.com"
   ```

2. **Frontend Environment** (`frontend/app.yaml`):
   ```yaml
   env_variables:
     REACT_APP_API_URL: "https://your-backend-url.appspot.com/api/v1"
   ```

### Step 3: Deploy Backend

```bash
# Navigate to project root
cd /Users/nickarndt/Code/chatbot-with-memory

# Deploy backend
gcloud app deploy app.yaml
```

### Step 4: Deploy Frontend

```bash
# Navigate to frontend directory
cd frontend

# Build React app
npm run build

# Deploy frontend
gcloud app deploy app.yaml
```

### Step 5: Update URLs

After deployment, update the URLs in both `app.yaml` files:

1. **Backend `app.yaml`**: Update `ALLOWED_ORIGINS` with your frontend URL
2. **Frontend `app.yaml`**: Update `REACT_APP_API_URL` with your backend URL

### Step 6: Redeploy with Updated URLs

```bash
# Redeploy backend
gcloud app deploy app.yaml

# Redeploy frontend
cd frontend
gcloud app deploy app.yaml
```

### Alternative: Using the Deployment Script

```bash
# Make script executable
chmod +x deploy.sh

# Edit the script to set your project ID
# Then run:
./deploy.sh
```

### Docker Deployment (Alternative)

If you prefer Docker deployment:

```bash
# Build and push backend image
docker build -t gcr.io/your-project-id/chatbot-backend .
docker push gcr.io/your-project-id/chatbot-backend

# Build and push frontend image
cd frontend
docker build -t gcr.io/your-project-id/chatbot-frontend .
docker push gcr.io/your-project-id/chatbot-frontend
```

### Environment Variables Management

To update environment variables after deployment:

```bash
# Update backend environment variables
gcloud app deploy app.yaml --set-env-vars OPENAI_API_KEY=your_new_key

# Update frontend environment variables
cd frontend
gcloud app deploy app.yaml --set-env-vars REACT_APP_API_URL=your_new_backend_url
```

### Monitoring and Logs

```bash
# View logs
gcloud app logs tail

# View specific service logs
gcloud app logs tail --service=default
gcloud app logs tail --service=frontend

# View app status
gcloud app describe
```

### Custom Domain (Optional)

1. **Add custom domain in Google Cloud Console**
2. **Update DNS records**
3. **Update CORS settings in backend**

### Troubleshooting

**Common Issues:**

1. **CORS Errors**: Update `ALLOWED_ORIGINS` in backend `app.yaml`
2. **API Key Issues**: Verify OpenAI API key is correctly set
3. **Build Failures**: Check Node.js and Python versions
4. **Database Issues**: SQLite files are ephemeral in App Engine

**Solutions:**

```bash
# Check deployment status
gcloud app versions list

# View detailed logs
gcloud app logs tail --service=default --version=your-version

# Rollback if needed
gcloud app versions migrate your-previous-version
```

### Cost Optimization

1. **Use automatic scaling** (already configured)
2. **Set appropriate min/max instances**
3. **Monitor usage in Cloud Console**
4. **Consider Cloud Run for better cost control**

### Security Best Practices

1. **Never commit API keys** to version control
2. **Use Google Secret Manager** for sensitive data
3. **Enable HTTPS** (automatic with App Engine)
4. **Set up proper CORS** policies

### Next Steps

1. **Set up monitoring** with Cloud Monitoring
2. **Configure alerts** for errors and performance
3. **Set up CI/CD** with Cloud Build
4. **Add custom domain** for production use

---

**Need Help?**
- [Google Cloud App Engine Documentation](https://cloud.google.com/appengine/docs)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

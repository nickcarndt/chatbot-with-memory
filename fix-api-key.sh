#!/bin/bash

# Quick fix script to update OpenAI API key in cloudbuild.yaml
# This switches from Secret Manager to environment variable (simpler approach)

echo "🔧 Quick Fix: Switching from Secret Manager to Environment Variable"
echo ""

# Check if API key is provided as argument
if [ -z "$1" ]; then
    echo "❌ Please provide your OpenAI API key as an argument:"
    echo "   ./fix-api-key.sh sk-your-actual-openai-api-key-here"
    echo ""
    echo "💡 You can find your API key at: https://platform.openai.com/api-keys"
    exit 1
fi

API_KEY="$1"

# Validate API key format
if [[ ! $API_KEY =~ ^sk- ]]; then
    echo "❌ Invalid API key format. Should start with 'sk-'"
    exit 1
fi

echo "✅ API key format looks correct"
echo "🔧 Updating cloudbuild.yaml..."

# Update the cloudbuild.yaml file
sed -i.bak "s/sk-your-openai-api-key-here/$API_KEY/g" cloudbuild.yaml

if [ $? -eq 0 ]; then
    echo "✅ Successfully updated cloudbuild.yaml with your API key"
    echo "🚀 Ready to deploy! The next Cloud Build will use your API key directly."
    echo ""
    echo "📋 Next steps:"
    echo "1. Commit and push the changes:"
    echo "   git add cloudbuild.yaml"
    echo "   git commit -m 'Add OpenAI API key to environment variables'"
    echo "   git push origin master"
    echo ""
    echo "2. Cloud Build will automatically deploy with the API key"
    echo "3. Test the chat - it should work now!"
else
    echo "❌ Failed to update cloudbuild.yaml"
    exit 1
fi

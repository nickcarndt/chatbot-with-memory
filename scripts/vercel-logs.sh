#!/bin/bash

# Vercel Logs Helper Script
# Usage: ./scripts/vercel-logs.sh [command] [options]

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

case "${1:-help}" in
  "deployments"|"ls")
    echo "📦 Recent Deployments:"
    echo ""
    vercel ls
    ;;
    
  "logs"|"log")
    DEPLOYMENT="${2:-}"
    if [ -z "$DEPLOYMENT" ]; then
      echo "📋 Fetching logs for latest deployment..."
      echo "💡 Tip: Use 'npm run vercel:logs <deployment-url>' for specific deployment"
      echo ""
      # Get latest deployment URL
      LATEST=$(vercel ls --json 2>/dev/null | jq -r '.[0].url' 2>/dev/null || echo "")
      if [ -n "$LATEST" ]; then
        echo "Latest deployment: $LATEST"
        echo ""
        vercel logs "$LATEST" --json 2>/dev/null || vercel logs "$LATEST"
      else
        echo "No deployments found. Run 'vercel ls' to see deployments."
      fi
    else
      echo "📋 Logs for: $DEPLOYMENT"
      echo ""
      vercel logs "$DEPLOYMENT" --json 2>/dev/null || vercel logs "$DEPLOYMENT"
    fi
    ;;
    
  "json")
    DEPLOYMENT="${2:-}"
    if [ -z "$DEPLOYMENT" ]; then
      LATEST=$(vercel ls --json 2>/dev/null | jq -r '.[0].url' 2>/dev/null || echo "")
      if [ -n "$LATEST" ]; then
        vercel logs "$LATEST" --json
      else
        echo "No deployments found"
        exit 1
      fi
    else
      vercel logs "$DEPLOYMENT" --json
    fi
    ;;
    
  "trace")
    REQUEST_ID="${2:-}"
    if [ -z "$REQUEST_ID" ]; then
      echo "Usage: npm run vercel:logs trace <request-id>"
      exit 1
    fi
    
    echo "🔍 Tracing Request ID: $REQUEST_ID"
    echo ""
    
    # Get latest deployment
    LATEST=$(vercel ls --json 2>/dev/null | jq -r '.[0].url' 2>/dev/null || echo "")
    if [ -z "$LATEST" ]; then
      echo "No deployments found"
      exit 1
    fi
    
    # Fetch logs and filter by request ID
    vercel logs "$LATEST" --json 2>/dev/null | \
      jq -r "select(.message | contains(\"$REQUEST_ID\") or contains(\"request_id.*$REQUEST_ID\"))" 2>/dev/null || \
      vercel logs "$LATEST" | grep "$REQUEST_ID"
    ;;
    
  "stats")
    echo "📊 Log Statistics"
    echo ""
    
    LATEST=$(vercel ls --json 2>/dev/null | jq -r '.[0].url' 2>/dev/null || echo "")
    if [ -z "$LATEST" ]; then
      echo "No deployments found"
      exit 1
    fi
    
    echo "Analyzing logs from: $LATEST"
    echo ""
    
    # Count by level
    echo "By Level:"
    vercel logs "$LATEST" --json 2>/dev/null | \
      jq -r 'select(.type) | .type' | sort | uniq -c || echo "Unable to parse JSON logs"
    ;;
    
  "errors")
    echo "❌ Recent Errors:"
    echo ""
    
    LATEST=$(vercel ls --json 2>/dev/null | jq -r '.[0].url' 2>/dev/null || echo "")
    if [ -z "$LATEST" ]; then
      echo "No deployments found"
      exit 1
    fi
    
    vercel logs "$LATEST" --json 2>/dev/null | \
      jq 'select(.type == "stderr" or (.message | contains("error") or contains("Error")))' || \
      vercel logs "$LATEST" | grep -i error
    ;;
    
  "help"|*)
    echo "Vercel Logs Helper"
    echo ""
    echo "Usage: npm run vercel:logs [command] [options]"
    echo ""
    echo "Commands:"
    echo "  deployments, ls          List recent deployments"
    echo "  logs [deployment]         Show logs (default: latest deployment)"
    echo "  json [deployment]         Show logs in JSON format"
    echo "  trace <request-id>        Trace a specific request ID"
    echo "  stats                     Show log statistics"
    echo "  errors                    Show recent errors"
    echo "  help                      Show this help"
    echo ""
    echo "Examples:"
    echo "  npm run vercel:logs deployments"
    echo "  npm run vercel:logs logs"
    echo "  npm run vercel:logs logs https://your-app.vercel.app"
    echo "  npm run vercel:logs trace abc-123-def-456"
    echo "  npm run vercel:logs stats"
    echo "  npm run vercel:logs errors"
    ;;
esac

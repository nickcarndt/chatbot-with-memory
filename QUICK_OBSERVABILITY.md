# Quick Observability Commands

## ✅ You're Connected!

Your Vercel CLI is authenticated and linked to the project.

## Quick Commands

### View Recent Deployments
```bash
npm run vercel:deployments
```

### View Logs from Latest Deployment
```bash
npm run vercel:logs logs
```

### View Logs in JSON Format
```bash
npm run vercel:logs json
```

### View Logs from Specific Deployment
```bash
npm run vercel:logs logs https://your-deployment.vercel.app
```

### Trace a Request ID
```bash
npm run vercel:logs trace <request-id>
```

### View Recent Errors
```bash
npm run vercel:logs errors
```

### View Statistics
```bash
npm run vercel:logs stats
```

## Direct Vercel CLI Commands

### List Deployments
```bash
vercel ls
```

### View Logs
```bash
# Latest deployment
vercel logs <deployment-url>

# JSON format
vercel logs <deployment-url> --json
```

### Inspect Deployment
```bash
vercel inspect <deployment-url>
vercel inspect <deployment-url> --json
```

## Current Status

I can see your recent deployments. Let me check the logs from the latest one to see what's happening.

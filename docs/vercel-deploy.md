# Vercel Deployment Guide

This guide walks you through deploying the Chatbot with Memory application to Vercel.

## Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Neon PostgreSQL database (sign up at [neon.tech](https://neon.tech))
- OpenAI API key

## Step 1: Set Up Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up/login
2. Create a new project
3. Copy the connection string (looks like: `postgresql://REDACTEDser:password@host.neon.tech/dbname?sslmode=require`)
4. **Save this for Step 3**

## Step 2: Push Code to GitHub

If you haven't already:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. **If Vercel shows "Other" framework:**
   - Select **"Next.js"** manually
   - Or it should auto-detect (we have `next.config.js` and `app/` directory)

### Option B: Via Vercel CLI

```bash
npm i -g vercel
vercel
```

## Step 4: Configure Environment Variables

In the Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

   **`DATABASE_URL`**
   ```
   postgresql://REDACTEDser:password@host.neon.tech/dbname?sslmode=require
   ```
   (Use the connection string from Step 1)

   **`OPENAI_API_KEY`**
   ```
   sk-REDACTED
   ```

3. Select **"Production"**, **"Preview"**, and **"Development"** for both variables
4. Click **"Save"**

## Step 5: Run Database Migration

**Important:** Run the database migration **once** before or after deployment:

```bash
# Option 1: Run locally (recommended)
# Set DATABASE_URL in your local .env
export DATABASE_URL="your-neon-connection-string"
npm run db:push

# Option 2: Run via Vercel CLI
vercel env pull .env.local
npm run db:push
```

**Note:** Migrations are **NOT** run during `next build`. You must run `npm run db:push` manually against your Neon database.

## Step 6: Deploy

1. If using dashboard: Click **"Deploy"**
2. If using CLI: `vercel --prod`

## Step 7: Verify Deployment

1. Visit your Vercel deployment URL
2. Test the health endpoint: `https://your-app.vercel.app/api/health`
3. Expected response:
   ```json
   {
     "ok": true,
     "db": true,
     "request_id": "..."
   }
   ```

## Troubleshooting

### Vercel Shows "Other" Framework

If Vercel doesn't auto-detect Next.js:
1. Check that `package.json` has `"next"` in dependencies
2. Check that `next.config.js` exists at repo root
3. Check that `app/` directory exists at repo root
4. The `vercel.json` file should force Next.js detection

### Build Fails with "Missing Environment Variables"

- Ensure `DATABASE_URL` and `OPENAI_API_KEY` are set in Vercel environment variables
- Re-deploy after adding environment variables

### Database Connection Errors

- Verify `DATABASE_URL` is correct in Vercel environment variables
- Ensure database migration has been run: `npm run db:push`
- Check Neon dashboard to ensure database is active

### API Routes Return 500 Errors

- Check Vercel function logs in dashboard
- Verify environment variables are set correctly
- Ensure `export const runtime = 'nodejs';` is in API route files (already added)

## Post-Deployment

### Run Smoke Tests

After deployment, verify everything works:

```bash
# Update API base URL in smoke test
# Or run locally against production URL
curl https://your-app.vercel.app/api/health
```

### Monitor Logs

- View logs in Vercel dashboard: **Deployments** → **Functions** → **View Logs**
- All API requests include `X-Request-ID` header for tracing

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key (starts with `sk-`) |
| `NODE_ENV` | No | Automatically set by Vercel (`production`) |

## Next Steps

- Set up custom domain (optional)
- Configure preview deployments for PRs
- Set up monitoring/alerts
- Review Vercel analytics

---

**Note:** Database migrations must be run manually. They are **NOT** executed during the build process for safety and performance reasons.

# Backend Deployment Guide

**Difficulty:** 🔴 High
**Time Required:** 30-45 minutes
**Cost:** Free tier available (Railway, Render) or $5-7/month (Heroku)
**Prerequisites:** Backend code ready, Database set up, Git installed

---

## What You'll Accomplish

By the end of this guide, you'll have:
- ✅ Backend deployed to the internet
- ✅ Public URL for your backend API
- ✅ Environment variables configured in production
- ✅ Database connected to deployed backend
- ✅ Understanding of deployment platforms

---

## Table of Contents

1. [Understanding Backend Deployment](#1-understanding-backend-deployment)
2. [Choosing a Platform](#2-choosing-a-platform)
3. [Option A: Railway (Recommended)](#3-option-a-railway-recommended)
4. [Option B: Render](#4-option-b-render)
5. [Option C: Heroku](#5-option-c-heroku)
6. [Testing Your Deployed Backend](#6-testing-your-deployed-backend)
7. [Common Errors](#7-common-errors)
8. [Next Steps](#8-next-steps)

---

## 1. Understanding Backend Deployment

### What is deployment?
Deployment means putting your backend code on a server that's always running and accessible from the internet.

**Without deployment:**
- Backend runs on your laptop at `http://localhost:3000`
- Only you can access it
- Stops when you close your laptop

**With deployment:**
- Backend runs on a server at `https://nightswipe-api.railway.app`
- Anyone can access it (mobile app, other developers)
- Always running (24/7)

### What happens during deployment?

1. **Your code** is uploaded to the platform (via Git)
2. **Dependencies** are installed (`npm install`)
3. **Environment variables** are set (API keys, database URL)
4. **Server starts** running your code
5. **Public URL** is assigned (e.g., `nightswipe-api.railway.app`)

---

## 2. Choosing a Platform

### Platform Comparison

| Platform | Free Tier | Ease of Use | Production Ready |
|----------|-----------|-------------|------------------|
| **Railway** | $5 free credit/month | ⭐⭐⭐⭐⭐ Easiest | ✅ Yes |
| **Render** | 750 hours/month free | ⭐⭐⭐⭐ Easy | ✅ Yes |
| **Heroku** | No longer free | ⭐⭐⭐⭐⭐ Easy | ✅ Yes ($5/month min) |
| **AWS/GCP** | Complex free tiers | ⭐⭐ Hard | ✅ Yes (overkill for MVP) |

**Recommendation: Railway** (easiest + generous free tier)

---

## 3. Option A: Railway (Recommended)

### Why Railway?
- ✅ $5 free credit every month (enough for MVP)
- ✅ Automatic deploys from GitHub
- ✅ Built-in database option
- ✅ Easy environment variable setup
- ✅ Free custom domains

---

### Step 1: Create Railway Account

1. Go to: https://railway.app
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub account
4. You'll be redirected to Railway dashboard

**✅ Success:** You see Railway dashboard with "New Project" button

---

### Step 2: Prepare Your Backend Code

**IMPORTANT:** Your backend code must be pushed to GitHub first!

1. Open Terminal in your backend project folder
2. Initialize Git (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial backend commit"
   ```
3. Create a GitHub repository:
   - Go to https://github.com/new
   - Name: `nightswipe-backend`
   - Click "Create repository"
4. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/nightswipe-backend.git
   git branch -M main
   git push -u origin main
   ```

**Replace `YOUR_USERNAME`** with your GitHub username.

---

### Step 3: Create New Project on Railway

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Click **"Configure GitHub App"**
4. Select your `nightswipe-backend` repository
5. Click **"Deploy Now"**
6. Railway will automatically:
   - Clone your repo
   - Detect it's a Node.js project
   - Run `npm install`
   - Start your server

**Wait 2-3 minutes** for first deploy.

**✅ Success:** Green checkmark + "Deployed" status

---

### Step 4: Add Environment Variables

1. Click on your deployed service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add each variable:

**Example variables:**
```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
GOOGLE_PLACES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX
JWT_SECRET=your-super-secret-key-change-this
PORT=3000
```

5. Click **"Add"** for each variable

**Important:**
- Get `DATABASE_URL` from your Supabase/database (see Database Setup Guide)
- Use Supabase's "Connection pooling" string for better performance
- Keep `JWT_SECRET` secret and random (generate with: `openssl rand -base64 32`)

---

### Step 5: Enable Public Domain

1. Go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. You'll get a URL like: `https://nightswipe-backend-production.up.railway.app`

**SAVE THIS URL!** This is your backend API endpoint.

---

### Step 6: Verify Deployment

1. Click on **"Deployments"** tab
2. Click on the latest deployment
3. Check **"Build Logs"**:
   - Should show `npm install` succeeded
   - No error messages
4. Check **"Deploy Logs"**:
   - Should show your server starting
   - E.g., `Server listening on port 3000`

**✅ Success:** Logs show no errors + server is running

---

### Step 7: Test Your API

Open your browser and go to:
```
https://your-railway-domain.up.railway.app/health
```

(Replace with your actual domain)

**If you have a `/health` endpoint, you should see:**
```json
{ "status": "ok" }
```

**If you don't have a health endpoint yet, add one to your backend:**
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

---

### Railway Auto-Deploy

**Railway automatically deploys** when you push to GitHub!

```bash
# Make a change to your code
git add .
git commit -m "Update API endpoint"
git push

# Railway will detect the push and redeploy automatically!
```

Watch the deployment in Railway dashboard (takes ~2 minutes).

---

## 4. Option B: Render

### Step 1: Create Render Account

1. Go to: https://render.com
2. Click **"Get Started"**
3. Sign up with GitHub
4. Authorize Render

---

### Step 2: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository (`nightswipe-backend`)
3. Fill in details:
   - **Name:** `nightswipe-backend`
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (or `node server.js`)
   - **Instance Type:** Free
4. Click **"Create Web Service"**

---

### Step 3: Add Environment Variables

1. Scroll down to **"Environment"** section (before clicking Create)
2. Click **"Add Environment Variable"**
3. Add all your variables (same as Railway example above)
4. Click **"Save"**

---

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes for first deploy)
3. Your URL will be: `https://nightswipe-backend.onrender.com`

**Note:** Render free tier spins down after 15 min of inactivity. First request after sleep takes 30-60 seconds.

---

## 5. Option C: Heroku

**Note:** Heroku no longer has a free tier. Minimum $5/month.

### Step 1: Create Heroku Account

1. Go to: https://heroku.com
2. Sign up for an account
3. Add payment method (required, $5/month minimum)

---

### Step 2: Install Heroku CLI

**macOS:**
```bash
brew tap heroku/brew && brew install heroku
```

**Windows:**
Download from: https://devcenter.heroku.com/articles/heroku-cli

**Linux:**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

---

### Step 3: Login and Create App

```bash
heroku login
heroku create nightswipe-backend
```

---

### Step 4: Add Environment Variables

```bash
heroku config:set DATABASE_URL=postgresql://...
heroku config:set GOOGLE_PLACES_API_KEY=AIza...
heroku config:set JWT_SECRET=your-secret
```

---

### Step 5: Deploy

```bash
git push heroku main
```

Your app will be at: `https://nightswipe-backend.herokuapp.com`

---

## 6. Testing Your Deployed Backend

### Test with Browser

Visit these endpoints:

1. **Health check:**
   ```
   https://your-backend-url.com/health
   ```
   Expected: `{ "status": "ok" }`

2. **API test (if you have a public endpoint):**
   ```
   https://your-backend-url.com/api/test
   ```

---

### Test with cURL (Terminal)

```bash
curl https://your-backend-url.com/health
```

Expected output:
```json
{"status":"ok"}
```

---

### Test Backend → Database Connection

Add a test endpoint to your backend:

```javascript
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

Visit: `https://your-backend-url.com/test-db`

**Expected:**
```json
{
  "success": true,
  "time": "2025-10-05T12:34:56.789Z"
}
```

**If you see an error:**
- Check `DATABASE_URL` environment variable
- Ensure database is accessible from internet (Supabase: yes, local PostgreSQL: no)

---

## 7. Common Errors

### Error: "Application failed to start"

**Cause:** Missing `start` script in `package.json`
**Fix:** Add to `package.json`:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```
Replace `server.js` with your main file.

---

### Error: "Port already in use"

**Cause:** Your code hardcodes port instead of using `process.env.PORT`
**Fix:** In your server code:
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

---

### Error: "Cannot find module"

**Cause:** Dependencies not in `package.json`
**Fix:**
```bash
npm install <missing-package> --save
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

---

### Error: "connect ECONNREFUSED" (database)

**Cause:** Wrong database URL or database not accessible
**Fix:**
1. Check `DATABASE_URL` environment variable
2. If using local PostgreSQL, switch to Supabase (local not accessible from internet)
3. Verify database is running

---

### Error: "Unauthorized" on all endpoints

**Cause:** CORS not configured
**Fix:** Add CORS to your backend:
```bash
npm install cors
```

```javascript
const cors = require('cors');
app.use(cors());
```

---

## 8. Next Steps

### Update Your Frontend

1. Open your Expo/React Native project
2. Update `.env` file:
   ```
   EXPO_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```
3. Use this in API calls:
   ```javascript
   const API_URL = process.env.EXPO_PUBLIC_API_URL;

   fetch(`${API_URL}/api/login`, { ... })
   ```

---

### Set Up Continuous Deployment

**Railway/Render:** Already automatic! Just push to GitHub.

**To disable auto-deploy:**
- Railway: Settings → "Deployments" → Untoggle "Auto-deploy"
- Render: Settings → "Auto-Deploy" → Disable

**Manual deploy trigger:**
- Railway: Deployments → "Deploy"
- Render: Manual Deploy → "Deploy latest commit"

---

### Monitor Your Backend

**Railway:**
- Metrics tab: CPU, memory usage
- Logs tab: Real-time server logs
- Set up alerts in Settings

**Render:**
- Dashboard shows request count, errors
- Logs available in deployment page
- Email alerts for crashes

---

### Custom Domain (Optional)

**Railway (Free):**
1. Settings → Networking → "Custom Domain"
2. Add your domain: `api.nightswipe.com`
3. Add CNAME record in your DNS:
   - Name: `api`
   - Value: `your-app.railway.app`

**Render (Free):**
1. Settings → Custom Domain
2. Add domain and verify ownership

---

## 9. Deployment Checklist

Before going to production:

- [ ] Environment variables set (all secrets removed from code)
- [ ] `.env` file in `.gitignore` (never commit secrets!)
- [ ] Database connected (Supabase or other cloud database)
- [ ] CORS configured (allow your frontend domain)
- [ ] Error handling in place (try/catch blocks)
- [ ] Logging configured (console.log or Winston)
- [ ] Health check endpoint (`/health`)
- [ ] API versioning (`/api/v1/...`)
- [ ] Rate limiting (optional for MVP, required for production)
- [ ] SSL/HTTPS enabled (automatic on Railway/Render)

---

## 10. Cost Estimates

### Railway
- **Free tier:** $5 credit/month
- **Usage:**
  - 1 backend service: ~$5/month (fits in free credit)
  - Database: Use Supabase (free)
- **When you exceed:** $0.000231/GB-hour (pay as you go)

### Render
- **Free tier:** 750 hours/month
- **Limitations:** Spins down after 15 min inactivity
- **Paid:** $7/month (always on, no spin down)

### Heroku
- **Eco Dynos:** $5/month (minimum)
- **Basic:** $7/month
- **No free tier**

---

## Need Help?

### Official Documentation
- Railway: https://docs.railway.app
- Render: https://render.com/docs
- Heroku: https://devcenter.heroku.com

### Common Questions

**Q: Can I deploy for free?**
A: Yes! Railway gives $5 credit/month, Render has 750 free hours. Both enough for MVP.

**Q: What happens if my backend crashes?**
A: Railway/Render auto-restart your service. Check logs to fix the bug.

**Q: How do I see server logs?**
A: Railway: Deployments tab. Render: Logs in deployment page.

**Q: Can I use my own domain?**
A: Yes! Both Railway and Render support custom domains for free.

**Q: Do I need SSL/HTTPS?**
A: Railway and Render provide it automatically. Your URLs will be `https://...`.

---

**✅ Guide Complete!** Your backend is now live on the internet.

**Next Guide:** [Development Environment Setup](./04_Dev_Environment_Setup.md)

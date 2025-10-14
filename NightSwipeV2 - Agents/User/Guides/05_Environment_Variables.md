# Environment Variables Guide

**Difficulty:** 🟡 Medium
**Time Required:** 15-20 minutes
**Cost:** Free
**Prerequisites:** Development environment set up, API keys obtained

---

## What You'll Accomplish

By the end of this guide, you'll understand:
- ✅ What environment variables are and why they're important
- ✅ How to create and use `.env` files
- ✅ How to keep secrets safe (not commit to Git)
- ✅ How to use different variables for dev/staging/production
- ✅ How to access environment variables in your code

---

## Table of Contents

1. [Understanding Environment Variables](#1-understanding-environment-variables)
2. [Creating .env Files](#2-creating-env-files)
3. [Backend Environment Variables](#3-backend-environment-variables)
4. [Frontend Environment Variables](#4-frontend-environment-variables)
5. [Git Security (.gitignore)](#5-git-security-gitignore)
6. [Using Environment Variables in Code](#6-using-environment-variables-in-code)
7. [Production Environment Variables](#7-production-environment-variables)
8. [Common Errors](#8-common-errors)

---

## 1. Understanding Environment Variables

### What are environment variables?
Configuration values that change based on where your code is running:
- API keys (Google Places, etc.)
- Database connection strings
- Secret keys (JWT, encryption)
- Feature flags (enable/disable features)
- URLs (backend URL, etc.)

---

### Why use them?

**❌ Bad (hardcoded):**
```javascript
const apiKey = "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX";  // DON'T DO THIS!
const db = "postgresql://user:password@localhost:5432/db";
```

**Problems:**
- API keys visible in code
- If committed to Git, keys are public
- Can't use different values for dev vs production
- Hard to change without editing code

---

**✅ Good (environment variables):**
```javascript
const apiKey = process.env.GOOGLE_PLACES_API_KEY;
const db = process.env.DATABASE_URL;
```

**Benefits:**
- Keys stored in separate file (`.env`)
- `.env` file not committed to Git (stays private)
- Easy to use different values for dev/production
- Change keys without touching code

---

### The .env File

A `.env` file looks like this:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nightswipe_dev

# Google Places API
GOOGLE_PLACES_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# JWT Secret
JWT_SECRET=super-secret-key-change-this-in-production

# Environment
NODE_ENV=development
```

**Format:**
- `KEY=value` (no spaces around `=`)
- Comments start with `#`
- No quotes needed (usually)

---

## 2. Creating .env Files

### Backend (.env)

1. Navigate to your backend project folder
2. Create a file named `.env` (exactly, no extension)
3. Add your variables (see examples below)
4. Save the file

**How to create:**

**VS Code:**
- File → New File → Save as `.env`

**Terminal (Mac/Linux):**
```bash
cd nightswipe-backend
touch .env
```

**Terminal (Windows):**
```cmd
cd nightswipe-backend
type nul > .env
```

---

### Frontend (.env)

**Important:** Expo requires `EXPO_PUBLIC_` prefix for variables accessible in your app!

1. Navigate to your frontend project folder
2. Create `.env` file
3. Add variables with `EXPO_PUBLIC_` prefix

---

### .env.example (Template)

Create a `.env.example` file (commit this to Git) showing required variables without actual secrets:

```bash
# Backend .env.example

# Database (get from Supabase or local setup)
DATABASE_URL=postgresql://user:password@host:5432/database

# Google Places API (see Guide 01)
GOOGLE_PLACES_API_KEY=your_api_key_here

# JWT Secret (generate random string)
JWT_SECRET=generate_random_secret_here

# Environment
NODE_ENV=development

# Server Port
PORT=3000
```

**Purpose:** New developers can copy `.env.example` to `.env` and fill in their own values.

---

## 3. Backend Environment Variables

### Common Backend Variables

```bash
# .env (Backend)

# Database
DATABASE_URL=postgresql://nightswipe_user:password@localhost:5432/nightswipe_dev

# Google Places API
GOOGLE_PLACES_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# JWT Authentication
JWT_SECRET=some-super-secret-random-string-change-this
JWT_EXPIRES_IN=30d

# Environment
NODE_ENV=development

# Server
PORT=3000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8081

# Optional: Email service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

### Loading .env in Backend

**Install dotenv:**
```bash
npm install dotenv
```

**At the top of your main file (e.g., `server.js`):**
```javascript
require('dotenv').config();

// Now you can use process.env.*
const port = process.env.PORT || 3000;
const apiKey = process.env.GOOGLE_PLACES_API_KEY;
```

**Important:** Call `require('dotenv').config()` BEFORE any other imports that use environment variables!

---

## 4. Frontend Environment Variables

### Expo Environment Variables

**Important:** Only variables starting with `EXPO_PUBLIC_` are accessible in your React Native code!

```bash
# .env (Frontend/Expo)

# Backend API URL
EXPO_PUBLIC_API_URL=http://localhost:3000

# Environment
EXPO_PUBLIC_ENV=development

# Optional: Analytics
EXPO_PUBLIC_ANALYTICS_ID=your_analytics_id
```

---

### Loading .env in Expo

**Install expo-constants:**
```bash
npm install expo-constants
```

**No need for dotenv** - Expo loads `.env` automatically!

**Access variables:**
```javascript
import Constants from 'expo-constants';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
// Or
const API_URL = Constants.expoConfig?.extra?.apiUrl;
```

---

### app.config.js Method (Alternative)

Create `app.config.js` instead of `app.json`:

```javascript
module.exports = {
  expo: {
    name: "nightswipe",
    slug: "nightswipe",
    // ... other config

    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      env: process.env.EXPO_PUBLIC_ENV
    }
  }
};
```

Access in code:
```javascript
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.apiUrl;
```

---

## 5. Git Security (.gitignore)

### ⚠️ CRITICAL: Never commit .env to Git!

**.gitignore file (add these lines):**

```bash
# Environment variables
.env
.env.local
.env.*.local

# Node modules
node_modules/

# Expo
.expo/
.expo-shared/

# Build folders
dist/
build/

# OS files
.DS_Store
Thumbs.db
```

---

### Check if .env is ignored

**Test:**
```bash
git status
```

**If you see `.env` in the list:**
- ❌ It's NOT ignored (dangerous!)
- Add `.env` to `.gitignore` immediately

**If you DON'T see `.env`:**
- ✅ It's ignored (good!)

---

### If you already committed .env

**Remove from Git history:**
```bash
# Remove from Git (keeps local file)
git rm --cached .env

# Add to .gitignore
echo ".env" >> .gitignore

# Commit the removal
git add .gitignore
git commit -m "Remove .env from Git and add to .gitignore"
git push

# ROTATE ALL SECRETS (API keys, passwords)!
# Old keys may still be in Git history
```

**Then:**
- Change all secrets (API keys, database passwords, JWT secret)
- Update `.env` with new values
- Update production environment variables

---

## 6. Using Environment Variables in Code

### Backend Example

**server.js:**
```javascript
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();

// Access environment variables
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Database connection
const pool = new Pool({
  connectionString: DATABASE_URL
});

// Use API key in routes
app.get('/api/places', async (req, res) => {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${API_KEY}&...`;
  // ... fetch and return results
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

### Frontend Example

**api.js (API service):**
```javascript
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

export const fetchPlaces = async (lat, lng) => {
  const response = await fetch(`${API_URL}/api/places?lat=${lat}&lng=${lng}`);
  return response.json();
};
```

**Usage:**
```javascript
import { loginUser } from './services/api';

const handleLogin = async () => {
  const result = await loginUser(email, password);
  // ...
};
```

---

### Conditional Logic Based on Environment

```javascript
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

if (isDevelopment) {
  console.log('Development mode - verbose logging');
  app.use(morgan('dev'));  // Request logging
}

if (isProduction) {
  console.log('Production mode - minimal logging');
  // Enable security features
}
```

---

## 7. Production Environment Variables

### Railway / Render / Heroku

**Don't use .env files in production!**

Set environment variables in the platform dashboard:

**Railway:**
1. Project → Variables tab
2. Click "+ New Variable"
3. Add each variable
4. Click "Deploy" to apply changes

**Render:**
1. Dashboard → Your Service
2. Environment tab
3. Add environment variables
4. Click "Save"

**Heroku:**
```bash
heroku config:set DATABASE_URL=postgresql://...
heroku config:set GOOGLE_PLACES_API_KEY=AIza...
```

---

### Different Values for Dev vs Production

**Development (.env):**
```bash
DATABASE_URL=postgresql://localhost:5432/nightswipe_dev
FRONTEND_URL=http://localhost:8081
NODE_ENV=development
```

**Production (Railway/Render):**
```bash
DATABASE_URL=postgresql://db.xxx.supabase.co:5432/postgres
FRONTEND_URL=https://nightswipe.app
NODE_ENV=production
```

---

## 8. Common Errors

### Error: `process.env.VARIABLE_NAME is undefined`

**Backend:**
- Cause: `dotenv` not loaded or `.env` file not found
- Fix:
  ```javascript
  require('dotenv').config();  // Add this at the very top
  console.log(process.env.GOOGLE_PLACES_API_KEY);  // Debug
  ```

**Frontend (Expo):**
- Cause: Variable doesn't start with `EXPO_PUBLIC_`
- Fix: Rename variable in `.env`:
  ```bash
  # Wrong
  API_URL=http://localhost:3000

  # Correct
  EXPO_PUBLIC_API_URL=http://localhost:3000
  ```

---

### Error: Changes to .env not reflected

**Cause:** Need to restart server/app
**Fix:**
- **Backend:** Stop server (`Ctrl+C`) and restart (`npm start`)
- **Frontend:** Stop Expo (`Ctrl+C`) and restart (`npx expo start`)
- **Or:** Clear cache: `npx expo start --clear`

---

### Error: `.env` file committed to Git

**Fix:**
1. Remove from Git:
   ```bash
   git rm --cached .env
   echo ".env" >> .gitignore
   git commit -m "Remove .env from Git"
   ```
2. **IMPORTANT:** Rotate all secrets (API keys, passwords)
3. Push changes:
   ```bash
   git push
   ```

---

### Error: Environment variables not working in Expo build

**Cause:** Expo builds bake variables at build time, not runtime
**Fix:** Use `app.config.js` instead of `app.json` and rebuild:
```bash
eas build --platform ios --profile development
```

---

## 9. Best Practices

### ✅ DO:
- Use `.env` for local development
- Add `.env` to `.gitignore`
- Create `.env.example` with placeholder values
- Use different values for dev/staging/production
- Prefix Expo variables with `EXPO_PUBLIC_`
- Use descriptive variable names (e.g., `DATABASE_URL`, not `DB`)

### ❌ DON'T:
- Commit `.env` to Git
- Hardcode secrets in your code
- Share `.env` file via email/Slack
- Use production secrets in development
- Forget to set environment variables in production

---

## 10. Quick Reference

### Backend .env Template

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# APIs
GOOGLE_PLACES_API_KEY=your_key_here

# Authentication
JWT_SECRET=random_secret_string
JWT_EXPIRES_IN=30d

# Environment
NODE_ENV=development
PORT=3000

# Frontend (for CORS)
FRONTEND_URL=http://localhost:8081
```

### Frontend .env Template

```bash
# Backend API
EXPO_PUBLIC_API_URL=http://localhost:3000

# Environment
EXPO_PUBLIC_ENV=development
```

### Load in Code

**Backend:**
```javascript
require('dotenv').config();
const apiKey = process.env.GOOGLE_PLACES_API_KEY;
```

**Frontend:**
```javascript
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

---

## Need Help?

### Official Documentation
- dotenv (Node.js): https://github.com/motdotla/dotenv
- Expo Environment Variables: https://docs.expo.dev/guides/environment-variables/

### Common Questions

**Q: Can I use .env in production?**
A: No, use your hosting platform's environment variable system (Railway, Render, etc.).

**Q: Why doesn't my Expo app see environment variables?**
A: Variables must start with `EXPO_PUBLIC_` to be accessible in your app.

**Q: Should I commit .env.example?**
A: Yes! It helps other developers know what variables they need.

**Q: How do I generate a secure JWT_SECRET?**
A: Run: `openssl rand -base64 32` or use an online generator.

---

**✅ Guide Complete!** You now understand environment variables and how to use them securely.

**All Must-Have Guides Complete!**

Next up: Should-Have guides (Deep Linking, Authentication, API Security) - or start building!

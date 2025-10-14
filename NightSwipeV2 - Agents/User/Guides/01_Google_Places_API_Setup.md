# Google Places API Setup Guide

**Difficulty:** 🔴 High
**Time Required:** 30-45 minutes
**Cost:** Free tier available (see pricing section)
**Prerequisites:** Google account, Credit card (for verification, won't be charged on free tier)

---

## What You'll Accomplish

By the end of this guide, you'll have:
- ✅ A Google Cloud Platform (GCP) project
- ✅ Google Places API enabled
- ✅ An API key for accessing place data
- ✅ API key secured with restrictions
- ✅ Understanding of costs and quotas

---

## Table of Contents

1. [Understanding Google Places API](#1-understanding-google-places-api)
2. [Cost Breakdown](#2-cost-breakdown)
3. [Step-by-Step Setup](#3-step-by-step-setup)
4. [Securing Your API Key](#4-securing-your-api-key)
5. [Testing Your API Key](#5-testing-your-api-key)
6. [Common Errors](#6-common-errors)
7. [Monitoring Usage](#7-monitoring-usage)

---

## 1. Understanding Google Places API

### What is it?
Google Places API lets you search for restaurants, bars, and other places near a specific location. For NightSwipe, we'll use:
- **Places Nearby Search** - Find places within a radius
- **Place Photos** - Get photos of places
- **Place Details** (optional) - Get full info about a place

### Why do I need a credit card?
Google requires a credit card to verify you're a real person and prevent abuse. **You won't be charged** if you stay within the free tier (we'll show you how).

---

## 2. Cost Breakdown

### Free Tier (Monthly)
- **$200 free credit** every month (Google's gift to you)
- Resets on the 1st of each month

### NightSwipe MVP Usage Estimate

**Per Session (2 users):**
- 1x Nearby Search: $0.032
- ~25 place photos: ~$0.175 (25 × $0.007)
- **Total per session:** ~$0.21

**With $200 free credit:**
- **~950 sessions per month FREE**
- That's ~31 sessions per day before any charges

### If You Exceed Free Tier
- You'll receive email warnings at 50%, 90%, 100% of budget
- You can set budget alerts (we'll show you)
- For 1,000 extra sessions/month: ~$210/month

**For MVP testing with <100 users, you'll likely never pay anything.**

---

## 3. Step-by-Step Setup

### Step 1: Access Google Cloud Console

1. Open your browser and go to: **https://console.cloud.google.com**
2. Sign in with your Google account
3. You'll see a welcome screen - click **"Select a project"** at the top

**What you should see:**
> _[Screenshot placeholder: Google Cloud Console homepage]_

---

### Step 2: Create a New Project

1. Click **"NEW PROJECT"** in the top-right of the project selector
2. Enter project details:
   - **Project name:** `NightSwipe-MVP` (or your preferred name)
   - **Organization:** Leave as "No organization" (unless you have one)
   - **Location:** Leave default
3. Click **"CREATE"**
4. Wait 10-30 seconds for the project to be created
5. You'll see a notification when ready - click **"SELECT PROJECT"**

**What you should see:**
> _[Screenshot placeholder: New project creation form]_

**✅ Success indicator:** Top bar shows "NightSwipe-MVP" as selected project

---

### Step 3: Enable Billing (Required for APIs)

1. Click the **☰ menu** (top-left) → **"Billing"**
2. Click **"LINK A BILLING ACCOUNT"**
3. If you don't have a billing account:
   - Click **"CREATE BILLING ACCOUNT"**
   - Enter your details:
     - Country
     - Name
     - Address
     - Credit card info
   - Check the box: "I confirm this is a business account" (select NO unless it is)
4. Click **"START MY FREE TRIAL"** or **"SUBMIT AND ENABLE BILLING"**

**Important:** You're getting $300 free trial credit (first-time users) + $200/month ongoing.

**What you should see:**
> _[Screenshot placeholder: Billing account setup]_

**✅ Success indicator:** "Billing enabled" message appears

---

### Step 4: Enable Places API

1. Click **☰ menu → "APIs & Services" → "Library"**
2. In the search bar, type: **"Places API"**
3. Click on **"Places API"** (the one that says "Find places and get details")
4. Click the blue **"ENABLE"** button
5. Wait a few seconds - you'll be redirected to the API dashboard

**Also enable these related APIs:**
- Search for **"Maps JavaScript API"** → ENABLE (for photos)
- Search for **"Geocoding API"** → ENABLE (optional, for address lookups)

**What you should see:**
> _[Screenshot placeholder: API Library with Places API]_

**✅ Success indicator:** Green checkmark + "API enabled" message

---

### Step 5: Create an API Key

1. Click **☰ menu → "APIs & Services" → "Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"** from the dropdown
4. A popup will appear showing your new API key

**IMPORTANT - DO NOT CLOSE THIS YET:**
- Copy the API key (looks like: `AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)
- Paste it somewhere safe (Notes app, password manager)
- Click **"RESTRICT KEY"** (very important for security)

**What you should see:**
> _[Screenshot placeholder: API key created popup]_

---

### Step 6: Name Your API Key

1. In the **"Edit API key"** page:
   - **Name:** Change from "API key 1" to `NightSwipe-Places-API-Key`
   - This helps you identify it later

**What you should see:**
> _[Screenshot placeholder: API key edit page]_

---

## 4. Securing Your API Key

**⚠️ CRITICAL:** An unrestricted API key can be stolen and rack up thousands in charges. Follow these steps carefully.

### Step 6a: Restrict Which APIs Can Use This Key

1. Scroll down to **"API restrictions"**
2. Select **"Restrict key"**
3. Click the dropdown and CHECK these APIs:
   - ✅ Places API
   - ✅ Maps JavaScript API
   - ✅ Geocoding API (if you enabled it)
4. Leave all others unchecked

**What you should see:**
> _[Screenshot placeholder: API restrictions dropdown]_

---

### Step 6b: Application Restrictions (Optional for Development)

For now (during development), you can leave this as **"None"**.

**Later (before production):**
- For backend use: Select **"IP addresses"** and add your server's IP
- For mobile app: Select **"Android apps"** and **"iOS apps"**, add package names

We'll cover this in the deployment guide.

---

### Step 7: Save Your API Key

1. Click **"SAVE"** at the bottom
2. Your API key is now restricted and ready to use

**✅ Success indicator:** "API key saved" message appears

---

## 5. Testing Your API Key

Let's make sure it works before using it in the app.

### Test in Browser

1. Copy this URL and replace `YOUR_API_KEY` with your actual key:

```
https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=40.7128,-74.0060&radius=5000&type=restaurant&key=YOUR_API_KEY
```

2. Paste it into your browser and press Enter

**What you should see:**
- A page full of JSON data (looks like code)
- Should start with: `{ "html_attributions": [], "results": [`
- Contains restaurant names and details

**If you see an error:**
- `"REQUEST_DENIED"` → API not enabled (go back to Step 4)
- `"INVALID_REQUEST"` → URL is malformed (check for spaces)
- `"OVER_QUERY_LIMIT"` → You've hit quota (unlikely on first try)

---

### Test Result Example

**Good response (success):**
```json
{
  "html_attributions": [],
  "results": [
    {
      "name": "Joe's Pizza",
      "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "rating": 4.5,
      "vicinity": "123 Main St, New York"
    },
    ...
  ],
  "status": "OK"
}
```

**Bad response (error):**
```json
{
  "error_message": "This API project is not authorized to use this API.",
  "results": [],
  "status": "REQUEST_DENIED"
}
```

---

## 6. Common Errors

### Error: "This API project is not authorized to use this API"

**Cause:** Places API not enabled
**Fix:**
1. Go to: APIs & Services → Library
2. Search for "Places API"
3. Click ENABLE

---

### Error: "The provided API key is invalid"

**Cause:** API key copied incorrectly
**Fix:**
1. Go to: APIs & Services → Credentials
2. Click on your API key
3. Copy it again (make sure no spaces before/after)

---

### Error: "You have exceeded your request quota"

**Cause:** You've used your free $200 credit (unlikely during setup)
**Fix:**
1. Check your usage (see section 7)
2. Wait until next month for credit to reset
3. Or add more budget

---

### Error: API key works in browser but not in app

**Cause:** Application restrictions too strict
**Fix:**
1. Go to: APIs & Services → Credentials → Your API key
2. Under "Application restrictions", select "None" temporarily
3. Test app again
4. Re-add restrictions later (see deployment guide)

---

## 7. Monitoring Usage

### Set Up Budget Alerts

**Protect yourself from unexpected charges:**

1. Go to **☰ menu → "Billing" → "Budgets & alerts"**
2. Click **"CREATE BUDGET"**
3. Configure:
   - **Name:** "NightSwipe API Budget"
   - **Time range:** Monthly
   - **Projects:** Select "NightSwipe-MVP"
   - **Services:** Select "Places API" and "Maps JavaScript API"
4. Set budget amount: **$50** (or higher if you expect more traffic)
5. Add alert thresholds:
   - 50% of budget
   - 90% of budget
   - 100% of budget
6. **Add your email** to receive alerts
7. Click **"FINISH"**

**What you should see:**
> _[Screenshot placeholder: Budget alert creation]_

**✅ Success indicator:** "Budget created" + confirmation email

---

### Check Current Usage

1. Go to **☰ menu → "Billing" → "Reports"**
2. Filter by:
   - **Time range:** This month
   - **Services:** Places API
3. You'll see a graph of daily costs

**During MVP development, you should see:**
- Daily costs: $0.00 - $5.00
- Monthly total: Well under $200

---

## 8. Adding Your API Key to the App

### For Backend (Node.js/Express)

1. Create a file named `.env` in your backend project root
2. Add this line:
   ```
   GOOGLE_PLACES_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
3. Replace with your actual key
4. **IMPORTANT:** Add `.env` to your `.gitignore` file:
   ```
   # .gitignore
   .env
   node_modules/
   ```

### For Frontend (Expo React Native)

1. Create a file named `.env` in your frontend project root
2. Add this line:
   ```
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
3. Note the `EXPO_PUBLIC_` prefix (required for Expo)
4. Add `.env` to `.gitignore`

**See the Environment Variables Guide for more details.**

---

## 9. Security Best Practices

### ✅ DO:
- Store API key in `.env` file (never in code)
- Add `.env` to `.gitignore`
- Use API restrictions (restrict to specific APIs)
- Set up billing alerts
- Rotate key if exposed (create new key, delete old)

### ❌ DON'T:
- Commit API key to Git/GitHub
- Share key in Slack, email, or Discord
- Use the same key for dev and production
- Leave API restrictions as "None" in production
- Ignore billing alerts

---

## 10. What's Next?

Now that you have your API key:

1. ✅ **Save it securely** in password manager
2. ✅ **Add to `.env` file** (see Environment Variables Guide)
3. ✅ **Test in Postman** (optional, for advanced users)
4. ✅ **Implement in backend** (Sprint 03 - S-501)

---

## Need Help?

### Official Google Documentation
- Places API Overview: https://developers.google.com/maps/documentation/places/web-service/overview
- Pricing: https://developers.google.com/maps/billing-and-pricing/pricing
- API Key Best Practices: https://developers.google.com/maps/api-security-best-practices

### Common Questions

**Q: Do I need to enter payment info right away?**
A: Yes, Google requires it for verification, but you won't be charged unless you exceed the free $200/month credit.

**Q: What happens if I exceed the free tier?**
A: You'll receive email alerts at 50%, 90%, and 100% of your budget. Charges will start after $200 is used.

**Q: Can I use the same API key for development and production?**
A: You can, but it's better to create separate keys for better security and tracking.

**Q: My API key got exposed on GitHub. What do I do?**
A: Immediately go to Google Cloud Console → Credentials → Delete the exposed key → Create a new one. Check your billing to ensure no unauthorized usage.

**Q: How do I know if my quota is enough?**
A: For MVP with <100 users, the free $200/month is plenty. Monitor usage in Billing → Reports.

---

**✅ Guide Complete!** You now have a working Google Places API key.

**Next Guide:** [Database Setup Guide](./02_Database_Setup.md)

# 🚀 NightSwipe MVP - Quick Start

**Status:** S-101 Complete ✅ | Ready for S-102 (Firebase Setup)

---

## ⚡ Run the Project

### Terminal 1 - Backend
```bash
cd /home/linuxcodemachine/Desktop/NS-CB/backend
npm run dev
```
✅ Server runs at `http://localhost:3000`

### Terminal 2 - Frontend
```bash
cd /home/linuxcodemachine/Desktop/NS-CB/frontend
npx expo start
```
📱 Scan QR code with Expo Go app

---

## 🔥 Next: Firebase Setup (S-102)

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name: `nightswipe-mvp`
4. Disable Google Analytics (not needed for MVP)
5. Click "Create project"

### Step 2: Enable Firestore
1. In Firebase Console → "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in **test mode**" (we'll add security rules later)
4. Choose region closest to you
5. Click "Enable"

### Step 3: Get Frontend Config
1. In Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps" → Click Web icon (`</>`)
3. Register app with nickname: `nightswipe-frontend`
4. Copy the `firebaseConfig` object
5. Add values to `/frontend/.env`:
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

### Step 4: Get Backend Service Account
1. In Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save JSON file to `/backend/` (DO NOT COMMIT TO GIT!)
4. Add to `/backend/.env`:
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### Step 5: Test
1. Restart backend: `Ctrl+C` → `npm run dev`
2. Restart frontend: `Ctrl+C` → `npx expo start`
3. Check app - Firebase status should show ✅

---

## 📝 Files to Review

- `/README.md` - Full documentation
- `/Logs/iteration_log.md` - Detailed implementation log
- `/backend/src/server.js` - Backend code
- `/frontend/App.js` - Frontend code

---

## 🆘 Need Help?

**Backend not starting?**
- Check Node.js version: `node --version` (need 20.x)
- Check if port 3000 is free: `lsof -i :3000`

**Frontend can't connect to backend?**
- Make sure backend is running
- Check both on same network (if using physical device)

**"Firebase not configured" showing in app?**
- Complete Step 3 and Step 4 above
- Restart both servers after adding .env values

---

**📊 Sprint Progress:** S-101 ✅ | S-102 ⏳ | S-201 ⏳ | S-202 ⏳

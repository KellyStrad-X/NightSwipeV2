# NightSwipe MVP - Codebase

**Status:** Sprint 01 - Initial Setup Complete ✅
**Created:** 2025-10-05
**Architecture:** Hybrid (Firebase Auth + Express Backend + Firestore)

---

## 📁 Project Structure

```
NS-CB/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── server.js    # Main server file
│   │   ├── routes/      # API route handlers (to be added)
│   │   ├── config/      # Configuration files (to be added)
│   │   └── middleware/  # Custom middleware (to be added)
│   ├── .env             # Environment variables (not in Git)
│   ├── .env.example     # Template for .env
│   └── package.json     # Dependencies
│
├── frontend/            # React Native + Expo app
│   ├── src/
│   │   ├── screens/     # App screens (to be added)
│   │   ├── components/  # Reusable components (to be added)
│   │   ├── services/    # API and Firebase services
│   │   ├── config/      # Firebase configuration
│   │   └── context/     # React Context providers (to be added)
│   ├── App.js           # Main app entry point
│   ├── .env             # Environment variables (not in Git)
│   └── package.json     # Dependencies
│
└── Logs/
    └── iteration_log.md # Detailed implementation log
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x
- npm or yarn
- Expo Go app on your phone (iOS/Android)

### Backend Setup

```bash
cd backend
npm install
npm run dev    # Start with auto-reload
# or
npm start      # Start without auto-reload
```

**Backend runs at:** `http://localhost:3000`
**Health check:** `http://localhost:3000/health`

### Frontend Setup

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with Expo Go app to run on your phone.

---

## 🔧 Configuration

### Backend (.env)

Required environment variables:

```bash
# Server
PORT=3000
NODE_ENV=development

# Firebase Admin SDK (get from Firebase Console)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Google Places API (get from Google Cloud Console)
GOOGLE_PLACES_API_KEY=your_api_key

# CORS
FRONTEND_URL=http://localhost:8081
```

### Frontend (.env)

Required environment variables:

```bash
# Backend API
EXPO_PUBLIC_API_URL=http://localhost:3000

# Firebase Client SDK (get from Firebase Console)
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Environment
EXPO_PUBLIC_ENV=development
```

---

## 📦 Tech Stack

### Frontend
- **Framework:** React Native (Expo SDK)
- **Authentication:** Firebase Auth
- **Storage:** Expo SecureStore (for tokens)
- **Navigation:** React Navigation (to be added)
- **State:** React Context + Hooks

### Backend
- **Runtime:** Node.js 20.x
- **Framework:** Express.js
- **Authentication:** Firebase Admin SDK
- **Database:** Firestore
- **API Proxy:** Google Places API

---

## 🔑 Features Implemented

### Sprint 01 - S-101: Dev Environment ✅

**Backend:**
- ✅ Express server with CORS
- ✅ Health check endpoint (`/health`)
- ✅ Environment variable support (dotenv)
- ✅ Development auto-reload (nodemon)
- ✅ Error handling middleware
- ✅ Folder structure (routes, config, middleware)

**Frontend:**
- ✅ Expo app initialization
- ✅ Firebase configuration setup
- ✅ Backend connectivity test
- ✅ API service helpers
- ✅ Environment variable support
- ✅ Folder structure (screens, components, services, config, context)

---

## 📋 Next Steps

### Immediate (Sprint 01 Continuation)
- [ ] S-102: Set up Firebase project
- [ ] S-102: Add Firebase Admin SDK to backend
- [ ] S-102: Initialize Firestore database
- [ ] S-102: Test Firebase connection

### Upcoming (Sprint 01)
- [ ] S-201: Registration flow (using Firebase Auth)
- [ ] S-202: Login flow (using Firebase Auth)
- [ ] S-102: Basic logging/monitoring

### Sprint 02
- [ ] S-301: Home screen UI
- [ ] S-302: Location permissions
- [ ] S-401: Session creation backend
- [ ] S-203: Auth gate for invite flow

---

## 🧪 Testing

### Backend Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-05T...",
  "service": "NightSwipe API"
}
```

### Frontend Test

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npx expo start`
3. Open app on phone via Expo Go
4. Check status indicators:
   - Backend API: Should show ✅ Connected
   - Firebase: Should show ⚠️ Not configured (until you add Firebase credentials)

---

## 📝 Development Workflow

1. **Make changes** to code
2. **Backend:** Nodemon auto-restarts server
3. **Frontend:** Expo auto-reloads on file save
4. **Test** changes immediately
5. **Log iterations** in `Logs/iteration_log.md`

---

## 🔒 Security Notes

- ✅ `.env` files are in `.gitignore` (never commit secrets!)
- ✅ `.env.example` files provided as templates
- ⚠️ Remember to add Firebase credentials before testing auth
- ⚠️ Remember to add Google Places API key before testing places

---

## 📚 Documentation

- [Sprint Plans](../NightSwipeV2%20-%20Agents/Agents/Sprints/)
- [Setup Guides](../NightSwipeV2%20-%20Agents/User/Guides/)
- [Iteration Log](./Logs/iteration_log.md)
- [MVP Spec](../NightSwipeV2%20-%20Agents/Misc/NightSwipe%20MVP%20Overall.md)

---

## 🆘 Troubleshooting

### Backend won't start
- Check Node.js version: `node --version` (should be 20.x)
- Check if port 3000 is in use: `lsof -i :3000` (Mac/Linux)
- Verify `.env` file exists in backend folder

### Frontend won't connect to backend
- Ensure backend is running
- Check `EXPO_PUBLIC_API_URL` in frontend `.env`
- If using physical device, ensure phone and computer are on same WiFi

### "Firebase not configured" warning
- This is expected until you set up Firebase project
- Follow Firebase setup guide
- Add credentials to `.env` files

---

**Ready to build! 🌙💫**

# Authentication Testing Guide

**Sprint:** S-201 (Registration Flow) & S-202 (Login & Session)
**Created:** 2025-10-05
**Status:** Ready for testing on host machine

---

## Overview

The authentication system is now implemented with:
- ✅ Firebase Auth integration (frontend & backend)
- ✅ Registration flow with form validation
- ✅ Login flow with session persistence
- ✅ Protected API endpoints with token verification
- ✅ Auto-rehydration on app restart
- ✅ Logout functionality

---

## Prerequisites

### On Host Machine (Where Firebase Credentials Live)

1. **Firebase Project Setup**
   - Firebase project created
   - Email/Password authentication enabled
   - Firestore database created
   - Web app config obtained
   - Service account JSON downloaded

2. **Environment Variables Configured**

   **Frontend `.env`:**
   ```bash
   EXPO_PUBLIC_FIREBASE_API_KEY=your_actual_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

   **Backend `.env`:**
   ```bash
   PORT=3000
   NODE_ENV=development
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
   FIREBASE_PROJECT_ID=your-project-id
   GOOGLE_PLACES_API_KEY=your_api_key
   FRONTEND_URL=http://localhost:8081
   ```

---

## Running the Application

### 1. Start Backend Server

```bash
cd backend
npm start
```

**Expected output:**
```
✅ Firebase Admin SDK initialized successfully
✅ NightSwipe API running on port 3000
🏥 Health check: http://localhost:3000/health
```

**If Firebase not configured:**
```
⚠️ Firebase Admin not configured. Add FIREBASE_SERVICE_ACCOUNT to .env
⚠️ Auth endpoints will not work until Firebase is configured
✅ NightSwipe API running on port 3000
```

### 2. Start Frontend App

```bash
cd frontend
npm start
```

Then open in Expo Go on your phone or use iOS/Android simulator.

---

## Testing Checklist

### ✅ Registration Flow (S-201)

#### Test Case 1: Successful Registration
1. Open app → Should show **Login** screen (default)
2. Tap "Create Account" link
3. Fill in form:
   - Display Name: `Test User`
   - Email: `test@example.com`
   - Password: `Password123`
   - Phone: `+1 (555) 123-4567` (optional)
4. Tap "Create Account"
5. **Expected:** Loading spinner → Auto-login → **Home Screen** appears
6. **Verify:**
   - Home screen shows user's display name and email
   - Firestore `users` collection has new document with UID
   - Firebase Auth has new user

#### Test Case 2: Form Validation
1. On Register screen, test each field:
   - **Empty display name:** "Display name is required"
   - **Invalid email:** "Invalid email format"
   - **Weak password:** Shows specific requirement error
   - **Invalid phone:** "Invalid phone number format"
2. **Expected:** Inline error messages appear below each field

#### Test Case 3: Duplicate Email
1. Try to register with existing email
2. **Expected:** Alert: "An account with this email already exists"

#### Test Case 4: Network Error
1. Turn off WiFi/data
2. Try to register
3. **Expected:** Alert: "Network error. Please check your connection and try again."

---

### ✅ Login Flow (S-202)

#### Test Case 5: Successful Login
1. Logout from Home screen (if logged in)
2. On Login screen, enter:
   - Email: `test@example.com`
   - Password: `Password123`
3. Tap "Sign In"
4. **Expected:** Loading spinner → **Home Screen** appears

#### Test Case 6: Invalid Credentials
1. On Login screen, enter:
   - Email: `wrong@example.com`
   - Password: `WrongPass123`
2. Tap "Sign In"
3. **Expected:** Alert: "Invalid email or password"

#### Test Case 7: Empty Fields
1. Leave email or password blank
2. Tap "Sign In"
3. **Expected:** Field-specific error messages

---

### ✅ Session Persistence

#### Test Case 8: Auto-Rehydration
1. Successfully log in
2. Close the app completely (swipe away from app switcher)
3. Reopen the app
4. **Expected:**
   - Brief loading spinner
   - Automatically logged in → **Home Screen** appears
   - No need to enter credentials again

#### Test Case 9: Token Refresh
1. Stay logged in for 1+ hour (Firebase tokens expire after 1 hour)
2. Navigate around the app
3. **Expected:** Token auto-refreshes in background, no logout

---

### ✅ Logout Flow

#### Test Case 10: Successful Logout
1. From Home screen, tap "Logout" button
2. **Expected:**
   - Returns to **Login Screen**
   - Token cleared from SecureStore
   - Firebase session cleared

#### Test Case 11: Logout Persistence
1. Logout
2. Close and reopen app
3. **Expected:** Still logged out → **Login Screen** appears

---

### ✅ Backend Token Validation

#### Test Case 12: Protected Endpoint (With Token)
1. Login to get a valid token
2. Use a tool like Postman or curl:
   ```bash
   # Get token from app (check logs or add debug code to print it)
   curl -H "Authorization: Bearer <your_firebase_token>" \
        http://localhost:3000/api/v1/profile
   ```
3. **Expected:**
   ```json
   {
     "message": "Protected profile endpoint",
     "user": {
       "uid": "abc123...",
       "email": "test@example.com",
       "emailVerified": false
     }
   }
   ```

#### Test Case 13: Protected Endpoint (Without Token)
```bash
curl http://localhost:3000/api/v1/profile
```

**Expected:**
```json
{
  "error": "Authorization header missing",
  "message": "Please provide a valid Firebase ID token"
}
```

#### Test Case 14: Protected Endpoint (Invalid Token)
```bash
curl -H "Authorization: Bearer invalid_token" \
     http://localhost:3000/api/v1/profile
```

**Expected:**
```json
{
  "error": "Authentication failed",
  "message": "Invalid or expired token"
}
```

---

## Firestore Data Verification

After registering a user, check Firestore Console:

**Collection:** `users`
**Document ID:** `<firebase_uid>`
**Fields:**
```json
{
  "display_name": "Test User",
  "email": "test@example.com",
  "phone": "+1 (555) 123-4567",
  "created_at": "2025-10-05T12:34:56.789Z"
}
```

---

## Common Issues & Solutions

### Issue: "Firebase not configured"
- **Cause:** `.env` files missing Firebase credentials
- **Fix:** Copy `.env.example` to `.env` and add real credentials
- **Verify:** Restart backend/frontend after adding credentials

### Issue: "Invalid email or password" (but credentials are correct)
- **Cause:** Firebase Auth may not be enabled
- **Fix:** Firebase Console → Authentication → Sign-in method → Enable Email/Password

### Issue: App crashes on login/register
- **Cause:** Firestore rules may be blocking writes
- **Fix:** Temporarily set Firestore rules to test mode:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```

### Issue: Token validation fails on backend
- **Cause:** `FIREBASE_SERVICE_ACCOUNT` not set or malformed
- **Fix:** Ensure service account JSON is on one line, properly escaped

### Issue: Session doesn't persist after app restart
- **Cause:** `onAuthStateChanged` listener not working
- **Check:** Make sure frontend has valid Firebase config
- **Debug:** Add console.logs in `AuthContext.js` useEffect

---

## Password Requirements

Enforced in `RegisterScreen.js:48-61`:
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)

**Example valid passwords:**
- `Password123`
- `SecurePass1`
- `MyApp2025`

**Example invalid passwords:**
- `password` (no uppercase, no number)
- `PASSWORD123` (no lowercase)
- `Pass1` (too short)

---

## File Locations

### Frontend
- **AuthContext:** `frontend/src/context/AuthContext.js`
- **RegisterScreen:** `frontend/src/screens/RegisterScreen.js`
- **LoginScreen:** `frontend/src/screens/LoginScreen.js`
- **HomeScreen:** `frontend/src/screens/HomeScreen.js`
- **App Navigation:** `frontend/App.js`
- **Firebase Config:** `frontend/src/config/firebase.js`

### Backend
- **Server:** `backend/src/server.js`
- **Firebase Init:** `backend/src/config/firebase.js`
- **Auth Middleware:** `backend/src/middleware/auth.js`

---

## Next Steps After Testing

1. ✅ Verify all test cases pass
2. ✅ Document any bugs or issues found
3. ✅ Test on both iOS and Android devices
4. ✅ Update Restart Brief with test results
5. ⏳ Move to S-301 (Home Screen State Management) in Sprint 02

---

## Sprint 01 Completion Criteria

- [x] S-101: Dev environment setup
- [x] S-102: Ops & logging framework
- [x] S-201: Registration flow implemented
- [x] S-202: Login & session implemented
- [ ] All test cases pass on host machine
- [ ] Manual testing completed on iOS/Android
- [ ] Restart Brief updated

---

**Questions or issues?** Add notes to the Restart Brief or check the sprint backlog.

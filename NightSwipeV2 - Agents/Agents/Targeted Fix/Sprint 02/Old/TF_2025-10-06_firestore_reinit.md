# Targeted Fix – Sprint 02 – Firestore Reinitialization Regression

**Issue Summary**
- After forcing Firestore long-polling, Expo logs `⚠️ Firebase not configured yet. Add credentials to .env file.` even though `.env` is populated, and profile fetches fall back to the placeholder name.
- Root cause: `initializeFirestore(app, …)` throws on Expo fast refresh / repeated imports because the Firebase app already exists, our `try/catch` swallows the real error, and `db` stays undefined.
- Without a valid Firestore instance, `doc(db, …)` raises `Expected first argument to collection()` errors and the auth layer never reaches real profile data.

**Desired Outcome**
- Firestore stays initialized across reloads while keeping `experimentalForceLongPolling` enabled.
- Profile fetches succeed again (no fallback name) when credentials are present.
- Console logs the true initialization error if configuration is genuinely missing.

**Implementation Steps for Claude**
1. **Reuse existing Firebase App**
   - In `frontend/src/config/firebase.js`, import `getApp` and `getApps` from `firebase/app`.
   - If `getApps().length` is 0, call `initializeApp(firebaseConfig)`; otherwise reuse `getApp()` to avoid the duplicate-app error.

2. **Initialize Firestore exactly once**
   - Import both `initializeFirestore` and `getFirestore` from `firebase/firestore`.
   - When creating `db`, check if the app already has Firestore initialized (try `getFirestore(app)` inside a try/catch). If it throws, fall back to `initializeFirestore(app, { experimentalForceLongPolling: true, experimentalAutoDetectLongPolling: true })`.
   - Store the resolved instance so repeated imports reuse the same `db` and we keep long-polling active.

3. **Improve logging & error handling**
   - Replace the blanket `console.log('⚠️ Firebase not configured yet…')` catch with something that logs the actual `error.message`. Only print the setup warning when the error is really due to missing config.
   - If init succeeds, keep the success log `✅ Firebase initialized successfully` (once), but guard it so it doesn’t spam on reuse.

4. **Export consistent singletons**
   - Ensure `auth` is derived from the (possibly reused) app, and `db` is always a valid Firestore reference before export.

**Testing Instructions**
- Clear Metro cache or trigger a hot reload multiple times; confirm no duplicate-app errors and `db` remains defined.
- Launch the app with valid `.env` values: login should show the real display name (no fallback) and console should print the success log only once.
- Remove or break `.env` temporarily to confirm the new catch still surfaces a clear warning.
- Optionally, disable network after login to ensure the previous offline fallback still works with the reused Firestore instance.

**References**
- Current config file: `../NS-CB/frontend/src/config/firebase.js`
- Error surfaced after commit `833baf8` (long-polling/location fix)
- Firebase docs on initializing multiple apps: https://firebase.google.com/docs/reference/js/app.md

---

> Goal: keep the long-polling transport while preventing Expo reloads from nulling out Firestore.

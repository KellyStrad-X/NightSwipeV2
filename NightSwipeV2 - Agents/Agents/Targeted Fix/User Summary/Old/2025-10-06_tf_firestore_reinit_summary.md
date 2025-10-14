# Targeted Fix – Firestore Reuse & Profile Sync (2025-10-06)

## What Changed
- Firebase now reuses the existing app and Firestore instance on Expo hot reloads, so we keep the long-polling transport without tripping the “app already exists” error (`../NS-CB/frontend/src/config/firebase.js:1`).
- Profile calls once again hit the real Firestore collection instead of falling back to email-derived names, restoring the correct user display in the UI (`../NS-CB/frontend/src/context/AuthContext.js` leverages the revived `db`).
- Error handling logs the actual init failure when credentials are missing, instead of masking everything behind the “not configured” warning.

## Why It Matters
- Hot reloads are safe: `db` stays defined, long-polling stays active, and auth/profile flows keep working uninterrupted.
- The user experience is back to normal with proper display names and session data even while we iterate quickly during development.
- You get clearer console diagnostics if the Firebase config truly isn’t present.

## How to Try It
1. Launch the app with your `.env` values—log in and confirm your real display name shows up (no “User” fallback).
2. Trigger a hot reload (save a file); the console should show the “♻️ Reusing existing Firebase app/Firestore instance” logs with no errors.
3. Remove the `.env` temporarily, reload, and confirm the new error logging tells you config is missing.
4. Restore the config and use a slow-network scenario to confirm the earlier offline fallbacks still behave.

## Known Gaps
- Reuse logs still print on every reload; we can quiet them later if they get noisy.
- Auth persistence warning remains until we wire up AsyncStorage (out of scope for this TF).

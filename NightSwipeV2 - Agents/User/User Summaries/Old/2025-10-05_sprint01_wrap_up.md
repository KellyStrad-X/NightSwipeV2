# NightSwipe MVP – Sprint 01 Wrap-Up (2025-10-05)

## Snapshot
- Sprint 01 is now complete: registration, login, and persistent sessions all run through Firebase on top of our Expo shell and Express backend.
- Couples can create an account, sign back in later, and stay logged in between app launches once device storage is populated.
- The backend now trusts Firebase ID tokens, so future protected endpoints are ready for session features.

## What Changed
- New "Create Account" flow collects display name, email, password, and optional phone with clear inline guidance.
- Returning users get a polished "Welcome Back" screen with password visibility toggle, friendly errors, and fast re-entry to the app.
- A lightweight home screen acknowledges the signed-in user, offers logout, and sets the stage for upcoming deck and invite work.
- The API boots with Firebase Admin and rejects requests without a valid NightSwipe session token.

## Why It Matters
- Signing up and logging in now feels like a real product moment instead of a prototype, making the experience demo-ready.
- Persistent authentication means hosts and guests won’t need to re-enter credentials every time they open the app.
- By verifying tokens server-side, we keep future matchmaking and Places endpoints secure from day one.

## How to Try It
1. Copy each `.env.example` in `frontend` and `backend` to `.env`, then paste in your Firebase web config and service-account JSON along with the Google Places key.
2. From `/backend`, run `npm start` to boot the API; you should see the Firebase initialization confirmation.
3. From `/frontend`, run `npm start` and open the Expo project in a simulator or on-device; register a user, then log out and back in to confirm persistence.
4. Hit the protected `/api/v1/profile` endpoint with the Expo device’s ID token to see the verified response.

## Known Gaps
- Email verification, password reset, and analytics hooks remain out of scope until a later sprint.
- The home screen is a temporary holding place; the animated storyboard experience arrives with Sprint 02.
- App icons, glow treatments, and map-driven flows will land once branding polish and Places integration kick off.

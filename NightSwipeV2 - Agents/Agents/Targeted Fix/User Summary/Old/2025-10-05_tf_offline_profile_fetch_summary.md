# Targeted Fix – Offline Login Stability (2025-10-05)

## What Changed
- Login and session resume now succeed even if Firestore is unreachable; the auth layer falls back to a local profile so you still land on the home screen (`../NS-CB/frontend/src/context/AuthContext.js:31`).
- Failed Firestore writes during sign-up are tolerated—NightSwipe keeps your new profile locally until the network returns (`../NS-CB/frontend/src/context/AuthContext.js:119`).
- When a fallback profile is used, we log a quiet warning instead of blocking you, keeping the experience smooth in airplane mode or spotty Wi-Fi (`../NS-CB/frontend/src/context/AuthContext.js:45`).

## Why It Matters
- Couples can keep using the app while offline; no more “client is offline” crash on login.
- Registration isn’t fragile—if connectivity blips, you can still get started and sync later.
- QA has clearer signals in the console without disrupting the user journey.

## How to Try It
1. Sign in online to confirm the profile still loads normally.
2. Flip to airplane mode and sign in again—the home screen should appear with a fallback name and only a console warning.
3. Toggle the network back on and relaunch; the stored Firestore profile should replace the fallback automatically on the next load.

## Known Gaps
- We flag fallback profiles internally but don’t yet auto-refresh them when connectivity returns; that enhancement is queued for later.

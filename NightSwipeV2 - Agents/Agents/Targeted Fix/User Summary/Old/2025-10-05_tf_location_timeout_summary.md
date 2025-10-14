# Targeted Fix – Location & Firestore Reliability (2025-10-05)

## What Changed
- Firestore now forces long-polling transport so React Native stops reporting “client is offline” while online (`frontend/src/config/firebase.js:1`).
- Location requests wait up to 15 seconds using Expo’s native timeout and accept fresh cached fixes to avoid premature failures (`frontend/src/context/LocationContext.js:64`).
- If GPS is still slow, we fall back to the last known coordinates, flag them as approximate, or offer a retry prompt instead of leaving the app stuck (`frontend/src/context/LocationContext.js:90`).

## Why It Matters
- Auth, session creation, and future Firestore reads stay online reliably across Expo builds.
- Couples can launch an invite or browse flow indoors without repeatedly hitting the timeout error.
- QA gets clear console breadcrumbs while the UI remains responsive and forgiving.

## How to Try It
1. Sign in, then trigger an invite with good signal—expect an immediate GPS fix with no warnings.
2. Move to a weak signal spot or toggle airplane mode briefly, then tap the CTA; you should see a fallback coordinate logged or a retry prompt instead of an error loop.
3. Repeat after disabling airplane mode and retrying to confirm a fresh fix comes through.
4. Watch console output for the new long-polling logs and timeout fallbacks while verifying the buttons re-enable each time.

## Known Gaps
- We log when fallback coordinates are used but don’t surface a UI hint yet; consider a toast in a follow-up.
- Long-polling adds slight latency compared to WebChannel; monitor once we ship more Firestore-heavy features.

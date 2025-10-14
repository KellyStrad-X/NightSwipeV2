# Targeted Fix – Sprint 02 – Offline Login Profile Fetch

## Issue Summary
- Expo login succeeds but the app throws `FirebaseError: Failed to get document because the client is offline.` during auth state rehydrate and explicit login attempts.
- The error originates in `frontend/src/context/AuthContext.js` when `getDoc(doc(db, 'users', user.uid))` rejects.
- Firebase SDK classifies offline Firestore reads as errors, so our catch block exits early and returns `{ success: false }`, leaving the app stuck on the auth screen even though the credential is valid.

## Desired Outcome
- Logging in (or reopening the app with a cached Firebase session) should succeed even if Firestore is temporarily unreachable/offline.
- When Firestore can’t be reached, we still set a reasonable `userProfile` fallback so the UI renders and the user remains authenticated.
- Surface a non-blocking warning (e.g., console warning) so we still know profile data came from the fallback path, but do **not** show an error alert to the user.

## Implementation Steps for Claude
1. **Create a safe profile loader** inside `AuthContext`:
   - Wrap the `getDoc` call in a helper (e.g., `fetchUserProfile(uid)`), returning `null` on `FirebaseError` codes such as `unavailable`, `failed-precondition`, or the string match "client is offline".
   - Log a `console.warn` with the error message when the fetch fails, but do not throw.

2. **Use fallback profile data when Firestore is offline**:
   - For `onAuthStateChanged` and `login()`, if `fetchUserProfile` returns `null`, derive fallback data from the authenticated user (`display_name`: `userProfile?.display_name` from previous state, or `user.displayName`, or `user.email?.split('@')[0]`). Include `email` and `phone: null` so downstream UI keeps working.
   - Update state with this fallback object so `HomeScreen` still has the username it expects.

3. **Ensure `register()` stays resilient**:
   - The existing `setDoc` should guarantee the profile exists, but guard the subsequent fetch the same way in case Firestore write/read hiccups occur (e.g., user quickly goes offline after registration).

4. **Return success even when using fallback**:
   - `login()` should continue to resolve `{ success: true }` as long as Firebase Auth succeeds, even if Firestore profile data is missing.
   - Make sure errors unrelated to offline Firestore (e.g., invalid-credential) still propagate as before.

5. **Update Type Expectations**:
   - If we rely on `display_name` later, ensure the fallback sets a string (never undefined). Consider caching the fallback profile in state so the next offline rehydrate reuses it.

## Testing Instructions
1. Start the Expo client, sign in online to confirm nothing regresses (profile data should load from Firestore and log no warnings).
2. Disable network (Airplane mode or disconnect Wi-Fi), relaunch the app (or sign out/sign in while offline):
   - Expect login to complete, app should show home screen with fallback display name (e.g., derived from email).
   - Console should show a warning about the offline profile fetch but no red error box.
3. Re-enable network and confirm subsequent launches still show the stored Firestore profile once connectivity returns.

## References
- Current auth flow: `../NS-CB/frontend/src/context/AuthContext.js`
- Error surfaced in Expo console during offline login: reported by user 2025-10-05.

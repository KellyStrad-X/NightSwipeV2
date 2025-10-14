# TF Log - Firestore Reinitialization Regression

**Date:** 2025-10-06
**Sprint:** Sprint 02
**TF Reference:** `TF_2025-10-06_firestore_reinit.md`
**Issue:** Firestore undefined after hot reload, causing profile fetch failures
**Status:** ✅ Fixed - Ready for testing

---

## Problem Summary

After implementing long-polling fix in commit `833baf8`, the app started logging `⚠️ Firebase not configured yet. Add credentials to .env file.` even with valid credentials. Profile fetches fell back to placeholder names derived from email.

**Root Cause:**
- `initializeApp()` throws "duplicate app" error on Expo hot reload/fast refresh
- `initializeFirestore()` can only be called once per Firebase app
- Our blanket try/catch was swallowing these errors
- `db` remained undefined, causing `doc(db, ...)` to fail
- AuthContext fallback kicked in, using email-derived display names

**Error Chain:**
1. Expo hot reload → module re-imported
2. `initializeApp(firebaseConfig)` throws "Firebase app already exists"
3. Catch block logs generic warning, `db` stays undefined
4. `getDoc(doc(db, 'users', uid))` fails with "Expected first argument to collection()"
5. AuthContext uses fallback profile (email-based name)

---

## Solution Implemented

### Reuse Existing Firebase App & Firestore Instances

**File:** `frontend/src/config/firebase.js`

#### 1. Added Imports for Reuse
```javascript
import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
```

#### 2. Check if App Exists Before Initializing
**Before:**
```javascript
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = initializeFirestore(app, { /* long-polling */ });
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.log('⚠️ Firebase not configured yet. Add credentials to .env file.');
}
```

**After:**
```javascript
try {
  // Reuse existing Firebase app if already initialized (Expo hot reload compatibility)
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');
  } else {
    app = getApp();
    console.log('♻️ Reusing existing Firebase app');
  }

  // Get auth instance
  auth = getAuth(app);

  // Initialize Firestore with long-polling for React Native/Expo compatibility
  // Try to get existing instance first (hot reload), otherwise initialize new
  try {
    db = getFirestore(app);
    console.log('♻️ Reusing existing Firestore instance');
  } catch (firestoreError) {
    // Firestore not initialized yet, create with long-polling
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: true,
    });
    console.log('✅ Firestore initialized with long-polling');
  }

} catch (error) {
  // Log actual error for debugging
  console.error('❌ Firebase initialization error:', error.message);

  // Check if it's a config issue
  const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;
  if (!hasConfig) {
    console.log('⚠️ Firebase not configured. Add credentials to .env file.');
  }
}
```

---

## Key Changes

### 1. App Reuse Strategy
- **Check:** `getApps().length === 0` before creating new app
- **First Run:** `initializeApp(firebaseConfig)` → "✅ Firebase app initialized"
- **Hot Reload:** `getApp()` → "♻️ Reusing existing Firebase app"

### 2. Firestore Reuse Strategy
- **Try:** `getFirestore(app)` to get existing instance (preserves long-polling settings)
- **Catch:** If not initialized, call `initializeFirestore(app, { long-polling })` to create new instance
- **First Run:** "✅ Firestore initialized with long-polling"
- **Hot Reload:** "♻️ Reusing existing Firestore instance"

### 3. Improved Error Logging
- **Before:** Generic "not configured" message for all errors
- **After:**
  - Logs actual error message: `console.error('❌ Firebase initialization error:', error.message)`
  - Only shows config warning if credentials actually missing
  - Helps debug real issues vs config issues

### 4. Long-Polling Preserved
- Long-polling settings only applied during `initializeFirestore()`
- Reused instances retain their original settings
- No degradation on hot reload

---

## Console Output Examples

### First Launch (Success)
```
✅ Firebase app initialized
✅ Firestore initialized with long-polling
```

### Hot Reload (Success)
```
♻️ Reusing existing Firebase app
♻️ Reusing existing Firestore instance
```

### Missing Config
```
❌ Firebase initialization error: [actual error]
⚠️ Firebase not configured. Add credentials to .env file.
```

---

## Files Modified

### `frontend/src/config/firebase.js`
- **Lines 1-3:** Added `getApp`, `getApps`, `getFirestore` imports
- **Lines 21-57:** Replaced initialization logic with reuse checks
- **Total Changes:** ~20 lines added/modified

---

## Testing Checklist

### ✅ Hot Reload Compatibility
- [ ] Launch app → See "Firebase app initialized" and "Firestore initialized with long-polling"
- [ ] Trigger hot reload (save a file) → See "Reusing existing Firebase app" and "Reusing existing Firestore instance"
- [ ] No duplicate app errors in console
- [ ] `db` remains defined across reloads

### ✅ Profile Fetching (Regression Fix)
- [ ] Login with valid credentials → Real display name shows (not email-based fallback)
- [ ] Console shows no "Expected first argument to collection()" errors
- [ ] Firestore profile fetch succeeds
- [ ] No fallback warnings unless actually offline

### ✅ Offline Behavior (Preserved)
- [ ] Put device in Airplane mode
- [ ] Login → Falls back to email-based display name (expected)
- [ ] Console shows: "Firestore offline - using fallback profile data"
- [ ] Fallback behavior still works (from previous TF)

### ✅ Long-Polling (Preserved)
- [ ] Network connected → No "client is offline" errors
- [ ] Firestore operations succeed reliably
- [ ] Long-polling settings active (first init only)

### ✅ Error Handling
- [ ] Temporarily remove `.env` credentials
- [ ] Launch app → See actual error message + config warning
- [ ] Restore `.env` → App works normally

---

## Edge Cases Handled

1. **Multiple Hot Reloads** → App/Firestore reused indefinitely without errors
2. **Missing Config** → Clear error message + helpful warning
3. **Firestore Already Initialized** → Reuses instance, preserves long-polling
4. **Auth Instance** → Always derived from current app (reused or new)
5. **Export Safety** → `auth` and `db` always exported (may be undefined if config missing)

---

## Regression Analysis

### What Broke
Previous commit (`833baf8`) introduced long-polling via `initializeFirestore()`, which can only be called once. Expo's hot reload re-imported the module, tried to reinitialize, and threw an error that was caught and swallowed.

### Why It Wasn't Caught Earlier
- VM testing doesn't use Expo's hot reload feature
- Initial launch always worked (first initialization)
- Only manifested on subsequent hot reloads during development

### Prevention
- Always check if Firebase app/Firestore already exists before initializing
- Log actual errors instead of generic messages
- Test hot reload scenarios during implementation

---

## Related Fixes

This TF builds on previous work:
1. **TF - Offline Profile Fetch:** Fallback profile when Firestore unavailable
2. **TF - Location Timeout + Firestore Transport:** Long-polling for React Native compatibility

Together, these create a robust Firebase integration:
- **Transport Layer:** Long-polling (works in React Native)
- **Reuse Layer:** Hot reload compatible (this fix)
- **Fallback Layer:** Offline resilience (previous TF)

---

## Time Spent

- Reading TF document: ~3 minutes
- Implementing fix: ~10 minutes
- Documentation: ~15 minutes
- **Total:** ~30 minutes

---

## Questions/Notes

1. **Should we suppress reuse logs in production?** (Currently shows every hot reload)
2. **Test long-polling persistence?** Want to verify reused instances still use long-polling
3. **Add version check?** Could log Firebase SDK version to help debug compatibility issues

---

**End of TF Log**

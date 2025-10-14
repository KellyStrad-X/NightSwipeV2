# TF Log - Offline Profile Fetch Fix

**Date:** 2025-10-05
**Sprint:** Sprint 02
**TF Reference:** `TF_2025-10-05_offline_profile_fetch.md`
**Issue:** Firebase offline error blocking login/auth rehydration
**Status:** ✅ Fixed - Ready for testing

---

## Problem Summary

User reported `FirebaseError: Failed to get document because the client is offline` when attempting to login. The error occurred in `AuthContext.js` when fetching user profile from Firestore.

**Root Cause:**
- Firebase Auth succeeded, but Firestore profile fetch failed due to offline/unavailable status
- Our catch block treated Firestore errors as auth failures
- User remained on login screen despite valid credentials
- Same issue occurred during app launch when rehydrating auth state

---

## Solution Implemented

### 1. Created `fetchUserProfile()` Helper Function

Added safe profile fetcher that handles offline errors gracefully:

```javascript
const fetchUserProfile = async (uid, user) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    // Check if error is due to offline/unavailable Firestore
    const isOfflineError =
      error.code === 'unavailable' ||
      error.code === 'failed-precondition' ||
      error.message?.includes('client is offline');

    if (isOfflineError) {
      console.warn('Firestore offline - using fallback profile data:', error.message);

      // Return fallback profile data derived from Firebase Auth user
      const fallbackProfile = {
        display_name: user?.displayName || user?.email?.split('@')[0] || 'User',
        email: user?.email || '',
        phone: null,
        _isFallback: true,
      };

      return fallbackProfile;
    }

    // For other errors, log and return null
    console.error('Error fetching user profile:', error);
    return null;
  }
};
```

### 2. Updated `onAuthStateChanged` (Auth Rehydration)

Changed from direct `getDoc` call to use `fetchUserProfile`:

**Before:**
```javascript
const userDoc = await getDoc(doc(db, 'users', user.uid));
if (userDoc.exists()) {
  setUserProfile(userDoc.data());
}
// ... catch block set user to null on ANY error
```

**After:**
```javascript
const profile = await fetchUserProfile(user.uid, user);
if (profile) {
  setUserProfile(profile);
}
// ... catch block only fails on auth/ errors, not Firestore
```

### 3. Updated `login()` Function

Same pattern - use `fetchUserProfile` and only fail on auth errors:

**Before:**
```javascript
const userDoc = await getDoc(doc(db, 'users', user.uid));
if (userDoc.exists()) {
  setUserProfile(userDoc.data());
}
// ... catch returned { success: false } for ANY error
```

**After:**
```javascript
const profile = await fetchUserProfile(user.uid, user);
if (profile) {
  setUserProfile(profile);
}
// ... only auth/ errors return { success: false }
```

### 4. Updated `register()` Function

Added nested try-catch for Firestore write:

```javascript
try {
  await setDoc(doc(db, 'users', user.uid), profileData);
} catch (firestoreError) {
  console.warn('Profile write to Firestore failed (user may be offline):', firestoreError.message);
  // Continue - we'll use profileData locally
}
```

Registration succeeds even if Firestore write fails (offline). User can still use the app.

---

## Key Changes

### Error Handling Philosophy
- **Auth errors** (`auth/` prefix) = Login/registration failure
- **Firestore offline errors** = Warning logged, use fallback, continue
- **Other errors** = Warning logged, continue when possible

### Fallback Profile Data
When Firestore is unavailable:
```javascript
{
  display_name: user.email.split('@')[0],  // e.g., "john" from "john@example.com"
  email: user.email,
  phone: null,
  _isFallback: true  // Flag for potential future refresh
}
```

### Console Output
- **Online (normal):** No warnings, profile loaded from Firestore
- **Offline:** `console.warn('Firestore offline - using fallback profile data: ...')`
- **No error alerts shown to user** - they remain authenticated

---

## Files Modified

### `frontend/src/context/AuthContext.js`
1. Added `fetchUserProfile(uid, user)` helper function (lines 31-64)
2. Updated `onAuthStateChanged` to use `fetchUserProfile` (line 76)
3. Updated `login()` to use `fetchUserProfile` (line 167)
4. Updated `register()` with nested try-catch for Firestore write (lines 119-125)
5. Changed error handling to only fail on `auth/` errors (lines 84-92, 176-195)

**Total changes:** ~60 lines added/modified

---

## Testing Checklist

### ✅ Online Testing (Normal Flow)
- [ ] Login with valid credentials → Success, profile loads from Firestore
- [ ] Register new account → Success, profile saved to Firestore
- [ ] Close and reopen app → User auto-authenticated, profile loads
- [ ] Console shows no warnings about fallback data

### ✅ Offline Testing (Resilience)
- [ ] Put device in Airplane mode
- [ ] Login with valid credentials → Success, fallback profile used
- [ ] Console shows: "Firestore offline - using fallback profile data"
- [ ] Home screen displays username (derived from email)
- [ ] No error alert shown to user
- [ ] Register while offline → Auth succeeds, profile stored locally
- [ ] Close and reopen app while offline → User auto-authenticated with fallback

### ✅ Online Recovery
- [ ] Re-enable network after offline login
- [ ] Close and reopen app → Profile should now load from Firestore
- [ ] No `_isFallback` flag in subsequent loads

### ✅ Error Cases Still Work
- [ ] Invalid credentials → Still shows "Invalid email or password"
- [ ] Network error during auth → Still shows network error message
- [ ] Weak password → Still shows password requirements

---

## Edge Cases Handled

1. **User registers offline**
   - Auth succeeds, Firestore write fails
   - Profile stored in local state
   - When online, subsequent logins fetch from Firestore

2. **App launched offline with cached session**
   - `onAuthStateChanged` fires with user
   - Firestore fetch fails, fallback used
   - User remains authenticated

3. **Intermittent connectivity**
   - Some requests succeed, some fail
   - Only offline/unavailable errors trigger fallback
   - Other errors logged but don't block auth

4. **No profile in Firestore yet**
   - `getDoc` returns exists=false
   - `fetchUserProfile` returns null
   - State updated with user but no profile (graceful degradation)

---

## Potential Future Enhancements

1. **Profile Refresh on Reconnect**
   - Detect when network comes back online
   - If `userProfile._isFallback === true`, re-fetch from Firestore
   - Update profile in state

2. **Retry Queue for Firestore Writes**
   - When registration fails to write profile offline
   - Queue the write operation
   - Retry when network returns

3. **Persistent Fallback Cache**
   - Store fallback profile in AsyncStorage
   - Use cached fallback instead of deriving from email each time
   - More consistent offline experience

---

## Time Spent

- Reading TF document: ~3 minutes
- Implementing fix: ~15 minutes
- Documentation: ~10 minutes
- **Total:** ~30 minutes

---

## Questions/Notes

1. Should we implement profile refresh on reconnect? (Nice-to-have, not blocking)
2. The `_isFallback` flag is set but not currently used - reserved for future enhancement
3. Fallback display name uses email prefix - acceptable for MVP?

---

**End of TF Log**

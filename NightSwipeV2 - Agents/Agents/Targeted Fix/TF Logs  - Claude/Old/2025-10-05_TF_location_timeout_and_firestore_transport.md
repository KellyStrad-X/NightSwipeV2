# TF Log - Location Timeout + Firestore Transport Fixes

**Date:** 2025-10-05
**Sprint:** Sprint 02
**TF Reference:** `TF_2025-10-05_location_timeout.md` + Additional Firestore transport fix
**Issues:**
1. Location request timeout errors (`Error: Location request timed out`)
2. Firestore "client is offline" errors due to WebChannel transport failures in React Native
**Status:** ✅ Fixed - Ready for testing

---

## Problem Summary

### Issue 1: Location Timeout
User reported `ERROR Location error: [Error: Location request timed out]` when tapping location-based CTAs ("Invite Someone" or "Start Browse"). The manual 10-second timeout via `Promise.race` was too aggressive, especially indoors or in low-signal environments where GPS acquisition takes longer.

**Root Cause:**
- Manual `Promise.race` rejected before GPS could acquire fix
- No fallback to last-known position
- No retry mechanism - users stuck in error loop
- Loading state not properly cleared on all exit paths

### Issue 2: Firestore Transport
Browser agent identified that Firestore's default WebChannel transport (streaming/websockets) fails in React Native/Expo environments, causing "client is offline" errors even with working network connectivity.

**Root Cause:**
- Firestore Web SDK defaults to WebChannel transport
- React Native doesn't fully support WebSocket-based transports
- Firestore falls back to "offline" mode instead of switching to long-polling
- Results in "failed to get document because client is offline" errors

---

## Solutions Implemented

### 1. Firestore Long-Polling Fix

**File:** `frontend/src/config/firebase.js`

Changed Firestore initialization to force long-polling transport for React Native compatibility:

**Before:**
```javascript
import { getFirestore } from 'firebase/firestore';
// ...
db = getFirestore(app);
```

**After:**
```javascript
import { initializeFirestore } from 'firebase/firestore';
// ...
db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: true,
});
```

**Impact:**
- Forces Firestore to use HTTP long-polling instead of WebChannel
- Auto-detects best available transport
- Fixes "client is offline" errors on network-connected devices
- Works alongside existing offline fallback in AuthContext

---

### 2. Location Timeout + Fallback + Retry

**File:** `frontend/src/context/LocationContext.js`

#### A. Increased Timeout & Configuration
```javascript
const LOCATION_TIMEOUT = 15000; // 15s (was 10s)
const MAX_LOCATION_AGE = 5000; // Accept cached coordinates up to 5s old
```

#### B. Removed Manual Promise.race
**Before:**
```javascript
const locationPromise = Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High,
});

const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Location request timed out')), 10000);
});

const location = await Promise.race([locationPromise, timeoutPromise]);
```

**After:**
```javascript
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High,
  timeout: LOCATION_TIMEOUT, // Built-in timeout
  maximumAge: MAX_LOCATION_AGE, // Accept recent cached coordinates
});
```

#### C. Added Fallback to Last Known Position
When timeout occurs, attempt to retrieve last-known position:

```javascript
if (isTimeout) {
  console.warn('Location request timed out, attempting fallback to last known position');

  try {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 60000, // Accept positions up to 1 minute old
      requiredAccuracy: 500, // Accept accuracy within 500m
    });

    if (lastKnown) {
      const fallbackCoordinates = {
        lat: lastKnown.coords.latitude,
        lng: lastKnown.coords.longitude,
      };

      setCurrentLocation(fallbackCoordinates);
      setLoading(false);

      console.warn('Using last known position (may be stale):', fallbackCoordinates);
      return { success: true, location: fallbackCoordinates, isFallback: true };
    }
  } catch (fallbackError) {
    console.error('Last known position also unavailable:', fallbackError);
  }
}
```

#### D. Added Retry Mechanism
If no fallback available, prompt user with Retry/Cancel:

```javascript
setLoading(false);
return new Promise((resolve) => {
  Alert.alert(
    'Location Timeout',
    'Unable to get your current location. This can happen indoors or in areas with poor GPS signal.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => resolve({ success: false, error: 'Location timeout - user cancelled' }),
      },
      {
        text: 'Retry',
        onPress: async () => {
          console.info('Retrying location request after timeout');
          const retryResult = await requestLocation();
          resolve(retryResult);
        },
      },
    ]
  );
});
```

#### E. Updated Return Type
Now returns `isFallback` flag for stale coordinates:

```javascript
// Fresh coordinates
{ success: true, location: {lat, lng} }

// Fallback (last-known) coordinates
{ success: true, location: {lat, lng}, isFallback: true }

// Failure
{ success: false, error: string }
```

---

## Key Changes

### Firestore Transport Fix
- **Import:** `getFirestore` → `initializeFirestore`
- **Settings:** Added `experimentalForceLongPolling: true` and `experimentalAutoDetectLongPolling: true`
- **Compatibility:** Ensures React Native/Expo can connect to Firestore without WebChannel failures
- **Backward Compatible:** Existing code continues to work, no API changes

### Location Timeout Fix
- **Timeout:** 10s → 15s (configurable via constant)
- **Strategy:** Manual Promise.race → Built-in Expo timeout + maximumAge
- **Fallback:** Added `getLastKnownPositionAsync` with 1-minute max age, 500m accuracy
- **Retry:** User can tap "Retry" instead of being stuck in error loop
- **Loading State:** Guaranteed to clear on all exit paths (success, fallback, retry, error)
- **Console Logging:**
  - `console.warn('Location request timed out, attempting fallback...')`
  - `console.warn('Using last known position (may be stale): {...}')`
  - `console.info('Retrying location request after timeout')`

---

## Files Modified

### `frontend/src/config/firebase.js`
- **Lines Changed:** 3, 23-30
- **Changes:**
  - Import `initializeFirestore` instead of `getFirestore`
  - Initialize with long-polling settings
  - Added inline comment explaining fix

### `frontend/src/context/LocationContext.js`
- **Lines Changed:** 15-17 (added constants), 64-151 (rewrote location fetch logic)
- **Changes:**
  - Added `LOCATION_TIMEOUT` and `MAX_LOCATION_AGE` constants
  - Removed manual `Promise.race` timeout
  - Used built-in Expo timeout and maximumAge options
  - Added nested try-catch for timeout detection
  - Implemented `getLastKnownPositionAsync` fallback
  - Added Alert-based retry mechanism
  - Updated return type to include `isFallback` flag
  - Ensured `setLoading(false)` on all exit paths

**Total changes:** ~90 lines added/modified across 2 files

---

## Testing Checklist

### ✅ Firestore Transport (Baseline)
- [ ] Login → No "client is offline" errors on network-connected device
- [ ] Registration → Firestore write succeeds
- [ ] Session creation → Firestore writes succeed
- [ ] Console shows: `✅ Firebase initialized successfully` (no transport errors)

### ✅ Location - Good GPS Signal
- [ ] Tap "Invite Someone" → Coordinates fetched within 5-10s
- [ ] Console shows fresh coordinates, no fallback warnings
- [ ] Loading spinner clears properly
- [ ] Second tap → Uses cached coordinates (maximumAge)

### ✅ Location - Slow GPS (Indoors/Low Signal)
- [ ] Tap CTA in building/basement → Wait up to 15s
- [ ] If timeout: Console shows "attempting fallback to last known position"
- [ ] If last-known exists: Returns coordinates with `isFallback: true`
- [ ] Console shows: `Using last known position (may be stale): {...}`
- [ ] Loading spinner clears, user can proceed

### ✅ Location - Timeout with No Fallback
- [ ] Fresh device with no location history → Timeout after 15s
- [ ] Alert displays: "Location Timeout" with Retry/Cancel buttons
- [ ] Tap "Cancel" → Returns `{ success: false }`
- [ ] Tap "Retry" → Restarts location request (console shows "Retrying...")
- [ ] After retry with good signal → Succeeds

### ✅ Location - Permission Denied
- [ ] Deny permission → Alert shows "Open Settings" option
- [ ] Tap "Open Settings" → Opens iOS/Android settings
- [ ] Grant permission in settings, return to app
- [ ] Tap CTA again → Location fetched successfully

### ✅ Error Cases
- [ ] Location services disabled → Alert with settings link
- [ ] Invalid coordinates → Backend rejects (session endpoint validation)
- [ ] Network unavailable → Timeout fallback or retry prompt

---

## Edge Cases Handled

### Firestore Transport
1. **WebChannel unavailable** → Falls back to long-polling automatically
2. **React Native WebSocket limitations** → Bypassed entirely with forced long-polling
3. **Intermittent connectivity** → Long-polling more resilient than streaming
4. **Existing offline fallbacks** → Still work (AuthContext fallback profile remains)

### Location Timeout
1. **Slow GPS acquisition (indoors)** → 15s timeout, fallback to last-known position
2. **No location history** → Retry prompt with user-friendly message
3. **User cancels retry** → Graceful failure, no stuck loading state
4. **User retries successfully** → Fresh coordinates fetched
5. **Stale fallback coordinates** → Flagged with `isFallback: true` for caller awareness
6. **Permission revoked mid-use** → Handled by existing permission checks
7. **Location services disabled** → Alert with settings redirect

---

## Potential Future Enhancements

### Firestore Transport
1. **Transport Metrics** → Log which transport is being used (auto-detect vs forced)
2. **Conditional Long-Polling** → Only force on React Native, use WebChannel on web

### Location Timeout
1. **HomeScreen UI Enhancement** → Show subtle hint when using fallback coordinates
   ```javascript
   const result = await requestLocation();
   if (result.isFallback) {
     console.info('Using approximate location - move outside for better accuracy');
   }
   ```

2. **Background Refresh** → If `isFallback` is true, attempt silent refresh when GPS improves

3. **Accuracy Display** → Show accuracy radius to user when using fallback

4. **Configurable Timeouts** → Allow user to set timeout preference (fast/accurate toggle)

---

## Time Spent

- Reading TF document & browser agent suggestion: ~5 minutes
- Implementing Firestore transport fix: ~5 minutes
- Implementing location timeout + fallback + retry: ~20 minutes
- Testing logic review: ~5 minutes
- Documentation: ~15 minutes
- **Total:** ~50 minutes

---

## Questions/Notes

### Firestore Transport
1. **Should we log which transport is active?** (For debugging purposes)
2. **Auto-detect vs forced?** Current implementation forces long-polling; could switch to auto-detect only if needed
3. **Performance impact?** Long-polling has slightly higher latency than WebChannel but is more reliable

### Location Timeout
1. **Should we show UI feedback for fallback coordinates?** (Currently console-only)
2. **1-minute max age for fallback - acceptable?** (Could be 5 minutes for less-critical features)
3. **Should we track accuracy and warn if > 100m?** (Fallback allows up to 500m)

---

## Browser Agent Credit

The Firestore transport fix was identified by the user's browser agent, which correctly diagnosed:
- WebChannel transport failures in React Native
- Need for long-polling or auto-detect configuration
- Root cause of "client is offline" despite network connectivity

This is a critical architectural fix that improves reliability across all Firestore operations (auth, sessions, etc).

---

**End of TF Log**

# Targeted Fix – Sprint 02 – Location Request Timeout

**Issue Summary**
- When tapping “Invite Someone” or “Start Browse,” Expo logs `Error: Location request timed out` and the CTA never receives coordinates.
- The failure originates in `LocationContext.requestLocation()` where our manual 10s timeout via `Promise.race` rejects before a GPS fix arrives.
- Users see repeated alerts and cannot progress to session creation while the device acquires a slower GPS lock (common indoors/low-signal environments).

**Desired Outcome**
- Location requests should gracefully handle slow GPS acquisition: either deliver coordinates via a fallback or present a guided retry that works.
- The UI must exit the loading state and allow a quick retry without dismissing the user into an error loop.
- Console should capture the timeout event for debugging, but the user experience should stay smooth.

**Implementation Steps**
1. **Refine `requestLocation` timing logic** in `frontend/src/context/LocationContext.js`:
   - Remove the external `Promise.race` and instead pass `timeout` and `maximumAge` options directly to `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, timeout: 15000, maximumAge: 5000 })`.
   - Add a configurable `fallbackTimeout` constant so we can tweak it quickly if QA still hits timeouts.

2. **Add fallback for timeouts**:
   - When `getCurrentPositionAsync` throws a timeout error (`error.code === 'E_LOCATION_TIMEOUT'` or message includes `timed out`), attempt `Location.getLastKnownPositionAsync()`.
   - If last-known coordinates exist, return them (flag as `isStale: true` in the response so callers can decide whether to accept or prompt for retry).
   - If no fallback exists, surface an Alert with buttons: `Retry` (re-invokes `requestLocation`) and `Cancel` (dismisses gracefully).

3. **Improve loading state management**:
   - Ensure `setLoading(false)` runs in every exit path (timeout fallback, retry prompt, generic error) to unblock the UI.
   - When returning stale coordinates, still clear `loading` so buttons re-enable.

4. **Return richer result to callers**:
   - Update the resolved object to `{ success: true, location, isFallback?: boolean }` so `HomeScreen` can display a subtle hint if we used cached data.
   - Maintain `{ success: false, error }` signature for failure paths.

5. **Console/Warn messaging**:
   - Log `console.warn('Location request timed out, using last known position')` when fallback applies.
   - Log `console.info('Retrying location request after timeout')` if the user taps retry, to aid QA traceability.

6. **Update `HomeScreen` CTA handlers** (if needed):
   - If `isFallback` is true, consider showing a one-line toast or console info reminding the user to grant better GPS signal. (Keep UI impact minimal for this TF; tone can be console-only if time is tight.)

**Testing Instructions**
- **Baseline**: With good GPS, confirm the first tap returns live coordinates without warnings.
- **Slow signal simulation**: Enable Airplane Mode briefly, disable it, and immediately tap the CTA indoors to trigger slower GPS. Expect either a longer wait or fallback usage without repeated alerts.
- **Timeout retry**: Force another timeout (e.g., leave Airplane Mode on) and choose `Retry`—loading spinner should reset and allow a second attempt once connectivity returns.
- **Fallback verification**: When `getLastKnownPositionAsync` supplies coordinates, ensure they propagate to the session flow, and the console logs the fallback warning.

**References**
- Current implementation: `../NS-CB/frontend/src/context/LocationContext.js`
- Error reported by user on 2025-10-05: `Location request timed out`
- Expo Location API docs: https://docs.expo.dev/versions/latest/sdk/location/

---

> Goal: make location acquisition resilient so invite/session flows stay usable even in patchy GPS environments.

# S-203 Deep Linking Implementation Log

**Date:** 2025-10-06
**Sprint:** Sprint 02 - Home, Location & Session Infrastructure
**Task:** S-203 (Auth Gate on Invite/Join Actions)
**Status:** ✅ Complete - Ready for device testing

---

## Summary

Implemented deep link infrastructure and auth gates for guest join flow:
- Deep link schemes configured (`nightswipe://` and `https://nightswipe.app`)
- React Navigation deep linking setup with URL parsing
- Pending join code storage system using AsyncStorage
- Auth gate logic with telemetry
- Post-authentication navigation handling

All functionality implemented and ready for physical device testing. Lobby screen navigation will be added in Sprint 03.

---

## Components Implemented

### Frontend (5 files created/modified)

1. **`app.json`** - UPDATED
   - Added `scheme: "nightswipe"` for custom URL scheme
   - iOS: Added `bundleIdentifier` and `associatedDomains` for universal links
   - Android: Added `package` and `intentFilters` for App Links
   - Configured path prefix `/join` for invite links

2. **`package.json`** - UPDATED (npm install)
   - Added `expo-linking` (^8.0.8) for URL parsing
   - Added `@react-native-async-storage/async-storage` (^1.24.0) for pending code storage

3. **`src/utils/deepLinkStorage.js`** - NEW
   - `storePendingJoinCode(joinCode)` - Store join code when unauthenticated user opens link
   - `getPendingJoinCode()` - Retrieve and clear pending code (one-time use)
   - `clearPendingJoinCode()` - Manual clear (e.g., user cancelled)
   - `hasPendingJoinCode()` - Check if pending code exists
   - Uses AsyncStorage with key `@nightswipe_pending_join_code`

4. **`App.js`** - UPDATED
   - Added deep link configuration with prefixes:
     - `nightswipe://` (custom scheme)
     - `https://nightswipe.app` (universal links)
     - `http://nightswipe.app` (testing)
   - Added `handleDeepLink()` function:
     - Parses URLs using `Linking.parse()`
     - Extracts join code from `/join?code=` URLs
     - Checks auth state and routes accordingly:
       - Not authenticated: stores code, shows login prompt
       - Authenticated: shows ready message (lobby nav in Sprint 03)
   - Added `useEffect` hooks for:
     - Initial URL handling (cold start)
     - URL event listener (app already running)
   - Added `navigationRef` for programmatic navigation (Sprint 03)

5. **`src/context/AuthContext.js`** - UPDATED
   - Added `pendingJoinCode` state
   - Added `checkPendingJoinCode()` function:
     - Called after successful login/registration
     - Retrieves pending join code from storage
     - Alerts user they can join session
     - Sets `pendingJoinCode` state for app use
   - Updated `register()` to call `checkPendingJoinCode()` after auth
   - Updated `login()` to call `checkPendingJoinCode()` after auth
   - Updated `logout()` to clear `pendingJoinCode` state
   - Exported `pendingJoinCode` in context value

6. **`src/screens/HomeScreen.js`** - UPDATED
   - Added auth gate check in `handleInvite()`:
     - Verifies `currentUser` exists before invite action
     - Logs telemetry: `[TELEMETRY] Unauthorized invite attempt` if fails
     - Logs telemetry: `[TELEMETRY] Invite action initiated by user: {uid}` on success
   - Added documentation comment explaining S-203 implementation
   - Note: Screen is already auth-only (only shown when `currentUser` exists)

---

## Dependencies Added

**Frontend:**
- `expo-linking` (^8.0.8) - URL parsing and deep link handling
- `@react-native-async-storage/async-storage` (^1.24.0) - Persistent storage for pending join codes

---

## Acceptance Criteria Status

### S-203 (Auth Gate on Invite/Join Actions)

- [x] **Unauthenticated home state:**
  - "Invite" button not accessible (HomeScreen only shows when authenticated)
  - Auth gate in `handleInvite()` with telemetry and error message

- [x] **Guest deep link flow:**
  - Guest opens invite URL: `nightswipe://join?code={code}` or `https://nightswipe.app/join?code={code}`
  - If not authenticated: stores join code, shows login prompt
  - After successful auth: retrieves code, shows join prompt (navigation to lobby in Sprint 03)
  - Join code preserved through auth flow via AsyncStorage

- [x] **Authenticated invite flow:**
  - "Invite" button visible and enabled (when authenticated)
  - Telemetry logs invite actions

- [x] **Telemetry logs unauthorized invite attempts:**
  - Console warnings with `[TELEMETRY]` prefix
  - Tracks user ID on successful invite actions

- [x] **Deep link configuration:**
  - URL scheme: `nightswipe://`
  - Universal links: `https://nightswipe.app/join/{code}`
  - iOS: Associated domains configured
  - Android: Intent filters configured with autoVerify

- [x] **Pending link storage:**
  - AsyncStorage used for persistence
  - One-time retrieval (auto-clears after read)
  - Error handling for storage failures

---

## How It Works

### Guest Join Flow (Deep Link Path)

1. **User opens invite link** (e.g., `nightswipe://join?code=ABC123`)
   - App launches or comes to foreground
   - `Linking.getInitialURL()` or `Linking.addEventListener('url')` captures URL

2. **App.js handles deep link:**
   - Parses URL to extract join code: `ABC123`
   - Checks `currentUser` state

3. **If NOT authenticated:**
   - Stores join code in AsyncStorage: `storePendingJoinCode('ABC123')`
   - Shows alert: "Please log in or create an account to join this session"
   - User proceeds to Login or Register screen

4. **After successful authentication:**
   - `AuthContext.login()` or `register()` calls `checkPendingJoinCode()`
   - Retrieves stored code: `getPendingJoinCode()` returns `'ABC123'`
   - Shows alert: "You can now join the session with code: ABC123"
   - **Sprint 03:** Will navigate to lobby screen with `ABC123`

5. **If already authenticated:**
   - Shows alert: "Ready to join session with code: ABC123"
   - **Sprint 03:** Will immediately navigate to lobby screen

### Invite Action Flow (Auth Gate)

1. **User taps "Invite Someone" button**
   - `handleInvite()` checks `currentUser`

2. **If authenticated:**
   - Logs: `[TELEMETRY] Invite action initiated by user: {uid}`
   - Proceeds to location request
   - **Sprint 03:** Will create session and show invite modal

3. **If NOT authenticated (edge case):**
   - Logs: `[TELEMETRY] Unauthorized invite attempt - user not authenticated`
   - Shows alert: "Please log in to invite others to a session"
   - Blocks action

---

## URL Format Specification

### Supported URL Formats

```
# Custom scheme (works immediately without server setup)
nightswipe://join?code=ABC123

# Universal links (iOS, requires server setup + Apple verification)
https://nightswipe.app/join?code=ABC123

# HTTP testing (Android, requires server setup)
http://nightswipe.app/join?code=ABC123
```

### URL Parsing

**Input:** `nightswipe://join?code=ABC123`

**Parsed Object:**
```javascript
{
  scheme: "nightswipe",
  hostname: null,
  path: "join",
  queryParams: {
    code: "ABC123"
  }
}
```

**Input:** `https://nightswipe.app/join?code=ABC123`

**Parsed Object:**
```javascript
{
  scheme: "https",
  hostname: "nightswipe.app",
  path: "join",
  queryParams: {
    code: "ABC123"
  }
}
```

---

## Testing Plan

### Device Testing Required (Sprint 02 Complete)

**Custom Scheme Testing:**
- [ ] iOS: Open `nightswipe://join?code=TEST123` from Safari
- [ ] iOS: App launches and shows login prompt
- [ ] iOS: After login, join code is retrieved and displayed
- [ ] Android: Open `nightswipe://join?code=TEST123` from browser
- [ ] Android: App launches and shows login prompt
- [ ] Android: After login, join code is retrieved and displayed

**Universal Links Testing:**
- [ ] iOS: Open `https://nightswipe.app/join?code=TEST123` from Safari
  - Requires server setup: `.well-known/apple-app-site-association` file
  - Requires Apple verification (can take 24 hours)
- [ ] Android: Open `https://nightswipe.app/join?code=TEST123` from browser
  - Requires server setup: `.well-known/assetlinks.json` file
  - Requires Google verification

**Auth Gate Testing:**
- [ ] Logged out: Attempt to access invite button (should not be possible)
- [ ] Logged in: Tap invite button, verify telemetry logs
- [ ] Force logout mid-flow: Verify state is cleared

**Pending Code Flow:**
- [ ] Open join link while logged out
- [ ] Register new account
- [ ] Verify join code alert appears after registration
- [ ] Open join link while logged out
- [ ] Log in to existing account
- [ ] Verify join code alert appears after login
- [ ] Open join link while logged in
- [ ] Verify immediate join prompt (no storage needed)

### Automated Testing (Future)

- [ ] Unit tests for `deepLinkStorage.js` utilities
- [ ] Integration tests for deep link handling in App.js
- [ ] Mock tests for auth gate logic in HomeScreen

---

## Known Limitations

1. **Lobby screen not implemented yet:**
   - Join code retrieval works, but navigation to lobby deferred to Sprint 03
   - Currently shows alerts with join code for testing

2. **Universal links require server setup:**
   - iOS: Needs `.well-known/apple-app-site-association` hosted at `https://nightswipe.app/`
   - Android: Needs `.well-known/assetlinks.json` hosted at `https://nightswipe.app/`
   - Verification can take 24+ hours for iOS

3. **Custom scheme works immediately:**
   - `nightswipe://` works without server setup
   - Good for development and testing
   - Less user-friendly than universal links (requires app install first)

4. **Telemetry is console-only:**
   - `[TELEMETRY]` logs to console.log/console.warn
   - No analytics service integration yet (Firebase Analytics, Amplitude, etc.)

---

## Sprint 03 Integration Points

When implementing S-402 (Invite Flow UI & Lobby States):

1. **Update `handleDeepLink()` in App.js:**
   - Replace alert with navigation: `navigationRef.current?.navigate('Lobby', { joinCode })`
   - Add lobby screen to Stack.Navigator

2. **Update `checkPendingJoinCode()` in AuthContext.js:**
   - Replace alert with navigation callback or event
   - Or pass navigation ref to context

3. **Create LobbyScreen component:**
   - Accept `joinCode` as route param
   - Call `POST /session/:id/join` backend endpoint
   - Display lobby state (host waiting, guest joining, etc.)

4. **Update `handleInvite()` in HomeScreen.js:**
   - Replace console.log with: `navigation.navigate('InviteModal')`
   - Create InviteModal component

---

## File Structure

```
frontend/
├── app.json (deep link config)
├── package.json (dependencies)
├── App.js (deep link handling)
└── src/
    ├── context/
    │   └── AuthContext.js (pending code checks)
    ├── screens/
    │   └── HomeScreen.js (auth gate)
    └── utils/
        └── deepLinkStorage.js (AsyncStorage utilities) [NEW]
```

---

## Technical Notes

### Why AsyncStorage over SecureStore?

- **SecureStore:** For sensitive data (tokens, passwords)
- **AsyncStorage:** For non-sensitive temporary data (join codes)
- Join codes are short-lived (30 min session timeout) and not security-critical
- AsyncStorage is simpler and more performant for this use case

### Why One-Time Retrieval?

`getPendingJoinCode()` auto-clears the stored code after reading to:
- Prevent users from accidentally joining old sessions
- Avoid stale code confusion after logout/login cycles
- Match expected user flow: link → auth → join (one-time action)

### Deep Link Priority

React Navigation tries prefixes in order:
1. `nightswipe://` (custom scheme - always works)
2. `https://nightswipe.app` (universal links - requires server setup)
3. `http://nightswipe.app` (testing only)

If universal links fail (no server setup), custom scheme still works.

---

## Architecture Decisions

### Decision: Use AsyncStorage for Pending Join Codes
**Context:** Need to persist join code while user authenticates
**Options:**
  - A) AsyncStorage (simple key-value)
  - B) SecureStore (encrypted)
  - C) In-memory only (lost on app close)

**Chosen:** Option A (AsyncStorage)

**Rationale:**
- Join codes are temporary (30 min session expiry)
- Not security-sensitive (backend validates session access)
- Simple one-time storage/retrieval pattern
- SecureStore overkill for this use case

**Impact:** Join codes persist across app restarts until retrieved once

---

### Decision: Alert-Based Join Prompts (Temporary)
**Context:** Need to notify user of pending join after auth
**Options:**
  - A) Alert dialog (simple, no new screens)
  - B) Toast notification (subtle, might be missed)
  - C) Navigate directly to lobby (Sprint 03 dependency)

**Chosen:** Option A (Alert dialog) for Sprint 02

**Rationale:**
- Lobby screen not implemented yet (Sprint 03)
- Alert ensures user sees join code (testing visibility)
- Easy to replace with navigation in Sprint 03
- No new UI components needed

**Impact:** Temporary UX; will be replaced with lobby navigation in Sprint 03

---

### Decision: Deep Link Handling in App.js (Not HomeScreen)
**Context:** Where to place deep link listener logic
**Options:**
  - A) App.js (top-level, before auth check)
  - B) HomeScreen (inside authenticated screen)
  - C) AuthContext (in auth provider)

**Chosen:** Option A (App.js)

**Rationale:**
- Deep links must work before authentication
- Need access to navigation ref for all screens
- Keeps HomeScreen focused on UI/UX
- Matches React Navigation docs pattern

**Impact:** Centralized deep link handling, works for both auth and unauth users

---

## Telemetry Events Logged

| Event | Log Level | Message | Context |
|-------|-----------|---------|---------|
| Deep link received | `console.log` | `📱 Deep link received: {url}` | Any deep link opened |
| Join code extracted | `console.log` | `📱 Join code extracted: {code}` | Join link parsed |
| User not authenticated | `console.log` | `🔐 User not authenticated - storing join code` | Join link, no auth |
| User authenticated | `console.log` | `✅ User authenticated - ready to join session: {code}` | Join link, with auth |
| Pending code found | `console.log` | `✅ Found pending join code after auth: {code}` | Post-login/register |
| Unauthorized invite | `console.warn` | `[TELEMETRY] Unauthorized invite attempt - user not authenticated` | Invite button, no auth |
| Invite action | `console.log` | `[TELEMETRY] Invite action initiated by user: {uid}` | Invite button, with auth |

---

## Next Steps

1. **User: Device Testing**
   - Test deep links on physical iOS and Android devices
   - Verify custom scheme works: `nightswipe://join?code=TEST123`
   - Note: Universal links require server setup (can defer to deployment)

2. **Sprint 03: Lobby Screen**
   - Create LobbyScreen component
   - Update deep link handler to navigate to lobby
   - Replace alert with navigation call

3. **Sprint 03: Invite Modal**
   - Create InviteModal component
   - Update HomeScreen invite button to open modal
   - Generate shareable links with join codes

4. **Future: Universal Links Server Setup**
   - Host `.well-known/apple-app-site-association` (iOS)
   - Host `.well-known/assetlinks.json` (Android)
   - Configure DNS and SSL for `nightswipe.app`

---

**End of S-203 Implementation Log**

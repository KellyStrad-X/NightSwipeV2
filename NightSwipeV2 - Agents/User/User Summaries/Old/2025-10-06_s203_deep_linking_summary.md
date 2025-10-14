# S-203 – Auth Gate & Deep Link Flow (2025-10-06)

## What Changed
- Added deep link configuration (custom scheme + universal link prefixes) so the app can react to `nightswipe://join?code=` URLs from cold or warm starts (`../NS-CB/frontend/App.js:17`).
- `App.js` now parses join URLs, stores pending codes for unauthenticated users, and surfaces alerts for authenticated ones—laying the groundwork for the lobby hand-off (`../NS-CB/frontend/App.js:39`).
- Auth context keeps track of the pending join code and reminds newly logged-in users that they can jump into the waiting session (`../NS-CB/frontend/src/context/AuthContext.js:28`).
- Introduced a shared AsyncStorage helper to persist join codes through the auth flow (`../NS-CB/frontend/src/utils/deepLinkStorage.js:1`).
- HomeScreen invite handler now logs unauthorized attempts and only proceeds when the host is signed in (`../NS-CB/frontend/src/screens/HomeScreen.js:55`).
- Expo config includes the `nightswipe` scheme plus iOS/Android link associations so deep links resolve correctly on devices (`../NS-CB/frontend/app.json:10`).

## Why It Matters
- Guests who open an invite link are no longer dropped on the login screen without context—the join code survives authentication and lets us route them to the lobby next sprint.
- Auth gating keeps anonymous users from poking the invite flow while still capturing telemetry for UX review.
- With schema + prefixes set, we can test the full invite link journey on devices before building the lobby UI.

## How to Try It
1. While logged out, open `nightswipe://join?code=TEST123` (use Expo dev menu’s "Open URL"). Expect a login prompt and no crash.
2. Finish logging in—an alert should confirm the app saved `TEST123` for the upcoming lobby hand-off.
3. Repeat while already logged in; you should get an immediate alert that you’re ready to join the session.
4. Run through the invite button on HomeScreen to verify unauthorized telemetry only fires when you manually log out.

## Known Gaps
- Alerts are temporary; they’ll be replaced with real lobby navigation in Sprint 03.
- Universal links require hosting the Apple/Android association files before they’ll auto-open outside Expo.
- No automated telemetry sink yet—console logs exist, but we should wire them to analytics later.

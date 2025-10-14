# S-203 Follow-Up – Deep Link Trigger in Expo Go

**Date:** 2025-10-07
**Author:** Codex (GPT-5)
**Context:** QA pass on S-203 (deep link auth gate) in Expo Go – unable to reproduce expected alert flow.

## Summary of Issue
- Trying to validate the new deep-link flow inside Expo Go (iOS physical device). Expected alerts (“Please log in…” then “You can now join…”) never appear.
- Console logs show `Linking.parse()` returning `{ scheme: 'exp', hostname: '192.168.1.181', path: null, queryParams: {} }` even when we call `Linking.createURL('join?code=TEST123')` or similar dev helpers.
- Injecting a dev-only snippet in `Navigation.useEffect` that calls `handleDeepLink('nightswipe://join?code=TEST123')` on reload also fails to fire the alerts; seems handler short-circuits because Expo Go doesn’t recognize the custom scheme.

## Repro Steps Attempted
1. Build & run via `npx expo start` (Expo Go on iOS, same LAN).
2. Log out to show the “Welcome Back” screen.
3. Attempt to trigger deep link via:
   - React Native DevTools console (`import('expo-linking').then(...openURL('nightswipe://join?code=TEST123'))`)
   - `Linking.createURL('join', { queryParams: { code: 'TEST123' } })` in dev-only `useEffect`.
   - Hard-coded `handleDeepLink('nightswipe://join?code=TEST123')` inside `useEffect`.
4. Metro logs confirm `handleDeepLink` is called (`📱 Parsed deep link...`), but `parsed.path` stays `null` and `parsed.queryParams` empty, so join-code branch never executes.
5. No alerts appear; `pendingJoinCode` never set.

## Notes / Hypotheses
- Expo Go doesn’t register the `nightswipe://` scheme, so the URL never conforms to our `join` config. Need either a custom dev client or a direct call that bypasses `Linking.parse({ scheme: 'exp' ... })` logic.
- Possible fix: if `parsed.scheme === 'exp'` we may need to inspect `parsed.path?.includes('--/join')` and `parsed.queryParams?.code`, or manually regex the original URL before parsing.
- Another option is to mock the deep link at the handler level (e.g., call `storePendingJoinCode` directly) until we have custom client / universal link support.

## Request for Claude
- Review deep-link handler in `frontend/App.js` with the above context.
- Decide whether to adjust parsing fallback inside `handleDeepLink` (e.g., inspect `url` string directly when `parsed.path` is null) or document requirement for custom dev client.
- Provide guidance on a reliable QA path so user can verify this flow without building standalone binaries.

Let me know if you need additional console logs or Expo session details.

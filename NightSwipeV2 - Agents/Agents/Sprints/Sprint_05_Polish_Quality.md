# Sprint 05 — Maps, Polish & Quality

**Sprint Duration:** 1-2 weeks
**Sprint Goal:** Complete navigation integration, branding polish, and production-ready quality assurance
**Epic Focus:** E-07 (Maps Integration & Session Reset), E-08 (Visual Identity), E-09 (Quality & Telemetry)
**Owner:** Claude (Code Implementor)
**PM:** Codex

---

## Sprint Objectives

1. Implement deep links to Apple/Google Maps
2. Build session restart and deck refresh functionality
3. Add splash screen and logo animations
4. Ensure robust error handling and offline states
5. Implement analytics and logging baseline
6. Polish CTA microinteractions (if time permits)

---

## Sprint Backlog

### S-701 — Deep Link to Apple/Google Maps
- **Epic:** E-07
- **Priority:** P0 (Launch Blocking)
- **Status:** Planned
- **Estimated Effort:** 6-8 hours
- **Dependencies:** S-601 (Solo Match), S-602 (Host/Guest Match)

**Goal:** Match screen offers platform-appropriate link (Apple Maps iOS, Google Maps Android). Link includes place name/address and opens successfully from device tests. Handle failure cases with fallback copy.

**Acceptance Criteria:**
- [ ] **iOS:** "Maps Link" button opens Apple Maps
  - URL format: `maps:///?q={place_name}&ll={lat},{lng}`
  - Fallback to web if Apple Maps not installed: `https://maps.apple.com/?q={place_name}&ll={lat},{lng}`
- [ ] **Android:** "Maps Link" button opens Google Maps
  - URL format: `geo:{lat},{lng}?q={place_name}`
  - Fallback to web: `https://www.google.com/maps/search/?api=1&query={lat},{lng}`
- [ ] **Place data included:**
  - Place name (URL-encoded)
  - Latitude and longitude (from Google Places data)
- [ ] **Error Handling:**
  - If maps app fails to open → Show toast: "Unable to open maps. Try again."
  - Provide web fallback automatically
- [ ] **Testing:**
  - Manual test on iOS device → Apple Maps opens
  - Manual test on Android device → Google Maps opens
  - Test on simulator/emulator → Web fallback works

**Technical Notes:**
- Use `Linking.openURL()` from React Native
- Platform detection: `Platform.OS === 'ios'` vs `'android'`
- URL encoding: Use `encodeURIComponent()` for place name
- Check if URL can be opened: `Linking.canOpenURL(url)` before opening
- Example implementation:
  ```javascript
  const openMaps = async (place) => {
    const { name, lat, lng } = place;
    const encodedName = encodeURIComponent(name);

    const url = Platform.select({
      ios: `maps:///?q=${encodedName}&ll=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${encodedName}`
    });

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to web
      const webUrl = Platform.select({
        ios: `https://maps.apple.com/?q=${encodedName}&ll=${lat},${lng}`,
        android: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      });
      await Linking.openURL(webUrl);
    }
  };
  ```

**Deliverables:**
- Maps link button on Match screen
- Platform-specific URL generation
- Fallback logic
- Error handling with toast/alert
- Manual test on real devices (iOS and Android)
- QA checklist documenting device matrix

---

### S-702 — Session Restart & Deck Refresh
- **Epic:** E-07
- **Priority:** P0 (Launch Blocking)
- **Status:** Planned
- **Estimated Effort:** 8-12 hours
- **Dependencies:** S-601 (Solo Match), S-602 (Host/Guest Match)

**Goal:** Restart clears prior swipes, requests new deck seed, and returns both users to initial state without new invite. Solo restart uses fresh random quota. Ensure old sessions marked complete to prevent duplicate matches.

**Acceptance Criteria:**
- [ ] **Restart Button:**
  - Available on Match screen (solo and two-user)
  - Label: "Restart" or "Find Another Place"
  - Tapping triggers restart flow
- [ ] **Solo Restart:**
  - Clear all local swipe state
  - Generate new random quota (3-6)
  - Fetch new deck from backend with new seed
  - Return to swipe deck screen
  - Swipe counter resets to 0
- [ ] **Two-User Restart:**
  - When host or guest taps "Restart" → Notify other user
  - Both users see "Starting new deck…" message
  - Backend clears swipes for this session
  - Backend generates new deck seed
  - Fetch new deck (same host location, new seed)
  - Both navigate to swipe deck
  - Session status remains `active` (not `completed`)
- [ ] **Backend Session Reset:**
  - Endpoint: `POST /session/:id/restart`
  - Clears all swipes for session
  - Generates new deck_seed
  - Marks old deck as `archived` (optional for analytics)
  - Returns new deck
- [ ] **Analytics:**
  - Log restart event: `{ session_id, user_id, restart_count }`
  - Track number of restarts per session

**Technical Notes:**
- Restart should not require new invite or session creation
- Old swipes can be soft-deleted or marked `archived` (keep for analytics)
- New deck seed: `${session_id}_${timestamp}` for uniqueness
- Notify other user via polling or WebSocket (prefer polling for MVP)
- Navigation: Reset navigation stack to swipe deck (avoid back button issues)

**API Endpoint Spec:**
```
POST /session/:id/restart
Headers: Authorization: Bearer <token>

Response (200 OK):
{
  "session_id": string,
  "new_deck_seed": string,
  "deck": [ /* new array of places from S-501 */ ],
  "restart_count": number  // total restarts for this session
}

Side Effects:
- Swipes table: Archive or delete swipes for this session
- Session table: Update deck_seed, increment restart_count
```

**Deliverables:**
- Restart button on Match screen
- Backend restart endpoint
- Frontend restart flow (solo and two-user)
- Navigation reset logic
- Analytics event logging
- Manual test: Restart multiple times, verify new decks

---

### S-801 — Splash & Logo Animation
- **Epic:** E-08
- **Priority:** P1 (MVP Differentiator)
- **Status:** Planned
- **Estimated Effort:** 6-10 hours
- **Dependencies:** S-301 (Home Screen)

**Goal:** Splash screen shows glowing background and moon swipe animation. Transition into home screen without jank on both platforms.

**Acceptance Criteria:**
- [ ] **Splash Screen:**
  - Shows on app launch
  - Background: Dark gradient (per branding)
  - Logo: Full moon → swipes left off screen
  - Crescent moon "NightSwipe" logo fades in (storyboard lines 13-19)
  - Glowing effect behind logo (subtle radial gradient or shadow)
- [ ] **Animation Sequence:**
  1. Full moon logo appears at center (0s)
  2. Moon swipes left off screen (0.5s - 1s)
  3. Crescent "NightSwipe" logo fades in (1s - 1.5s)
  4. Hold for 0.5s
  5. Transition to Home screen (fade or slide)
- [ ] **Total Duration:** ~2-2.5 seconds (not too long)
- [ ] **Performance:**
  - Animation runs smoothly at 60fps
  - No jank or stuttering
  - Fast enough to not annoy users on repeat launches
- [ ] **Skip Option:**
  - Tap anywhere to skip animation (optional but recommended)
- [ ] **Platform Consistency:**
  - Animation looks identical on iOS and Android
  - Respects system dark mode (if applicable)

**Technical Notes:**
- Implementation options:
  - **Option 1:** Lottie animation (export from After Effects)
    - Pros: Smooth, scalable, matches design perfectly
    - Cons: Adds dependency, file size
  - **Option 2:** React Native Animated API
    - Pros: No extra dependencies, full control
    - Cons: More manual work
  - **Option 3:** Reanimated 2
    - Pros: Better performance, runs on UI thread
    - Cons: Learning curve
- Use Expo SplashScreen API to control transition timing
- Logo assets: SVG or PNG (high-res for both @2x and @3x)
- Glow effect: `shadowColor`, `shadowOpacity`, `shadowRadius` (iOS) + `elevation` (Android)

**Asset Requirements:**
- Full moon logo (SVG or PNG)
- Crescent moon "NightSwipe" logo (SVG or PNG)
- Background gradient (can be code-based or image)
- Check `./Misc/Branding-Logos/` for existing assets

**Deliverables:**
- Splash screen component
- Logo animation (swipe + fade)
- Glow effect styling
- Transition to Home screen
- Skip on tap functionality
- Manual test on iOS and Android
- Performance profiling (ensure 60fps)

---

### S-901 — Error Handling & Offline States
- **Epic:** E-09
- **Priority:** P0 (Launch Blocking)
- **Status:** Planned
- **Estimated Effort:** 10-14 hours
- **Dependencies:** S-503 (Swipe Submission), S-403 (Session Lifecycle)

**Goal:** Friendly error UI for failed deck fetch, swipe submission, session expiration. Retry affordances logged; analytics records failure category. Network-offline mode communicates limitations clearly.

**Acceptance Criteria:**
- [ ] **Network Offline Detection:**
  - Use `@react-native-community/netinfo` to detect connectivity
  - Show offline banner when disconnected: "You're offline. Some features won't work."
  - Banner auto-dismisses when reconnected
- [ ] **Deck Fetch Errors:**
  - Google Places API fails → "Unable to load places. Try again."
  - No results found → "No places found nearby. Try expanding your search."
  - Retry button triggers new fetch
- [ ] **Swipe Submission Errors:**
  - Network error during swipe → Queue locally, retry in background
  - Server error (500) → "Something went wrong. We'll retry automatically."
  - Show subtle indicator if swipes are pending sync
- [ ] **Session Expiration:**
  - Session expired (410) → "This session has expired."
  - CTA: "Go Home" returns to home screen
- [ ] **Auth Errors:**
  - Token expired (401) → "Your session expired. Please log in again."
  - Auto-redirect to login screen
- [ ] **Maps Link Errors:**
  - Can't open maps → Toast: "Unable to open maps. Try again."
  - Automatically attempt web fallback
- [ ] **Generic Errors:**
  - Unhandled errors → "Something went wrong. Please restart the app."
  - Log error to backend for debugging
- [ ] **Retry Mechanisms:**
  - Deck fetch: Manual retry button
  - Swipe submission: Automatic retry (3 attempts)
  - Session polling: Exponential backoff
- [ ] **Analytics:**
  - Log all errors: `{ error_type, error_message, screen, user_id, session_id }`
  - Track retry attempts and success rates

**Technical Notes:**
- Error boundary: Wrap app in React ErrorBoundary component
- Centralized error handler: Create utility function for consistent error display
- Toast library: Use `react-native-toast-message` or similar
- NetInfo listener:
  ```javascript
  import NetInfo from '@react-native-community/netinfo';

  NetInfo.addEventListener(state => {
    setIsOffline(!state.isConnected);
  });
  ```
- Retry with exponential backoff:
  - 1st retry: immediate
  - 2nd retry: 2 seconds
  - 3rd retry: 5 seconds
- Sentry or similar for production error tracking (optional for MVP)

**Error Message Tone:**
- Friendly, concise, actionable
- Examples from UX guidelines (Overall Spec §9)
- Avoid technical jargon

**UI Components:**
- OfflineBanner
- ErrorModal
- RetryButton
- ToastMessage

**Deliverables:**
- Network offline detection and banner
- Error handling for all critical flows
- Retry mechanisms
- Error logging to backend
- Error analytics events
- Manual test: Simulate offline, API failures, session expiration
- Error handling documentation

---

### S-902 — Analytics & Logging Baseline
- **Epic:** E-09
- **Priority:** P1 (MVP Differentiator)
- **Status:** Planned
- **Estimated Effort:** 8-12 hours
- **Dependencies:** S-503 (Swipes), S-602 (Matches)

**Goal:** Instrument key events: registration success, invite sent, deck started, match achieved, restart triggered. Logs available for debugging (client + server) without leaking PII. Document dashboards or raw log access steps.

**Acceptance Criteria:**
- [ ] **Key Events Tracked:**
  - `user_registered`: `{ user_id, timestamp }`
  - `user_logged_in`: `{ user_id, timestamp }`
  - `session_created`: `{ session_id, host_id, timestamp }`
  - `invite_sent`: `{ session_id, host_id, timestamp }`
  - `guest_joined`: `{ session_id, guest_id, timestamp }`
  - `deck_started`: `{ session_id, user_id, deck_size, timestamp }`
  - `swipe_completed`: `{ session_id, user_id, place_id, direction, timestamp }`
  - `deck_finished`: `{ session_id, user_id, swipe_count, timestamp }`
  - `match_found`: `{ session_id, match_count, timestamp }`
  - `no_match`: `{ session_id, timestamp }`
  - `restart_triggered`: `{ session_id, user_id, restart_count, timestamp }`
  - `map_link_opened`: `{ session_id, user_id, place_id, timestamp }`
  - `error_occurred`: `{ error_type, error_message, screen, user_id, timestamp }`
- [ ] **Client-side Logging:**
  - Use lightweight analytics library (e.g., Segment, Mixpanel, or custom)
  - Events batched and sent to backend
  - No PII in logs (email, phone, etc.)
  - User ID anonymized or hashed if needed
- [ ] **Server-side Logging:**
  - All API requests logged with: endpoint, status, duration, user_id
  - Errors logged with stack traces
  - Logs stored in structured format (JSON)
  - Log levels: DEBUG, INFO, WARN, ERROR
- [ ] **Dashboards (Optional for MVP):**
  - Basic metrics: DAU, registrations, sessions created, matches found
  - Error rates by endpoint
  - Document how to access logs (e.g., AWS CloudWatch, log files)
- [ ] **Privacy:**
  - No PII in analytics events
  - Comply with data retention policies
  - Document what data is collected

**Technical Notes:**
- Analytics options:
  - **Custom:** POST events to backend `/analytics/events`
  - **Segment:** Free tier, easy integration
  - **Mixpanel:** More features, free tier available
  - **Google Analytics:** Works but more complex
- Batching: Send events in batches every 30 seconds or on app background
- Backend logging: Use Winston (Node.js) or similar
- Log storage: CloudWatch, Elasticsearch, or simple file logs
- Anonymization: Hash user IDs or use UUIDs

**API Endpoint (Custom Analytics):**
```
POST /analytics/events
Headers: Authorization: Bearer <token>
Request Body:
{
  "events": [
    {
      "event_name": string,
      "properties": object,
      "timestamp": timestamp,
      "user_id": string (optional, anonymized)
    },
    ...
  ]
}

Response (200 OK):
{
  "success": true,
  "events_received": number
}
```

**Deliverables:**
- Analytics instrumentation for key events
- Client-side event tracking
- Backend event logging endpoint
- Structured logging on server
- Privacy documentation (what's collected)
- Analytics access documentation
- Manual test: Trigger events, verify in logs

---

### S-802 — CTA & Gem Glow Microinteractions
- **Epic:** E-08
- **Priority:** P2 (Nice-to-Have)
- **Status:** Planned
- **Estimated Effort:** 6-8 hours
- **Dependencies:** S-301 (Home Screen), S-502 (Swipeable Cards)

**Goal:** Primary CTAs fade/slide per storyboard when state changes. Gem/icons have subtle glow while preserving performance.

**Acceptance Criteria:**
- [ ] **Button Transitions (Home Screen):**
  - "Start Searching" button → Fades out
  - "Invite" and "Start Browse" buttons → Fade in (storyboard lines 31-32)
  - Transition timing: 300ms fade
  - Smooth, no jank
- [ ] **Gem/Icon Glow:**
  - Primary buttons have subtle glow effect (storyboard line 23)
  - Glow pulsates gently (optional, only if performance allows)
  - Glow color: Brand color (likely moonlight blue/purple)
- [ ] **Performance:**
  - Animations run at 60fps
  - No impact on swipe gesture performance
  - Test on mid-range Android device
- [ ] **Fallback:**
  - If performance issues → Remove glow, keep basic fade
  - Document decision in Restart Brief

**Technical Notes:**
- Use Animated API or Reanimated
- Fade animation:
  ```javascript
  Animated.timing(fadeAnim, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true
  }).start();
  ```
- Glow effect: Box shadow (iOS) + elevation (Android)
- Pulsating glow: Animated loop with opacity or shadow radius
- Performance: Use `useNativeDriver: true` whenever possible

**Deliverables:**
- Button fade animations
- Glow effect styling
- Optional pulsating glow
- Performance testing
- Fallback styling if needed

**Note:** This is P2 (nice-to-have). If Sprint 05 runs long, defer this to post-MVP.

---

## Sprint Success Metrics

- [ ] All P0 items (S-701, S-702, S-901) completed and tested
- [ ] P1 items (S-801, S-902) completed or documented for post-MVP
- [ ] P2 items (S-802) completed if time permits
- [ ] Maps links work on iOS and Android
- [ ] Restart flow works for solo and two-user
- [ ] Robust error handling in place
- [ ] Analytics baseline instrumented
- [ ] Code passes linter with no errors
- [ ] MVP ready for beta testing

---

## Testing Checklist

### Manual Testing

**Maps Links (S-701):**
- [ ] iOS device → Tap "Maps Link" → Apple Maps opens with correct place
- [ ] Android device → Tap "Maps Link" → Google Maps opens with correct place
- [ ] Simulator → Tap "Maps Link" → Web fallback opens
- [ ] Invalid place data → Error toast shown

**Restart (S-702):**
- [ ] Solo mode: Tap "Restart" → New deck loads, quota reset
- [ ] Two-user: Host taps "Restart" → Guest sees "Starting new deck…"
- [ ] Both return to swipe deck with new places
- [ ] Multiple restarts work correctly
- [ ] Analytics logs restart events

**Splash (S-801):**
- [ ] Fresh app launch → Splash animation plays
- [ ] Animation smooth on iOS and Android
- [ ] Tap to skip works (if implemented)
- [ ] Transition to Home screen smooth

**Error Handling (S-901):**
- [ ] Turn off WiFi → Offline banner appears
- [ ] Turn on WiFi → Banner disappears
- [ ] Deck fetch fails → Retry button shown
- [ ] Swipe submission fails → Queued locally, retried
- [ ] Session expires → Error message, return to Home
- [ ] Token expires → Redirect to login
- [ ] Maps link fails → Toast shown, web fallback

**Analytics (S-902):**
- [ ] Register user → Event logged
- [ ] Create session → Event logged
- [ ] Swipe cards → Events logged
- [ ] Match found → Event logged
- [ ] Check backend logs → Events received
- [ ] No PII in logs

**Microinteractions (S-802):**
- [ ] "Start Searching" → Fades out
- [ ] "Invite"/"Start Browse" → Fade in
- [ ] Buttons have subtle glow
- [ ] Animations smooth

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Maps links don't work on all devices | Medium | Medium | Test early, provide web fallback, document known issues |
| Splash animation performance issues | Low | Low | Use Lottie or simplify, test on low-end devices |
| Error handling misses edge cases | Medium | High | Comprehensive testing, user feedback in beta |
| Analytics not tracking all events | Medium | Medium | Audit events, manual verification |

---

## Definition of Done

- All acceptance criteria met for S-701, S-702, S-801, S-901, S-902
- S-802 completed if time permits, otherwise documented for post-MVP
- Code committed to feature branch
- Linter passes with no errors
- All critical flows tested on iOS and Android
- Error handling verified with simulated failures
- Analytics events logging correctly
- Restart Brief updated with final session summary
- Check-in log sent to Codex (PM)
- **MVP ready for beta testing and user feedback**

---

## Post-Sprint / MVP Launch Checklist

- [ ] All Sprints 01-05 completed
- [ ] All P0 acceptance criteria met
- [ ] App tested on multiple devices (iOS and Android)
- [ ] Backend deployed to production environment
- [ ] Google Places API key configured with production quota
- [ ] Environment variables set in production
- [ ] App submitted to TestFlight (iOS) and/or Google Play Internal Testing (Android)
- [ ] Beta testers invited
- [ ] Feedback collection mechanism in place
- [ ] Known issues documented
- [ ] Post-MVP roadmap reviewed (Backlog Parking Lot)

---

## Celebration & Retrospective

After Sprint 05:
- Celebrate MVP completion! 🎉
- Hold team retrospective:
  - What went well?
  - What was challenging?
  - Lessons learned for next phase
- Gather user feedback from beta testers
- Prioritize post-MVP features from Parking Lot

---

**End of Sprint 05 Plan**

---

**🎊 End of MVP Sprint Cycle 🎊**

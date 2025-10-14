# Sprint 02 — Home, Location & Session Infrastructure

**Sprint Duration:** 1-2 weeks
**Sprint Goal:** Build home screen experience, location handling, and session management backend
**Epic Focus:** E-03 (Core Home Experience), E-04 (Host Invite & Session Management - Backend)
**Owner:** Claude (Code Implementor)
**PM:** Codex

---

## Sprint Objectives

1. Implement authenticated home screen with dynamic CTAs
2. Handle location permissions and coordinate capture
3. Build backend session create/join endpoints
4. Implement auth gates for invite/join actions

---

## Sprint Backlog

### S-301 — Home Screen State (Start Browse / Invite)
- **Epic:** E-03
- **Priority:** P0 (Launch Blocking)
- **Status:** Planned
- **Estimated Effort:** 8-12 hours
- **Dependencies:** S-202 (Login & Persistent Session)

**Goal:** Logged-out users see Login/Register CTA. Logged-in solo users see "Start Searching" primary CTA. Logged-in hosts see "Invite" and "Start Browse" with logo slide animation.

**Acceptance Criteria:**
- [ ] Home screen renders different states based on auth status
- [ ] **Logged-out state:**
  - Shows NightSwipe logo (with glow background per storyboard)
  - Displays "Login" and "Register" buttons
  - Routes to respective auth screens on tap
- [ ] **Logged-in solo state:**
  - Shows logo at center
  - Displays username (top-right per storyboard lines 61-66)
  - Primary CTA: "Start Searching" button
  - "Start Searching" tap triggers location request
- [ ] **Logged-in post-tap state:**
  - Logo slides up smoothly to header (storyboard lines 40-42)
  - Reveals "Invite" and "Start Browse" buttons
  - Animations are smooth (60fps) on both platforms
- [ ] Logo transition animations match storyboard timing
- [ ] Responsive layout works on various screen sizes

**Technical Notes:**
- Use React Navigation for screen management
- Implement Animated API or Reanimated for logo transitions
- Logo slide: translate Y from center to top over 300-400ms
- Store auth state in AuthContext from Sprint 01
- Consider skeleton loading state while checking auth

**Design Fidelity:**
- Refer to storyboard lines 13-52 for animation sequence
- Logo should have subtle glow effect (border-glow or shadow)
- Button styles: primary CTA more prominent than secondary

**Deliverables:**
- Home screen component with state management
- Logo slide animation
- Auth state integration
- Responsive styling
- Manual test on iPhone and Android device

---

### S-302 — Location Permission & Prefetch
- **Epic:** E-03
- **Priority:** P0 (Launch Blocking)
- **Status:** Planned
- **Estimated Effort:** 8-12 hours
- **Dependencies:** S-301

**Goal:** Prompt for location on first "Start Browse" or "Invite" tap with rationale text. Cache location snapshot for host session seed. Handle denied permissions gracefully.

**Acceptance Criteria:**
- [ ] First tap on "Start Searching" or "Invite" requests location permission
- [ ] Permission modal includes rationale: "NightSwipe needs your location to find nearby places"
- [ ] **Permission granted:**
  - Capture coordinates (latitude, longitude)
  - Cache coordinates locally for session
  - Proceed to next step (deck fetch or invite modal)
- [ ] **Permission denied:**
  - Show friendly message: "We need location access to show nearby places. Please enable in Settings."
  - Provide "Open Settings" button (platform-specific)
  - Disable "Start Browse" / "Invite" until permission granted
- [ ] **Permission previously granted:**
  - Skip modal, fetch coordinates immediately
  - Show loading indicator during fetch
- [ ] Handle location errors (timeout, unavailable)
- [ ] Location accuracy: prefer high accuracy (< 100m)

**Technical Notes:**
- Use Expo Location API (`expo-location`)
- Request foreground permissions only (no background for MVP)
- Permission flow:
  ```javascript
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });
  }
  ```
- Cache coordinates in app state/context (not persistent storage for MVP)
- Timeout for location fetch: 10 seconds
- Fallback: prompt user to retry if fetch fails

**Platform Considerations:**
- iOS: Ensure `NSLocationWhenInUseUsageDescription` in `app.json`
- Android: Ensure `ACCESS_FINE_LOCATION` permission in `app.json`

**Deliverables:**
- Location permission request flow
- Coordinate caching logic
- Error handling for denied/failed states
- Settings redirect functionality
- Platform-specific permission configuration
- Manual test on both platforms with denied/granted scenarios

---

### S-401 — Backend Session Create/Join Endpoints
- **Epic:** E-04
- **Priority:** P0 (Launch Blocking)
- **Status:** Planned
- **Estimated Effort:** 12-16 hours
- **Dependencies:** S-201 (Registration), Backend infrastructure

**Goal:** Create backend endpoints for session management. `POST /session` returns session data. `POST /session/:id/join` validates invite status and guest auth.

**Acceptance Criteria:**
- [ ] Endpoint: `POST /session` creates new session
- [ ] Session creation captures host user ID, location, and generates unique join code
- [ ] Response includes: `session_id`, `join_code`, `session_url`, `host_location`
- [ ] Join code is short and shareable (e.g., 6-8 alphanumeric: "PARTY7H3K9")
- [ ] Session URL format: `https://nightswipe.app/join/{join_code}`
- [ ] Endpoint: `POST /session/:id/join` allows guest to join
- [ ] Join validates:
  - Session exists and is active
  - Guest is authenticated (valid Firebase ID token)
  - Guest is not already in session
  - Session has < 2 members (MVP limit)
- [ ] Session state persisted in database with:
  - `id`, `host_id`, `host_lat`, `host_lng`, `deck_seed` (placeholder), `status`, `created_at`
- [ ] Session statuses: `pending`, `active`, `completed`, `expired`
- [ ] Endpoint: `GET /session/:id` returns session details (for lobby state)

**Technical Notes:**
- Use secure random for join code generation (crypto.randomBytes)
- Store session in **Firestore** (not PostgreSQL)
- Index on `join_code` for fast lookup (Firestore auto-indexes)
- Session creation should be idempotent (prevent duplicate creates)
- **Firebase token validation middleware** for authenticated endpoints (not JWT)
- Rate limiting: max 5 session creates per user per hour

**Firestore Schema:**
```
sessions (collection)
  └── {session_id} (auto-generated document ID)
      ├── host_id: string (Firebase UID)
      ├── join_code: string (6-8 alphanumeric, indexed)
      ├── host_lat: number
      ├── host_lng: number
      ├── deck_seed: string (for deterministic shuffle)
      ├── status: string ("pending" | "active" | "completed" | "expired")
      ├── created_at: timestamp
      ├── updated_at: timestamp
      └── session_members (subcollection)
          └── {uid} (document)
              ├── role: string ("host" | "guest")
              ├── joined_at: timestamp
```

**Backend Implementation Example:**
```javascript
// backend/src/routes/session.js
const { db } = require('../config/firebase');
const crypto = require('crypto');

// Generate unique join code
const generateJoinCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // "A3F9B21E"
};

// POST /session - Create session
router.post('/session', verifyFirebaseToken, async (req, res) => {
  const { host_lat, host_lng } = req.body;
  const hostId = req.user.uid; // From Firebase token

  const joinCode = generateJoinCode();
  const sessionRef = db.collection('sessions').doc();

  await sessionRef.set({
    host_id: hostId,
    join_code: joinCode,
    host_lat,
    host_lng,
    deck_seed: null,
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date()
  });

  // Add host as session member
  await sessionRef.collection('session_members').doc(hostId).set({
    role: 'host',
    joined_at: new Date()
  });

  res.status(201).json({
    session_id: sessionRef.id,
    join_code: joinCode,
    session_url: `https://nightswipe.app/join/${joinCode}`,
    host_location: { lat: host_lat, lng: host_lng },
    status: 'pending'
  });
});
```

**API Endpoint Specs:**
```
POST /session
Headers: Authorization: Bearer <token>
Request Body:
{
  "host_lat": number,
  "host_lng": number
}

Response (201 Created):
{
  "session_id": string (UUID),
  "join_code": string,
  "session_url": string,
  "host_location": {
    "lat": number,
    "lng": number
  },
  "status": "pending"
}

---

POST /session/:id/join
Headers: Authorization: Bearer <token>
Request Body:
{
  "join_code": string (optional, for validation)
}

Response (200 OK):
{
  "session_id": string,
  "status": "active",
  "host": {
    "id": string,
    "display_name": string
  },
  "guest": {
    "id": string,
    "display_name": string
  }
}

Error Responses:
- 400: Session full, invalid session, user already in session
- 401: Unauthorized (invalid token)
- 404: Session not found

---

GET /session/:id
Headers: Authorization: Bearer <token>

Response (200 OK):
{
  "session_id": string,
  "status": string,
  "host": { "id": string, "display_name": string },
  "guest": { "id": string, "display_name": string } | null,
  "created_at": timestamp
}
```

**Deliverables:**
- Backend session endpoints (create, join, get)
- Database migrations
- JWT authentication middleware
- Input validation
- Error handling
- Unit tests for endpoints
- API documentation (Postman collection or OpenAPI spec)

---

### S-203 — Auth Gate on Invite/Join Actions
- **Epic:** E-02
- **Priority:** P0 (Launch Blocking)
- **Status:** Planned
- **Estimated Effort:** 6-8 hours
- **Dependencies:** S-202 (Login), S-402 (Invite Flow - frontend, will be in Sprint 03)

**Goal:** Invite button hidden/disabled when unauthenticated with messaging. Guest invite deep links enforce login/register before entering lobby.

**Acceptance Criteria:**
- [ ] **Unauthenticated home state:**
  - "Invite" button not visible
  - If user somehow accesses invite flow, redirect to login with message: "Create your account to invite others"
- [ ] **Guest deep link flow:**
  - Guest opens invite URL: `nightswipe.app/join/{code}`
  - If not authenticated: redirect to Login/Register screen
  - After successful auth: redirect to session lobby
  - Session ID/join code preserved through auth flow
- [ ] **Authenticated invite flow:**
  - "Invite" button visible and enabled
  - Tapping opens invite modal (implemented in S-402)
- [ ] Telemetry logs unauthorized invite attempts
- [ ] Copy follows spec: "Create your account to join this session"

**Technical Notes:**
- Use React Navigation deep linking for invite URLs
- Configure URL scheme in `app.json`: `nightswipe://`
- Universal links for production: `https://nightswipe.app/join/{code}`
- Store pending deep link in navigation state or AsyncStorage
- After auth success, check for pending deep link and navigate
- Example flow:
  1. Guest opens link → App launches → Check auth
  2. Not authenticated → Store join code → Show Login/Register
  3. User registers/logs in → Retrieve join code → Navigate to lobby

**Deep Link Configuration:**
```json
// app.json
{
  "expo": {
    "scheme": "nightswipe",
    "ios": {
      "associatedDomains": ["applinks:nightswipe.app"]
    },
    "android": {
      "intentFilters": [{
        "action": "VIEW",
        "data": [{ "scheme": "https", "host": "nightswipe.app" }]
      }]
    }
  }
}
```

**Deliverables:**
- Auth gate logic on Home screen
- Deep link configuration
- Deep link handling in navigation
- Pending link storage mechanism
- Telemetry for unauthorized attempts
- Manual test: Send invite link via SMS, open on unauthenticated device

---

## Sprint Success Metrics

- [ ] All P0 items (S-301, S-302, S-401, S-203) completed and tested
- [ ] Home screen dynamically responds to auth state
- [ ] Location permissions work on iOS and Android
- [ ] Backend sessions can be created and joined
- [ ] Deep linking routes unauthenticated guests through auth flow
- [ ] Code passes linter with no errors
- [ ] API endpoints documented

---

## Testing Checklist

### Manual Testing
**Home Screen (S-301):**
- [ ] Logged-out: See Login/Register buttons
- [ ] Login → Home shows username and "Start Searching"
- [ ] Tap "Start Searching" → Logo slides up, buttons fade in
- [ ] Animation is smooth on both platforms

**Location (S-302):**
- [ ] First "Start Browse" tap → Permission modal appears
- [ ] Grant permission → Coordinates captured, proceed
- [ ] Deny permission → Error message + "Open Settings" button
- [ ] Subsequent taps → No modal, immediate coordinate fetch
- [ ] Test on device with location disabled → Graceful error

**Session Backend (S-401):**
- [ ] POST /session → Returns session with join code
- [ ] Join code is unique and shareable
- [ ] POST /session/:id/join with valid token → Success
- [ ] Guest joins → Session status updates to "active"
- [ ] Attempt to join full session → 400 error
- [ ] GET /session/:id → Returns correct session details

**Auth Gate (S-203):**
- [ ] Unauthenticated user cannot see "Invite" button
- [ ] Deep link on unauthenticated device → Redirects to login
- [ ] After login via deep link → Navigates to session lobby
- [ ] Authenticated user sees "Invite" button
- [ ] Telemetry logs unauthorized attempts

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Location permission denied by user | High | High | Clear messaging, "Open Settings" affordance |
| Deep linking not working on Android | Medium | Medium | Test early, fallback to manual code entry |
| Backend session endpoints not ready | Low | High | Mock endpoints for frontend development |
| Animation performance issues | Low | Medium | Use native driver, test on lower-end devices |

---

## Definition of Done

- All acceptance criteria met for S-301, S-302, S-401, S-203
- Code committed to feature branch
- Linter passes with no errors
- Manual testing completed on iOS and Android
- API documentation updated
- Restart Brief updated with session summary
- Check-in log sent to Codex (PM)

---

## Next Sprint Preview

**Sprint 03** will focus on:
- Invite flow UI & lobby states (S-402)
- Session lifecycle & timeout handling (S-403)
- Places API fetch & normalization (S-501)
- Swipeable card UI & animations (S-502)

---

**End of Sprint 02 Plan**

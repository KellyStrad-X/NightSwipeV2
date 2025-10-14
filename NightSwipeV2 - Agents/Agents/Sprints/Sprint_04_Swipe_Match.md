# Sprint 04 — Swipe Sync & Match Logic

**Sprint Duration:** 1-2 weeks
**Sprint Goal:** Implement swipe tracking, synchronization, and match decision flows for solo and two-user modes
**Epic Focus:** E-05 (Deck Fetch & Swipe - Backend Sync), E-06 (Results & Match Experience)
**Owner:** Claude (Code Implementor)
**PM:** Codex

---

## Sprint Objectives

1. Build backend swipe submission and storage
2. Implement solo user results and match screen
3. Build host/guest match intersection logic
4. Handle "Load More" loop for no-match scenarios

---

## Sprint Backlog

### S-503 — Swipe Submission & Sync
- **Epic:** E-05
- **Priority:** P0 (Launch Blocking)
- **Status:** Planned
- **Estimated Effort:** 12-16 hours
- **Dependencies:** S-401 (Session Backend), S-502 (Swipeable Cards)

**Goal:** Each swipe posts to backend. Host & guest decks stay synchronized (identical ordering). On deck completion, UI transitions to waiting or results as appropriate.

**Acceptance Criteria:**
- [ ] **Backend Endpoint:** `POST /session/:id/swipe`
- [ ] Each swipe submits: `{ session_id, user_id, place_id, direction }`
- [ ] Direction values: `"left"` (skip), `"right"` (like)
- [ ] Swipes stored in `swipes` table with timestamp
- [ ] **Deck Synchronization:**
  - Both users receive identical deck from S-501
  - Deck order preserved using deck_seed
  - Validate place_id exists in session deck before accepting swipe
- [ ] **Client-side tracking:**
  - Optimistically update local state on swipe
  - Queue swipes if network unavailable
  - Retry failed submissions in background
- [ ] **Completion Detection:**
  - Track swipes count per user in session
  - When user completes all cards: `user_finished = true`
  - Endpoint: `GET /session/:id/status` returns both users' completion status
- [ ] **UI State Transitions:**
  - **Solo mode:** After finishing deck, check right-swipe quota (S-601)
  - **Two-user mode:**
    - If current user finishes first → Show "Waiting for [other user]…"
    - Poll /session/:id/status every 2 seconds
    - When both finished → Navigate to match results (S-602)

**Technical Notes:**
- Backend validation: Ensure user is member of session
- Prevent duplicate swipes on same place (idempotent by place_id + user_id)
- Swipe retry strategy:
  - Store failed swipes in local queue (AsyncStorage)
  - Retry on next network reconnect
  - Max 3 retries before warning user
- Optimistic UI: Show card swiped immediately, don't wait for server response
- Background sync: Use expo-task-manager or simple retry loop

**Firestore Schema:**
```
swipes (collection)
  └── {swipe_id} (auto-generated document ID)
      ├── session_id: string
      ├── user_id: string (Firebase UID)
      ├── place_id: string (Google Places ID)
      ├── direction: string ("left" | "right")
      ├── swiped_at: timestamp

// Composite index for fast lookups (Firestore auto-creates):
// - session_id + user_id
// - session_id + direction

// Prevent duplicate swipes: Check Firestore before creating
// Query: swipes.where('session_id', '==', sid)
//              .where('user_id', '==', uid)
//              .where('place_id', '==', pid)
```

**API Endpoint Specs:**
```
POST /session/:id/swipe
Headers: Authorization: Bearer <token>
Request Body:
{
  "place_id": string,
  "direction": "left" | "right"
}

Response (200 OK):
{
  "swipe_id": string,
  "session_id": string,
  "user_id": string,
  "place_id": string,
  "direction": string,
  "swiped_at": timestamp
}

Error Responses:
- 400: Invalid direction, place not in deck
- 404: Session not found
- 409: Swipe already recorded

---

GET /session/:id/status
Headers: Authorization: Bearer <token>

Response (200 OK):
{
  "session_id": string,
  "status": "active" | "completed",
  "users": [
    {
      "user_id": string,
      "display_name": string,
      "role": "host" | "guest",
      "swipes_count": number,
      "deck_size": number,
      "finished": boolean
    },
    ...
  ]
}
```

**Deliverables:**
- Backend swipe submission endpoint
- Backend session status endpoint
- Frontend swipe submission logic
- Optimistic UI updates
- Failed swipe queue and retry
- Completion detection
- Waiting screen UI
- Polling logic for completion
- Unit tests
- API documentation

---

### S-601 — Solo Results & Match Screen
- **Epic:** E-06
- **Priority:** P0 (Launch Blocking)
- **Status:** Planned
- **Estimated Effort:** 12-16 hours
- **Dependencies:** S-503 (Swipe Submission)

**Goal:** After hitting random 3–6 right-swipe quota, show results stack of liked cards. Selecting a card opens "Match" page with place details and map link. Restart CTA resets deck with new seed.

**Acceptance Criteria:**
- [ ] **Random Quota:**
  - On solo deck start, app randomly selects required right-swipes: 3–6
  - Store quota in local state
  - Display counter: "X of Y right swipes needed" (optional UI)
- [ ] **Results Trigger:**
  - When user reaches quota → Stop showing deck
  - Navigate to Results screen
- [ ] **Results Screen:**
  - Display looping carousel of user's right-swiped cards (storyboard lines 184-199)
  - Cards show same data as swipe deck: photo, name, category, rating, address
  - User can swipe/tap through results
  - Tap card → Navigate to Match screen
- [ ] **Match Screen:**
  - Display selected place details (storyboard lines 208-213):
    - Large photo
    - Name
    - Category
    - Rating & reviews
    - Full address
    - Distance from user
  - CTA: "Maps Link" → Opens Apple/Google Maps (implemented in S-701)
  - CTA: "Restart" → Resets to new deck (implemented in S-702)
- [ ] **Edge Cases:**
  - If user doesn't reach quota after swiping all cards → Show all right-swipes anyway
  - If no right-swipes → Message: "No places matched. Want to try again?"

**Technical Notes:**
- Random quota generation: `Math.floor(Math.random() * 4) + 3` (range 3-6)
- Store quota in React state or context
- Results carousel: Use ScrollView or FlatList with horizontal paging
- Match screen: Full-screen modal or separate navigation screen
- Fetch user's right swipes from local state or backend:
  - Local: Filter swipes where `direction === "right"`
  - Backend: `GET /session/:id/swipes?user_id={id}&direction=right`

**API Endpoint (Optional):**
```
GET /session/:id/swipes
Headers: Authorization: Bearer <token>
Query Params:
  - user_id: string (optional, defaults to authenticated user)
  - direction: "left" | "right" (optional filter)

Response (200 OK):
{
  "session_id": string,
  "swipes": [
    {
      "place_id": string,
      "place_data": { /* normalized place object from S-501 */ },
      "direction": string,
      "swiped_at": timestamp
    },
    ...
  ]
}
```

**UI Components:**
- ResultsScreen
- ResultsCarousel
- MatchScreen
- PlaceDetailsCard

**Deliverables:**
- Random quota logic
- Results screen with carousel
- Match screen with place details
- Navigation flow
- Edge case handling
- Manual test on iOS and Android

---

### S-602 — Host/Guest Match Logic & Load More Loop
- **Epic:** E-06
- **Priority:** P0 (Launch Blocking)
- **Status:** Planned
- **Estimated Effort:** 16-20 hours
- **Dependencies:** S-503 (Swipe Submission)

**Goal:** Server intersects right swipes once both finished. At least one match → "IT'S A MATCH!". If no matches, prompt both with "Load more places?"; on confirm, fetch new deck with same host location. Guest returned to swipe deck after restart.

**Acceptance Criteria:**
- [ ] **Match Calculation (Backend):**
  - Endpoint: `POST /session/:id/calculate-match`
  - Called when both users finish swiping (detected via S-503 status polling)
  - Query both users' right swipes
  - Intersect place_ids: `host_right_swipes ∩ guest_right_swipes`
  - Return matches array
- [ ] **Match Found (≥1 match):**
  - Both users navigate to "IT'S A MATCH!" screen (storyboard lines 208-249)
  - Display matched places in carousel (if multiple matches)
  - Each match shows: photo, name, category, rating, address
  - User selects preferred match → Navigate to Match screen (same as S-601)
  - Match screen shows "Maps Link" and "Restart"
- [ ] **No Match (0 matches):**
  - Both users see "No matches yet" message
  - Prompt: "Load more places?"
  - CTA: "Yes, load more" button
  - When **both** users confirm → Fetch new deck (same host location, new seed)
  - New deck appears, swipe flow repeats
- [ ] **Async Confirmations:**
  - If one user confirms "Load more", show "Waiting for [other user]…"
  - Poll until both confirm
  - Then fetch and show new deck
- [ ] **Guest Return:**
  - After restart, guest returns to swipe deck (not kicked to lobby)
  - Both users see fresh deck, swipe counts reset
- [ ] **Session State Updates:**
  - After match selected or restart → Mark session as `completed` (optional for analytics)
  - Allow multiple restarts within same session (don't require new invite)

**Technical Notes:**
- Match intersection (backend with Firestore):
  ```javascript
  // Get all right swipes for the session
  const rightSwipes = await db.collection('swipes')
    .where('session_id', '==', sessionId)
    .where('direction', '==', 'right')
    .get();

  // Count swipes per place_id
  const placeCount = {};
  rightSwipes.forEach(doc => {
    const { place_id, user_id } = doc.data();
    if (!placeCount[place_id]) placeCount[place_id] = new Set();
    placeCount[place_id].add(user_id);
  });

  // Find places swiped right by both users
  const matches = Object.entries(placeCount)
    .filter(([_, userSet]) => userSet.size === 2)
    .map(([place_id]) => place_id);
  ```
- Load more confirmations: Store in session state (e.g., `users_ready_for_more` array in Firestore)
- New deck generation: Call S-501 logic with new seed, same host location
- Polling: Frontend polls `/session/:id/match-status` until matches calculated

**API Endpoint Specs:**
```
POST /session/:id/calculate-match
Headers: Authorization: Bearer <token>

Response (200 OK):
{
  "session_id": string,
  "matches": [
    {
      "place_id": string,
      "place_data": { /* normalized place */ }
    },
    ...
  ],
  "match_count": number
}

---

POST /session/:id/load-more-confirm
Headers: Authorization: Bearer <token>

Response (200 OK):
{
  "session_id": string,
  "confirmed_users": [user_id1, user_id2],
  "all_confirmed": boolean,
  "new_deck_ready": boolean  // true if both confirmed and deck fetched
}

---

GET /session/:id/match-status
Headers: Authorization: Bearer <token>

Response (200 OK):
{
  "session_id": string,
  "both_finished": boolean,
  "matches_calculated": boolean,
  "matches": [ /* array */ ],
  "load_more_requested": boolean,
  "all_users_confirmed_load_more": boolean
}
```

**UI Components:**
- MatchFoundScreen ("IT'S A MATCH!")
- NoMatchScreen ("No matches yet")
- MatchCarousel (for multiple matches)
- LoadMorePrompt
- WaitingForConfirmScreen

**Deliverables:**
- Backend match calculation endpoint
- Backend load more confirmation logic
- Frontend match found screen
- Frontend no match screen
- Load more prompt and flow
- Polling for match status
- Navigation flow
- Manual test: Host/guest swipe, get match, get no match, load more
- Unit tests for intersection logic

---

## Sprint Success Metrics

- [ ] All P0 items (S-503, S-601, S-602) completed and tested
- [ ] Swipes successfully sync to backend
- [ ] Solo mode shows results after quota met
- [ ] Two-user mode calculates matches correctly
- [ ] "Load more" loop works for no-match scenario
- [ ] Code passes linter with no errors

---

## Testing Checklist

### Manual Testing

**Swipe Submission (S-503):**
- [ ] Swipe card → POST /session/:id/swipe succeeds
- [ ] Swipe recorded in database
- [ ] Optimistic UI: Card disappears immediately
- [ ] Network offline → Swipe queued locally
- [ ] Network reconnects → Queued swipes submitted
- [ ] Both users finish deck → Completion status accurate
- [ ] Solo: Navigate to results after finishing
- [ ] Two-user: Show "Waiting…" if one finishes first

**Solo Results (S-601):**
- [ ] Solo mode: Quota randomly 3-6
- [ ] After quota met → Navigate to results
- [ ] Results carousel shows right-swiped places
- [ ] Tap place → Match screen opens
- [ ] Match screen shows all details
- [ ] "Maps Link" button present (S-701 will implement)
- [ ] "Restart" button present (S-702 will implement)
- [ ] No right-swipes → Message shown

**Match Logic (S-602):**
- [ ] Both users finish swiping → POST /calculate-match called
- [ ] **1+ match:** "IT'S A MATCH!" shown to both
- [ ] Match carousel shows matched places
- [ ] Select match → Navigate to match screen
- [ ] **0 matches:** "No matches yet" shown to both
- [ ] Tap "Load more" → "Waiting for other user"
- [ ] Both confirm → New deck fetched
- [ ] New deck appears, swipe counts reset
- [ ] Multiple restarts work within same session

**Edge Cases:**
- [ ] User finishes deck without meeting quota (solo) → Show all right swipes
- [ ] Guest disconnects during waiting → Reconnects and sees correct state
- [ ] Session expires during waiting → Error shown

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Swipe submission fails, out of sync | Medium | High | Local queue with retry, reconcile on reconnect |
| Match calculation slow with many swipes | Low | Medium | Index swipes table, cache calculation |
| Users disagree on "Load more" | Medium | Low | Clear messaging, timeout after 2 minutes |
| Network latency during waiting screens | High | Medium | Show loading states, optimistic updates |

---

## Definition of Done

- All acceptance criteria met for S-503, S-601, S-602
- Code committed to feature branch
- Linter passes with no errors
- Backend match logic tested with various swipe combinations
- Solo and two-user flows tested on iOS and Android
- API documentation updated
- Restart Brief updated with session summary
- Check-in log sent to Codex (PM)

---

## Next Sprint Preview

**Sprint 05** will focus on:
- Deep link to Apple/Google Maps (S-701)
- Session restart & deck refresh (S-702)
- Splash & logo animation (S-801)
- Error handling & offline states (S-901)
- Analytics & logging baseline (S-902)
- CTA & gem glow microinteractions (S-802) - if time allows

---

**End of Sprint 04 Plan**

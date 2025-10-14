# NightSwipe MVP – Backlog Draft (v1)

**Prepared:** 2025-10-05
**Prepared By:** Codex (PM)
**Docs Referenced:** `Misc/NightSwipe MVP Overall.md`, `Misc/NightSwipe MVP Auth Flow.md`, `Misc/NightSwipeV2 Storyboard.md`

---

## Legend
- **Priority:** P0 = launch blocking, P1 = MVP differentiator, P2 = nice-to-have if time allows.
- **Status:** Planned (not started), In Progress, Blocked, Done.
- **Owner:** Default engineering owner = Claude (dev agent) unless re-assigned.

---

## Epic E-01 — Platform & Operational Foundations
Covers project setup, environment alignment, and shared tooling to support the sprint cadence.

### S-101 — Validate Dev Environment & Project Skeleton
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Goal:** Confirm repo scaffolding (Expo/React Native app + backend) is in place, dependencies install cleanly, lint/test commands run, and .env handling ready for API keys.  
- **Acceptance Criteria:**
  - Local run instructions verified on macOS + at least one additional platform (document assumptions).  
  - `.env.example` includes Google Places & backend base URL placeholders.  
  - CI/lint/test scripts documented or noted if missing.  
- **Dependencies:** None  
- **Notes:** Update restart brief with any blockers or approval needs.

### S-102 — Sprint Ops & Logging Framework
- **Priority:** P1  
- **Status:** Planned  
- **Owner:** Codex  
- **Goal:** Ensure Restart Brief + Log directories have current session templates and cadence is defined.  
- **Acceptance Criteria:**
  - Restart brief template duplicated and tailored for current sprint.  
  - Daily/major milestone check-in schedule documented.  
  - Backlog file versioned and linked from sprint overview.  
- **Dependencies:** S-101  
- **Notes:** Coordinate with stakeholders if additional reporting required.

---

## Epic E-02 — Authentication & Account Setup
Implements login/registration, session persistence, and logout flow per MVP spec (Misc/NightSwipe MVP Auth Flow.md:14-34).

### S-201 — Registration Flow (Email + Password)
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Users can create accounts with display name, email, password; phone optional.  
  - Validation + inline errors for missing fields, weak password, duplicate email.  
  - Successful registration auto-authenticates and routes to Home.  
- **Dependencies:** S-101  
- **Notes:** Align copy with storyboard (e.g., “Account setup”).

### S-202 — Login & Persistent Session
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Existing users authenticate via email/password with friendly error states.  
  - Session token persisted securely until logout (auto-rehydrate on app relaunch).  
  - Logout control available from account menu (if exists) or home screen stub.  
- **Dependencies:** S-201  
- **Notes:** Document token storage decision (SecureStore vs AsyncStorage).

### S-203 — Auth Gate on Invite/Join Actions
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Invite button hidden/disabled when unauthenticated with “Create your account…” messaging.  
  - Guest invite deep links enforce login/register before entering lobby.  
  - Relevant telemetry/logging for unauthorized attempts.  
- **Dependencies:** S-202, S-402  
- **Notes:** Copy from spec to keep tone consistent.

---

## Epic E-03 — Core Home Experience & Location Capture
Determines home-state transitions and handles location permission/seed logic.

### S-301 — Home Screen State (Start Browse / Invite)
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Logged-out: show Login/Register CTA (Storyboard lines 65-104).  
  - Logged-in solo: show “Start Searching” primary CTA.  
  - Logged-in host: show “Invite” and “Start Browse” with logo slide animation.  
- **Dependencies:** S-202  
- **Notes:** Provide design fidelity to storyboard animations where feasible.

### S-302 — Location Permission & Prefetch
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Prompt for location on first Start Browse/Invite tap with rationale text (Storyboard lines 31-38).  
  - Cache location snapshot for host session seed.  
  - Handle denied permissions gracefully (fallback messaging).  
- **Dependencies:** S-301  
- **Notes:** Document incremental access vs. immediate prompt decision.

---

## Epic E-04 — Host Invite & Session Management
Covers session creation, invite link, lobby states per spec (Auth Flow:57-83; Storyboard:107-156).

### S-401 — Backend Session Create/Join Endpoints
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - `POST /session` returns `{session_id, join_code, session_url, host_location}`.  
  - `POST /session/:id/join` validates invite status and guest auth.  
  - Session state persisted with host location + deck seed placeholders.  
- **Dependencies:** S-201, backend infra.  
- **Notes:** Coordinate with backend agent if separate; log payload examples.

### S-402 — Invite Flow UI & Lobby States
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Host sees invite modal with shareable link, guest phone field (Storyboard lines 118-132).  
  - Pending state indicates “Waiting for guest…”; updates when guest joins.  
  - Guest deep link routes to lobby post-login with status copy.  
- **Dependencies:** S-203, S-401  
- **Notes:** Determine approach for share (in-app vs. copy link). Twilio SMS integration planned for phone-based invites; ensure env placeholders (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`) documented before implementation.

### S-403 — Session Lifecycle & Timeout Handling
- **Priority:** P1  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Idle sessions auto-expire after configurable timeout; surface error message.  
  - Host can cancel invite, clearing guest state.  
  - Rejoin logic handles reconnecting guests gracefully.  
- **Dependencies:** S-401  
- **Notes:** MVP error handling requirement (Overall Spec §8).

---

## Epic E-05 — Deck Fetch & Swipe Mechanics
Implements shared deck generation, swipe gestures, and posting swipes (Overall Spec §§3.3–3.5).

### S-501 — Places Fetch & Normalization
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Fetch 20–25 places (restaurants/bars/activities) using Google Places near host coordinates.  
  - Normalize payload: name, photo, category, rating, review count, address, distance.  
  - Persist deck seed & raw results for reuse (session store).  
- **Dependencies:** S-302, S-401  
- **Notes:** Document quota usage and fallback images.

### S-502 — Swipeable Card UI & Animations
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Implement swipe left/right gestures with visual feedback per storyboard (lines 157-204).  
  - Track swipe order locally for latency mitigation.  
  - Provide accessible alternative (buttons) if gesture fails.  
- **Dependencies:** S-501  
- **Notes:** Reuse existing gesture libs if permitted.

### S-503 — Swipe Submission & Sync
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Each swipe posts `{session_id, user_id, place_id, direction}` to backend.  
  - Host & guest decks stay synchronized (identical ordering).  
  - On deck completion, UI transitions to waiting or results as appropriate.  
- **Dependencies:** S-401, S-502  
- **Notes:** Outline retry strategy for network errors.

---

## Epic E-06 — Results & Match Experience
Handles decision loop for both single-user and paired flows (Overall Spec §§3.4–3.5, Storyboard 178-254).

### S-601 — Solo Results & Match Screen
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - After hitting random 3–6 right-swipe quota, show results stack of liked cards.  
  - Selecting a card opens “Match” page with place details and map link.  
  - Restart CTA resets deck with new seed.  
- **Dependencies:** S-503  
- **Notes:** Document algorithm for random quota selection.

### S-602 — Host/Guest Match Logic & Load More Loop
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Server intersects right swipes once both finished; at least one match → “IT’S A MATCH!” (Storyboard lines 208-249).  
  - If no matches, prompt both with “Load more places?”; on confirm, fetch new deck with same host location.  
  - Guest is returned to swipe deck after restart.  
- **Dependencies:** S-503  
- **Notes:** Clarify UX for asynchronous confirmations (modal vs. buttons).

---

## Epic E-07 — Maps Integration & Session Reset
Ensures final navigation flow and session restart behave per acceptance criteria (Overall Spec §5).

### S-701 — Deep Link to Apple/Google Maps
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Match screen offers platform-appropriate link (Apple Maps iOS, Google Maps Android).  
  - Link includes place name/address and opens successfully from device tests.  
  - Handle failure cases with fallback copy.  
- **Dependencies:** S-601 / S-602  
- **Notes:** Add QA checklist for device matrix.

### S-702 — Session Restart & Deck Refresh
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Restart clears prior swipes, requests new deck seed, and returns both users to initial state without new invite.  
  - Solo restart uses fresh random quota.  
  - Ensure old sessions marked complete to prevent duplicate matches.  
- **Dependencies:** S-601, S-602  
- **Notes:** Consider analytics hook for restarts.

---

## Epic E-08 — Visual Identity & Interaction Polish
Delivers key branding moments from storyboard; scope carefully to stay within MVP timeline.

### S-801 — Splash & Logo Animation
- **Priority:** P1  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Splash screen shows glowing background and moon swipe animation (Storyboard lines 13-29).  
  - Transition into home screen without jank on both platforms.  
- **Dependencies:** S-301  
- **Notes:** Leverage Lottie or custom animation depending on feasibility.

### S-802 — CTA & Gem Glow Microinteractions
- **Priority:** P2  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Primary CTAs fade/slide per storyboard when state changes (Start Search → Invite/Start Browse).  
  - Gem/icons have subtle glow while preserving performance.  
- **Dependencies:** S-301, S-502  
- **Notes:** Park if core functionality runs long; document fallback styling.

---

## Epic E-09 — Quality, Telemetry & Edge Cases
Ensures MVP stability, observability, and handoff hygiene (Overall Spec §8).

### S-901 — Error Handling & Offline States
- **Priority:** P0  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Friendly error UI for failed deck fetch, swipe submission, session expiration.  
  - Retry affordances logged; analytics records failure category.  
  - Network-offline mode communicates limitations clearly.  
- **Dependencies:** S-503, S-403  
- **Notes:** Align messaging with UX guidelines.

### S-902 — Analytics & Logging Baseline
- **Priority:** P1  
- **Status:** Planned  
- **Owner:** Claude  
- **Acceptance Criteria:**
  - Instrument key events: registration success, invite sent, deck started, match achieved, restart triggered.  
  - Logs available for debugging (client + server) without leaking PII.  
  - Document dashboards or raw log access steps.  
- **Dependencies:** S-503, S-602  
- **Notes:** Choose lightweight tooling (e.g., Segment stub or custom logging) compatible with timeline.

---

## Parking Lot / Post-MVP Considerations
- Multi-user (>2) session support.
- Independent location selection per user.  
- Advanced filtering (price, cuisine, tags).  
- Profile avatars/history beyond optional upload placeholder.  
- Real-time deck sync via WebSockets.

---

## Next PM Actions
1. Review backlog with stakeholders for prioritization confirmation.  
2. Translate top P0 items into sprint-ready tasks with time estimates once Claude validates effort.  
3. Create Sprint 1 overview referencing this backlog and set up daily sync cadence.

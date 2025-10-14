# NightSwipe MVP — Auth & Flow (v2)

## Overview
NightSwipe helps 1–2 people quickly pick a place to go out by swiping through nearby restaurants, bars, and activities pulled from the Google Places API. Users swipe on a deck of place cards until a decision is reached.

MVP scope supports:
- **Single User** — fast solo discovery.
- **Host & Guest (2 users)** — both authenticated, shared deck, intersect right-swipes to match.

---

## Authentication

### Requirements
- **Email + password** for both Host and Guest.
- Minimal profile fields:  
  - **Display Name** (required)  
  - **Email** (required)  
  - **Password** (required)  
  - **Phone** (optional for MVP)
- Session stays logged in until logout.

### Entry Points
- **Unauthenticated Home:** Shows **Login / Register** first.
- After login:  
  - Solo users see **Start Browse**.  
  - Hosts see **Invite** → then **Start Browse** after guest joins.

### Host Rule
- Host **must be logged in** to invite.

### Guest Rule
- Guest **must log in or register** before joining a session (no anonymous join).

---

## Single-User Flow

1. **Start Browse**
   - Fetch deck near user’s location (20–25 places).
   - App picks a random **required right-swipe count: 3–6**.

2. **Swipe**
   - Swipe left = skip; right = interested.
   - When required number of rights reached → go to Results.

3. **Results Loop**
   - Show user’s right-swiped cards in a looping carousel.
   - Selecting a card → Match page.

4. **Decision**
   - Show details + Apple/Google Maps link.
   - **Restart** returns to fresh deck.

---

## Host & Guest Flow

1. **Host Login**
   - Tap **Invite** to create session & unique join URL.
   - Host location snapshot taken at this moment.

2. **Guest Join**
   - Open link → forced to **Login / Register**.
   - On success, guest enters lobby (“Waiting for host/guest…”).

3. **Start Browse (both)**
   - Once both authenticated & joined, **Start Browse** activates for both.

4. **Shared Deck**
   - One Google Places query using host coordinates.
   - Same ordered deck to both devices (20–25 cards).

5. **Swiping**
   - Each swipe posts `{session_id, user_id, place_id, direction}`.
   - When one user finishes → show “Waiting for other user.”

6. **Match Logic**
   - Intersect right-swipes:
     - If ≥1 → “It’s a Match!” screen → choose place → map page → restart.
     - If 0 → “No matches yet — Load more places?”  
       On confirm from both, fetch new batch (still host location).

---

## Location Behavior (MVP)
- **Deck is locked to host’s coordinates** for the session.  
- App copy:  
  *“For now, NightSwipe uses the host’s area so you’ll both see the same places.”*

---

## API & Data Model (suggested)

**Endpoints**
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /session` (host creates session)
- `POST /session/:id/join` (guest joins)
- `GET /session/:id/deck`
- `POST /session/:id/swipe`
- `GET /session/:id/match`
- `POST /session/:id/more`

**Core Tables/Docs**
- `users`: `id, email, password_hash, display_name, created_at`
- `sessions`: `id, host_id, host_lat, host_lng, deck_seed, status`
- `session_members`: `session_id, user_id, role`
- `swipes`: `session_id, user_id, place_id, direction, ts`
- `places_cache`: keyed by `(lat,lng,seed,page)` → list of normalized places

---

## Acceptance Criteria

- **Guest authentication required** before joining a host session.
- **Shared deck** is identical for both users; swipes recorded server-side.
- **Finish gate:** match check runs only after both users complete deck.
- **Maps link:** opens correctly (Apple on iOS, Google on Android).
- **Restart:** resets both to new deck (new seed) without needing new invite.

---

## Copy Notes (MVP)
- Replace anonymous join with:  
  *“Create your account to join this session.”*
- Keep existing callouts like “Waiting for guest” and “X has joined!” to keep onboarding clear.

---

## MVP Constraints

- Max **2 users**.
- Single shared location.
- No friend lists or chat yet.
- No real-time deck regeneration beyond manual “Load more places.”


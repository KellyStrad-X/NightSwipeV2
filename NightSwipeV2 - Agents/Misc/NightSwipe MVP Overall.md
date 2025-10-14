# NightSwipe MVP — Overall Specification

## 1. Product Vision
NightSwipe helps individuals or pairs quickly decide where to go out by swiping through nearby restaurants, bars, and activities. The experience is minimal, fast, and decision-oriented — no endless lists or planning tools.

MVP focus: **solo browsing** and **two-person matching** using a shared set of place cards from the Google Places API.

---

## 2. Target Users
- **Solo explorer**: single user wants a quick decision.
- **Pairs**: couples or friends deciding together.

---

## 3. Core Features

### 3.1 Authentication
- **Email + password login** for all users (host and guest).
- Minimal registration: Display Name (required), Email, Password.
- Persistent session until logout.

### 3.2 Location
- App requests device location on browse or invite.
- **Two-user sessions use the host’s locked location** for deck generation (MVP simplification).

### 3.3 Swipable Deck of Places
- Cards built from Google Places API.
- Each card includes:
  - Name
  - Primary photo
  - Category (restaurant, bar, activity)
  - Rating & review count
  - Address & distance
- 20–25 cards per deck pull.

### 3.4 Single-User Decision Flow
1. **Start Browse** → fetch local deck.
2. App randomly sets required right swipes: **3–6**.
3. Swipe until requirement met.
4. Show “Results” stack (user’s right swipes).
5. Tap final card → “Match” screen with Apple/Google Maps and restart option.

### 3.5 Two-User Matching Flow
1. **Host** logs in → taps *Invite* → generates session & join link (location locked).
2. **Guest** follows link → logs in/registers → joins session lobby.
3. **Start Browse** activates for both.
4. Shared deck (20–25 cards) served identically to each.
5. Each user swipes; when finished, sees “Waiting for other user.”
6. Server calculates intersection of right swipes:
   - If ≥1 match → “It’s a Match!” → choose place → map screen.
   - If no match → “No matches yet — Load more places?” → new batch pulled using same host location.
7. Restart resets both to a new shared deck.

---

## 4. App Structure / Screens

- **Splash / Loading** — brand intro, logo animation.
- **Auth** — login & register forms.
- **Home** — *Start Browse* / *Invite* options.
- **Invite Flow** — invite link generation, waiting screens (“Waiting for guest”, “X has joined”).
- **Swipe Deck** — core card swiping UI.
- **Results** — solo or matched cards in looping stack.
- **Match** — final selected place with map link & restart option.

---

## 5. Technical Notes

- **Places API**: Google Places Nearby Search (restaurants, bars, activities).  
- **Deck Seed**: host location + randomization to avoid exact repeat lists.  
- **Session Sync**: simple REST endpoints; WebSockets optional but not required for MVP.  
- **Maps Integration**: deep link to Apple Maps (iOS) / Google Maps (Android).  
- **State**: maintain session object with deck seed and swipe arrays.

---

## 6. MVP Constraints

- Max 2 users per session.
- Single locked location per session.
- No profile photos, chat, or multi-session history.
- No advanced filters (price, cuisine, etc.).
- Manual “Load More” instead of live infinite feed.

---

## 7. Data Model (suggested)

- `users`: `id, email, password_hash, display_name, created_at`
- `sessions`: `id, host_id, host_lat, host_lng, deck_seed, status`
- `session_members`: `session_id, user_id, role`
- `swipes`: `session_id, user_id, place_id, direction, ts`
- `places_cache`: cached place data keyed by `(lat,lng,seed,page)`

---

## 8. Acceptance Criteria

- **Authentication** works for host & guest; no anonymous joining.
- **Deck parity** — both users see identical card order and count.
- **Swipe tracking** — right swipes stored server-side; match only triggers after both finish.
- **Map links** work on iOS & Android.
- **Restart** creates new deck without new invite.
- **Error states**: graceful handling of lost guest connection or expired session.

---

## 9. Copy / UX Guidelines

- Clear onboarding language:
  - “Create your account to browse or join a session.”
  - “Waiting for guest…” / “X has joined!”
  - “No matches yet — Load more places?”
- Keep interactions lightweight and decision-driven; avoid feature creep.

---

## 10. Future (Post-MVP)

- Independent location for each user.
- More than two users.
- Profile history & favorites.
- Advanced filters (price, cuisine, tags).
- Live deck updates with WebSockets.

---



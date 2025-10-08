# NightSwipe

NightSwipe helps a host and guest decide on a night out by swiping through curated spots and landing on matches they both like. The stack pairs an Expo React Native client with an Express + Firestore backend and Google Places data.

---

## Current Status

- Sprint 04 is underway with S-501 → S-602 delivered, including shared deck generation, swipe sync, and the new host/guest match + load-more flow.
- Solo mode is production-ready: quota-based results and place detail screens reuse the same normalized data.
- Two-user sessions now calculate intersections through `POST /session/:id/calculate-match` and coordinate deck restarts if no overlap is found.

---

## Architecture Snapshot

- Backend: Node 20, Express, Firebase Admin, Firestore subcollections, Google Places enrichment.
- Frontend: Expo SDK 54, React Navigation stack, Firebase client auth, swipe deck built with PanResponder.
- Environments rely on private Firebase + Google API keys; those live outside the repo.

---

## What’s Next

- Sprint 05 will tackle polish items: map deep links (S-701), session restarts UX (S-702), richer error handling/offline states (S-901), and animation passes (S-801/S-802).
- Additional hardening around backend transactions and status polling resilience is scheduled for the polish phase.

---

## Internal Docs

- Restart briefs, sprint specs, and detailed logs are maintained under `Agents/` in the adjacent planning workspace.
- For environment setup or historical implementation notes, reference `Agents/Claude-Codex/Logs/` and `Agents/Sprints/`.

---

_Testing instructions and API keys are intentionally omitted here; contact the team for environment access._

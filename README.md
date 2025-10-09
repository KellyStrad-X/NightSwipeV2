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

- Operating cadence:
  - Claude (implementation agent) ships feature code; GPT-5 (release agent) reviews, stages, and pushes.
  - Each working block starts with a restart-brief sync, followed by code review, light validation, and coordinated pushes from `Sprint_03_Implementations`.
  - Commit hygiene: descriptive messages per story, no force-push; secrets stay on the host machine.
- Planning workspace (`Agents/`):
  - `Agents/Claude-Codex/Restart Brief/` → session priorities and checklists.
  - `Agents/Claude-Codex/Logs/` → deep-dive writeups for each story and bug fix.
  - `Agents/Sprints/` → backlog specs, acceptance criteria, and testing matrices.
- VM + tooling:
  - Development runs inside the Codex VM with sandboxed shell access; privileged commands require escalation.
  - Backend/Expo services run locally; Google + Firebase keys are injected at runtime and never committed.
- Git + security:
  - GPT-5 handles staging and pushes; the host pulls, restarts services, and verifies environments after every drop.
  - Unexpected binaries or obfuscated code are investigated before staging; `.env` and other secret files remain ignored.

---

_Testing instructions and API keys are intentionally omitted here; contact the team for environment access._

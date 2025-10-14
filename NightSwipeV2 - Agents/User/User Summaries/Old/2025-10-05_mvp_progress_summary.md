# NightSwipe MVP – Progress Brief (2025-10-05)

## Snapshot
- **Where we are:** Sprint 01 S-101 (environment setup) is finished; the codebase now lives in `../NS-CB` with a working Express backend and Expo mobile shell (Agents/Claude-Codex/Logs/2025-10-05_sprint01_claude.md:1-933).
- **Architecture call:** We committed to a hybrid Firebase + Express stack, replacing the original PostgreSQL/JWT plan (Agents/Backlog-Desicions /Changes-Decisions/ARCHITECTURE_DECISIONS.md:1-180).
- **Docs refreshed:** Sprint plans and backlog reflect the Firebase shift (Agents/Backlog-Desicions /Changes-Decisions/SPRINT_UPDATES_FIREBASE.md:1-175).

## What Changed
- **Backend foundation (Express):** Basic API with health check, CORS, error handling, and `.env` templates to receive Firebase Admin + Google Places keys later (`../NS-CB/backend/src/server.js:1-48`, `../NS-CB/backend/.env.example:1-14`).
- **Frontend foundation (Expo):** App boots into a status screen that pings the backend and confirms whether Firebase config is present, plus helper utilities for future API calls (`../NS-CB/frontend/App.js:1-89`, `../NS-CB/frontend/src/services/api.js:1-42`, `../NS-CB/frontend/src/config/firebase.js:1-30`).
- **Repo + docs:** Clean README/QUICKSTART explain how to run both ends and how to supply credentials (`../NS-CB/README.md:1-200`, `../NS-CB/QUICKSTART.md:1-99`). Git ignore rules protect secrets across root/backend/frontend (`../NS-CB/.gitignore`).
- **Operational folders:** Decisions/backlog moved under `Agents/Backlog-Desicions /`, and Claude’s sprint log now lives in `Agents/Claude-Codex/Logs/`.

## Decisions That Matter
1. **Firebase Auth + Firestore:** Faster to ship, handles passwords/tokens securely, and fits two-user MVP. Trade-off is vendor lock-in; we mitigate by keeping business logic in Express (Agents/Backlog-Desicions /Changes-Decisions/ARCHITECTURE_DECISIONS.md:13-154).
2. **Express remains in play:** We still own Google Places proxying, deck seeding, and match intersection server-side even with Firebase in front.
3. **Backlog/Sprint updates:** Registration/login stories now reference Firebase SDK work instead of custom endpoints; effort trimmed ~8 hours for Sprint 01 (Agents/Backlog-Desicions /Changes-Decisions/SPRINT_UPDATES_FIREBASE.md:15-125).

## What You Need To Do
- **Firebase project:** Create it, enable Email/Password Auth + Firestore, then drop the generated values into both `.env` files (see QUICKSTART step-by-step at `../NS-CB/QUICKSTART.md:25-70`).
- **Google Places key:** Follow Guide 01 in `User/Guides/01_Google_Places_API_Setup.md` to secure the API key, then add it to `../NS-CB/backend/.env`.
- **Confirm codebase location:** Work inside `../NS-CB` going forward; `NightSwipeV2 - Agents` now houses planning, logs, and guides.
- **Review guides:** Non-dev setup walkthroughs live in `User/Guides/README.md`; the “Must-Have” items (API key, database, backend deploy, dev environment, env vars) are already drafted for you.

## What’s Next (Sprint 01 Remaining)
1. **S-102 – Ops & Logging (2-4h):** Stand up restart brief cadence and log directories (uses templates in `Templates/Restart_Brief_Template.md`).
2. **S-201 – Registration (8-12h):** Build Firebase-powered signup screen once credentials are in place.
3. **S-202 – Login & Session (8-12h):** Wire Firebase login, secure token storage, and auth context.

## Risks & Watchouts
- **Credentials still missing:** Until Firebase + Google keys exist, auth work (S-201/202) and Places fetch can’t proceed.
- **Firebase lock-in:** Future migrations would take effort; stay disciplined about keeping domain logic on our server.
- **Node version:** Expo requested Node 20.19.4+; current environment is 20.11.1. No breakage yet, but plan an upgrade before distribution (Agents/Claude-Codex/Logs/2025-10-05_sprint01_claude.md:766-778).

## Helpful Links
- **Backlog (canonical):** `Agents/Backlog-Desicions /NightSwipe_MVP_Backlog_Draft.md`
- **Sprint overview:** `Agents/Sprints/SPRINT_OVERVIEW.md`
- **Claude’s log:** `Agents/Claude-Codex/Logs/2025-10-05_sprint01_claude.md`
- **Setup guides hub:** `User/Guides/README.md`

Let me know once Firebase + Places credentials are in—then we’ll green-light S-102 and hand Claude the next tasks.

# NightSwipe MVP - Architecture Decisions

**Purpose:** Document key architectural and technical decisions made during MVP development.

**Maintainer:** Claude (Code Implementor) + Codex (PM)

**Created:** 2025-10-05

---

## Decision Log

### [2025-10-05] ADR-001: Hybrid Firebase + Express Architecture

**Status:** ✅ Accepted

**Context:**
Original Sprint plans assumed a traditional backend architecture with:
- PostgreSQL database for user data and session state
- Custom JWT authentication with bcrypt password hashing
- Custom Express endpoints for `/auth/register` and `/auth/login`
- Manual session and token management

**Decision:**
Adopt a **hybrid architecture** combining Firebase services with Express backend:

**Firebase Handles:**
- ✅ **Authentication** - Firebase Auth for email/password signup, login, password hashing, and token management
- ✅ **User Database** - Firestore for user profiles, session data, and swipe records
- ✅ **Token Management** - Firebase ID tokens (auto-refresh, 1-hour validity with automatic renewal)

**Express Backend Handles:**
- ✅ **Google Places API Proxy** - Hide API key from frontend
- ✅ **Deck Generation Logic** - Deterministic shuffling with session seed
- ✅ **Match Calculation** - Complex queries for swipe intersection logic
- ✅ **Session Lifecycle** - Business logic for session creation, join codes, timeouts

**Consequences:**

**Positive:**
- ✅ **Reduced Development Time** - Firebase Auth eliminates ~16 hours of custom auth implementation
- ✅ **Security** - Firebase handles password hashing, token encryption, and refresh logic automatically
- ✅ **Simplified Frontend** - Use Firebase SDK methods directly (no custom API endpoints for auth)
- ✅ **No PostgreSQL Setup** - Easier for non-developers to get started
- ✅ **Real-time Capabilities** - Firestore supports real-time listeners (useful for session sync in future)
- ✅ **Free Tier** - Firestore free tier sufficient for MVP (50K reads/day, 20K writes/day)

**Negative:**
- ⚠️ **Vendor Lock-in** - Tighter coupling to Firebase ecosystem
- ⚠️ **Complex Queries** - Firestore has limitations on complex queries (mitigated by using backend for match logic)
- ⚠️ **Migration Complexity** - Harder to migrate away from Firebase if needed in future

**Mitigations:**
- Backend still owns core business logic (deck generation, match calculation)
- Abstraction layer in frontend services to isolate Firebase dependencies
- Document Firestore schema clearly for potential migration

---

**Sprint Impact:**

**Sprint 01 Changes:**
- S-201 (Registration): Reduced from 12-16 hours → 8-12 hours
  - Use `createUserWithEmailAndPassword()` instead of custom `/auth/register` endpoint
  - Store additional profile data in Firestore `users/{uid}` collection
- S-202 (Login): Reduced from 12-16 hours → 8-12 hours
  - Use `signInWithEmailAndPassword()` instead of custom `/auth/login` endpoint
  - Backend middleware validates Firebase ID tokens (not custom JWTs)

**Updated Dependencies:**
- Frontend: `firebase` (Auth + Firestore), `expo-secure-store` (token storage)
- Backend: `firebase-admin` (token validation)

**Removed Dependencies:**
- ❌ PostgreSQL (`pg` package)
- ❌ bcrypt (password hashing)
- ❌ jsonwebtoken (JWT generation)

---

**Firestore Schema:**

```
users (collection)
  └── {uid} (document)
      ├── display_name: string
      ├── email: string
      ├── phone: string | null
      └── created_at: timestamp

sessions (collection)
  └── {session_id} (document)
      ├── host_id: string (Firebase UID)
      ├── join_code: string (6-digit)
      ├── host_lat: number
      ├── host_lng: number
      ├── deck_seed: number
      ├── status: "active" | "completed" | "expired"
      ├── created_at: timestamp
      └── expires_at: timestamp

session_members (subcollection under sessions/{session_id})
  └── {uid} (document)
      ├── role: "host" | "guest"
      ├── joined_at: timestamp

swipes (collection)
  └── {swipe_id} (document)
      ├── session_id: string
      ├── user_id: string (Firebase UID)
      ├── place_id: string (Google Places ID)
      ├── direction: "left" | "right"
      ├── swiped_at: timestamp
```

---

**Backend Token Validation Pattern:**

```javascript
// backend/src/middleware/auth.js
const admin = require('firebase-admin');

const verifyFirebaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // { uid, email, ... }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

---

**Participants:**
- User (Product Owner)
- Claude (Code Implementor)
- Codex (Project Manager)

**Related Documents:**
- [Sprint 01 - Foundation & Auth](../Sprints/Sprint_01_Foundation_Auth.md)
- [Backlog](./NightSwipe_MVP_Backlog_Draft.md)
- [MVP Spec](../../Misc/NightSwipe%20MVP%20Overall.md)

---

## Future Decisions

Space for additional architectural decisions as project evolves.

### Decision Template

```
### [YYYY-MM-DD] ADR-###: Decision Title

**Status:** [Proposed | Accepted | Deprecated | Superseded]

**Context:**
What is the issue that we're facing?

**Decision:**
What is the change that we're making?

**Consequences:**
What becomes easier or harder as a result of this change?

**Participants:**
Who was involved in the decision?
```

---

**End of Architecture Decisions Log**

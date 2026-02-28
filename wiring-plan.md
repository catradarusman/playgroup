# Playgroup - Wiring Plan

> **Status**: ✅ All Features Complete - Ready to Publish
> **Last Updated**: 2026-02-28
> **Cycle Duration**: 1 week (52 albums/year)
> **Universal Login**: ✅ Privy Configured

---

## Features Overview

| Feature              | Type     | Status      | Notes                                    |
| -------------------- | -------- | ----------- | ---------------------------------------- |
| Cycles & Albums      | database | ✅ Complete | Auto-creates first cycle                 |
| Submissions & Voting | database | ✅ Complete | Atomic transactions, DB constraints      |
| Reviews              | database | ✅ Complete | Stats auto-update inside transaction     |
| Album Metadata       | external | ✅ Complete | Deezer API (no auth needed)              |
| User Identity        | social   | ✅ Complete | Unified auth (FC + Privy)                |
| Share Buttons        | sharing  | ✅ Complete | 3 personalized share types               |
| User Profiles        | social   | ✅ Complete | Header icon, clickable usernames         |
| Community Buzz       | social   | ✅ Complete | Farcaster cast search for albums         |
| Universal Access     | auth     | ✅ Complete | Privy (email/Google) + Farcaster         |

---

## Database Schema

All tables are defined in `src/db/schema.ts`.

### `users` Table

Unified identity for Farcaster and Privy users. All other tables reference `users.id`.

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
fid             INTEGER                      -- Farcaster ID (null for Privy-only users)
privyId         TEXT                         -- Privy ID (null for FC-only users)
walletAddress   TEXT                         -- FC embedded wallet or Privy smart wallet
email           TEXT                         -- Privy users only
username        TEXT NOT NULL                -- FC @username or email prefix
displayName     TEXT NOT NULL                -- Full display name
pfpUrl          TEXT                         -- FC PFP or DiceBear generated avatar
authProvider    TEXT NOT NULL                -- 'farcaster' | 'privy'
createdAt       TIMESTAMP DEFAULT NOW()
updatedAt       TIMESTAMP DEFAULT NOW()
```

### `cycles` Table

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
weekNumber      INTEGER NOT NULL
year            INTEGER NOT NULL
phase           TEXT NOT NULL                -- 'voting' | 'listening'
startDate       TIMESTAMP NOT NULL
endDate         TIMESTAMP NOT NULL
votingEndsAt    TIMESTAMP NOT NULL
winnerId        UUID                         -- references albums.id (FK omitted to avoid circular TS inference)
createdAt       TIMESTAMP DEFAULT NOW()
```

> **Note on `winnerId` FK**: A foreign key reference to `albums.id` was intentionally omitted because `cycles` and `albums` mutually reference each other, which causes TypeScript circular type inference errors with Drizzle. The application-layer reference is maintained correctly; only the Drizzle schema annotation is absent.

### `albums` Table

```sql
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
spotifyId            TEXT NOT NULL
title                TEXT NOT NULL
artist               TEXT NOT NULL
coverUrl             TEXT NOT NULL
spotifyUrl           TEXT NOT NULL
tracks               JSONB                    -- string[] of track names cached from Deezer
cycleId              UUID NOT NULL REFERENCES cycles(id)
submittedByFid       INTEGER                  -- Legacy: nullable for new Privy users
submittedByUserId    UUID REFERENCES users(id) -- New: unified user ID
submittedByUsername  TEXT NOT NULL
status               TEXT NOT NULL            -- 'voting' | 'selected' | 'lost'
avgRating            REAL
totalReviews         INTEGER DEFAULT 0
mostLovedTrack       TEXT
mostLovedTrackVotes  INTEGER DEFAULT 0
createdAt            TIMESTAMP DEFAULT NOW()

-- Constraints:
UNIQUE INDEX (cycleId, spotifyId)                          -- no duplicate submissions per cycle
UNIQUE INDEX (cycleId, status) WHERE status = 'selected'   -- only one winner per cycle
```

### `votes` Table

```sql
id        UUID PRIMARY KEY DEFAULT gen_random_uuid()
albumId   UUID NOT NULL REFERENCES albums(id)
voterFid  INTEGER                              -- Legacy: nullable for Privy users
voterId   UUID REFERENCES users(id)            -- New: unified user ID
createdAt TIMESTAMP DEFAULT NOW()

-- Constraints:
UNIQUE INDEX (albumId, voterId)  WHERE voterId  IS NOT NULL  -- one vote per user per album
UNIQUE INDEX (albumId, voterFid) WHERE voterFid IS NOT NULL  -- one vote per FID per album (legacy)
```

### `reviews` Table

```sql
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
albumId          UUID NOT NULL REFERENCES albums(id)
reviewerFid      INTEGER                      -- Legacy: nullable for Privy users
reviewerId       UUID REFERENCES users(id)    -- New: unified user ID
reviewerUsername TEXT NOT NULL
reviewerPfp      TEXT
rating           INTEGER NOT NULL             -- 1-5
reviewText       TEXT NOT NULL                -- min 50 chars (enforced in application)
favoriteTrack    TEXT
hasListened      BOOLEAN DEFAULT FALSE
createdAt        TIMESTAMP DEFAULT NOW()

-- Constraints:
CHECK (rating >= 1 AND rating <= 5)
UNIQUE INDEX (albumId, reviewerId)   WHERE reviewerId   IS NOT NULL  -- one review per user per album
UNIQUE INDEX (albumId, reviewerFid)  WHERE reviewerFid  IS NOT NULL  -- one review per FID per album (legacy)
```

---

## Server Actions

All actions live in `src/db/actions/`. They run server-side only (`'use server'`).

### Cycle Actions (`cycle-actions.ts`)

| Function | Description |
|----------|-------------|
| `getCurrentCycle()` | Get the active cycle or null |
| `getCycleWithCountdown(cycleId)` | Get cycle with computed countdown object |
| `getOrCreateCurrentCycle()` | Get active cycle; auto-creates Week 1 if none exists |
| `getCycleAlbum(cycleId)` | Get the winning album for a cycle |
| `getPastAlbums(year)` | Get all past winners for a year (single JOIN query) |
| `getAlbumById(albumId)` | Get album with full stats (single JOIN query) |
| `getListenerCount(cycleId)` | Count unique reviewers for a cycle |
| `createCycle(data)` | Insert a new cycle record |
| `updateCyclePhase(cycleId, phase, winnerId?)` | Update cycle phase and optionally set winner |
| `autoTransitionToListening(cycleId)` | Transition voting → listening with winner selection; wrapped in `db.transaction()` with idempotency check |

**Important**: `autoTransitionToListening` is idempotent — it re-checks the cycle's current phase inside the transaction and returns early if already transitioned. Safe to call multiple times or from concurrent requests.

### Submission Actions (`submission-actions.ts`)

| Function | Description |
|----------|-------------|
| `submitAlbum(data)` | Submit album + auto-vote; wrapped in `db.transaction()` |
| `getSubmissions(cycleId)` | All voting submissions with vote counts (single LEFT JOIN + GROUP BY) |
| `getSubmissionsWithUserVotes(cycleId, fid?, userId?)` | Submissions with per-user vote status |
| `getUserSubmissionCount(cycleId, fid?, userId?)` | User's submission count for the cycle |
| `castVote(albumId, fid?, userId?)` | Cast a vote; wrapped in `db.transaction()` |
| `selectWinner(cycleId)` | Auto-select winner by vote count; tiebreaker = earliest submission |

**Transaction semantics**:
- `submitAlbum`: past-winner check → duplicate check → album INSERT → auto-vote INSERT, all atomic
- `castVote`: album status check → existing vote check → vote INSERT, all atomic
- On unique index violation (concurrent request wins race), both return a user-friendly error instead of throwing

**Return type pattern**: All functions return `{ success: true as const, ... }` or `{ success: false as const, error: string }` so TypeScript can narrow the discriminated union correctly.

### Review Actions (`review-actions.ts`)

| Function | Description |
|----------|-------------|
| `submitReview(data)` | Submit review; wrapped in `db.transaction()` |
| `getAlbumReviews(albumId)` | All reviews for an album, ordered newest first |
| `getUserReview(albumId, fid?, userId?)` | Get a specific user's review, or null |
| `getAlbumStats(albumId)` | Get album avg rating, total reviews, most loved track |

**Transaction semantics**:
- `submitReview`: duplicate check → review INSERT → `updateAlbumStats()`, all atomic
- `updateAlbumStats` accepts an optional Drizzle transaction client so it can run inside an existing transaction without starting a nested one

**Avatar fallback**: Reviews from Privy users with no Farcaster PFP use DiceBear seeded from `reviewerId ?? reviewerFid ?? 'anon'` to guarantee a non-broken image.

### Profile Actions (`profile-actions.ts`)

| Function | Description |
|----------|-------------|
| `getProfileByFid(fid)` | Full profile: submissions, reviews, stats, member since |
| `getUserInfoByFid(fid)` | Basic user info (username, pfp) for other users' profile views |

### User Actions (`user-actions.ts`)

| Function | Description |
|----------|-------------|
| `getOrCreateFarcasterUser(data)` | Upsert user record for FC login |
| `getOrCreatePrivyUser(data)` | Upsert user record for Privy login |
| `getUserByFid(fid)` | Lookup user by Farcaster ID |
| `getUserByPrivyId(privyId)` | Lookup user by Privy ID |
| `getUserByWalletAddress(address)` | Lookup for account linking (FC + Privy wallet match) |

---

## React Hooks

All hooks live in `src/hooks/`. They call server actions and manage loading/error state.

### `use-auth.ts` — Unified Authentication

```ts
useAuth() → UseAuthResult
```

Priority order:
1. If in Farcaster mini app context → use Farcaster identity
2. If logged in via Privy → use Privy identity (with optional linked Farcaster)
3. Otherwise → not authenticated

Returns:
```ts
{
  user: UnifiedUser | null,   // null if not logged in
  isLoading: boolean,
  isInitialized: boolean,
  isAuthenticated: boolean,
  isFarcasterUser: boolean,
  isPrivyUser: boolean,
  login: () => void,          // opens Privy modal
  logout: () => Promise<void>,
  privy: { ready, authenticated, login, logout }  // raw Privy state
}
```

`UnifiedUser` shape:
```ts
{
  id: string,             // DB UUID — use this for all DB references
  username: string,
  displayName: string,
  pfpUrl: string | null,
  authProvider: 'farcaster' | 'privy',
  fid: number | null,     // null for Privy-only users
  privyId: string | null, // null for FC-only users
  email: string | null,
  walletAddress: string | null,
  createdAt: Date,
}
```

**Always use `user.id` (not `user.fid`) for DB writes** unless you specifically need the legacy FID path.

### `use-cycle.ts`
- `useCycle()` — Current cycle with live countdown
- `useCurrentAlbum(cycleId)` — Current or winning album
- `usePastAlbums(year)` — Archive albums list
- `useListenerCount(cycleId)` — Unique reviewer count

### `use-submissions.ts`
- `useSubmissions(cycleId, fid?, userId?)` — Submissions with per-user vote status
- `useUserSubmissionCount(cycleId, fid?, userId?)` — User's submission count
- `useSubmitAlbum()` — Mutation for submitting an album
- `useVote()` — Mutation for casting a vote

### `use-reviews.ts`
- `useReviews(albumId)` — Reviews for an album
- `useUserReview(albumId, fid?, userId?)` — Whether current user reviewed this album
- `useSubmitReview()` — Mutation for submitting a review

### `use-profile.ts`
- `useProfile(fid)` — Full profile data (submissions, reviews, stats, memberSince)
- `useUserInfo(fid)` — Basic user info for viewing other users' profiles

### `use-album-buzz.ts`
- `useAlbumBuzz(title, artist)` — Farcaster casts mentioning the album
- Returns: `{ casts[], count, isLoading, hasMore, loadMore() }`

---

## External API

### Deezer API (`src/lib/deezer.ts`)

Proxied through `/api/deezer/search?q=<query>` to avoid CORS.

- `searchAlbum(query)` — Search for albums by title/artist
- `getAlbumById(id)` — Get album details
- `fetchAlbumMetadata(query)` — Returns `{ title, artist, coverUrl, tracks[] }`

No authentication required — Deezer's API is public.

---

## Component Structure

| Component              | Location                                        | Data Source                        |
| ---------------------- | ----------------------------------------------- | ---------------------------------- |
| `MiniApp`              | `src/features/app/mini-app.tsx`                 | useAuth, profile state             |
| `NowPlayingTab`        | `src/features/app/components/`                  | useCycle, useCurrentAlbum          |
| `VoteTab`              | `src/features/app/components/`                  | useSubmissions, useVote            |
| `ArchiveTab`           | `src/features/app/components/`                  | usePastAlbums                      |
| `ProfileView`          | `src/features/app/components/`                  | useProfile, useUserInfo            |
| `SubmissionForm`       | `src/features/app/components/`                  | Deezer API, useSubmitAlbum         |
| `AlbumDetailView`      | `src/features/app/components/`                  | useReviews, AlbumBuzzSection       |
| `ReviewForm`           | `src/features/app/components/`                  | useSubmitReview                    |
| `AlbumBuzzSection`     | `src/features/app/components/`                  | useAlbumBuzz (Neynar cast search)  |
| `CycleStatusBanner`    | `src/features/app/components/`                  | Props from parent                  |
| `HowItWorks`           | `src/features/app/components/`                  | Static content                     |

---

## Share Configuration

### Share Types

| Type      | Trigger          | Data                              |
| --------- | ---------------- | --------------------------------- |
| `album`   | Now Playing Tab  | albumTitle, artist, weekNumber    |
| `review`  | Album Detail     | albumTitle, avgRating, reviews    |
| `journey` | Archive Tab      | year, albums, reviews, avgRating  |

### Share Image Route

`src/app/api/share/image/[type]/route.tsx` — Generates OG images for each share type.

---

## Validation Rules

### Submissions (enforced in `submitAlbum`)
- Max 3 per cycle per user
- No duplicate Spotify IDs in same cycle (application check + DB unique index)
- No past winners (`status = 'selected'`)
- Duplicate-check + INSERT is atomic (single transaction)

### Voting (enforced in `castVote`)
- One vote per album per user (application check + DB unique index)
- No un-voting
- Only albums with `status = 'voting'`
- Authentication required (must have `fid` or `userId`)
- Existence check + INSERT is atomic (single transaction)

### Reviews (enforced in `submitReview`)
- One review per album per user (application check + DB unique index)
- Rating must be 1-5 (application check + DB CHECK constraint)
- Text must be 50+ characters
- Review INSERT + `updateAlbumStats` is atomic (single transaction)

---

## Key Implementation Notes

1. **Dual identity**: All actions accept `fid` (legacy Farcaster) and `userId` (new unified ID). Never assume `fid` is present; always check `userId` first.
2. **Atomic writes**: Every check-then-write operation runs inside `db.transaction()`. DB-level unique indexes provide a last-resort safety net for concurrent requests.
3. **N+1 free**: Vote and review counts are always fetched with `LEFT JOIN + GROUP BY`, not per-row queries. Use `getTableColumns()` from `drizzle-orm` when spreading all columns in a JOIN.
4. **Discriminated unions**: Server action return types use `success: true as const` / `success: false as const` so TypeScript can narrow them after `if (!result.success)` checks.
5. **Auto-Create Cycle**: `getOrCreateCurrentCycle()` ensures a cycle always exists — no manual setup required on first deploy.
6. **Deezer vs Spotify**: Deezer is used for album metadata (no API key needed). Spotify URLs are stored for user-side playback links only.
7. **No mock data**: All components use real database data and show proper empty states.
8. **Loading states**: All tabs use skeleton loaders while data is fetching.
9. **DiceBear avatars**: Privy users with no Farcaster PFP get `https://api.dicebear.com/9.x/lorelei/svg?seed=<userId>`.
10. **Account linking**: Users with matching wallet addresses are automatically linked across FC and Privy.
11. **Community Buzz**: Neynar `useCastSearch` hook in `hybrid` mode with `algorithmic` sort for best relevance.
12. **Admin security**: `/api/admin/reset-cycle` requires `Authorization: Bearer <ADMIN_SECRET>` — returns 401 otherwise.

---

## Cycle Schedule (1-Week)

| Day              | Phase      | Activity                                |
| ---------------- | ---------- | --------------------------------------- |
| Monday           | Voting     | Voting opens, members submit albums     |
| Mon–Thu          | Voting     | Community votes on submissions          |
| Thursday 10pm WIB| Cutoff     | Voting closes, winner auto-selected     |
| Friday           | Listening  | Winner announced, listening begins      |
| Fri–Sun          | Listening  | Everyone listens together               |
| Sat–Sun          | Reviewing  | Members write reviews                   |
| Monday           | New Cycle  | Repeat                                  |

**Cycle Configuration** (in `getOrCreateCurrentCycle()`):
- Voting period: 4 days (Mon–Thu)
- Listening period: 3 days (Fri–Sun)
- Total cycle: 7 days
- Albums per year: 52

---

## Environment Variables

| Variable                    | Required | Purpose                                    |
| --------------------------- | -------- | ------------------------------------------ |
| `DATABASE_URL`              | Yes      | Neon PostgreSQL connection string          |
| `NEXT_PUBLIC_PRIVY_APP_ID`  | Yes      | Privy app ID for universal login           |
| `PRIVY_APP_SECRET`          | Yes      | Privy app secret                           |
| `NEYNAR_API_KEY`            | Yes      | Neynar SDK for Farcaster cast search       |
| `ADMIN_SECRET`              | Yes      | Bearer token for admin API endpoints       |
| `COINGECKO_API_KEY`         | No       | CoinGecko API key (optional, demo feature) |

Validated at startup in `src/config/private-config.ts` using Zod. App will fail to start if required variables are missing.

---

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/deezer/search` | GET | None | Proxy Deezer album search (avoids CORS) |
| `/api/share/image/[type]` | GET | None | Generate OG share images |
| `/api/admin/reset-cycle` | GET | Bearer token | Force-create a new voting cycle |

---

## Files Reference

### Core Files

| File | Purpose |
|------|---------|
| `src/db/schema.ts` | All table definitions with constraints |
| `src/db/actions/cycle-actions.ts` | Cycle management + winner selection |
| `src/db/actions/submission-actions.ts` | Album submission + voting (atomic) |
| `src/db/actions/review-actions.ts` | Review submission + album stats (atomic) |
| `src/db/actions/profile-actions.ts` | User profile queries |
| `src/db/actions/user-actions.ts` | Unified user identity (FC + Privy) |
| `src/config/private-config.ts` | Zod-validated server env vars |

### Hooks

| File | Purpose |
|------|---------|
| `src/hooks/use-auth.ts` | Unified auth (FC + Privy), UnifiedUser type |
| `src/hooks/use-cycle.ts` | Cycle state + live countdown |
| `src/hooks/use-submissions.ts` | Submissions + voting mutations |
| `src/hooks/use-reviews.ts` | Review queries + mutations |
| `src/hooks/use-profile.ts` | User profile data |
| `src/hooks/use-album-buzz.ts` | Farcaster cast search |

### Auth Configuration

| File | Purpose |
|------|---------|
| `src/lib/privy.ts` | Privy config (login methods, appearance) |
| `src/features/app/privy-wrapper.tsx` | PrivyProvider wrapper (lazy-loaded) |
| `src/features/app/components/login-modal.tsx` | Multi-provider login UI |

### Components

| File | Purpose |
|------|---------|
| `src/features/app/mini-app.tsx` | Main app shell |
| `src/features/app/components/now-playing-tab.tsx` | Current album + buzz |
| `src/features/app/components/vote-tab.tsx` | Submissions + voting |
| `src/features/app/components/archive-tab.tsx` | The 52 archive grid |
| `src/features/app/components/profile-view.tsx` | User profile page |
| `src/features/app/components/submission-form.tsx` | Album submission form |
| `src/features/app/components/review-form.tsx` | Review submission form |
| `src/features/app/components/album-detail-view.tsx` | Album details + reviews |
| `src/features/app/components/album-buzz-section.tsx` | Farcaster casts about album |

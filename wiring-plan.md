# Playgroup - Wiring Plan

> **Status**: ✅ All Features Complete - Ready to Publish
> **Last Updated**: 2025-02-08
> **Cycle Duration**: 1 week (52 albums/year)
> **Universal Login**: ✅ Privy Configured

---

## Features Overview

| Feature              | Type     | Status      | Notes                           |
| -------------------- | -------- | ----------- | ------------------------------- |
| Cycles & Albums      | database | ✅ Complete | Auto-creates first cycle        |
| Submissions & Voting | database | ✅ Complete | Full validation rules           |
| Reviews              | database | ✅ Complete | Stats auto-update               |
| Album Metadata       | external | ✅ Complete | Deezer API (no auth needed)     |
| User Identity        | social   | ✅ Complete | Unified auth (FC + Privy)       |
| Share Buttons        | sharing  | ✅ Complete | 3 personalized share types      |
| User Profiles        | social   | ✅ Complete | Header icon, clickable usernames |
| Community Buzz       | social   | ✅ Complete | Farcaster cast search for albums |
| Universal Access     | auth     | ✅ Complete | Privy (email/Google) + Farcaster |

---

## Database Schema

### `cycles` Table
```sql
id              UUID PRIMARY KEY
weekNumber      INTEGER NOT NULL
year            INTEGER NOT NULL
phase           TEXT NOT NULL  -- 'voting' | 'listening'
startDate       TIMESTAMP NOT NULL
endDate         TIMESTAMP NOT NULL
votingEndsAt    TIMESTAMP NOT NULL
winnerId        UUID
createdAt       TIMESTAMP DEFAULT NOW()
```

### `albums` Table
```sql
id                   UUID PRIMARY KEY
spotifyId            TEXT NOT NULL
title                TEXT NOT NULL
artist               TEXT NOT NULL
coverUrl             TEXT NOT NULL
spotifyUrl           TEXT NOT NULL
tracks               JSONB  -- string[] from Deezer
cycleId              UUID NOT NULL
submittedByFid       INTEGER NOT NULL
submittedByUsername  TEXT NOT NULL
status               TEXT NOT NULL  -- 'voting' | 'selected' | 'lost'
avgRating            REAL
totalReviews         INTEGER DEFAULT 0
mostLovedTrack       TEXT
mostLovedTrackVotes  INTEGER DEFAULT 0
createdAt            TIMESTAMP DEFAULT NOW()
```

### `votes` Table
```sql
id        UUID PRIMARY KEY
albumId   UUID NOT NULL
voterFid  INTEGER NOT NULL
createdAt TIMESTAMP DEFAULT NOW()
```

### `reviews` Table
```sql
id               UUID PRIMARY KEY
albumId          UUID NOT NULL
reviewerFid      INTEGER           -- Legacy, nullable for Privy users
reviewerUserId   UUID              -- Unified user ID
reviewerUsername TEXT NOT NULL
reviewerPfp      TEXT
rating           INTEGER NOT NULL  -- 1-5
reviewText       TEXT NOT NULL     -- min 50 chars
favoriteTrack    TEXT
hasListened      BOOLEAN DEFAULT FALSE
createdAt        TIMESTAMP DEFAULT NOW()
```

### `users` Table (Privy Integration)
```sql
id              UUID PRIMARY KEY
fid             INTEGER           -- Farcaster ID (nullable - only FC users)
privyId         TEXT              -- Privy ID (nullable - only Privy users)
walletAddress   TEXT              -- Always present (FC or Privy wallet)
email           TEXT              -- Privy users only
username        TEXT NOT NULL     -- FC username OR email prefix
displayName     TEXT NOT NULL     -- Display name
pfpUrl          TEXT              -- FC PFP OR DiceBear avatar
authProvider    TEXT NOT NULL     -- 'farcaster' | 'privy'
createdAt       TIMESTAMP DEFAULT NOW()
updatedAt       TIMESTAMP DEFAULT NOW()
```

---

## Server Actions

### Cycle Actions (`src/db/actions/cycle-actions.ts`)
- `getCurrentCycle()` - Get active cycle
- `getCycleWithCountdown()` - Get cycle with computed countdown
- `getOrCreateCurrentCycle()` - Auto-create Week 1 if none exists
- `getCycleAlbum(cycleId)` - Get winning album for cycle
- `getPastAlbums(year)` - Get all past winners
- `getAlbumById(albumId)` - Get album with full stats
- `getListenerCount(cycleId)` - Count unique reviewers
- `createCycle(data)` - Create new cycle
- `updateCyclePhase(cycleId, phase, winnerId)` - Update phase

### Submission Actions (`src/db/actions/submission-actions.ts`)
- `submitAlbum(data)` - Submit album with metadata + auto-vote for submitter
- `getSubmissions(cycleId)` - Get all submissions with votes
- `getSubmissionsWithUserVotes(cycleId, fid)` - Include user's vote status
- `getUserSubmissionCount(fid, cycleId)` - Check 3-per-cycle limit
- `castVote(albumId, fid)` - Cast vote (one per album)
- `selectWinner(cycleId)` - Auto-select winner by votes

### Review Actions (`src/db/actions/review-actions.ts`)
- `submitReview(data)` - Submit review with rating (supports fid or userId)
- `getAlbumReviews(albumId)` - Get all reviews for album
- `getUserReview(albumId, fid?, userId?)` - Check if user reviewed (dual identity)
- `updateAlbumStats(albumId)` - Recalculate stats

### Profile Actions (`src/db/actions/profile-actions.ts`)
- `getProfileByFid(fid)` - Get complete profile data (submissions, reviews, stats)
- `getUserInfoByFid(fid)` - Get basic user info (username, pfp) from DB

### User Actions (`src/db/actions/user-actions.ts`)
- `getOrCreateFarcasterUser(fid, username, pfpUrl, walletAddress)` - Create/get FC user
- `getOrCreatePrivyUser(privyId, email, walletAddress)` - Create/get Privy user
- `getUserByFid(fid)` - Lookup by Farcaster ID
- `getUserByPrivyId(privyId)` - Lookup by Privy ID
- `getUserByWalletAddress(address)` - Lookup for account linking

---

## React Hooks

### `src/hooks/use-cycle.ts`
- `useCycle()` - Current cycle with live countdown
- `useCurrentAlbum(cycleId)` - Current/winning album
- `usePastAlbums(year)` - Archive albums list
- `useListenerCount(cycleId)` - Active listener count

### `src/hooks/use-submissions.ts`
- `useSubmissions(cycleId, fid)` - Submissions with vote status
- `useUserSubmissionCount(fid, cycleId)` - User's submission count
- `useSubmitAlbum()` - Mutation for submitting
- `useVote()` - Mutation for voting

### `src/hooks/use-reviews.ts`
- `useReviews(albumId)` - Reviews for an album
- `useUserReview(albumId, fid?, userId?)` - Check user's review (dual identity)
- `useSubmitReview()` - Mutation for submitting (supports fid or userId)

### `src/hooks/use-profile.ts`
- `useProfile(fid)` - Full profile data (submissions, reviews, stats, memberSince)
- `useUserInfo(fid)` - Basic user info lookup for other users' profiles

### `src/hooks/use-album-buzz.ts`
- `useAlbumBuzz(title, artist)` - Search Farcaster casts mentioning album
- Returns: casts[], count, isLoading, hasMore, loadMore()

### `src/hooks/use-auth.ts` (Unified Authentication)
- `useAuth()` - Unified auth hook for FC + Privy
- Returns: user, isLoading, isAuthenticated, isFarcasterUser, isPrivyUser, login, logout
- Priority: Farcaster (if in mini app) → Privy → Not authenticated
- User object includes: id, fid?, username, displayName, pfpUrl, authProvider

---

## External API

### Deezer API (`src/lib/deezer.ts`)
- `searchAlbum(query)` - Search for albums
- `getAlbumById(id)` - Get album details
- `fetchAlbumMetadata(query)` - Returns: title, artist, coverUrl, tracks[]

**API Endpoint**: `GET /api/deezer/search?q=<query>`

No authentication required - Deezer API is public.

---

## Component Structure

| Component              | Location                                      | Data Source        |
| ---------------------- | --------------------------------------------- | ------------------ |
| `MiniApp`              | `src/features/app/`                           | useFarcasterUser, profile state |
| `NowPlayingTab`        | `src/features/app/components/`                | useCycle, useCurrentAlbum |
| `VoteTab`              | `src/features/app/components/`                | useSubmissions, useVote |
| `ArchiveTab`           | `src/features/app/components/`                | usePastAlbums |
| `ProfileView`          | `src/features/app/components/`                | useProfile, useUserInfo |
| `SubmissionForm`       | `src/features/app/components/`                | Deezer API, useSubmitAlbum |
| `AlbumDetailView`      | `src/features/app/components/`                | useReviews, AlbumBuzzSection |
| `ReviewForm`           | `src/features/app/components/`                | useSubmitReview |
| `AlbumBuzzSection`     | `src/features/app/components/`                | useAlbumBuzz (Neynar cast search) |
| `CycleStatusBanner`    | `src/features/app/components/`                | Props from parent |
| `HowItWorks`           | `src/features/app/components/`                | Static content |

---

## Share Configuration

### Share Types

| Type      | Location        | Data                              |
| --------- | --------------- | --------------------------------- |
| `album`   | Now Playing Tab | albumTitle, artist, weekNumber    |
| `review`  | Album Detail    | albumTitle, avgRating, reviews    |
| `journey` | Archive Tab     | year, albums, reviews, avgRating  |

### Share Image Route
`src/app/api/share/image/[type]/route.tsx`

---

## Validation Rules

### Submissions
- ✅ Max 3 per cycle per user
- ✅ No duplicate Spotify IDs in same cycle
- ✅ No past winners (status='selected')

### Voting
- ✅ One vote per album per user
- ✅ No un-voting
- ✅ Only albums in 'voting' status
- ✅ Auto-vote on submission (submitter starts with 1 vote)

### Reviews
- ✅ One review per album per user
- ✅ Rating must be 1-5
- ✅ Text must be 50+ characters
- ✅ Auto-updates album stats on submit

---

## Key Implementation Notes

1. **Auto-Create Cycle**: `getOrCreateCurrentCycle()` ensures a cycle exists on first load
2. **Deezer vs Spotify**: Using Deezer for metadata (no API key wait), Spotify links for playback
3. **No Mock Data**: All components use real database, show empty states when no data
4. **Loading States**: All tabs show skeleton loaders while fetching
5. **Unified Auth**: All user actions use `useAuth()` hook supporting both Farcaster and Privy users
6. **Dual Identity**: Actions accept both `fid` (legacy) and `userId` (new) for backwards compatibility
7. **Auto-Vote**: When user submits album, they automatically vote for it (starts with 1 vote)
8. **Typography**: Outfit (geometric sans-serif) for UI, JetBrains Mono for code/numbers
9. **User Profiles**: Access via header avatar icon, clickable usernames throughout app
10. **Profile Stats**: Submissions, wins, votes received, reviews, avg rating given, member since
11. **Community Buzz**: Real Farcaster cast search replaces hardcoded listener count; uses Neynar `useCastSearch` hook with hybrid mode for best results
12. **Privy Integration**: Lazy-loaded PrivyProvider, DiceBear avatars for non-FC users, email prefix usernames
13. **Account Linking**: Users with matching wallet addresses are automatically linked (FC + Privy)

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
- Voting period: 4 days (Mon-Thu)
- Listening period: 3 days (Fri-Sun)
- Total cycle: 7 days
- Albums per year: 52

---

## Environment Variables

| Variable                    | Required | Status | Purpose                              |
| --------------------------- | -------- | ------ | ------------------------------------ |
| `DATABASE_URL`              | Yes      | ✅     | Neon PostgreSQL connection           |
| `NEXT_PUBLIC_PRIVY_APP_ID`  | Yes      | ✅     | Privy app ID for universal login     |
| `PRIVY_APP_SECRET`          | Yes      | ✅     | Privy app secret                     |
| `NEYNAR_API_KEY`            | Yes      | ✅     | Neynar SDK (auto-configured)         |

**All required credentials are configured. App is production-ready.**

---

## Files Reference

### Core Files

| File | Purpose |
|------|---------|
| `src/db/schema.ts` | Database schema (5 tables) |
| `src/db/actions/cycle-actions.ts` | Cycle management |
| `src/db/actions/submission-actions.ts` | Album submission + voting |
| `src/db/actions/review-actions.ts` | Review system |
| `src/db/actions/profile-actions.ts` | User profile queries |
| `src/db/actions/user-actions.ts` | Unified user identity (FC + Privy) |

### Hooks

| File | Purpose |
|------|---------|
| `src/hooks/use-cycle.ts` | Cycle state + countdown |
| `src/hooks/use-submissions.ts` | Submissions + voting mutations |
| `src/hooks/use-reviews.ts` | Review queries + mutations |
| `src/hooks/use-profile.ts` | User profile data |
| `src/hooks/use-album-buzz.ts` | Farcaster cast search |
| `src/hooks/use-auth.ts` | Unified auth (FC + Privy) |

### Auth Configuration

| File | Purpose |
|------|---------|
| `src/lib/privy.ts` | Privy config (login methods, appearance) |
| `src/features/app/privy-wrapper.tsx` | PrivyProvider wrapper |
| `src/features/app/components/login-modal.tsx` | Multi-provider login UI |

### Components

| File | Purpose |
|------|---------|
| `src/features/app/mini-app.tsx` | Main app shell |
| `src/features/app/components/now-playing-tab.tsx` | Current album + buzz |
| `src/features/app/components/vote-tab.tsx` | Submissions + voting |
| `src/features/app/components/archive-tab.tsx` | The 52 archive grid |
| `src/features/app/components/profile-view.tsx` | User profile page |
| `src/features/app/components/submission-form.tsx` | Album submission |
| `src/features/app/components/review-form.tsx` | Review submission |
| `src/features/app/components/album-detail-view.tsx` | Album details + reviews |
| `src/features/app/components/album-buzz-section.tsx` | Farcaster casts about album |

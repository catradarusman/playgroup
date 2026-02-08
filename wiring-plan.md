# Playgroup - Wiring Plan

> **Status**: ✅ All Features Complete
> **Last Updated**: 2025-02-08

---

## Features Overview

| Feature              | Type     | Status      | Notes                           |
| -------------------- | -------- | ----------- | ------------------------------- |
| Cycles & Albums      | database | ✅ Complete | Auto-creates first cycle        |
| Submissions & Voting | database | ✅ Complete | Full validation rules           |
| Reviews              | database | ✅ Complete | Stats auto-update               |
| Album Metadata       | external | ✅ Complete | Deezer API (no auth needed)     |
| User Identity        | social   | ✅ Complete | Farcaster FID-based             |
| Share Buttons        | sharing  | ✅ Complete | 3 personalized share types      |

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
reviewerFid      INTEGER NOT NULL
reviewerUsername TEXT NOT NULL
reviewerPfp      TEXT
rating           INTEGER NOT NULL  -- 1-5
reviewText       TEXT NOT NULL     -- min 50 chars
favoriteTrack    TEXT
hasListened      BOOLEAN DEFAULT FALSE
createdAt        TIMESTAMP DEFAULT NOW()
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
- `submitAlbum(data)` - Submit album with metadata
- `getSubmissions(cycleId)` - Get all submissions with votes
- `getSubmissionsWithUserVotes(cycleId, fid)` - Include user's vote status
- `getUserSubmissionCount(fid, cycleId)` - Check 3-per-cycle limit
- `castVote(albumId, fid)` - Cast vote (one per album)
- `selectWinner(cycleId)` - Auto-select winner by votes

### Review Actions (`src/db/actions/review-actions.ts`)
- `submitReview(data)` - Submit review with rating
- `getAlbumReviews(albumId)` - Get all reviews for album
- `getUserReview(albumId, fid)` - Check if user reviewed
- `updateAlbumStats(albumId)` - Recalculate stats

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
- `useUserReview(albumId, fid)` - Check user's review
- `useSubmitReview()` - Mutation for submitting

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
| `NowPlayingTab`        | `src/features/app/components/`                | useCycle, useCurrentAlbum |
| `VoteTab`              | `src/features/app/components/`                | useSubmissions, useVote |
| `ArchiveTab`           | `src/features/app/components/`                | usePastAlbums |
| `SubmissionForm`       | `src/features/app/components/`                | Deezer API, useSubmitAlbum |
| `AlbumDetailView`      | `src/features/app/components/`                | useReviews |
| `ReviewForm`           | `src/features/app/components/`                | useSubmitReview |
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
5. **FID-Based Auth**: All user actions use Farcaster FID from `useFarcasterUser()`

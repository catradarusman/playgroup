# Wiring Plan

> Created: Phase 4 - Feature Planning
> App: Playgroup (music community voting app)
> **Status**: ✅ ALL FEATURES IMPLEMENTED - Awaiting Spotify Credentials

---

## Features Overview

| Feature | Type | Status | Files |
|---------|------|--------|-------|
| Cycles & Albums | database | ✅ Complete | `cycle-actions.ts`, `use-cycle.ts` |
| Submissions & Voting | database | ✅ Complete | `submission-actions.ts`, `use-submissions.ts` |
| Reviews | database | ✅ Complete | `review-actions.ts`, `use-reviews.ts` |
| Spotify API | external | ✅ Complete (needs credentials) | `src/lib/spotify.ts`, `/api/spotify/album` |
| User Identity | social | ✅ Complete | `useFarcasterUser()` integrated |
| Share Buttons | sharing | ✅ Complete | 3 personalized share images |

---

## Implementation Summary

### Database Schema (`src/db/schema.ts`)

```typescript
// cycles - tracks 2-week listening cycles
export const cycles = pgTable("cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  phase: text("phase").notNull(), // 'voting' | 'listening'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  votingEndsAt: timestamp("voting_ends_at").notNull(),
  winnerId: uuid("winner_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// albums - submitted and winning albums
export const albums = pgTable("albums", {
  id: uuid("id").primaryKey().defaultRandom(),
  spotifyId: text("spotify_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  coverUrl: text("cover_url").notNull(),
  spotifyUrl: text("spotify_url").notNull(),
  tracks: jsonb("tracks"), // string[] from Spotify API
  cycleId: uuid("cycle_id").notNull(),
  submittedByFid: integer("submitted_by_fid").notNull(),
  submittedByUsername: text("submitted_by_username").notNull(),
  status: text("status").notNull(), // 'voting' | 'selected' | 'lost'
  avgRating: real("avg_rating"),
  totalReviews: integer("total_reviews").default(0),
  mostLovedTrack: text("most_loved_track"),
  mostLovedTrackVotes: integer("most_loved_track_votes").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// votes - one per user per album
export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  albumId: uuid("album_id").notNull(),
  voterFid: integer("voter_fid").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// reviews - one per user per album
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  albumId: uuid("album_id").notNull(),
  reviewerFid: integer("reviewer_fid").notNull(),
  reviewerUsername: text("reviewer_username").notNull(),
  reviewerPfp: text("reviewer_pfp"),
  rating: integer("rating").notNull(), // 1-5
  reviewText: text("review_text").notNull(), // min 50 chars
  favoriteTrack: text("favorite_track"),
  hasListened: boolean("has_listened").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

### Server Actions

#### Cycle Actions (`src/db/actions/cycle-actions.ts`)
- `getCurrentCycle()` - Get active cycle with phase
- `getCycleWithCountdown()` - Get cycle with computed countdown
- `getCycleAlbum(cycleId)` - Get the winning album for a cycle
- `getPastAlbums(year)` - Get all past winners for archive
- `getAlbumById(albumId)` - Get album with full stats
- `getListenerCount(cycleId)` - Count unique reviewers

#### Submission Actions (`src/db/actions/submission-actions.ts`)
- `submitAlbum(data)` - Submit album with Spotify metadata & tracks
- `getSubmissions(cycleId)` - Get all submissions with vote counts
- `getSubmissionsWithUserVotes(cycleId, fid)` - Include user's vote status
- `getUserSubmissionCount(fid, cycleId)` - Check 3-per-cycle limit
- `castVote(albumId, fid)` - Cast vote (one per album)
- `selectWinner(cycleId)` - Auto-select winner by votes

#### Review Actions (`src/db/actions/review-actions.ts`)
- `submitReview(data)` - Submit review with rating & favorite track
- `getAlbumReviews(albumId)` - Get all reviews for album
- `getUserReview(albumId, fid)` - Check if user reviewed
- `updateAlbumStats(albumId)` - Recalculate avg rating & most loved track

---

### React Hooks

#### `src/hooks/use-cycle.ts`
- `useCycle()` - Current cycle with live countdown (updates every minute)
- `useCurrentAlbum(cycleId)` - Current/winning album for cycle
- `usePastAlbums(year)` - Archive albums list
- `useListenerCount(cycleId)` - Active listener count

#### `src/hooks/use-submissions.ts`
- `useSubmissions(cycleId, fid)` - Submissions with vote status
- `useUserSubmissionCount(fid, cycleId)` - User's submission count
- `useSubmitAlbum()` - Mutation for submitting (includes tracks)
- `useVote()` - Mutation for voting

#### `src/hooks/use-reviews.ts`
- `useReviews(albumId)` - Reviews for an album
- `useUserReview(albumId, fid)` - Check user's review
- `useSubmitReview()` - Mutation for submitting

---

### Spotify API Integration

#### `src/lib/spotify.ts`
- `getAccessToken()` - Client Credentials flow (cached)
- `extractSpotifyAlbumId(url)` - Parse album ID from various URL formats
- `fetchAlbumMetadata(spotifyUrl)` - Returns: title, artist, coverUrl, tracks[], etc.
- `isSpotifyConfigured()` - Check if credentials are set

#### `src/app/api/spotify/album/route.ts`
- `GET /api/spotify/album?url=<spotify_url>` - Fetch album metadata

**⚠️ Environment Variables Required (BEFORE PUBLISHING):**
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

**Get credentials at:** [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)

---

### Share Buttons

Three personalized share images via `share-manager`:

| Location | Share Type | Data |
|----------|-----------|------|
| Now Playing Tab | `album` | albumTitle, artist, weekNumber, listeners |
| Album Detail | `review` | albumTitle, artist, weekNumber, avgRating, totalReviews |
| Archive Tab | `journey` | year, albumsCompleted, totalReviews, avgRating |

Share image route: `src/app/api/share/image/[type]/route.tsx`

---

## Component Wiring Summary

| Component | Hooks Used | Data Source |
|-----------|-----------|-------------|
| `now-playing-tab.tsx` | `useCycle`, `useCurrentAlbum`, `useReviews`, `useListenerCount` | DB + fallback to mock |
| `vote-tab.tsx` | `useCycle`, `useSubmissions`, `useVote`, `useUserSubmissionCount` | DB + fallback to mock |
| `submission-form.tsx` | `useSubmitAlbum`, Spotify API | Spotify + DB |
| `archive-tab.tsx` | `usePastAlbums`, `useReviews` | DB + fallback to mock |
| `album-detail-view.tsx` | `useReviews`, `useUserReview` | DB + fallback to mock |
| `review-form.tsx` | `useSubmitReview`, `useFarcasterUser` | DB + Farcaster |

---

## Files Created/Modified

```
✅ src/db/schema.ts - 4 tables (cycles, albums, votes, reviews)
✅ src/db/actions/cycle-actions.ts - Cycle & album queries
✅ src/db/actions/submission-actions.ts - Voting system
✅ src/db/actions/review-actions.ts - Review system
✅ src/hooks/use-cycle.ts - Cycle hooks
✅ src/hooks/use-submissions.ts - Submission hooks
✅ src/hooks/use-reviews.ts - Review hooks
✅ src/lib/spotify.ts - Spotify API client
✅ src/app/api/spotify/album/route.ts - Album metadata endpoint
✅ src/features/app/components/*.tsx - All components wired
✅ src/app/api/share/image/[type]/route.tsx - Share images
```

---

## Validation Rules Implemented

### Submissions
- ✅ Max 3 submissions per cycle per user
- ✅ No duplicate Spotify IDs in same cycle
- ✅ No past winners (status='selected')
- ✅ Spotify links only (validated in form)

### Voting
- ✅ One vote per album per user
- ✅ No un-voting (vote is permanent)
- ✅ Only albums in 'voting' status

### Reviews
- ✅ One review per album per user
- ✅ Rating must be 1-5
- ✅ Text must be 50+ characters
- ✅ Auto-updates album stats on submit

---

## Notes

- **Mock Data Fallback**: Components use mock data when DB is empty (development/preview)
- **UUID Validation**: Components check for valid UUIDs before querying DB (prevents errors with mock data)
- **Winner Selection**: Call `selectWinner(cycleId)` manually or via cron at Friday 10pm WIB
- **Tiebreaker**: Highest votes → earliest submission timestamp
- **Spotify Token**: Cached in memory, auto-refreshes before expiry

---

## Pre-Publishing Checklist

- [x] All features implemented
- [x] Database schema pushed
- [x] Share buttons wired
- [x] UUID validation bug fixed
- [ ] **Spotify credentials added** ← BLOCKING
- [ ] Test album submission with real Spotify link
- [ ] Publish app

# Wiring Plan

> Created: Phase 4 - Feature Planning
> App: Playgroup (music community voting app)

## Features Overview

| Feature | Type | Mock | Priority |
|---------|------|------|----------|
| Cycles & Albums | database | `MOCK_CYCLE_STATE`, `MOCK_PAST_ALBUMS` | P0 |
| Submissions & Voting | database | `MOCK_SUBMISSIONS` | P0 |
| Reviews | database | `MOCK_REVIEWS` | P0 |
| Album Tracks | database | `MOCK_ALBUM_TRACKS` | P1 |
| User Identity | social | (uses `useFarcasterUser`) | P0 |
| Share Button | sharing | (mandatory) | P0 |

---

## Feature Implementation Details

### 1. Cycles & Albums (Database)

**Type**: database
**Mocks**: `MOCK_CYCLE_STATE`, `MOCK_PAST_ALBUMS`
**Used by**: `now-playing-tab.tsx`, `archive-tab.tsx`, `album-detail-view.tsx`

**Schema Tables**:
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
  winnerId: uuid("winner_id"), // references albums.id when selected
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
  cycleId: uuid("cycle_id").notNull(), // which cycle this was submitted in
  submittedByFid: integer("submitted_by_fid").notNull(),
  submittedByUsername: text("submitted_by_username").notNull(),
  status: text("status").notNull(), // 'voting' | 'selected' | 'lost'
  avgRating: real("avg_rating"),
  totalReviews: integer("total_reviews").default(0),
  mostLovedTrack: text("most_loved_track"),
  mostLovedTrackVotes: integer("most_loved_track_votes").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Server Actions** (`src/db/actions/cycle-actions.ts`):
- `getCurrentCycle()` - Get active cycle with phase & countdown
- `getCycleAlbum(cycleId)` - Get the winning album for a cycle
- `getPastAlbums(year)` - Get all past winners for archive
- `getAlbumById(albumId)` - Get album with full stats

**Hooks** (`src/hooks/use-cycle.ts`):
- `useCycle()` - Current cycle state with computed countdown
- `useCurrentAlbum()` - Current/last winning album
- `usePastAlbums()` - Archive albums list

---

### 2. Submissions & Voting (Database)

**Type**: database
**Mock**: `MOCK_SUBMISSIONS`
**Used by**: `vote-tab.tsx`, `submission-form.tsx`

**Schema Tables**:
```typescript
// votes - one per user per album
export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  albumId: uuid("album_id").notNull(),
  voterFid: integer("voter_fid").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Server Actions** (`src/db/actions/submission-actions.ts`):
- `submitAlbum(spotifyUrl, fid, username)` - Submit album with validation
- `getSubmissions(cycleId)` - Get all submissions for current voting
- `getUserSubmissionCount(fid, cycleId)` - Check if user hit 3 limit
- `castVote(albumId, fid)` - Cast vote (validates one per album)
- `getUserVotes(fid, cycleId)` - Get user's votes this cycle
- `selectWinner(cycleId)` - Auto-select winner (called by cron)

**Validation Rules**:
- Max 3 submissions per cycle per user
- No duplicate spotify IDs in same cycle
- No past winners (check albums with status='selected')
- One vote per album per user (no un-voting)

**Hooks** (`src/hooks/use-submissions.ts`):
- `useSubmissions()` - Current submissions with vote counts
- `useSubmitAlbum()` - Mutation for submitting
- `useVote()` - Mutation for voting

---

### 3. Reviews (Database)

**Type**: database
**Mock**: `MOCK_REVIEWS`
**Used by**: `album-detail-view.tsx`, `review-form.tsx`

**Schema Tables**:
```typescript
// reviews - one per user per album
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  albumId: uuid("album_id").notNull(),
  reviewerFid: integer("reviewer_fid").notNull(),
  reviewerUsername: text("reviewer_username").notNull(),
  reviewerPfp: text("reviewer_pfp"),
  rating: integer("rating").notNull(), // 1-5
  text: text("text").notNull(), // min 50 chars
  favoriteTrack: text("favorite_track"),
  hasListened: boolean("has_listened").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Server Actions** (`src/db/actions/review-actions.ts`):
- `submitReview(albumId, fid, rating, text, favoriteTrack)` - Submit review
- `getAlbumReviews(albumId)` - Get reviews for album
- `getUserReview(albumId, fid)` - Check if user already reviewed
- `getAlbumStats(albumId)` - Compute avg rating, most loved track

**Validation Rules**:
- One review per album per user
- Rating must be 1-5
- Text must be 50+ characters
- Reviews can be submitted anytime (late reviews allowed)

**Hooks** (`src/hooks/use-reviews.ts`):
- `useReviews(albumId)` - Reviews for an album
- `useSubmitReview()` - Mutation for submitting

---

### 4. Album Tracks (API/Caching)

**Type**: database (cached from Spotify)
**Mock**: `MOCK_ALBUM_TRACKS`
**Used by**: `review-form.tsx` (favorite track picker)

**Approach**: Cache Spotify album tracks in albums table as JSON
```typescript
// Add to albums table
tracks: jsonb("tracks"), // string[] of track names
```

**Server Actions**:
- `fetchAndCacheAlbumTracks(albumId, spotifyId)` - Fetch from Spotify API and cache

**Note**: Spotify API integration is a stretch goal. For MVP, tracks can be manually entered or omitted from the favorite track picker.

---

### 5. User Identity (Social)

**Type**: social
**Mock**: None (implicit in mock data)
**Used by**: All components for current user context

**SDK/Hooks**:
- `useFarcasterUser()` from `@/neynar-farcaster-sdk/mini` - Current user's FID, username, pfp
- `useUser(fid)` from `@/neynar-web-sdk/neynar` - Fetch full profile for any user

**Integration Points**:
- Submission: Get `fid`, `username` from `useFarcasterUser()`
- Reviews: Get `fid`, `username`, `pfpUrl` from `useFarcasterUser()`
- Vote tracking: Store `fid` with votes
- Display: Show usernames/pfps in UI

---

### 6. Share Button (Mandatory)

**Type**: sharing
**Delegate to**: `share-manager` subagent

**Personalization Data Available**:
- `albumTitle` - Current album title
- `albumArtist` - Current album artist
- `weekNumber` - Current week (1-26)
- `avgRating` - Community average rating
- `totalReviews` - Number of reviews
- `phase` - 'voting' | 'listening'

**Share Scenarios**:
1. **Now Tab**: Share current listening album
2. **Album Detail**: Share specific album with stats
3. **Archive**: Share community journey stats

**Components with Share Button**:
- `now-playing-tab.tsx` - Main share button
- `album-detail-view.tsx` - Album-specific share
- `archive-tab.tsx` - Journey share

---

## Implementation Order

1. **Database Schema** - Create all tables
2. **Cycle Actions** - Core cycle/album queries
3. **Submission Actions** - Voting system
4. **Review Actions** - Review system
5. **Hooks** - Wire actions to components
6. **User Integration** - Add Farcaster user context
7. **Share Button** - Delegate to share-manager

---

## Files to Create

```
src/db/schema.ts (edit - add tables)
src/db/actions/cycle-actions.ts (new)
src/db/actions/submission-actions.ts (new)
src/db/actions/review-actions.ts (new)
src/hooks/use-cycle.ts (new)
src/hooks/use-submissions.ts (new)
src/hooks/use-reviews.ts (new)
```

---

## Notes

- **Countdown Timer**: Phase 5 will compute countdown from `votingEndsAt` timestamp
- **Spotify API**: MVP can work without Spotify API by having users manually enter album info, or we integrate Spotify for auto-fetch
- **Cron for Winner Selection**: Needs scheduled job at Friday 10pm WIB - can be implemented as API route called by external cron
- **Tiebreaker Rules**: Fewest previous wins → earliest submission timestamp

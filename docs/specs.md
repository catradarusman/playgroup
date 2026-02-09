# Requirements

> **Created**: 2025-02-08
> **Last Updated**: 2025-02-08
> **Status**: ✅ MVP Complete - Awaiting Spotify Credentials for Production

---

## App Overview

| Field               | Value                                                                      |
| ------------------- | -------------------------------------------------------------------------- |
| **Type**            | Social / Music Community                                                   |
| **Target Audience** | Music lovers who want intentional, slow listening over algorithmic feeds   |
| **Core Experience** | Vote on albums → Listen together for 2 weeks → Review and discuss          |

**Mission**: Resist algorithmic consumption. Respect music through slow, collective listening. 26 albums a year. Zero algorithms.

---

## Visual Style

| Field               | Value                                              |
| ------------------- | -------------------------------------------------- |
| **Vibe**            | Clean, minimal, dark, futuristic                   |
| **Colors**          | Monochrome - black, white, grey                    |
| **Style Direction** | Dark mode, high contrast, sleek futuristic feel    |

**User's Words**: "clean and minimal with dark vibe, monochrome black white grey and futuristic"

---

## Core Loop (2-Week Cycle)

| Day           | Phase      | Activity                                    |
| ------------- | ---------- | ------------------------------------------- |
| Monday        | Voting     | Voting opens, members submit Spotify albums |
| Mon–Fri       | Voting     | Community votes on submissions              |
| Friday 10pm WIB | Cutoff   | Voting closes, winner auto-selected         |
| Saturday      | Listening  | Winner announced, listening begins          |
| Sat–Fri       | Listening  | Everyone listens on Spotify                 |
| Sat–Sun (next)| Reviewing  | Members write reviews                       |
| Monday        | New Cycle  | Repeat                                      |

---

## Core Features

### Must-Have (MVP) ✅ ALL COMPLETE

- [x] **Album Submission**: Paste Spotify link → Auto-fetch metadata → Preview → Submit (max 3 per cycle)
- [x] **Spotify API Integration**: Auto-fetches album title, artist, cover art, and track listing
- [x] **Voting System**: Upvote albums, one vote per album, unlimited total votes
- [x] **Winner Selection**: Auto-select highest votes at Friday 10pm WIB (tiebreakers: fewest wins → earliest submission)
- [x] **Current Album Display**: Hero card with album art, artist, Spotify link, countdown
- [x] **Review System**: 1-5 rating, 50+ char text, favorite track picker (with real Spotify tracks)
- [x] **Album Detail Pages**: Stats (avg rating, most loved track), full reviews list
- [x] **The 26 Archive**: Visual 26-square progress grid, past albums with ratings
- [x] **How It Works**: 3-step onboarding for new users
- [x] **Phase-Aware UI**: Different states for voting vs listening vs reviewing
- [x] **Countdown Timer**: Live countdown to voting close / listening end
- [x] **Share Buttons**: 3 personalized share images (album, review stats, journey progress)

### Submission Rules (Enforced)

| Rule                          | Error Message                                    |
| ----------------------------- | ------------------------------------------------ |
| Max 3 submissions per cycle   | "Limit reached - focus on voting!"               |
| No duplicates in same cycle   | "Already submitted - go upvote it!"              |
| No past winners               | "This won in Week X - check The 26!"             |
| Spotify links only            | "Spotify only - search there instead"            |

### Voting Rules (Enforced)

| Rule                          | Behavior                                         |
| ----------------------------- | ------------------------------------------------ |
| One vote per album per user   | Button disables after clicking                   |
| No un-voting                  | Keeps it simple, prevents gaming                 |
| Unlimited total votes         | Can vote for every album if desired              |

### Review Rules (Enforced)

| Rule                          | Behavior                                         |
| ----------------------------- | ------------------------------------------------ |
| One review per album per user | Blocks duplicate submissions                     |
| Minimum 50 characters         | Shows character counter, blocks short reviews    |
| Reviews stay open forever     | Late reviews allowed                             |

### Nice-to-Have (Post-MVP)

- [ ] **Auto Winner Selection Cron**: Scheduled job at Friday 10pm WIB
- [ ] **Genre Filtering**: Filter submissions/archive by genre
- [ ] **Year Selector**: Browse archive by year (2024, 2025, etc.)
- [ ] **Losing Album Second Chance**: Albums that don't win persist for one more cycle
- [ ] **Edit Reviews**: Allow editing submitted reviews
- [ ] **Notification Reminders**: Voting deadline, new album announcements

### Future Considerations

- **Reply to Reviews**: Community discussion threads (adds complexity)
- **Profanity Filter**: Manual moderation for now, add filter if abused
- **Un-voting**: Allow changing votes until deadline (potential gaming)

---

## Data Requirements

| Field                 | Value                                                              |
| --------------------- | ------------------------------------------------------------------ |
| **Persistence**       | Yes - albums, votes, reviews, cycles all persist                   |
| **What Needs Saving** | Albums (metadata cached), votes, reviews, cycle state, user stats  |
| **User-Specific**     | Yes - votes, reviews, submission counts are per-user               |
| **Authentication**    | Farcaster login (FID-based)                                        |

### Key Entities

- **Cycles**: weekNumber, year, phase, startDate, endDate, votingEndsAt, winnerId
- **Albums**: spotifyId, title, artist, coverUrl, spotifyUrl, tracks[], cycleId, submittedByFid, submittedByUsername, status, avgRating, totalReviews, mostLovedTrack
- **Votes**: albumId, voterFid, createdAt
- **Reviews**: albumId, reviewerFid, reviewerUsername, reviewerPfp, rating, reviewText, favoriteTrack, hasListened, createdAt

---

## Sharing Configuration

| Field                      | Value                                                    |
| -------------------------- | -------------------------------------------------------- |
| **Share Button Placement** | Now tab (main), Album detail pages, Archive tab          |
| **shareButtonTitle**       | "Listen With Us"                                         |
| **Personalization Data**   | Current album art, title, artist, week number, community stats |

### Share Scenarios

1. **Share Current Album**: "We're listening to [Album] by [Artist] - Week X of 26"
2. **Share Album Review**: "I gave [Album] a [X]/5 - [excerpt]"
3. **Share Our Journey**: "We've listened to X albums together in 2025"

---

## Technical Constraints

| Field                    | Value                                              |
| ------------------------ | -------------------------------------------------- |
| **User Skill Level**     | Intermediate                                       |
| **Platform Focus**       | Mobile-first (Farcaster mini app)                  |
| **Special Requirements** | Spotify API (Client Credentials flow), Cron for auto-selection |

### External APIs

| API | Purpose | Auth Method | Status |
| --- | ------- | ----------- | ------ |
| **Spotify Web API** | Fetch album metadata, cover art, track listings | Client Credentials (no user login) | ✅ Integrated (awaiting credentials) |

**⚠️ REQUIRED BEFORE PUBLISHING - Environment Variables:**
- `SPOTIFY_CLIENT_ID` - From Spotify Developer Dashboard
- `SPOTIFY_CLIENT_SECRET` - From Spotify Developer Dashboard

**How to get Spotify credentials:**
1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in app name (e.g., "Playgroup") and description
5. Set redirect URI to any valid URL (not used for Client Credentials)
6. Check "Web API" checkbox
7. Accept terms and create
8. Copy **Client ID** and **Client Secret** from the app dashboard

### Risk Mitigations

| Risk                  | Mitigation                                         | Status |
| --------------------- | -------------------------------------------------- | ------ |
| Spotify API breaks    | Metadata cached in DB after first fetch            | ✅ Done |
| Cron job fails        | Manual fallback via `selectWinner()` action        | Ready  |
| No submissions        | Creator seeds first 2 cycles with albums           | Ready  |
| Low review rate       | Acceptable for MVP                                 | OK     |
| Duplicate spam        | DB constraint prevents, manual ban if needed       | ✅ Done |

---

## Design Decisions & Rationale

| Decision                           | Rationale                                       | Phase   |
| ---------------------------------- | ----------------------------------------------- | ------- |
| 2-week cycles (26 albums/year)     | Forces slow, intentional listening              | Phase 1 |
| Friday 10pm WIB voting close       | Clear deadline, wraps up work week              | Phase 1 |
| 3 submissions per cycle limit      | Prevents spam, forces curation                  | Phase 1 |
| No un-voting                       | Keeps simple, prevents gaming                   | Phase 1 |
| 50 char minimum reviews            | Forces thoughtful feedback                      | Phase 1 |
| Automatic tiebreakers              | No manual intervention, fair rules              | Phase 1 |
| No login required to browse        | Lets lurkers convert naturally                  | Phase 1 |
| Honor system for "listened" checkbox| Trust community, don't over-engineer          | Phase 1 |

---

## Open Questions

- [x] All MVP requirements clarified

---

## Change Log

| Timestamp  | Phase   | Description                                          |
| ---------- | ------- | ---------------------------------------------------- |
| 2025-02-08 | Phase 1 | Initial spec created from detailed user requirements |
| 2025-02-08 | Phase 2 | Changed rating from 1-10 to 1-5 scale                |
| 2025-02-08 | Phase 2 | Theme defined: dark monochrome futuristic            |
| 2025-02-08 | Phase 5 | All database features wired (cycles, albums, votes, reviews) |
| 2025-02-08 | Phase 5 | Share buttons wired with personalized images         |
| 2025-02-08 | Phase 6 | Spotify API integration added (auto-fetch metadata)  |
| 2025-02-08 | Phase 6 | Track listings now stored with albums for review picker |
| 2025-02-08 | Phase 6 | Fixed UUID validation bug (mock IDs vs real database UUIDs) |
| 2025-02-08 | Phase 6 | Awaiting Spotify credentials before publishing |
| 2025-02-08 | Phase 6 | **Theme Refinement**: Removed all gradient backgrounds |
| 2025-02-08 | Phase 6 | **Theme Refinement**: Added red accent color (#DC2626) as tertiary |
| 2025-02-08 | Phase 6 | **Theme Refinement**: Converted all colored elements to monochrome |
| 2025-02-08 | Phase 6 | **Theme Refinement**: Replaced all emoji icons with monochrome text/symbols |
| 2025-02-08 | Phase 6 | Fixed app-settings.json validation errors (shortened subtitle, description, tagline) |

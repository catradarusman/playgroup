# Playgroup - App Specifications

> **Created**: 2025-02-08
> **Last Updated**: 2025-02-08
> **Status**: ✅ Production Ready

---

## App Overview

| Field               | Value                                                                      |
| ------------------- | -------------------------------------------------------------------------- |
| **Type**            | Social / Music Community                                                   |
| **Target Audience** | Music lovers who want intentional, slow listening over algorithmic feeds   |
| **Core Experience** | Vote on albums → Listen together for 1 week → Review and discuss           |

**Mission**: Resist algorithmic consumption. Respect music through slow, collective listening. 52 albums a year. Zero algorithms.

---

## Visual Style

| Field               | Value                                              |
| ------------------- | -------------------------------------------------- |
| **Vibe**            | Clean, minimal, dark, futuristic                   |
| **Colors**          | Monochrome - black, white, grey                    |
| **Style Direction** | Dark mode, high contrast, sleek futuristic feel    |
| **Typography**      | Outfit (geometric sans-serif) + JetBrains Mono     |

---

## Core Loop (1-Week Cycle)

| Day              | Phase      | Activity                                    |
| ---------------- | ---------- | ------------------------------------------- |
| Monday           | Voting     | Voting opens, members submit albums         |
| Mon–Thu          | Voting     | Community votes on submissions              |
| Thursday 10pm WIB| Cutoff     | Voting closes, winner auto-selected         |
| Friday           | Listening  | Winner announced, listening begins          |
| Fri–Sun          | Listening  | Everyone listens together                   |
| Sat–Sun          | Reviewing  | Members write reviews                       |
| Monday           | New Cycle  | Repeat                                      |

---

## Core Features (All Implemented)

### Album Submission
- ✅ Paste Spotify link → Search Deezer for metadata → Preview → Submit
- ✅ Auto-vote: submitter's album starts with 1 vote automatically
- ✅ No duplicates in same cycle
- ✅ No past winners allowed

### Voting System
- ✅ Upvote albums, one vote per album per user
- ✅ Unlimited total votes allowed
- ✅ No un-voting (keeps it simple)
- ✅ Submitter auto-votes for their own album on submission

### Winner Selection
- ✅ Auto-select highest votes
- ✅ Tiebreaker: earliest submission timestamp

### Review System
- ✅ 1-5 star rating
- ✅ 50+ character minimum review text
- ✅ Favorite track picker
- ✅ One review per album per user

### Archive (The 52)
- ✅ Visual 52-square progress grid
- ✅ Past albums with ratings and reviews
- ✅ Year-based tracking

### Sharing
- ✅ Share current album
- ✅ Share journey stats
- ✅ Personalized share images

### Community Buzz
- ✅ Real-time Farcaster cast search for album mentions
- ✅ Shows casts discussing the current album
- ✅ Cast count replaces placeholder listener metric
- ✅ Clickable usernames to view profiles

---

## Data Architecture

### Database Tables

| Table    | Purpose                          |
| -------- | -------------------------------- |
| cycles   | 1-week listening cycles          |
| albums   | Submitted and winning albums     |
| votes    | User votes on albums             |
| reviews  | User reviews with ratings        |

### External APIs

| API      | Purpose                          | Auth           |
| -------- | -------------------------------- | -------------- |
| Deezer   | Album metadata & cover art       | None required  |
| Neynar   | Farcaster cast search            | Built-in SDK   |

---

## Technical Details

| Field                    | Value                              |
| ------------------------ | ---------------------------------- |
| **Framework**            | Next.js 16 (App Router)            |
| **UI Components**        | @neynar/ui                         |
| **Database**             | Neon PostgreSQL + Drizzle ORM      |
| **Authentication**       | Farcaster (FID-based)              |
| **Platform**             | Farcaster Mini App (424px viewport)|

---

## Roadmap

See **[roadmap.md](./roadmap.md)** for planned features:

| # | Feature | Complexity | Status |
|---|---------|------------|--------|
| 1 | ~~One-Week Cycles (52 albums/year)~~ | ~~Low-Medium~~ | ✅ Implemented |
| 2 | ~~User Profile Page~~ | ~~Medium~~ | ✅ Implemented |
| 3 | ~~Community Buzz (Farcaster)~~ | ~~Low-Medium~~ | ✅ Implemented |
| 4 | ~~Point Economy (DB)~~ | ~~Medium-High~~ | Superseded by #6 |
| 5 | Universal Access (Privy) | High | Planned |
| 6 | $PLAY Token On-Chain (AUX-style) | High | Planned |

**Recommended order**: 5 → 6

**Total estimated time**: ~8-11 hours for remaining features

---

## Change Log

| Date       | Change                                               |
| ---------- | ---------------------------------------------------- |
| 2025-02-08 | Initial spec created                                 |
| 2025-02-08 | Rating changed from 1-10 to 1-5 scale                |
| 2025-02-08 | All database features wired                          |
| 2025-02-08 | Replaced Spotify API with Deezer (no auth needed)    |
| 2025-02-08 | Removed all mock data - production ready             |
| 2025-02-08 | Auto-create first cycle on app load                  |
| 2025-02-08 | Added auto-vote on album submission                  |
| 2025-02-08 | Updated typography to Outfit + JetBrains Mono        |
| 2025-02-08 | Created roadmap.md with 3 planned features           |
| 2025-02-08 | Added Universal Access (Privy) to roadmap            |
| 2025-02-08 | Added $PLAY Token On-Chain (AUX-style) to roadmap    |
| 2025-02-08 | **Implemented One-Week Cycles** (26→52 albums/year)  |
| 2025-02-08 | **Implemented User Profile Page** (header icon, clickable usernames) |
| 2025-02-08 | **Implemented Community Buzz** (Farcaster cast search, real engagement metrics) |

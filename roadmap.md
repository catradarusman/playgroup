# Playgroup - Feature Roadmap

> **Created**: 2025-02-08
> **Last Updated**: 2025-02-08
> **Status**: Planning

---

## Overview

This document tracks planned features for Playgroup beyond the MVP. Features are ordered by recommended implementation sequence based on dependencies.

---

## Planned Features

### 1. One-Week Cycles

**Complexity**: Low-Medium | **Est. Time**: 15-20 min | **Dependencies**: None

**Summary**: Reduce cycle length from 2 weeks to 1 week, doubling album throughput to 52 albums/year.

**New Schedule**:

| Day | Activity |
|-----|----------|
| Monday | New cycle starts, voting opens |
| Mon-Thu | Voting period |
| Thursday EOD | Voting closes, winner selected |
| Fri-Sun | Listening + reviewing |
| Sunday EOD | Cycle ends |

**Changes Required**:

| File | Changes | Effort |
|------|---------|--------|
| `src/db/actions/cycle-actions.ts` | Update date calculations | Small |
| `src/features/app/components/how-it-works.tsx` | Update copy (26 → 52 albums) | Tiny |
| `src/features/app/components/cycle-status-banner.tsx` | Update any hardcoded text | Tiny |
| `specs.md` | Update documentation | Tiny |

**What Stays the Same**:
- Database schema (no migration)
- Voting system
- Review system
- Archive display (already year-based)
- Countdown timers (already dynamic)

---

### 2. User Profile Page

**Complexity**: Medium | **Est. Time**: 45-60 min | **Dependencies**: None

**Summary**: Personal profile showing user's activity - submissions, votes received, reviews written.

**Profile Contents**:

| Section | Data |
|---------|------|
| Header | PFP, username, member since |
| Stats | Total submissions, winners, reviews, avg rating given |
| Submissions | Albums submitted with vote counts, win/loss status |
| Reviews | Their reviews with album art, rating, excerpt |

**New Files**:

| File | Type | Effort |
|------|------|--------|
| `src/db/actions/profile-actions.ts` | NEW | Medium |
| `src/hooks/use-profile.ts` | NEW | Small |
| `src/features/app/components/profile-view.tsx` | NEW | Medium |

**Modified Files**:

| File | Changes | Effort |
|------|---------|--------|
| `src/features/app/components/main-tabs.tsx` | Add profile tab/menu | Small |
| Review cards | Link usernames to profiles | Small |

**Data Sources** (all exist):
- Username/PFP: Farcaster SDK
- Submissions: `albums` table by FID
- Vote counts: `votes` table aggregate
- Reviews: `reviews` table by FID

---

### 3. Point Economy

**Complexity**: Medium-High | **Est. Time**: 1.5-2 hrs | **Dependencies**: Profile Page (#2)

**Summary**: Gamification system where users earn and spend points to participate.

**Point Structure**:

| Action | Points | Direction |
|--------|--------|-----------|
| New member signup | +100 | Earn (once) |
| Submit album | -5 | Spend |
| Upvote album | -1 | Spend |
| Your album gets upvoted | +1 | Earn (per vote) |
| Your album wins | +5 | Earn |
| Submit review | +3 | Earn |

**Balance Rules**:
- Cannot submit album with < 5 points
- Cannot upvote with < 1 point
- Balance visible in header at all times
- Transaction history in profile

**New Schema**:

```typescript
// userPoints - track balance per user
userPoints: {
  fid: integer (PK)
  balance: integer
  createdAt: timestamp
  updatedAt: timestamp
}

// pointTransactions - full history
pointTransactions: {
  id: uuid (PK)
  fid: integer
  amount: integer (+ or -)
  type: 'signup' | 'submit' | 'upvote' | 'received_upvote' | 'album_won' | 'review'
  referenceId: uuid (nullable)
  description: text
  createdAt: timestamp
}
```

**New Files**:

| File | Type | Effort |
|------|------|--------|
| `src/db/actions/points-actions.ts` | NEW | Medium |
| `src/hooks/use-points.ts` | NEW | Small |

**Modified Files**:

| File | Changes | Effort |
|------|---------|--------|
| `src/db/schema.ts` | Add 2 tables | Small |
| `src/db/actions/submission-actions.ts` | Add point checks/awards | Medium |
| `src/db/actions/review-actions.ts` | Add point awards | Small |
| Header/Layout | Add balance display | Small |
| `submission-form.tsx` | Balance check UI | Small |
| `vote-tab.tsx` | Balance check UI | Small |
| `profile-view.tsx` | Transaction history section | Medium |

**Edge Cases**:
- First-time user detection (check if userPoints row exists)
- Race conditions (use DB transactions)
- Zero balance state (show earn suggestions)

---

## Implementation Order

```
#1 One-Week Cycles (no dependencies)
         ↓
#2 User Profile Page (no dependencies, but nice to have before #3)
         ↓
#3 Point Economy (requires #2 for transaction history)
```

**Recommended**: Implement in order 1 → 2 → 3

---

## Future Considerations (Not Yet Scoped)

These items have been mentioned but not fully planned:

- [ ] Auto winner selection cron job (Friday/Thursday EOD)
- [ ] Genre filtering in submissions/archive
- [ ] Year selector for archive browsing
- [ ] Losing album "second chance" (persist for one more cycle)
- [ ] Edit reviews functionality
- [ ] Notification reminders (voting deadline, new albums)
- [ ] Reply to reviews / discussion threads

---

## Change Log

| Date | Change |
|------|--------|
| 2025-02-08 | Initial roadmap created with 3 planned features |

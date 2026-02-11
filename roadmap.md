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

### 4. Universal Access (Privy)

**Complexity**: High | **Est. Time**: 3-4 hrs | **Dependencies**: Profile Page (#2)

**Summary**: Allow anyone to join Playgroup via email, Google, or Farcaster. Non-Farcaster users get a Privy smart wallet automatically.

**Vision**: Playgroup as a universal music app, not just a Farcaster app.

**Auth Options**:

| Method | Wallet | Identity |
|--------|--------|----------|
| Email | Privy smart wallet (auto-created) | Email + chosen username |
| Google | Privy smart wallet (auto-created) | Google name + chosen username |
| Farcaster | FC embedded wallet | FC username + PFP |

**New Schema - Unified Users Table**:

```typescript
users: {
  id: uuid (PK)              // Internal ID - ALL tables reference this
  fid: integer (nullable)    // If signed up via Farcaster
  privyId: text (nullable)   // If signed up via Privy
  walletAddress: text        // Always present (FC or Privy wallet)
  email: text (nullable)     // Privy users
  username: text             // FC username OR chosen name
  displayName: text          // Full display name
  pfpUrl: text (nullable)    // FC pfp OR generated avatar
  authProvider: 'farcaster' | 'privy'
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Migration Strategy**:

Current FID-based columns → New userId-based columns:

| Table | Old Column | New Column |
|-------|------------|------------|
| albums | `submittedByFid` | `submittedByUserId` |
| votes | `voterFid` | `voterId` |
| reviews | `reviewerFid` | `reviewerId` |
| userPoints | `fid` | `userId` |

**Migration Steps**:
1. Create `users` table
2. Add new `userId` columns (nullable initially)
3. Backfill: create user records for existing FIDs
4. Update all actions to use `userId`
5. Drop old `fid` columns (or keep for reference)

**New Files**:

| File | Type | Effort |
|------|------|--------|
| `src/lib/privy.ts` | Privy client config | Small |
| `src/hooks/use-auth.ts` | Unified auth hook (FC or Privy) | Medium |
| `src/db/actions/user-actions.ts` | User CRUD, lookup, sync | Medium |
| `src/features/app/components/login-modal.tsx` | Multi-provider login UI | Medium |

**Modified Files**:

| File | Changes | Effort |
|------|---------|--------|
| `src/db/schema.ts` | Add `users` table, update FKs | Medium |
| `src/db/actions/submission-actions.ts` | FID → userId | Medium |
| `src/db/actions/review-actions.ts` | FID → userId | Small |
| `src/db/actions/cycle-actions.ts` | FID → userId | Small |
| `src/db/actions/profile-actions.ts` | Use userId | Small |
| `src/db/actions/points-actions.ts` | Use userId | Small |
| All components using `useFarcasterUser` | Switch to `useAuth` | Medium |
| `providers-and-initialization.tsx` | Add PrivyProvider | Small |

**Environment Variables**:
```
NEXT_PUBLIC_PRIVY_APP_ID=your_app_id
PRIVY_APP_SECRET=your_secret
```

**Username Handling**:

| Signup Method | Username Source |
|---------------|-----------------|
| Farcaster | `@username` from FC |
| Email | Email prefix (e.g., `alice@gmail.com` → `alice`) |
| Google | Google display name or email prefix |

**First Login Flow (Privy users)**:
1. Sign up with email/Google
2. Prompt: "Choose a display name" (optional)
3. Auto-generate avatar via DiceBear API

**Edge Cases**:

| Scenario | Solution |
|----------|----------|
| User has both FC and Privy | Link accounts via wallet address match |
| Email user later joins FC | Prompt to link accounts |
| Username collision | Add number suffix (`alice2`) |
| Privy user wants FC features | Show "Connect Farcaster" option |

---

## Implementation Order

```
#1 One-Week Cycles (no dependencies)
         ↓
#2 User Profile Page (foundational for #3 and #4)
         ↓
#4 Universal Access (Privy) ← Do this BEFORE Points
         ↓
#3 Point Economy (uses new unified user system)
```

**Recommended**: Implement in order 1 → 2 → 4 → 3

Why #4 before #3? The Point Economy will use `userId` instead of `fid`. Better to migrate the identity system first, then build points on top of it.

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

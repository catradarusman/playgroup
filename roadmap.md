# Playgroup - Feature Roadmap

> **Created**: 2025-02-08
> **Last Updated**: 2025-02-08
> **Status**: Features #1, #2, #3, #5 Implemented + Privy Configured ✅

---

## Overview

This document tracks planned features for Playgroup beyond the MVP. Features are ordered by recommended implementation sequence based on dependencies.

---

## Planned Features

### 1. One-Week Cycles ✅ IMPLEMENTED

**Complexity**: Low-Medium | **Est. Time**: 15-20 min | **Dependencies**: None

**Summary**: Reduced cycle length from 2 weeks to 1 week, doubling album throughput to 52 albums/year.

**Current Schedule**:

| Day | Activity |
|-----|----------|
| Monday | New cycle starts, voting opens |
| Mon-Thu | Voting period |
| Thursday EOD | Voting closes, winner selected |
| Fri-Sun | Listening + reviewing |
| Sunday EOD | Cycle ends |

**Changes Made**:

| File | Changes | Status |
|------|---------|--------|
| `src/db/actions/cycle-actions.ts` | 5→4 days voting, 14→7 days total | ✅ Done |
| `src/db/schema.ts` | Comment updated (26→52) | ✅ Done |
| `src/features/app/components/how-it-works.tsx` | Copy updated | ✅ Done |
| `src/features/app/components/archive-tab.tsx` | 26→52 (3 places), smaller grid | ✅ Done |
| `src/features/app/components/now-playing-tab.tsx` | 26→52 (2 places) | ✅ Done |
| `src/app/api/share/image/[type]/route.tsx` | 26→52 in share image | ✅ Done |
| `src/db/actions/submission-actions.ts` | "The 26"→"The 52" error | ✅ Done |
| `specs.md` | Updated documentation | ✅ Done |

**What Stayed the Same**:
- Database schema (no migration needed)
- Voting system
- Review system
- Archive display (already year-based)
- Countdown timers (already dynamic)

---

### 2. User Profile Page ✅ IMPLEMENTED

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

### 3. Community Buzz (Farcaster Integration) ✅ IMPLEMENTED

**Complexity**: Low-Medium | **Est. Time**: 30-45 min | **Dependencies**: None

**Summary**: Real-time Farcaster cast search showing community discussion about albums. Replaces the hardcoded "listener count" with actual engagement metrics.

**Features**:

| Feature | Description |
|---------|-------------|
| Cast Count | Shows number of Farcaster casts mentioning the album |
| Community Buzz Section | Displays actual casts discussing the current album |
| Clickable Profiles | Cast author names link to profile views |
| Load More | Pagination for more casts |

**New Files**:

| File | Type | Purpose |
|------|------|---------|
| `src/hooks/use-album-buzz.ts` | NEW | Hook wrapping `useCastSearch` |
| `src/features/app/components/album-buzz-section.tsx` | NEW | UI component for cast display |

**Modified Files**:

| File | Changes |
|------|---------|
| `src/features/app/components/now-playing-tab.tsx` | Replaced `useListenerCount` with `useAlbumBuzz`, added AlbumBuzzSection |
| `src/features/app/components/album-detail-view.tsx` | Added AlbumBuzzSection |

**Technical Details**:
- Uses Neynar SDK `useCastSearch` hook
- Search mode: `hybrid` (literal + semantic for best results)
- Sort: `algorithmic` for most relevant casts first
- Query: `"Album Title" "Artist Name"` for accurate matching

---

### 4. Point Economy (Database) — SUPERSEDED

**Complexity**: Medium-High | **Est. Time**: 1.5-2 hrs | **Dependencies**: Profile Page (#2)

> ⚠️ **SUPERSEDED**: This feature is replaced by #6 ($PLAY On-Chain). Skip if implementing on-chain tokenomics.

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

### 5. Universal Access (Privy) ✅ IMPLEMENTED

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

### 6. $PLAY Token On-Chain (AUX-Style)

**Complexity**: High | **Est. Time**: 5-7 hrs | **Dependencies**: #2 (Profile), #5 (Privy/Wallets)

**Summary**: On-chain point economy using $PLAY ERC-20 token, modeled after AUX's ATTN system. Submissions and votes happen on-chain; metadata and reviews stay off-chain.

**Vision**: Transparent, auditable participation with real token rewards.

**Token Details**:
- **Token**: $PLAY (ERC-20, provided by user)
- **Supply**: 1 billion
- **Network**: Base
- **Contract**: User will provide address

### What Goes On-Chain vs Off-Chain

| Data | Storage | Reason |
|------|---------|--------|
| Album submissions (Spotify URLs) | **On-chain** | Transparent, auditable |
| Votes | **On-chain** | Transparent, auditable |
| $PLAY balances (earned) | **On-chain** | Real token |
| Bonus balances | **On-chain** | Non-transferable, spend-only |
| Album metadata (title, art) | Off-chain (DB) | Too expensive on-chain |
| Reviews | Off-chain (DB) | Text too expensive |
| User profiles | Off-chain (DB) | Complex data |

### Point Structure (On-Chain)

| Action | Points | Type | On-Chain? |
|--------|--------|------|-----------|
| New member signup | +100 $PLAY | **Bonus** (non-transferable) | Yes |
| Submit album | -5 $PLAY | Spend (bonus first) | Yes |
| Upvote album | -1 $PLAY | Spend (bonus first) | Yes |
| Receive upvote | +1 $PLAY | **Earned** (transferable) | Yes |
| Album wins | +5 $PLAY | **Earned** (transferable) | Yes (backend trigger) |
| Submit review | +3 $PLAY | **Earned** (transferable) | Yes (backend trigger) |

### Smart Contract Design

```solidity
contract PlaygroupCore {
    // External $PLAY token (provided, 1B supply)
    IERC20 public playToken;

    // Constants (like AUX)
    uint256 public constant SUBMIT_COST = 5 ether;    // 5 $PLAY (18 decimals)
    uint256 public constant VOTE_COST = 1 ether;      // 1 $PLAY
    uint256 public constant SIGNUP_BONUS = 100 ether; // 100 $PLAY
    uint256 public constant VOTE_REWARD = 1 ether;    // +1 per upvote
    uint256 public constant WIN_REWARD = 5 ether;     // +5 when album wins
    uint256 public constant REVIEW_REWARD = 3 ether;  // +3 for review

    // On-chain state
    struct Album {
        string spotifyUrl;      // Only URL stored on-chain
        address submitter;
        uint256 votes;
        uint256 cycleId;
        bool isWinner;
    }

    Album[] public albums;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public bonusBalance;  // Non-transferable
    mapping(address => bool) public hasClaimedBonus;

    // User actions (on-chain, user pays gas)
    function submitAlbum(string calldata spotifyUrl, uint256 cycleId) external;
    function vote(uint256 albumId) external;
    function claimSignupBonus() external;

    // Backend-triggered rewards (server wallet pays gas)
    function rewardReview(address user) external onlyOwner;
    function declareWinner(uint256 albumId) external onlyOwner;
}
```

### Bonus vs Earned Balances

| Balance Type | Storage | Transferable? | Use |
|--------------|---------|---------------|-----|
| **Bonus** | Contract mapping | No | Spend on submit/vote |
| **Earned** | $PLAY ERC-20 | Yes | Spend, transfer, hold |

**Spending logic**: Bonus deducted first, then $PLAY tokens.

### User Flow Changes

**Current (Database - instant)**:
```
User clicks "Submit" → DB write → Done
```

**New (On-Chain - 2-5 sec)**:
```
User clicks "Submit"
    → Wallet popup (sign transaction)
    → Wait for confirmation (2-5 sec)
    → Contract emits event
    → Backend syncs metadata to DB
    → Done
```

### Gas Costs (Base Network)

| Action | Gas | Cost (approx) | Who Pays |
|--------|-----|---------------|----------|
| `submitAlbum()` | ~100k | ~$0.02 | User |
| `vote()` | ~80k | ~$0.015 | User |
| `claimSignupBonus()` | ~50k | ~$0.01 | User |
| `rewardReview()` | ~60k | ~$0.01 | Server wallet |
| `declareWinner()` | ~80k | ~$0.015 | Server wallet |

**Optional**: Sponsor gas for new users via Privy paymaster.

### Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        PLAYGROUP                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐       ┌────────────────────────┐     │
│  │     BASE CHAIN       │       │       DATABASE         │     │
│  │                      │       │                        │     │
│  │  PlaygroupCore.sol   │       │  - Album metadata      │     │
│  │  ├─ albums[]         │◄─────►│  - Reviews (text)      │     │
│  │  ├─ votes            │ sync  │  - User profiles       │     │
│  │  ├─ bonusBalance     │       │  - Cycle management    │     │
│  │  └─ events           │       │                        │     │
│  │                      │       └────────────────────────┘     │
│  │  $PLAY Token (ERC20) │                                      │
│  │  └─ balances         │                                      │
│  │                      │                                      │
│  └──────────────────────┘                                      │
│           ▲                                                     │
│           │                                                     │
│     User Actions                    Backend Triggers            │
│     (submit, vote)                  (review reward, winner)     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### New Files

| File | Purpose | Effort |
|------|---------|--------|
| `contracts/PlaygroupCore.sol` | Main contract | High |
| `src/lib/playgroup-contract.ts` | Viem client + ABI | Medium |
| `src/hooks/use-playgroup-contract.ts` | React hooks for reads/writes | Medium |
| `src/hooks/use-play-balance.ts` | Balance display hook | Small |
| `src/db/actions/contract-sync-actions.ts` | Sync on-chain events → DB | Medium |

### Modified Files

| File | Changes | Effort |
|------|---------|--------|
| `src/features/app/components/submission-form.tsx` | Contract write instead of DB | Medium |
| `src/features/app/components/vote-tab.tsx` | Contract write instead of DB | Medium |
| `src/features/app/components/review-form.tsx` | Trigger `rewardReview()` after DB save | Small |
| `src/db/actions/cycle-actions.ts` | Call `declareWinner()` on-chain | Small |
| `src/features/app/components/profile-view.tsx` | Show $PLAY balance + tx history | Medium |
| Header/Layout | Show $PLAY balance | Small |

### Environment Variables

```
PLAY_TOKEN_ADDRESS=0x...         # Your $PLAY ERC-20 contract
PLAYGROUP_CONTRACT_ADDRESS=0x... # Deployed PlaygroupCore contract
```

### AUX Code Patterns to Follow

From AUX's docs, key patterns:

```typescript
// Client setup (like AUX)
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const PLAYGROUP_ADDRESS = '0x...';
const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org')
});

// Read album count
const count = await client.readContract({
  address: PLAYGROUP_ADDRESS,
  abi: playgroupAbi,
  functionName: 'getAlbumCount'
});

// Watch for new submissions
client.watchContractEvent({
  address: PLAYGROUP_ADDRESS,
  abi: playgroupAbi,
  eventName: 'AlbumSubmitted',
  onLogs: (logs) => {
    // Sync to database
  }
});
```

### Edge Cases

| Scenario | Solution |
|----------|----------|
| Transaction fails | Show retry UI, don't update DB |
| User rejects tx | Return to form, keep data |
| Insufficient $PLAY | Show "Earn more" message |
| Insufficient bonus | Deduct from $PLAY balance |
| Network congestion | Show pending state, wait |
| Contract paused | Show maintenance message |

### Deployment Checklist

1. [ ] User provides $PLAY token address
2. [ ] Deploy PlaygroupCore contract on Base
3. [ ] Transfer $PLAY supply to contract (for rewards)
4. [ ] Set environment variables
5. [ ] Update frontend to use contract
6. [ ] Test on Base testnet first

---

## Implementation Order

```
#1 One-Week Cycles (15-20 min) ✅ DONE
         ↓
#2 User Profile Page (45-60 min) ✅ DONE
         ↓
#3 Community Buzz (30-45 min) ✅ DONE
         ↓
#5 Universal Access / Privy (3-4 hrs) ✅ DONE
         ↓
#6 $PLAY On-Chain (5-7 hrs) ← Replaces #4 entirely
```

**Recommended next**: #6 ($PLAY On-Chain)

**Total Estimated Time**: ~5-7 hours remaining

| Feature | Why This Order | Status |
|---------|----------------|--------|
| #1 One-Week Cycles | No dependencies, quick win | ✅ Done |
| #2 User Profile | Foundation for all user features | ✅ Done |
| #3 Community Buzz | Farcaster engagement integration | ✅ Done |
| #5 Privy | Establishes wallet addresses for all users | ✅ Done |
| #6 $PLAY On-Chain | Requires wallets from #5 | Next |

> **Note**: Feature #4 (Point Economy - database) is **superseded** by #6. No need to build DB points if going on-chain.

---

## What You Need to Provide

Before implementing Feature #6:

| Item | Description |
|------|-------------|
| **$PLAY Token Address** | Your deployed ERC-20 contract on Base |
| **Token Supply** | Confirm 1B supply |
| **Deployment Decision** | Who deploys PlaygroupCore? (I write it, you deploy) |

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
| 2025-02-08 | Added #4 Universal Access (Privy) |
| 2025-02-08 | Added #5 $PLAY Token On-Chain (AUX-style) - supersedes Point Economy |
| 2025-02-08 | Updated implementation order: 1 → 2 → 4 → 5 |
| 2025-02-08 | **✅ Implemented Feature #1: One-Week Cycles** |
| 2025-02-08 | **✅ Implemented Feature #2: User Profile Page** |
| 2025-02-08 | **✅ Implemented Feature #3: Community Buzz** (Farcaster cast search) |
| 2025-02-08 | Renumbered features: Point Economy → #4, Privy → #5, $PLAY → #6 |
| 2025-02-08 | **✅ Implemented Feature #5: Universal Access (Privy)** - Added users table, unified auth hook, login modal, dual identity support (FID + userId) |
| 2025-02-08 | **✅ Privy Credentials Configured** - Universal login active in production (email, Google, Farcaster) |

---

## Current Production State

**App is READY TO PUBLISH with:**

| Feature | Status |
|---------|--------|
| Core MVP (voting, reviews, archive) | ✅ Complete |
| One-Week Cycles (52 albums/year) | ✅ Complete |
| User Profiles | ✅ Complete |
| Community Buzz (Farcaster casts) | ✅ Complete |
| Universal Login (Privy) | ✅ Complete + Configured |
| $PLAY Token On-Chain | ⏳ Planned (optional) |

**Environment Variables Configured:**
- `NEXT_PUBLIC_PRIVY_APP_ID` ✅
- `PRIVY_APP_SECRET` ✅
- `DATABASE_URL` ✅
- `NEYNAR_API_KEY` ✅

**Login Methods Available:**
- 📱 Farcaster (native mini app)
- 📧 Email (magic link via Privy)
- 🔵 Google (OAuth via Privy)

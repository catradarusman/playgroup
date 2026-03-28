# Playgroup — Claude Context

Music listening club web app. Each 14-day cycle: Days 1–7 submit & vote, Days 8–14 listen & review the winning album.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Auth**: Privy (`@privy-io/react-auth` v3) for email/Farcaster login; Neynar SDK for Farcaster mini-app context
- **DB**: Supabase (Postgres) via Drizzle ORM
- **Styling**: Tailwind CSS + `@neynar/ui` component library
- **Chain**: Base (chain ID 8453) — embedded wallets via Privy

## Key Files

| Path | Purpose |
|------|---------|
| `src/hooks/use-auth.ts` | Unified auth hook (Farcaster + Privy); exports `useAuth()` |
| `src/features/app/privy-wrapper.tsx` | `PrivyProvider` config; lazy-loaded in providers |
| `src/features/app/providers-and-initialization.tsx` | Root providers: Jotai, React Query, Privy (`Suspense fallback={null}`) |
| `src/features/app/components/login-modal.tsx` | Login UI — `LoginModal`, `LoginButton`, `UserButton` |
| `src/db/schema.ts` | Drizzle schema: `users` table |
| `src/db/actions/user-actions.ts` | Server actions: `getOrCreatePrivyUser`, `getOrCreateFarcasterUser` |
| `src/lib/privy.ts` | Privy config constants |

## Auth Flow

1. User clicks login → `useAuth().login()` → `privyLogin()` (Privy's own modal)
2. Privy authenticates via email OTP or Farcaster
3. `useEffect` in `use-auth.ts` calls `syncUser()` on auth state change
4. `syncUser()` calls `getOrCreatePrivyUser()` / `getOrCreateFarcasterUser()` server actions
5. Unified `UnifiedUser` object stored in component state

Priority: Farcaster mini-app context > Privy web login.

## Known Issues / Workarounds

- **Privy `clip-path` warning** — Privy 3.x renders SVG icons with the HTML attr
  `clip-path` instead of React's `clipPath`. A targeted `console.error` filter in
  `privy-wrapper.tsx` suppresses this to prevent the Next.js dev overlay from
  covering the login modal. Remove the filter when Privy fixes this upstream.

## Dev Commands

```bash
pnpm dev        # Start dev server (Turbopack) on :3000
pnpm build      # Production build
pnpm db:push    # Push Drizzle schema to Supabase
```

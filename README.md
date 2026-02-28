# Playgroup

A social music app where a community votes on one album per week, listens together for 7 days, then writes reviews. 52 albums a year. No algorithms.

Built as a Farcaster mini app with universal web access via Privy.

---

## Quick Start

```bash
npm install
npm run dev        # Turbopack (port 3000) — recommended
npm run dev:webpack  # Webpack fallback (port 3001)
```

Copy `.env.example` to `.env.local` and fill in your credentials before starting.

---

## Environment Variables

| Variable                    | Required | Purpose                                    |
| --------------------------- | -------- | ------------------------------------------ |
| `DATABASE_URL`              | Yes      | Neon PostgreSQL connection string          |
| `NEXT_PUBLIC_PRIVY_APP_ID`  | Yes      | Privy app ID for universal login           |
| `PRIVY_APP_SECRET`          | Yes      | Privy app secret                           |
| `NEYNAR_API_KEY`            | Yes      | Neynar SDK for Farcaster cast search       |
| `ADMIN_SECRET`              | Yes      | Bearer token for `/api/admin/reset-cycle`  |
| `COINGECKO_API_KEY`         | No       | CoinGecko API key (optional, demo feature) |

---

## Database

Uses [Drizzle ORM](https://orm.drizzle.team/) with Neon PostgreSQL.

```bash
npm run db:push    # Apply schema changes to database
npm run db:studio  # Open Drizzle Studio (visual DB browser)
```

### Schema overview

| Table     | Purpose                                   |
| --------- | ----------------------------------------- |
| `kv`      | Built-in key-value store (do not modify)  |
| `users`   | Unified identity for FC + Privy users     |
| `cycles`  | 1-week listening cycles (52/year)         |
| `albums`  | Submitted and winning albums              |
| `votes`   | One vote per user per album               |
| `reviews` | User reviews with 1–5 star ratings        |

### ⚠️ Do not modify the `kv` table

The `kv` table in `src/db/schema.ts` is a **required platform table**. Never delete, rename, or change its columns. Doing so will cause schema conflicts and break deployments.

### Schema push behavior

`npm run db:push` uses `drizzle-kit push` and is configured to **fail fast** on ambiguous or destructive changes rather than prompt interactively (which would block CI/deployments).

Common failure triggers:
- Renaming a column (Drizzle can't distinguish rename from drop+add)
- Adding a unique constraint to a column that already has duplicate data
- Renaming a table

When this happens, make the change non-destructively: add the new column, migrate data, then drop the old one in a separate push.

---

## Tech Stack

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Framework      | Next.js 16 (App Router) + React 19      |
| Build          | Turbopack (dev), standard (prod)        |
| Database       | Neon PostgreSQL + Drizzle ORM v0.38     |
| Auth           | Farcaster mini app SDK + Privy          |
| UI             | @neynar/ui components                   |
| Fonts          | Outfit (UI) + JetBrains Mono (numbers)  |
| External APIs  | Deezer (album metadata), Neynar (casts) |

---

## Admin Endpoints

### `GET /api/admin/reset-cycle`

Force-creates a new voting cycle. Requires `Authorization: Bearer <ADMIN_SECRET>` header.

```bash
curl -H "Authorization: Bearer your_secret" http://localhost:3000/api/admin/reset-cycle
```

Returns 401 if secret is missing or incorrect.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   └── api/
│       ├── admin/          # Admin-only endpoints (auth required)
│       ├── deezer/         # Deezer metadata proxy
│       └── share/          # Share image generation (OG images)
├── config/
│   └── private-config.ts   # Zod-validated server-side env vars
├── db/
│   ├── schema.ts           # All table definitions
│   └── actions/            # Server actions (data layer)
│       ├── cycle-actions.ts
│       ├── submission-actions.ts
│       ├── review-actions.ts
│       ├── profile-actions.ts
│       └── user-actions.ts
├── features/
│   └── app/                # Main app shell + all UI components
│       ├── mini-app.tsx
│       ├── privy-wrapper.tsx
│       └── components/
├── hooks/                  # React data hooks (call server actions)
│   ├── use-auth.ts         # Unified FC + Privy auth
│   ├── use-cycle.ts
│   ├── use-submissions.ts
│   ├── use-reviews.ts
│   ├── use-profile.ts
│   └── use-album-buzz.ts
└── lib/                    # Utilities (Deezer client, Privy config)
```

---

## Key Implementation Notes

1. **Unified auth**: All user-facing actions support both Farcaster FID (legacy) and `userId` (Privy/new). Never assume `fid` is present.
2. **Race-safe writes**: All DB writes that check-then-insert run inside `db.transaction()`. The schema also enforces uniqueness at the DB level (partial indexes) as a last resort.
3. **N+1 free**: Vote and review counts are fetched with `LEFT JOIN + GROUP BY`, not per-row queries.
4. **No mock data**: All components use real DB data and show empty states when no data exists.
5. **DiceBear avatars**: Privy users who have no Farcaster PFP get a deterministic DiceBear avatar seeded from their `userId`.
6. **Cycle auto-create**: `getOrCreateCurrentCycle()` creates Week 1 automatically on first app load — no manual setup needed.

---

## See Also

- **[specs.md](./specs.md)** — App features, data architecture, environment variables, changelog
- **[wiring-plan.md](./wiring-plan.md)** — Schema, server actions, hooks, components, validation rules
- **[roadmap.md](./roadmap.md)** — Implemented features and planned next steps

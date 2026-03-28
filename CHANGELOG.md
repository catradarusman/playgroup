# Changelog

All notable changes to Playgroup are recorded here.

---

## [Unreleased]

---

## 2026-03-29

### Fixed
- **Profile picture upload internal server error** — API route swallowed the real
  error and returned a generic 500. Now surfaces the actual error message so failures
  are diagnosable. Also auto-creates the `profile-pictures` Supabase storage bucket
  on first upload if it doesn't exist yet, recovering gracefully instead of failing.
- **Login broken when Privy session already active** — `login()` in `use-auth.ts`
  called `privyLogin()` without checking `privyAuthenticated`. During the window
  between page load and `syncUser()` completing, `isAuthenticated` is `false` even
  though Privy already has a session — causing login buttons to appear and triggering
  a Privy error when clicked. Added `privyAuthenticated` guard so `privyLogin()` is
  never called on an already-authenticated session.

---

## 2026-03-28

### Fixed
- **Privy email sign-in blocked by Next.js dev overlay** (`f5aee37`)
  - `Suspense fallback={content}` in `providers-and-initialization.tsx` was rendering
    the full app children (which call `usePrivy()`) before `PrivyProvider` mounted,
    causing a React context crash that left Privy stuck in an uninitialized state.
    Changed to `fallback={null}`.
  - `login()` in `use-auth.ts` called `privyLogin()` without checking `privyReady`.
    Added guard so the call is skipped if Privy hasn't finished initializing.
  - Privy 3.14.1 renders its modal SVG icons using the HTML attribute `clip-path`
    instead of React's camelCase `clipPath`. In development, React logs this as a
    Console Error which triggers the Next.js error overlay — completely covering the
    login modal and making email sign-in appear broken. Added a targeted
    `console.error` filter in `privy-wrapper.tsx` to suppress this specific Privy
    library warning until it is fixed upstream.

---

## 2026-03-27

### Fixed
- **Stale production cache** (`e70796c`) — Enabled `skipWaiting` in the service
  worker so new deploys take effect immediately without requiring a manual refresh.
- **`getCycleAlbum` out-of-sync album status** (`6c7bc6c`) — Fall back to
  `cycle.winnerId` when the album's status field is out of sync with the cycle state.
- **Week 0 display** (`ccb1866`) — Corrected Week 0 showing incorrectly; also
  resolved a related stale service worker caching issue.
- **"How It Works" copy** (`8327d7f`) — Updated text to accurately reflect the
  actual 14-day cycle structure.

### Added
- **Profile picture upload, submission notes, Submit & Vote tab** (`bc0bddd`)

---

## 2026-03-26

### Added
- **PWA support** (`dabfbf1`, `fca9df5`) — Web app manifest, service worker, icons,
  and explicit service worker registration for App Router.
- **SQL migration utility scripts** (`d02ed55`) — Helper scripts for Supabase schema
  migrations.

### Fixed
- **Sign-in UX** (`321a8da`) — Profile access, Privy user profile routing, and
  submission count refresh after signing in.

'use server';

import { db } from '@/neynar-db-sdk/db';
import { cycles, albums, votes } from '@/db/schema';
import { eq, desc, and, sql, getTableColumns, lte, gte } from 'drizzle-orm';

// ===========================================
// CYCLE TIMING CONSTANTS (Jakarta UTC+7)
// ===========================================

// Anchor: Mar 2 2026 00:00:00 Jakarta = Mar 1 2026 17:00:00 UTC
const ANCHOR_UTC = new Date('2026-03-01T17:00:00.000Z');
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7
const CYCLE_MS = 14 * 24 * 60 * 60 * 1000;    // 14 days
const VOTING_MS = 7 * 24 * 60 * 60 * 1000;    // 7 days voting
const REVIEW_OFFSET_MS = 11 * 24 * 60 * 60 * 1000; // reviews open on day 12 (3 days before end)

/**
 * Compute the anchor-based cycle boundaries for the cycle that contains `now`.
 * All boundaries are in absolute UTC milliseconds; they correspond to exact
 * Jakarta-midnight boundaries since the anchor is a Jakarta midnight.
 *
 * Cycle 1 example (Jakarta times):
 *   startDate    = Mar 2  00:00:00
 *   votingEndsAt = Mar 9  00:00:00  ("Mar 8 midnight")
 *   reviewOpensAt= Mar 13 00:00:00  (last 3 days of listening)
 *   endDate      = Mar 15 23:59:59.999
 *   Next cycle   = Mar 16 00:00:00
 */
function computeCycleBoundaries(now: Date) {
  const elapsed = now.getTime() - ANCHOR_UTC.getTime();
  const cycleNum = Math.max(0, Math.floor(elapsed / CYCLE_MS));

  const startDate = new Date(ANCHOR_UTC.getTime() + cycleNum * CYCLE_MS);
  const votingEndsAt = new Date(startDate.getTime() + VOTING_MS);
  const reviewOpensAt = new Date(startDate.getTime() + REVIEW_OFFSET_MS);
  const endDate = new Date(startDate.getTime() + CYCLE_MS - 1); // 1ms before next cycle

  const weekNumber = cycleNum + 1; // 1-indexed
  // Derive year from the Jakarta start date
  const year = new Date(startDate.getTime() + JAKARTA_OFFSET_MS).getUTCFullYear();

  return { cycleNum, weekNumber, year, startDate, votingEndsAt, reviewOpensAt, endDate };
}

/**
 * Get the current active cycle
 */
export async function getCurrentCycle() {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Get the most recent cycle
  const result = await db
    .select()
    .from(cycles)
    .where(eq(cycles.year, currentYear))
    .orderBy(desc(cycles.weekNumber))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get current cycle with countdown computed
 * Auto-transitions from voting to listening when voting period ends
 */
export async function getCycleWithCountdown() {
  let cycle = await getCurrentCycle();
  if (!cycle) return null;

  const now = new Date();

  // AUTO-TRANSITION: If voting period ended but phase is still 'voting', select winner
  if (cycle.phase === 'voting' && now > cycle.votingEndsAt) {
    const transitionResult = await autoTransitionToListening(cycle.id);
    if (transitionResult.success) {
      // Re-fetch the updated cycle
      cycle = await getCurrentCycle();
      if (!cycle) return null;
    }
  }

  const targetDate = cycle.phase === 'voting' ? cycle.votingEndsAt : cycle.endDate;
  const diff = targetDate.getTime() - now.getTime();

  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));

  // Derive review window state
  // null reviewOpensAt = old cycle, treat as always open during listening
  const isReviewOpen =
    cycle.phase === 'listening' &&
    (cycle.reviewOpensAt === null || now >= cycle.reviewOpensAt);

  return {
    ...cycle,
    isReviewOpen,
    countdown: { days, hours, minutes },
  };
}

/**
 * Auto-transition from voting to listening phase
 * Wrapped in a transaction to prevent race conditions from concurrent requests.
 * Re-checks cycle phase at the start for idempotency.
 */
async function autoTransitionToListening(cycleId: string) {
  return await db.transaction(async (tx) => {
    // Re-check inside transaction: if another request already transitioned, skip
    const [currentCycle] = await tx
      .select()
      .from(cycles)
      .where(eq(cycles.id, cycleId))
      .limit(1);

    if (!currentCycle || currentCycle.phase !== 'voting') {
      return { success: false, error: 'Already transitioned' };
    }

    // Single aggregating query replaces N+1 vote-count loop
    const albumsWithVotes = await tx
      .select({
        ...getTableColumns(albums),
        voteCount: sql<number>`count(${votes.id})::int`,
      })
      .from(albums)
      .leftJoin(votes, eq(votes.albumId, albums.id))
      .where(and(eq(albums.cycleId, cycleId), eq(albums.status, 'voting')))
      .groupBy(albums.id);

    if (albumsWithVotes.length === 0) {
      // No submissions — transition to listening with no winner
      await tx
        .update(cycles)
        .set({ phase: 'listening' })
        .where(eq(cycles.id, cycleId));
      return { success: true, winner: null };
    }

    // Find the highest vote count
    const maxVotes = Math.max(...albumsWithVotes.map((a) => a.voteCount));
    const topAlbums = albumsWithVotes.filter((a) => a.voteCount === maxVotes);

    // Tiebreaker: earliest submission wins
    topAlbums.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const winner = topAlbums[0];

    // Update winner status to 'selected'
    await tx
      .update(albums)
      .set({ status: 'selected' })
      .where(eq(albums.id, winner.id));

    // Update all other voting albums to 'lost'
    await tx
      .update(albums)
      .set({ status: 'lost' })
      .where(and(eq(albums.cycleId, cycleId), eq(albums.status, 'voting')));

    // Update cycle with winner and phase
    await tx
      .update(cycles)
      .set({ winnerId: winner.id, phase: 'listening' })
      .where(eq(cycles.id, cycleId));

    return { success: true, winner };
  });
}

/**
 * Get the winning/current album for a cycle
 */
export async function getCycleAlbum(cycleId: string) {
  const result = await db
    .select()
    .from(albums)
    .where(and(eq(albums.cycleId, cycleId), eq(albums.status, 'selected')))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get past winning albums for archive
 * Uses a JOIN instead of N+1 queries for cycle week numbers
 */
export async function getPastAlbums(_year?: number) {
  const result = await db
    .select({
      id: albums.id,
      spotifyId: albums.spotifyId,
      title: albums.title,
      artist: albums.artist,
      coverUrl: albums.coverUrl,
      spotifyUrl: albums.spotifyUrl,
      avgRating: albums.avgRating,
      totalReviews: albums.totalReviews,
      cycleId: albums.cycleId,
      mostLovedTrack: albums.mostLovedTrack,
      mostLovedTrackVotes: albums.mostLovedTrackVotes,
      submittedByFid: albums.submittedByFid,
      submittedByUserId: albums.submittedByUserId,
      submittedByUsername: albums.submittedByUsername,
      submissionNote: albums.submissionNote,
      genres: albums.genres,
      createdAt: albums.createdAt,
      weekNumber: cycles.weekNumber,
    })
    .from(albums)
    .innerJoin(cycles, eq(cycles.id, albums.cycleId))
    .where(eq(albums.status, 'selected'))
    .orderBy(desc(albums.createdAt));

  return result;
}

/**
 * Get album by ID with full details
 * Uses a JOIN instead of two separate queries
 */
export async function getAlbumById(albumId: string) {
  const result = await db
    .select({
      ...getTableColumns(albums),
      weekNumber: cycles.weekNumber,
    })
    .from(albums)
    .innerJoin(cycles, eq(cycles.id, albums.cycleId))
    .where(eq(albums.id, albumId))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Create a new cycle (admin function)
 */
export async function createCycle(data: {
  weekNumber: number;
  year: number;
  phase: 'voting' | 'listening';
  startDate: Date;
  endDate: Date;
  votingEndsAt: Date;
  reviewOpensAt?: Date;
}) {
  const result = await db.insert(cycles).values(data).returning();
  return result[0];
}

/**
 * Update cycle phase
 */
export async function updateCyclePhase(cycleId: string, phase: 'voting' | 'listening', winnerId?: string) {
  await db
    .update(cycles)
    .set({ phase, winnerId })
    .where(eq(cycles.id, cycleId));
}

/**
 * Get listener count (users who have viewed the current album)
 * For MVP, we'll return a placeholder - can be enhanced with KV tracking
 */
export async function getListenerCount(_cycleId: string): Promise<number> {
  // Placeholder for MVP - could track via KV store
  return 47;
}

/**
 * Get or create a current cycle — ensures there's always an active cycle.
 *
 * Looks for a cycle that time-covers `now` (startDate ≤ now ≤ endDate).
 * If none exists, creates one using the fixed Jakarta anchor and 14-day cadence
 * so cycles are always on the correct 2-week boundaries.
 */
export async function getOrCreateCurrentCycle() {
  const now = new Date();

  // Find any cycle that currently covers this moment
  const [active] = await db
    .select()
    .from(cycles)
    .where(and(lte(cycles.startDate, now), gte(cycles.endDate, now)))
    .orderBy(desc(cycles.weekNumber))
    .limit(1);

  if (active) return active;

  // No active cycle — compute the correct boundaries from the anchor
  const boundaries = computeCycleBoundaries(now);

  // Find last cycle to avoid weekNumber collisions (use max of computed and DB max+1)
  const [last] = await db
    .select()
    .from(cycles)
    .orderBy(desc(cycles.weekNumber))
    .limit(1);

  const weekNumber = Math.max(boundaries.weekNumber, (last?.weekNumber ?? 0) + 1);

  const newCycle = await createCycle({
    weekNumber,
    year: boundaries.year,
    phase: 'voting',
    startDate: boundaries.startDate,
    endDate: boundaries.endDate,
    votingEndsAt: boundaries.votingEndsAt,
    reviewOpensAt: boundaries.reviewOpensAt,
  });

  return newCycle;
}

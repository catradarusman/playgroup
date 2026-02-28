'use server';

import { db } from '@/neynar-db-sdk/db';
import { cycles, albums, votes } from '@/db/schema';
import { eq, desc, and, sql, getTableColumns } from 'drizzle-orm';

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

  return {
    ...cycle,
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
      submittedByUsername: albums.submittedByUsername,
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
 * Get or create a current cycle - ensures there's always an active cycle
 * Creates a new voting cycle if:
 * - No cycle exists at all
 * - The most recent cycle has fully ended (past endDate)
 */
export async function getOrCreateCurrentCycle() {
  const existing = await getCurrentCycle();
  const now = new Date();

  // If a cycle exists and hasn't fully ended yet, keep using it
  if (existing && now <= existing.endDate) {
    return existing;
  }

  // Either no cycle exists, or the last cycle is fully over — start a fresh one
  const year = now.getFullYear();

  // Determine week number: increment from last cycle, or start at 1
  const lastWeek = existing?.weekNumber ?? 0;
  const nextWeek = lastWeek + 1;

  // New cycle starts today, voting open for 4 days
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  const votingEndsAt = new Date(startDate);
  votingEndsAt.setDate(votingEndsAt.getDate() + 4); // 4 days of voting
  votingEndsAt.setHours(22, 0, 0, 0); // closes at 10pm

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7); // full week
  endDate.setHours(23, 59, 59, 999);

  const newCycle = await createCycle({
    weekNumber: nextWeek,
    year,
    phase: 'voting',
    startDate,
    endDate,
    votingEndsAt,
  });

  return newCycle;
}

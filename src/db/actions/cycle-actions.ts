'use server';

import { db } from '@/neynar-db-sdk/db';
import { cycles, albums, votes } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

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
 * Selects the winner based on votes
 */
async function autoTransitionToListening(cycleId: string) {
  // Get all albums in voting status for this cycle with vote counts
  const albumsResult = await db
    .select()
    .from(albums)
    .where(and(eq(albums.cycleId, cycleId), eq(albums.status, 'voting')));

  if (albumsResult.length === 0) {
    // No submissions - transition to listening anyway but with no winner
    await db
      .update(cycles)
      .set({ phase: 'listening' })
      .where(eq(cycles.id, cycleId));
    return { success: true, winner: null };
  }

  // Get vote counts for each album
  const albumsWithVotes = await Promise.all(
    albumsResult.map(async (album) => {
      const voteCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(votes)
        .where(eq(votes.albumId, album.id));
      return {
        ...album,
        voteCount: Number(voteCount[0]?.count ?? 0),
      };
    })
  );

  // Find the highest vote count
  const maxVotes = Math.max(...albumsWithVotes.map((a) => a.voteCount));
  const topAlbums = albumsWithVotes.filter((a) => a.voteCount === maxVotes);

  // Tiebreaker: earliest submission wins (sort by createdAt ascending)
  topAlbums.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const winner = topAlbums[0];

  // Update winner status to 'selected'
  await db
    .update(albums)
    .set({ status: 'selected' })
    .where(eq(albums.id, winner.id));

  // Update all other voting albums to 'lost'
  await db
    .update(albums)
    .set({ status: 'lost' })
    .where(and(eq(albums.cycleId, cycleId), eq(albums.status, 'voting')));

  // Update cycle with winner and phase
  await db
    .update(cycles)
    .set({ winnerId: winner.id, phase: 'listening' })
    .where(eq(cycles.id, cycleId));

  return { success: true, winner };
}

/**
 * Get the winning/current album for a cycle
 */
export async function getCycleAlbum(cycleId: string) {
  // Get the winning album for this cycle
  const result = await db
    .select()
    .from(albums)
    .where(and(eq(albums.cycleId, cycleId), eq(albums.status, 'selected')))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get past winning albums for archive
 */
export async function getPastAlbums(_year?: number) {
  // Get all selected albums with their cycle info
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
    })
    .from(albums)
    .where(eq(albums.status, 'selected'))
    .orderBy(desc(albums.createdAt));

  // Get cycle week numbers
  const albumsWithWeeks = await Promise.all(
    result.map(async (album) => {
      const cycle = await db
        .select({ weekNumber: cycles.weekNumber })
        .from(cycles)
        .where(eq(cycles.id, album.cycleId))
        .limit(1);

      return {
        ...album,
        weekNumber: cycle[0]?.weekNumber ?? 0,
      };
    })
  );

  return albumsWithWeeks;
}

/**
 * Get album by ID with full details
 */
export async function getAlbumById(albumId: string) {
  const result = await db.select().from(albums).where(eq(albums.id, albumId)).limit(1);

  if (!result[0]) return null;

  // Get cycle info
  const cycle = await db
    .select({ weekNumber: cycles.weekNumber })
    .from(cycles)
    .where(eq(cycles.id, result[0].cycleId))
    .limit(1);

  return {
    ...result[0],
    weekNumber: cycle[0]?.weekNumber ?? 0,
  };
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
 * Creates Week 1 in voting phase if no cycle exists
 */
export async function getOrCreateCurrentCycle() {
  const existing = await getCurrentCycle();
  if (existing) return existing;

  // No cycle exists - create the first one!
  const now = new Date();
  const year = now.getFullYear();

  // Calculate cycle dates: 1 week total
  // Voting: Mon-Thu (4 days), Listening: Fri-Sun (3 days)
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  const votingEndsAt = new Date(startDate);
  votingEndsAt.setDate(votingEndsAt.getDate() + 4); // 4 days for voting (Mon-Thu)
  votingEndsAt.setHours(22, 0, 0, 0); // 10pm

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7); // 1 week total
  endDate.setHours(23, 59, 59, 999);

  const newCycle = await createCycle({
    weekNumber: 1,
    year,
    phase: 'voting',
    startDate,
    endDate,
    votingEndsAt,
  });

  return newCycle;
}

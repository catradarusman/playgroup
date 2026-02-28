'use server';

import { db } from '@/neynar-db-sdk/db';
import { albums, votes, cycles } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Submit a new album for voting
 * Supports both FID (legacy) and userId (new Privy users)
 * Wrapped in a transaction so duplicate-check + insert + auto-vote are atomic
 */
export async function submitAlbum(data: {
  spotifyId: string;
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl: string;
  tracks?: string[];
  genres?: string[];
  cycleId: string;
  fid?: number; // Legacy - Farcaster users
  userId?: string; // New - unified user ID
  username: string;
}) {
  // Check if this album was a past winner (outside transaction — read-only, no race risk)
  const pastWinner = await db
    .select()
    .from(albums)
    .where(and(eq(albums.spotifyId, data.spotifyId), eq(albums.status, 'selected')))
    .limit(1);

  if (pastWinner.length > 0) {
    return { success: false as const, error: 'This won before - check The 52!' };
  }

  try {
    return await db.transaction(async (tx) => {
      // Re-check for duplicate inside transaction to close the race window
      const existingAlbum = await tx
        .select()
        .from(albums)
        .where(and(eq(albums.cycleId, data.cycleId), eq(albums.spotifyId, data.spotifyId)))
        .limit(1);

      if (existingAlbum.length > 0) {
        return { success: false as const, error: 'Already submitted - go upvote it!' };
      }

      // Insert the album
      const result = await tx
        .insert(albums)
        .values({
          spotifyId: data.spotifyId,
          title: data.title,
          artist: data.artist,
          coverUrl: data.coverUrl,
          spotifyUrl: data.spotifyUrl,
          tracks: data.tracks ?? null,
          genres: data.genres ?? null,
          cycleId: data.cycleId,
          submittedByFid: data.fid ?? null,
          submittedByUserId: data.userId ?? null,
          submittedByUsername: data.username,
          status: 'voting',
        })
        .returning();

      const album = result[0];

      // Auto-vote for the submitter's own album (same transaction)
      await tx.insert(votes).values({
        albumId: album.id,
        voterFid: data.fid ?? null,
        voterId: data.userId ?? null,
      });

      return { success: true as const, album };
    });
  } catch (err: unknown) {
    // Unique index violation means a concurrent request beat us to it
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { success: false as const, error: 'Already submitted - go upvote it!' };
    }
    throw err;
  }
}

/**
 * Get all submissions for a cycle with vote counts
 * Uses a single JOIN query instead of N+1 per-album queries
 */
export async function getSubmissions(cycleId: string) {
  const rows = await db
    .select({
      id: albums.id,
      spotifyId: albums.spotifyId,
      title: albums.title,
      artist: albums.artist,
      coverUrl: albums.coverUrl,
      spotifyUrl: albums.spotifyUrl,
      genres: albums.genres,
      submittedByFid: albums.submittedByFid,
      submittedByUsername: albums.submittedByUsername,
      createdAt: albums.createdAt,
      votes: sql<number>`count(${votes.id})::int`,
    })
    .from(albums)
    .leftJoin(votes, eq(votes.albumId, albums.id))
    .where(and(eq(albums.cycleId, cycleId), eq(albums.status, 'voting')))
    .groupBy(albums.id)
    .orderBy(desc(albums.createdAt));

  return rows
    .map((row) => ({
      id: row.id,
      spotifyId: row.spotifyId,
      title: row.title,
      artist: row.artist,
      coverUrl: row.coverUrl,
      spotifyUrl: row.spotifyUrl,
      genres: (row.genres as string[] | null) ?? [],
      votes: row.votes,
      submitterFid: row.submittedByFid,
      submitter: row.submittedByUsername,
      daysAgo: Math.floor((Date.now() - row.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .sort((a, b) => b.votes - a.votes);
}

/**
 * Get submissions with user's vote status
 * Supports both FID (legacy) and userId (new)
 */
export async function getSubmissionsWithUserVotes(
  cycleId: string,
  userFid?: number,
  userId?: string
) {
  const submissions = await getSubmissions(cycleId);

  // Get user's votes - check by either FID or userId
  let userVotes: { albumId: string }[] = [];

  if (userId) {
    userVotes = await db.select({ albumId: votes.albumId }).from(votes).where(eq(votes.voterId, userId));
  } else if (userFid) {
    userVotes = await db.select({ albumId: votes.albumId }).from(votes).where(eq(votes.voterFid, userFid));
  }

  const votedAlbumIds = new Set(userVotes.map((v) => v.albumId));

  return submissions.map((s) => ({
    ...s,
    hasVoted: votedAlbumIds.has(s.id),
  }));
}

/**
 * Get user's submission count for current cycle
 * Supports both FID (legacy) and userId (new)
 */
export async function getUserSubmissionCount(cycleId: string, fid?: number, userId?: string) {
  let whereClause;

  if (userId) {
    whereClause = and(eq(albums.cycleId, cycleId), eq(albums.submittedByUserId, userId));
  } else if (fid) {
    whereClause = and(eq(albums.cycleId, cycleId), eq(albums.submittedByFid, fid));
  } else {
    return 0;
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(albums)
    .where(whereClause);

  return Number(result[0]?.count ?? 0);
}

/**
 * Cast a vote for an album
 * Supports both FID (legacy) and userId (new)
 * Wrapped in a transaction so the duplicate-check + insert are atomic
 */
export async function castVote(albumId: string, fid?: number, userId?: string) {
  // Guard: require at least one identity
  if (!fid && !userId) {
    return { success: false as const, error: 'Authentication required to vote' };
  }

  try {
    return await db.transaction(async (tx) => {
      // Check if album exists and is in voting status
      const [album] = await tx.select().from(albums).where(eq(albums.id, albumId)).limit(1);

      if (!album || album.status !== 'voting') {
        return { success: false as const, error: 'Album not available for voting' };
      }

      // Check for existing vote inside transaction to close the race window
      let hasVoted = false;

      if (userId) {
        const [existing] = await tx
          .select()
          .from(votes)
          .where(and(eq(votes.albumId, albumId), eq(votes.voterId, userId)))
          .limit(1);
        hasVoted = !!existing;
      } else if (fid) {
        const [existing] = await tx
          .select()
          .from(votes)
          .where(and(eq(votes.albumId, albumId), eq(votes.voterFid, fid)))
          .limit(1);
        hasVoted = !!existing;
      }

      if (hasVoted) {
        return { success: false as const, error: 'Already voted for this album' };
      }

      // Cast the vote
      await tx.insert(votes).values({
        albumId,
        voterFid: fid ?? null,
        voterId: userId ?? null,
      });

      return { success: true };
    });
  } catch (err: unknown) {
    // Unique index violation means a concurrent request beat us to it
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { success: false as const, error: 'Already voted for this album' };
    }
    throw err;
  }
}

/**
 * Select the winner (called when voting ends)
 */
export async function selectWinner(cycleId: string) {
  // Get all albums with vote counts
  const submissions = await getSubmissions(cycleId);

  if (submissions.length === 0) {
    return { success: false as const, error: 'No submissions to select from' };
  }

  // Find the highest vote count
  const maxVotes = Math.max(...submissions.map((s) => s.votes));
  const topAlbums = submissions.filter((s) => s.votes === maxVotes);

  // Tiebreaker: if multiple albums have same votes, pick earliest submission
  // (already sorted by createdAt desc, so reverse for earliest first)
  const winner = topAlbums[topAlbums.length - 1];

  // Update winner status
  await db.update(albums).set({ status: 'selected' }).where(eq(albums.id, winner.id));

  // Update losers
  await db
    .update(albums)
    .set({ status: 'lost' })
    .where(and(eq(albums.cycleId, cycleId), eq(albums.status, 'voting')));

  // Update cycle with winner and phase
  await db.update(cycles).set({ winnerId: winner.id, phase: 'listening' }).where(eq(cycles.id, cycleId));

  return { success: true, winner };
}

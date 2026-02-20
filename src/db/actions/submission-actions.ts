'use server';

import { db } from '@/neynar-db-sdk/db';
import { albums, votes, cycles } from '@/db/schema';
import { eq, and, desc, sql, or } from 'drizzle-orm';

/**
 * Submit a new album for voting
 * Supports both FID (legacy) and userId (new Privy users)
 */
export async function submitAlbum(data: {
  spotifyId: string;
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl: string;
  tracks?: string[];
  cycleId: string;
  fid?: number; // Legacy - Farcaster users
  userId?: string; // New - unified user ID
  username: string;
}) {
  // Check for duplicate spotify ID in this cycle
  const existingAlbum = await db
    .select()
    .from(albums)
    .where(and(eq(albums.cycleId, data.cycleId), eq(albums.spotifyId, data.spotifyId)))
    .limit(1);

  if (existingAlbum.length > 0) {
    return { success: false, error: 'Already submitted - go upvote it!' };
  }

  // Check if this album was a past winner
  const pastWinner = await db
    .select()
    .from(albums)
    .where(and(eq(albums.spotifyId, data.spotifyId), eq(albums.status, 'selected')))
    .limit(1);

  if (pastWinner.length > 0) {
    return { success: false, error: 'This won before - check The 52!' };
  }

  // Insert the album
  const result = await db
    .insert(albums)
    .values({
      spotifyId: data.spotifyId,
      title: data.title,
      artist: data.artist,
      coverUrl: data.coverUrl,
      spotifyUrl: data.spotifyUrl,
      tracks: data.tracks ?? null,
      cycleId: data.cycleId,
      submittedByFid: data.fid ?? null,
      submittedByUserId: data.userId ?? null,
      submittedByUsername: data.username,
      status: 'voting',
    })
    .returning();

  const album = result[0];

  // Auto-vote for the submitter's own album
  await db.insert(votes).values({
    albumId: album.id,
    voterFid: data.fid ?? null,
    voterId: data.userId ?? null,
  });

  return { success: true, album };
}

/**
 * Get all submissions for a cycle with vote counts
 */
export async function getSubmissions(cycleId: string) {
  // Get all albums in voting status for this cycle
  const albumsResult = await db
    .select()
    .from(albums)
    .where(and(eq(albums.cycleId, cycleId), eq(albums.status, 'voting')))
    .orderBy(desc(albums.createdAt));

  // Get vote counts for each album
  const submissionsWithVotes = await Promise.all(
    albumsResult.map(async (album) => {
      const voteCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(votes)
        .where(eq(votes.albumId, album.id));

      return {
        id: album.id,
        title: album.title,
        artist: album.artist,
        coverUrl: album.coverUrl,
        spotifyUrl: album.spotifyUrl,
        votes: Number(voteCount[0]?.count ?? 0),
        submitterFid: album.submittedByFid,
        submitter: album.submittedByUsername,
        daysAgo: Math.floor((Date.now() - album.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      };
    })
  );

  return submissionsWithVotes.sort((a, b) => b.votes - a.votes);
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
 */
export async function castVote(albumId: string, fid?: number, userId?: string) {
  // Check if already voted for this album
  let existingVote: any[] = [];

  if (userId) {
    existingVote = await db
      .select()
      .from(votes)
      .where(and(eq(votes.albumId, albumId), eq(votes.voterId, userId)))
      .limit(1);
  } else if (fid) {
    existingVote = await db
      .select()
      .from(votes)
      .where(and(eq(votes.albumId, albumId), eq(votes.voterFid, fid)))
      .limit(1);
  }

  if (existingVote.length > 0) {
    return { success: false, error: 'Already voted for this album' };
  }

  // Check if album exists and is in voting status
  const album = await db.select().from(albums).where(eq(albums.id, albumId)).limit(1);

  if (!album[0] || album[0].status !== 'voting') {
    return { success: false, error: 'Album not available for voting' };
  }

  // Cast the vote
  await db.insert(votes).values({
    albumId,
    voterFid: fid ?? null,
    voterId: userId ?? null,
  });

  return { success: true };
}

/**
 * Select the winner (called when voting ends)
 */
export async function selectWinner(cycleId: string) {
  // Get all albums with vote counts
  const submissions = await getSubmissions(cycleId);

  if (submissions.length === 0) {
    return { success: false, error: 'No submissions to select from' };
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

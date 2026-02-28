'use server';

import { db } from '@/neynar-db-sdk/db';
import { reviews, albums } from '@/db/schema';
import { eq, and, desc, sql, avg } from 'drizzle-orm';

type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Submit a review for an album
 * Supports both FID (legacy) and userId (new)
 * Wrapped in a transaction so duplicate-check + insert + stats update are atomic
 */
export async function submitReview(data: {
  albumId: string;
  fid?: number; // Legacy - Farcaster users
  userId?: string; // New - unified user ID
  username: string;
  pfp: string | null;
  rating: number;
  text: string;
  favoriteTrack: string | null;
  hasListened: boolean;
}) {
  // Validate rating
  if (data.rating < 1 || data.rating > 5) {
    return { success: false as const, error: 'Rating must be 1-5' };
  }

  // Validate text length
  if (data.text.length < 50) {
    return { success: false as const, error: 'Review must be at least 50 characters' };
  }

  try {
    return await db.transaction(async (tx) => {
      // Check for existing review inside transaction to close the race window
      let hasReviewed = false;

      if (data.userId) {
        const [existing] = await tx
          .select()
          .from(reviews)
          .where(and(eq(reviews.albumId, data.albumId), eq(reviews.reviewerId, data.userId)))
          .limit(1);
        hasReviewed = !!existing;
      } else if (data.fid) {
        const [existing] = await tx
          .select()
          .from(reviews)
          .where(and(eq(reviews.albumId, data.albumId), eq(reviews.reviewerFid, data.fid)))
          .limit(1);
        hasReviewed = !!existing;
      }

      if (hasReviewed) {
        return { success: false as const, error: 'You already reviewed this album' };
      }

      // Insert review
      const result = await tx
        .insert(reviews)
        .values({
          albumId: data.albumId,
          reviewerFid: data.fid ?? null,
          reviewerId: data.userId ?? null,
          reviewerUsername: data.username,
          reviewerPfp: data.pfp,
          rating: data.rating,
          reviewText: data.text,
          favoriteTrack: data.favoriteTrack,
          hasListened: data.hasListened,
        })
        .returning();

      // Update album stats inside the same transaction
      await updateAlbumStats(data.albumId, tx);

      return { success: true as const, review: result[0] };
    });
  } catch (err: unknown) {
    // Unique index violation means a concurrent request beat us to it
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { success: false as const, error: 'You already reviewed this album' };
    }
    throw err;
  }
}

/**
 * Get all reviews for an album
 */
export async function getAlbumReviews(albumId: string) {
  const result = await db
    .select()
    .from(reviews)
    .where(eq(reviews.albumId, albumId))
    .orderBy(desc(reviews.createdAt));

  return result.map((r) => ({
    id: r.id,
    fid: r.reviewerFid,
    user: r.reviewerUsername,
    displayName: r.reviewerUsername,
    // Use reviewerId as seed fallback for Privy users who have no FID
    pfp: r.reviewerPfp || `https://api.dicebear.com/9.x/lorelei/svg?seed=${r.reviewerId ?? r.reviewerFid ?? 'anon'}`,
    rating: r.rating,
    text: r.reviewText,
    favoriteTrack: r.favoriteTrack,
    daysAgo: Math.floor((Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
  }));
}

/**
 * Check if user has reviewed an album
 * Supports both FID (legacy) and userId (new)
 */
export async function getUserReview(albumId: string, fid?: number, userId?: string) {
  let result: (typeof reviews.$inferSelect)[] = [];

  if (userId) {
    result = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.albumId, albumId), eq(reviews.reviewerId, userId)))
      .limit(1);
  } else if (fid) {
    result = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.albumId, albumId), eq(reviews.reviewerFid, fid)))
      .limit(1);
  }

  return result[0] ?? null;
}

/**
 * Update album stats (avg rating, total reviews, most loved track)
 * Accepts an optional transaction client so it can run inside an existing transaction
 */
async function updateAlbumStats(albumId: string, client: TxClient | typeof db = db) {
  // Calculate average rating
  const avgResult = await client
    .select({ avgRating: avg(reviews.rating) })
    .from(reviews)
    .where(eq(reviews.albumId, albumId));

  const avgRating = avgResult[0]?.avgRating ? Number(avgResult[0].avgRating) : null;

  // Count total reviews
  const countResult = await client
    .select({ count: sql<number>`count(*)` })
    .from(reviews)
    .where(eq(reviews.albumId, albumId));

  const totalReviews = Number(countResult[0]?.count ?? 0);

  // Find most loved track
  const trackResult = await client
    .select({
      track: reviews.favoriteTrack,
      count: sql<number>`count(*)`,
    })
    .from(reviews)
    .where(and(eq(reviews.albumId, albumId), sql`${reviews.favoriteTrack} IS NOT NULL`))
    .groupBy(reviews.favoriteTrack)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  const mostLovedTrack = trackResult[0]?.track ?? null;
  const mostLovedTrackVotes = trackResult[0] ? Number(trackResult[0].count) : 0;

  // Update album
  await client
    .update(albums)
    .set({
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      totalReviews,
      mostLovedTrack,
      mostLovedTrackVotes,
    })
    .where(eq(albums.id, albumId));
}

/**
 * Get album stats
 */
export async function getAlbumStats(albumId: string) {
  const album = await db.select().from(albums).where(eq(albums.id, albumId)).limit(1);

  if (!album[0]) return null;

  return {
    avgRating: album[0].avgRating,
    totalReviews: album[0].totalReviews,
    mostLovedTrack: album[0].mostLovedTrack,
    mostLovedTrackVotes: album[0].mostLovedTrackVotes,
  };
}

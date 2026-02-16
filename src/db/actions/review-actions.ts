'use server';

import { db } from '@/neynar-db-sdk/db';
import { reviews, albums } from '@/db/schema';
import { eq, and, desc, sql, avg } from 'drizzle-orm';

/**
 * Submit a review for an album
 */
export async function submitReview(data: {
  albumId: string;
  fid: number;
  username: string;
  pfp: string | null;
  rating: number;
  text: string;
  favoriteTrack: string | null;
  hasListened: boolean;
}) {
  // Validate rating
  if (data.rating < 1 || data.rating > 5) {
    return { success: false, error: 'Rating must be 1-5' };
  }

  // Validate text length
  if (data.text.length < 50) {
    return { success: false, error: 'Review must be at least 50 characters' };
  }

  // Check if user already reviewed this album
  const existingReview = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.albumId, data.albumId), eq(reviews.reviewerFid, data.fid)))
    .limit(1);

  if (existingReview.length > 0) {
    return { success: false, error: 'You already reviewed this album' };
  }

  // Insert review
  const result = await db
    .insert(reviews)
    .values({
      albumId: data.albumId,
      reviewerFid: data.fid,
      reviewerUsername: data.username,
      reviewerPfp: data.pfp,
      rating: data.rating,
      reviewText: data.text,
      favoriteTrack: data.favoriteTrack,
      hasListened: data.hasListened,
    })
    .returning();

  // Update album stats
  await updateAlbumStats(data.albumId);

  return { success: true, review: result[0] };
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
    pfp: r.reviewerPfp || `https://api.dicebear.com/9.x/lorelei/svg?seed=${r.reviewerFid}`,
    rating: r.rating,
    text: r.reviewText,
    favoriteTrack: r.favoriteTrack,
    daysAgo: Math.floor((Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
  }));
}

/**
 * Check if user has reviewed an album
 */
export async function getUserReview(albumId: string, fid: number) {
  const result = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.albumId, albumId), eq(reviews.reviewerFid, fid)))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Update album stats (avg rating, total reviews, most loved track)
 */
async function updateAlbumStats(albumId: string) {
  // Calculate average rating
  const avgResult = await db
    .select({ avgRating: avg(reviews.rating) })
    .from(reviews)
    .where(eq(reviews.albumId, albumId));

  const avgRating = avgResult[0]?.avgRating ? Number(avgResult[0].avgRating) : null;

  // Count total reviews
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviews)
    .where(eq(reviews.albumId, albumId));

  const totalReviews = Number(countResult[0]?.count ?? 0);

  // Find most loved track
  const trackResult = await db
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
  await db
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

'use server';

import { db } from '@/neynar-db-sdk/db';
import { albums, votes, reviews } from '@/db/schema';
import { eq, and, desc, sql, min, avg } from 'drizzle-orm';

/**
 * Get complete profile data for a user by FID
 */
export async function getProfileByFid(fid: number) {
  const [submissions, userReviews, voteStats, memberSince] = await Promise.all([
    getSubmissionsByFid(fid),
    getReviewsByFid(fid),
    getVoteStatsForFid(fid),
    getMemberSince(fid),
  ]);

  return {
    fid,
    submissions,
    reviews: userReviews,
    stats: {
      totalSubmissions: submissions.length,
      totalWins: submissions.filter((s) => s.status === 'selected').length,
      totalReviews: userReviews.length,
      avgRatingGiven: userReviews.length > 0
        ? Math.round((userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length) * 10) / 10
        : null,
      totalVotesReceived: voteStats.totalVotesReceived,
    },
    memberSince,
  };
}

/**
 * Get all albums submitted by a user
 */
async function getSubmissionsByFid(fid: number) {
  const result = await db
    .select()
    .from(albums)
    .where(eq(albums.submittedByFid, fid))
    .orderBy(desc(albums.createdAt));

  // Get vote counts for each album
  const submissionsWithVotes = await Promise.all(
    result.map(async (album) => {
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
        status: album.status,
        votes: Number(voteCount[0]?.count ?? 0),
        avgRating: album.avgRating,
        totalReviews: album.totalReviews ?? 0,
        createdAt: album.createdAt,
      };
    })
  );

  return submissionsWithVotes;
}

/**
 * Get all reviews written by a user
 */
async function getReviewsByFid(fid: number) {
  // Get reviews with album info
  const result = await db
    .select({
      review: reviews,
      album: albums,
    })
    .from(reviews)
    .innerJoin(albums, eq(reviews.albumId, albums.id))
    .where(eq(reviews.reviewerFid, fid))
    .orderBy(desc(reviews.createdAt));

  return result.map((r) => ({
    id: r.review.id,
    rating: r.review.rating,
    text: r.review.reviewText,
    favoriteTrack: r.review.favoriteTrack,
    createdAt: r.review.createdAt,
    album: {
      id: r.album.id,
      title: r.album.title,
      artist: r.album.artist,
      coverUrl: r.album.coverUrl,
    },
  }));
}

/**
 * Get total votes received on all submissions by a user
 */
async function getVoteStatsForFid(fid: number) {
  // Get all album IDs submitted by this user
  const userAlbums = await db
    .select({ id: albums.id })
    .from(albums)
    .where(eq(albums.submittedByFid, fid));

  if (userAlbums.length === 0) {
    return { totalVotesReceived: 0 };
  }

  const albumIds = userAlbums.map((a) => a.id);

  // Count all votes on those albums
  const voteCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(votes)
    .where(sql`${votes.albumId} IN (${sql.join(albumIds.map(id => sql`${id}`), sql`, `)})`);

  return {
    totalVotesReceived: Number(voteCount[0]?.count ?? 0),
  };
}

/**
 * Get the earliest activity date for a user (member since)
 */
async function getMemberSince(fid: number) {
  const [earliestSubmission, earliestReview] = await Promise.all([
    db
      .select({ date: min(albums.createdAt) })
      .from(albums)
      .where(eq(albums.submittedByFid, fid)),
    db
      .select({ date: min(reviews.createdAt) })
      .from(reviews)
      .where(eq(reviews.reviewerFid, fid)),
  ]);

  const dates = [
    earliestSubmission[0]?.date,
    earliestReview[0]?.date,
  ].filter(Boolean) as Date[];

  if (dates.length === 0) return null;

  return new Date(Math.min(...dates.map((d) => d.getTime())));
}

/**
 * Get basic user info from their submissions/reviews (for viewing other profiles)
 */
export async function getUserInfoByFid(fid: number) {
  // Try to get username from submissions first
  const submission = await db
    .select({ username: albums.submittedByUsername })
    .from(albums)
    .where(eq(albums.submittedByFid, fid))
    .limit(1);

  if (submission[0]) {
    return { username: submission[0].username };
  }

  // Try reviews
  const review = await db
    .select({ username: reviews.reviewerUsername, pfp: reviews.reviewerPfp })
    .from(reviews)
    .where(eq(reviews.reviewerFid, fid))
    .limit(1);

  if (review[0]) {
    return { username: review[0].username, pfp: review[0].pfp };
  }

  return null;
}

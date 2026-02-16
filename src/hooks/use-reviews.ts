'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAlbumReviews, submitReview, getUserReview } from '@/db/actions/review-actions';

export interface ReviewData {
  id: string;
  fid: number;
  user: string;
  displayName: string;
  pfp: string;
  rating: number;
  text: string;
  favoriteTrack: string | null;
  daysAgo: number;
}

/**
 * Hook to get reviews for an album
 */
export function useReviews(albumId: string | null) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!albumId) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await getAlbumReviews(albumId);
      setReviews(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { reviews, isLoading, error, refresh };
}

/**
 * Hook to check if user has reviewed an album
 */
export function useUserReview(albumId: string | null, fid: number | null) {
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!albumId || !fid) {
      setIsLoading(false);
      return;
    }

    // Capture non-null values for the async function
    const currentAlbumId = albumId;
    const currentFid = fid;

    async function check() {
      const review = await getUserReview(currentAlbumId, currentFid);
      setHasReviewed(!!review);
      setIsLoading(false);
    }

    check();
  }, [albumId, fid]);

  return { hasReviewed, isLoading };
}

/**
 * Hook for submitting a review
 */
export function useSubmitReview() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (data: {
      albumId: string;
      fid: number;
      username: string;
      pfp: string | null;
      rating: number;
      text: string;
      favoriteTrack: string | null;
      hasListened: boolean;
    }) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const result = await submitReview(data);
        if (!result.success) {
          setError(result.error || 'Failed to submit review');
          return { success: false };
        }
        return { success: true, review: result.review };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to submit review';
        setError(message);
        return { success: false };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return { submit, isSubmitting, error };
}

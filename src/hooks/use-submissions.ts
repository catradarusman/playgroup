'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSubmissionsWithUserVotes,
  getUserSubmissionCount,
  submitAlbum,
  castVote,
} from '@/db/actions/submission-actions';

export interface SubmissionData {
  id: string;
  spotifyId: string;
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl: string;
  genres: string[];
  votes: number;
  submitterFid: number | null;
  submitter: string;
  daysAgo: number;
  hasVoted: boolean;
}

/**
 * Hook to get submissions with user's vote status
 * Supports both FID (legacy) and userId (new)
 */
export function useSubmissions(
  cycleId: string | null,
  userFid?: number | null,
  userId?: string | null
) {
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!cycleId) {
      setIsLoading(false);
      return;
    }

    try {
      // If user is logged in, get vote status too
      if (userId || userFid) {
        const data = await getSubmissionsWithUserVotes(cycleId, userFid ?? undefined, userId ?? undefined);
        setSubmissions(data);
      } else {
        // Not logged in - just get submissions without vote status
        const { getSubmissions } = await import('@/db/actions/submission-actions');
        const data = await getSubmissions(cycleId);
        setSubmissions(data.map(s => ({ ...s, hasVoted: false })));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  }, [cycleId, userFid, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { submissions, isLoading, error, refresh };
}

/**
 * Hook to get user's submission count
 * Supports both FID (legacy) and userId (new)
 */
export function useUserSubmissionCount(
  cycleId: string | null,
  fid?: number | null,
  userId?: string | null
) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ((!fid && !userId) || !cycleId) {
      setIsLoading(false);
      return;
    }

    const currentCycleId = cycleId;

    async function load() {
      const c = await getUserSubmissionCount(currentCycleId, fid ?? undefined, userId ?? undefined);
      setCount(c);
      setIsLoading(false);
    }

    load();
  }, [fid, userId, cycleId]);

  return { count, isLoading };
}

/**
 * Hook for submitting an album
 * Supports both FID (legacy) and userId (new)
 */
export function useSubmitAlbum() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (data: {
      spotifyId: string;
      title: string;
      artist: string;
      coverUrl: string;
      spotifyUrl: string;
      tracks?: string[];
      genres?: string[];
      cycleId: string;
      fid?: number;
      userId?: string;
      username: string;
    }) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const result = await submitAlbum(data);
        if (!result.success) {
          setError(result.error || 'Failed to submit');
          return { success: false };
        }
        return { success: true, album: result.album };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to submit';
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

/**
 * Hook for voting
 * Supports both FID (legacy) and userId (new)
 */
export function useVote() {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vote = useCallback(async (albumId: string, fid?: number, userId?: string) => {
    setIsVoting(true);
    setError(null);

    try {
      const result = await castVote(albumId, fid, userId);
      if (!result.success) {
        setError(result.error || 'Failed to vote');
        return false;
      }
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to vote';
      setError(message);
      return false;
    } finally {
      setIsVoting(false);
    }
  }, []);

  return { vote, isVoting, error };
}

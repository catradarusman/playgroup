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
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl: string;
  votes: number;
  submitter: string;
  daysAgo: number;
  hasVoted: boolean;
}

/**
 * Hook to get submissions with user's vote status
 */
export function useSubmissions(cycleId: string | null, userFid: number | null) {
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!cycleId || !userFid) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await getSubmissionsWithUserVotes(cycleId, userFid);
      setSubmissions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  }, [cycleId, userFid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { submissions, isLoading, error, refresh };
}

/**
 * Hook to get user's submission count
 */
export function useUserSubmissionCount(fid: number | null, cycleId: string | null) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!fid || !cycleId) {
      setIsLoading(false);
      return;
    }

    async function load() {
      const c = await getUserSubmissionCount(fid, cycleId);
      setCount(c);
      setIsLoading(false);
    }

    load();
  }, [fid, cycleId]);

  return { count, isLoading };
}

/**
 * Hook for submitting an album
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
      cycleId: string;
      fid: number;
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
 */
export function useVote() {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vote = useCallback(async (albumId: string, fid: number) => {
    setIsVoting(true);
    setError(null);

    try {
      const result = await castVote(albumId, fid);
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

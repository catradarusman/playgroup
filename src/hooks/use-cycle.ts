'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCycleWithCountdown, getCycleAlbum, getPastAlbums, getListenerCount, getOrCreateCurrentCycle } from '@/db/actions/cycle-actions';

export type CyclePhase = 'voting' | 'listening';

export interface CycleData {
  id: string;
  weekNumber: number;
  year: number;
  phase: CyclePhase;
  votingEndsAt: Date;
  endDate: Date;
  winnerId: string | null;
  countdown: {
    days: number;
    hours: number;
    minutes: number;
  };
}

export interface AlbumData {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl: string;
  avgRating: number | null;
  totalReviews: number | null;
  mostLovedTrack: string | null;
  mostLovedTrackVotes: number | null;
  weekNumber: number;
  submittedByUsername: string;
  tracks: string[] | null;
}

/**
 * Hook to get current cycle state with countdown
 */
export function useCycle() {
  const [cycle, setCycle] = useState<CycleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      // Ensure a cycle exists (creates one if needed)
      await getOrCreateCurrentCycle();

      const data = await getCycleWithCountdown();
      if (data) {
        setCycle({
          id: data.id,
          weekNumber: data.weekNumber,
          year: data.year,
          phase: data.phase as CyclePhase,
          votingEndsAt: data.votingEndsAt,
          endDate: data.endDate,
          winnerId: data.winnerId,
          countdown: data.countdown,
        });
      } else {
        setCycle(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load cycle');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Refresh countdown every minute
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { cycle, isLoading, error, refresh };
}

/**
 * Hook to get current album (winner of current or last cycle)
 */
export function useCurrentAlbum(cycleId: string | null) {
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cycleId) {
      setIsLoading(false);
      return;
    }

    const id = cycleId; // Capture for closure after null check

    async function load() {
      try {
        const data = await getCycleAlbum(id);
        if (data) {
          setAlbum({
            id: data.id,
            title: data.title,
            artist: data.artist,
            coverUrl: data.coverUrl,
            spotifyUrl: data.spotifyUrl,
            avgRating: data.avgRating,
            totalReviews: data.totalReviews,
            mostLovedTrack: data.mostLovedTrack,
            mostLovedTrackVotes: data.mostLovedTrackVotes,
            weekNumber: 0, // Will be filled by cycle
            submittedByUsername: data.submittedByUsername,
            tracks: data.tracks as string[] | null,
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load album');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [cycleId]);

  return { album, isLoading, error };
}

/**
 * Hook to get past albums for archive
 */
export function usePastAlbums(year?: number) {
  const [albums, setAlbums] = useState<AlbumData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPastAlbums(year);
        setAlbums(
          data.map((a) => ({
            id: a.id,
            title: a.title,
            artist: a.artist,
            coverUrl: a.coverUrl,
            spotifyUrl: a.spotifyUrl,
            avgRating: a.avgRating,
            totalReviews: a.totalReviews,
            mostLovedTrack: a.mostLovedTrack,
            mostLovedTrackVotes: a.mostLovedTrackVotes,
            weekNumber: a.weekNumber,
            submittedByUsername: a.submittedByUsername,
            tracks: null,
          }))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load albums');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [year]);

  return { albums, isLoading, error };
}

/**
 * Hook to get listener count
 */
export function useListenerCount(cycleId: string | null) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!cycleId) return;

    const id = cycleId; // Capture for closure after null check

    async function load() {
      const c = await getListenerCount(id);
      setCount(c);
    }

    load();
  }, [cycleId]);

  return count;
}

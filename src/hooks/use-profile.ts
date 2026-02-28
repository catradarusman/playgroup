'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getProfileByFid,
  getProfileByUserId,
  getUserInfoByFid,
  getUserInfoByUserId,
} from '@/db/actions/profile-actions';

export interface ProfileSubmission {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl: string;
  status: string;
  votes: number;
  avgRating: number | null;
  totalReviews: number;
  createdAt: Date;
}

export interface ProfileReview {
  id: string;
  rating: number;
  text: string;
  favoriteTrack: string | null;
  createdAt: Date;
  album: {
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
  };
}

export interface ProfileStats {
  totalSubmissions: number;
  totalWins: number;
  totalReviews: number;
  avgRatingGiven: number | null;
  totalVotesReceived: number;
}

export interface ProfileData {
  fid?: number;
  userId?: string;
  submissions: ProfileSubmission[];
  reviews: ProfileReview[];
  stats: ProfileStats;
  memberSince: Date | null;
}

/**
 * Hook to get profile data for a user.
 * Supports both Farcaster users (by fid) and Privy users (by userId).
 * fid takes priority when both are provided.
 */
export function useProfile(fid: number | null, userId?: string | null) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    // Need at least one identifier
    if (!fid && !userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let data: ProfileData | null = null;

      if (fid) {
        // Farcaster user — query by FID
        data = await getProfileByFid(fid);
      } else if (userId) {
        // Privy user — query by userId
        data = await getProfileByUserId(userId);
      }

      setProfile(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [fid, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, isLoading, error, refresh };
}

/**
 * Hook to get basic user info (username, pfp) for profile display.
 * Supports both Farcaster users (by fid) and Privy users (by userId).
 */
export function useUserInfo(fid: number | null, userId?: string | null) {
  const [userInfo, setUserInfo] = useState<{ username: string; pfp?: string; displayName?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!fid && !userId) {
      setIsLoading(false);
      return;
    }

    async function fetchInfo() {
      let info: { username: string; pfp?: string | null; displayName?: string } | null = null;

      if (fid) {
        info = await getUserInfoByFid(fid);
      } else if (userId) {
        info = await getUserInfoByUserId(userId);
      }

      setUserInfo(
        info
          ? { username: info.username, pfp: info.pfp ?? undefined, displayName: info.displayName }
          : null
      );
      setIsLoading(false);
    }

    fetchInfo();
  }, [fid, userId]);

  return { userInfo, isLoading };
}

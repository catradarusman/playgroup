'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProfileByFid, getUserInfoByFid } from '@/db/actions/profile-actions';

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
  fid: number;
  submissions: ProfileSubmission[];
  reviews: ProfileReview[];
  stats: ProfileStats;
  memberSince: Date | null;
}

/**
 * Hook to get profile data for a user
 */
export function useProfile(fid: number | null) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!fid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getProfileByFid(fid);
      setProfile(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, isLoading, error, refresh };
}

/**
 * Hook to get basic user info (username) by FID
 * Used when viewing other users' profiles
 */
export function useUserInfo(fid: number | null) {
  const [userInfo, setUserInfo] = useState<{ username: string; pfp?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!fid) {
      setIsLoading(false);
      return;
    }

    async function fetch() {
      const info = await getUserInfoByFid(fid);
      setUserInfo(info);
      setIsLoading(false);
    }

    fetch();
  }, [fid]);

  return { userInfo, isLoading };
}

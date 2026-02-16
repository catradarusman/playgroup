'use client';

import { useCastSearch } from '@/neynar-web-sdk/src/neynar/api-hooks/hooks/cast';

export interface BuzzCast {
  hash: string;
  text: string;
  author: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl?: string;
  };
  timestamp: string;
  reactions: {
    likes: number;
    recasts: number;
  };
}

export interface AlbumBuzzData {
  casts: BuzzCast[];
  count: number;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Hook to search Farcaster for casts mentioning an album
 * Returns cast count and list for Community Buzz section
 */
export function useAlbumBuzz(
  albumTitle: string | null,
  albumArtist: string | null,
  options?: { enabled?: boolean }
): AlbumBuzzData {
  // Build search query - search for album title + artist
  // Using quotes for exact phrase matching where possible
  const query = albumTitle && albumArtist
    ? `"${albumTitle}" "${albumArtist}"`
    : '';

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useCastSearch(
    query,
    {
      mode: 'hybrid', // Combines literal + semantic for best results
      sort_type: 'algorithmic', // Show most relevant/engaging casts first
      limit: 10,
    },
    {
      enabled: Boolean(query) && options?.enabled !== false,
    }
  );

  // Flatten paginated results
  const allCasts = data?.pages.flatMap(page => page.items) ?? [];

  // Map to our simplified interface
  const casts: BuzzCast[] = allCasts.map(cast => ({
    hash: cast.hash,
    text: cast.text,
    author: {
      fid: cast.author.fid,
      username: cast.author.username,
      displayName: cast.author.display_name ?? cast.author.username,
      pfpUrl: cast.author.pfp_url,
    },
    timestamp: cast.timestamp,
    reactions: {
      likes: cast.reactions?.likes_count ?? 0,
      recasts: cast.reactions?.recasts_count ?? 0,
    },
  }));

  return {
    casts,
    count: casts.length,
    isLoading,
    hasMore: hasNextPage ?? false,
    loadMore: fetchNextPage,
  };
}

'use server';

/**
 * Spotify API integration using Client Credentials flow
 * No user login required - uses app credentials to fetch public album data
 */

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { name: string }[];
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
  tracks: {
    items: { name: string; track_number: number }[];
  };
  release_date: string;
  total_tracks: number;
}

export interface AlbumMetadata {
  spotifyId: string;
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl: string;
  tracks: string[];
  releaseDate: string;
  totalTracks: number;
}

// Cache token in memory (server-side)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Failed to get Spotify token: ${response.status}`);
  }

  const data: SpotifyToken = await response.json();

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Extract Spotify album ID from various URL formats
 */
export function extractSpotifyAlbumId(url: string): string | null {
  // Handle various Spotify URL formats:
  // https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv
  // https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv?si=xxx
  // spotify:album:4LH4d3cOWNNsVw41Gqt2kv

  const patterns = [
    /spotify\.com\/album\/([a-zA-Z0-9]+)/,
    /spotify:album:([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetch album metadata from Spotify API
 */
export async function fetchAlbumMetadata(spotifyUrl: string): Promise<AlbumMetadata | null> {
  const albumId = extractSpotifyAlbumId(spotifyUrl);

  if (!albumId) {
    return null;
  }

  try {
    const token = await getAccessToken();

    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Album not found
      }
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const album: SpotifyAlbum = await response.json();

    // Get the best quality image (first is usually largest)
    const coverUrl = album.images[0]?.url || '';

    // Extract track names
    const tracks = album.tracks.items
      .sort((a, b) => a.track_number - b.track_number)
      .map((track) => track.name);

    // Combine all artists
    const artist = album.artists.map((a) => a.name).join(', ');

    return {
      spotifyId: album.id,
      title: album.name,
      artist,
      coverUrl,
      spotifyUrl: album.external_urls.spotify,
      tracks,
      releaseDate: album.release_date,
      totalTracks: album.total_tracks,
    };
  } catch (error) {
    console.error('Error fetching album from Spotify:', error);
    return null;
  }
}

/**
 * Check if Spotify API is configured
 */
export async function isSpotifyConfigured(): Promise<boolean> {
  return !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

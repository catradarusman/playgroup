/**
 * Deezer API integration - No authentication required!
 * Used to fetch album metadata when user pastes a Spotify link
 */

interface DeezerAlbum {
  id: number;
  title: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  artist: {
    name: string;
  };
  tracks: {
    data: { title: string; track_position: number }[];
  };
  nb_tracks: number;
  release_date: string;
}

interface DeezerSearchResult {
  data: {
    id: number;
    title: string;
    cover_medium: string;
    cover_big: string;
    artist: {
      name: string;
    };
    nb_tracks: number;
  }[];
}

export interface AlbumMetadata {
  title: string;
  artist: string;
  coverUrl: string;
  tracks: string[];
  trackCount: number;
  releaseDate: string | null;
  deezerId: number;
}

/**
 * Search for an album on Deezer by title and artist
 */
export async function searchAlbum(query: string): Promise<AlbumMetadata | null> {
  try {
    const response = await fetch(
      `https://api.deezer.com/search/album?q=${encodeURIComponent(query)}&limit=1`
    );

    if (!response.ok) {
      console.error('Deezer search failed:', response.status);
      return null;
    }

    const data: DeezerSearchResult = await response.json();

    if (!data.data || data.data.length === 0) {
      return null;
    }

    const album = data.data[0];

    // Fetch full album details to get tracks
    const fullAlbum = await getAlbumById(album.id);
    if (fullAlbum) {
      return fullAlbum;
    }

    // Fallback if full fetch fails
    return {
      title: album.title,
      artist: album.artist.name,
      coverUrl: album.cover_big || album.cover_medium,
      tracks: [],
      trackCount: album.nb_tracks,
      releaseDate: null,
      deezerId: album.id,
    };
  } catch (error) {
    console.error('Error searching Deezer:', error);
    return null;
  }
}

/**
 * Get album details by Deezer ID
 */
export async function getAlbumById(deezerId: number): Promise<AlbumMetadata | null> {
  try {
    const response = await fetch(`https://api.deezer.com/album/${deezerId}`);

    if (!response.ok) {
      console.error('Deezer album fetch failed:', response.status);
      return null;
    }

    const album: DeezerAlbum = await response.json();

    // Extract track names
    const tracks = album.tracks?.data
      ?.sort((a, b) => a.track_position - b.track_position)
      .map((t) => t.title) || [];

    return {
      title: album.title,
      artist: album.artist.name,
      coverUrl: album.cover_xl || album.cover_big || album.cover_medium,
      tracks,
      trackCount: album.nb_tracks,
      releaseDate: album.release_date || null,
      deezerId: album.id,
    };
  } catch (error) {
    console.error('Error fetching Deezer album:', error);
    return null;
  }
}

/**
 * Search for album metadata using title and artist from Spotify link
 * This is our main entry point - user pastes Spotify link, we search Deezer
 */
export async function fetchAlbumMetadata(
  title: string,
  artist: string
): Promise<AlbumMetadata | null> {
  // Try exact search first
  const exactQuery = `${artist} ${title}`;
  let result = await searchAlbum(exactQuery);

  if (result) {
    return result;
  }

  // Try just title if exact search fails
  result = await searchAlbum(title);

  return result;
}

import { NextRequest, NextResponse } from 'next/server';
import { fetchAlbumMetadata, isSpotifyConfigured } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  // Check if Spotify is configured
  const configured = await isSpotifyConfigured();
  if (!configured) {
    return NextResponse.json(
      { error: 'Spotify API not configured', configured: false },
      { status: 503 }
    );
  }

  try {
    const metadata = await fetchAlbumMetadata(url);

    if (!metadata) {
      return NextResponse.json(
        { error: 'Album not found or invalid Spotify URL' },
        { status: 404 }
      );
    }

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album data' },
      { status: 500 }
    );
  }
}

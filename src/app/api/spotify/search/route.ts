import { NextRequest, NextResponse } from 'next/server';
import { searchAlbum, isSpotifyConfigured } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json(
      { error: 'Missing q parameter' },
      { status: 400 }
    );
  }

  const configured = await isSpotifyConfigured();
  if (!configured) {
    return NextResponse.json(
      { error: 'Spotify API not configured', configured: false },
      { status: 503 }
    );
  }

  try {
    const metadata = await searchAlbum(q);

    if (!metadata) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error searching album:', error);
    return NextResponse.json(
      { error: 'Failed to search album' },
      { status: 500 }
    );
  }
}

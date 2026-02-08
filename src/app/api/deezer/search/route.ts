import { NextRequest, NextResponse } from 'next/server';
import { searchAlbum } from '@/lib/deezer';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter' },
      { status: 400 }
    );
  }

  try {
    const metadata = await searchAlbum(query);

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

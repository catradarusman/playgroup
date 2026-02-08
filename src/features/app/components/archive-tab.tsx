'use client';

import { useState } from 'react';
import { Card, CardContent, H3, P, Button } from '@neynar/ui';
import { MOCK_CYCLE_STATE, MOCK_PAST_ALBUMS, MOCK_REVIEWS, MOCK_ALBUM_TRACKS } from '@/data/mocks';
import type { PastAlbum } from '@/features/app/types';
import { AlbumDetailView } from './album-detail-view';

export function ArchiveTab() {
  const [selectedAlbum, setSelectedAlbum] = useState<PastAlbum | null>(null);
  const albumsThisYear = MOCK_PAST_ALBUMS.length;
  const albumsRemaining = 26 - albumsThisYear;
  const totalReviews = MOCK_PAST_ALBUMS.reduce((sum, a) => sum + a.reviews, 0);
  const avgRating = (MOCK_PAST_ALBUMS.reduce((sum, a) => sum + a.avgRating, 0) / albumsThisYear).toFixed(1);

  if (selectedAlbum) {
    return (
      <AlbumDetailView
        album={{
          ...MOCK_CYCLE_STATE.currentAlbum,
          id: selectedAlbum.id,
          title: selectedAlbum.title,
          artist: selectedAlbum.artist,
          weekNumber: selectedAlbum.weekNumber,
          avgRating: selectedAlbum.avgRating,
          totalReviews: selectedAlbum.reviews,
        }}
        reviews={MOCK_REVIEWS}
        tracks={MOCK_ALBUM_TRACKS}
        onBack={() => setSelectedAlbum(null)}
        canReview={false}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <H3>The 26</H3>
            <P className="text-sm text-gray-400 mt-1">Albums selected by our community</P>
          </div>
        </CardContent>
      </Card>

      {/* Visual Progress */}
      <Card>
        <CardContent className="p-4">
          <P className="text-center text-sm font-medium text-white mb-3">2025 Journey</P>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {Array.from({ length: 26 }).map((_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-sm cursor-pointer transition-transform hover:scale-110 ${
                  i < albumsThisYear ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-800'
                }`}
                onClick={() => i < albumsThisYear && setSelectedAlbum(MOCK_PAST_ALBUMS[i])}
                title={i < albumsThisYear ? MOCK_PAST_ALBUMS[i]?.title : `Week ${i + 1}`}
              />
            ))}
          </div>
          <P className="text-xs text-center mt-3 text-gray-500">
            {albumsThisYear} down • {albumsRemaining} to go
          </P>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <P className="text-2xl font-bold text-white">{albumsThisYear}</P>
              <P className="text-xs text-gray-500">Albums</P>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <P className="text-2xl font-bold text-white">{totalReviews}</P>
              <P className="text-xs text-gray-500">Reviews</P>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <P className="text-2xl font-bold text-white">{avgRating}</P>
              <P className="text-xs text-gray-500">Avg</P>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Past Albums List */}
      <div className="space-y-2">
        {MOCK_PAST_ALBUMS.map((album) => (
          <Card key={album.id}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedAlbum(album)}>
                <div className="text-xs font-bold text-gray-600 w-8">W{album.weekNumber}</div>
                <div className="w-14 h-14 rounded bg-gradient-to-br from-gray-700 to-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <P className="font-medium text-white">{album.title}</P>
                  <P className="text-sm text-gray-400">{album.artist}</P>
                </div>
                <div className="text-right">
                  <P className="font-bold text-lg text-white">{album.avgRating}</P>
                  <P className="text-xs text-gray-500">{album.reviews} reviews</P>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Share */}
      <Button variant="secondary" className="w-full">
        Share Our Journey
      </Button>
    </div>
  );
}

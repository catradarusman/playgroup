'use client';

import { useState } from 'react';
import { Card, CardContent, H3, P, Button, Skeleton } from '@neynar/ui';
import { ShareButton } from '@/neynar-farcaster-sdk/mini';
import { usePastAlbums } from '@/hooks/use-cycle';
import { useReviews } from '@/hooks/use-reviews';
import { AlbumDetailView } from './album-detail-view';

export function ArchiveTab() {
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  // Get past albums from database
  const { albums, isLoading } = usePastAlbums(new Date().getFullYear());

  // Get reviews for selected album
  const { reviews } = useReviews(selectedAlbumId);

  const albumsThisYear = albums.length;
  const albumsRemaining = 26 - albumsThisYear;
  const totalReviews = albums.reduce((sum, a) => sum + (a.totalReviews ?? 0), 0);
  const avgRating = albumsThisYear > 0
    ? (albums.reduce((sum, a) => sum + (a.avgRating ?? 0), 0) / albumsThisYear).toFixed(1)
    : '0';

  // Find selected album
  const selectedAlbum = selectedAlbumId
    ? albums.find(a => a.id === selectedAlbumId) ?? null
    : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (selectedAlbum) {
    return (
      <AlbumDetailView
        album={{
          id: selectedAlbum.id,
          title: selectedAlbum.title,
          artist: selectedAlbum.artist,
          coverUrl: selectedAlbum.coverUrl,
          spotifyUrl: selectedAlbum.spotifyUrl,
          avgRating: selectedAlbum.avgRating,
          totalReviews: selectedAlbum.totalReviews,
          mostLovedTrack: selectedAlbum.mostLovedTrack,
          mostLovedTrackVotes: selectedAlbum.mostLovedTrackVotes,
          weekNumber: selectedAlbum.weekNumber,
          submittedBy: selectedAlbum.submittedByUsername,
        }}
        reviews={reviews}
        tracks={selectedAlbum.tracks ?? []}
        onBack={() => setSelectedAlbumId(null)}
        canReview={true}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <H3>Selected Album</H3>
            <P className="text-sm text-gray-400 mt-1">Voted by our community</P>
          </div>
        </CardContent>
      </Card>

      {/* Visual Progress */}
      <Card>
        <CardContent className="p-4">
          <P className="text-center text-sm font-medium text-white mb-3">{new Date().getFullYear()} Journey</P>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {Array.from({ length: 26 }).map((_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-sm cursor-pointer transition-transform hover:scale-110 ${
                  i < albumsThisYear ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-800'
                }`}
                onClick={() => i < albumsThisYear && setSelectedAlbumId(albums[i]?.id ?? null)}
                title={i < albumsThisYear ? albums[i]?.title : `Week ${i + 1}`}
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
        {albums.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-4">
                <P className="text-3xl mb-2">🎵</P>
                <P className="text-gray-400">No albums yet</P>
                <P className="text-sm text-gray-500">Your listening journey begins soon!</P>
              </div>
            </CardContent>
          </Card>
        ) : (
          albums.map((album) => (
            <Card key={album.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedAlbumId(album.id)}>
                  <div className="text-xs font-bold text-gray-600 w-8">W{album.weekNumber}</div>
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-14 h-14 rounded flex-shrink-0 object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded bg-gradient-to-br from-gray-700 to-gray-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <P className="font-medium text-white">{album.title}</P>
                    <P className="text-sm text-gray-400">{album.artist}</P>
                  </div>
                  <div className="text-right">
                    <P className="font-bold text-lg text-white">{album.avgRating ?? '-'}</P>
                    <P className="text-xs text-gray-500">{album.totalReviews ?? 0} reviews</P>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Share */}
      <ShareButton
        variant="secondary"
        className="w-full"
        text={`Our Playgroup ${new Date().getFullYear()} journey: ${albumsThisYear}/26 albums discovered, ${totalReviews} reviews written, ${avgRating}/5 avg rating! Join us in exploring great music together.`}
        queryParams={{
          shareType: 'journey',
          year: new Date().getFullYear().toString(),
          albumsCompleted: albumsThisYear.toString(),
          totalReviews: totalReviews.toString(),
          avgRating: avgRating,
        }}
      >
        Share Our Journey
      </ShareButton>
    </div>
  );
}

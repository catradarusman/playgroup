'use client';

import { useState } from 'react';
import { Card, CardContent, H2, P, Button, Skeleton } from '@neynar/ui';
import { useFarcasterUser, ShareButton } from '@/neynar-farcaster-sdk/mini';
import { useCycle, useCurrentAlbum, useListenerCount } from '@/hooks/use-cycle';
import { useReviews } from '@/hooks/use-reviews';
import { CycleStatusBanner } from './cycle-status-banner';
import { HowItWorks } from './how-it-works';
import { AlbumDetailView } from './album-detail-view';

export function NowPlayingTab() {
  const [view, setView] = useState<'main' | 'detail'>('main');

  // Real data hooks
  const { data: user } = useFarcasterUser();
  const { cycle, isLoading: cycleLoading } = useCycle();
  const { album: currentAlbum, isLoading: albumLoading } = useCurrentAlbum(cycle?.id ?? null);
  const listenersCount = useListenerCount(cycle?.id ?? null);
  const { reviews } = useReviews(currentAlbum?.id ?? null);

  const phase = cycle?.phase ?? 'voting';
  const countdown = cycle?.countdown ?? { days: 0, hours: 0, minutes: 0 };

  const isLoading = cycleLoading || albumLoading;

  if (view === 'detail' && currentAlbum) {
    return (
      <AlbumDetailView
        album={{
          id: currentAlbum.id,
          title: currentAlbum.title,
          artist: currentAlbum.artist,
          coverUrl: currentAlbum.coverUrl,
          spotifyUrl: currentAlbum.spotifyUrl,
          avgRating: currentAlbum.avgRating,
          totalReviews: currentAlbum.totalReviews,
          mostLovedTrack: currentAlbum.mostLovedTrack,
          mostLovedTrackVotes: currentAlbum.mostLovedTrackVotes,
          weekNumber: currentAlbum.weekNumber,
          submittedBy: currentAlbum.submittedByUsername,
        }}
        reviews={reviews}
        tracks={currentAlbum.tracks ?? []}
        onBack={() => setView('main')}
        canReview={phase === 'listening'}
        userFid={user?.fid ?? null}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // No album selected yet - show empty state
  if (!currentAlbum) {
    return (
      <div className="space-y-4">
        <CycleStatusBanner phase={phase} countdown={countdown} />
        <HowItWorks />
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <P className="text-xs uppercase tracking-widest text-gray-500">
                {phase === 'voting' ? 'Voting in Progress' : 'Waiting for Winner'}
              </P>
              <div
                className="w-44 h-44 rounded-lg shadow-xl flex items-center justify-center bg-gray-800 border border-gray-700"
              >
                <P className="text-6xl">🎵</P>
              </div>
              <div>
                <H2>No Album Yet</H2>
                <P className="text-gray-400">
                  {phase === 'voting'
                    ? 'Vote for your favorite to decide our next listen!'
                    : 'The winning album will appear here soon.'}
                </P>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cycle Status */}
      <CycleStatusBanner phase={phase} countdown={countdown} />

      {/* How It Works - for new users */}
      <HowItWorks />

      {/* Current/Last Album */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <P className="text-xs uppercase tracking-widest text-gray-500">
              {phase === 'listening' ? 'Now Listening' : "Last Week's Winner"}
            </P>
            <P className="text-xs text-gray-600">
              Week {currentAlbum.weekNumber} of 26
            </P>
            {currentAlbum.coverUrl ? (
              <img
                src={currentAlbum.coverUrl}
                alt={currentAlbum.title}
                className="w-44 h-44 rounded-lg shadow-xl cursor-pointer hover:scale-105 transition-transform object-cover"
                onClick={() => setView('detail')}
              />
            ) : (
              <div
                className="w-44 h-44 rounded-lg shadow-xl cursor-pointer hover:scale-105 transition-transform bg-gray-800 border border-gray-700"
                onClick={() => setView('detail')}
              />
            )}
            <div>
              <H2>{currentAlbum.title}</H2>
              <P className="text-gray-400">{currentAlbum.artist}</P>
            </div>

            {phase === 'listening' && (
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <P className="font-bold text-lg text-white">{listenersCount}</P>
                  <P className="text-xs text-gray-500">listening</P>
                </div>
                <div className="text-center">
                  <P className="font-bold text-lg text-white">{currentAlbum.totalReviews ?? 0}</P>
                  <P className="text-xs text-gray-500">reviews</P>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  window.open(currentAlbum.spotifyUrl, '_blank');
                }}
              >
                ▶ Open in Spotify
              </Button>
              <Button variant="outline" onClick={() => setView('detail')}>
                See Reviews
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share */}
      <ShareButton
        variant="secondary"
        className="w-full"
        text={`🎵 Now listening to "${currentAlbum.title}" by ${currentAlbum.artist} on Playgroup! Week ${currentAlbum.weekNumber} of our 26-album journey.`}
        queryParams={{
          shareType: 'album',
          albumTitle: currentAlbum.title,
          artist: currentAlbum.artist,
          weekNumber: currentAlbum.weekNumber.toString(),
          listeners: listenersCount.toString(),
        }}
      >
        Share
      </ShareButton>
    </div>
  );
}

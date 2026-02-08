'use client';

import { useState } from 'react';
import { Card, CardContent, H2, P, Button, Skeleton } from '@neynar/ui';
import { useFarcasterUser, ShareButton } from '@/neynar-farcaster-sdk/mini';
import { useCycle, useCurrentAlbum, useListenerCount } from '@/hooks/use-cycle';
import { useReviews } from '@/hooks/use-reviews';
import { MOCK_CYCLE_STATE, MOCK_REVIEWS, MOCK_ALBUM_TRACKS } from '@/data/mocks';
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
  const { reviews: realReviews } = useReviews(currentAlbum?.id ?? null);

  // Use real data if available, fallback to mock
  const phase = cycle?.phase ?? MOCK_CYCLE_STATE.phase;
  const countdown = cycle?.countdown ?? {
    days: MOCK_CYCLE_STATE.daysLeftInPhase,
    hours: MOCK_CYCLE_STATE.hoursLeft,
    minutes: MOCK_CYCLE_STATE.minutesLeft,
  };

  const displayAlbum = currentAlbum ?? MOCK_CYCLE_STATE.currentAlbum;
  const displayReviews = realReviews.length > 0 ? realReviews : MOCK_REVIEWS;
  const displayListeners = listenersCount || MOCK_CYCLE_STATE.listenersCount;

  const isLoading = cycleLoading || albumLoading;

  if (view === 'detail') {
    return (
      <AlbumDetailView
        album={{
          ...displayAlbum,
          weekNumber: currentAlbum?.weekNumber ?? MOCK_CYCLE_STATE.currentAlbum.weekNumber,
          submittedBy: currentAlbum?.submittedByUsername ?? MOCK_CYCLE_STATE.currentAlbum.submittedBy,
        }}
        reviews={displayReviews}
        tracks={currentAlbum?.tracks ?? MOCK_ALBUM_TRACKS}
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
              Week {currentAlbum?.weekNumber ?? MOCK_CYCLE_STATE.currentAlbum.weekNumber} of 26
            </P>
            {displayAlbum.coverUrl ? (
              <img
                src={displayAlbum.coverUrl}
                alt={displayAlbum.title}
                className="w-44 h-44 rounded-lg shadow-xl cursor-pointer hover:scale-105 transition-transform object-cover"
                onClick={() => setView('detail')}
              />
            ) : (
              <div
                className="w-44 h-44 rounded-lg shadow-xl cursor-pointer hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                onClick={() => setView('detail')}
              />
            )}
            <div>
              <H2>{displayAlbum.title}</H2>
              <P className="text-gray-400">{displayAlbum.artist}</P>
            </div>

            {phase === 'listening' && (
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <P className="font-bold text-lg text-white">{displayListeners}</P>
                  <P className="text-xs text-gray-500">listening</P>
                </div>
                <div className="text-center">
                  <P className="font-bold text-lg text-white">
                    {currentAlbum?.totalReviews ?? MOCK_CYCLE_STATE.currentAlbum.totalReviews}
                  </P>
                  <P className="text-xs text-gray-500">reviews</P>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  window.open(displayAlbum.spotifyUrl, '_blank');
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
        text={`🎵 Now listening to "${displayAlbum.title}" by ${displayAlbum.artist} on Playgroup! Week ${currentAlbum?.weekNumber ?? MOCK_CYCLE_STATE.currentAlbum.weekNumber} of our 26-album journey.`}
        queryParams={{
          shareType: 'album',
          albumTitle: displayAlbum.title,
          artist: displayAlbum.artist,
          weekNumber: (currentAlbum?.weekNumber ?? MOCK_CYCLE_STATE.currentAlbum.weekNumber).toString(),
          listeners: displayListeners.toString(),
        }}
      >
        Share
      </ShareButton>
    </div>
  );
}

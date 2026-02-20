'use client';

import { useState } from 'react';
import { Card, CardContent, H2, P, Button, Skeleton } from '@neynar/ui';
import { ShareButton } from '@/neynar-farcaster-sdk/mini';
import { useAuth } from '@/hooks/use-auth';
import { useCycle, useCurrentAlbum } from '@/hooks/use-cycle';
import { useReviews } from '@/hooks/use-reviews';
import { useAlbumBuzz } from '@/hooks/use-album-buzz';
import { CycleStatusBanner } from './cycle-status-banner';
import { HowItWorks } from './how-it-works';
import { AlbumDetailView } from './album-detail-view';
import { AlbumBuzzSection } from './album-buzz-section';

interface NowPlayingTabProps {
  onViewProfile?: (fid: number) => void;
}

export function NowPlayingTab({ onViewProfile }: NowPlayingTabProps) {
  const [view, setView] = useState<'main' | 'detail'>('main');

  // Unified auth - supports both Farcaster and Privy users
  const { user } = useAuth();

  // Real data hooks
  const { cycle, isLoading: cycleLoading } = useCycle();
  const { album: currentAlbum, isLoading: albumLoading } = useCurrentAlbum(cycle?.id ?? null);
  const { reviews } = useReviews(currentAlbum?.id ?? null);

  // Farcaster buzz - replaces hardcoded listener count with real cast mentions
  const { count: buzzCount, isLoading: buzzLoading } = useAlbumBuzz(
    currentAlbum?.title ?? null,
    currentAlbum?.artist ?? null,
    { enabled: !!currentAlbum }
  );

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
        userId={user?.id ?? null}
        username={user?.username}
        pfpUrl={user?.pfpUrl}
        onViewProfile={onViewProfile}
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
                <P className="text-5xl font-light text-gray-600">♪</P>
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
              Week {currentAlbum.weekNumber} of 52
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
              <P className="text-xs text-gray-600 mt-1">
                submitted by{' '}
                <button
                  onClick={() => currentAlbum.submittedByFid && onViewProfile?.(currentAlbum.submittedByFid)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  @{currentAlbum.submittedByUsername}
                </button>
              </P>
            </div>

            {phase === 'listening' && (
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <P className="font-bold text-lg text-white">
                    {buzzLoading ? '...' : buzzCount}
                  </P>
                  <P className="text-xs text-gray-500">casts</P>
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
                PLAY ON SPOTIFY
              </Button>
              <Button variant="outline" onClick={() => setView('detail')}>
                See Reviews
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Buzz - Farcaster casts mentioning this album */}
      {phase === 'listening' && (
        <AlbumBuzzSection
          albumTitle={currentAlbum.title}
          albumArtist={currentAlbum.artist}
          onViewProfile={onViewProfile}
        />
      )}

      {/* Share */}
      <ShareButton
        variant="secondary"
        className="w-full"
        text={`Now listening to "${currentAlbum.title}" by ${currentAlbum.artist} on Playgroup. Week ${currentAlbum.weekNumber} of our 52-album journey.`}
        queryParams={{
          shareType: 'album',
          albumTitle: currentAlbum.title,
          artist: currentAlbum.artist,
          weekNumber: currentAlbum.weekNumber.toString(),
          casts: buzzCount.toString(),
        }}
      >
        Share
      </ShareButton>
    </div>
  );
}

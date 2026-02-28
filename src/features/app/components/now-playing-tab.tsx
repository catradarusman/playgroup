'use client';

import { useState } from 'react';
import { Card, CardContent, H2, P, Button, Skeleton } from '@neynar/ui';
import { ShareButton } from '@/neynar-farcaster-sdk/mini';
import { useAuth } from '@/hooks/use-auth';
import { useCycle, useCurrentAlbum } from '@/hooks/use-cycle';
import { useReviews } from '@/hooks/use-reviews';
import { CycleStatusBanner } from './cycle-status-banner';
import { HowItWorks } from './how-it-works';
import { AlbumDetailView } from './album-detail-view';

interface NowPlayingTabProps {
  onViewProfile?: (fid: number) => void;
}

function GenrePills({ genres }: { genres: string[] }) {
  if (!genres.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-1 mt-1">
      {genres.slice(0, 3).map((g) => (
        <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
          {g}
        </span>
      ))}
    </div>
  );
}

export function NowPlayingTab({ onViewProfile }: NowPlayingTabProps) {
  const [view, setView] = useState<'main' | 'detail'>('main');

  // Unified auth - supports both Farcaster and Privy users
  const { user } = useAuth();

  // Real data hooks
  const { cycle, isLoading: cycleLoading } = useCycle();
  const { album: currentAlbum, isLoading: albumLoading } = useCurrentAlbum(cycle?.id ?? null);
  const { reviews } = useReviews(currentAlbum?.id ?? null);

  const phase = cycle?.phase ?? 'voting';
  const countdown = cycle?.countdown ?? { days: 0, hours: 0, minutes: 0 };

  const isLoading = cycleLoading || albumLoading;

  if (view === 'detail' && currentAlbum) {
    return (
      <AlbumDetailView
        album={{
          id: currentAlbum.id,
          spotifyId: currentAlbum.spotifyId,
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
          genres: currentAlbum.genres,
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
              <GenrePills genres={currentAlbum.genres ?? []} />
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

            {/* Spotify embed player — shown during listening phase */}
            {phase === 'listening' && currentAlbum.spotifyId && (
              <div className="w-full">
                <iframe
                  src={`https://open.spotify.com/embed/album/${currentAlbum.spotifyId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="152"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ borderRadius: '12px', border: 'none' }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
        }}
      >
        Share
      </ShareButton>
    </div>
  );
}

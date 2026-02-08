'use client';

import { useState } from 'react';
import { Card, CardContent, H2, P, Button } from '@neynar/ui';
import { MOCK_CYCLE_STATE, MOCK_REVIEWS, MOCK_ALBUM_TRACKS } from '@/data/mocks';
import { CycleStatusBanner } from './cycle-status-banner';
import { HowItWorks } from './how-it-works';
import { AlbumDetailView } from './album-detail-view';

export function NowPlayingTab() {
  const [view, setView] = useState<'main' | 'detail'>('main');
  const { currentAlbum, phase, daysLeftInPhase, hoursLeft, minutesLeft, listenersCount } = MOCK_CYCLE_STATE;

  if (view === 'detail') {
    return (
      <AlbumDetailView
        album={currentAlbum}
        reviews={MOCK_REVIEWS}
        tracks={MOCK_ALBUM_TRACKS}
        onBack={() => setView('main')}
        canReview={phase === 'listening'}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Cycle Status */}
      <CycleStatusBanner
        phase={phase}
        countdown={{ days: daysLeftInPhase, hours: hoursLeft, minutes: minutesLeft }}
      />

      {/* How It Works - for new users */}
      <HowItWorks />

      {/* Current/Last Album */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <P className="text-xs uppercase tracking-widest text-gray-500">
              {phase === 'listening' ? 'Now Listening' : "Last Week's Winner"}
            </P>
            <P className="text-xs text-gray-600">Week {currentAlbum.weekNumber} of 26</P>
            <div
              className="w-44 h-44 rounded-lg shadow-xl cursor-pointer hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              onClick={() => setView('detail')}
            />
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
                  <P className="font-bold text-lg text-white">{currentAlbum.totalReviews}</P>
                  <P className="text-xs text-gray-500">reviews</P>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button>▶ Open in Spotify</Button>
              <Button variant="outline" onClick={() => setView('detail')}>
                See Reviews
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share */}
      <Button variant="secondary" className="w-full">
        Share
      </Button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  SketchMiniLayout,
  SketchButton,
  SketchCard,
  SketchHeading,
  SketchInput,
  SketchTextarea,
} from '@/components/sketch';

// ============================================
// MOCK DATA
// ============================================

// Simulating voting phase (Wednesday during voting week)
const mockCycleState = {
  phase: 'voting' as 'voting' | 'listening',
  currentAlbum: {
    id: 4,
    title: 'OK Computer',
    artist: 'Radiohead',
    coverUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=okcomputer&backgroundColor=1a1a2e',
    spotifyUrl: 'https://open.spotify.com/album/...',
    weekNumber: 12,
    avgRating: 4.2,
    totalReviews: 14,
    mostLovedTrack: 'Paranoid Android',
    mostLovedTrackVotes: 7,
    submittedBy: 'jordan_curator',
  },
  daysLeftInPhase: 2,
  hoursLeft: 14,
  minutesLeft: 23,
  listenersCount: 47,
  votingEndsAt: 'Friday 10pm WIB',
  userSubmissionsThisCycle: 1,
  maxSubmissionsPerCycle: 3,
};

const mockSubmissions = [
  { id: 1, title: 'Titanic Rising', artist: 'Weyes Blood', votes: 42, submitter: 'alice', hasVoted: false, daysAgo: 2 },
  { id: 2, title: 'Vespertine', artist: 'Björk', votes: 38, submitter: 'bob', hasVoted: true, daysAgo: 1 },
  { id: 3, title: 'Dummy', artist: 'Portishead', votes: 31, submitter: 'carol', hasVoted: false, daysAgo: 3 },
  { id: 4, title: 'Blonde', artist: 'Frank Ocean', votes: 27, submitter: 'dan', hasVoted: false, daysAgo: 1 },
];

const mockReviews = [
  {
    id: 1,
    user: 'alex_musichead',
    displayName: 'Alex',
    pfp: 'https://api.dicebear.com/9.x/lorelei/svg?seed=alex',
    rating: 4,
    text: 'This album still sounds futuristic 25 years later. The production on Paranoid Android is insane...',
    favoriteTrack: 'Paranoid Android',
    daysAgo: 2,
  },
  {
    id: 2,
    user: 'jordan_curator',
    displayName: 'Jordan',
    pfp: 'https://api.dicebear.com/9.x/lorelei/svg?seed=jordan',
    rating: 5,
    text: 'Radiohead\'s masterpiece. Every track flows perfectly. The themes of technology anxiety feel more relevant now than in 1997...',
    favoriteTrack: 'Let Down',
    daysAgo: 1,
  },
  {
    id: 3,
    user: 'vinyllover',
    displayName: 'Vinyl Lover',
    pfp: 'https://api.dicebear.com/9.x/lorelei/svg?seed=vinyl',
    rating: 3,
    text: 'Gorgeous textures throughout. Not my favorite Radiohead but I get why it\'s a classic.',
    favoriteTrack: 'No Surprises',
    daysAgo: 3,
  },
];

const mockPastAlbums = [
  { id: 1, title: 'Loveless', artist: 'My Bloody Valentine', avgRating: 4.4, reviews: 23, weekNumber: 11 },
  { id: 2, title: 'Remain in Light', artist: 'Talking Heads', avgRating: 4.6, reviews: 31, weekNumber: 10 },
  { id: 3, title: 'Homogenic', artist: 'Björk', avgRating: 4.2, reviews: 19, weekNumber: 9 },
  { id: 4, title: 'Kind of Blue', artist: 'Miles Davis', avgRating: 4.7, reviews: 28, weekNumber: 8 },
  { id: 5, title: 'The Epic', artist: 'Kamasi Washington', avgRating: 4.1, reviews: 15, weekNumber: 7 },
];

const mockAlbumTracks = [
  'Airbag', 'Paranoid Android', 'Subterranean Homesick Alien', 'Exit Music (For a Film)',
  'Let Down', 'Karma Police', 'Fitter Happier', 'Electioneering',
  'Climbing Up the Walls', 'No Surprises', 'Lucky', 'The Tourist'
];

// ============================================
// COMPONENTS
// ============================================

function CycleStatusBanner({ phase, countdown }: {
  phase: 'voting' | 'listening',
  countdown: { days: number, hours: number, minutes: number }
}) {
  const statusConfig = {
    voting: {
      label: '🗳️ Voting Open',
      color: 'from-amber-500 to-orange-500',
    },
    listening: {
      label: '🎧 Listening Week',
      color: 'from-purple-500 to-pink-500',
    },
  };

  const config = statusConfig[phase];
  const countdownText = `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`;

  return (
    <div className={`bg-gradient-to-r ${config.color} rounded-lg p-3 text-white text-center`}>
      <p className="font-bold">{config.label}</p>
      <p className="text-sm opacity-90">
        {phase === 'voting' ? `Closes in ${countdownText}` : `${countdownText} left to listen`}
      </p>
    </div>
  );
}

function HowItWorks() {
  return (
    <SketchCard padding="md">
      <SketchHeading level={4}>How It Works</SketchHeading>
      <div className="mt-3 space-y-3">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
          <div>
            <p className="font-medium text-sm">Submit & Vote</p>
            <p className="sketch-text text-xs opacity-60">Mon–Fri: Share Spotify albums, upvote favorites</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
          <div>
            <p className="font-medium text-sm">Listen Together</p>
            <p className="sketch-text text-xs opacity-60">Sat–Fri: Winner announced, everyone listens</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
          <div>
            <p className="font-medium text-sm">Review & Repeat</p>
            <p className="sketch-text text-xs opacity-60">Write your thoughts, start again Monday</p>
          </div>
        </div>
      </div>
    </SketchCard>
  );
}

function SubmissionForm({
  onClose,
  submissionsUsed,
  maxSubmissions
}: {
  onClose: () => void,
  submissionsUsed: number,
  maxSubmissions: number,
}) {
  const [step, setStep] = useState<'input' | 'preview' | 'success'>('input');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mockPreviewAlbum = {
    title: 'Kid A',
    artist: 'Radiohead',
    coverUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=kida&backgroundColor=264653',
  };

  const handlePaste = () => {
    // Simulate validation
    if (!spotifyUrl.includes('spotify.com/album')) {
      setError('Please paste a Spotify album link');
      return;
    }
    setError(null);
    setStep('preview');
  };

  const handleSubmit = () => {
    setStep('success');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (step === 'success') {
    return (
      <SketchCard padding="lg">
        <div className="text-center space-y-2">
          <p className="text-3xl">✓</p>
          <p className="font-bold">Kid A submitted!</p>
          <p className="sketch-text text-sm opacity-60">Keep voting for other albums.</p>
        </div>
      </SketchCard>
    );
  }

  if (step === 'preview') {
    return (
      <SketchCard padding="md">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="font-medium">Album Found</span>
          </div>

          <div className="flex gap-4 items-center">
            <div
              className="w-20 h-20 rounded-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #264653 0%, #2a9d8f 100%)' }}
            />
            <div>
              <p className="font-bold">{mockPreviewAlbum.title}</p>
              <p className="sketch-text opacity-70">{mockPreviewAlbum.artist}</p>
            </div>
          </div>

          <p className="sketch-text text-xs opacity-60">
            You've submitted {submissionsUsed + 1}/{maxSubmissions} albums this cycle
          </p>

          <div className="flex gap-2">
            <SketchButton variant="primary" onClick={handleSubmit}>Submit Album</SketchButton>
            <SketchButton variant="outline" onClick={() => setStep('input')}>Back</SketchButton>
          </div>
        </div>
      </SketchCard>
    );
  }

  return (
    <SketchCard padding="md">
      <SketchHeading level={4}>Submit Album</SketchHeading>
      <div className="space-y-3 mt-3">
        <SketchInput
          value={spotifyUrl}
          onChange={(e) => setSpotifyUrl(e.target.value)}
          placeholder="Paste Spotify album link"
        />

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <div className="text-xs opacity-60 space-y-1">
          <p className="font-medium">How to find:</p>
          <p>1. Open Spotify → Find album</p>
          <p>2. Tap Share → Copy Link</p>
          <p>3. Paste above</p>
        </div>

        <div className="flex gap-2">
          <SketchButton variant="primary" onClick={handlePaste}>Next</SketchButton>
          <SketchButton variant="outline" onClick={onClose}>Cancel</SketchButton>
        </div>
      </div>
    </SketchCard>
  );
}

function ReviewForm({
  albumTitle,
  tracks,
  onClose
}: {
  albumTitle: string,
  tracks: string[],
  onClose: () => void
}) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [favoriteTrack, setFavoriteTrack] = useState('');
  const [hasListened, setHasListened] = useState(false);

  const minChars = 50;
  const charCount = text.length;

  return (
    <SketchCard padding="md">
      <SketchHeading level={4}>Review: {albumTitle}</SketchHeading>
      <div className="space-y-4 mt-3">
        {/* Listened checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasListened}
            onChange={(e) => setHasListened(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">I've listened to the full album</span>
        </label>

        {/* Rating */}
        <div>
          <p className="sketch-text text-sm mb-2">Your Rating</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`w-10 h-10 rounded-lg text-lg font-medium transition-colors ${
                  n <= rating ? 'bg-white text-black border-2 border-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {rating > 0 && <p className="text-sm mt-1 opacity-60">{rating}/5</p>}
        </div>

        {/* Review text */}
        <div>
          <p className="sketch-text text-sm mb-2">Your Thoughts</p>
          <SketchTextarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What did you think of this album? (minimum 50 characters)"
          />
          <p className={`text-xs mt-1 ${charCount < minChars ? 'text-orange-500' : 'text-green-500'}`}>
            {charCount}/{minChars} characters
          </p>
        </div>

        {/* Favorite track */}
        <div>
          <p className="sketch-text text-sm mb-2">Favorite Track (optional)</p>
          <select
            value={favoriteTrack}
            onChange={(e) => setFavoriteTrack(e.target.value)}
            className="w-full p-2 rounded border bg-white text-sm"
          >
            <option value="">Select a track...</option>
            {tracks.map((track) => (
              <option key={track} value={track}>{track}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <SketchButton
            variant="primary"
            onClick={() => {
              // Would submit review
              onClose();
            }}
          >
            Submit Review
          </SketchButton>
          <SketchButton variant="outline" onClick={onClose}>Cancel</SketchButton>
        </div>
      </div>
    </SketchCard>
  );
}

function AlbumDetailView({
  album,
  reviews,
  tracks,
  onBack,
  canReview,
}: {
  album: typeof mockCycleState.currentAlbum,
  reviews: typeof mockReviews,
  tracks: string[],
  onBack: () => void,
  canReview: boolean,
}) {
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (showReviewForm) {
    return (
      <div className="space-y-4">
        <SketchButton variant="outline" onClick={() => setShowReviewForm(false)}>
          ← Back
        </SketchButton>
        <ReviewForm
          albumTitle={album.title}
          tracks={tracks}
          onClose={() => setShowReviewForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SketchButton variant="outline" onClick={onBack}>
        ← Back
      </SketchButton>

      {/* Album Header */}
      <SketchCard padding="lg">
        <div className="flex gap-4">
          <div
            className="w-24 h-24 rounded-lg flex-shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          />
          <div className="flex-1">
            <SketchHeading level={2}>{album.title}</SketchHeading>
            <p className="sketch-text opacity-70">{album.artist}</p>
            <p className="sketch-text text-xs opacity-50 mt-1">
              Submitted by @{album.submittedBy} • Week {album.weekNumber}
            </p>
            <SketchButton variant="primary" onClick={() => {}}>
              ▶ Listen on Spotify
            </SketchButton>
          </div>
        </div>
      </SketchCard>

      {/* Stats */}
      <SketchCard padding="md">
        <SketchHeading level={4}>Community Stats</SketchHeading>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <p className="text-2xl font-bold">{album.avgRating}/5</p>
            <p className="sketch-text text-xs opacity-60">Average • {album.totalReviews} reviews</p>
          </div>
          <div>
            <p className="text-lg font-medium">🎵 {album.mostLovedTrack}</p>
            <p className="sketch-text text-xs opacity-60">Most loved • {album.mostLovedTrackVotes} picks</p>
          </div>
        </div>
      </SketchCard>

      {/* Reviews */}
      <SketchCard padding="md">
        <div className="flex justify-between items-center mb-3">
          <SketchHeading level={4}>Reviews</SketchHeading>
          {canReview && (
            <SketchButton variant="outline" onClick={() => setShowReviewForm(true)}>
              + Write Review
            </SketchButton>
          )}
        </div>

        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img src={review.pfp} className="w-8 h-8 rounded-full" alt="" />
                  <span className="font-medium">@{review.user}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{review.rating}/5</span>
                  <span className="text-xs opacity-50">{review.daysAgo}d ago</span>
                </div>
              </div>
              <p className="sketch-text text-sm">{review.text}</p>
              {review.favoriteTrack && (
                <p className="text-xs mt-2 opacity-60">★ Favorite: {review.favoriteTrack}</p>
              )}
            </div>
          ))}
        </div>
      </SketchCard>

      {/* Share */}
      <SketchButton variant="secondary">Share Album</SketchButton>
    </div>
  );
}

// ============================================
// MAIN TABS
// ============================================

function NowPlayingTab() {
  const [view, setView] = useState<'main' | 'detail'>('main');
  const { currentAlbum, phase, daysLeftInPhase, hoursLeft, minutesLeft, listenersCount } = mockCycleState;

  if (view === 'detail') {
    return (
      <AlbumDetailView
        album={currentAlbum}
        reviews={mockReviews}
        tracks={mockAlbumTracks}
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
      <SketchCard padding="lg">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="text-xs uppercase tracking-widest opacity-60">
            {phase === 'listening' ? 'Now Listening' : 'Last Week\'s Winner'}
          </div>
          <div className="text-xs opacity-50">Week {currentAlbum.weekNumber} of 26</div>
          <div
            className="w-44 h-44 rounded-lg shadow-xl cursor-pointer hover:scale-105 transition-transform"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            onClick={() => setView('detail')}
          />
          <div>
            <SketchHeading level={2}>{currentAlbum.title}</SketchHeading>
            <p className="sketch-text opacity-70">{currentAlbum.artist}</p>
          </div>

          {phase === 'listening' && (
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-lg">{listenersCount}</p>
                <p className="sketch-text text-xs opacity-60">listening</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{currentAlbum.totalReviews}</p>
                <p className="sketch-text text-xs opacity-60">reviews</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <SketchButton variant="primary">▶ Open in Spotify</SketchButton>
            <SketchButton variant="outline" onClick={() => setView('detail')}>
              See Reviews
            </SketchButton>
          </div>
        </div>
      </SketchCard>

      {/* Share */}
      <SketchButton variant="secondary">Share</SketchButton>
    </div>
  );
}

function VoteTab() {
  const [submissions, setSubmissions] = useState(mockSubmissions);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const { phase, votingEndsAt, daysLeftInPhase, hoursLeft, minutesLeft, userSubmissionsThisCycle, maxSubmissionsPerCycle } = mockCycleState;

  const canVote = phase === 'voting';
  const canSubmit = canVote && userSubmissionsThisCycle < maxSubmissionsPerCycle;
  const totalVotes = submissions.reduce((sum, s) => sum + s.votes, 0);

  const handleVote = (id: number) => {
    setSubmissions(submissions.map(s =>
      s.id === id ? { ...s, votes: s.votes + 1, hasVoted: true } : s
    ));
  };

  if (showSubmitForm) {
    return (
      <div className="space-y-4">
        <SubmissionForm
          onClose={() => setShowSubmitForm(false)}
          submissionsUsed={userSubmissionsThisCycle}
          maxSubmissions={maxSubmissionsPerCycle}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voting Header */}
      <SketchCard padding="md">
        <div className="text-center space-y-2">
          <SketchHeading level={3}>Vote for Next Album</SketchHeading>
          {canVote ? (
            <>
              <p className="text-lg font-bold text-orange-500">
                {daysLeftInPhase}d {hoursLeft}h {minutesLeft}m
              </p>
              <p className="sketch-text text-xs opacity-60">
                {submissions.length} albums • {totalVotes} total votes
              </p>
            </>
          ) : (
            <p className="sketch-text text-sm opacity-70">
              Voting opens Monday • See current standings
            </p>
          )}
        </div>
      </SketchCard>

      {/* Submit Button */}
      {canSubmit && (
        <SketchButton variant="primary" onClick={() => setShowSubmitForm(true)}>
          + Submit an Album ({userSubmissionsThisCycle}/{maxSubmissionsPerCycle} used)
        </SketchButton>
      )}
      {canVote && !canSubmit && (
        <div className="text-center py-2">
          <p className="sketch-text text-sm opacity-60">
            You've submitted {maxSubmissionsPerCycle}/{maxSubmissionsPerCycle} albums this cycle
          </p>
        </div>
      )}

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <SketchCard padding="lg">
          <div className="text-center py-4 opacity-60">
            <p className="text-3xl mb-2">🎵</p>
            <p className="sketch-text">No submissions yet</p>
            <p className="sketch-text text-sm">Be the first to submit an album!</p>
          </div>
        </SketchCard>
      ) : (
        <div className="space-y-2">
          {submissions.sort((a, b) => b.votes - a.votes).map((album, index) => (
            <SketchCard key={album.id} padding="sm">
              <div className="flex items-center gap-3">
                <div className="text-lg font-bold opacity-40 w-6">#{index + 1}</div>
                <div
                  className="w-12 h-12 rounded bg-gradient-to-br from-indigo-400 to-purple-500 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{album.title}</p>
                  <p className="sketch-text text-xs opacity-60">{album.artist}</p>
                  <p className="sketch-text text-xs opacity-40">@{album.submitter} • {album.daysAgo}d ago</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  {canVote ? (
                    <SketchButton
                      variant={album.hasVoted ? "secondary" : "primary"}
                      onClick={() => !album.hasVoted && handleVote(album.id)}
                    >
                      {album.hasVoted ? '✓' : '▲'}
                    </SketchButton>
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                      ▲
                    </div>
                  )}
                  <span className="text-sm font-medium">{album.votes}</span>
                </div>
              </div>
            </SketchCard>
          ))}
        </div>
      )}

      {!canVote && (
        <div className="text-center py-2 opacity-60">
          <p className="sketch-text text-sm">🗳️ Voting opens Monday</p>
        </div>
      )}
    </div>
  );
}

function ArchiveTab() {
  const [selectedAlbum, setSelectedAlbum] = useState<typeof mockPastAlbums[0] | null>(null);
  const albumsThisYear = mockPastAlbums.length;
  const albumsRemaining = 26 - albumsThisYear;
  const totalReviews = mockPastAlbums.reduce((sum, a) => sum + a.reviews, 0);
  const avgRating = (mockPastAlbums.reduce((sum, a) => sum + a.avgRating, 0) / albumsThisYear).toFixed(1);

  if (selectedAlbum) {
    // For archive, show a simplified detail view
    return (
      <AlbumDetailView
        album={{
          ...mockCycleState.currentAlbum,
          id: selectedAlbum.id,
          title: selectedAlbum.title,
          artist: selectedAlbum.artist,
          weekNumber: selectedAlbum.weekNumber,
          avgRating: selectedAlbum.avgRating,
          totalReviews: selectedAlbum.reviews,
        }}
        reviews={mockReviews}
        tracks={mockAlbumTracks}
        onBack={() => setSelectedAlbum(null)}
        canReview={false}
      />
    );
  }

  return (
    <div className="space-y-4">
      <SketchCard padding="md">
        <div className="text-center">
          <SketchHeading level={3}>The 26</SketchHeading>
          <p className="sketch-text text-sm opacity-70 mt-1">
            Albums selected by our community
          </p>
        </div>
      </SketchCard>

      {/* Visual Progress */}
      <SketchCard padding="md">
        <p className="text-center text-sm font-medium mb-3">2025 Journey</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {Array.from({ length: 26 }).map((_, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-sm cursor-pointer transition-transform hover:scale-110 ${
                i < albumsThisYear
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : 'bg-gray-200'
              }`}
              onClick={() => i < albumsThisYear && setSelectedAlbum(mockPastAlbums[i])}
              title={i < albumsThisYear ? mockPastAlbums[i]?.title : `Week ${i + 1}`}
            />
          ))}
        </div>
        <p className="sketch-text text-xs text-center mt-3 opacity-60">
          {albumsThisYear} down • {albumsRemaining} to go
        </p>
      </SketchCard>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <SketchCard padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold">{albumsThisYear}</p>
            <p className="sketch-text text-xs opacity-60">Albums</p>
          </div>
        </SketchCard>
        <SketchCard padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold">{totalReviews}</p>
            <p className="sketch-text text-xs opacity-60">Reviews</p>
          </div>
        </SketchCard>
        <SketchCard padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold">{avgRating}</p>
            <p className="sketch-text text-xs opacity-60">Avg</p>
          </div>
        </SketchCard>
      </div>

      {/* Past Albums List */}
      <div className="space-y-2">
        {mockPastAlbums.map((album) => (
          <SketchCard
            key={album.id}
            padding="sm"
          >
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setSelectedAlbum(album)}
            >
              <div className="text-xs font-bold opacity-40 w-8">W{album.weekNumber}</div>
              <div
                className="w-14 h-14 rounded bg-gradient-to-br from-gray-300 to-gray-400 flex-shrink-0"
              />
              <div className="flex-1">
                <p className="font-medium">{album.title}</p>
                <p className="sketch-text text-sm opacity-60">{album.artist}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{album.avgRating}</p>
                <p className="sketch-text text-xs opacity-60">{album.reviews} reviews</p>
              </div>
            </div>
          </SketchCard>
        ))}
      </div>

      {/* Share */}
      <SketchButton variant="secondary">Share Our Journey</SketchButton>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================

export function MiniApp() {
  return (
    <SketchMiniLayout
      title="26 Albums"
      mode="tabs"
      tabs={[
        { label: "Now", content: <NowPlayingTab /> },
        { label: "Vote", content: <VoteTab /> },
        { label: "The 26", content: <ArchiveTab /> },
      ]}
    />
  );
}

'use client';

import { useState } from 'react';
import {
  SketchMiniLayout,
  SketchButton,
  SketchCard,
  SketchHeading,
  SketchInput,
} from '@/components/sketch';

// Mock data
const mockCurrentAlbum = {
  title: 'In Rainbows',
  artist: 'Radiohead',
  coverUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=inrainbows&backgroundColor=1a1a2e',
  spotifyUrl: 'https://open.spotify.com/album/...',
  daysLeft: 8,
  totalDays: 14,
  listenersCount: 47,
};

const mockSubmissions = [
  { id: 1, title: 'Titanic Rising', artist: 'Weyes Blood', votes: 42, submitter: 'alice', hasVoted: false },
  { id: 2, title: 'Vespertine', artist: 'Björk', votes: 38, submitter: 'bob', hasVoted: true },
  { id: 3, title: 'Dummy', artist: 'Portishead', votes: 31, submitter: 'carol', hasVoted: false },
  { id: 4, title: 'Blonde', artist: 'Frank Ocean', votes: 27, submitter: 'dan', hasVoted: false },
];

const mockReviews = [
  { id: 1, user: 'musicfan', displayName: 'Music Fan', pfp: 'https://api.dicebear.com/9.x/lorelei/svg?seed=musicfan', rating: 9, text: 'This album changed how I think about electronic production. Every track builds on the last.' },
  { id: 2, user: 'vinyllover', displayName: 'Vinyl Lover', pfp: 'https://api.dicebear.com/9.x/lorelei/svg?seed=vinyl', rating: 8, text: 'Gorgeous textures. "Reckoner" might be their best song ever.' },
];

const mockPastAlbums = [
  { id: 1, title: 'Loveless', artist: 'My Bloody Valentine', avgRating: 8.7, reviews: 23 },
  { id: 2, title: 'Remain in Light', artist: 'Talking Heads', avgRating: 9.1, reviews: 31 },
  { id: 3, title: 'Homogenic', artist: 'Björk', avgRating: 8.4, reviews: 19 },
];

function CurrentAlbumTab() {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);

  const progressPercent = ((mockCurrentAlbum.totalDays - mockCurrentAlbum.daysLeft) / mockCurrentAlbum.totalDays) * 100;

  return (
    <div className="space-y-4">
      {/* Hero Album Card */}
      <SketchCard padding="lg">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="text-xs uppercase tracking-widest opacity-60">Now Listening</div>
          <div
            className="w-48 h-48 rounded-lg shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />
          <div>
            <SketchHeading level={2}>{mockCurrentAlbum.title}</SketchHeading>
            <p className="sketch-text opacity-70">{mockCurrentAlbum.artist}</p>
          </div>

          {/* Progress bar */}
          <div className="w-full space-y-1">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="sketch-text text-sm opacity-60">{mockCurrentAlbum.daysLeft} days left • {mockCurrentAlbum.listenersCount} listening</p>
          </div>

          <SketchButton variant="primary">Open in Spotify</SketchButton>
        </div>
      </SketchCard>

      {/* Reviews Section */}
      <SketchCard padding="md">
        <div className="flex justify-between items-center mb-3">
          <SketchHeading level={4}>Community Reviews</SketchHeading>
          <span className="text-sm opacity-60">{mockReviews.length} reviews</span>
        </div>

        <div className="space-y-3">
          {mockReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <img src={review.pfp} className="w-6 h-6 rounded-full" alt="" />
                <span className="font-medium text-sm">{review.displayName}</span>
                <span className="text-yellow-500 text-sm">{'★'.repeat(Math.round(review.rating / 2))}</span>
                <span className="text-sm opacity-60">{review.rating}/10</span>
              </div>
              <p className="sketch-text text-sm opacity-80">{review.text}</p>
            </div>
          ))}
        </div>
      </SketchCard>

      {/* Add Review */}
      {!showReviewForm ? (
        <SketchButton variant="secondary" onClick={() => setShowReviewForm(true)}>
          Write Your Review
        </SketchButton>
      ) : (
        <SketchCard padding="md">
          <SketchHeading level={4}>Your Review</SketchHeading>
          <div className="space-y-3 mt-3">
            <div>
              <p className="sketch-text text-sm mb-2">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className={`w-8 h-8 rounded text-sm font-medium ${
                      n <= rating ? 'bg-purple-500 text-white' : 'bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <SketchInput placeholder="What did you think of this album?" />
            <div className="flex gap-2">
              <SketchButton variant="primary">Submit Review</SketchButton>
              <SketchButton variant="outline" onClick={() => setShowReviewForm(false)}>Cancel</SketchButton>
            </div>
          </div>
        </SketchCard>
      )}

      {/* Share */}
      <SketchButton variant="secondary">Share</SketchButton>
    </div>
  );
}

function VoteTab() {
  const [submissions, setSubmissions] = useState(mockSubmissions);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const handleVote = (id: number) => {
    setSubmissions(submissions.map(s =>
      s.id === id ? { ...s, votes: s.votes + 1, hasVoted: true } : s
    ));
  };

  return (
    <div className="space-y-4">
      {/* Voting Header */}
      <SketchCard padding="md">
        <div className="text-center">
          <SketchHeading level={3}>Vote for Next Album</SketchHeading>
          <p className="sketch-text text-sm opacity-70 mt-1">
            Voting ends in 6 days • Top album wins
          </p>
        </div>
      </SketchCard>

      {/* Submit New Album */}
      {!showSubmitForm ? (
        <SketchButton variant="primary" onClick={() => setShowSubmitForm(true)}>
          + Submit an Album
        </SketchButton>
      ) : (
        <SketchCard padding="md">
          <SketchHeading level={4}>Submit Album</SketchHeading>
          <div className="space-y-3 mt-3">
            <SketchInput placeholder="Paste Spotify album link" />
            <p className="sketch-text text-xs opacity-60">
              We'll pull the album details from Spotify
            </p>
            <div className="flex gap-2">
              <SketchButton variant="primary">Submit</SketchButton>
              <SketchButton variant="outline" onClick={() => setShowSubmitForm(false)}>Cancel</SketchButton>
            </div>
          </div>
        </SketchCard>
      )}

      {/* Submissions List */}
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
                <p className="sketch-text text-xs opacity-40">by @{album.submitter}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <SketchButton
                  variant={album.hasVoted ? "secondary" : "primary"}
                  onClick={() => !album.hasVoted && handleVote(album.id)}
                >
                  {album.hasVoted ? '✓' : '▲'}
                </SketchButton>
                <span className="text-sm font-medium">{album.votes}</span>
              </div>
            </div>
          </SketchCard>
        ))}
      </div>
    </div>
  );
}

function ArchiveTab() {
  return (
    <div className="space-y-4">
      <SketchCard padding="md">
        <div className="text-center">
          <SketchHeading level={3}>Album Archive</SketchHeading>
          <p className="sketch-text text-sm opacity-70 mt-1">
            26 albums per year • Slow listening
          </p>
        </div>
      </SketchCard>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <SketchCard padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold">3</p>
            <p className="sketch-text text-xs opacity-60">Albums</p>
          </div>
        </SketchCard>
        <SketchCard padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold">73</p>
            <p className="sketch-text text-xs opacity-60">Reviews</p>
          </div>
        </SketchCard>
        <SketchCard padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold">8.7</p>
            <p className="sketch-text text-xs opacity-60">Avg Rating</p>
          </div>
        </SketchCard>
      </div>

      {/* Past Albums */}
      <div className="space-y-2">
        {mockPastAlbums.map((album) => (
          <SketchCard key={album.id} padding="sm">
            <div className="flex items-center gap-3">
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
    </div>
  );
}

export function MiniApp() {
  return (
    <SketchMiniLayout
      title="26 Albums"
      mode="tabs"
      tabs={[
        { label: "Now", content: <CurrentAlbumTab /> },
        { label: "Vote", content: <VoteTab /> },
        { label: "Archive", content: <ArchiveTab /> },
      ]}
    />
  );
}

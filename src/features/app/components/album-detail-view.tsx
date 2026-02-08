'use client';

import { useState } from 'react';
import { Card, CardContent, H2, H4, P, Button } from '@neynar/ui';
import type { Album, Review } from '@/features/app/types';
import { ReviewForm } from './review-form';

interface AlbumDetailViewProps {
  album: Album;
  reviews: Review[];
  tracks: string[];
  onBack: () => void;
  canReview: boolean;
}

export function AlbumDetailView({ album, reviews, tracks, onBack, canReview }: AlbumDetailViewProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (showReviewForm) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowReviewForm(false)}>
          ← Back
        </Button>
        <ReviewForm albumTitle={album.title} tracks={tracks} onClose={() => setShowReviewForm(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack}>
        ← Back
      </Button>

      {/* Album Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div
              className="w-24 h-24 rounded-lg flex-shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            />
            <div className="flex-1">
              <H2>{album.title}</H2>
              <P className="text-gray-400">{album.artist}</P>
              <P className="text-xs text-gray-500 mt-1">
                Submitted by @{album.submittedBy} • Week {album.weekNumber}
              </P>
              <Button className="mt-2">▶ Listen on Spotify</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardContent className="p-4">
          <H4>Community Stats</H4>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <P className="text-2xl font-bold text-white">{album.avgRating}/5</P>
              <P className="text-xs text-gray-500">Average • {album.totalReviews} reviews</P>
            </div>
            <div>
              <P className="text-lg font-medium text-white">🎵 {album.mostLovedTrack}</P>
              <P className="text-xs text-gray-500">Most loved • {album.mostLovedTrackVotes} picks</P>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <H4>Reviews</H4>
            {canReview && (
              <Button variant="outline" size="sm" onClick={() => setShowReviewForm(true)}>
                + Write Review
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img src={review.pfp} className="w-8 h-8 rounded-full" alt="" />
                    <span className="font-medium text-white">@{review.user}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{review.rating}/5</span>
                    <span className="text-xs text-gray-500">{review.daysAgo}d ago</span>
                  </div>
                </div>
                <P className="text-sm text-gray-300">{review.text}</P>
                {review.favoriteTrack && (
                  <P className="text-xs mt-2 text-gray-500">★ Favorite: {review.favoriteTrack}</P>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Share */}
      <Button variant="secondary" className="w-full">
        Share Album
      </Button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, H2, H4, P, Button } from '@neynar/ui';
import { useFarcasterUser, ShareButton } from '@/neynar-farcaster-sdk/mini';
import { useUserReview } from '@/hooks/use-reviews';
import { ReviewForm } from './review-form';

interface AlbumForDisplay {
  id?: string;
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl: string;
  avgRating: number | null;
  totalReviews: number | null;
  mostLovedTrack: string | null;
  mostLovedTrackVotes: number | null;
  weekNumber: number;
  submittedBy: string;
}

interface ReviewForDisplay {
  id: string | number;
  fid?: number;
  user: string;
  displayName?: string;
  pfp: string;
  rating: number;
  text: string;
  favoriteTrack: string | null;
  daysAgo: number;
}

interface AlbumDetailViewProps {
  album: AlbumForDisplay;
  reviews: ReviewForDisplay[];
  tracks: string[];
  onBack: () => void;
  canReview: boolean;
  userFid?: number | null;
  onViewProfile?: (fid: number) => void;
}

export function AlbumDetailView({
  album,
  reviews,
  tracks,
  onBack,
  canReview,
  userFid: propUserFid,
  onViewProfile,
}: AlbumDetailViewProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Get user from context if not passed as prop
  const { data: user } = useFarcasterUser();
  const userFid = propUserFid ?? user?.fid ?? null;

  // Check if album.id is a valid UUID (not a mock ID like "4")
  const isValidUuid = album.id && album.id.length > 10;

  // Check if user already reviewed (only query DB if we have a valid UUID)
  const { hasReviewed } = useUserReview(isValidUuid ? album.id ?? null : null, userFid);

  // Can write review if: in listening phase AND hasn't reviewed yet
  const showWriteReviewButton = canReview && !hasReviewed;

  if (showReviewForm && isValidUuid && album.id) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowReviewForm(false)}>
          ← Back
        </Button>
        <ReviewForm
          albumId={album.id}
          albumTitle={album.title}
          tracks={tracks}
          onClose={() => setShowReviewForm(false)}
        />
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
            {album.coverUrl ? (
              <img
                src={album.coverUrl}
                alt={album.title}
                className="w-24 h-24 rounded-lg flex-shrink-0 shadow-lg object-cover"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-lg flex-shrink-0 shadow-lg bg-gray-800 border border-gray-700"
              />
            )}
            <div className="flex-1">
              <H2>{album.title}</H2>
              <P className="text-gray-400">{album.artist}</P>
              <P className="text-xs text-gray-500 mt-1">
                Submitted by @{album.submittedBy} • Week {album.weekNumber}
              </P>
              <Button
                className="mt-2"
                onClick={() => {
                  window.open(album.spotifyUrl, '_blank');
                }}
              >
                PLAY ON SPOTIFY
              </Button>
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
              <P className="text-2xl font-bold text-white">{album.avgRating ?? '-'}/5</P>
              <P className="text-xs text-gray-500">Average • {album.totalReviews ?? 0} reviews</P>
            </div>
            <div>
              {album.mostLovedTrack ? (
                <>
                  <P className="text-lg font-medium text-white">♪ {album.mostLovedTrack}</P>
                  <P className="text-xs text-gray-500">Most loved • {album.mostLovedTrackVotes ?? 0} picks</P>
                </>
              ) : (
                <>
                  <P className="text-lg font-medium text-gray-500">No reviews yet</P>
                  <P className="text-xs text-gray-500">Be the first!</P>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <H4>Reviews</H4>
            {showWriteReviewButton && (
              <Button variant="outline" size="sm" onClick={() => setShowReviewForm(true)}>
                + Write Review
              </Button>
            )}
            {hasReviewed && (
              <P className="text-xs text-white">✓ You reviewed this</P>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-4">
              <P className="text-gray-500">No reviews yet</P>
              {canReview && !hasReviewed && (
                <P className="text-sm text-gray-600 mt-1">Be the first to share your thoughts!</P>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <img src={review.pfp} className="w-8 h-8 rounded-full" alt="" />
                      <button
                        onClick={() => review.fid && onViewProfile?.(review.fid)}
                        className="font-medium text-white hover:text-gray-300 transition-colors"
                      >
                        @{review.user}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{review.rating}/5</span>
                      <span className="text-xs text-gray-500">{review.daysAgo}d ago</span>
                    </div>
                  </div>
                  <P className="text-sm text-gray-300">{review.text}</P>
                  {review.favoriteTrack && (
                    <P className="text-xs mt-2 text-gray-500">// Favorite: {review.favoriteTrack}</P>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share */}
      <ShareButton
        variant="secondary"
        className="w-full"
        text={`"${album.title}" by ${album.artist} - rated ${album.avgRating ?? '-'}/5 by our community! ${album.totalReviews ?? 0} reviews on Playgroup.`}
        queryParams={{
          shareType: 'review',
          albumTitle: album.title,
          artist: album.artist,
          weekNumber: album.weekNumber.toString(),
          avgRating: (album.avgRating ?? 0).toString(),
          totalReviews: (album.totalReviews ?? 0).toString(),
        }}
      >
        Share Album
      </ShareButton>
    </div>
  );
}

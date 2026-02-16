'use client';

import { Card, CardContent, H2, H3, H4, P, Button } from '@neynar/ui';
import { useFarcasterUser } from '@/neynar-farcaster-sdk/mini';
import { useProfile, useUserInfo, ProfileData } from '@/hooks/use-profile';

interface ProfileViewProps {
  fid: number;
  onBack: () => void;
  onViewAlbum?: (albumId: string) => void;
}

export function ProfileView({ fid, onBack, onViewAlbum }: ProfileViewProps) {
  const { data: currentUser } = useFarcasterUser();
  const { profile, isLoading, error } = useProfile(fid);
  const { userInfo } = useUserInfo(fid);

  const isOwnProfile = currentUser?.fid === fid;

  // Get display info - prefer current user data for own profile, otherwise use DB lookup
  const displayName = isOwnProfile
    ? currentUser?.username
    : userInfo?.username ?? `User ${fid}`;
  const displayPfp = isOwnProfile
    ? currentUser?.pfp_url
    : userInfo?.pfp ?? `https://api.dicebear.com/9.x/lorelei/svg?seed=${fid}`;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <div className="text-center py-12">
          <P className="text-gray-500">Loading profile...</P>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <div className="text-center py-12">
          <P className="text-red-500">{error}</P>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack}>
        ← Back
      </Button>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <img
              src={displayPfp}
              alt={displayName}
              className="w-16 h-16 rounded-full border-2 border-gray-700"
            />
            <div>
              <H2>@{displayName}</H2>
              {profile?.memberSince && (
                <P className="text-sm text-gray-500">
                  Member since {formatDate(profile.memberSince)}
                </P>
              )}
              {!profile?.memberSince && (
                <P className="text-sm text-gray-500">New member</P>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <Card>
        <CardContent className="p-4">
          <H4 className="mb-3">Stats</H4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-gray-900 rounded-lg">
              <P className="text-2xl font-bold text-white">
                {profile?.stats.totalSubmissions ?? 0}
              </P>
              <P className="text-xs text-gray-500">Submitted</P>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg">
              <P className="text-2xl font-bold text-white">
                {profile?.stats.totalWins ?? 0}
              </P>
              <P className="text-xs text-gray-500">Wins</P>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg">
              <P className="text-2xl font-bold text-white">
                {profile?.stats.totalVotesReceived ?? 0}
              </P>
              <P className="text-xs text-gray-500">Votes Received</P>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg">
              <P className="text-2xl font-bold text-white">
                {profile?.stats.totalReviews ?? 0}
              </P>
              <P className="text-xs text-gray-500">Reviews</P>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg col-span-2">
              <P className="text-2xl font-bold text-white">
                {profile?.stats.avgRatingGiven ?? '-'}/5
              </P>
              <P className="text-xs text-gray-500">Avg Rating Given</P>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions */}
      <Card>
        <CardContent className="p-4">
          <H4 className="mb-3">Submissions</H4>
          {!profile?.submissions.length ? (
            <div className="text-center py-4">
              <P className="text-gray-500">No submissions yet</P>
              {isOwnProfile && (
                <P className="text-sm text-gray-600 mt-1">
                  Head to the Vote tab to submit an album!
                </P>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {profile.submissions.slice(0, 5).map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center gap-3 p-2 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => onViewAlbum?.(submission.id)}
                >
                  <img
                    src={submission.coverUrl}
                    alt={submission.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <P className="font-medium text-white truncate">{submission.title}</P>
                    <P className="text-xs text-gray-500 truncate">{submission.artist}</P>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={submission.status} />
                    <P className="text-xs text-gray-500 mt-1">{submission.votes} votes</P>
                  </div>
                </div>
              ))}
              {profile.submissions.length > 5 && (
                <P className="text-center text-sm text-gray-500">
                  +{profile.submissions.length - 5} more
                </P>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardContent className="p-4">
          <H4 className="mb-3">Reviews</H4>
          {!profile?.reviews.length ? (
            <div className="text-center py-4">
              <P className="text-gray-500">No reviews yet</P>
              {isOwnProfile && (
                <P className="text-sm text-gray-600 mt-1">
                  Listen to this week&apos;s album and share your thoughts!
                </P>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {profile.reviews.slice(0, 5).map((review) => (
                <div
                  key={review.id}
                  className="p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => onViewAlbum?.(review.album.id)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={review.album.coverUrl}
                      alt={review.album.title}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <P className="font-medium text-white truncate">{review.album.title}</P>
                      <P className="text-xs text-gray-500 truncate">{review.album.artist}</P>
                    </div>
                    <P className="font-bold text-white shrink-0">{review.rating}/5</P>
                  </div>
                  <P className="text-sm text-gray-400 line-clamp-2">{review.text}</P>
                  {review.favoriteTrack && (
                    <P className="text-xs text-gray-500 mt-1">
                      // Favorite: {review.favoriteTrack}
                    </P>
                  )}
                </div>
              ))}
              {profile.reviews.length > 5 && (
                <P className="text-center text-sm text-gray-500">
                  +{profile.reviews.length - 5} more
                </P>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'selected') {
    return (
      <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
        WON
      </span>
    );
  }
  if (status === 'voting') {
    return (
      <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
        VOTING
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-gray-400 bg-gray-400/10 px-2 py-0.5 rounded">
      PAST
    </span>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

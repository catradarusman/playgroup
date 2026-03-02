'use client';

import { useState } from 'react';
import { Card, CardContent, H2, H3, H4, P, Button } from '@neynar/ui';
import { useAuth } from '@/hooks/use-auth';
import { useProfile, useUserInfo } from '@/hooks/use-profile';
import { updateUserProfile } from '@/db/actions/user-actions';

interface ProfileViewProps {
  fid?: number | null;      // Farcaster users
  userId?: string | null;   // Privy users (no FID)
  onBack: () => void;
  onViewAlbum?: (albumId: string) => void;
}

export function ProfileView({ fid, userId, onBack, onViewAlbum }: ProfileViewProps) {
  // Unified auth - supports both Farcaster and Privy users
  const { user: currentUser, logout } = useAuth();

  // Load profile data — useProfile handles fid vs userId routing
  const { profile, isLoading, error } = useProfile(fid ?? null, userId ?? null);
  const { userInfo } = useUserInfo(fid ?? null, userId ?? null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editPfpUrl, setEditPfpUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Check if this is the current user's own profile
  const isOwnProfile =
    (currentUser?.fid != null && fid != null && currentUser.fid === fid) ||
    (currentUser?.id != null && userId != null && currentUser.id === userId);

  // Display info — prefer current user's live data for own profile
  const displayName = isOwnProfile
    ? currentUser?.username
    : userInfo?.username ?? (fid ? `User ${fid}` : 'User');

  const displayPfp: string = isOwnProfile
    ? (currentUser?.pfpUrl ?? `https://api.dicebear.com/9.x/lorelei/svg?seed=${fid ?? userId}`)
    : (userInfo?.pfp ?? `https://api.dicebear.com/9.x/lorelei/svg?seed=${fid ?? userId}`);

  const handleStartEdit = () => {
    setEditUsername(displayName ?? '');
    setEditPfpUrl(currentUser?.pfpUrl ?? '');
    setEditError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;
    setIsSaving(true);
    setEditError(null);
    try {
      const result = await updateUserProfile(currentUser.id, {
        username: editUsername.trim() || undefined,
        pfpUrl: editPfpUrl.trim() || undefined,
      });
      if (result) {
        window.location.reload();
      } else {
        setEditError('Failed to save changes. Try again.');
        setIsSaving(false);
      }
    } catch {
      setEditError('An error occurred. Try again.');
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    onBack();
  };

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
          {isEditing ? (
            /* Edit mode */
            <div className="space-y-4">
              <H3>Edit Profile</H3>
              {currentUser?.authProvider === 'farcaster' && (
                <P className="text-xs text-yellow-500/80 bg-yellow-500/10 rounded px-3 py-2">
                  Your profile is synced from Farcaster — changes may be overwritten on next sign-in.
                </P>
              )}
              <div className="flex gap-4 items-start">
                {/* PFP preview */}
                <img
                  src={editPfpUrl || `https://api.dicebear.com/9.x/lorelei/svg?seed=${fid ?? userId}`}
                  alt="preview"
                  className="w-16 h-16 rounded-full border-2 border-gray-700 flex-shrink-0 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${fid ?? userId}`;
                  }}
                />
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Username</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
                      placeholder="username"
                      maxLength={30}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Profile picture URL</label>
                    <input
                      type="url"
                      value={editPfpUrl}
                      onChange={(e) => setEditPfpUrl(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
              {editError && (
                <P className="text-sm text-red-500">{editError}</P>
              )}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={isSaving || !editUsername.trim()}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div className="flex items-center gap-4">
              <img
                src={displayPfp}
                alt={displayName}
                className="w-16 h-16 rounded-full border-2 border-gray-700 flex-shrink-0 object-cover"
              />
              <div className="flex-1 min-w-0">
                <H2>@{displayName}</H2>
                {profile?.memberSince && (
                  <P className="text-sm text-gray-500">
                    Member since {formatDate(profile.memberSince)}
                  </P>
                )}
                {!profile?.memberSince && (
                  <P className="text-sm text-gray-500">New member</P>
                )}
                {isOwnProfile && (
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={handleStartEdit}>
                      Edit profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
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

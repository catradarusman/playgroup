'use client';

import { Card, CardContent, P, Button, Skeleton } from '@neynar/ui';
import { useAlbumBuzz, type BuzzCast } from '@/hooks/use-album-buzz';

interface AlbumBuzzSectionProps {
  albumTitle: string;
  albumArtist: string;
  onViewProfile?: (fid: number) => void;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CastCard({ cast, onViewProfile }: { cast: BuzzCast; onViewProfile?: (fid: number) => void }) {
  // Truncate long text
  const displayText = cast.text.length > 200
    ? cast.text.substring(0, 200) + '...'
    : cast.text;

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Author avatar */}
          {cast.author.pfpUrl ? (
            <img
              src={cast.author.pfpUrl}
              alt={cast.author.displayName}
              className="w-8 h-8 rounded-full flex-shrink-0 cursor-pointer"
              onClick={() => onViewProfile?.(cast.author.fid)}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center cursor-pointer"
              onClick={() => onViewProfile?.(cast.author.fid)}
            >
              <P className="text-xs text-gray-400">{cast.author.displayName.charAt(0).toUpperCase()}</P>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Author info */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewProfile?.(cast.author.fid)}
                className="font-medium text-sm text-white hover:underline truncate"
              >
                {cast.author.displayName}
              </button>
              <P className="text-xs text-gray-500">@{cast.author.username}</P>
              <P className="text-xs text-gray-600">·</P>
              <P className="text-xs text-gray-500">{formatTimeAgo(cast.timestamp)}</P>
            </div>

            {/* Cast text */}
            <P className="text-sm text-gray-300 mt-1 break-words">{displayText}</P>

            {/* Reactions */}
            <div className="flex items-center gap-4 mt-2">
              <P className="text-xs text-gray-500">
                <span className="mr-1">♡</span>
                {cast.reactions.likes}
              </P>
              <P className="text-xs text-gray-500">
                <span className="mr-1">↻</span>
                {cast.reactions.recasts}
              </P>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AlbumBuzzSection({ albumTitle, albumArtist, onViewProfile }: AlbumBuzzSectionProps) {
  const { casts, count, isLoading, hasMore, loadMore } = useAlbumBuzz(albumTitle, albumArtist);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <P className="text-sm font-medium text-white mb-3">Community Buzz</P>
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (casts.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <P className="text-sm font-medium text-white mb-3">Community Buzz</P>
          <div className="text-center py-6">
            <P className="text-2xl mb-2 font-mono">💬</P>
            <P className="text-gray-400 text-sm">No casts yet</P>
            <P className="text-gray-500 text-xs mt-1">Be the first to share your thoughts on Farcaster!</P>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <P className="text-sm font-medium text-white">Community Buzz</P>
          <P className="text-xs text-gray-500">{count} cast{count !== 1 ? 's' : ''}</P>
        </div>

        <div className="space-y-2">
          {casts.slice(0, 5).map((cast) => (
            <CastCard key={cast.hash} cast={cast} onViewProfile={onViewProfile} />
          ))}
        </div>

        {hasMore && casts.length >= 5 && (
          <Button
            variant="ghost"
            className="w-full mt-3 text-sm"
            onClick={() => loadMore()}
          >
            Load more casts
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact buzz count display for headers/stats
 */
export function BuzzCount({
  albumTitle,
  albumArtist
}: {
  albumTitle: string | null;
  albumArtist: string | null;
}) {
  const { count, isLoading } = useAlbumBuzz(albumTitle, albumArtist);

  if (isLoading) {
    return <Skeleton className="h-6 w-8" />;
  }

  return <span>{count}</span>;
}

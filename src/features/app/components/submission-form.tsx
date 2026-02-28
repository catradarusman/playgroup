'use client';

import { useState } from 'react';
import { Card, CardContent, H4, P, Button, Input, Skeleton } from '@neynar/ui';
import { useSubmitAlbum } from '@/hooks/use-submissions';

interface SubmissionFormProps {
  onClose: () => void;
  cycleId: string | null;
  userFid?: number; // Legacy - Farcaster users
  userId?: string; // New - unified user ID
  username: string;
}

interface AlbumData {
  spotifyId: string;
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl: string;
  tracks: string[];
  genres: string[];
}

function GenrePills({ genres }: { genres: string[] }) {
  if (!genres.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {genres.slice(0, 3).map((g) => (
        <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
          {g}
        </span>
      ))}
    </div>
  );
}

export function SubmissionForm({
  onClose,
  cycleId,
  userFid,
  userId,
  username,
}: SubmissionFormProps) {
  const [step, setStep] = useState<'input' | 'loading' | 'preview' | 'success'>('input');
  const [query, setQuery] = useState('');
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { submit, isSubmitting, error: submitError } = useSubmitAlbum();

  const isSpotifyUrl = (input: string) =>
    input.includes('spotify.com/album') || input.includes('spotify:album:');

  const handleFind = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Please enter a Spotify link or album name');
      return;
    }

    setError(null);
    setStep('loading');

    try {
      let data: AlbumData | null = null;

      if (isSpotifyUrl(trimmed)) {
        const res = await fetch(`/api/spotify/album?url=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          data = await res.json();
        } else if (res.status === 404) {
          setError('Album not found on Spotify — check the link and try again');
          setStep('input');
          return;
        } else {
          setError('Could not fetch album — check the link and try again');
          setStep('input');
          return;
        }
      } else {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          data = await res.json();
        } else if (res.status === 404) {
          setError('No album found — try a different search');
          setStep('input');
          return;
        } else {
          setError('Search failed — try again');
          setStep('input');
          return;
        }
      }

      if (data) {
        setAlbumData(data);
        setStep('preview');
      }
    } catch {
      setError('Something went wrong — try again');
      setStep('input');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      handleFind();
    }
  };

  const handleSubmit = async () => {
    if (!albumData) {
      setError('Album data not found — try searching again');
      return;
    }
    if (!cycleId) {
      setError('No active voting cycle — check back when voting opens');
      return;
    }
    if (!userFid && !userId) {
      setError('Please sign in to submit albums');
      return;
    }

    setError(null);

    const result = await submit({
      spotifyId: albumData.spotifyId,
      title: albumData.title,
      artist: albumData.artist,
      coverUrl: albumData.coverUrl,
      spotifyUrl: albumData.spotifyUrl,
      tracks: albumData.tracks,
      genres: albumData.genres,
      cycleId,
      fid: userFid,
      userId,
      username,
    });

    if (result.success) {
      setStep('success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(submitError || 'Failed to submit album');
    }
  };

  if (step === 'success' && albumData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-3xl font-bold text-white">OK</p>
            <P className="font-bold text-white">{albumData.title} submitted!</P>
            <P className="text-sm text-gray-400">Keep voting for other albums.</P>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'loading') {
    return (
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400">Finding album...</span>
          </div>
          <div className="flex gap-4 items-center">
            <Skeleton className="w-20 h-20 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'preview' && albumData) {
    return (
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-white">✓</span>
            <span className="font-medium text-white">Album Ready</span>
          </div>

          <div className="flex gap-4 items-center">
            {albumData.coverUrl ? (
              <img
                src={albumData.coverUrl}
                alt={albumData.title}
                className="w-20 h-20 rounded-lg flex-shrink-0 object-cover shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg flex-shrink-0 shadow-lg bg-gray-800 border border-gray-700" />
            )}
            <div>
              <P className="font-bold text-white">{albumData.title}</P>
              <P className="text-gray-400">{albumData.artist}</P>
              <GenrePills genres={albumData.genres} />
              {albumData.tracks.length > 0 && (
                <P className="text-xs text-gray-600 mt-1">{albumData.tracks.length} tracks</P>
              )}
            </div>
          </div>

          {error && <P className="text-red-500 text-sm">{error}</P>}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Album'}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setQuery(''); setAlbumData(null); setStep('input'); }}
              disabled={isSubmitting}
            >
              Wrong album?
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <H4>Submit Album</H4>
        <div className="space-y-3 mt-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste Spotify link or search artist + album"
            autoFocus
          />

          {error && <P className="text-red-500 text-sm">{error}</P>}

          <div className="text-xs text-gray-500 space-y-0.5">
            <P>Drop a Spotify album link, or type artist + album name</P>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleFind} disabled={!query.trim()}>
              Find Album
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

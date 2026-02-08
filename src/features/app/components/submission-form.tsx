'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, H4, P, Button, Input, Skeleton } from '@neynar/ui';
import { useSubmitAlbum } from '@/hooks/use-submissions';

interface SubmissionFormProps {
  onClose: () => void;
  submissionsUsed: number;
  maxSubmissions: number;
  cycleId: string | null;
  userFid: number | null;
  username: string;
}

interface AlbumData {
  title: string;
  artist: string;
  coverUrl: string;
  tracks: string[];
}

export function SubmissionForm({
  onClose,
  submissionsUsed,
  maxSubmissions,
  cycleId,
  userFid,
  username,
}: SubmissionFormProps) {
  const [step, setStep] = useState<'input' | 'search' | 'loading' | 'preview' | 'success'>('input');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { submit, isSubmitting, error: submitError } = useSubmitAlbum();

  // Extract Spotify album ID from URL
  const extractSpotifyId = (url: string): string | null => {
    const patterns = [
      /spotify\.com\/album\/([a-zA-Z0-9]+)/,
      /spotify:album:([a-zA-Z0-9]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handlePaste = () => {
    // Validate Spotify link
    if (!spotifyUrl.includes('spotify.com/album') && !spotifyUrl.includes('spotify:album:')) {
      setError('Please paste a valid Spotify album link');
      return;
    }

    const spotifyId = extractSpotifyId(spotifyUrl);
    if (!spotifyId) {
      setError('Invalid Spotify album link');
      return;
    }

    setError(null);
    setStep('search');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter the album name');
      return;
    }

    setError(null);
    setStep('loading');

    try {
      const response = await fetch(`/api/deezer/search?q=${encodeURIComponent(searchQuery.trim())}`);

      if (response.ok) {
        const data = await response.json();
        setAlbumData({
          title: data.title,
          artist: data.artist,
          coverUrl: data.coverUrl,
          tracks: data.tracks || [],
        });
        setStep('preview');
      } else {
        // Not found on Deezer - use manual entry
        const parts = searchQuery.trim().split(' - ');
        if (parts.length >= 2) {
          setAlbumData({
            title: parts.slice(1).join(' - '),
            artist: parts[0],
            coverUrl: '',
            tracks: [],
          });
        } else {
          setAlbumData({
            title: searchQuery.trim(),
            artist: 'Unknown Artist',
            coverUrl: '',
            tracks: [],
          });
        }
        setStep('preview');
      }
    } catch (err) {
      console.error('Error searching:', err);
      // Use manual entry on error
      setAlbumData({
        title: searchQuery.trim(),
        artist: 'Unknown Artist',
        coverUrl: '',
        tracks: [],
      });
      setStep('preview');
    }
  };

  // Auto-search when user presses Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSearch();
    }
  };

  const handleSubmit = async () => {
    if (!albumData || !cycleId || !userFid) {
      setError('Missing required data');
      return;
    }

    const spotifyId = extractSpotifyId(spotifyUrl);
    if (!spotifyId) {
      setError('Invalid Spotify link');
      return;
    }

    setError(null);

    const result = await submit({
      spotifyId,
      title: albumData.title,
      artist: albumData.artist,
      coverUrl: albumData.coverUrl,
      spotifyUrl,
      tracks: albumData.tracks,
      cycleId,
      fid: userFid,
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
            <p className="text-3xl">✓</p>
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
            <span className="text-green-500">✓</span>
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
              <div
                className="w-20 h-20 rounded-lg flex-shrink-0 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              />
            )}
            <div>
              <P className="font-bold text-white">{albumData.title}</P>
              <P className="text-gray-400">{albumData.artist}</P>
              {albumData.tracks.length > 0 && (
                <P className="text-xs text-gray-600">{albumData.tracks.length} tracks</P>
              )}
            </div>
          </div>

          <P className="text-xs text-gray-500">
            Submission {submissionsUsed + 1}/{maxSubmissions} this cycle
          </P>

          {error && <P className="text-red-500 text-sm">{error}</P>}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Album'}
            </Button>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setStep('search'); }} disabled={isSubmitting}>
              Wrong album?
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'search') {
    return (
      <Card>
        <CardContent className="p-4 space-y-4">
          <H4>What album is this?</H4>
          <P className="text-sm text-gray-400">Type the album name to find cover art & track list</P>

          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Pink Floyd Dark Side of the Moon"
            autoFocus
          />

          {error && <P className="text-red-500 text-sm">{error}</P>}

          <P className="text-xs text-gray-600">
            Tip: Include artist name for better results
          </P>

          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
              Find Album
            </Button>
            <Button variant="outline" onClick={() => setStep('input')}>
              ← Back
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
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            placeholder="Paste Spotify album link"
            autoFocus
          />

          {error && <P className="text-red-500 text-sm">{error}</P>}

          <div className="text-xs text-gray-500 space-y-1">
            <P className="font-medium">How to find:</P>
            <P>1. Open Spotify → Find album</P>
            <P>2. Tap ••• → Share → Copy Link</P>
            <P>3. Paste above</P>
          </div>

          <div className="flex gap-2">
            <Button onClick={handlePaste}>Next</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

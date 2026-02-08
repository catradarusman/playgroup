'use client';

import { useState } from 'react';
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

interface PreviewAlbum {
  spotifyId: string;
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl: string;
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
  const [step, setStep] = useState<'input' | 'loading' | 'preview' | 'success'>('input');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewAlbum, setPreviewAlbum] = useState<PreviewAlbum | null>(null);

  const { submit, isSubmitting, error: submitError } = useSubmitAlbum();

  const handlePaste = async () => {
    if (!spotifyUrl.includes('spotify.com/album') && !spotifyUrl.includes('spotify:album:')) {
      setError('Please paste a Spotify album link');
      return;
    }

    setError(null);
    setStep('loading');

    try {
      // Fetch album metadata from Spotify API
      const response = await fetch(`/api/spotify/album?url=${encodeURIComponent(spotifyUrl)}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 503 && data.configured === false) {
          // Spotify not configured - show helpful error
          setError('Spotify API not configured yet. Ask the admin to add credentials.');
          setStep('input');
          return;
        }
        setError(data.error || 'Failed to fetch album');
        setStep('input');
        return;
      }

      setPreviewAlbum({
        spotifyId: data.spotifyId,
        title: data.title,
        artist: data.artist,
        coverUrl: data.coverUrl,
        spotifyUrl: data.spotifyUrl,
        tracks: data.tracks || [],
      });
      setStep('preview');
    } catch (err) {
      console.error('Error fetching album:', err);
      setError('Failed to fetch album. Please try again.');
      setStep('input');
    }
  };

  const handleSubmit = async () => {
    if (!previewAlbum || !cycleId || !userFid) {
      setError('Missing required data');
      return;
    }

    const result = await submit({
      spotifyId: previewAlbum.spotifyId,
      title: previewAlbum.title,
      artist: previewAlbum.artist,
      coverUrl: previewAlbum.coverUrl,
      spotifyUrl: previewAlbum.spotifyUrl,
      tracks: previewAlbum.tracks,
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

  if (step === 'success' && previewAlbum) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-3xl">✓</p>
            <P className="font-bold text-white">{previewAlbum.title} submitted!</P>
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
            <span className="text-gray-400">Fetching album from Spotify...</span>
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

  if (step === 'preview' && previewAlbum) {
    return (
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="font-medium text-white">Album Found</span>
          </div>

          <div className="flex gap-4 items-center">
            {previewAlbum.coverUrl ? (
              <img
                src={previewAlbum.coverUrl}
                alt={previewAlbum.title}
                className="w-20 h-20 rounded-lg flex-shrink-0 object-cover"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-lg flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #264653 0%, #2a9d8f 100%)' }}
              />
            )}
            <div>
              <P className="font-bold text-white">{previewAlbum.title}</P>
              <P className="text-gray-400">{previewAlbum.artist}</P>
              <P className="text-xs text-gray-600">{previewAlbum.tracks.length} tracks</P>
            </div>
          </div>

          <P className="text-xs text-gray-500">
            You've submitted {submissionsUsed + 1}/{maxSubmissions} albums this cycle
          </P>

          {error && <P className="text-red-500 text-sm">{error}</P>}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Album'}
            </Button>
            <Button variant="outline" onClick={() => setStep('input')} disabled={isSubmitting}>
              Back
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
          />

          {error && <P className="text-red-500 text-sm">{error}</P>}

          <div className="text-xs text-gray-500 space-y-1">
            <P className="font-medium">How to find:</P>
            <P>1. Open Spotify → Find album</P>
            <P>2. Tap Share → Copy Link</P>
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

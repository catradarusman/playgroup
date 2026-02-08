'use client';

import { useState } from 'react';
import { Card, CardContent, H4, P, Button, Input } from '@neynar/ui';
import { useSubmitAlbum } from '@/hooks/use-submissions';

interface SubmissionFormProps {
  onClose: () => void;
  submissionsUsed: number;
  maxSubmissions: number;
  cycleId: string | null;
  userFid: number | null;
  username: string;
}

export function SubmissionForm({
  onClose,
  submissionsUsed,
  maxSubmissions,
  cycleId,
  userFid,
  username,
}: SubmissionFormProps) {
  const [step, setStep] = useState<'input' | 'preview' | 'success'>('input');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
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

  const handleNext = () => {
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
    setStep('preview');
  };

  const handleSubmit = async () => {
    // Validate fields
    if (!title.trim()) {
      setError('Please enter the album title');
      return;
    }
    if (!artist.trim()) {
      setError('Please enter the artist name');
      return;
    }
    if (!cycleId || !userFid) {
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
      title: title.trim(),
      artist: artist.trim(),
      coverUrl: '', // No cover without Spotify API
      spotifyUrl,
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

  if (step === 'success') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-3xl">✓</p>
            <P className="font-bold text-white">{title} submitted!</P>
            <P className="text-sm text-gray-400">Keep voting for other albums.</P>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'preview') {
    return (
      <Card>
        <CardContent className="p-4 space-y-4">
          <H4>Album Details</H4>
          <P className="text-sm text-gray-400">Enter the album info manually</P>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Album Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Dark Side of the Moon"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Artist *</label>
              <Input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g., Pink Floyd"
              />
            </div>
          </div>

          <div className="flex gap-4 items-center p-3 bg-gray-900 rounded-lg">
            <div
              className="w-16 h-16 rounded-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            />
            <div className="flex-1">
              <P className="font-bold text-white">{title || 'Album Title'}</P>
              <P className="text-gray-400">{artist || 'Artist'}</P>
            </div>
          </div>

          <P className="text-xs text-gray-500">
            You've submitted {submissionsUsed + 1}/{maxSubmissions} albums this cycle
          </P>

          {error && <P className="text-red-500 text-sm">{error}</P>}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim() || !artist.trim()}>
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
            <P>2. Tap ••• → Share → Copy Link</P>
            <P>3. Paste above</P>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleNext}>Next</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

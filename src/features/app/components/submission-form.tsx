'use client';

import { useState } from 'react';
import { Card, CardContent, H4, P, Button, Input } from '@neynar/ui';
import { MOCK_PREVIEW_ALBUM } from '@/data/mocks';

interface SubmissionFormProps {
  onClose: () => void;
  submissionsUsed: number;
  maxSubmissions: number;
}

export function SubmissionForm({ onClose, submissionsUsed, maxSubmissions }: SubmissionFormProps) {
  const [step, setStep] = useState<'input' | 'preview' | 'success'>('input');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePaste = () => {
    if (!spotifyUrl.includes('spotify.com/album')) {
      setError('Please paste a Spotify album link');
      return;
    }
    setError(null);
    setStep('preview');
  };

  const handleSubmit = () => {
    setStep('success');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (step === 'success') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-3xl">✓</p>
            <P className="font-bold text-white">{MOCK_PREVIEW_ALBUM.title} submitted!</P>
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
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="font-medium text-white">Album Found</span>
          </div>

          <div className="flex gap-4 items-center">
            <div
              className="w-20 h-20 rounded-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #264653 0%, #2a9d8f 100%)' }}
            />
            <div>
              <P className="font-bold text-white">{MOCK_PREVIEW_ALBUM.title}</P>
              <P className="text-gray-400">{MOCK_PREVIEW_ALBUM.artist}</P>
            </div>
          </div>

          <P className="text-xs text-gray-500">
            You've submitted {submissionsUsed + 1}/{maxSubmissions} albums this cycle
          </P>

          <div className="flex gap-2">
            <Button onClick={handleSubmit}>Submit Album</Button>
            <Button variant="outline" onClick={() => setStep('input')}>Back</Button>
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

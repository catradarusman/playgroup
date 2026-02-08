'use client';

import { useState } from 'react';
import { Card, CardContent, H4, P, Button, Textarea } from '@neynar/ui';

interface ReviewFormProps {
  albumTitle: string;
  tracks: string[];
  onClose: () => void;
}

export function ReviewForm({ albumTitle, tracks, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [favoriteTrack, setFavoriteTrack] = useState('');
  const [hasListened, setHasListened] = useState(false);

  const minChars = 50;
  const charCount = text.length;

  return (
    <Card>
      <CardContent className="p-4">
        <H4>Review: {albumTitle}</H4>
        <div className="space-y-4 mt-3">
          {/* Listened checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasListened}
              onChange={(e) => setHasListened(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-white">I've listened to the full album</span>
          </label>

          {/* Rating */}
          <div>
            <P className="text-sm text-gray-400 mb-2">Your Rating</P>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`w-10 h-10 rounded-lg text-lg font-medium transition-colors ${
                    n <= rating
                      ? 'bg-white text-black border-2 border-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {rating > 0 && <P className="text-sm mt-1 text-gray-500">{rating}/5</P>}
          </div>

          {/* Review text */}
          <div>
            <P className="text-sm text-gray-400 mb-2">Your Thoughts</P>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did you think of this album? (minimum 50 characters)"
              className="bg-gray-900 border-gray-700 text-white"
            />
            <P className={`text-xs mt-1 ${charCount < minChars ? 'text-orange-500' : 'text-green-500'}`}>
              {charCount}/{minChars} characters
            </P>
          </div>

          {/* Favorite track */}
          <div>
            <P className="text-sm text-gray-400 mb-2">Favorite Track (optional)</P>
            <select
              value={favoriteTrack}
              onChange={(e) => setFavoriteTrack(e.target.value)}
              className="w-full p-2 rounded border bg-gray-900 border-gray-700 text-white text-sm"
            >
              <option value="">Select a track...</option>
              {tracks.map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button onClick={onClose}>Submit Review</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

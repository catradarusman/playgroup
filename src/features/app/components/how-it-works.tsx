'use client';

import { Card, CardContent, H4, P } from '@neynar/ui';

export function HowItWorks() {
  return (
    <Card>
      <CardContent className="p-4">
        <H4>How It Works</H4>
        <div className="mt-3 space-y-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 border border-gray-700">
              1
            </div>
            <div>
              <P className="font-medium text-sm text-white">Submit & Vote</P>
              <P className="text-xs text-gray-400">Mon-Fri: Share Spotify albums, upvote favorites</P>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 border border-gray-700">
              2
            </div>
            <div>
              <P className="font-medium text-sm text-white">Listen Together</P>
              <P className="text-xs text-gray-400">Sat-Fri: Winner announced, everyone listens</P>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 border border-gray-700">
              3
            </div>
            <div>
              <P className="font-medium text-sm text-white">Review & Repeat</P>
              <P className="text-xs text-gray-400">Write your thoughts, start again Monday</P>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

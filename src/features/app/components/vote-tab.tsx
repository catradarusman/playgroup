'use client';

import { useState } from 'react';
import { Card, CardContent, H3, P, Button } from '@neynar/ui';
import { MOCK_CYCLE_STATE, MOCK_SUBMISSIONS } from '@/data/mocks';
import type { Submission } from '@/features/app/types';
import { SubmissionForm } from './submission-form';

export function VoteTab() {
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const { phase, daysLeftInPhase, hoursLeft, minutesLeft, userSubmissionsThisCycle, maxSubmissionsPerCycle } =
    MOCK_CYCLE_STATE;

  const canVote = phase === 'voting';
  const canSubmit = canVote && userSubmissionsThisCycle < maxSubmissionsPerCycle;
  const totalVotes = submissions.reduce((sum, s) => sum + s.votes, 0);

  const handleVote = (id: number) => {
    setSubmissions(submissions.map((s) => (s.id === id ? { ...s, votes: s.votes + 1, hasVoted: true } : s)));
  };

  if (showSubmitForm) {
    return (
      <div className="space-y-4">
        <SubmissionForm
          onClose={() => setShowSubmitForm(false)}
          submissionsUsed={userSubmissionsThisCycle}
          maxSubmissions={maxSubmissionsPerCycle}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voting Header */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <H3>Vote for Next Album</H3>
            {canVote ? (
              <>
                <P className="text-lg font-bold text-orange-500">
                  {daysLeftInPhase}d {hoursLeft}h {minutesLeft}m
                </P>
                <P className="text-xs text-gray-500">
                  {submissions.length} albums • {totalVotes} total votes
                </P>
              </>
            ) : (
              <P className="text-sm text-gray-400">Voting opens Monday • See current standings</P>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      {canSubmit && (
        <Button className="w-full" onClick={() => setShowSubmitForm(true)}>
          + Submit an Album ({userSubmissionsThisCycle}/{maxSubmissionsPerCycle} used)
        </Button>
      )}
      {canVote && !canSubmit && (
        <div className="text-center py-2">
          <P className="text-sm text-gray-500">
            You've submitted {maxSubmissionsPerCycle}/{maxSubmissionsPerCycle} albums this cycle
          </P>
        </div>
      )}

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-4">
              <P className="text-3xl mb-2">🎵</P>
              <P className="text-gray-400">No submissions yet</P>
              <P className="text-sm text-gray-500">Be the first to submit an album!</P>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {submissions
            .sort((a, b) => b.votes - a.votes)
            .map((album, index) => (
              <Card key={album.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-600 w-6">#{index + 1}</div>
                    <div className="w-12 h-12 rounded bg-gradient-to-br from-indigo-400 to-purple-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <P className="font-medium text-sm text-white truncate">{album.title}</P>
                      <P className="text-xs text-gray-400">{album.artist}</P>
                      <P className="text-xs text-gray-600">
                        @{album.submitter} • {album.daysAgo}d ago
                      </P>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      {canVote ? (
                        <Button
                          variant={album.hasVoted ? 'secondary' : 'default'}
                          size="sm"
                          onClick={() => !album.hasVoted && handleVote(album.id)}
                          disabled={album.hasVoted}
                        >
                          {album.hasVoted ? '✓' : '▲'}
                        </Button>
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center text-gray-500">
                          ▲
                        </div>
                      )}
                      <span className="text-sm font-medium text-white">{album.votes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {!canVote && (
        <div className="text-center py-2">
          <P className="text-sm text-gray-500">🗳️ Voting opens Monday</P>
        </div>
      )}
    </div>
  );
}

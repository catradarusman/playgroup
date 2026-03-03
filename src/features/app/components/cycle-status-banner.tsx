'use client';

import type { CyclePhase, Countdown } from '@/features/app/types';

interface CycleStatusBannerProps {
  phase: CyclePhase;
  countdown: Countdown;
  reviewOpensAt?: Date | null;
  isReviewOpen?: boolean;
}

export function CycleStatusBanner({ phase, countdown, reviewOpensAt, isReviewOpen }: CycleStatusBannerProps) {
  const countdownText = `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`;

  if (phase === 'voting') {
    return (
      <div className="bg-gray-900 border border-red-500/30 rounded-lg p-3 text-center">
        <p className="font-bold text-red-500">VOTING OPEN</p>
        <p className="text-sm text-gray-400">Closes in {countdownText}</p>
      </div>
    );
  }

  // Listening phase + review window open
  if (isReviewOpen) {
    return (
      <div className="bg-gray-900 border border-red-500/30 rounded-lg p-3 text-center">
        <p className="font-bold text-red-500">REVIEW OPEN</p>
        <p className="text-sm text-gray-400">{countdownText} left to score</p>
      </div>
    );
  }

  // Listening phase — reviews not yet open
  let reviewCountdownText = '';
  if (reviewOpensAt) {
    const now = new Date();
    const diff = reviewOpensAt.getTime() - now.getTime();
    if (diff > 0) {
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      reviewCountdownText = `${d}d ${h}h ${m}m`;
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-center">
      <p className="font-bold text-white">LISTENING WEEK</p>
      <p className="text-sm text-gray-400">{countdownText} left to listen</p>
      {reviewCountdownText && (
        <p className="text-xs text-gray-500 mt-1">Reviews open in {reviewCountdownText}</p>
      )}
    </div>
  );
}

'use client';

import type { CyclePhase, Countdown } from '@/features/app/types';

interface CycleStatusBannerProps {
  phase: CyclePhase;
  countdown: Countdown;
}

export function CycleStatusBanner({ phase, countdown }: CycleStatusBannerProps) {
  const statusConfig = {
    voting: {
      label: '🗳️ Voting Open',
      color: 'from-amber-500 to-orange-500',
    },
    listening: {
      label: '🎧 Listening Week',
      color: 'from-purple-500 to-pink-500',
    },
  };

  const config = statusConfig[phase];
  const countdownText = `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`;

  return (
    <div className={`bg-gradient-to-r ${config.color} rounded-lg p-3 text-white text-center`}>
      <p className="font-bold">{config.label}</p>
      <p className="text-sm opacity-90">
        {phase === 'voting' ? `Closes in ${countdownText}` : `${countdownText} left to listen`}
      </p>
    </div>
  );
}

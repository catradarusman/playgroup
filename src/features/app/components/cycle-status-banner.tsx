'use client';

import type { CyclePhase, Countdown } from '@/features/app/types';

interface CycleStatusBannerProps {
  phase: CyclePhase;
  countdown: Countdown;
}

export function CycleStatusBanner({ phase, countdown }: CycleStatusBannerProps) {
  const statusConfig = {
    voting: {
      label: 'VOTING OPEN',
      bgColor: 'bg-gray-900',
      accentColor: 'text-red-500',
      borderColor: 'border-red-500/30',
    },
    listening: {
      label: 'LISTENING WEEK',
      bgColor: 'bg-gray-900',
      accentColor: 'text-white',
      borderColor: 'border-gray-700',
    },
  };

  const config = statusConfig[phase];
  const countdownText = `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-3 text-center`}>
      <p className={`font-bold ${config.accentColor}`}>{config.label}</p>
      <p className="text-sm text-gray-400">
        {phase === 'voting' ? `Closes in ${countdownText}` : `${countdownText} left to listen`}
      </p>
    </div>
  );
}

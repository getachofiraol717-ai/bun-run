import React from 'react';
import { UserPresenceState } from '../types';

interface PresenceIndicatorProps {
  state?: UserPresenceState;
  size?: 'sm' | 'md' | 'lg';
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ state = 'online', size = 'sm' }) => {
  const sizeClasses =
    size === 'lg' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2';

  const colorClasses =
    state === 'online'
      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
      : state === 'studying'
      ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
      : state === 'away'
      ? 'bg-amber-500'
      : state === 'busy'
      ? 'bg-rose-500'
      : 'bg-muted-foreground/40';

  return (
    <span
      className={`inline-block rounded-full ${sizeClasses} ${colorClasses} shrink-0`}
      title={`Status: ${state}`}
    />
  );
};

/**
 * timerUtils.ts
 *
 * Utility functions for timer operations.
 */

/**
 * Format seconds to time string
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds to human readable
 */
export function formatTimeHuman(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    const hourStr = `${hours} hour${hours !== 1 ? 's' : ''}`;
    const minStr = minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : '';
    return hourStr + minStr;
  }

  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Parse time string to seconds
 */
export function parseTime(timeString: string): number {
  const parts = timeString.split(':').map(Number);

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }

  return 0;
}

/**
 * Calculate time percentage
 */
export function calculateTimePercentage(remaining: number, total: number): number {
  if (total === 0) return 0;
  return Math.max(0, Math.min(100, (remaining / total) * 100));
}

/**
 * Determine timer status
 */
export function getTimerStatus(
  remaining: number,
  total: number
): 'normal' | 'warning' | 'critical' | 'expired' {
  const percentage = calculateTimePercentage(remaining, total);

  if (remaining <= 0) return 'expired';
  if (percentage <= 5 || remaining <= 30) return 'critical';
  if (percentage <= 25 || remaining <= 300) return 'warning';
  return 'normal';
}

/**
 * Get timer warning message
 */
export function getTimerWarningMessage(remaining: number): string {
  if (remaining <= 0) return 'Time is up!';
  if (remaining <= 10) return '10 seconds remaining!';
  if (remaining <= 30) return '30 seconds remaining!';
  if (remaining <= 60) return '1 minute remaining!';
  if (remaining <= 300) return '5 minutes remaining!';
  if (remaining <= 600) return '10 minutes remaining!';
  return '';
}

/**
 * Get timer color based on status
 */
export function getTimerColor(status: 'normal' | 'warning' | 'critical' | 'expired'): string {
  switch (status) {
    case 'critical':
    case 'expired':
      return '#ef4444'; // Red
    case 'warning':
      return '#f97316'; // Orange
    case 'normal':
    default:
      return '#22c55e'; // Green
  }
}

/**
 * Calculate average time per question
 */
export function calculateAverageTimePerQuestion(
  totalTime: number,
  questionCount: number
): number {
  if (questionCount === 0) return 0;
  return Math.round(totalTime / questionCount);
}

/**
 * Estimate time remaining based on pace
 */
export function estimateTimeRemaining(
  answeredCount: number,
  totalQuestions: number,
  remainingTime: number
): {
  onTrack: boolean;
  suggestedPace: number;
  extraTimeNeeded: number;
} {
  if (answeredCount === 0 || totalQuestions === 0) {
    return { onTrack: true, suggestedPace: 0, extraTimeNeeded: 0 };
  }

  const averageTimePerAnswered = remainingTime / (totalQuestions - answeredCount);
  const expectedTimePerQuestion = remainingTime / (totalQuestions - answeredCount);
  const currentPace = remainingTime / (totalQuestions - answeredCount);

  const onTrack = Math.abs(currentPace - expectedTimePerQuestion) < 30;

  return {
    onTrack,
    suggestedPace: Math.round(averageTimePerAnswered),
    extraTimeNeeded: 0
  };
}

/**
 * Get warning thresholds
 */
export function getWarningThresholds(): { seconds: number; message: string }[] {
  return [
    { seconds: 600, message: '10 minutes remaining' },
    { seconds: 300, message: '5 minutes remaining' },
    { seconds: 60, message: '1 minute remaining' },
    { seconds: 30, message: '30 seconds remaining' },
    { seconds: 10, message: '10 seconds remaining' }
  ];
}

/**
 * Check if threshold is reached
 */
export function isThresholdReached(
  remaining: number,
  previousRemaining: number,
  thresholds: number[]
): number | null {
  for (const threshold of thresholds) {
    if (previousRemaining > threshold && remaining <= threshold) {
      return threshold;
    }
  }
  return null;
}

/**
 * Format timer for display
 */
export function formatTimerDisplay(
  remaining: number,
  showHours: boolean = false
): {
  hours: string;
  minutes: string;
  seconds: string;
  formatted: string;
  progress: number;
} {
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  let formatted: string;
  if (showHours || hours > 0) {
    formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return {
    hours: hours.toString(),
    minutes: minutes.toString(),
    seconds: seconds.toString(),
    formatted,
    progress: remaining > 0 ? 100 : 0
  };
}

/**
 * Calculate session time statistics
 */
export function calculateSessionStats(
  timePerQuestion: Record<string, number>
): {
  totalTime: number;
  averageTime: number;
  fastestQuestion: string;
  slowestQuestion: string;
  questionsOverTime: string[];
} {
  const entries = Object.entries(timePerQuestion);

  if (entries.length === 0) {
    return {
      totalTime: 0,
      averageTime: 0,
      fastestQuestion: '',
      slowestQuestion: '',
      questionsOverTime: []
    };
  }

  const totalTime = entries.reduce((sum, [, time]) => sum + time, 0);
  const averageTime = totalTime / entries.length;

  const sorted = entries.sort((a, b) => a[1] - b[1]);
  const fastestQuestion = sorted[0][0];
  const slowestQuestion = sorted[sorted.length - 1][0];
  const questionsOverTime = entries
    .filter(([, time]) => time > averageTime * 1.5)
    .map(([id]) => id);

  return {
    totalTime,
    averageTime: Math.round(averageTime),
    fastestQuestion,
    slowestQuestion,
    questionsOverTime
  };
}

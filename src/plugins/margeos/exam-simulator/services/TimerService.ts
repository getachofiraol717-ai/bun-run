// @ts-nocheck
/**
 * TimerService.ts
 *
 * Service for managing exam timers with visual feedback,
 * warnings, and time tracking.
 */

import { TimedAssessmentEngine, TimerState, TimerEvent } from '../core/TimedAssessmentEngine';
import { examStorage } from '../store/examSimulatorStore';

export interface TimerDisplay {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  percentage: number;
  status: 'normal' | 'warning' | 'critical' | 'expired';
}

export interface TimerWarning {
  level: 'info' | 'warning' | 'critical';
  threshold: number;
  message: string;
}

class TimerService {
  private static instance: TimerService;
  private engine: TimedAssessmentEngine;
  private warningThresholds: TimerWarning[] = [
    { level: 'info', threshold: 600, message: '10 minutes remaining' },
    { level: 'warning', threshold: 300, message: '5 minutes remaining' },
    { level: 'warning', threshold: 60, message: '1 minute remaining' },
    { level: 'critical', threshold: 30, message: '30 seconds remaining' },
    { level: 'critical', threshold: 10, message: 'Time almost up!' }
  ];
  private listeners: Map<string, (display: TimerDisplay) => void> = new Map();

  private constructor() {
    this.engine = TimedAssessmentEngine.getInstance();
  }

  static getInstance(): TimerService {
    if (!TimerService.instance) {
      TimerService.instance = new TimerService();
    }
    return TimerService.instance;
  }

  /**
   * Start a timer for a session
   */
  startTimer(
    sessionId: string,
    durationSeconds: number,
    onTick?: (display: TimerDisplay) => void,
    onWarning?: (warning: TimerWarning) => void,
    onExpired?: () => void
  ): void {
    const notifiedWarnings = new Set<number>();

    this.engine.startTimer(
      sessionId,
      durationSeconds,
      { warningThresholds: this.warningThresholds.map(w => w.threshold) },
      (state: TimerState, event: TimerEvent) => {
        const display = this.getDisplay(state);

        // Notify tick listener
        if (onTick) {
          onTick(display);
        }

        // Notify global listeners
        const listener = this.listeners.get(sessionId);
        if (listener) {
          listener(display);
        }

        // Check for warning notifications
        if (event.type === 'warning') {
          const warning = this.warningThresholds.find(w => w.threshold === state.remainingTime);
          if (warning && !notifiedWarnings.has(warning.threshold)) {
            notifiedWarnings.add(warning.threshold);
            if (onWarning) {
              onWarning(warning);
            }
          }
        }

        // Handle expiration
        if (event.type === 'expired') {
          if (onExpired) {
            onExpired();
          }
        }
      }
    );
  }

  /**
   * Pause the timer
   */
  pauseTimer(sessionId: string): TimerState | null {
    return this.engine.pauseTimer(sessionId);
  }

  /**
   * Resume the timer
   */
  resumeTimer(sessionId: string): TimerState | null {
    return this.engine.resumeTimer(sessionId);
  }

  /**
   * Stop the timer
   */
  stopTimer(sessionId: string): void {
    this.engine.stopTimer(sessionId);
    this.listeners.delete(sessionId);
  }

  /**
   * Add time to the timer
   */
  addTime(sessionId: string, seconds: number): TimerState | null {
    return this.engine.addTime(sessionId, seconds);
  }

  /**
   * Get current timer display
   */
  getDisplay(sessionId: string): TimerDisplay | null {
    const state = this.engine.getTimerState(sessionId);
    if (!state) return null;

    return this.getDisplayFromState(state);
  }

  /**
   * Format time as human-readable string
   */
  formatTime(seconds: number): string {
    return this.engine.formatTime(seconds);
  }

  /**
   * Register a listener for timer updates
   */
  onTimerUpdate(sessionId: string, callback: (display: TimerDisplay) => void): () => void {
    this.listeners.set(sessionId, callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(sessionId);
    };
  }

  /**
   * Get timer events for a session
   */
  getEvents(sessionId: string): TimerEvent[] {
    return this.engine.getTimerEvents(sessionId);
  }

  /**
   * Get time analytics for a session
   */
  getAnalytics(sessionId: string) {
    return this.engine.getTimeAnalytics(sessionId);
  }

  /**
   * Stop all active timers
   */
  stopAllTimers(): void {
    this.engine.stopAllTimers();
    this.listeners.clear();
  }

  /**
   * Get warning thresholds
   */
  getWarningThresholds(): TimerWarning[] {
    return [...this.warningThresholds];
  }

  /**
   * Set custom warning thresholds
   */
  setWarningThresholds(thresholds: TimerWarning[]): void {
    this.warningThresholds = thresholds.sort((a, b) => b.threshold - a.threshold);
  }

  /**
   * Calculate remaining time percentage
   */
  private calculatePercentage(remaining: number, total: number): number {
    if (total === 0) return 0;
    return Math.max(0, Math.min(100, (remaining / total) * 100));
  }

  /**
   * Determine timer status based on remaining time
   */
  private determineStatus(remaining: number, total: number): TimerDisplay['status'] {
    const percentage = this.calculatePercentage(remaining, total);

    if (remaining <= 0) return 'expired';
    if (percentage <= 5) return 'critical';
    if (percentage <= 25) return 'warning';
    return 'normal';
  }

  /**
   * Convert state to display format
   */
  private getDisplayFromState(state: TimerState): TimerDisplay {
    const remaining = Math.max(0, state.remainingTime);

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    return {
      hours,
      minutes,
      seconds,
      formatted: this.engine.formatTime(remaining),
      percentage: state.totalDuration > 0
        ? this.calculatePercentage(remaining, state.totalDuration)
        : 0,
      status: this.determineStatus(remaining, state.totalDuration)
    };
  }
}

export const timerService = TimerService.getInstance();
export default timerService;

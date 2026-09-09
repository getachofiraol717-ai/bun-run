// @ts-nocheck
/**
 * TimedAssessmentEngine.ts
 *
 * Manages timed exams with automatic time tracking, warnings, and auto-submit functionality.
 * Provides countdown timers, pause functionality, and time analytics.
 */

import type { Exam, ExamSession, ExamSettings } from '../models';
import { examStorage } from '../store/examSimulatorStore';

export interface TimerConfig {
  totalDuration: number; // in seconds
  warningThresholds: number[]; // in seconds
  enableAutoSubmit: boolean;
  enablePause: boolean;
  maxPauseDuration: number; // in seconds
}

export interface TimerState {
  remainingTime: number;
  isRunning: boolean;
  isPaused: boolean;
  totalPausedTime: number;
  lastUpdate: string;
  pauseHistory: { start: string; duration: number }[];
}

export interface TimerEvent {
  type: 'warning' | 'pause' | 'resume' | 'expired' | 'checkpoint';
  timestamp: string;
  remainingTime: number;
  message?: string;
}

type TimerCallback = (state: TimerState, event: TimerEvent) => void;

const DEFAULT_TIMER_CONFIG: TimerConfig = {
  totalDuration: 3600,
  warningThresholds: [600, 300, 60, 30, 10], // 10min, 5min, 1min, 30sec, 10sec
  enableAutoSubmit: true,
  enablePause: true,
  maxPauseDuration: 300 // 5 minutes max total pause
};

export class TimedAssessmentEngine {
  private static instance: TimedAssessmentEngine;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private timerStates: Map<string, TimerState> = new Map();
  private timerCallbacks: Map<string, TimerCallback[]> = new Map();
  private timerEvents: Map<string, TimerEvent[]> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): TimedAssessmentEngine {
    if (!TimedAssessmentEngine.instance) {
      TimedAssessmentEngine.instance = new TimedAssessmentEngine();
    }
    return TimedAssessmentEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Restore any active timers from storage
    const activeSessions = examStorage.getActiveSessions();
    activeSessions.forEach(session => {
      if (session.remainingTime && session.remainingTime > 0) {
        this.restoreTimer(session.id, session.remainingTime);
      }
    });

    this.initialized = true;
  }

  /**
   * Start a timer for an exam session
   */
  startTimer(
    sessionId: string,
    duration: number,
    config?: Partial<TimerConfig>,
    callback?: TimerCallback
  ): TimerState {
    // Stop existing timer if any
    this.stopTimer(sessionId);

    const timerConfig: TimerConfig = { ...DEFAULT_TIMER_CONFIG, ...config, totalDuration: duration };

    const state: TimerState = {
      remainingTime: duration,
      isRunning: true,
      isPaused: false,
      totalPausedTime: 0,
      lastUpdate: new Date().toISOString(),
      pauseHistory: []
    };

    this.timerStates.set(sessionId, state);

    if (callback) {
      const callbacks = this.timerCallbacks.get(sessionId) || [];
      callbacks.push(callback);
      this.timerCallbacks.set(sessionId, callbacks);
    }

    // Initialize events array
    this.timerEvents.set(sessionId, []);

    // Start the countdown
    this.startCountdown(sessionId, timerConfig);

    return state;
  }

  /**
   * Pause the timer
   */
  pauseTimer(sessionId: string): TimerState | null {
    const state = this.timerStates.get(sessionId);
    const timer = this.timers.get(sessionId);

    if (!state || !timer) return null;

    if (!state.isPaused && state.isRunning) {
      clearInterval(timer);
      this.timers.delete(sessionId);

      state.isPaused = true;
      state.lastUpdate = new Date().toISOString();

      this.emitEvent(sessionId, {
        type: 'pause',
        timestamp: state.lastUpdate,
        remainingTime: state.remainingTime,
        message: 'Timer paused'
      });

      // Update session in storage
      this.updateSessionTime(sessionId, state.remainingTime);
    }

    return state;
  }

  /**
   * Resume the timer
   */
  resumeTimer(sessionId: string, config?: Partial<TimerConfig>): TimerState | null {
    const state = this.timerStates.get(sessionId);

    if (!state) return null;

    if (state.isPaused) {
      const pauseDuration = Math.floor(
        (new Date().getTime() - new Date(state.lastUpdate).getTime()) / 1000
      );

      state.pauseHistory.push({
        start: state.lastUpdate,
        duration: pauseDuration
      });
      state.totalPausedTime += pauseDuration;

      state.isPaused = false;
      state.lastUpdate = new Date().toISOString();

      this.emitEvent(sessionId, {
        type: 'resume',
        timestamp: state.lastUpdate,
        remainingTime: state.remainingTime,
        message: 'Timer resumed'
      });

      // Restart countdown with remaining time
      const timerConfig: TimerConfig = { ...DEFAULT_TIMER_CONFIG, ...config, totalDuration: state.remainingTime };
      this.startCountdown(sessionId, timerConfig);
    }

    return state;
  }

  /**
   * Stop and remove the timer
   */
  stopTimer(sessionId: string): void {
    const timer = this.timers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(sessionId);
    }

    const state = this.timerStates.get(sessionId);
    if (state) {
      state.isRunning = false;
      state.lastUpdate = new Date().toISOString();
    }
  }

  /**
   * Add time to the timer (for accessibility or bonus time)
   */
  addTime(sessionId: string, seconds: number): TimerState | null {
    const state = this.timerStates.get(sessionId);

    if (!state || !state.isRunning) return null;

    state.remainingTime += seconds;
    state.lastUpdate = new Date().toISOString();

    this.emitEvent(sessionId, {
      type: 'checkpoint',
      timestamp: state.lastUpdate,
      remainingTime: state.remainingTime,
      message: `Added ${seconds} seconds`
    });

    this.updateSessionTime(sessionId, state.remainingTime);

    return state;
  }

  /**
   * Get current timer state
   */
  getTimerState(sessionId: string): TimerState | null {
    return this.timerStates.get(sessionId) || null;
  }

  /**
   * Get all timer events for a session
   */
  getTimerEvents(sessionId: string): TimerEvent[] {
    return this.timerEvents.get(sessionId) || [];
  }

  /**
   * Get time analytics for a session
   */
  getTimeAnalytics(sessionId: string): {
    totalTime: number;
    usedTime: number;
    remainingTime: number;
    averageTimePerQuestion: number;
    timeDistribution: { questionId: string; timeSpent: number }[];
    pace: 'ahead' | 'on_track' | 'behind';
  } | null {
    const state = this.timerStates.get(sessionId);
    const session = examStorage.getSession(sessionId);

    if (!state || !session) return null;

    const usedTime = state.totalDuration - state.remainingTime - state.totalPausedTime;
    const totalQuestions = session.answers.length;
    const averageTimePerQuestion = totalQuestions > 0 ? usedTime / totalQuestions : 0;

    // Calculate pace based on progress
    const expectedProgress = usedTime / state.totalDuration;
    const actualProgress = totalQuestions / (session.exam?.questions?.length || 1);

    let pace: 'ahead' | 'on_track' | 'behind';
    if (actualProgress > expectedProgress + 0.1) {
      pace = 'ahead';
    } else if (actualProgress < expectedProgress - 0.1) {
      pace = 'behind';
    } else {
      pace = 'on_track';
    }

    return {
      totalTime: state.totalDuration,
      usedTime,
      remainingTime: state.remainingTime,
      averageTimePerQuestion,
      timeDistribution: session.answers.map(a => ({
        questionId: a.questionId,
        timeSpent: a.timeSpent || 0
      })),
      pace
    };
  }

  /**
   * Stop all active timers
   */
  stopAllTimers(): void {
    this.timers.forEach((timer, sessionId) => {
      clearInterval(timer);
    });
    this.timers.clear();
  }

  /**
   * Format time as string
   */
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Parse time string to seconds
   */
  parseTime(timeString: string): number {
    const parts = timeString.split(':').map(Number);

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }

    return 0;
  }

  private startCountdown(sessionId: string, config: TimerConfig): void {
    const state = this.timerStates.get(sessionId);
    if (!state) return;

    const interval = setInterval(() => {
      const currentState = this.timerStates.get(sessionId);
      if (!currentState || !currentState.isRunning || currentState.isPaused) {
        clearInterval(interval);
        return;
      }

      currentState.remainingTime -= 1;
      currentState.lastUpdate = new Date().toISOString();

      // Check warning thresholds
      if (config.warningThresholds.includes(currentState.remainingTime)) {
        this.emitEvent(sessionId, {
          type: 'warning',
          timestamp: currentState.lastUpdate,
          remainingTime: currentState.remainingTime,
          message: this.getWarningMessage(currentState.remainingTime)
        });
      }

      // Auto-submit if time expired
      if (currentState.remainingTime <= 0) {
        clearInterval(interval);
        this.timers.delete(sessionId);
        currentState.remainingTime = 0;
        currentState.isRunning = false;

        this.emitEvent(sessionId, {
          type: 'expired',
          timestamp: currentState.lastUpdate,
          remainingTime: 0,
          message: 'Time expired - Auto-submitting'
        });

        if (config.enableAutoSubmit) {
          examStorage.autoSubmitSession(sessionId);
        }
      }

      // Notify callbacks
      this.notifyCallbacks(sessionId, currentState);

    }, 1000);

    this.timers.set(sessionId, interval);
  }

  private emitEvent(sessionId: string, event: TimerEvent): void {
    const events = this.timerEvents.get(sessionId) || [];
    events.push(event);
    this.timerEvents.set(sessionId, events);
  }

  private notifyCallbacks(sessionId: string, state: TimerState): void {
    const callbacks = this.timerCallbacks.get(sessionId) || [];
    const latestEvent = this.timerEvents.get(sessionId)?.slice(-1)[0];

    callbacks.forEach(callback => {
      callback(state, latestEvent || {
        type: 'checkpoint',
        timestamp: state.lastUpdate,
        remainingTime: state.remainingTime
      });
    });
  }

  private getWarningMessage(remainingSeconds: number): string {
    if (remainingSeconds >= 600) return '10 minutes remaining';
    if (remainingSeconds >= 300) return '5 minutes remaining';
    if (remainingSeconds >= 60) return '1 minute remaining';
    if (remainingSeconds >= 30) return '30 seconds remaining';
    if (remainingSeconds >= 10) return '10 seconds remaining';
    return 'Time almost up!';
  }

  private updateSessionTime(sessionId: string, remainingTime: number): void {
    const session = examStorage.getSession(sessionId);
    if (session) {
      examStorage.updateSession(sessionId, { remainingTime });
    }
  }

  private restoreTimer(sessionId: string, remainingTime: number): void {
    const state: TimerState = {
      remainingTime,
      isRunning: true,
      isPaused: false,
      totalPausedTime: 0,
      lastUpdate: new Date().toISOString(),
      pauseHistory: []
    };

    this.timerStates.set(sessionId, state);
  }
}

export default TimedAssessmentEngine;

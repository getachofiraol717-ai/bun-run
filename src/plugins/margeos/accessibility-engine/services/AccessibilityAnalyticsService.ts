// @ts-nocheck
// Accessibility Engine — Accessibility Analytics Service
// Tracks and analyzes accessibility usage

import type { AccessibilityProfile } from "../models/AccessibilityProfile";
import type { AccessibilitySession } from "../models/AccessibilitySession";

export interface AnalyticsEvent {
  type: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface UsageMetrics {
  totalSessions: number;
  totalDuration: number;
  featuresUsed: Map<string, number>;
  barriersEncountered: number;
  barriersResolved: number;
  mostUsedProfile: string | null;
  averageSessionLength: number;
}

export interface BarrierMetrics {
  type: string;
  encountered: number;
  resolved: number;
  resolutionRate: number;
  averageResolutionTime: number;
}

export class AccessibilityAnalyticsService {
  private static instance: AccessibilityAnalyticsService;
  private profile: AccessibilityProfile | null = null;
  private events: AnalyticsEvent[] = [];
  private sessions: AccessibilitySession[] = [];
  private currentSession: AccessibilitySession | null = null;
  private listeners: Set<(event: AnalyticsEvent) => void> = new Set();
  private sessionListeners: Set<(session: AccessibilitySession | null) => void> = new Set();

  private constructor() {}

  static getInstance(): AccessibilityAnalyticsService {
    if (!AccessibilityAnalyticsService.instance) {
      AccessibilityAnalyticsService.instance = new AccessibilityAnalyticsService();
    }
    return AccessibilityAnalyticsService.instance;
  }

  initialize(profile: AccessibilityProfile | null): void {
    this.profile = profile;
    this.loadFromStorage();
  }

  // Storage
  private loadFromStorage(): void {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem("margeos_accessibility_analytics");
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.events || [];
        this.sessions = data.sessions || [];
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  }

  private saveToStorage(): void {
    if (typeof localStorage === "undefined") return;

    try {
      // Keep only last 1000 events
      const recentEvents = this.events.slice(-1000);
      // Keep only last 100 sessions
      const recentSessions = this.sessions.slice(-100);

      localStorage.setItem("margeos_accessibility_analytics", JSON.stringify({
        events: recentEvents,
        sessions: recentSessions
      }));
    } catch (error) {
      console.error("Failed to save analytics:", error);
    }
  }

  // Track event
  trackEvent(type: string, data: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now(),
      data
    };

    this.events.push(event);
    this.notifyListeners(event);

    // Update current session
    if (this.currentSession) {
      this.currentSession.barriersEncountered++;
      this.currentSession.lastActivity = new Date();
    }

    this.saveToStorage();
  }

  // Common event types
  trackFeatureUse(feature: string): void {
    this.trackEvent("feature_use", { feature });
  }

  trackBarrierEncounter(barrier: string, context?: Record<string, any>): void {
    this.trackEvent("barrier_encountered", { barrier, context });
  }

  trackBarrierResolution(barrier: string, resolution: string): void {
    this.trackEvent("barrier_resolved", { barrier, resolution });
  }

  trackProfileChange(from: string, to: string): void {
    this.trackEvent("profile_change", { from, to });
  }

  trackContentTransformed(contentType: string, method: string): void {
    this.trackEvent("content_transformed", { contentType, method });
  }

  trackAccessibilityCheck(type: string, passed: boolean): void {
    this.trackEvent("accessibility_check", { type, passed });
  }

  // Session management
  startSession(profileId: string): AccessibilitySession {
    this.endCurrentSession();

    const session: AccessibilitySession = {
      id: `session-${Date.now()}`,
      userId: "current",
      profileId,
      startTime: new Date(),
      lastActivity: new Date(),
      featuresEnabled: [],
      barriersEncountered: 0,
      barriersResolved: 0,
      contentViewed: 0,
      duration: 0
    };

    this.currentSession = session;
    this.sessions.push(session);
    this.saveToStorage();

    this.notifySessionListeners(session);
    return session;
  }

  endCurrentSession(): void {
    if (this.currentSession) {
      this.currentSession.duration = Date.now() - this.currentSession.startTime.getTime();
      this.saveToStorage();
      this.currentSession = null;
    }
  }

  getCurrentSession(): AccessibilitySession | null {
    return this.currentSession;
  }

  // Get all sessions
  getAllSessions(): AccessibilitySession[] {
    return [...this.sessions];
  }

  // Get sessions by profile
  getSessionsByProfile(profileId: string): AccessibilitySession[] {
    return this.sessions.filter(s => s.profileId === profileId);
  }

  // Get metrics
  getUsageMetrics(): UsageMetrics {
    const featuresUsed = new Map<string, number>();

    for (const event of this.events) {
      if (event.type === "feature_use") {
        const feature = event.data.feature;
        featuresUsed.set(feature, (featuresUsed.get(feature) || 0) + 1);
      }
    }

    const barrierEvents = this.events.filter(e =>
      e.type === "barrier_encountered" || e.type === "barrier_resolved"
    );

    const totalDuration = this.sessions.reduce((sum, s) => sum + s.duration, 0);

    // Find most used profile
    const profileCounts = new Map<string, number>();
    for (const session of this.sessions) {
      profileCounts.set(session.profileId, (profileCounts.get(session.profileId) || 0) + 1);
    }

    let mostUsedProfile: string | null = null;
    let maxCount = 0;
    for (const [profileId, count] of profileCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostUsedProfile = profileId;
      }
    }

    return {
      totalSessions: this.sessions.length,
      totalDuration,
      featuresUsed,
      barriersEncountered: barrierEvents.filter(e => e.type === "barrier_encountered").length,
      barriersResolved: barrierEvents.filter(e => e.type === "barrier_resolved").length,
      mostUsedProfile,
      averageSessionLength: this.sessions.length > 0 ? totalDuration / this.sessions.length : 0
    };
  }

  // Get barrier metrics
  getBarrierMetrics(): BarrierMetrics[] {
    const barrierMap = new Map<string, {
      encountered: number;
      resolved: number;
      firstEncounter: number;
      lastResolution: number;
    }>();

    for (const event of this.events) {
      if (event.type === "barrier_encountered") {
        const barrier = event.data.barrier;
        const existing = barrierMap.get(barrier) || {
          encountered: 0,
          resolved: 0,
          firstEncounter: event.timestamp,
          lastResolution: 0
        };
        existing.encountered++;
        existing.firstEncounter = Math.min(existing.firstEncounter, event.timestamp);
        barrierMap.set(barrier, existing);
      } else if (event.type === "barrier_resolved") {
        const barrier = event.data.barrier;
        const existing = barrierMap.get(barrier) || {
          encountered: 0,
          resolved: 0,
          firstEncounter: 0,
          lastResolution: 0
        };
        existing.resolved++;
        existing.lastResolution = Math.max(existing.lastResolution, event.timestamp);
        barrierMap.set(barrier, existing);
      }
    }

    const metrics: BarrierMetrics[] = [];

    for (const [type, data] of barrierMap) {
      metrics.push({
        type,
        encountered: data.encountered,
        resolved: data.resolved,
        resolutionRate: data.encountered > 0 ? data.resolved / data.encountered : 0,
        averageResolutionTime: data.resolved > 0 ?
          (data.lastResolution - data.firstEncounter) / data.resolved : 0
      });
    }

    return metrics.sort((a, b) => b.encountered - a.encountered);
  }

  // Get events
  getEvents(options?: {
    type?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
  }): AnalyticsEvent[] {
    let filtered = [...this.events];

    if (options?.type) {
      filtered = filtered.filter(e => e.type === options.type);
    }

    if (options?.startDate) {
      filtered = filtered.filter(e => e.timestamp >= options.startDate!);
    }

    if (options?.endDate) {
      filtered = filtered.filter(e => e.timestamp <= options.endDate!);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // Clear analytics
  clearAnalytics(): void {
    this.events = [];
    this.sessions = [];
    this.currentSession = null;
    this.saveToStorage();
  }

  // Export analytics
  exportAnalytics(): string {
    return JSON.stringify({
      events: this.events,
      sessions: this.sessions,
      metrics: this.getUsageMetrics(),
      barrierMetrics: this.getBarrierMetrics()
    }, null, 2);
  }

  // Subscribe to events
  subscribe(listener: (event: AnalyticsEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Subscribe to session changes
  subscribeToSession(listener: (session: AccessibilitySession | null) => void): () => void {
    this.sessionListeners.add(listener);
    return () => this.sessionListeners.delete(listener);
  }

  private notifyListeners(event: AnalyticsEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private notifySessionListeners(session: AccessibilitySession | null): void {
    for (const listener of this.sessionListeners) {
      listener(session);
    }
  }

  // Cleanup
  destroy(): void {
    this.endCurrentSession();
    this.events = [];
    this.sessions = [];
    this.listeners.clear();
    this.sessionListeners.clear();
  }
}

export const accessibilityAnalyticsService = AccessibilityAnalyticsService.getInstance();

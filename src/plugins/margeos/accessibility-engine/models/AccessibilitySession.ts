// Accessibility Engine — AccessibilitySession Models
// Session tracking and analytics

export type SessionEventType =
  | "page_view"
  | "feature_activated"
  | "feature_deactivated"
  | "content_accessed"
  | "barrier_encountered"
  | "preference_changed"
  | "error"
  | "navigation";

export interface AccessibilitySession {
  id: string;

  // User
  userId: string;
  profileId: string;
  profileType: string;

  // Session tracking
  startTime: Date;
  endTime?: Date;
  duration: number; // ms

  // Activity
  events: AccessibilitySessionEvent[];
  pageViews: number;
  featuresUsed: Set<string>;

  // Barriers
  barriers: BarrierEncounter[];

  // Preferences at session time
  activeFeatures: string[];
  settingsSnapshot: Record<string, any>;

  // Performance
  avgResponseTime: number; // ms
  successRate: number; // 0-1

  // Metadata
  userAgent: string;
  deviceType: string;
  platform: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface AccessibilitySessionEvent {
  id: string;

  // Timing
  timestamp: Date;
  sessionDuration: number; // ms from session start

  // Event details
  type: SessionEventType;
  category: string;
  action: string;
  label?: string;
  value?: number | string;

  // Context
  page?: string;
  component?: string;

  // Accessibility context
  accessibilityMode?: string;
  activeFeatures?: string[];

  // Performance
  performanceMetrics?: {
    loadTime?: number;
    responseTime?: number;
    interactionTime?: number;
  };

  // Metadata
  metadata?: Record<string, any>;
}

export interface BarrierEncounter {
  id: string;

  // Timing
  timestamp: Date;
  sessionDuration: number;

  // Barrier details
  barrierType: BarrierType;
  severity: "low" | "medium" | "high" | "critical";
  description: string;

  // Location
  page: string;
  component?: string;
  element?: string;

  // Impact
  impact: {
    blockedAction?: string;
    alternativeUsed?: string;
    workaround?: string;
    abandoned?: boolean;
  };

  // Resolution
  resolved: boolean;
  resolution?: string;

  // Device context
  deviceInfo: {
    screenReader?: string;
    browser?: string;
    os?: string;
    assistiveTechnology?: string[];
  };

  // Metadata
  screenshot?: string;
  sessionRecording?: string;
}

export type BarrierType =
  | "keyboard_navigation"
  | "screen_reader"
  | "caption"
  | "sign_language"
  | "audio_description"
  | "visual"
  | "motor"
  | "cognitive"
  | "braille"
  | "haptic"
  | "voice"
  | "content_quality"
  | "timing"
  | "other";

export interface AccessibilityAnalytics {
  // Overview
  totalSessions: number;
  totalUsers: number;
  activeUsers: number; // last 30 days

  // Usage metrics
  featureUsage: Record<string, FeatureUsageStats>;
  profileDistribution: Record<string, number>;

  // Performance
  avgSessionDuration: number;
  avgPageLoadTime: number;
  successRate: number;

  // Barriers
  totalBarriers: number;
  barrierByType: Record<BarrierType, number>;
  barrierBySeverity: Record<string, number>;
  resolvedBarriers: number;

  // User satisfaction
  satisfactionScore?: number;
  improvementAreas: string[];

  // Trends
  trends: {
    daily: DailyStats[];
    weekly: WeeklyStats[];
    monthly: MonthlyStats[];
  };

  // Period
  periodStart: Date;
  periodEnd: Date;

  generatedAt: Date;
}

export interface FeatureUsageStats {
  featureId: string;
  featureName: string;

  // Usage
  totalActivations: number;
  uniqueUsers: number;
  avgDuration: number; // ms per activation

  // Success
  successRate: number;
  errorCount: number;

  // Engagement
  avgTimeToActivation: number; // ms from page load
  avgUsagePerSession: number;

  // Trends
  trend: "increasing" | "stable" | "decreasing";
  trendPercentage: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  sessions: number;
  users: number;
  pageViews: number;
  barriers: number;
  featureUsage: Record<string, number>;
  avgSessionDuration: number;
}

export interface WeeklyStats {
  weekStart: string;
  sessions: number;
  users: number;
  pageViews: number;
  barriers: number;
  featureUsage: Record<string, number>;
  avgSessionDuration: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  sessions: number;
  users: number;
  pageViews: number;
  barriers: number;
  featureUsage: Record<string, number>;
  avgSessionDuration: number;
}

// Accessibility report
export interface AccessibilityReport {
  id: string;

  // Report info
  type: "individual" | "aggregate" | "barrier" | "performance" | "compliance";
  title: string;
  description?: string;

  // Data
  period: {
    start: Date;
    end: Date;
  };

  // Content
  summary: ReportSummary;
  sections: ReportSection[];

  // Metrics
  keyMetrics: KeyMetric[];

  // Recommendations
  recommendations: Recommendation[];

  // Actions taken
  actions: ReportAction[];

  // Status
  status: "draft" | "published" | "archived";

  // Access
  accessLevel: "private" | "team" | "organization" | "public";

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSummary {
  headline: string;
  keyFindings: string[];
  overallStatus: "good" | "needs_improvement" | "poor";
  progressScore?: number; // 0-100
}

export interface ReportSection {
  id: string;
  title: string;
  order: number;
  content: string;
  metrics: SectionMetric[];
  charts?: ChartData[];
}

export interface SectionMetric {
  name: string;
  value: number | string;
  unit?: string;
  change?: number; // percentage
  trend?: "up" | "down" | "stable";
}

export interface KeyMetric {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  category: string;
  status: "good" | "warning" | "critical";
  description?: string;
}

export interface ChartData {
  type: "bar" | "line" | "pie" | "table";
  title: string;
  data: any;
  options?: Record<string, any>;
}

export interface Recommendation {
  id: string;
  priority: "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "dismissed";
  assignee?: string;
  dueDate?: Date;
}

export interface ReportAction {
  id: string;
  type: "fix" | "improvement" | "investigation" | "monitoring";
  title: string;
  description: string;
  status: "planned" | "in_progress" | "completed";
  completedAt?: Date;
}

// Helper functions
export function createSession(userId: string, profileId: string, profileType: string): AccessibilitySession {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    profileId,
    profileType,
    startTime: new Date(),
    duration: 0,
    events: [],
    pageViews: 0,
    featuresUsed: new Set(),
    barriers: [],
    activeFeatures: [],
    settingsSnapshot: {},
    avgResponseTime: 0,
    successRate: 1,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    deviceType: typeof navigator !== "undefined" ? getDeviceType() : "unknown",
    platform: typeof navigator !== "undefined" ? navigator.platform : "",
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function getDeviceType(): string {
  if (typeof window === "undefined") return "server";

  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|BrowserNG/.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

export function createSessionEvent(
  session: AccessibilitySession,
  type: SessionEventType,
  category: string,
  action: string,
  options?: Partial<AccessibilitySessionEvent>
): AccessibilitySessionEvent {
  const timestamp = new Date();
  const sessionDuration = timestamp.getTime() - session.startTime.getTime();

  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp,
    sessionDuration,
    type,
    category,
    action,
    ...options
  };
}

export function createBarrierEncounter(
  session: AccessibilitySession,
  barrierType: BarrierType,
  severity: BarrierType extends keyof typeof BARRIER_SEVERITY ? typeof BARRIER_SEVERITY[BarrierType] : never,
  description: string,
  page: string
): BarrierEncounter {
  return {
    id: `barrier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    sessionDuration: Date.now() - session.startTime.getTime(),
    barrierType,
    severity: BARRIER_SEVERITY[barrierType] || "medium",
    description,
    page,
    impact: {
      blockedAction: undefined,
      alternativeUsed: undefined,
      workaround: undefined,
      abandoned: undefined
    },
    resolved: false,
    deviceInfo: {
      screenReader: undefined,
      browser: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      os: typeof navigator !== "undefined" ? navigator.platform : undefined,
      assistiveTechnology: []
    }
  };
}

const BARRIER_SEVERITY: Record<BarrierType, "low" | "medium" | "high" | "critical"> = {
  keyboard_navigation: "high",
  screen_reader: "critical",
  caption: "medium",
  sign_language: "low",
  audio_description: "medium",
  visual: "high",
  motor: "high",
  cognitive: "medium",
  braille: "critical",
  haptic: "low",
  voice: "high",
  content_quality: "medium",
  timing: "low",
  other: "low"
};

export function calculateSessionMetrics(session: AccessibilitySession): {
  avgResponseTime: number;
  successRate: number;
  engagement: number;
} {
  const responseTimes: number[] = [];
  let successCount = 0;

  for (const event of session.events) {
    if (event.performanceMetrics?.responseTime) {
      responseTimes.push(event.performanceMetrics.responseTime);
    }
    if (event.type === "feature_activated" && !event.metadata?.error) {
      successCount++;
    }
  }

  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  const successRate = session.events.filter(e => e.type === "feature_activated").length > 0
    ? successCount / session.events.filter(e => e.type === "feature_activated").length
    : 1;

  // Engagement score based on feature usage and session duration
  const engagement = Math.min(1, (
    (session.featuresUsed.size * 0.3) +
    (Math.min(session.duration / 60000, 30) * 0.02) + // max 30 min
    (session.pageViews * 0.05)
  ));

  return {
    avgResponseTime,
    successRate,
    engagement
  };
}

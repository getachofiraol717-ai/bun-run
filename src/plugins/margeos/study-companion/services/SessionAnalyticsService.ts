// Study Companion — Session Analytics Service
// Analyzes study session patterns and generates insights

export interface SessionAnalytics {
  totalSessions: number;
  totalStudyTime: number;
  averageSessionLength: number;
  longestSession: number;
  shortestSession: number;
  mostProductiveDay: string;
  mostProductiveHour: number;
  sessionsByDay: Record<string, number>;
  sessionsByHour: Record<number, number>;
  contentBreakdown: Record<string, number>;
  subjectBreakdown: Record<string, number>;
  completionRate: number;
  focusScore: number;
}

export interface SessionTrend {
  period: string;
  studyTime: number;
  sessions: number;
  change: number;
}

export class SessionAnalyticsService {
  private static instance: SessionAnalyticsService;
  private userId: string = "";

  private constructor() {}

  static getInstance(): SessionAnalyticsService {
    if (!SessionAnalyticsService.instance) {
      SessionAnalyticsService.instance = new SessionAnalyticsService();
    }
    return SessionAnalyticsService.instance;
  }

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
  }

  // Analyze all sessions
  async analyzeSessions(filter?: {
    startDate?: Date;
    endDate?: Date;
    subject?: string;
  }): Promise<SessionAnalytics> {
    const sessions = await this.getSessions(filter);

    if (sessions.length === 0) {
      return this.getEmptyAnalytics();
    }

    const durations = sessions.map(s => s.actualDuration);
    const totalTime = durations.reduce((a, b) => a + b, 0);
    const avgLength = totalTime / sessions.length;

    // Calculate day breakdown
    const dayBreakdown: Record<string, number> = {};
    const hourBreakdown: Record<number, number> = {};
    const contentBreakdown: Record<string, number> = {};
    const subjectBreakdown: Record<string, number> = {};

    let totalFocusScore = 0;
    let sessionsWithFocus = 0;
    let totalCompletion = 0;
    let sessionsWithCompletion = 0;

    for (const session of sessions) {
      const day = new Date(session.startTime).toLocaleDateString("en-US", { weekday: "short" });
      const hour = new Date(session.startTime).getHours();

      dayBreakdown[day] = (dayBreakdown[day] || 0) + session.actualDuration;
      hourBreakdown[hour] = (hourBreakdown[hour] || 0) + 1;

      if (session.contentType) {
        contentBreakdown[session.contentType] = (contentBreakdown[session.contentType] || 0) + 1;
      }

      if (session.subject) {
        subjectBreakdown[session.subject] = (subjectBreakdown[session.subject] || 0) + session.actualDuration;
      }

      if (session.focusScore > 0) {
        totalFocusScore += session.focusScore;
        sessionsWithFocus++;
      }

      if (session.completionRate > 0) {
        totalCompletion += session.completionRate;
        sessionsWithCompletion++;
      }
    }

    // Find most productive day
    const mostProductiveDay = Object.entries(dayBreakdown)
      .reduce((best, [day, time]) => time > best.time ? { day, time } : best, { day: "", time: 0 }).day;

    // Find most productive hour
    const mostProductiveHour = Object.entries(hourBreakdown)
      .reduce((best, [hour, count]) => count > best.count ? { hour: parseInt(hour as string), count } : best, { hour: 12, count: 0 }).hour;

    return {
      totalSessions: sessions.length,
      totalStudyTime: totalTime,
      averageSessionLength: Math.round(avgLength),
      longestSession: Math.max(...durations),
      shortestSession: Math.min(...durations),
      mostProductiveDay,
      mostProductiveHour,
      sessionsByDay: dayBreakdown,
      sessionsByHour: hourBreakdown,
      contentBreakdown,
      subjectBreakdown,
      completionRate: sessionsWithCompletion > 0 ? totalCompletion / sessionsWithCompletion : 0,
      focusScore: sessionsWithFocus > 0 ? totalFocusScore / sessionsWithFocus : 0
    };
  }

  // Get session trends
  async getSessionTrends(weeks: number = 4): Promise<SessionTrend[]> {
    const trends: SessionTrend[] = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const sessions = await this.getSessions({ startDate: weekStart, endDate: weekEnd });
      const totalTime = sessions.reduce((sum, s) => sum + s.actualDuration, 0);

      trends.push({
        period: `Week ${weeks - i}`,
        studyTime: totalTime,
        sessions: sessions.length,
        change: 0 // Would calculate vs previous week
      });
    }

    // Calculate changes
    for (let i = 1; i < trends.length; i++) {
      const prev = trends[i - 1].studyTime;
      const curr = trends[i].studyTime;
      trends[i].change = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
    }

    return trends;
  }

  // Get session streaks
  async getSessionStreaks(): Promise<{
    current: number;
    longest: number;
    thisWeek: number;
    thisMonth: number;
  }> {
    const sessions = await this.getSessions({});
    const studyDates = new Set<string>();

    for (const session of sessions) {
      studyDates.add(new Date(session.startTime).toISOString().split("T")[0]);
    }

    const sortedDates = Array.from(studyDates).sort().reverse();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);

      if (!lastDate) {
        tempStreak = 1;
        if (dateStr === today || dateStr === yesterdayStr) {
          currentStreak = tempStreak;
        }
      } else {
        const daysDiff = Math.floor((lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
          if (currentStreak > 0) {
            currentStreak = tempStreak;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      lastDate = date;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Count this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const thisWeek = Array.from(studyDates).filter(d => new Date(d) >= weekStart).length;

    // Count this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const thisMonth = Array.from(studyDates).filter(d => new Date(d) >= monthStart).length;

    return { current: currentStreak, longest: longestStreak, thisWeek, thisMonth };
  }

  // Get best performing sessions
  async getBestSessions(limit: number = 5): Promise<any[]> {
    const sessions = await this.getSessions({});
    return sessions
      .filter(s => s.productivity > 0)
      .sort((a, b) => b.productivity - a.productivity)
      .slice(0, limit);
  }

  // Get sessions needing attention
  async getSessionsNeedingAttention(): Promise<any[]> {
    const sessions = await this.getSessions({});
    return sessions.filter(s => {
      // Low completion rate
      if (s.completionRate > 0 && s.completionRate < 50) return true;
      // Very short sessions
      if (s.actualDuration > 0 && s.actualDuration < 5) return true;
      return false;
    });
  }

  // Calculate productivity score
  calculateProductivityScore(session: any): number {
    let score = 50; // Base score

    // Completion rate bonus
    if (session.completionRate > 0) {
      score += (session.completionRate / 100) * 20;
    }

    // Duration factor (optimal is 25-45 minutes)
    if (session.actualDuration >= 25 && session.actualDuration <= 45) {
      score += 15;
    } else if (session.actualDuration > 0) {
      score += Math.max(0, 15 - Math.abs(session.actualDuration - 35) / 5);
    }

    // Focus bonus
    if (session.focusScore > 0) {
      score += (session.focusScore / 100) * 15;
    }

    return Math.min(100, Math.round(score));
  }

  // Get empty analytics
  private getEmptyAnalytics(): SessionAnalytics {
    return {
      totalSessions: 0,
      totalStudyTime: 0,
      averageSessionLength: 0,
      longestSession: 0,
      shortestSession: 0,
      mostProductiveDay: "",
      mostProductiveHour: 12,
      sessionsByDay: {},
      sessionsByHour: {},
      contentBreakdown: {},
      subjectBreakdown: {},
      completionRate: 0,
      focusScore: 0
    };
  }

  private async getSessions(filter?: {
    startDate?: Date;
    endDate?: Date;
    subject?: string;
  }): Promise<any[]> {
    if (typeof localStorage === "undefined") return [];

    try {
      const stored = localStorage.getItem(`sc_sessions_${this.userId}`);
      if (!stored) return [];

      let sessions = JSON.parse(stored).map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime)
      }));

      if (filter?.startDate) {
        sessions = sessions.filter((s: any) => s.startTime >= filter.startDate!);
      }
      if (filter?.endDate) {
        sessions = sessions.filter((s: any) => s.startTime <= filter.endDate!);
      }
      if (filter?.subject) {
        sessions = sessions.filter((s: any) => s.subject === filter.subject);
      }

      return sessions;
    } catch (error) {
      console.error("Failed to get sessions:", error);
      return [];
    }
  }
}

export const sessionAnalyticsService = SessionAnalyticsService.getInstance();

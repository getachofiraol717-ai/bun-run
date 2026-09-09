// Study Companion — Progress Service
// Tracks and reports learning progress

export interface ProgressReport {
  period: { start: Date; end: Date };
  summary: ProgressSummary;
  subjects: SubjectProgress[];
  achievements: Achievement[];
  trends: Trend[];
  comparison: Comparison;
}

export interface ProgressSummary {
  totalStudyTime: number;
  totalSessions: number;
  averageSessionLength: number;
  goalsCompleted: number;
  conceptsLearned: number;
  quizzesTaken: number;
  averageQuizScore: number;
  currentStreak: number;
  longestStreak: number;
}

export interface SubjectProgress {
  subject: string;
  studyTime: number;
  sessions: number;
  mastery: number;
  trend: "up" | "down" | "stable";
  lastStudied: Date | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: string;
  earnedAt: Date;
}

export interface Trend {
  metric: string;
  change: number;
  direction: "up" | "down" | "stable";
}

export interface Comparison {
  vsLastWeek: Record<string, number>;
  vsLastMonth: Record<string, number>;
  vsGoals: Record<string, number>;
}

export class ProgressService {
  private static instance: ProgressService;
  private userId: string = "";

  private constructor() {}

  static getInstance(): ProgressService {
    if (!ProgressService.instance) {
      ProgressService.instance = new ProgressService();
    }
    return ProgressService.instance;
  }

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
  }

  // Generate weekly report
  async generateWeeklyReport(): Promise<ProgressReport> {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return this.generateReport(weekAgo, now);
  }

  // Generate monthly report
  async generateMonthlyReport(): Promise<ProgressReport> {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return this.generateReport(monthAgo, now);
  }

  // Generate report for date range
  async generateReport(start: Date, end: Date): Promise<ProgressReport> {
    const sessions = await this.getSessionsInRange(start, end);
    const goals = await this.getCompletedGoalsInRange(start, end);
    const achievements = await this.getAchievementsInRange(start, end);

    const summary = this.calculateSummary(sessions, goals);
    const subjects = this.calculateSubjectProgress(sessions);
    const trends = this.calculateTrends(sessions);
    const comparison = await this.generateComparison(summary, start);

    return {
      period: { start, end },
      summary,
      subjects,
      achievements,
      trends,
      comparison
    };
  }

  private async getSessionsInRange(start: Date, end: Date): Promise<any[]> {
    if (typeof localStorage === "undefined") return [];

    try {
      const stored = localStorage.getItem(`sc_sessions_${this.userId}`);
      if (stored) {
        const sessions = JSON.parse(stored);
        return sessions.filter((s: any) => {
          const date = new Date(s.startTime);
          return date >= start && date <= end;
        });
      }
    } catch (error) {
      console.error("Failed to get sessions:", error);
    }

    return [];
  }

  private async getCompletedGoalsInRange(start: Date, end: Date): Promise<any[]> {
    if (typeof localStorage === "undefined") return [];

    try {
      const stored = localStorage.getItem(`sc_goals_${this.userId}`);
      if (stored) {
        const goals = JSON.parse(stored);
        return goals.filter((g: any) => {
          if (g.status !== "completed" || !g.completedAt) return false;
          const date = new Date(g.completedAt);
          return date >= start && date <= end;
        });
      }
    } catch (error) {
      console.error("Failed to get goals:", error);
    }

    return [];
  }

  private async getAchievementsInRange(start: Date, end: Date): Promise<any[]> {
    if (typeof localStorage === "undefined") return [];

    try {
      const stored = localStorage.getItem(`sc_motivation_${this.userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        return (data.achievements || []).filter((a: any) => {
          const date = new Date(a.unlockedAt);
          return date >= start && date <= end;
        });
      }
    } catch (error) {
      console.error("Failed to get achievements:", error);
    }

    return [];
  }

  private calculateSummary(sessions: any[], goals: any[]): ProgressSummary {
    const totalStudyTime = sessions.reduce((sum: number, s: any) => sum + s.actualDuration, 0);
    const totalSessions = sessions.length;
    const averageSessionLength = totalSessions > 0 ? totalStudyTime / totalSessions : 0;
    const quizzesTaken = sessions.filter((s: any) => s.contentType === "quiz").length;
    const quizScores = sessions
      .filter((s: any) => s.quizResults?.length > 0)
      .flatMap((s: any) => s.quizResults.map((q: any) => q.score));
    const averageQuizScore = quizScores.length > 0
      ? quizScores.reduce((a: number, b: number) => a + b, 0) / quizScores.length
      : 0;

    return {
      totalStudyTime,
      totalSessions,
      averageSessionLength: Math.round(averageSessionLength),
      goalsCompleted: goals.length,
      conceptsLearned: 0, // Would need concept tracking
      quizzesTaken,
      averageQuizScore: Math.round(averageQuizScore),
      currentStreak: 0, // Would need streak calculation
      longestStreak: 0
    };
  }

  private calculateSubjectProgress(sessions: any[]): SubjectProgress[] {
    const subjectMap = new Map<string, {
      studyTime: number;
      sessions: Set<string>;
      lastStudied: Date | null;
    }>();

    for (const session of sessions) {
      if (!session.subject) continue;

      const existing = subjectMap.get(session.subject) || {
        studyTime: 0,
        sessions: new Set(),
        lastStudied: null
      };

      existing.studyTime += session.actualDuration;
      existing.sessions.add(session.id);

      if (!existing.lastStudied || new Date(session.startTime) > existing.lastStudied) {
        existing.lastStudied = new Date(session.startTime);
      }

      subjectMap.set(session.subject, existing);
    }

    return Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      studyTime: data.studyTime,
      sessions: data.sessions.size,
      mastery: 0, // Would need mastery calculation
      trend: "stable" as const,
      lastStudied: data.lastStudied
    }));
  }

  private calculateTrends(sessions: any[]): Trend[] {
    // Compare first half vs second half of sessions
    if (sessions.length < 4) return [];

    const half = Math.floor(sessions.length / 2);
    const firstHalf = sessions.slice(0, half);
    const secondHalf = sessions.slice(half);

    const firstAvg = firstHalf.reduce((sum: number, s: any) => sum + s.actualDuration, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum: number, s: any) => sum + s.actualDuration, 0) / secondHalf.length;

    const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    return [{
      metric: "session_length",
      change: Math.round(change),
      direction: change > 10 ? "up" : change < -10 ? "down" : "stable"
    }];
  }

  private async generateComparison(
    current: ProgressSummary,
    currentEnd: Date
  ): Promise<Comparison> {
    // Compare to last period
    const lastPeriodStart = new Date(currentEnd);
    lastPeriodStart.setDate(lastPeriodStart.getDate() - 7);

    // This would ideally fetch historical data
    // For now, return zeros
    return {
      vsLastWeek: {
        studyTime: 0,
        sessions: 0,
        goals: 0
      },
      vsLastMonth: {
        studyTime: 0,
        sessions: 0,
        goals: 0
      },
      vsGoals: {
        daily: 0,
        weekly: 0
      }
    };
  }

  // Format progress for display
  formatStudyTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours < 24) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    return `${days}d ${remainingHours}h`;
  }

  // Get daily breakdown
  getDailyBreakdown(sessions: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const session of sessions) {
      const day = new Date(session.startTime).toLocaleDateString("en-US", {
        weekday: "short"
      });

      breakdown[day] = (breakdown[day] || 0) + session.actualDuration;
    }

    return breakdown;
  }
}

export const progressService = ProgressService.getInstance();

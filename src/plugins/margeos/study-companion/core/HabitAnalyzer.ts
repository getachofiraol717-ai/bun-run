// Study Companion — Habit Analyzer
// Analyzes learning patterns and habits

import type { StudySession } from "../models/StudySession";

export interface HabitInsights {
  bestStudyTime: string;
  averageSessionLength: number;
  preferredSessionLength: number;
  streakInfo: StreakInfo;
  preferredDays: string[];
  preferredContent: ContentPreference[];
  studyVelocity: number;
  focusQuality: number;
  patterns: Pattern[];
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastStudyDate: Date | null;
  atRisk: boolean;
}

export interface ContentPreference {
  contentType: string;
  frequency: number;
  averageTimeSpent: number;
  completionRate: number;
}

export interface Pattern {
  id: string;
  name: string;
  type: "time" | "duration" | "frequency" | "content";
  description: string;
  confidence: number;
  data: any;
}

export interface WeeklyPattern {
  day: string;
  averageStudyTime: number;
  sessionsCount: number;
  mostProductiveHour: number;
}

export class HabitAnalyzer {
  private userId: string = "";
  private sessions: StudySession[] = [];
  private patterns: Pattern[] = [];
  private listeners: Set<(insights: HabitInsights) => void> = new Set();

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(`sc_sessions_${this.userId}`);
      if (stored) {
        this.sessions = JSON.parse(stored).map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined
        }));
      }
    } catch (error) {
      console.error("Failed to load habit data:", error);
    }
  }

  // Record a session
  async recordSession(session: StudySession): Promise<void> {
    this.sessions.push(session);
    await this.saveData();
    await this.analyzePatterns(this.userId);
  }

  private async saveData(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      localStorage.setItem(`sc_habits_${this.userId}`, JSON.stringify(this.patterns));
    } catch (error) {
      console.error("Failed to save habit patterns:", error);
    }
  }

  // Analyze learning patterns
  async analyzePatterns(userId: string): Promise<void> {
    this.patterns = [];

    if (this.sessions.length < 3) return;

    // Analyze study time preferences
    const timePattern = this.analyzeTimePreferences();
    this.patterns.push(timePattern);

    // Analyze session length preferences
    const lengthPattern = this.analyzeSessionLength();
    this.patterns.push(lengthPattern);

    // Analyze frequency patterns
    const frequencyPattern = this.analyzeFrequency();
    this.patterns.push(frequencyPattern);

    // Analyze content preferences
    const contentPattern = this.analyzeContentPreferences();
    this.patterns.push(contentPattern);

    await this.saveData();
    this.notifyListeners();
  }

  private analyzeTimePreferences(): Pattern {
    const hourCounts: Record<number, number> = {};

    for (const session of this.sessions) {
      const hour = session.startTime.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    const bestHour = Object.entries(hourCounts)
      .reduce((best, [hour, count]) =>
        count > best.count ? { hour: parseInt(hour), count } : best,
        { hour: 12, count: 0 }
      );

    const bestTime = this.formatHour(bestHour.hour);

    return {
      id: "time-preference",
      name: "Preferred Study Time",
      type: "time",
      description: `You prefer studying around ${bestTime}.`,
      confidence: Math.min(100, this.sessions.length * 10),
      data: { hourCounts, bestHour: bestHour.hour, bestTime }
    };
  }

  private analyzeSessionLength(): Pattern {
    const lengths = this.sessions.map(s => s.actualDuration);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const sortedLengths = [...lengths].sort((a, b) => a - b);
    const medianLength = sortedLengths[Math.floor(sortedLengths.length / 2)];

    // Find most common session length range
    const ranges = [
      { min: 0, max: 15, label: "quick" },
      { min: 15, max: 30, label: "short" },
      { min: 30, max: 60, label: "standard" },
      { min: 60, max: 120, label: "long" },
      { min: 120, max: Infinity, label: "extended" }
    ];

    let preferredRange = "standard";
    for (const range of ranges) {
      const count = lengths.filter(l => l >= range.min && l < range.max).length;
      if (count > this.sessions.length * 0.3) {
        preferredRange = range.label;
        break;
      }
    }

    return {
      id: "session-length",
      name: "Preferred Session Length",
      type: "duration",
      description: `You prefer ${preferredRange} study sessions of about ${Math.round(avgLength)} minutes.`,
      confidence: 75,
      data: { average: avgLength, median: medianLength, preferred: preferredRange }
    };
  }

  private analyzeFrequency(): Pattern {
    const dayCounts: Record<string, number> = {
      Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
      Thursday: 0, Friday: 0, Saturday: 0
    };

    const daysStudied = new Set<string>();

    for (const session of this.sessions) {
      const day = session.startTime.toLocaleDateString("en-US", { weekday: "long" });
      dayCounts[day]++;
      daysStudied.add(session.startTime.toISOString().split("T")[0]);
    }

    const mostActiveDays = Object.entries(dayCounts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);

    return {
      id: "frequency-pattern",
      name: "Study Frequency",
      type: "frequency",
      description: `You typically study on ${mostActiveDays.join(", ")}.`,
      confidence: 70,
      data: { dayCounts, mostActiveDays, totalDaysStudied: daysStudied.size }
    };
  }

  private analyzeContentPreferences(): Pattern {
    const contentStats: Record<string, { count: number; totalTime: number }> = {};

    for (const session of this.sessions) {
      const type = session.contentType || "other";
      if (!contentStats[type]) {
        contentStats[type] = { count: 0, totalTime: 0 };
      }
      contentStats[type].count++;
      contentStats[type].totalTime += session.actualDuration;
    }

    const preferences: ContentPreference[] = Object.entries(contentStats)
      .map(([type, stats]) => ({
        contentType: type,
        frequency: stats.count,
        averageTimeSpent: stats.totalTime / stats.count,
        completionRate: 0 // Would need completion tracking
      }))
      .sort((a, b) => b.frequency - a.frequency);

    const favorite = preferences[0];

    return {
      id: "content-preference",
      name: "Content Preferences",
      type: "content",
      description: favorite
        ? `You prefer ${favorite.contentType} content with an average of ${Math.round(favorite.averageTimeSpent)} minutes.`
        : "No clear content preference detected.",
      confidence: 60,
      data: { preferences }
    };
  }

  // Get insights
  async getInsights(userId: string): Promise<HabitInsights> {
    const streakInfo = this.calculateStreak();
    const timePattern = this.patterns.find(p => p.id === "time-preference");
    const lengthPattern = this.patterns.find(p => p.id === "session-length");
    const frequencyPattern = this.patterns.find(p => p.id === "frequency-pattern");
    const contentPattern = this.patterns.find(p => p.id === "content-preference");

    const lengths = this.sessions.map(s => s.actualDuration);
    const avgLength = lengths.length > 0
      ? lengths.reduce((a, b) => a + b, 0) / lengths.length
      : 0;

    // Calculate study velocity (content per hour)
    const totalHours = this.sessions.reduce((sum, s) => sum + s.actualDuration, 0) / 60;
    const studyVelocity = totalHours > 0 ? this.sessions.length / totalHours : 0;

    // Calculate focus quality
    const focusScores = this.sessions
      .filter(s => s.focusScore > 0)
      .map(s => s.focusScore);
    const focusQuality = focusScores.length > 0
      ? focusScores.reduce((a, b) => a + b, 0) / focusScores.length
      : 50;

    return {
      bestStudyTime: (timePattern?.data as any)?.bestTime || "morning",
      averageSessionLength: Math.round(avgLength),
      preferredSessionLength: (lengthPattern?.data as any)?.preferred === "quick" ? 15
        : (lengthPattern?.data as any)?.preferred === "short" ? 25
        : (lengthPattern?.data as any)?.preferred === "long" ? 60
        : 30,
      streakInfo,
      preferredDays: ((frequencyPattern?.data as any)?.mostActiveDays) || [],
      preferredContent: ((contentPattern?.data as any)?.preferences) || [],
      studyVelocity: Math.round(studyVelocity * 10) / 10,
      focusQuality: Math.round(focusQuality),
      patterns: this.patterns
    };
  }

  // Calculate streak
  private calculateStreak(): StreakInfo {
    const studyDates = new Set<string>();

    for (const session of this.sessions) {
      studyDates.add(session.startTime.toISOString().split("T")[0]);
    }

    const sortedDates = Array.from(studyDates).sort().reverse();
    const today = new Date().toISOString().split("T")[0];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    const sortedDatesObj = sortedDates.map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());

    for (const date of sortedDatesObj) {
      if (!lastDate) {
        tempStreak = 1;
        // Check if today or yesterday
        const daysDiff = Math.floor(
          (new Date(today).getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= 1) {
          currentStreak = tempStreak;
        }
      } else {
        const daysDiff = Math.floor(
          (lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );
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

    const lastStudyDate = sortedDatesObj[0] || null;
    const atRisk = this.isStreakAtRisk(sortedDatesObj);

    return {
      current: currentStreak,
      longest: longestStreak,
      lastStudyDate,
      atRisk
    };
  }

  private isStreakAtRisk(sortedDates: Date[]): boolean {
    if (sortedDates.length === 0) return false;

    const today = new Date();
    const lastStudy = sortedDates[0];
    const daysDiff = Math.floor(
      (today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysDiff >= 1; // At risk if didn't study today
  }

  private formatHour(hour: number): string {
    if (hour >= 5 && hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return "12:00 PM";
    if (hour > 12 && hour < 17) return `${hour - 12}:00 PM`;
    if (hour >= 17 && hour < 21) return `${hour - 12}:00 PM`;
    return `${hour - 12 || 12}:00 AM`;
  }

  // Get weekly pattern
  getWeeklyPattern(): WeeklyPattern[] {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const patterns: WeeklyPattern[] = [];

    for (const day of days) {
      const daySessions = this.sessions.filter(
        s => s.startTime.toLocaleDateString("en-US", { weekday: "long" }) === day
      );

      const hourCounts: Record<number, number> = {};
      let totalTime = 0;

      for (const session of daySessions) {
        totalTime += session.actualDuration;
        const hour = session.startTime.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }

      const mostProductiveHour = Object.entries(hourCounts)
        .reduce((best, [hour, count]) =>
          count > best.count ? { hour: parseInt(hour), count } : best,
          { hour: 12, count: 0 }
        ).hour;

      patterns.push({
        day,
        averageStudyTime: daySessions.length > 0 ? Math.round(totalTime / daySessions.length) : 0,
        sessionsCount: daySessions.length,
        mostProductiveHour
      });
    }

    return patterns;
  }

  // Get suggested study times
  getSuggestedStudyTimes(): { time: string; reason: string }[] {
    const insights = this.patterns;
    const suggestions: { time: string; reason: string }[] = [];

    const timePattern = insights.find(p => p.id === "time-preference");
    if (timePattern) {
      suggestions.push({
        time: (timePattern.data as any).bestTime,
        reason: "Based on your past study sessions"
      });
    }

    // Add suggestions based on streak
    const streakPattern = this.calculateStreak();
    if (streakPattern.current === 0) {
      suggestions.push({
        time: "morning",
        reason: "Start a new study habit"
      });
    } else if (streakPattern.atRisk) {
      suggestions.push({
        time: "today",
        reason: "Keep your streak going!"
      });
    }

    return suggestions;
  }

  // Subscribe to changes
  subscribe(listener: (insights: HabitInsights) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.getInsights(this.userId).then(insights => {
      for (const listener of this.listeners) {
        listener(insights);
      }
    });
  }

  // Cleanup
  destroy(): void {
    this.sessions = [];
    this.patterns = [];
    this.listeners.clear();
  }
}

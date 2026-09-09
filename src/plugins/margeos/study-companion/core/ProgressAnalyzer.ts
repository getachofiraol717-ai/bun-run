// Study Companion — Progress Analyzer
// Analyzes learning progress and generates insights

import type { SubjectPerformance } from "../models/SubjectPerformance";
import type { StudySession } from "../models/StudySession";

export interface ProgressSummary {
  overallProgress: number;
  weeklyProgress: number;
  monthlyProgress: number;
  subjects: SubjectProgress[];
  trends: TrendData[];
  insights: Insight[];
}

export interface SubjectProgress {
  subject: string;
  progress: number;
  trend: "up" | "down" | "stable";
  lastStudied: Date | null;
  masteryLevel: string;
  timeSpent: number;
  sessionsCount: number;
}

export interface TrendData {
  metric: string;
  direction: "up" | "down" | "stable";
  changePercent: number;
  changeAbsolute: number;
}

export interface Insight {
  id: string;
  type: "strength" | "improvement" | "warning" | "opportunity";
  title: string;
  description: string;
  action?: string;
  priority: number;
}

export interface MasteryLevel {
  name: string;
  score: number;
  color: string;
}

export class ProgressAnalyzer {
  private userId: string = "";
  private subjectPerformance: Map<string, SubjectPerformance> = new Map();
  private progressHistory: Map<string, { date: Date; value: number }[]> = new Map();

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(`sc_progress_${this.userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        this.subjectPerformance = new Map(
          Object.entries(data.subjects || {}).map(([key, value]: [string, any]) => {
            value.lastUpdated = new Date(value.lastUpdated);
            return [key, value];
          })
        );
        this.progressHistory = new Map(
          Object.entries(data.history || {}).map(([key, value]: [string, any]) => {
            return [key, value.map((v: any) => ({ ...v, date: new Date(v.date) }))];
          })
        );
      }
    } catch (error) {
      console.error("Failed to load progress data:", error);
    }
  }

  private async saveData(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const data = {
        subjects: Object.fromEntries(this.subjectPerformance),
        history: Object.fromEntries(this.progressHistory)
      };
      localStorage.setItem(`sc_progress_${this.userId}`, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save progress data:", error);
    }
  }

  // Record a study session
  async recordSession(session: StudySession): Promise<void> {
    if (!session.subject) return;

    const performance = this.subjectPerformance.get(session.subject) ||
      this.createDefaultPerformance(session.subject);

    // Update metrics
    performance.metrics.totalTimeSpent += session.actualDuration;
    performance.metrics.sessionsCount++;
    performance.metrics.averageSessionLength =
      performance.metrics.totalTimeSpent / performance.metrics.sessionsCount;

    if (session.completionRate > 0) {
      performance.metrics.contentCompleted += session.completionRate / 100;
    }

    this.subjectPerformance.set(session.subject, performance);

    // Update progress history
    this.updateProgressHistory(session.subject, session.actualDuration);
    await this.saveData();
  }

  // Analyze progress
  async analyzeProgress(userId: string): Promise<ProgressSummary> {
    const subjects = this.getSubjectProgress();
    const overallProgress = this.calculateOverallProgress(subjects);
    const weeklyProgress = this.calculateWeeklyProgress();
    const monthlyProgress = this.calculateMonthlyProgress();
    const trends = this.calculateTrends();
    const insights = this.generateInsights(subjects, trends);

    return {
      overallProgress,
      weeklyProgress,
      monthlyProgress,
      subjects,
      trends,
      insights
    };
  }

  // Get subject progress
  getSubjectProgress(): SubjectProgress[] {
    return Array.from(this.subjectPerformance.values()).map(p => ({
      subject: p.subject,
      progress: p.metrics.conceptMastery,
      trend: this.calculateSubjectTrend(p.subject),
      lastStudied: this.getLastStudiedDate(p.subject),
      masteryLevel: this.getMasteryLevelName(p.metrics.conceptMastery),
      timeSpent: p.metrics.totalTimeSpent,
      sessionsCount: p.metrics.sessionsCount
    }));
  }

  // Analyze specific subject
  async analyzeSubject(subject: string): Promise<SubjectPerformance | null> {
    return this.subjectPerformance.get(subject) || null;
  }

  // Get summary
  async getSummary(userId: string): Promise<{
    overall: number;
    bySubject: Record<string, number>;
    trends: "improving" | "stable" | "declining";
  }> {
    const subjects = this.getSubjectProgress();

    const overall = this.calculateOverallProgress(subjects);
    const bySubject: Record<string, number> = {};
    let improvingCount = 0;
    let decliningCount = 0;

    for (const subject of subjects) {
      bySubject[subject.subject] = subject.progress;
      if (subject.trend === "up") improvingCount++;
      else if (subject.trend === "down") decliningCount++;
    }

    let trends: "improving" | "stable" | "declining" = "stable";
    if (improvingCount > decliningCount * 2) trends = "improving";
    else if (decliningCount > improvingCount * 2) trends = "declining";

    return { overall, bySubject, trends };
  }

  // Record quiz result
  async recordQuizResult(
    subject: string,
    score: number,
    totalQuestions: number,
    correctAnswers: number
  ): Promise<void> {
    const performance = this.subjectPerformance.get(subject) ||
      this.createDefaultPerformance(subject);

    performance.metrics.quizzesTaken++;
    if (score >= 60) {
      performance.metrics.quizzesPassed++;
    }

    // Update average
    const totalScore = performance.metrics.averageQuizScore * (performance.metrics.quizzesTaken - 1) + score;
    performance.metrics.averageQuizScore = totalScore / performance.metrics.quizzesTaken;

    // Update mastery
    performance.metrics.conceptMastery = this.calculateMasteryFromQuizzes(performance);
    performance.lastUpdated = new Date();

    this.subjectPerformance.set(subject, performance);
    this.updateProgressHistory(subject, score, "quiz");
    await this.saveData();
  }

  // Private helpers
  private createDefaultPerformance(subject: string): SubjectPerformance {
    return {
      subject,
      category: this.categorizeSubject(subject),
      metrics: {
        totalTimeSpent: 0,
        sessionsCount: 0,
        averageSessionLength: 0,
        contentCompleted: 0,
        quizzesTaken: 0,
        quizzesPassed: 0,
        averageQuizScore: 0,
        practiceAttempts: 0,
        practiceAccuracy: 0,
        conceptMastery: 0,
        improvementRate: 0,
        consistencyScore: 0,
        engagementScore: 0
      },
      timeline: [],
      comparisons: [],
      insights: [],
      recommendations: [],
      lastUpdated: new Date()
    };
  }

  private categorizeSubject(subject: string): SubjectPerformance["category"] {
    const lower = subject.toLowerCase();
    if (lower.includes("math")) return "mathematics";
    if (lower.includes("physics") || lower.includes("chemistry") || lower.includes("biology")) return "science";
    if (lower.includes("english") || lower.includes("language")) return "languages";
    if (lower.includes("history") || lower.includes("geography")) return "humanities";
    return "other";
  }

  private updateProgressHistory(subject: string, value: number, type: "time" | "quiz" = "time"): void {
    const key = `${subject}_${type}`;
    const history = this.progressHistory.get(key) || [];

    history.push({ date: new Date(), value });
    if (history.length > 30) {
      history.shift();
    }

    this.progressHistory.set(key, history);
  }

  private calculateSubjectTrend(subject: string): "up" | "down" | "stable" {
    const history = this.progressHistory.get(`${subject}_quiz`) ||
      this.progressHistory.get(`${subject}_time`);

    if (!history || history.length < 2) return "stable";

    const recent = history.slice(-3);
    const older = history.slice(-6, -3);

    if (older.length === 0) return "stable";

    const recentAvg = recent.reduce((s, r) => s + r.value, 0) / recent.length;
    const olderAvg = older.reduce((s, r) => s + r.value, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 10) return "up";
    if (change < -10) return "down";
    return "stable";
  }

  private calculateOverallProgress(subjects: SubjectProgress[]): number {
    if (subjects.length === 0) return 0;
    return Math.round(subjects.reduce((s, sub) => s + sub.progress, 0) / subjects.length);
  }

  private calculateWeeklyProgress(): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    let totalTime = 0;
    for (const [, performance] of this.subjectPerformance) {
      // This would ideally filter timeline by date
      totalTime += performance.metrics.totalTimeSpent;
    }

    return totalTime;
  }

  private calculateMonthlyProgress(): number {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    let totalTime = 0;
    for (const [, performance] of this.subjectPerformance) {
      totalTime += performance.metrics.totalTimeSpent;
    }

    return totalTime;
  }

  private calculateTrends(): TrendData[] {
    const trends: TrendData[] = [];

    for (const subject of Array.from(this.subjectPerformance.keys())) {
      const trend = this.calculateSubjectTrend(subject);
      const history = this.progressHistory.get(`${subject}_quiz`);

      if (history && history.length >= 2) {
        const recent = history[history.length - 1].value;
        const older = history[0].value;
        const change = recent - older;

        trends.push({
          metric: subject,
          direction: trend,
          changePercent: older > 0 ? (change / older) * 100 : 0,
          changeAbsolute: change
        });
      }
    }

    return trends;
  }

  private generateInsights(subjects: SubjectProgress[], trends: TrendData[]): Insight[] {
    const insights: Insight[] = [];

    // Find strongest subject
    const strongest = subjects.reduce((best, s) =>
      s.progress > best.progress ? s : best, subjects[0]);

    if (strongest) {
      insights.push({
        id: `insight-strength-${strongest.subject}`,
        type: "strength",
        title: `Strong in ${strongest.subject}`,
        description: `${strongest.subject} is your strongest subject with ${strongest.progress}% mastery.`,
        action: "Consider using this strength to help with harder topics.",
        priority: 3
      });
    }

    // Find improving subjects
    const improving = subjects.filter(s => s.trend === "up");
    if (improving.length > 0) {
      insights.push({
        id: "insight-improving",
        type: "improvement",
        title: "Great Progress!",
        description: `You're improving in ${improving.map(s => s.subject).join(", ")}.`,
        action: "Keep up the momentum!",
        priority: 2
      });
    }

    // Find weak subjects
    const weakest = subjects.reduce((worst, s) =>
      s.progress < worst.progress ? s : worst, subjects[0]);

    if (weakest && weakest.progress < 50) {
      insights.push({
        id: `insight-weak-${weakest.subject}`,
        type: "warning",
        title: `${weakest.subject} Needs Attention`,
        description: `${weakest.subject} has only ${weakest.progress}% mastery. Consider more focused study.`,
        action: `Plan extra practice sessions for ${weakest.subject}.`,
        priority: 1
      });
    }

    // Find neglected subjects
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const neglected = subjects.filter(s =>
      s.lastStudied && s.lastStudied < weekAgo
    );

    if (neglected.length > 0) {
      insights.push({
        id: "insight-neglected",
        type: "opportunity",
        title: "Topics to Revisit",
        description: `You haven't studied ${neglected.map(s => s.subject).join(", ")} this week.`,
        action: "Add a review session for these topics.",
        priority: 2
      });
    }

    return insights.sort((a, b) => a.priority - b.priority);
  }

  private getLastStudiedDate(subject: string): Date | null {
    const history = this.progressHistory.get(`${subject}_time`);
    if (!history || history.length === 0) return null;
    return history[history.length - 1].date;
  }

  private getMasteryLevelName(score: number): string {
    if (score >= 90) return "Expert";
    if (score >= 75) return "Advanced";
    if (score >= 50) return "Intermediate";
    if (score >= 25) return "Beginner";
    return "Novice";
  }

  private calculateMasteryFromQuizzes(performance: SubjectPerformance): number {
    const { quizzesTaken, quizzesPassed, averageQuizScore } = performance.metrics;
    if (quizzesTaken === 0) return 0;

    const passRate = (quizzesPassed / quizzesTaken) * 100;
    return Math.round((passRate * 0.6 + averageQuizScore * 0.4));
  }

  // Cleanup
  destroy(): void {
    this.subjectPerformance.clear();
    this.progressHistory.clear();
  }
}

export const progressAnalyzer = new ProgressAnalyzer();


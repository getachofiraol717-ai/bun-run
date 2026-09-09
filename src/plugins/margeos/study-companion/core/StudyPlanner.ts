// @ts-nocheck
// Study Companion — Study Planner
// Generates intelligent study plans

import type { StudyPlan } from "../models/StudentProfile";
import type { LearningGoal } from "../models/LearningGoal";
import type { StudySession } from "../models/StudySession";
import type { HabitInsights } from "./HabitAnalyzer";

export interface PlanRequest {
  userId: string;
  duration?: number;           // days
  startDate?: Date;
  endDate?: Date;
  subjectFocus?: string[];
  targetHours?: number;
}

export interface PlannedActivity {
  id: string;
  date: Date;
  type: "new_learning" | "revision" | "practice" | "assessment" | "break";
  subject?: string;
  topic?: string;
  duration: number;             // minutes
  priority: number;
  reason: string;
  completed: boolean;
}

export interface DailyPlan {
  date: Date;
  dayOfWeek: string;
  totalMinutes: number;
  activities: PlannedActivity[];
  restRecommendation: string;
}

export interface WeeklySummary {
  totalHours: number;
  subjectBreakdown: Record<string, number>;
  focusAreas: string[];
  restDays: number;
}

export class StudyPlanner {
  private userId: string = "";
  private currentPlan: StudyPlan | null = null;
  private listeners: Set<(plan: StudyPlan | null) => void> = new Set();

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadCurrentPlan();
  }

  private async loadCurrentPlan(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(`sc_plan_${this.userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        this.currentPlan = {
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          dailySchedule: data.dailySchedule.map((d: any) => ({
            ...d,
            date: new Date(d.date)
          })),
          createdAt: new Date(data.createdAt)
        };
      }
    } catch (error) {
      console.error("Failed to load study plan:", error);
    }
  }

  private async savePlan(): Promise<void> {
    if (!this.currentPlan || typeof localStorage === "undefined") return;

    try {
      localStorage.setItem(`sc_plan_${this.userId}`, JSON.stringify(this.currentPlan));
      this.notifyListeners();
    } catch (error) {
      console.error("Failed to save study plan:", error);
    }
  }

  // Generate a study plan
  async generatePlan(request: PlanRequest): Promise<StudyPlan> {
    const startDate = request.startDate || new Date();
    const endDate = request.endDate || new Date(Date.now() + (request.duration || 7) * 24 * 60 * 60 * 1000);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

    // Calculate total hours per day
    const targetHoursPerDay = (request.targetHours || 2) / days;

    // Get goals for this period
    const goals = await this.getGoalsForPeriod(startDate, endDate);

    // Get habit insights
    const habitInsights = await this.getHabitInsights();

    // Generate daily plans
    const dailySchedule: StudyPlan["dailySchedule"] = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < days; i++) {
      const dailyPlan = this.createDailyPlan(
        currentDate,
        targetHoursPerDay * 60,
        goals,
        habitInsights,
        i === 0 // Is first day
      );

      dailySchedule.push(dailyPlan);

      // Move to next day
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const plan: StudyPlan = {
      id: `plan-${Date.now()}`,
      userId: this.userId,
      title: this.generatePlanTitle(goals),
      startDate,
      endDate,
      subjects: this.extractSubjects(goals),
      dailySchedule,
      totalHours: request.targetHours || 14,
      completedHours: 0,
      status: "active",
      createdAt: new Date()
    };

    this.currentPlan = plan;
    await this.savePlan();

    return plan;
  }

  private createDailyPlan(
    date: Date,
    targetMinutes: number,
    goals: LearningGoal[],
    habits: HabitInsights,
    isFirstDay: boolean
  ): StudyPlan["dailySchedule"][0] {
    const activities: PlannedActivity[] = [];
    let remainingMinutes = targetMinutes;

    // Add new learning sessions (highest priority)
    if (goals.some(g => g.status === "active")) {
      activities.push({
        id: `act-${Date.now()}-1`,
        date,
        type: "new_learning",
        subject: goals.find(g => g.status === "active")?.subject,
        duration: Math.min(remainingMinutes * 0.4, 45),
        priority: 1,
        reason: "Continue working toward your goals",
        completed: false
      });
      remainingMinutes -= activities[0].duration;
    }

    // Add revision sessions
    activities.push({
      id: `act-${Date.now()}-2`,
      date,
      type: "revision",
      duration: Math.min(remainingMinutes * 0.3, 30),
      priority: 2,
      reason: "Review recently learned concepts",
      completed: false
    });
    remainingMinutes -= activities[1].duration;

    // Add practice sessions
    activities.push({
      id: `act-${Date.now()}-3`,
      date,
      type: "practice",
      duration: Math.min(remainingMinutes * 0.3, 25),
      priority: 3,
      reason: "Apply what you've learned",
      completed: false
    });
    remainingMinutes -= activities[2].duration;

    return {
      date,
      activities,
      completed: false
    };
  }

  private generatePlanTitle(goals: LearningGoal[]): string {
    if (goals.length === 0) {
      return "General Study Plan";
    }

    const subjects = [...new Set(goals.map(g => g.subject || "General"))];
    if (subjects.length === 1) {
      return `Study Plan: ${subjects[0]}`;
    }

    return "Multi-Subject Study Plan";
  }

  private extractSubjects(goals: LearningGoal[]): StudyPlan["subjects"] {
    const subjectMap = new Map<string, StudyPlan["subjects"][0]>();

    for (const goal of goals) {
      if (goal.subject) {
        const existing = subjectMap.get(goal.subject);
        if (existing) {
          existing.hoursAllocated += (goal.targetValue || 60) / 60;
        } else {
          subjectMap.set(goal.subject, {
            subject: goal.subject,
            hoursAllocated: (goal.targetValue || 60) / 60,
            completedHours: 0,
            topics: goal.topics || []
          });
        }
      }
    }

    return Array.from(subjectMap.values());
  }

  private async getGoalsForPeriod(start: Date, end: Date): Promise<LearningGoal[]> {
    // This would connect to GoalManager
    // For now, return empty array
    return [];
  }

  private async getHabitInsights(): Promise<HabitInsights> {
    // This would connect to HabitAnalyzer
    // For now, return default values
    return {
      bestStudyTime: "morning",
      averageSessionLength: 30,
      preferredSessionLength: 25,
      streakInfo: { current: 0, longest: 0, lastStudyDate: null, atRisk: false },
      preferredDays: [],
      preferredContent: [],
      studyVelocity: 1,
      focusQuality: 70,
      patterns: []
    };
  }

  // Get today's schedule
  async getTodaySchedule(userId: string): Promise<DailyPlan | null> {
    if (!this.currentPlan || this.currentPlan.status !== "active") {
      return null;
    }

    const today = new Date().toISOString().split("T")[0];

    for (const day of this.currentPlan.dailySchedule) {
      if (day.date.toISOString().split("T")[0] === today) {
        return {
          date: day.date,
          dayOfWeek: day.date.toLocaleDateString("en-US", { weekday: "long" }),
          totalMinutes: day.activities.reduce((sum, a) => sum + a.duration, 0),
          activities: day.activities,
          restRecommendation: this.getRestRecommendation(day)
        };
      }
    }

    return null;
  }

  private getRestRecommendation(day: StudyPlan["dailySchedule"][0]): string {
    const totalMinutes = day.activities.reduce((sum, a) => sum + a.duration, 0);

    if (totalMinutes > 180) {
      return "Consider taking a longer break or splitting this into two sessions.";
    }
    if (totalMinutes > 120) {
      return "Take regular breaks every 25-30 minutes.";
    }
    return "Great balance! Remember to stay hydrated.";
  }

  // Mark activity as completed
  async completeActivity(planId: string, activityId: string): Promise<void> {
    if (!this.currentPlan || this.currentPlan.id !== planId) return;

    for (const day of this.currentPlan.dailySchedule) {
      const activity = day.activities.find(a => a.id === activityId);
      if (activity) {
        activity.completed = true;
        this.currentPlan.completedHours += activity.duration / 60;
        break;
      }
    }

    // Check if day is complete
    const today = new Date().toISOString().split("T")[0];
    for (const day of this.currentPlan.dailySchedule) {
      if (day.date.toISOString().split("T")[0] === today) {
        if (day.activities.every(a => a.completed)) {
          day.completed = true;
        }
        break;
      }
    }

    // Check if plan is complete
    if (this.currentPlan.dailySchedule.every(d => d.completed)) {
      this.currentPlan.status = "completed";
    }

    await this.savePlan();
  }

  // Get current plan
  getCurrentPlan(): StudyPlan | null {
    return this.currentPlan;
  }

  // Pause plan
  async pausePlan(): Promise<void> {
    if (this.currentPlan) {
      this.currentPlan.status = "paused";
      await this.savePlan();
    }
  }

  // Resume plan
  async resumePlan(): Promise<void> {
    if (this.currentPlan) {
      this.currentPlan.status = "active";
      await this.savePlan();
    }
  }

  // Get weekly summary
  async getWeeklySummary(): Promise<WeeklySummary | null> {
    if (!this.currentPlan) return null;

    const thisWeek = this.currentPlan.dailySchedule.filter(d => {
      const now = new Date();
      const diff = d.date.getTime() - now.getTime();
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    });

    const subjectBreakdown: Record<string, number> = {};
    let totalHours = 0;
    let restDays = 0;

    for (const day of thisWeek) {
      const completedMinutes = day.activities
        .filter(a => a.completed)
        .reduce((sum, a) => sum + a.duration, 0);

      totalHours += completedMinutes / 60;

      if (day.activities.length === 0 || completedMinutes === 0) {
        restDays++;
      }

      for (const activity of day.activities) {
        if (activity.subject && activity.completed) {
          subjectBreakdown[activity.subject] = (subjectBreakdown[activity.subject] || 0) + activity.duration / 60;
        }
      }
    }

    const focusAreas = Object.entries(subjectBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([subject]) => subject);

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      subjectBreakdown: Object.fromEntries(
        Object.entries(subjectBreakdown).map(([k, v]) => [k, Math.round(v * 10) / 10])
      ),
      focusAreas,
      restDays
    };
  }

  // Subscribe to plan changes
  subscribe(listener: (plan: StudyPlan | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentPlan);
    }
  }

  // Cleanup
  destroy(): void {
    this.currentPlan = null;
    this.listeners.clear();
  }
}

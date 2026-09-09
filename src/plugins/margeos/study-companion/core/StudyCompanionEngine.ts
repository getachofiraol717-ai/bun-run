// @ts-nocheck
// Study Companion — Study Companion Engine
// Main orchestrator for the AI Study Companion

import type { StudentProfile, LearningGoal, StudySession } from "../models/StudentProfile";
import type { Recommendation } from "../models/Recommendation";
import type { MotivationProfile } from "../models/MotivationProfile";
import { StudentProfileEngine } from "./StudentProfileEngine";
import { GoalManager } from "./GoalManager";
import { LearningHistoryEngine } from "./LearningHistoryEngine";
import { ProgressAnalyzer } from "./ProgressAnalyzer";
import { RecommendationEngine } from "./RecommendationEngine";
import { HabitAnalyzer } from "./HabitAnalyzer";
import { MotivationEngine } from "./MotivationEngine";
import { StudyPlanner } from "./StudyPlanner";

export interface StudyCompanionConfig {
  userId: string;
  autoInitialize: boolean;
  enableAnalytics: boolean;
  enableMotivation: boolean;
  enableRecommendations: boolean;
  enablePlanning: boolean;
  reminderInterval: number;        // minutes
  syncInterval: number;           // minutes
}

export interface CompanionContext {
  currentSession?: StudySession;
  currentGoal?: LearningGoal;
  activeSubject?: string;
  timeAvailable?: number;         // minutes
  energyLevel?: "low" | "medium" | "high";
  lastInteraction?: Date;
}

export interface CompanionResponse {
  message: string;
  type: "greeting" | "encouragement" | "suggestion" | "reminder" | "celebration" | "explanation";
  actions?: CompanionAction[];
  data?: any;
}

export interface CompanionAction {
  type: "navigate" | "start_session" | "set_goal" | "review" | "practice" | "dismiss";
  label: string;
  data?: any;
}

export class StudyCompanionEngine {
  private static instance: StudyCompanionEngine;
  private config: StudyCompanionConfig | null = null;
  private isInitialized: boolean = false;
  private context: CompanionContext = {};

  // Sub-engines
  private profileEngine: StudentProfileEngine;
  private goalManager: GoalManager;
  private historyEngine: LearningHistoryEngine;
  private progressAnalyzer: ProgressAnalyzer;
  private recommendationEngine: RecommendationEngine;
  private habitAnalyzer: HabitAnalyzer;
  private motivationEngine: MotivationEngine;
  private studyPlanner: StudyPlanner;

  // State
  private listeners: Set<(response: CompanionResponse) => void> = new Set();
  private sessionStartTime: Date | null = null;

  private constructor() {
    this.profileEngine = new StudentProfileEngine();
    this.goalManager = new GoalManager();
    this.historyEngine = new LearningHistoryEngine();
    this.progressAnalyzer = new ProgressAnalyzer();
    this.recommendationEngine = new RecommendationEngine();
    this.habitAnalyzer = new HabitAnalyzer();
    this.motivationEngine = new MotivationEngine();
    this.studyPlanner = new StudyPlanner();
  }

  static getInstance(): StudyCompanionEngine {
    if (!StudyCompanionEngine.instance) {
      StudyCompanionEngine.instance = new StudyCompanionEngine();
    }
    return StudyCompanionEngine.instance;
  }

  // Initialize the engine
  async initialize(config: Partial<StudyCompanionConfig>): Promise<void> {
    this.config = {
      userId: config.userId || "default",
      autoInitialize: config.autoInitialize ?? true,
      enableAnalytics: config.enableAnalytics ?? true,
      enableMotivation: config.enableMotivation ?? true,
      enableRecommendations: config.enableRecommendations ?? true,
      enablePlanning: config.enablePlanning ?? true,
      reminderInterval: config.reminderInterval || 30,
      syncInterval: config.syncInterval || 5
    };

    // Initialize sub-engines
    await Promise.all([
      this.profileEngine.initialize(this.config.userId),
      this.goalManager.initialize(this.config.userId),
      this.historyEngine.initialize(this.config.userId),
      this.motivationEngine.initialize(this.config.userId)
    ]);

    // Analyze patterns
    if (this.config.enableAnalytics) {
      await this.habitAnalyzer.analyzePatterns(this.config.userId);
      await this.progressAnalyzer.analyzeProgress(this.config.userId);
    }

    this.isInitialized = true;
    this.updateContext();
  }

  // Check if initialized
  isReady(): boolean {
    return this.isInitialized;
  }

  // Update companion context
  updateContext(context: Partial<CompanionContext> = {}): void {
    this.context = { ...this.context, ...context };
  }

  // Get profile
  getProfile(): StudentProfile | null {
    return this.profileEngine.getProfile();
  }

  // Update profile
  async updateProfile(updates: Partial<StudentProfile>): Promise<void> {
    await this.profileEngine.updateProfile(updates);
  }

  // Session management
  async startSession(options?: Partial<StudySession>): Promise<StudySession> {
    this.sessionStartTime = new Date();

    const session = await this.historyEngine.startSession({
      ...options,
      userId: this.config?.userId
    });

    this.context.currentSession = session;

    // Generate session start encouragement
    if (this.config?.enableMotivation) {
      this.motivationEngine.recordSessionStart(session);
    }

    return session;
  }

  async endSession(session: StudySession): Promise<void> {
    if (this.sessionStartTime) {
      session.endTime = new Date();
      session.actualDuration = Math.floor(
        (session.endTime.getTime() - this.sessionStartTime.getTime()) / 60000
      );
    }

    await this.historyEngine.endSession(session);

    // Update analytics
    if (this.config?.enableAnalytics) {
      await this.habitAnalyzer.recordSession(session);
      await this.progressAnalyzer.recordSession(session);
    }

    // Update motivation
    if (this.config?.enableMotivation) {
      await this.motivationEngine.recordSessionEnd(session);
    }

    // Update context
    this.context.currentSession = undefined;
    this.sessionStartTime = null;

    // Check for goal completion
    await this.checkGoalProgress(session);
  }

  // Goal management
  async createGoal(goal: Partial<LearningGoal>): Promise<LearningGoal> {
    return await this.goalManager.createGoal(goal);
  }

  async getGoals(type?: string): Promise<LearningGoal[]> {
    return await this.goalManager.getGoals(type);
  }

  async updateGoalProgress(goalId: string, progress: number): Promise<void> {
    await this.goalManager.updateProgress(goalId, progress);

    // Check if goal completed
    if (progress >= 100) {
      await this.goalManager.completeGoal(goalId);

      // Celebrate!
      if (this.config?.enableMotivation) {
        const goal = await this.goalManager.getGoal(goalId);
        if (goal) {
          await this.motivationEngine.celebrateGoalCompletion(goal);
        }
      }
    }
  }

  // Recommendations
  async getRecommendations(options?: {
    limit?: number;
    type?: string;
    subject?: string;
  }): Promise<Recommendation[]> {
    if (!this.config?.enableRecommendations) return [];

    return await this.recommendationEngine.getRecommendations({
      userId: this.config.userId,
      limit: options?.limit || 5,
      ...options
    });
  }

  async acceptRecommendation(recommendationId: string): Promise<void> {
    await this.recommendationEngine.acceptRecommendation(recommendationId);
  }

  async dismissRecommendation(recommendationId: string): Promise<void> {
    await this.recommendationEngine.dismissRecommendation(recommendationId);
  }

  // Progress analysis
  async getProgressSummary(): Promise<{
    overall: number;
    bySubject: Record<string, number>;
    trends: "improving" | "stable" | "declining";
  }> {
    return await this.progressAnalyzer.getSummary(this.config?.userId || "default");
  }

  async getSubjectAnalysis(subject: string): Promise<any> {
    return await this.progressAnalyzer.analyzeSubject(subject);
  }

  // Habit analysis
  async getHabitInsights(): Promise<{
    bestStudyTime: string;
    averageSessionLength: number;
    streakInfo: { current: number; longest: number };
    preferredContent: string[];
  }> {
    return await this.habitAnalyzer.getInsights(this.config?.userId || "default");
  }

  // Study planning
  async generateStudyPlan(options?: {
    duration: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    if (!this.config?.enablePlanning) return null;

    return await this.studyPlanner.generatePlan({
      userId: this.config.userId,
      ...options
    });
  }

  async getTodaySchedule(): Promise<any[]> {
    return await this.studyPlanner.getTodaySchedule(this.config?.userId || "default");
  }

  // Companion interactions
  async generateCompanionMessage(context?: Partial<CompanionContext>): Promise<CompanionResponse> {
    this.updateContext(context);

    const profile = this.getProfile();
    const goals = await this.getGoals("active");
    const recommendations = await this.getRecommendations({ limit: 3 });

    // Determine message type based on context
    let messageType: CompanionResponse["type"] = "suggestion";
    let message = "";
    const actions: CompanionAction[] = [];

    // Check various conditions
    if (!this.sessionStartTime && !this.context.currentSession) {
      // No active session
      messageType = "greeting";

      const { currentStreak } = await this.habitAnalyzer.getInsights(this.config?.userId || "default");

      if (currentStreak > 0) {
        message = `Welcome back! You're on a ${currentStreak}-day streak. Ready to continue your learning journey?`;
      } else {
        message = `Hi ${profile?.personal?.displayName || "there"}! Ready to start studying?`;
      }

      actions.push({
        type: "start_session",
        label: "Start Study Session",
        data: { subject: this.context.activeSubject }
      });
    } else if (this.context.currentSession) {
      // Active session
      messageType = "encouragement";

      const elapsed = Math.floor(
        (Date.now() - (this.context.currentSession.startTime?.getTime() || Date.now())) / 60000
      );

      message = `You've been studying for ${elapsed} minutes. Keep up the great work!`;

      if (elapsed >= 25) {
        actions.push({
          type: "start_session",
          label: "Take a Break"
        });
      }
    }

    // Check for pending goals
    if (goals.length > 0) {
      const urgentGoals = goals.filter(g => {
        const daysLeft = Math.ceil(
          (g.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysLeft <= 3 && g.progress < 80;
      });

      if (urgentGoals.length > 0) {
        messageType = "reminder";
        message += ` Don't forget: "${urgentGoals[0].title}" needs attention!`;
        actions.push({
          type: "set_goal",
          label: `Work on: ${urgentGoals[0].title}`
        });
      }
    }

    // Add recommendation action if available
    if (recommendations.length > 0) {
      actions.push({
        type: "suggestion",
        label: `Try: ${recommendations[0].title}`,
        data: { recommendation: recommendations[0] }
      });
    }

    return {
      message,
      type: messageType,
      actions
    };
  }

  // Subscribe to companion responses
  subscribe(listener: (response: CompanionResponse) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Private helpers
  private async checkGoalProgress(session: StudySession): Promise<void> {
    const goals = await this.getGoals("active");

    for (const goal of goals) {
      if (goal.subject === session.subject || !goal.subject) {
        const sessionContribution = session.actualDuration || 0;
        const newProgress = goal.progress + (sessionContribution / (goal.targetDate.getTime() - goal.createdAt.getTime()) * 100);

        if (newProgress > goal.progress) {
          await this.updateGoalProgress(goal.id, Math.min(100, newProgress));
        }
      }
    }
  }

  // Cleanup
  destroy(): void {
    this.listeners.clear();
    this.isInitialized = false;
    this.context = {};
  }
}

// Export singleton
export const studyCompanionEngine = StudyCompanionEngine.getInstance();

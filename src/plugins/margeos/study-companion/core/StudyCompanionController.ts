// @ts-nocheck
// Study Companion — Study Companion Controller
// Coordinates all study companion sub-systems

import { studyCompanionEngine, StudyCompanionEngine } from "./StudyCompanionEngine";
import { StudentProfileEngine } from "./StudentProfileEngine";
import { GoalManager } from "./GoalManager";
import { LearningHistoryEngine } from "./LearningHistoryEngine";
import { ProgressAnalyzer } from "./ProgressAnalyzer";
import { RecommendationEngine } from "./RecommendationEngine";
import { HabitAnalyzer } from "./HabitAnalyzer";
import { MotivationEngine } from "./MotivationEngine";
import { StudyPlanner } from "./StudyPlanner";

export interface ControllerConfig {
  userId: string;
  enableAll: boolean;
  modules: {
    profile: boolean;
    goals: boolean;
    history: boolean;
    progress: boolean;
    recommendations: boolean;
    habits: boolean;
    motivation: boolean;
    planning: boolean;
  };
}

export interface CompanionState {
  isInitialized: boolean;
  currentUser: string | null;
  activeSession: string | null;
  currentStreak: number;
  activeGoals: number;
  pendingRecommendations: number;
  todayProgress: number;
}

export class StudyCompanionController {
  private static instance: StudyCompanionController;
  private config: ControllerConfig | null = null;
  private isInitialized: boolean = false;

  // Sub-controllers
  private profileController: StudentProfileEngine;
  private goalController: GoalManager;
  private historyController: LearningHistoryEngine;
  private progressController: ProgressAnalyzer;
  private recommendationController: RecommendationEngine;
  private habitController: HabitAnalyzer;
  private motivationController: MotivationEngine;
  private plannerController: StudyPlanner;

  // State
  private listeners: Set<(state: CompanionState) => void> = new Set();

  private constructor() {
    this.profileController = new StudentProfileEngine();
    this.goalController = new GoalManager();
    this.historyController = new LearningHistoryEngine();
    this.progressController = new ProgressAnalyzer();
    this.recommendationController = new RecommendationEngine();
    this.habitController = new HabitAnalyzer();
    this.motivationController = new MotivationEngine();
    this.plannerController = new StudyPlanner();
  }

  static getInstance(): StudyCompanionController {
    if (!StudyCompanionController.instance) {
      StudyCompanionController.instance = new StudyCompanionController();
    }
    return StudyCompanionController.instance;
  }

  // Initialize all controllers
  async initialize(config: ControllerConfig): Promise<void> {
    this.config = config;

    const promises: Promise<void>[] = [];

    if (config.modules.profile) {
      promises.push(this.profileController.initialize(config.userId));
    }
    if (config.modules.goals) {
      promises.push(this.goalController.initialize(config.userId));
    }
    if (config.modules.history) {
      promises.push(this.historyController.initialize(config.userId));
    }
    if (config.modules.progress) {
      promises.push(this.progressController.initialize(config.userId));
    }
    if (config.modules.recommendations) {
      promises.push(this.recommendationController.initialize(config.userId));
    }
    if (config.modules.habits) {
      promises.push(this.habitController.initialize(config.userId));
    }
    if (config.modules.motivation) {
      promises.push(this.motivationController.initialize(config.userId));
    }
    if (config.modules.planning) {
      promises.push(this.plannerController.initialize(config.userId));
    }

    await Promise.all(promises);

    this.isInitialized = true;
    this.notifyListeners();
  }

  // Check initialization
  isReady(): boolean {
    return this.isInitialized;
  }

  // Get current state
  async getState(): Promise<CompanionState> {
    const streakInfo = this.motivationController.getStreakInfo();
    const activeGoals = await this.goalController.getActiveGoals();
    const recommendations = await this.recommendationController.getRecommendations({
      userId: this.config?.userId || "default",
      limit: 10
    });
    const todayPlan = await this.plannerController.getTodaySchedule(
      this.config?.userId || "default"
    );

    let todayProgress = 0;
    if (todayPlan) {
      const completed = todayPlan.activities.filter(a => a.completed).length;
      todayProgress = Math.round((completed / todayPlan.activities.length) * 100);
    }

    return {
      isInitialized: this.isInitialized,
      currentUser: this.config?.userId || null,
      activeSession: (await this.historyController.getCurrentSession())?.id || null,
      currentStreak: streakInfo.current,
      activeGoals: activeGoals.length,
      pendingRecommendations: recommendations.length,
      todayProgress
    };
  }

  // Start a study session
  async startStudySession(options?: {
    subject?: string;
    topics?: string[];
    contentId?: string;
    contentType?: string;
  }): Promise<any> {
    // Update streak tracking
    await this.motivationController.recordSessionStart({
      id: "",
      userId: this.config?.userId || "",
      startTime: new Date(),
      actualDuration: 0,
      topics: [],
      activities: [],
      breaks: [],
      interruptions: [],
      completedGoals: [],
      newConcepts: [],
      revisedConcepts: [],
      productivity: 0,
      focusScore: 0,
      completionRate: 0,
      status: "in_progress",
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);

    const session = await this.historyController.startSession(options);
    this.notifyListeners();

    return session;
  }

  // End study session
  async endStudySession(sessionId: string): Promise<void> {
    const session = await this.historyController.getSession(sessionId);
    if (!session) return;

    session.endTime = new Date();
    session.actualDuration = Math.floor(
      (session.endTime.getTime() - session.startTime.getTime()) / 60000
    );

    await this.historyController.endSession(session);
    await this.progressController.recordSession(session);
    await this.habitController.recordSession(session);
    await this.motivationController.recordSessionEnd(session);

    // Update goal progress
    await this.updateGoalProgressFromSession(session);

    this.notifyListeners();
  }

  private async updateGoalProgressFromSession(session: any): Promise<void> {
    const activeGoals = await this.goalController.getActiveGoals();

    for (const goal of activeGoals) {
      if (goal.subject === session.subject || !goal.subject) {
        await this.goalController.addProgress(goal.id, session.actualDuration);

        // Check if goal completed
        const updatedGoal = await this.goalController.getGoal(goal.id);
        if (updatedGoal && updatedGoal.progress >= 100) {
          await this.motivationController.celebrateGoalCompletion(updatedGoal);
        }
      }
    }
  }

  // Create a goal
  async createGoal(goalData: Partial<any>): Promise<any> {
    const goal = await this.goalController.createGoal({
      ...goalData,
      userId: this.config?.userId
    });

    this.notifyListeners();
    return goal;
  }

  // Get recommendations
  async getRecommendations(options?: {
    limit?: number;
    type?: string;
  }): Promise<any[]> {
    return this.recommendationController.getRecommendations({
      userId: this.config?.userId || "default",
      ...options
    });
  }

  // Accept recommendation
  async acceptRecommendation(recommendationId: string): Promise<void> {
    await this.recommendationController.acceptRecommendation(recommendationId);
    this.notifyListeners();
  }

  // Get progress summary
  async getProgressSummary(): Promise<any> {
    return this.progressController.getSummary(this.config?.userId || "default");
  }

  // Get habit insights
  async getHabitInsights(): Promise<any> {
    return this.habitController.getInsights(this.config?.userId || "default");
  }

  // Get study plan
  async getStudyPlan(options?: {
    duration?: number;
    targetHours?: number;
  }): Promise<any> {
    return this.plannerController.generatePlan({
      userId: this.config?.userId || "default",
      ...options
    });
  }

  // Get today's schedule
  async getTodaySchedule(): Promise<any | null> {
    return this.plannerController.getTodaySchedule(this.config?.userId || "default");
  }

  // Get motivation status
  async getMotivationStatus(): Promise<any> {
    const profile = this.motivationController.getProfile();
    const streakInfo = this.motivationController.getStreakInfo();
    const recentWins = this.motivationController.getRecentWins(5);

    return {
      profile,
      streak: streakInfo,
      recentWins
    };
  }

  // Get encouragement
  async getEncouragement(): Promise<any> {
    return this.motivationController.getEncouragement();
  }

  // Complete planned activity
  async completePlannedActivity(planId: string, activityId: string): Promise<void> {
    await this.plannerController.completeActivity(planId, activityId);
    this.notifyListeners();
  }

  // Get student profile
  getStudentProfile(): any {
    return this.profileController.getProfile();
  }

  // Update student profile
  async updateStudentProfile(updates: Partial<any>): Promise<void> {
    await this.profileController.updateProfile(updates);
    this.notifyListeners();
  }

  // Record quiz result
  async recordQuizResult(
    subject: string,
    score: number,
    totalQuestions: number,
    correctAnswers: number
  ): Promise<void> {
    await this.progressController.recordQuizResult(
      subject,
      score,
      totalQuestions,
      correctAnswers
    );
    this.notifyListeners();
  }

  // Record concept learned
  async recordConceptLearned(
    concept: string,
    subject: string,
    topic: string
  ): Promise<void> {
    await this.historyController.recordConceptLearned(concept, subject, topic);
    this.notifyListeners();
  }

  // Get concepts for review
  async getConceptsForReview(): Promise<any[]> {
    return this.historyController.getConceptsForReview();
  }

  // Detect knowledge gaps
  async detectKnowledgeGaps(): Promise<any[]> {
    return this.historyController.detectKnowledgeGaps();
  }

  // Get goals
  async getGoals(filter?: any): Promise<any[]> {
    return this.goalController.getGoals(filter);
  }

  // Subscribe to state changes
  subscribe(listener: (state: CompanionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.getState().then(state => {
      for (const listener of this.listeners) {
        listener(state);
      }
    });
  }

  // Cleanup
  destroy(): void {
    this.profileController.destroy();
    this.goalController.destroy();
    this.historyController.destroy();
    this.progressController.destroy();
    this.recommendationController.destroy();
    this.habitController.destroy();
    this.motivationController.destroy();
    this.plannerController.destroy();
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Export singleton
export const studyCompanionController = StudyCompanionController.getInstance();

// @ts-nocheck
// Study Companion — StudyCompanion Interface
// Main interface for the Study Companion Engine

import type { StudentProfile, LearningGoal, StudySession, SubjectPerformance } from "../models";

export interface StudyCompanionConfig {
  userId: string;
  persistenceEnabled?: boolean;
  autoInitialize?: boolean;
  storageKey?: string;
  defaultPreferences?: StudyCompanionPreferences;
}

export interface StudyCompanionPreferences {
  dailyGoalMinutes: number;
  weeklyGoalHours: number;
  reminderEnabled: boolean;
  reminderTime: string;
  notificationEnabled: boolean;
  darkMode?: boolean;
  compactMode?: boolean;
  showProgressBars?: boolean;
  autoStartSession?: boolean;
  trackProductivity?: boolean;
  studyDays?: number[];
}

export interface StudyCompanionState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  profile: StudentProfile | null;
  currentSession: StudySession | null;
  activeGoals: LearningGoal[];
}

export interface StudyCompanionMetrics {
  totalStudyTime: number;
  totalSessions: number;
  averageSessionLength: number;
  currentStreak: number;
  longestStreak: number;
  totalGoalsCompleted: number;
  overallProgress: number;
}

export interface StudyCompanionAPI {
  // Initialization
  initialize(userId: string): Promise<void>;
  reset(): Promise<void>;

  // Profile
  getStudentProfile(): Promise<StudentProfile>;
  updateStudentProfile(updates: Partial<StudentProfile>): Promise<void>;
  detectAndUpdateLearningStyle(): Promise<void>;

  // Sessions
  startSession(sessionData?: Partial<StudySession>): Promise<StudySession>;
  endSession(sessionId: string, data?: Partial<StudySession>): Promise<void>;
  updateSession(sessionId: string, updates: Partial<StudySession>): Promise<void>;
  getSessions(options?: SessionQueryOptions): Promise<StudySession[]>;

  // Goals
  createGoal(goalData: Partial<LearningGoal>): Promise<LearningGoal>;
  updateGoal(goalId: string, updates: Partial<LearningGoal>): Promise<void>;
  deleteGoal(goalId: string): Promise<void>;
  getActiveGoals(): Promise<LearningGoal[]>;
  getAllGoals(): Promise<LearningGoal[]>;

  // Progress
  getProgress(): Promise<StudyCompanionMetrics>;
  getSubjectPerformance(subject?: string): Promise<SubjectPerformance | SubjectPerformance[]>;
  getWeeklyProgress(): Promise<WeeklyProgress>;
  getMonthlyProgress(): Promise<MonthlyProgress>;

  // Recommendations
  getRecommendations(options?: RecommendationOptions): Promise<Recommendation[]>;
  trackRecommendationFeedback(id: string, action: "accepted" | "dismissed" | "completed"): Promise<void>;

  // State
  getState(): StudyCompanionState;
  subscribe(listener: (state: StudyCompanionState) => void): () => void;
}

export interface SessionQueryOptions {
  startDate?: Date;
  endDate?: Date;
  subject?: string;
  limit?: number;
  status?: "active" | "completed" | "all";
}

export interface RecommendationOptions {
  limit?: number;
  type?: string;
  subject?: string;
  excludeCompleted?: boolean;
}

export interface WeeklyProgress {
  weekStart: Date;
  weekEnd: Date;
  totalStudyTime: number;
  sessionsCompleted: number;
  goalsProgress: number;
  achievements: Achievement[];
}

export interface MonthlyProgress {
  month: string;
  totalStudyTime: number;
  totalSessions: number;
  goalsCompleted: number;
  topSubjects: SubjectProgress[];
  improvement: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress?: number;
  target?: number;
}

export interface SubjectProgress {
  subject: string;
  studyTime: number;
  sessions: number;
  mastery: number;
  trend: "up" | "down" | "stable";
}

// Events
export type StudyCompanionEvent =
  | { type: "INITIALIZED"; profile: StudentProfile }
  | { type: "SESSION_STARTED"; session: StudySession }
  | { type: "SESSION_ENDED"; session: StudySession }
  | { type: "GOAL_CREATED"; goal: LearningGoal }
  | { type: "GOAL_COMPLETED"; goal: LearningGoal }
  | { type: "GOAL_PROGRESS"; goalId: string; progress: number }
  | { type: "ACHIEVEMENT_UNLOCKED"; achievement: Achievement }
  | { type: "STREAK_UPDATED"; streak: number }
  | { type: "RECOMMENDATION_GENERATED"; recommendation: Recommendation }
  | { type: "ERROR"; error: string };

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  reason: string;
  priority: number;
  subject?: string;
  topic?: string;
  estimatedTime?: number;
  deadline?: Date;
  completed?: boolean;
  dismissed?: boolean;
  createdAt: Date;
}

export type StudyCompanionEventHandler = (event: StudyCompanionEvent) => void;

// Study Companion class interface
export interface IStudyCompanion {
  readonly api: StudyCompanionAPI;
  readonly version: string;
  readonly isReady: boolean;

  initialize(userId: string): Promise<void>;
  destroy(): Promise<void>;
  on(event: StudyCompanionEvent, handler: StudyCompanionEventHandler): void;
  off(event: StudyCompanionEvent, handler: StudyCompanionEventHandler): void;
}

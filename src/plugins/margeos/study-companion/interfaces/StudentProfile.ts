// Study Companion — StudentProfile Interface
// Interface for student profile management

export type LearningStyleType = "visual" | "auditory" | "reading" | "kinesthetic" | "mixed";
export type StudyPreferenceKey =
  | "preferredStudyTime"
  | "sessionDuration"
  | "breakFrequency"
  | "difficultyPreference"
  | "explanationStyle"
  | "practiceFrequency"
  | "reviewPreference";

export interface StudentProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";

  // Learning characteristics
  learningStyle: LearningStyleType;
  learningStyleConfidence: Record<LearningStyleType, number>;

  // Study preferences
  preferences: StudyPreferences;

  // Performance tracking
  performance: PerformanceMetrics;

  // Accessibility needs
  accessibility: AccessibilityNeeds;

  // Motivation
  motivation: MotivationMetrics;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface StudyPreferences {
  // Time preferences
  preferredStudyTime: "morning" | "afternoon" | "evening" | "night";
  preferredSessionDuration: number; // minutes
  maxDailyStudyTime: number; // minutes

  // Session preferences
  breakFrequency: number; // minutes between breaks
  breakDuration: number; // minutes
  pomodoroEnabled: boolean;
  pomodoroLength: number; // minutes

  // Learning preferences
  difficultyPreference: "easy" | "medium" | "hard" | "adaptive";
  explanationStyle: "simple" | "moderate" | "detailed" | "adaptive";
  practiceFrequency: "minimal" | "regular" | "extensive";
  reviewPreference: "spaced" | "massed" | "mixed";

  // Notification preferences
  reminderEnabled: boolean;
  reminderTime: string;
  notificationEnabled: boolean;

  // UI preferences
  darkMode: boolean;
  compactMode: boolean;
  showProgressBars: boolean;
  autoStartSession: boolean;
}

export interface PerformanceMetrics {
  totalStudyTime: number; // minutes
  totalSessions: number;
  totalConceptsLearned: number;
  averageQuizScore: number;
  averageSessionRating: number;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date | null;

  // Progress
  overallMastery: number; // 0-100
  weeklyProgress: number;
  monthlyProgress: number;

  // Subject-specific (aggregated)
  subjectMastery: Record<string, number>;
}

export interface AccessibilityNeeds {
  // Visual
  highContrastMode: boolean;
  largeText: boolean;
  screenReaderOptimized: boolean;

  // Audio
  closedCaptions: boolean;
  audioDescriptions: boolean;
  textToSpeech: boolean;

  // Motor
  keyboardNavigation: boolean;
  voiceControl: boolean;
  reducedMotion: boolean;

  // Cognitive
  simplifiedLanguage: boolean;
  extendedTime: boolean;
  memoryAids: boolean;

  // Additional
  customNeeds?: Record<string, boolean>;
}

export interface MotivationMetrics {
  // Engagement
  engagementScore: number; // 0-100
  intrinsicMotivation: number; // 0-100
  extrinsicMotivation: number; // 0-100

  // Goals
  goalClarity: number; // 0-100
  goalCommitment: number; // 0-100

  // Self-efficacy
  selfEfficacy: number; // 0-100
  perceivedCompetence: number; // 0-100

  // Affective
  anxiety: number; // 0-100 (lower is better)
  boredom: number; // 0-100

  // Burnout risk
  burnoutRisk: "low" | "medium" | "high";
  lastBreakTaken: Date | null;
}

// Profile update types
export interface ProfileUpdate {
  name?: string;
  email?: string;
  avatar?: string;
  level?: StudentProfile["level"];
  learningStyle?: LearningStyleType;
  preferences?: Partial<StudyPreferences>;
  accessibility?: Partial<AccessibilityNeeds>;
}

export interface ProfilePreferencesUpdate {
  preferredStudyTime?: StudyPreferences["preferredStudyTime"];
  preferredSessionDuration?: number;
  breakFrequency?: number;
  difficultyPreference?: StudyPreferences["difficultyPreference"];
  darkMode?: boolean;
  notificationEnabled?: boolean;
}

// Learning style detection
export interface LearningStyleDetection {
  detectedStyle: LearningStyleType;
  confidence: number;
  indicators: StyleIndicator[];
  suggestedActivities: string[];
}

export interface StyleIndicator {
  style: LearningStyleType;
  evidence: string;
  weight: number;
}

// Profile analytics
export interface ProfileAnalytics {
  studyPatterns: StudyPattern[];
  strengthAreas: string[];
  improvementAreas: string[];
  recommendedApproaches: string[];
  predictedSuccessRate: number;
}

export interface StudyPattern {
  pattern: string;
  frequency: number;
  impact: "positive" | "negative" | "neutral";
}

// Student profile manager interface
export interface IStudentProfileManager {
  initialize(userId: string): Promise<void>;
  getProfile(): Promise<StudentProfile>;
  updateProfile(update: ProfileUpdate): Promise<void>;
  updatePreferences(preferences: ProfilePreferencesUpdate): Promise<void>;
  detectLearningStyle(): Promise<LearningStyleDetection>;
  getAnalytics(): Promise<ProfileAnalytics>;
  reset(): Promise<void>;
}

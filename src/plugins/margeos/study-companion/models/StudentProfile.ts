// Study Companion — Student Profile Model
// Defines the persistent student learning profile

export interface LearningStyle {
  visual: number;      // 0-100
  auditory: number;    // 0-100
  reading: number;     // 0-100
  kinesthetic: number;  // 0-100
  dominant: "visual" | "auditory" | "reading" | "kinesthetic" | "mixed";
}

export interface ExplanationPreference {
  style: "detailed" | "concise" | "examples" | "mixed";
  includeExamples: boolean;
  includeAnalogies: boolean;
  includeVisuals: boolean;
  pacing: "slow" | "medium" | "fast" | "adaptive";
}

export interface StudyPreferences {
  sessionLength: number;      // minutes
  breakFrequency: number;     // minutes
  breakDuration: number;       // minutes
  maxDailyGoal: number;       // minutes
  preferredStudyTime: "morning" | "afternoon" | "evening" | "night" | "flexible";
  notificationsEnabled: boolean;
  reminderTimes: string[];    // HH:mm format
}

export interface AccessibilityNeeds {
  screenReader: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  extendedTime: boolean;
  captioning: boolean;
  braille: boolean;
}

export interface PersonalInfo {
  displayName: string;
  preferredName?: string;
  avatar?: string;
  timezone: string;
  language: string;
  grade?: string;
  subjects: string[];
}

export interface EngagementMetrics {
  totalStudyTime: number;           // minutes
  totalSessions: number;
  currentStreak: number;            // days
  longestStreak: number;             // days
  totalGoalsCompleted: number;
  totalConceptsLearned: number;
  averageSessionLength: number;      // minutes
  mostProductiveTime?: string;       // HH:mm format
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: "milestone" | "streak" | "mastery" | "explorer" | "consistent";
  earnedAt: Date;
  icon?: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  personal: PersonalInfo;
  learningStyle: LearningStyle;
  explanationPreference: ExplanationPreference;
  studyPreferences: StudyPreferences;
  accessibilityNeeds: AccessibilityNeeds;
  engagement: EngagementMetrics;
  achievements: Achievement[];
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface SubjectMastery {
  subject: string;
  topics: TopicMastery[];
  overallScore: number;
  totalTimeSpent: number;
  lastStudied: Date | null;
  trend: "improving" | "stable" | "declining";
}

export interface TopicMastery {
  topic: string;
  subtopics: SubtopicMastery[];
  score: number;
  timesReviewed: number;
  lastTested: Date | null;
}

export interface SubtopicMastery {
  name: string;
  score: number;
  mastered: boolean;
}

export type GoalType = "daily" | "weekly" | "monthly" | "exam" | "certification" | "long_term";
export type GoalStatus = "active" | "completed" | "paused" | "abandoned";
export type GoalPriority = "low" | "medium" | "high" | "critical";

export interface LearningGoal {
  id: string;
  userId: string;
  type: GoalType;
  title: string;
  description?: string;
  subject?: string;
  targetDate: Date;
  status: GoalStatus;
  priority: GoalPriority;
  progress: number;              // 0-100
  milestones: GoalMilestone[];
  linkedContent?: string[];      // IDs of related content
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface StudySession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;              // minutes
  subject?: string;
  topics?: string[];
  contentId?: string;
  contentType?: "pdf" | "tutor" | "formula" | "reference" | "visual" | "quiz" | "flashcard" | "exam";
  breaks: SessionBreak[];
  completedGoals: string[];
  productivity: number;         // 0-100
  notes?: string;
}

export interface SessionBreak {
  startTime: Date;
  endTime: Date;
  type: "short" | "long";
}

export interface LearningHistory {
  userId: string;
  sessions: StudySession[];
  booksStudied: ContentInteraction[];
  lessonsCompleted: ContentInteraction[];
  conceptsLearned: ConceptRecord[];
  formulasPracticed: PracticeRecord[];
  quizzesTaken: QuizRecord[];
  milestones: MilestoneRecord[];
}

export interface ContentInteraction {
  contentId: string;
  contentTitle: string;
  type: "pdf" | "tutor" | "formula" | "reference" | "visual" | "quiz" | "flashcard" | "exam";
  totalTime: number;
  lastAccessed: Date;
  completionRate: number;
  interactions: number;
}

export interface ConceptRecord {
  concept: string;
  subject: string;
  firstLearned: Date;
  lastReviewed: Date;
  timesReviewed: number;
  masteryLevel: number;        // 0-100
}

export interface PracticeRecord {
  formula: string;
  subject: string;
  correctCount: number;
  incorrectCount: number;
  lastPracticed: Date;
  masteryLevel: number;
}

export interface QuizRecord {
  quizId: string;
  subject: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  completedAt: Date;
}

export interface MilestoneRecord {
  id: string;
  type: string;
  title: string;
  description?: string;
  achievedAt: Date;
  relatedContent?: string[];
}

export interface Recommendation {
  id: string;
  userId: string;
  type: "lesson" | "revision" | "practice" | "assessment" | "break" | "exploration";
  priority: number;             // 1-10
  title: string;
  description: string;
  reason: string;
  subject?: string;
  topics?: string[];
  contentId?: string;
  contentType?: string;
  action?: string;
  deadline?: Date;
  completed: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface MotivationProfile {
  userId: string;
  streakDays: number;
  lastCelebration?: Date;
  encouragementLevel: "minimal" | "moderate" | "frequent";
  celebrationStyle: "subtle" | "enthusiastic" | "personalized";
  recentWins: Win[];
  missedGoals: number;
  burnoutRisk: "low" | "medium" | "high";
}

export interface Win {
  id: string;
  type: "goal_completed" | "streak_milestone" | "improvement" | "mastery" | "consistency";
  title: string;
  description: string;
  achievedAt: Date;
  celebrated: boolean;
}

export interface KnowledgeGap {
  id: string;
  subject: string;
  topic: string;
  subtopic?: string;
  severity: "minor" | "moderate" | "major";
  detectedAt: Date;
  relatedPrerequisites: string[];
  suggestedReview: string[];
  resolved: boolean;
  resolvedAt?: Date;
}

export interface StudyPlan {
  id: string;
  userId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  subjects: PlannedSubject[];
  dailySchedule: PlannedDay[];
  totalHours: number;
  completedHours: number;
  status: "active" | "completed" | "paused";
  createdAt: Date;
}

export interface PlannedSubject {
  subject: string;
  hoursAllocated: number;
  completedHours: number;
  topics: string[];
}

export interface PlannedDay {
  date: Date;
  activities: PlannedActivity[];
  completed: boolean;
}

export interface PlannedActivity {
  id: string;
  type: "new_learning" | "revision" | "practice" | "assessment" | "break";
  subject?: string;
  topic?: string;
  duration: number;         // minutes
  contentId?: string;
  completed: boolean;
}

// Factory functions
export function createDefaultStudentProfile(userId: string): StudentProfile {
  return {
    id: `profile-${Date.now()}`,
    userId,
    personal: {
      displayName: "Student",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: "en",
      subjects: []
    },
    learningStyle: {
      visual: 50,
      auditory: 50,
      reading: 50,
      kinesthetic: 50,
      dominant: "mixed"
    },
    explanationPreference: {
      style: "mixed",
      includeExamples: true,
      includeAnalogies: true,
      includeVisuals: true,
      pacing: "adaptive"
    },
    studyPreferences: {
      sessionLength: 25,
      breakFrequency: 5,
      breakDuration: 5,
      maxDailyGoal: 120,
      preferredStudyTime: "flexible",
      notificationsEnabled: true,
      reminderTimes: []
    },
    accessibilityNeeds: {
      screenReader: false,
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      extendedTime: false,
      captioning: false,
      braille: false
    },
    engagement: {
      totalStudyTime: 0,
      totalSessions: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalGoalsCompleted: 0,
      totalConceptsLearned: 0,
      averageSessionLength: 0
    },
    achievements: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActiveAt: new Date()
  };
}

export function createLearningGoal(
  userId: string,
  type: GoalType,
  title: string,
  targetDate: Date,
  options?: Partial<LearningGoal>
): LearningGoal {
  return {
    id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    title,
    targetDate,
    status: "active",
    priority: "medium",
    progress: 0,
    milestones: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...options
  };
}

export function createStudySession(
  userId: string,
  options?: Partial<StudySession>
): StudySession {
  return {
    id: `session-${Date.now()}`,
    userId,
    startTime: new Date(),
    duration: 0,
    breaks: [],
    completedGoals: [],
    productivity: 0,
    ...options
  };
}

export function createRecommendation(
  userId: string,
  type: Recommendation["type"],
  title: string,
  description: string,
  reason: string,
  options?: Partial<Recommendation>
): Recommendation {
  return {
    id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    priority: 5,
    title,
    description,
    reason,
    completed: false,
    createdAt: new Date(),
    ...options
  };
}

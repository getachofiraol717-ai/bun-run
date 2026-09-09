// Study Companion — Learning Goal Model
// Defines goal structures and tracking

export interface LearningGoal {
  id: string;
  userId: string;

  // Basic info
  type: GoalType;
  category: GoalCategory;
  title: string;
  description?: string;

  // Target
  targetDate: Date;
  targetValue?: number;
  targetUnit?: string;

  // Progress
  currentValue: number;
  progress: number;               // 0-100
  status: GoalStatus;

  // Priority and importance
  priority: GoalPriority;
  importance: number;             // 1-5

  // Structure
  milestones: GoalMilestone[];
  subgoals: LearningGoal[];
  parentGoalId?: string;

  // Content linkage
  linkedContent: LinkedContent[];
  linkedTopics: string[];

  // Subject
  subject?: string;
  topics?: string[];

  // Tracking
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date;

  // Reminders
  reminders: GoalReminder[];

  // Notes
  notes?: string;
  reflections?: string[];

  // Recurrence
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
}

export type GoalType =
  | "daily"
  | "weekly"
  | "monthly"
  | "exam"
  | "certification"
  | "long_term"
  | "skill"
  | "habit";

export type GoalCategory =
  | "study_time"
  | "mastery"
  | "completion"
  | "score"
  | "habit"
  | "exploration"
  | "practice";

export type GoalStatus =
  | "active"
  | "completed"
  | "paused"
  | "cancelled"
  | "expired";

export type GoalPriority = "low" | "medium" | "high" | "critical";

export interface GoalMilestone {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  completedAt?: Date;
  reward?: MilestoneReward;
}

export interface MilestoneReward {
  type: "badge" | "points" | "unlock" | "message";
  value: string;
}

export interface LinkedContent {
  contentId: string;
  contentType: string;
  title: string;
  progress: number;              // 0-100
  completed: boolean;
}

export interface GoalReminder {
  id: string;
  type: ReminderType;
  time: string;                  // HH:mm
  days?: number[];               // 0-6, Sunday = 0
  enabled: boolean;
  lastSent?: Date;
}

export type ReminderType =
  | "daily"
  | "weekly"
  | "custom"
  | "deadline_approaching"
  | "progress_check";

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: Date;
  maxOccurrences?: number;
}

export type RecurrenceFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

// Goal templates
export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  type: GoalType;
  category: GoalCategory;
  defaultDuration: number;       // days
  hasMilestones: boolean;
  milestoneCount?: number;
  exampleGoals: string[];
}

// Predefined templates
export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: "daily-study",
    name: "Daily Study Goal",
    description: "Study for a set amount of time each day",
    type: "daily",
    category: "study_time",
    defaultDuration: 30,
    hasMilestones: false,
    exampleGoals: [
      "Study for 30 minutes every day",
      "Complete one lesson daily",
      "Review flashcards for 15 minutes daily"
    ]
  },
  {
    id: "weekly-progress",
    name: "Weekly Progress Goal",
    description: "Complete specific tasks within a week",
    type: "weekly",
    category: "completion",
    defaultDuration: 7,
    hasMilestones: true,
    milestoneCount: 5,
    exampleGoals: [
      "Complete 5 chapters this week",
      "Finish one practice exam weekly",
      "Review all formulas twice a week"
    ]
  },
  {
    id: "exam-prep",
    name: "Exam Preparation",
    description: "Prepare for an upcoming exam",
    type: "exam",
    category: "mastery",
    defaultDuration: 30,
    hasMilestones: true,
    milestoneCount: 4,
    exampleGoals: [
      "Cover all exam topics before the exam",
      "Complete all practice problems",
      "Achieve 80% on practice exams"
    ]
  },
  {
    id: "mastery-goal",
    name: "Topic Mastery",
    description: "Master a specific topic or subject",
    type: "long_term",
    category: "mastery",
    defaultDuration: 90,
    hasMilestones: true,
    milestoneCount: 3,
    exampleGoals: [
      "Master calculus fundamentals",
      "Become proficient in Spanish grammar",
      "Understand machine learning basics"
    ]
  },
  {
    id: "habit-formation",
    name: "Study Habit",
    description: "Build a consistent study habit",
    type: "habit",
    category: "habit",
    defaultDuration: 66,          // Average habit formation time
    hasMilestones: false,
    exampleGoals: [
      "Study every morning before work",
      "Review notes before bed",
      "Practice problems during lunch breaks"
    ]
  },
  {
    id: "certification",
    name: "Certification Prep",
    description: "Prepare for a professional certification",
    type: "certification",
    category: "mastery",
    defaultDuration: 180,
    hasMilestones: true,
    milestoneCount: 6,
    exampleGoals: [
      "Pass AWS Solutions Architect exam",
      "Complete PMP certification",
      "Obtain Google Analytics certification"
    ]
  }
];

// Goal suggestions based on user profile
export interface GoalSuggestion {
  template: GoalTemplate;
  suggestedTitle: string;
  suggestedDuration: number;
  suggestedTarget: number;
  reason: string;
  benefits: string[];
  challenges: string[];
}

// Factory functions
export function createLearningGoal(
  userId: string,
  type: GoalType,
  title: string,
  targetDate: Date,
  options?: Partial<LearningGoal>
): LearningGoal {
  const now = new Date();
  return {
    id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    category: "study_time",
    title,
    targetDate,
    currentValue: 0,
    progress: 0,
    status: "active",
    priority: "medium",
    importance: 3,
    milestones: [],
    subgoals: [],
    linkedContent: [],
    linkedTopics: [],
    reminders: [],
    isRecurring: false,
    createdAt: now,
    updatedAt: now,
    startedAt: now,
    ...options
  };
}

export function createMilestone(
  title: string,
  targetValue: number,
  options?: Partial<GoalMilestone>
): GoalMilestone {
  return {
    id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    targetValue,
    currentValue: 0,
    completed: false,
    ...options
  };
}

export function createReminder(
  type: ReminderType,
  time: string,
  options?: Partial<GoalReminder>
): GoalReminder {
  return {
    id: `reminder-${Date.now()}`,
    type,
    time,
    enabled: true,
    ...options
  };
}

// Goal calculations
export function calculateProgress(
  currentValue: number,
  targetValue: number
): number {
  if (targetValue <= 0) return 0;
  return Math.min(100, Math.round((currentValue / targetValue) * 100));
}

export function getDaysRemaining(targetDate: Date): number {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getProgressStatus(
  progress: number,
  daysRemaining: number,
  targetDate: Date
): "on_track" | "ahead" | "behind" | "at_risk" | "completed" | "expired" {
  if (progress >= 100) return "completed";

  if (daysRemaining < 0) return "expired";

  // Calculate expected progress based on time
  const totalDays = Math.ceil(
    (targetDate.getTime() - new Date(targetDate.getTime() - daysRemaining * 24 * 60 * 60 * 1000).getTime())
    / (1000 * 60 * 60 * 24)
  );

  if (totalDays === 0) return "at_risk";

  const expectedProgress = ((totalDays - daysRemaining) / totalDays) * 100;
  const progressDiff = progress - expectedProgress;

  if (progressDiff > 10) return "ahead";
  if (progressDiff < -10) return "behind";
  if (daysRemaining <= 3) return "at_risk";

  return "on_track";
}

export function suggestDailyTarget(
  targetValue: number,
  targetDate: Date,
  currentProgress: number = 0
): number {
  const daysRemaining = getDaysRemaining(targetDate);
  if (daysRemaining <= 0) return targetValue - currentProgress;

  const remainingValue = targetValue - currentProgress;
  return Math.ceil(remainingValue / daysRemaining);
}

export function generateMilestones(
  targetValue: number,
  count: number
): GoalMilestone[] {
  const milestones: GoalMilestone[] = [];
  const increment = targetValue / (count + 1);

  for (let i = 1; i <= count; i++) {
    milestones.push(createMilestone(
      `Milestone ${i}`,
      Math.round(increment * i),
      { description: `Complete ${Math.round((i / count) * 100)}% of the goal` }
    ));
  }

  return milestones;
}

export function shouldSuggestGoal(
  userHistory: {
    totalStudyTime: number;
    sessionsThisWeek: number;
    currentStreak: number;
    lastGoalCompleted?: Date;
  }
): { shouldSuggest: boolean; reason?: string; type?: GoalType } {
  if (userHistory.totalStudyTime === 0) {
    return { shouldSuggest: true, reason: "Start your learning journey", type: "daily" };
  }

  if (userHistory.sessionsThisWeek === 0) {
    return { shouldSuggest: true, reason: "Get back to studying", type: "daily" };
  }

  if (userHistory.currentStreak >= 7 && userHistory.currentStreak % 7 === 0) {
    return { shouldSuggest: true, reason: "Keep your streak going strong", type: "weekly" };
  }

  if (userHistory.lastGoalCompleted) {
    const daysSinceLastGoal = Math.floor(
      (Date.now() - userHistory.lastGoalCompleted.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastGoal >= 7) {
      return { shouldSuggest: true, reason: "Time for a new challenge", type: "weekly" };
    }
  }

  return { shouldSuggest: false };
}

export function getGoalSuggestions(
  userProfile: {
    subjects: string[];
    preferredSessionLength: number;
    currentStreak: number;
  }
): GoalSuggestion[] {
  const suggestions: GoalSuggestion[] = [];

  // Daily study suggestion
  suggestions.push({
    template: GOAL_TEMPLATES[0],
    suggestedTitle: `Study ${userProfile.subjects[0] || "a subject"} for ${userProfile.preferredSessionLength} minutes`,
    suggestedDuration: 30,
    suggestedTarget: userProfile.preferredSessionLength,
    reason: "Building a daily study habit is key to long-term success",
    benefits: ["Consistent progress", "Better retention", "Reduced procrastination"],
    challenges: ["Finding time daily", "Maintaining motivation"]
  });

  // Weekly progress suggestion
  if (userProfile.currentStreak > 0) {
    suggestions.push({
      template: GOAL_TEMPLATES[1],
      suggestedTitle: `Complete all planned lessons this week`,
      suggestedDuration: 7,
      suggestedTarget: 5,
      reason: "You're building momentum - keep it up this week",
      benefits: ["Clear weekly targets", "Sense of accomplishment"],
      challenges: ["Balancing subjects", "Unexpected interruptions"]
    });
  }

  return suggestions;
}

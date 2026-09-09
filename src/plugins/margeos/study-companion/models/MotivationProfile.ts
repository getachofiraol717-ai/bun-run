// Study Companion — Motivation Profile Model
// Tracks motivation, engagement, and achievements

export interface MotivationProfile {
  userId: string;
  currentStreak: number;          // consecutive days
  longestStreak: number;
  lastStudyDate: Date | null;
  totalStudyDays: number;
  achievements: Achievement[];
  milestones: Milestone[];
  recentWins: Win[];
  encouragementLevel: EncouragementLevel;
  celebrationStyle: CelebrationStyle;
  motivationLevel: number;        // 0-100
  burnoutRisk: BurnoutRisk;
  engagementScore: number;       // 0-100
  preferredRewards: Reward[];
  studyEncouragements: string[];
  lastUpdated: Date;
}

export type EncouragementLevel = "minimal" | "moderate" | "frequent";
export type CelebrationStyle = "subtle" | "enthusiastic" | "personalized" | "none";
export type BurnoutRisk = "low" | "medium" | "high" | "critical";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  rarity: Rarity;
  icon: string;
  unlockedAt: Date;
  criteria: string;
  progress?: number;
  maxProgress?: number;
  badge?: string;
}

export type AchievementType =
  | "milestone"
  | "streak"
  | "mastery"
  | "consistency"
  | "improvement"
  | "explorer"
  | "dedication"
  | "speed";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  type: MilestoneType;
  target: number;
  current: number;
  unit: string;
  progress: number;               // 0-100
  completed: boolean;
  completedAt?: Date;
  reward?: Reward;
  nextMilestone?: {
    target: number;
    title: string;
  };
}

export type MilestoneType =
  | "study_time"
  | "sessions"
  | "streak"
  | "mastery"
  | "consistency"
  | "topics"
  | "goals"
  | "quizzes";

export interface Win {
  id: string;
  type: WinType;
  title: string;
  description: string;
  achievedAt: Date;
  celebrated: boolean;
  celebrationMethod?: string;
  relatedAchievement?: string;
  emotionalImpact?: "proud" | "excited" | "relieved" | "motivated";
}

export type WinType =
  | "goal_completed"
  | "streak_milestone"
  | "improvement"
  | "mastery"
  | "consistency"
  | "perfect_score"
  | "personal_best"
  | "breakthrough";

export interface Reward {
  id: string;
  type: RewardType;
  name: string;
  description: string;
  icon?: string;
  earnedAt?: Date;
  used?: boolean;
  expiresAt?: Date;
}

export type RewardType = "badge" | "title" | "theme" | "feature" | "content";

export interface StudyStreak {
  current: number;
  longest: number;
  lastStudyDate: Date | null;
  history: StreakDay[];
  weeklyGoal: number;
  weeklyProgress: number;
  atRisk: boolean;
}

export interface StreakDay {
  date: Date;
  studied: boolean;
  minutesStudied: number;
  goalMet: boolean;
}

export interface Encouragement {
  id: string;
  type: EncouragementType;
  message: string;
  context: string;
  timestamp: Date;
  shown: boolean;
  dismissed: boolean;
  impact?: "positive" | "neutral" | "negative";
}

export type EncouragementType =
  | "streak"
  | "progress"
  | "effort"
  | "improvement"
  | "milestone"
  | "encouragement"
  | "reminder"
  | "celebration";

export interface MotivationMetrics {
  dailyAverage: number;          // minutes
  weeklyTrend: number;           // percentage change
  consistencyScore: number;     // 0-100
  engagementScore: number;       // 0-100
  motivationScore: number;       // 0-100
  burnoutRisk: number;           // 0-100
  momentumScore: number;         // 0-100
}

export interface EngagementData {
  sessionsThisWeek: number;
  sessionsLastWeek: number;
  averageSessionLength: number;
  preferredStudyTimes: string[];
  mostProductiveDay: string;
  contentCompletionRate: number;
  quizParticipationRate: number;
  consistencyTrend: "increasing" | "stable" | "decreasing";
}

export interface MotivationTrend {
  date: Date;
  motivationLevel: number;
  studyTime: number;
  engagement: number;
  events: MotivationEvent[];
}

export interface MotivationEvent {
  type: string;
  description: string;
  impact: number;                // -10 to +10
}

export interface PersonalBest {
  id: string;
  type: PersonalBestType;
  value: number;
  previousBest?: number;
  achievedAt: Date;
  subject?: string;
  description: string;
}

export type PersonalBestType =
  | "longest_streak"
  | "longest_session"
  | "highest_score"
  | "most_content"
  | "fastest_completion"
  | "perfect_quiz";

export interface DailyMotivation {
  date: Date;
  greeting: string;
  encouragement: string;
  tip: string;
  progressSummary: {
    today: number;
    weeklyGoal: number;
    streak: number;
  };
  recommendedActions: string[];
  celebrations?: string[];
}

// Achievement definitions
export const ACHIEVEMENTS: Omit<Achievement, "id" | "unlockedAt" | "progress" | "maxProgress">[] = [
  // Streak Achievements
  {
    name: "First Step",
    description: "Complete your first study session",
    type: "streak",
    rarity: "common",
    icon: "🚀",
    criteria: "Complete 1 study session"
  },
  {
    name: "Week Warrior",
    description: "Study for 7 days in a row",
    type: "streak",
    rarity: "uncommon",
    icon: "⚔️",
    criteria: "Maintain a 7-day streak"
  },
  {
    name: "Month Master",
    description: "Study for 30 days in a row",
    type: "streak",
    rarity: "rare",
    icon: "🏆",
    criteria: "Maintain a 30-day streak"
  },
  {
    name: "Century Scholar",
    description: "Study for 100 days in a row",
    type: "streak",
    rarity: "epic",
    icon: "💯",
    criteria: "Maintain a 100-day streak"
  },
  // Mastery Achievements
  {
    name: "First Master",
    description: "Master your first topic",
    type: "mastery",
    rarity: "common",
    icon: "🎯",
    criteria: "Reach 90% mastery in any topic"
  },
  {
    name: "Subject Specialist",
    description: "Master 5 topics in one subject",
    type: "mastery",
    rarity: "uncommon",
    icon: "📚",
    criteria: "Master 5 topics in the same subject"
  },
  // Consistency Achievements
  {
    name: "Regular Learner",
    description: "Complete 10 study sessions",
    type: "consistency",
    rarity: "common",
    icon: "📅",
    criteria: "Complete 10 study sessions"
  },
  {
    name: "Dedicated Student",
    description: "Study for 100 hours total",
    type: "dedication",
    rarity: "uncommon",
    icon: "⏰",
    criteria: "Accumulate 100 hours of study time"
  },
  // Explorer Achievements
  {
    name: "Explorer",
    description: "Study content from 5 different topics",
    type: "explorer",
    rarity: "common",
    icon: "🗺️",
    criteria: "Cover content from 5 different topics"
  },
  // Improvement Achievements
  {
    name: "Rising Star",
    description: "Improve your score by 20%",
    type: "improvement",
    rarity: "uncommon",
    icon: "📈",
    criteria: "Increase any quiz score by 20%"
  }
];

// Motivation messages
export const ENCOURAGEMENT_MESSAGES: Record<EncouragementType, string[]> = {
  streak: [
    "You're on fire! Keep the streak going!",
    "Another day, another step toward mastery!",
    "Your consistency is inspiring!"
  ],
  progress: [
    "Great progress today! You're getting closer to your goals.",
    "Every minute counts. You're doing amazing!",
    "Look how far you've come!"
  ],
  effort: [
    "Your effort is paying off!",
    "Keep pushing - you're making real progress!",
    "The work you're putting in matters!"
  ],
  improvement: [
    "You're getting better every day!",
    "Your hard work is showing results!",
    "This improvement is well-deserved!"
  ],
  milestone: [
    "Congratulations on reaching this milestone!",
    "You did it! This is a big achievement!",
    "Celebrating your success!"
  ],
  encouragement: [
    "You've got this!",
    "Remember why you started. You've got this!",
    "Every expert was once a beginner. Keep going!"
  ],
  reminder: [
    "Ready for today's learning session?",
    "Your future self will thank you!",
    "A quick study session could make a big difference!"
  ],
  celebration: [
    "🎉 Amazing work!",
    "🏆 You should be proud!",
    "⭐ That's fantastic progress!"
  ]
};

// Factory functions
export function createMotivationProfile(userId: string): MotivationProfile {
  return {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    totalStudyDays: 0,
    achievements: [],
    milestones: [],
    recentWins: [],
    encouragementLevel: "moderate",
    celebrationStyle: "personalized",
    motivationLevel: 75,
    burnoutRisk: "low",
    engagementScore: 50,
    preferredRewards: [],
    studyEncouragements: [],
    lastUpdated: new Date()
  };
}

export function createWin(
  type: WinType,
  title: string,
  description: string,
  options?: Partial<Win>
): Win {
  return {
    id: `win-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    description,
    achievedAt: new Date(),
    celebrated: false,
    ...options
  };
}

export function createStreak(
  weeklyGoal: number = 7
): StudyStreak {
  return {
    current: 0,
    longest: 0,
    lastStudyDate: null,
    history: [],
    weeklyGoal,
    weeklyProgress: 0,
    atRisk: false
  };
}

export function createDailyMotivation(
  progressSummary: MotivationMetrics
): DailyMotivation {
  const greetings = [
    "Good morning! Ready to learn?",
    "Welcome back! Let's make today count.",
    "Another day to grow your knowledge!"
  ];

  const tips = [
    "Try breaking your study session into 25-minute chunks with short breaks.",
    "Teaching what you learn is one of the best ways to remember it.",
    "Stay hydrated! A glass of water can help you focus."
  ];

  return {
    date: new Date(),
    greeting: greetings[Math.floor(Math.random() * greetings.length)],
    encouragement: "Every step forward is progress!",
    tip: tips[Math.floor(Math.random() * tips.length)],
    progressSummary: {
      today: 0,
      weeklyGoal: progressSummary.dailyAverage * 7,
      streak: 0
    },
    recommendedActions: []
  };
}

export function calculateBurnoutRisk(metrics: MotivationMetrics): BurnoutRisk {
  if (metrics.burnoutRisk > 80) return "critical";
  if (metrics.burnoutRisk > 60) return "high";
  if (metrics.burnoutRisk > 30) return "medium";
  return "low";
}

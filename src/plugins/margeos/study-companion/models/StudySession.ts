// Study Companion — Study Session Model
// Defines study session tracking and analytics

export interface StudySession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  plannedDuration?: number;      // minutes (from schedule)
  actualDuration: number;        // minutes
  subject?: string;
  topics: string[];
  contentId?: string;
  contentType?: ContentType;
  contentTitle?: string;

  // Session flow
  activities: SessionActivity[];
  breaks: SessionBreak[];
  interruptions: SessionInterruption[];

  // Performance metrics
  productivity: number;           // 0-100
  focusScore: number;            // 0-100
  completionRate: number;       // 0-100

  // Results
  completedGoals: string[];
  newConcepts: string[];
  revisedConcepts: string[];
  quizResults?: QuizResult[];

  // Context
  location?: string;
  device?: string;
  energyLevel?: EnergyLevel;
  mood?: MoodLevel;

  // Notes
  notes?: string;
  reflections?: string;

  // Status
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentType =
  | "pdf"
  | "tutor"
  | "formula"
  | "reference"
  | "visual"
  | "quiz"
  | "flashcard"
  | "exam"
  | "lesson"
  | "video";

export type SessionStatus = "planned" | "in_progress" | "completed" | "paused" | "cancelled" | "abandoned";

export type EnergyLevel = "low" | "medium" | "high";
export type MoodLevel = "frustrated" | "neutral" | "focused" | "motivated" | "excited";

export interface SessionActivity {
  id: string;
  type: ActivityType;
  startTime: Date;
  endTime?: Date;
  duration: number;              // seconds
  subject?: string;
  topic?: string;
  contentId?: string;
  contentType?: ContentType;
  title?: string;
  result?: ActivityResult;
  metadata?: Record<string, any>;
}

export type ActivityType =
  | "reading"
  | "watching"
  | "listening"
  | "practicing"
  | "testing"
  | "reviewing"
  | "note_taking"
  | "discussing"
  | "exploring"
  | "break";

export interface ActivityResult {
  completed: boolean;
  comprehensionScore?: number;   // 0-100
  accuracyScore?: number;        // 0-100
  progressMade?: number;         // 0-100
  pagesRead?: number;
  exercisesCompleted?: number;
  correctAnswers?: number;
  totalQuestions?: number;
}

export interface SessionBreak {
  id: string;
  startTime: Date;
  endTime?: Date;
  type: BreakType;
  duration: number;              // seconds
  taken: boolean;
  skipped: boolean;
  reason?: string;
}

export type BreakType = "short" | "long" | "meal" | "stretch" | "walk";

export interface SessionInterruption {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;              // seconds
  type: InterruptionType;
  description?: string;
  resumed: boolean;
}

export type InterruptionType =
  | "notification"
  | "phone_call"
  | "message"
  | "distraction"
  | "technical_issue"
  | "personal"
  | "other";

export interface QuizResult {
  quizId: string;
  quizTitle: string;
  subject: string;
  topic?: string;
  score: number;                // 0-100
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number;            // seconds
  difficulty: "easy" | "medium" | "hard";
  questionsMissed: string[];
}

export interface SessionSummary {
  totalTime: number;             // minutes
  productiveTime: number;       // minutes (excluding breaks)
  breakTime: number;            // minutes
  focusTime: number;            // minutes
  distractionTime: number;      // minutes

  activitiesCompleted: number;
  contentCompleted: number;
  conceptsLearned: number;
  conceptsReviewed: number;

  productivity: number;         // 0-100
  effectiveness: number;       // 0-100
  satisfaction: number;        // 0-100

  comparedToAverage: {
    duration: number;           // percentage vs average
    productivity: number;
  };
}

// Session templates
export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;              // minutes
  activities: TemplateActivity[];
  breaks: TemplateBreak[];
  subjects?: string[];
}

export interface TemplateActivity {
  type: ActivityType;
  duration: number;              // minutes
  contentType?: ContentType;
  subject?: string;
  topic?: string;
}

export interface TemplateBreak {
  afterMinutes: number;
  type: BreakType;
  duration: number;              // minutes
}

// Default templates
export const DEFAULT_SESSION_TEMPLATES: SessionTemplate[] = [
  {
    id: "focused-25",
    name: "Pomodoro Focus",
    description: "25 minutes of focused study with short breaks",
    duration: 30,
    activities: [
      { type: "reading", duration: 20 },
      { type: "practicing", duration: 5 }
    ],
    breaks: [
      { afterMinutes: 25, type: "short", duration: 5 }
    ]
  },
  {
    id: "deep-60",
    name: "Deep Work Session",
    description: "60 minutes of intensive study",
    duration: 75,
    activities: [
      { type: "reading", duration: 25 },
      { type: "note_taking", duration: 10 },
      { type: "practicing", duration: 20 },
      { type: "testing", duration: 5 }
    ],
    breaks: [
      { afterMinutes: 30, type: "short", duration: 5 },
      { afterMinutes: 60, type: "long", duration: 15 }
    ]
  },
  {
    id: "quick-15",
    name: "Quick Review",
    description: "15 minutes for a quick session",
    duration: 15,
    activities: [
      { type: "reviewing", duration: 10 },
      { type: "practicing", duration: 5 }
    ],
    breaks: []
  },
  {
    id: "learning-45",
    name: "Learning Block",
    description: "45 minutes focused on new content",
    duration: 55,
    activities: [
      { type: "reading", duration: 15 },
      { type: "watching", duration: 10 },
      { type: "note_taking", duration: 10 },
      { type: "practicing", duration: 10 }
    ],
    breaks: [
      { afterMinutes: 25, type: "short", duration: 5 },
      { afterMinutes: 45, type: "long", duration: 10 }
    ]
  }
];

// Factory functions
export function createStudySession(
  userId: string,
  options?: Partial<StudySession>
): StudySession {
  const now = new Date();
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    startTime: now,
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
    status: "planned",
    createdAt: now,
    updatedAt: now,
    ...options
  };
}

export function createSessionActivity(
  type: ActivityType,
  duration: number,
  options?: Partial<SessionActivity>
): SessionActivity {
  const now = new Date();
  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    startTime: now,
    duration,
    ...options
  };
}

export function createSessionBreak(
  type: BreakType,
  duration: number,
  afterMinutes: number
): SessionBreak {
  return {
    id: `break-${Date.now()}`,
    startTime: new Date(),
    type,
    duration,
    taken: false,
    skipped: false
  };
}

export function calculateSessionMetrics(session: StudySession): SessionSummary {
  const totalMs = session.endTime
    ? session.endTime.getTime() - session.startTime.getTime()
    : Date.now() - session.startTime.getTime();

  const totalMinutes = Math.floor(totalMs / 60000);

  // Calculate break time
  const breakTime = session.breaks
    .filter(b => b.taken && b.endTime)
    .reduce((sum, b) => {
      return sum + (b.endTime!.getTime() - b.startTime.getTime()) / 60000;
    }, 0);

  // Calculate productive time
  const productiveTime = session.activities
    .filter(a => a.type !== "break")
    .reduce((sum, a) => sum + a.duration / 60, 0);

  // Calculate distraction time
  const distractionTime = session.interruptions
    .filter(i => !i.resumed)
    .reduce((sum, i) => sum + i.duration / 60, 0);

  return {
    totalTime: totalMinutes,
    productiveTime: Math.round(productiveTime),
    breakTime: Math.round(breakTime),
    focusTime: Math.round(productiveTime - distractionTime),
    distractionTime: Math.round(distractionTime),

    activitiesCompleted: session.activities.filter(a => a.result?.completed).length,
    contentCompleted: session.activities.filter(a => a.result?.completed).length,
    conceptsLearned: session.newConcepts.length,
    conceptsReviewed: session.revisedConcepts.length,

    productivity: session.productivity,
    effectiveness: session.completionRate,
    satisfaction: session.productivity,

    comparedToAverage: {
      duration: 0, // Would need historical data
      productivity: 0
    }
  };
}

export function getRecommendedBreakDuration(
  sessionLength: number,
  breakType: BreakType = "short"
): number {
  if (breakType === "long") {
    return 15; // 15-20 minutes for long breaks
  }

  // Pomodoro-style: 5 minutes for every 25 minutes
  if (sessionLength >= 45) {
    return 5;
  }

  return 3; // Shorter breaks for shorter sessions
}

export function shouldTakeBreak(
  session: StudySession,
  sessionLength: number,
  breakFrequency: number
): boolean {
  // Check if it's time for a scheduled break
  const elapsedMinutes = Math.floor(
    (Date.now() - session.startTime.getTime()) / 60000
  );

  return elapsedMinutes > 0 && elapsedMinutes % breakFrequency === 0;
}

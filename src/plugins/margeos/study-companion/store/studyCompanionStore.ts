// @ts-nocheck
// Study Companion — State Store
// Centralized state management for Study Companion

import type { StudentProfile, LearningGoal, StudySession, SubjectPerformance } from "../models";
import type { Recommendation } from "../hooks/useRecommendations";

export interface StudyCompanionState {
  // User state
  userId: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Profile
  profile: StudentProfile | null;
  preferences: StudyCompanionPreferences;

  // Goals
  goals: LearningGoal[];
  activeGoals: LearningGoal[];

  // Sessions
  currentSession: StudySession | null;
  recentSessions: StudySession[];

  // Performance
  subjectPerformance: SubjectPerformance[];
  overallProgress: number;

  // Recommendations
  recommendations: Recommendation[];
  pendingReviews: Recommendation[];

  // Motivation
  streak: {
    current: number;
    longest: number;
  };
  achievements: Achievement[];

  // UI State
  isSidebarOpen: boolean;
  activeTab: string;
  notifications: Notification[];
}

export interface StudyCompanionPreferences {
  dailyGoalMinutes: number;
  weeklyGoalHours: number;
  reminderEnabled: boolean;
  reminderTime: string;
  notificationEnabled: boolean;
  darkMode: boolean;
  compactMode: boolean;
  showProgressBars: boolean;
  autoStartSession: boolean;
  trackProductivity: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  target: number;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "achievement";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export type StudyCompanionAction =
  | { type: "INITIALIZE"; payload: { userId: string; profile: StudentProfile } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "UPDATE_PROFILE"; payload: Partial<StudentProfile> }
  | { type: "SET_GOALS"; payload: LearningGoal[] }
  | { type: "ADD_GOAL"; payload: LearningGoal }
  | { type: "UPDATE_GOAL"; payload: { id: string; updates: Partial<LearningGoal> } }
  | { type: "DELETE_GOAL"; payload: string }
  | { type: "START_SESSION"; payload: StudySession }
  | { type: "END_SESSION"; payload: { id: string; updates: Partial<StudySession> } }
  | { type: "UPDATE_SESSION"; payload: { id: string; updates: Partial<StudySession> } }
  | { type: "SET_SUBJECT_PERFORMANCE"; payload: SubjectPerformance[] }
  | { type: "SET_OVERALL_PROGRESS"; payload: number }
  | { type: "SET_RECOMMENDATIONS"; payload: Recommendation[] }
  | { type: "ADD_RECOMMENDATION"; payload: Recommendation }
  | { type: "UPDATE_RECOMMENDATION"; payload: { id: string; updates: Partial<Recommendation> } }
  | { type: "REMOVE_RECOMMENDATION"; payload: string }
  | { type: "SET_STREAK"; payload: { current: number; longest: number } }
  | { type: "ADD_ACHIEVEMENT"; payload: Achievement }
  | { type: "UNLOCK_ACHIEVEMENT"; payload: string }
  | { type: "UPDATE_PREFERENCES"; payload: Partial<StudyCompanionPreferences> }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_ACTIVE_TAB"; payload: string }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "CLEAR_NOTIFICATIONS" }
  | { type: "RESET" };

const initialState: StudyCompanionState = {
  userId: null,
  isInitialized: false,
  isLoading: false,
  error: null,
  profile: null,
  preferences: {
    dailyGoalMinutes: 60,
    weeklyGoalHours: 10,
    reminderEnabled: true,
    reminderTime: "09:00",
    notificationEnabled: true,
    darkMode: false,
    compactMode: false,
    showProgressBars: true,
    autoStartSession: false,
    trackProductivity: true
  },
  goals: [],
  activeGoals: [],
  currentSession: null,
  recentSessions: [],
  subjectPerformance: [],
  overallProgress: 0,
  recommendations: [],
  pendingReviews: [],
  streak: { current: 0, longest: 0 },
  achievements: [],
  isSidebarOpen: false,
  activeTab: "overview",
  notifications: []
};

export function studyCompanionReducer(
  state: StudyCompanionState,
  action: StudyCompanionAction
): StudyCompanionState {
  switch (action.type) {
    case "INITIALIZE":
      return {
        ...state,
        userId: action.payload.userId,
        profile: action.payload.profile,
        isInitialized: true,
        isLoading: false,
        error: null
      };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "UPDATE_PROFILE":
      return {
        ...state,
        profile: state.profile ? { ...state.profile, ...action.payload } : null
      };

    case "SET_GOALS":
      return {
        ...state,
        goals: action.payload,
        activeGoals: action.payload.filter(g => g.status === "active")
      };

    case "ADD_GOAL":
      return {
        ...state,
        goals: [...state.goals, action.payload],
        activeGoals:
          action.payload.status === "active"
            ? [...state.activeGoals, action.payload]
            : state.activeGoals
      };

    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map(g =>
          g.id === action.payload.id ? { ...g, ...action.payload.updates } : g
        ),
        activeGoals: state.activeGoals.map(g =>
          g.id === action.payload.id ? { ...g, ...action.payload.updates } : g
        ).filter(g => g.status === "active")
      };

    case "DELETE_GOAL":
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.payload),
        activeGoals: state.activeGoals.filter(g => g.id !== action.payload)
      };

    case "START_SESSION":
      return {
        ...state,
        currentSession: action.payload,
        recentSessions: [action.payload, ...state.recentSessions.slice(0, 9)]
      };

    case "END_SESSION":
      return {
        ...state,
        currentSession: null,
        recentSessions: state.recentSessions.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
        )
      };

    case "UPDATE_SESSION":
      if (state.currentSession?.id === action.payload.id) {
        return {
          ...state,
          currentSession: { ...state.currentSession, ...action.payload.updates }
        };
      }
      return {
        ...state,
        recentSessions: state.recentSessions.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
        )
      };

    case "SET_SUBJECT_PERFORMANCE":
      return { ...state, subjectPerformance: action.payload };

    case "SET_OVERALL_PROGRESS":
      return { ...state, overallProgress: action.payload };

    case "SET_RECOMMENDATIONS":
      return { ...state, recommendations: action.payload };

    case "ADD_RECOMMENDATION":
      return {
        ...state,
        recommendations: [...state.recommendations, action.payload]
      };

    case "UPDATE_RECOMMENDATION":
      return {
        ...state,
        recommendations: state.recommendations.map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
        )
      };

    case "REMOVE_RECOMMENDATION":
      return {
        ...state,
        recommendations: state.recommendations.filter(r => r.id !== action.payload)
      };

    case "SET_STREAK":
      return { ...state, streak: action.payload };

    case "ADD_ACHIEVEMENT":
      return { ...state, achievements: [...state.achievements, action.payload] };

    case "UNLOCK_ACHIEVEMENT":
      return {
        ...state,
        achievements: state.achievements.map(a =>
          a.id === action.payload ? { ...a, unlockedAt: new Date() } : a
        )
      };

    case "UPDATE_PREFERENCES":
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      };

    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarOpen: !state.isSidebarOpen };

    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };

    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        )
      };

    case "CLEAR_NOTIFICATIONS":
      return { ...state, notifications: [] };

    case "RESET":
      return { ...initialState };

    default:
      return state;
  }
}

// Helper functions
export function createNotification(
  type: Notification["type"],
  title: string,
  message: string,
  actionUrl?: string
): Notification {
  return {
    id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    message,
    timestamp: new Date(),
    read: false,
    actionUrl
  };
}

export function createAchievement(
  id: string,
  title: string,
  description: string,
  icon: string,
  target: number
): Achievement {
  return {
    id,
    title,
    description,
    icon,
    progress: 0,
    target
  };
}

export { initialState };

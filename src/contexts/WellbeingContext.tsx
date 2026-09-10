import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { streamAgent } from '@/plugins/margeos/agentClient';
import { useAuth } from '@/contexts/AuthContext';

export interface SessionLog {
  id: string;
  page: string;
  startTime: number;
  endTime?: number;
  duration: number;
}

export interface DailyStats {
  date: string;
  totalMinutes: number;
  sessions: number;
  pagesVisited: string[];
  quizzesTaken: number;
  booksOpened: number;
  aiQuestions: number;
}

export interface WellbeingData {
  todayMinutes: number;
  weeklyMinutes: number;
  dailyGoal: number;
  currentSession: SessionLog | null;
  sessionHistory: SessionLog[];
  weeklyData: DailyStats[];
  screenTimeByPage: Record<string, number>;
  focusScore: number;
  breakReminders: number;
}

export interface WellbeingSettings {
  focusMode: boolean;
  focusStartedAt: number | null;
  focusPausedAt: number | null;
  focusAccumulated: number;
  sleepMode: boolean;
  sleepStart: string;
  sleepEnd: string;
  muteNotifs: boolean;
  notifications: Record<string, boolean>;
}

export interface DailyCheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  mood: 'great' | 'good' | 'okay' | 'tired' | 'stressed';
  energy: number; // 1-5
  motivation: number; // 1-5
  stress: number; // 1-5
  focus: number; // 1-5
  sleepQuality: number; // 1-5
  note?: string;
  createdAt: number;
}

export interface WellbeingGoal {
  id: string;
  title: string;
  description: string;
  category: 'study' | 'health' | 'habits' | 'personal';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: number;
}

export interface WellbeingHabit {
  id: string;
  title: string;
  category: 'study' | 'mindfulness' | 'health' | 'routine';
  frequency: 'daily' | 'weekdays' | 'weekly';
  streak: number;
  completedDates: string[]; // array of YYYY-MM-DD
  createdAt: number;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  learnedToday: string;
  accomplished: string;
  difficulties: string;
  proudOf: string;
  tomorrowPlan: string;
  mood?: string;
  createdAt: number;
}

export interface WellbeingChallenge {
  id: string;
  title: string;
  description: string;
  period: 'daily' | 'weekly' | 'monthly';
  xpReward: number;
  progress: number;
  target: number;
  completed: boolean;
  badge: string;
}

export interface CoachMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: number;
}

interface WellbeingContextType {
  data: WellbeingData;
  settings: WellbeingSettings;
  checkIns: DailyCheckIn[];
  goals: WellbeingGoal[];
  habits: WellbeingHabit[];
  journals: JournalEntry[];
  challenges: WellbeingChallenge[];
  coachMessages: CoachMessage[];

  // Existing methods
  startSession: (page: string) => void;
  endSession: () => void;
  setDailyGoal: (minutes: number) => void;
  resetToday: () => void;
  updateSettings: (partial: Partial<WellbeingSettings>) => void;
  getFocusElapsed: () => number;
  startFocus: () => void;
  stopFocus: () => void;
  pauseFocus: () => void;
  resumeFocus: () => void;

  // Hub methods
  addCheckIn: (checkIn: Omit<DailyCheckIn, 'id' | 'createdAt'>) => void;
  addGoal: (goal: Omit<WellbeingGoal, 'id' | 'createdAt' | 'currentValue' | 'status'>) => void;
  updateGoalProgress: (id: string, delta: number) => void;
  toggleGoalStatus: (id: string) => void;
  deleteGoal: (id: string) => void;
  addHabit: (habit: Omit<WellbeingHabit, 'id' | 'createdAt' | 'streak' | 'completedDates'>) => void;
  toggleHabitForDate: (id: string, dateStr?: string) => void;
  deleteHabit: (id: string) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  deleteJournalEntry: (id: string) => void;
  completeChallenge: (id: string) => void;
  sendCoachMessage: (prompt: string) => Promise<string>;
}

const WellbeingContext = createContext<WellbeingContextType | undefined>(undefined);

const SETTINGS_KEY = 'ku_wellbeing_settings';
const TRACKING_KEY = 'ku_wellbeing_tracking';
const CHECKINS_KEY = 'ku_wellbeing_checkins';
const GOALS_KEY = 'ku_wellbeing_goals';
const HABITS_KEY = 'ku_wellbeing_habits';
const JOURNALS_KEY = 'ku_wellbeing_journals';
const CHALLENGES_KEY = 'ku_wellbeing_challenges';
const COACH_MESSAGES_KEY = 'ku_wellbeing_coach_messages';
export const HYDRATION_KEY = 'ku_wellbeing_hydration';
export const FOCUS_SESSIONS_KEY = 'ku_wellbeing_focus_sessions';

/** All wellbeing data is stored per signed-in account so entries never mix between users. */
let activeScope = 'guest';
export const scopedKey = (key: string) => `${key}::${activeScope}`;

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(scopedKey(key));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
};

const writeJSON = (key: string, value: unknown) => {
  try { localStorage.setItem(scopedKey(key), JSON.stringify(value)); } catch {}
};

const getTodayKey = () => new Date().toISOString().split('T')[0];
const getDayName = () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];

const generateEmptyWeekly = (): DailyStats[] => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((d) => ({
    date: d,
    totalMinutes: 0,
    sessions: 0,
    pagesVisited: [],
    quizzesTaken: 0,
    booksOpened: 0,
    aiQuestions: 0,
  }));
};

const defaultSettings: WellbeingSettings = {
  focusMode: false,
  focusStartedAt: null,
  focusPausedAt: null,
  focusAccumulated: 0,
  sleepMode: false,
  sleepStart: '22:00',
  sleepEnd: '07:00',
  muteNotifs: false,
  notifications: { breaks: true, goals: true, streaks: true, weekly: true, focus: true },
};

const defaultData: WellbeingData = {
  todayMinutes: 0,
  weeklyMinutes: 0,
  dailyGoal: 60,
  currentSession: null,
  sessionHistory: [],
  weeklyData: generateEmptyWeekly(),
  screenTimeByPage: {},
  focusScore: 0,
  breakReminders: 0,
};

// Suggested starting habits — no fake streaks or completions.
const initialDefaultHabits: WellbeingHabit[] = [
  { id: 'h1', title: 'Read 20 Minutes', category: 'study', frequency: 'daily', streak: 0, completedDates: [], createdAt: Date.now() },
  { id: 'h2', title: 'Review Study Notes', category: 'study', frequency: 'daily', streak: 0, completedDates: [], createdAt: Date.now() },
  { id: 'h3', title: 'Hydrate (2 Liters)', category: 'health', frequency: 'daily', streak: 0, completedDates: [], createdAt: Date.now() },
  { id: 'h4', title: '20-20-20 Eye Breaks', category: 'health', frequency: 'daily', streak: 0, completedDates: [], createdAt: Date.now() },
  { id: 'h5', title: 'Daily Reflection Journal', category: 'mindfulness', frequency: 'daily', streak: 0, completedDates: [], createdAt: Date.now() },
];

const initialDefaultGoals: WellbeingGoal[] = [];

const initialDefaultChallenges: WellbeingChallenge[] = [
  { id: 'c1', title: '7-Day Consistent Study Streak', description: 'Log active learning time every day for 7 consecutive days', period: 'weekly', xpReward: 150, progress: 0, target: 7, completed: false, badge: '🔥 Streak Master' },
  { id: 'c2', title: 'Hydration Hero', description: 'Reach your 2000ml hydration target on 3 days this week', period: 'weekly', xpReward: 100, progress: 0, target: 3, completed: false, badge: '💧 Hydration Hero' },
  { id: 'c3', title: 'Mindful Learner', description: 'Complete 3 personal growth journal reflections', period: 'weekly', xpReward: 120, progress: 0, target: 3, completed: false, badge: '📝 Mindful Learner' },
  { id: 'c4', title: 'Deep Focus Master', description: 'Complete 4 study focus sessions', period: 'monthly', xpReward: 200, progress: 0, target: 4, completed: false, badge: '🧠 Focus Specialist' },
];

const defaultCoachWelcomeMessages: CoachMessage[] = [
  {
    id: 'm0',
    sender: 'coach',
    text: "Hello! I'm your AI Wellbeing & Self-Improvement Coach. How can I support your study routines, habit building, or balance today?",
    timestamp: Date.now(),
  },
];

interface TrackingState {
  sessionStartedAt: number | null;
  todayKey: string;
  todayMinutes: number;
  weeklyData: DailyStats[];
  sessionHistory: SessionLog[];
  screenTimeByPage: Record<string, number>;
  currentPage: string | null;
  dailyGoal: number;
}

const loadTracking = (): TrackingState | null => readJSON<TrackingState | null>(TRACKING_KEY, null);

const saveTracking = (state: TrackingState) => writeJSON(TRACKING_KEY, state);

const loadSettings = (): WellbeingSettings => ({ ...defaultSettings, ...readJSON(SETTINGS_KEY, {}) });

const saveSettings = (s: WellbeingSettings) => writeJSON(SETTINGS_KEY, s);

/** Rebuilds today's tracking snapshot from storage for the active account. */
const buildDataFromStorage = (): WellbeingData => {
  const tracking = loadTracking();
  const today = getTodayKey();
  if (tracking && tracking.todayKey === today) {
    let extraMinutes = 0;
    if (tracking.sessionStartedAt) extraMinutes = (Date.now() - tracking.sessionStartedAt) / 60000;
    return {
      ...defaultData,
      todayMinutes: tracking.todayMinutes + extraMinutes,
      weeklyData: tracking.weeklyData || generateEmptyWeekly(),
      sessionHistory: tracking.sessionHistory || [],
      screenTimeByPage: tracking.screenTimeByPage || {},
      dailyGoal: tracking.dailyGoal || 60,
      currentSession: tracking.sessionStartedAt ? {
        id: tracking.sessionStartedAt.toString(),
        page: tracking.currentPage || 'App',
        startTime: tracking.sessionStartedAt,
        duration: extraMinutes,
      } : null,
    };
  }
  if (tracking) {
    return {
      ...defaultData,
      weeklyData: tracking.weeklyData || generateEmptyWeekly(),
      dailyGoal: tracking.dailyGoal || 60,
      todayMinutes: 0,
    };
  }
  return defaultData;
};

export const WellbeingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const accountScope = user?.id ?? 'guest';
  if (activeScope !== accountScope) activeScope = accountScope;

  const [settings, setSettings] = useState<WellbeingSettings>(loadSettings);
  const [data, setData] = useState<WellbeingData>(buildDataFromStorage);

  // Hub data state
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>(() => readJSON<DailyCheckIn[]>(CHECKINS_KEY, []));
  const [goals, setGoals] = useState<WellbeingGoal[]>(() => readJSON<WellbeingGoal[]>(GOALS_KEY, initialDefaultGoals));
  const [habits, setHabits] = useState<WellbeingHabit[]>(() => readJSON<WellbeingHabit[]>(HABITS_KEY, initialDefaultHabits));
  const [journals, setJournals] = useState<JournalEntry[]>(() => readJSON<JournalEntry[]>(JOURNALS_KEY, []));
  const [challenges, setChallenges] = useState<WellbeingChallenge[]>(() => readJSON<WellbeingChallenge[]>(CHALLENGES_KEY, initialDefaultChallenges));
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>(() => readJSON<CoachMessage[]>(COACH_MESSAGES_KEY, defaultCoachWelcomeMessages));
  const [focusSessions, setFocusSessions] = useState<number>(() => readJSON<{ date: string }[]>(FOCUS_SESSIONS_KEY, []).length);

  // Reload everything when the signed-in account changes, so one student never
  // sees another student's entries and each account keeps its own history.
  const hydratedScope = useRef<string>(accountScope);
  useEffect(() => {
    if (hydratedScope.current === accountScope) return;
    activeScope = accountScope;
    setSettings(loadSettings());
    setData(buildDataFromStorage());
    setCheckIns(readJSON<DailyCheckIn[]>(CHECKINS_KEY, []));
    setGoals(readJSON<WellbeingGoal[]>(GOALS_KEY, initialDefaultGoals));
    setHabits(readJSON<WellbeingHabit[]>(HABITS_KEY, initialDefaultHabits));
    setJournals(readJSON<JournalEntry[]>(JOURNALS_KEY, []));
    setChallenges(readJSON<WellbeingChallenge[]>(CHALLENGES_KEY, initialDefaultChallenges));
    setCoachMessages(readJSON<CoachMessage[]>(COACH_MESSAGES_KEY, defaultCoachWelcomeMessages));
    setFocusSessions(readJSON<{ date: string }[]>(FOCUS_SESSIONS_KEY, []).length);
    hydratedScope.current = accountScope;
  }, [accountScope]);

  // Persist hub states whenever they update
  useEffect(() => { writeJSON(CHECKINS_KEY, checkIns); }, [checkIns, accountScope]);
  useEffect(() => { writeJSON(GOALS_KEY, goals); }, [goals, accountScope]);
  useEffect(() => { writeJSON(HABITS_KEY, habits); }, [habits, accountScope]);
  useEffect(() => { writeJSON(JOURNALS_KEY, journals); }, [journals, accountScope]);
  useEffect(() => { writeJSON(CHALLENGES_KEY, challenges); }, [challenges, accountScope]);
  useEffect(() => { writeJSON(COACH_MESSAGES_KEY, coachMessages); }, [coachMessages, accountScope]);

  // Auto-start session on mount
  useEffect(() => {
    if (!data.currentSession) {
      startSession('App');
    }
  }, []);

  // Persist tracking state periodically
  useEffect(() => {
    const persist = () => {
      const today = getTodayKey();
      const dayName = getDayName();
      const weeklyData = [...data.weeklyData];
      const dayIdx = weeklyData.findIndex(d => d.date === dayName);
      if (dayIdx >= 0) {
        weeklyData[dayIdx] = {
          ...weeklyData[dayIdx],
          totalMinutes: data.todayMinutes,
          sessions: data.sessionHistory.length,
        };
      }

      const trackingState: TrackingState = {
        sessionStartedAt: data.currentSession?.startTime || null,
        todayKey: today,
        todayMinutes: data.todayMinutes,
        weeklyData,
        sessionHistory: data.sessionHistory,
        screenTimeByPage: data.screenTimeByPage,
        currentPage: data.currentSession?.page || null,
        dailyGoal: data.dailyGoal,
      };
      saveTracking(trackingState);
    };

    persist();
    const interval = setInterval(persist, 5000);
    return () => clearInterval(interval);
  }, [data]);

  // Real-time tracking using timestamp diff
  useEffect(() => {
    let lastTick = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTick) / 60000;
      lastTick = now;

      setData(prev => {
        if (!prev.currentSession) return prev;
        const sessionDuration = (now - prev.currentSession.startTime) / 60000;
        return {
          ...prev,
          todayMinutes: prev.todayMinutes + elapsed,
          weeklyMinutes: prev.weeklyMinutes + elapsed,
          currentSession: { ...prev.currentSession, duration: sessionDuration },
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startSession = useCallback((page: string) => {
    const session: SessionLog = {
      id: Date.now().toString(),
      page,
      startTime: Date.now(),
      duration: 0,
    };
    setData(prev => ({
      ...prev,
      currentSession: session,
      screenTimeByPage: {
        ...prev.screenTimeByPage,
        [page]: prev.screenTimeByPage[page] || 0,
      },
    }));
  }, []);

  const endSession = useCallback(() => {
    setData(prev => {
      if (!prev.currentSession) return prev;
      const ended = { ...prev.currentSession, endTime: Date.now(), duration: (Date.now() - prev.currentSession.startTime) / 60000 };
      const page = ended.page;
      return {
        ...prev,
        currentSession: null,
        sessionHistory: [...prev.sessionHistory, ended],
        screenTimeByPage: {
          ...prev.screenTimeByPage,
          [page]: (prev.screenTimeByPage[page] || 0) + ended.duration,
        },
      };
    });
  }, []);

  const setDailyGoal = useCallback((minutes: number) => {
    setData(prev => ({ ...prev, dailyGoal: minutes }));
  }, []);

  const resetToday = useCallback(() => {
    setData(prev => ({ ...prev, todayMinutes: 0, sessionHistory: [], screenTimeByPage: {} }));
  }, []);

  const updateSettings = useCallback((partial: Partial<WellbeingSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const startFocus = useCallback(() => {
    updateSettings({ focusMode: true, focusStartedAt: Date.now(), focusPausedAt: null, focusAccumulated: 0 });
  }, [updateSettings]);

  const stopFocus = useCallback(() => {
    // Record the finished focus session (only if it actually ran for a minute).
    setSettings(prev => {
      let seconds = prev.focusAccumulated;
      if (prev.focusStartedAt) seconds += (Date.now() - prev.focusStartedAt) / 1000;
      if (seconds >= 60) {
        const log = readJSON<{ date: string; minutes: number }[]>(FOCUS_SESSIONS_KEY, []);
        writeJSON(FOCUS_SESSIONS_KEY, [...log, { date: getTodayKey(), minutes: Math.round(seconds / 60) }]);
        setFocusSessions(prev2 => prev2 + 1);
      }
      const next = { ...prev, focusMode: false, focusStartedAt: null, focusPausedAt: null, focusAccumulated: 0 };
      saveSettings(next);
      return next;
    });
  }, []);

  const pauseFocus = useCallback(() => {
    const now = Date.now();
    setSettings(prev => {
      const elapsed = prev.focusStartedAt ? (now - prev.focusStartedAt) / 1000 : 0;
      const next = { ...prev, focusPausedAt: now, focusAccumulated: prev.focusAccumulated + elapsed, focusStartedAt: null };
      saveSettings(next);
      return next;
    });
  }, []);

  const resumeFocus = useCallback(() => {
    updateSettings({ focusStartedAt: Date.now(), focusPausedAt: null });
  }, [updateSettings]);

  const getFocusElapsed = useCallback(() => {
    const s = settings;
    if (!s.focusMode) return 0;
    let total = s.focusAccumulated;
    if (s.focusStartedAt && !s.focusPausedAt) {
      total += (Date.now() - s.focusStartedAt) / 1000;
    }
    return Math.floor(total);
  }, [settings]);

  // Hub Handler Functions
  const addCheckIn = useCallback((input: Omit<DailyCheckIn, 'id' | 'createdAt'>) => {
    const checkIn: DailyCheckIn = {
      ...input,
      id: `ci-${Date.now()}`,
      createdAt: Date.now(),
    };
    setCheckIns(prev => [checkIn, ...prev.filter(c => c.date !== checkIn.date)]);
  }, []);

  const addGoal = useCallback((input: Omit<WellbeingGoal, 'id' | 'createdAt' | 'currentValue' | 'status'>) => {
    const goal: WellbeingGoal = {
      ...input,
      id: `g-${Date.now()}`,
      currentValue: 0,
      status: 'active',
      createdAt: Date.now(),
    };
    setGoals(prev => [goal, ...prev]);
  }, []);

  const updateGoalProgress = useCallback((id: string, delta: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const nextVal = Math.max(0, g.currentValue + delta);
      const isComplete = nextVal >= g.targetValue;
      return {
        ...g,
        currentValue: nextVal,
        status: isComplete ? 'completed' : g.status,
      };
    }));
  }, []);

  const toggleGoalStatus = useCallback((id: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      return {
        ...g,
        status: g.status === 'completed' ? 'active' : 'completed',
      };
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const addHabit = useCallback((input: Omit<WellbeingHabit, 'id' | 'createdAt' | 'streak' | 'completedDates'>) => {
    const habit: WellbeingHabit = {
      ...input,
      id: `h-${Date.now()}`,
      streak: 0,
      completedDates: [],
      createdAt: Date.now(),
    };
    setHabits(prev => [...prev, habit]);
  }, []);

  const toggleHabitForDate = useCallback((id: string, dateStr = getTodayKey()) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const exists = h.completedDates.includes(dateStr);
      const nextDates = exists
        ? h.completedDates.filter(d => d !== dateStr)
        : [...h.completedDates, dateStr];

      // Real streak: consecutive days completed, counting back from today.
      const done = new Set(nextDates);
      let streak = 0;
      const cursor = new Date();
      // A streak stays alive if today is still open (not yet ticked).
      if (!done.has(cursor.toISOString().split('T')[0])) cursor.setDate(cursor.getDate() - 1);
      while (done.has(cursor.toISOString().split('T')[0])) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }

      return {
        ...h,
        completedDates: nextDates,
        streak,
      };
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  }, []);

  const addJournalEntry = useCallback((input: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    const entry: JournalEntry = {
      ...input,
      id: `j-${Date.now()}`,
      createdAt: Date.now(),
    };
    setJournals(prev => [entry, ...prev]);
  }, []);

  const deleteJournalEntry = useCallback((id: string) => {
    setJournals(prev => prev.filter(j => j.id !== id));
  }, []);

  const completeChallenge = useCallback((id: string) => {
    setChallenges(prev => prev.map(c => {
      if (c.id !== id) return c;
      return { ...c, completed: true, progress: c.target };
    }));
  }, []);

  const sendCoachMessage = useCallback(async (promptText: string): Promise<string> => {
    const userMsg: CoachMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: Date.now(),
    };
    setCoachMessages(prev => [...prev, userMsg]);

    const coachPrompt = `You are a supportive, friendly AI Student Wellbeing & Self-Improvement Coach.
Student context:
- Today's study time: ${Math.round(data.todayMinutes)} mins (Goal: ${data.dailyGoal} mins)
- Focus score: ${data.focusScore}%
- Active habits count: ${habits.length}
- Completed goals: ${goals.filter(g => g.status === 'completed').length} / ${goals.length}

User question/reflection: "${promptText}"

Instructions:
- Provide supportive, encouraging, practical advice on study habits, time management, balance, or motivation.
- STRICTLY DO NOT provide medical, clinical, or psychiatric advice or diagnoses.
- Keep the response conversational, clear, concise (2-4 short paragraphs maximum), and actionable.`;

    try {
      let coachReplyText = '';
      try {
        coachReplyText = await streamAgent({
          agent: 'margeos-agent',
          prompt: coachPrompt,
        });
      } catch (e) {
        // Fallback intelligent response generator if agent service unavailable
        coachReplyText = `That's a great question about maintaining your balance and study routines. Remember to break your study blocks into focused 25-30 minute intervals, followed by 5-minute eye-rest breaks. Small, consistent daily habits build long-term confidence! How are you feeling about your goals for tomorrow?`;
      }

      const coachMsg: CoachMessage = {
        id: `m-${Date.now() + 1}`,
        sender: 'coach',
        text: coachReplyText,
        timestamp: Date.now(),
      };
      setCoachMessages(prev => [...prev, coachMsg]);
      return coachReplyText;
    } catch (err) {
      const fallbackMsg: CoachMessage = {
        id: `m-${Date.now() + 1}`,
        sender: 'coach',
        text: 'I am here to support your learning journey! Try taking a short 5-minute stretch or hydration break before tackling your next task.',
        timestamp: Date.now(),
      };
      setCoachMessages(prev => [...prev, fallbackMsg]);
      return fallbackMsg.text;
    }
  }, [data, habits, goals]);

  return (
    <WellbeingContext.Provider value={{
      data, settings, checkIns, goals, habits, journals, challenges, coachMessages,
      startSession, endSession, setDailyGoal, resetToday, updateSettings,
      getFocusElapsed, startFocus, stopFocus, pauseFocus, resumeFocus,
      addCheckIn, addGoal, updateGoalProgress, toggleGoalStatus, deleteGoal,
      addHabit, toggleHabitForDate, deleteHabit, addJournalEntry, deleteJournalEntry,
      completeChallenge, sendCoachMessage
    }}>
      {children}
    </WellbeingContext.Provider>
  );
};

export const useWellbeing = () => {
  const ctx = useContext(WellbeingContext);
  if (!ctx) throw new Error('useWellbeing must be used within WellbeingProvider');
  return ctx;
};

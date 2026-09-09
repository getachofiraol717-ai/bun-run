// AI Tutor Engine — useTeachingSession
import { useMemo } from "react";
import { lessonPlanProgress } from "../models/LessonPlan";
import type { TeachingSession } from "../models/TeachingSession";
import type { TutorMessage, TutorMessageType } from "../models/TutorMessage";

export interface UseTeachingSessionResult {
  messages: TutorMessage[];
  progress: { taught: number; total: number; percent: number };
  byType: (type: TutorMessageType) => TutorMessage[];
  latestMessage: TutorMessage | null;
}

/** Pair with useAITutor: `useTeachingSession(useAITutor(...).session)`. */
export function useTeachingSession(session: TeachingSession | null): UseTeachingSessionResult {
  const messages = session?.messages ?? [];

  return useMemo(() => {
    const progress = session?.lessonPlan ? lessonPlanProgress(session.lessonPlan) : { taught: 0, total: 0, percent: 0 };
    return {
      messages,
      progress,
      byType: (type: TutorMessageType) => messages.filter((m) => m.type === type),
      latestMessage: messages.length ? messages[messages.length - 1] : null,
    };
  }, [messages, session?.lessonPlan]);
}

// AI Tutor Engine — TeachingSessionManager (Feature 10 + session lifecycle)
import { createEmptySession, type PageContext, type TeachingSession } from "../models/TeachingSession";
import type { LessonPlan } from "../models/LessonPlan";
import type { TutorMessage } from "../models/TutorMessage";
import { DEFAULT_STUDENT_PROFILE, type StudentProfile } from "../models/StudentProfile";
import { normalizeLabel } from "../utils/tutorUtils";

export function startSession(documentId: string, pageNumber: number, context: PageContext | null): TeachingSession {
  const session = createEmptySession(documentId, pageNumber);
  return { ...session, context, status: context ? "planning" : "idle" };
}

export function attachLessonPlan(session: TeachingSession, plan: LessonPlan): TeachingSession {
  return { ...session, lessonPlan: plan, status: "teaching" };
}

/** Insert a new message, or replace an existing one with the same id (streaming updates). */
export function upsertMessage(session: TeachingSession, message: TutorMessage): TeachingSession {
  const idx = session.messages.findIndex((m) => m.id === message.id);
  const messages = idx === -1 ? [...session.messages, message] : session.messages.map((m, i) => (i === idx ? message : m));
  return { ...session, messages };
}

export function endSession(session: TeachingSession): TeachingSession {
  return { ...session, status: "complete", endedAt: Date.now() };
}

// ── Feature 10 — Student memory ─────────────────────────────
export function recordMastered(profile: StudentProfile, topicLabel: string, documentId: string): StudentProfile {
  if (profile.mastered.some((m) => m.topicLabel === topicLabel && m.documentId === documentId)) return profile;
  return { ...profile, mastered: [...profile.mastered, { topicLabel, documentId, masteredAt: new Date().toISOString() }] };
}

export function recordSkipped(profile: StudentProfile, topicLabel: string): StudentProfile {
  if (profile.skipped.includes(topicLabel)) return profile;
  return { ...profile, skipped: [...profile.skipped, topicLabel] };
}

export function recordMistake(profile: StudentProfile, topicLabel: string, description: string): StudentProfile {
  return { ...profile, mistakes: [...profile.mistakes, { topicLabel, description, recordedAt: new Date().toISOString() }] };
}

/** Records a question, or bumps its count if a similar one was already asked — this count directly feeds Feature 13's confusion signal via summarizeProfileForAI. */
export function recordFAQ(profile: StudentProfile, question: string, topicLabel: string | null): StudentProfile {
  const key = normalizeLabel(question);
  const existingIdx = profile.faqs.findIndex((f) => normalizeLabel(f.question) === key);
  if (existingIdx === -1) {
    return { ...profile, faqs: [...profile.faqs, { question, topicLabel, askedAt: new Date().toISOString(), count: 1 }] };
  }
  return {
    ...profile,
    faqs: profile.faqs.map((f, i) => (i === existingIdx ? { ...f, count: f.count + 1, askedAt: new Date().toISOString() } : f)),
  };
}

export function setPreferences(profile: StudentProfile, patch: Partial<Pick<StudentProfile, "ageBand" | "learningStyle" | "preferredMode">>): StudentProfile {
  return { ...profile, ...patch };
}

export { DEFAULT_STUDENT_PROFILE };

// AI Tutor Engine — TeachingEngine interfaces (Feature 15)
// Deliberately interfaces only — no implementation — so future systems have
// a stable, typed contract to build against once they're ready.
import type { PageContext, TeachingSession } from "../models/TeachingSession";
import type { TutorMessage } from "../models/TutorMessage";

export interface QuizEngineAdapter {
  generateQuizFromSession(session: TeachingSession, count?: number): Promise<unknown>;
}

export interface FlashcardEngineAdapter {
  generateFlashcardsFromSession(session: TeachingSession): Promise<unknown>;
}

export interface VoiceTutorAdapter {
  speak(message: TutorMessage): Promise<void>;
  listen(): Promise<string>;
}

export interface AccessibilityEngineAdapter {
  describeForScreenReader(context: PageContext): string;
}

export interface ExamSimulatorAdapter {
  generateExamFromSessions(sessions: TeachingSession[]): Promise<unknown>;
}

export interface KnowledgeGalaxyAdapter {
  toGalaxyNodes(context: PageContext): unknown;
}

export interface ReferenceBookEngineAdapter {
  lookupReference(conceptLabel: string): Promise<unknown>;
}

export interface StudyCompanionAdapter {
  notifySessionComplete(session: TeachingSession): Promise<void>;
}

export interface WorldBuilderAdapter {
  toWorldBuilderAssets(context: PageContext): unknown;
}

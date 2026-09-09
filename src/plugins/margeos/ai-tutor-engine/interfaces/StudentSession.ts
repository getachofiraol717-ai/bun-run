// AI Tutor Engine — StudentSession interface (Feature 15)
// A minimal, stable, read-only snapshot other future modules can depend on
// without importing this engine's internal store/controller directly.
import type { AgeBand, ExplanationMode, StudentProfile } from "../models/StudentProfile";
import type { LearningStyle } from "../models/LearningStyle";

export interface StudentSessionSnapshot {
  documentId: string;
  pageNumber: number;
  ageBand: AgeBand;
  learningStyle: LearningStyle;
  preferredMode: ExplanationMode;
  conceptsTaught: string[];
  conceptsMastered: string[];
  conceptsSkipped: string[];
}

export interface StudentSessionProvider {
  getSnapshot(documentId: string, pageNumber: number): StudentSessionSnapshot | null;
  getProfile(): StudentProfile;
}

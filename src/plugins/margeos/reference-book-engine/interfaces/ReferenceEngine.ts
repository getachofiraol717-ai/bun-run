// Reference Book Engine — Integration interfaces
// Feature 14: Engine Integration - Interfaces for other engines
import type { ReferenceSource } from "../models/ReferenceBook";
import type { UnifiedConcept, AcademicSummary, SourceComparison } from "../models/SourceComparison";
import type { AgeBand, LearningStyle } from "@/plugins/margeos/formula-engine";

// ─── Smart PDF Engine Integration ─────────────────────────────────────────

export interface SmartPDFEngineAdapter {
  /** Get document analysis from Smart PDF Engine */
  getDocumentAnalysis(documentId: string): Promise<DocumentAnalysisData | null>;

  /** Subscribe to document analysis updates */
  subscribeToAnalysis(documentId: string, callback: (analysis: DocumentAnalysisData) => void): () => void;

  /** Get formulas extracted by Smart PDF Engine */
  getFormulasForDocument(documentId: string): Promise<any[]>;

  /** Get chapters detected by Smart PDF Engine */
  getChaptersForDocument(documentId: string): Promise<any[]>;
}

export interface DocumentAnalysisData {
  documentId: string;
  pageCount: number;
  chapters: { number: number; title: string; startPage: number; endPage: number }[];
  topics: { name: string; pageNumber: number }[];
  formulas: any[];
  definitions: { term: string; definition: string; pageNumber: number }[];
  tables: { title: string; headers: string[]; rows: string[][]; pageNumber: number }[];
}

// ─── AI Tutor Engine Integration ──────────────────────────────────────────

export interface AITutorEngineAdapter {
  /** Get unified explanation for tutoring */
  getUnifiedExplanation(topicId: string): Promise<UnifiedConcept | null>;

  /** Provide teaching context from reference books */
  getTeachingContext(topicId: string, ageBand: AgeBand): Promise<TeachingContext>;

  /** Get examples for teaching */
  getExamplesForConcept(conceptId: string): Promise<ExampleData[]>;

  /** Report student progress to reference books */
  reportStudentProgress(sourceId: string, progress: StudentProgress): Promise<void>;
}

export interface TeachingContext {
  concept: UnifiedConcept;
  ageAppropriateExplanation: string;
  suggestedExamples: ExampleData[];
  commonQuestions: string[];
  relatedConcepts: string[];
}

export interface ExampleData {
  example: string;
  sourceId: string;
  type: "real_world" | "abstract" | "analogy" | "step_by_step";
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface StudentProgress {
  conceptId: string;
  understood: boolean;
  timeSpent: number;
  questionsAsked: number;
}

// ─── Formula Engine Integration ────────────────────────────────────────────

export interface FormulaEngineAdapter {
  /** Enrich formulas with learning content */
  enrichFormula(formula: any): Promise<any>;

  /** Get formula explanations for a topic */
  getFormulasForTopic(topicId: string): Promise<any[]>;

  /** Generate practice questions for formulas */
  generateFormulaPractice(formulaIds: string[]): Promise<any[]>;
}

// ─── Quiz Engine Integration ───────────────────────────────────────────────

export interface QuizEngineAdapter {
  /** Generate quiz questions from reference sources */
  generateQuizFromSources(sourceIds: string[], count: number): Promise<QuizQuestion[]>;

  /** Get questions that test understanding across multiple sources */
  generateComparisonQuestions(topicId: string): Promise<QuizQuestion[]>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple_choice" | "short_answer" | "comparison";
  correctAnswer: string;
  options?: string[];
  sourceIds: string[];
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

// ─── Flashcard Engine Integration ─────────────────────────────────────────

export interface FlashcardEngineAdapter {
  /** Generate flashcards from reference concepts */
  generateFlashcardsFromConcept(conceptId: string, count: number): Promise<Flashcard[]>;

  /** Generate comparison flashcards */
  generateComparisonFlashcards(conceptIds: string[]): Promise<Flashcard[]>;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  sourceIds: string[];
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
}

// ─── Memory Vault Integration ─────────────────────────────────────────────

export interface MemoryVaultAdapter {
  /** Save concept to memory vault */
  saveConceptToMemory(conceptId: string, mastery: number): Promise<void>;

  /** Get memory status for concepts */
  getConceptMemoryStatus(conceptIds: string[]): Promise<MemoryStatus[]>;

  /** Get concepts student is struggling with */
  getWeakConcepts(): Promise<string[]>;

  /** Get concepts student has mastered */
  getMasteredConcepts(): Promise<string[]>;
}

export interface MemoryStatus {
  conceptId: string;
  mastery: number; // 0-1
  lastReviewed: Date;
  reviewCount: number;
}

// ─── Knowledge Galaxy Integration ──────────────────────────────────────────

export interface KnowledgeGalaxyAdapter {
  /** Convert concept to galaxy node */
  toGalaxyNode(conceptId: string): Promise<GalaxyNode>;

  /** Get related concepts from galaxy */
  getRelatedConcepts(conceptId: string, depth?: number): Promise<string[]>;

  /** Get concept path for learning */
  getConceptPath(fromId: string, toId: string): Promise<ConceptPath>;
}

export interface GalaxyNode {
  id: string;
  label: string;
  type: "concept" | "topic" | "source";
  subject: string;
  size: number;
  color: string;
  connections: string[];
}

export interface ConceptPath {
  path: string[];
  relationships: { from: string; to: string; type: string }[];
  estimatedTime: number;
}

// ─── Exam Simulator Integration ─────────────────────────────────────────────

export interface ExamSimulatorAdapter {
  /** Get exam questions covering sources */
  generateExamQuestions(sourceIds: string[], count: number, timeLimit?: number): Promise<ExamQuestion[]>;

  /** Get questions that require comparison across sources */
  generateComparisonExamQuestions(topicId: string): Promise<ExamQuestion[]>;
}

export interface ExamQuestion {
  id: string;
  question: string;
  type: "multiple_choice" | "short_answer" | "long_answer" | "calculation";
  marks: number;
  sourceIds: string[];
  rubric: string;
}

// ─── Study Companion Integration ───────────────────────────────────────────

export interface StudyCompanionAdapter {
  /** Get study plan for sources */
  generateStudyPlan(sourceIds: string[]): Promise<StudyPlan>;

  /** Get next concept to study */
  getNextStudyConcept(currentTopic?: string): Promise<StudyRecommendation>;
}

export interface StudyPlan {
  id: string;
  title: string;
  sessions: StudySession[];
  estimatedDuration: number; // minutes
}

export interface StudySession {
  topic: string;
  concepts: string[];
  activities: string[];
  duration: number; // minutes
}

export interface StudyRecommendation {
  conceptId: string;
  reason: string;
  sources: string[];
  estimatedTime: number;
}

// ─── Accessibility Engine Integration ─────────────────────────────────────

export interface AccessibilityEngineAdapter {
  /** Generate accessible version of explanation */
  getAccessibleExplanation(conceptId: string, format: "plain_text" | "audio" | "braille"): Promise<string>;

  /** Get simplified reading version */
  getSimplifiedVersion(conceptId: string, readingLevel: number): Promise<string>;

  /** Get visual description for diagrams */
  getVisualDescription(diagramId: string): Promise<string>;
}

// ─── Notification Engine Integration ───────────────────────────────────────

export interface NotificationEngineAdapter {
  /** Notify about new related sources */
  notifyNewSources(topicId: string, sourceIds: string[]): void;

  /** Notify about conflict resolution updates */
  notifyConflictResolved(comparisonId: string): void;

  /** Notify about new recommendations */
  notifyRecommendations(recommendations: string[]): void;
}

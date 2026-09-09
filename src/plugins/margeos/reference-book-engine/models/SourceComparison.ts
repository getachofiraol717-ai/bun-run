// Reference Book Engine — Source Comparison and Unified Concept models
// Feature 3: Concept Comparison, Feature 4: Unified Explanation

import type { SourceType, SubjectArea } from "./ReferenceBook";

export interface SourceComparison {
  id: string;
  topicId: string;
  sources: SourceComparisonData[];
  comparisonSummary: ComparisonSummary;
  conflicts: ConceptConflict[];
  consensus: ConsensusPoint[];
  createdAt: Date;
}

export interface SourceComparisonData {
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  terminologies: TerminologyMapping[];
  definitions: DefinitionComparison[];
  examples: ExampleComparison[];
  explanations: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  confidence: number;
  quality: number; // 1-5 rating
}

export interface TerminologyMapping {
  conceptId: string;
  sourceTerminology: string;
  standardTerminology?: string;
  alternatives: string[];
}

export interface DefinitionComparison {
  conceptId: string;
  definitions: {
    sourceId: string;
    definition: string;
    completeness: number; // 0-1
    clarity: number; // 0-1
  }[];
  agreementLevel: "full" | "partial" | "conflicting";
  mergedDefinition?: string;
}

export interface ExampleComparison {
  conceptId: string;
  examples: {
    sourceId: string;
    example: string;
    quality: number; // 1-5
    appropriateness: number; // 0-1
  }[];
}

export interface ComparisonSummary {
  overallAgreement: number; // 0-1
  terminologyDifferences: string[];
  methodologyDifferences: string[];
  gaps: string[];
  strengths: string[];
}

export interface ConceptConflict {
  conceptId: string;
  conflictType: ConflictType;
  sources: {
    sourceId: string;
    position: string;
    evidence: string;
    strength: number; // 0-1
  }[];
  resolution?: ConflictResolution;
  discussion?: string; // For AI Tutor to present alternatives
}

export type ConflictType =
  | "definitional"
  | "numerical"
  | "methodological"
  | "interpretive"
  | "contextual"
  | "historical";

export interface ConflictResolution {
  resolutionType: "majority_rules" | "authoritative_source" | "contextual" | "presented_as_alternatives" | "unresolved";
  explanation: string;
  recommendedPosition?: string;
  alternativePositions?: string[];
}

export interface ConsensusPoint {
  conceptId: string;
  statement: string;
  supportingSources: string[];
  confidence: number;
}

// Unified Concept - Feature 4
export interface UnifiedConcept {
  id: string;
  name: string;
  topicId: string;

  // Core content
  primaryDefinition: string;
  alternativeDefinitions: {
    definition: string;
    sourceId: string;
    context: string;
  }[];

  // Synthesis
  unifiedExplanation: string;
  keyTakeaways: string[];
  commonMisconceptions: string[];

  // Sources
  contributingSources: ContributingSource[];
  primarySourceId?: string;

  // Examples
  bestExamples: UnifiedExample[];

  // Formulas (if applicable)
  relevantFormulas: UnifiedFormula[];

  // Visual aids
  diagrams: UnifiedDiagram[];
  tables: UnifiedTable[];

  // Confidence
  confidenceScore: number;
  agreementLevel: "full" | "partial" | "mixed";

  // Connections
  relatedConcepts: string[];
  prerequisites: string[];
  leadsTo: string[];

  // For AI Tutor
  teachingNotes: TeachingNote[];
  accessibilityFormats: AccessibilityFormat[];

  // Citations
  citations: SourceCitation[];

  createdAt: Date;
  updatedAt: Date;
}

export interface ContributingSource {
  sourceId: string;
  contribution: string; // How this source contributed
  weight: number; // Importance of this source's contribution (0-1)
  keyInsights: string[];
}

export interface UnifiedExample {
  example: string;
  sourceIds: string[];
  explanation: string;
  type: "real_world" | "abstract" | "visual" | "step_by_step";
  difficulty: "beginner" | "intermediate" | "advanced";
  quality: number; // 1-5
}

export interface UnifiedFormula {
  formula: string;
  sources: {
    sourceId: string;
    context: string;
    usage: string;
  }[];
  explanation: string;
  whenToUse: string;
  commonMistakes: string[];
}

export interface UnifiedDiagram {
  description: string;
  sourceIds: string[];
  type: "flowchart" | "graph" | "diagram" | "chart" | "illustration";
  textDescription?: string; // For accessibility
}

export interface UnifiedTable {
  title: string;
  data: {
    headers: string[];
    rows: string[][];
  };
  sourceIds: string[];
  purpose: string;
}

export interface TeachingNote {
  ageBand: "8-10" | "11-13" | "14-16" | "17-19" | "university" | "professional";
  learningStyle: "visual" | "auditory" | "reading" | "kinesthetic" | "mixed";
  explanation: string;
  tips: string[];
  commonQuestions: string[];
  misconceptions: string[];
}

export interface AccessibilityFormat {
  format: "plain_text" | "audio" | "braille" | "simplified" | "sign_language";
  content: string;
  quality: number; // 0-1
}

export interface SourceCitation {
  sourceId: string;
  sourceName: string;
  citationText: string;
  pageNumber?: number;
  directQuote?: string;
  paraphrased: boolean;
}

// Concept Network - Feature 8
export interface ConceptNetwork {
  id: string;
  name: string;
  centerConceptId: string;
  depth: number;
  nodes: NetworkNode[];
  paths: NetworkPath[];
}

export interface NetworkNode {
  conceptId: string;
  name: string;
  type: "concept" | "formula" | "topic" | "source";
  distance: number; // Steps from center
  sourceIds: string[];
  masteryLevel?: number;
}

export interface NetworkPath {
  path: string[]; // Concept IDs in order
  relationship: string;
  strength: number; // 0-1
  sources: string[];
}

// Academic Summary - Feature 10
export interface AcademicSummary {
  id: string;
  type: SummaryType;
  title: string;

  // Content
  executiveSummary: string;
  keyPoints: string[];
  mainTakeaways: string[];
  detailedContent: string;

  // Sources
  sourceIds: string[];
  primarySourceId?: string;

  // Structure
  sections?: SummarySection[];

  // Quality
  completenessScore: number;
  qualityScore: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export type SummaryType =
  | "chapter"
  | "topic"
  | "book"
  | "research"
  | "multi_source"
  | "comparative";

export interface SummarySection {
  title: string;
  content: string;
  subsections?: SummarySection[];
  keyPoints: string[];
  sources: string[];
}

// Export/Import models
export interface ReferenceExport {
  version: string;
  exportedAt: Date;
  sources: ExportSource[];
  notes: ExportNote[];
  summaries: AcademicSummary[];
  conceptNetwork?: ConceptNetwork;
}

export interface ExportSource {
  sourceId: string;
  metadata: {
    title: string;
    authors: string[];
    sourceType: string;
  };
  analysisComplete: boolean;
}

export interface ExportNote {
  noteId: string;
  content: string;
  topicId?: string;
  sourceIds: string[];
  createdAt: Date;
}

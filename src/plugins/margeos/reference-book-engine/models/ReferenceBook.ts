// Reference Book Engine — Core data models
// Feature 1: Multi-Source Library, Feature 10: Academic Summary, Feature 11: Learning Confidence

export type SourceType = "textbook" | "research_paper" | "teacher_guide" | "study_note" | "lecture_slide" | "personal_document" | "class_handout" | "book";

export type SourceQuality = "primary" | "secondary" | "tertiary" | "unknown";

export type SubjectArea = "mathematics" | "physics" | "chemistry" | "biology" | "computer_science" | "engineering" | "literature" | "history" | "economics" | "psychology" | "philosophy" | "other";

export type DocumentFormat = "pdf" | "docx" | "txt" | "html" | "epub" | "markdown";

export interface SourceMetadata {
  title: string;
  authors: string[];
  publicationDate?: string;
  publisher?: string;
  edition?: string;
  isbn?: string;
  doi?: string;
  url?: string;
  language: string;
  subject: SubjectArea;
  sourceType: SourceType;
  quality: SourceQuality;
  pageCount?: number;
  wordCount?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  license?: string;
  tags: string[];
}

export interface ReferenceSource {
  id: string;
  documentId: string; // Links to Smart PDF Engine's documentId
  metadata: SourceMetadata;
  chapters: SourceChapter[];
  topics: SourceTopic[];
  concepts: SourceConcept[];
  formulas: SourceFormula[];
  definitions: SourceDefinition[];
  diagrams: SourceDiagram[];
  tables: SourceTable[];
  keyCitations: Citation[];
  summary?: string;
  uploadedAt: Date;
  lastAccessedAt: Date;
  analysisStatus: "pending" | "analyzing" | "completed" | "failed";
  confidenceScore: number; // 0-1, based on Feature 11
  usageCount: number;
}

export interface SourceChapter {
  id: string;
  number: number;
  title: string;
  startPage: number;
  endPage: number;
  summary?: string;
  topics: string[]; // Topic IDs
  keyConcepts: string[];
  subsections?: SourceChapter[];
}

export interface SourceTopic {
  id: string;
  name: string;
  chapterId?: string;
  pageNumber?: number;
  relatedConcepts: string[];
  explanations: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  confidenceScore: number;
}

export interface SourceConcept {
  id: string;
  name: string;
  definition: string;
  source: string; // ReferenceSource.id
  pageNumber: number;
  context: string;
  relatedTopics: string[];
  examples: string[];
  formulas?: string[];
  connections: string[]; // IDs of related concepts across sources
}

export interface SourceFormula {
  id: string;
  formula: string;
  context: string;
  pageNumber: number;
  explanation?: string;
  subject: string;
  topicId?: string;
}

export interface SourceDefinition {
  id: string;
  term: string;
  definition: string;
  source: string;
  pageNumber: number;
  examples?: string[];
  relatedTerms: string[];
  field?: string;
}

export interface SourceDiagram {
  id: string;
  description: string;
  caption?: string;
  pageNumber: number;
  topicId?: string;
  imageData?: string; // Base64 or URL
}

export interface SourceTable {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
  pageNumber: number;
  topicId?: string;
}

export interface Citation {
  id: string;
  sourceId: string;
  citationText: string;
  pageNumber?: number;
  url?: string;
  accessedDate?: Date;
  style: CitationStyle;
}

export type CitationStyle = "apa" | "mla" | "chicago" | "ieee" | "harvard" | "vancouver";

// Reference Library state
export interface ReferenceLibrary {
  sources: Map<string, ReferenceSource>;
  searchIndex: SearchIndex;
  conceptGraph: ConceptGraph;
  userNotes: StudentNote[];
  recommendations: Recommendation[];
  lastUpdated: Date;
}

export interface SearchIndex {
  sources: Map<string, SourceSearchData>;
  topics: Map<string, TopicSearchData>;
  concepts: Map<string, ConceptSearchData>;
}

export interface SourceSearchData {
  sourceId: string;
  title: string;
  authors: string[];
  topics: string[];
  fullTextIndex: string[]; // Tokenized words
}

export interface TopicSearchData {
  topicId: string;
  name: string;
  sourceIds: string[];
  relatedTopics: string[];
}

export interface ConceptSearchData {
  conceptId: string;
  name: string;
  definition: string;
  sourceIds: string[];
}

export interface ConceptGraph {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export interface ConceptNode {
  id: string;
  name: string;
  type: "concept" | "topic" | "source";
  sourceId?: string;
  subject?: SubjectArea;
  masteryLevel?: number; // From Memory Vault
}

export interface ConceptEdge {
  source: string; // ConceptNode.id
  target: string; // ConceptNode.id
  relationship: "related_to" | "part_of" | "depends_on" | "leads_to" | "similar_to";
  weight: number; // 0-1, strength of connection
}

export interface StudentNote {
  id: string;
  content: string;
  topicId?: string;
  conceptId?: string;
  sourceIds: string[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface Recommendation {
  id: string;
  sourceId: string;
  reason: RecommendationReason;
  priority: number; // 1-5, 1 is highest
  status: "new" | "viewed" | "accepted" | "dismissed";
  createdAt: Date;
}

export type RecommendationReason =
  | "related_to_current_topic"
  | "fills_knowledge_gap"
  | "reinforces_learning"
  | "matches_learning_style"
  | "advances_prerequisites"
  | "suggested_by_teacher"
  | "popular_in_subject";

// Import from Smart PDF Engine types
import type { Formula } from "@/plugins/margeos/smart-pdf-engine";

// Extended formula reference for reference book context
export interface ReferenceFormula extends Formula {
  sourceId: string;
  chapterContext?: string;
  importanceScore: number; // 0-1
}

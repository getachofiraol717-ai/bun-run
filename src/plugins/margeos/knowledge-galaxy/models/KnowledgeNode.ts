// Knowledge Galaxy — KnowledgeNode Model
// Represents a node in the knowledge graph

export type NodeType =
  | "subject"
  | "chapter"
  | "topic"
  | "concept"
  | "skill"
  | "formula"
  | "definition"
  | "example"
  | "reference"
  | "lesson"
  | "quiz"
  | "flashcard";

export type NodeStatus = "discovered" | "in_progress" | "mastered" | "locked" | "hidden";

export type MasteryLevel = "none" | "beginner" | "intermediate" | "advanced" | "expert";

export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  title: string;
  description: string;

  // Taxonomy
  subject: string;
  chapter?: string;
  parentId?: string;
  childrenIds: string[];

  // Position in galaxy
  position: Position;
  clusterId?: string;

  // Relationships
  connectedNodeIds: string[];
  prerequisiteIds: string[];
  dependentIds: string[];

  // Mastery & Progress
  status: NodeStatus;
  masteryLevel: MasteryLevel;
  masteryScore: number; // 0-100
  timesStudied: number;
  lastStudiedAt?: Date;
  firstMasteredAt?: Date;

  // Learning metadata
  estimatedStudyTime: number; // minutes
  difficulty: number; // 1-5
  importance: number; // 1-5

  // Source tracking
  sourceEngine: "pdf" | "tutor" | "formula" | "reference" | "visual" | "quiz" | "flashcard" | "manual";
  sourceId?: string;
  sourceName?: string;

  // Accessibility
  altText: string;
  ariaLabel: string;
  keyboardNavigation: boolean;
  screenReaderDescription: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  discoveredAt?: Date;

  // Additional metadata
  tags: string[];
  keywords: string[];
  customData?: Record<string, any>;
}

export interface KnowledgeNodeExtended extends KnowledgeNode {
  // Calculated fields
  centrality?: number;
  pagerank?: number;
  clusterCoefficient?: number;
  betweenness?: number;

  // Learning path info
  isPrerequisite?: boolean;
  isMilestone?: boolean;
  isWeakPoint?: boolean;
  isStrongPoint?: boolean;

  // Graph info
  connectionCount?: number;
  clusterDensity?: number;

  // User-specific
  userMasteryScore?: number;
  userProgress?: number;
  isRecommended?: boolean;
  recommendationReason?: string;
}

// Factory functions
export function createKnowledgeNode(
  type: NodeType,
  title: string,
  subject: string,
  options?: Partial<KnowledgeNode>
): KnowledgeNode {
  const id = `node-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    type,
    title,
    description: "",
    subject,
    childrenIds: [],
    position: { x: 0, y: 0 },
    connectedNodeIds: [],
    prerequisiteIds: [],
    dependentIds: [],
    status: "discovered",
    masteryLevel: "none",
    masteryScore: 0,
    timesStudied: 0,
    estimatedStudyTime: 30,
    difficulty: 3,
    importance: 3,
    sourceEngine: "manual",
    altText: title,
    ariaLabel: `${type}: ${title}`,
    keyboardNavigation: true,
    screenReaderDescription: `${type} node: ${title}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    keywords: [],
    ...options
  };
}

// Node type configurations
export const NODE_TYPE_CONFIG: Record<NodeType, {
  icon: string;
  color: string;
  defaultSize: number;
  importance: number;
}> = {
  subject: { icon: "globe", color: "#6366F1", defaultSize: 60, importance: 5 },
  chapter: { icon: "book", color: "#8B5CF6", defaultSize: 50, importance: 4 },
  topic: { icon: "folder", color: "#A855F7", defaultSize: 40, importance: 4 },
  concept: { icon: "lightbulb", color: "#10B981", defaultSize: 35, importance: 3 },
  skill: { icon: "target", color: "#F59E0B", defaultSize: 35, importance: 3 },
  formula: { icon: "function", color: "#EC4899", defaultSize: 30, importance: 4 },
  definition: { icon: "text", color: "#06B6D4", defaultSize: 30, importance: 3 },
  example: { icon: "play", color: "#84CC16", defaultSize: 25, importance: 2 },
  reference: { icon: "bookmark", color: "#14B8A6", defaultSize: 30, importance: 3 },
  lesson: { icon: "video", color: "#F97316", defaultSize: 35, importance: 4 },
  quiz: { icon: "check-square", color: "#EF4444", defaultSize: 30, importance: 3 },
  flashcard: { icon: "layers", color: "#22D3EE", defaultSize: 25, importance: 2 }
};

// Status configurations
export const STATUS_CONFIG: Record<NodeStatus, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  discovered: { label: "Discovered", color: "#6B7280", icon: "eye", description: "Node has been discovered" },
  in_progress: { label: "In Progress", color: "#F59E0B", icon: "loader", description: "Currently learning" },
  mastered: { label: "Mastered", color: "#10B981", icon: "check", description: "Fully mastered" },
  locked: { label: "Locked", color: "#374151", icon: "lock", description: "Prerequisites not met" },
  hidden: { label: "Hidden", color: "#1F2937", icon: "eye-off", description: "Not yet visible" }
};

// Mastery level configurations
export const MASTERY_CONFIG: Record<MasteryLevel, {
  label: string;
  color: string;
  minScore: number;
  maxScore: number;
  description: string;
}> = {
  none: { label: "Not Started", color: "#6B7280", minScore: 0, maxScore: 20, description: "No knowledge yet" },
  beginner: { label: "Beginner", color: "#F59E0B", minScore: 20, maxScore: 40, description: "Basic understanding" },
  intermediate: { label: "Intermediate", color: "#3B82F6", minScore: 40, maxScore: 60, description: "Good understanding" },
  advanced: { label: "Advanced", color: "#8B5CF6", minScore: 60, maxScore: 80, description: "Strong mastery" },
  expert: { label: "Expert", color: "#10B981", minScore: 80, maxScore: 100, description: "Full mastery" }
};

// Node validation
export function validateKnowledgeNode(node: Partial<KnowledgeNode>): string[] {
  const errors: string[] = [];

  if (!node.type) {
    errors.push("Node type is required");
  }

  if (!node.title || node.title.trim().length === 0) {
    errors.push("Node title is required");
  }

  if (!node.subject || node.subject.trim().length === 0) {
    errors.push("Node subject is required");
  }

  if (node.masteryScore !== undefined && (node.masteryScore < 0 || node.masteryScore > 100)) {
    errors.push("Mastery score must be between 0 and 100");
  }

  if (node.difficulty !== undefined && (node.difficulty < 1 || node.difficulty > 5)) {
    errors.push("Difficulty must be between 1 and 5");
  }

  if (node.importance !== undefined && (node.importance < 1 || node.importance > 5)) {
    errors.push("Importance must be between 1 and 5");
  }

  return errors;
}

// Node comparison
export function compareNodes(a: KnowledgeNode, b: KnowledgeNode): number {
  // By importance first
  if (a.importance !== b.importance) {
    return b.importance - a.importance;
  }

  // Then by mastery score (ascending - weakest first)
  if (a.masteryScore !== b.masteryScore) {
    return a.masteryScore - b.masteryScore;
  }

  // Then alphabetically
  return a.title.localeCompare(b.title);
}

// Export type guards
export function isSubjectNode(node: KnowledgeNode): boolean {
  return node.type === "subject";
}

export function isChapterNode(node: KnowledgeNode): boolean {
  return node.type === "chapter";
}

export function isConceptNode(node: KnowledgeNode): boolean {
  return node.type === "concept";
}

export function isSkillNode(node: KnowledgeNode): boolean {
  return node.type === "skill";
}

export function isFormulaNode(node: KnowledgeNode): boolean {
  return node.type === "formula";
}

export function isLearnableNode(node: KnowledgeNode): boolean {
  return node.status !== "locked" && node.status !== "hidden";
}

export function isMasteredNode(node: KnowledgeNode): boolean {
  return node.masteryScore >= 80;
}

export function isInProgressNode(node: KnowledgeNode): boolean {
  return node.status === "in_progress";
}

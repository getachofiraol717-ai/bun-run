// Knowledge Galaxy — KnowledgeEdge Model
// Represents edges/relationships between nodes in the knowledge graph

export type EdgeType =
  | "prerequisite"
  | "depends_on"
  | "explains"
  | "uses"
  | "extends"
  | "related_to"
  | "applied_in"
  | "contradicts"
  | "similar_to"
  | "part_of"
  | "references"
  | "examples"
  | "derives_from"
  | "leads_to"
  | "supports";

export type EdgeStrength = "weak" | "medium" | "strong" | "critical";

export interface KnowledgeEdge {
  id: string;
  type: EdgeType;

  // Connection endpoints
  sourceNodeId: string;
  targetNodeId: string;

  // Edge properties
  strength: EdgeStrength;
  weight: number; // 0-1, calculated based on relationship frequency
  bidirectional: boolean;

  // Relationship metadata
  label?: string;
  description?: string;

  // Discovery tracking
  discoveredAt: Date;
  lastUsedAt?: Date;
  useCount: number;

  // Source tracking
  sourceEngine: "pdf" | "tutor" | "formula" | "reference" | "visual" | "quiz" | "flashcard" | "manual" | "ai";
  sourceId?: string;

  // Bidirectional flag (for navigation)
  reverseEdgeId?: string;

  // Additional metadata
  tags: string[];
  customData?: Record<string, any>;
}

export interface KnowledgeEdgeExtended extends KnowledgeEdge {
  // Calculated fields
  sourceNode?: any;
  targetNode?: any;

  // Navigation info
  isNavigable?: boolean;
  shortestPath?: string[];

  // User-specific
  userHasTraversed?: boolean;
  userPreference?: number;
}

// Edge type configurations
export const EDGE_TYPE_CONFIG: Record<EdgeType, {
  icon: string;
  color: string;
  defaultStrength: EdgeStrength;
  bidirectional: boolean;
  description: string;
  directionLabel: string;
  reverseLabel: string;
}> = {
  prerequisite: {
    icon: "arrow-left",
    color: "#EF4444",
    defaultStrength: "strong",
    bidirectional: false,
    description: "Required knowledge before learning",
    directionLabel: "requires",
    reverseLabel: "unlocks"
  },
  depends_on: {
    icon: "link",
    color: "#F97316",
    defaultStrength: "medium",
    bidirectional: false,
    description: "Depends on another concept",
    directionLabel: "depends on",
    reverseLabel: "supports"
  },
  explains: {
    icon: "message-circle",
    color: "#3B82F6",
    defaultStrength: "strong",
    bidirectional: false,
    description: "Explains or clarifies",
    directionLabel: "explains",
    reverseLabel: "is explained by"
  },
  uses: {
    icon: "tool",
    color: "#8B5CF6",
    defaultStrength: "medium",
    bidirectional: false,
    description: "Uses or applies",
    directionLabel: "uses",
    reverseLabel: "is used by"
  },
  extends: {
    icon: "plus-square",
    color: "#EC4899",
    defaultStrength: "medium",
    bidirectional: false,
    description: "Extends or builds upon",
    directionLabel: "extends",
    reverseLabel: "is extended by"
  },
  related_to: {
    icon: "git-merge",
    color: "#6B7280",
    defaultStrength: "weak",
    bidirectional: true,
    description: "Related but not directly connected",
    directionLabel: "related to",
    reverseLabel: "related to"
  },
  applied_in: {
    icon: "briefcase",
    color: "#10B981",
    defaultStrength: "medium",
    bidirectional: false,
    description: "Applied in practical contexts",
    directionLabel: "applied in",
    reverseLabel: "applies"
  },
  contradicts: {
    icon: "x-circle",
    color: "#DC2626",
    defaultStrength: "strong",
    bidirectional: true,
    description: "Contradicts or opposes",
    directionLabel: "contradicts",
    reverseLabel: "contradicted by"
  },
  similar_to: {
    icon: "copy",
    color: "#9CA3AF",
    defaultStrength: "medium",
    bidirectional: true,
    description: "Similar concepts",
    directionLabel: "similar to",
    reverseLabel: "similar to"
  },
  part_of: {
    icon: "box",
    color: "#14B8A6",
    defaultStrength: "strong",
    bidirectional: false,
    description: "Is part of larger concept",
    directionLabel: "part of",
    reverseLabel: "contains"
  },
  references: {
    icon: "bookmark",
    color: "#06B6D4",
    defaultStrength: "weak",
    bidirectional: false,
    description: "References or cites",
    directionLabel: "references",
    reverseLabel: "referenced by"
  },
  examples: {
    icon: "play-circle",
    color: "#84CC16",
    defaultStrength: "medium",
    bidirectional: false,
    description: "Provides examples",
    directionLabel: "examples of",
    reverseLabel: "exemplified by"
  },
  derives_from: {
    icon: "trending-down",
    color: "#F59E0B",
    defaultStrength: "strong",
    bidirectional: false,
    description: "Derived or originates from",
    directionLabel: "derives from",
    reverseLabel: "is basis for"
  },
  leads_to: {
    icon: "arrow-right",
    color: "#22D3EE",
    defaultStrength: "medium",
    bidirectional: false,
    description: "Leads to or results in",
    directionLabel: "leads to",
    reverseLabel: "preceded by"
  },
  supports: {
    icon: "thumbs-up",
    color: "#A3E635",
    defaultStrength: "medium",
    bidirectional: false,
    description: "Supports or validates",
    directionLabel: "supports",
    reverseLabel: "supported by"
  }
};

// Edge strength configurations
export const EDGE_STRENGTH_CONFIG: Record<EdgeStrength, {
  label: string;
  color: string;
  minWeight: number;
  maxWeight: number;
  dashPattern?: string;
}> = {
  weak: { label: "Weak", color: "#9CA3AF", minWeight: 0, maxWeight: 0.33 },
  medium: { label: "Medium", color: "#6B7280", minWeight: 0.33, maxWeight: 0.66 },
  strong: { label: "Strong", color: "#374151", minWeight: 0.66, maxWeight: 0.9 },
  critical: { label: "Critical", color: "#1F2937", minWeight: 0.9, maxWeight: 1.0 }
};

// Factory functions
export function createKnowledgeEdge(
  sourceNodeId: string,
  targetNodeId: string,
  type: EdgeType,
  options?: Partial<KnowledgeEdge>
): KnowledgeEdge {
  const id = `edge-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const config = EDGE_TYPE_CONFIG[type];

  return {
    id,
    type,
    sourceNodeId,
    targetNodeId,
    strength: config.defaultStrength,
    weight: (config.defaultStrength === "weak" ? 0.3 : config.defaultStrength === "medium" ? 0.6 : 0.9),
    bidirectional: config.bidirectional,
    discoveredAt: new Date(),
    useCount: 0,
    sourceEngine: "manual",
    tags: [],
    ...options
  };
}

// Create prerequisite edge
export function createPrerequisiteEdge(
  prerequisiteNodeId: string,
  dependentNodeId: string,
  strength: EdgeStrength = "strong"
): KnowledgeEdge {
  return createKnowledgeEdge(prerequisiteNodeId, dependentNodeId, "prerequisite", {
    strength,
    weight: strength === "critical" ? 1.0 : strength === "strong" ? 0.9 : 0.7,
    bidirectional: false
  });
}

// Create related-to edge
export function createRelatedEdge(
  nodeId1: string,
  nodeId2: string,
  strength: EdgeStrength = "medium"
): KnowledgeEdge {
  const edge = createKnowledgeEdge(nodeId1, nodeId2, "related_to", {
    strength,
    bidirectional: true
  });

  // Create reverse edge
  const reverseEdge = createKnowledgeEdge(nodeId2, nodeId1, "related_to", {
    strength,
    bidirectional: true,
    reverseEdgeId: edge.id
  });

  edge.reverseEdgeId = reverseEdge.id;

  return edge;
}

// Edge validation
export function validateKnowledgeEdge(edge: Partial<KnowledgeEdge>): string[] {
  const errors: string[] = [];

  if (!edge.type) {
    errors.push("Edge type is required");
  }

  if (!edge.sourceNodeId) {
    errors.push("Source node ID is required");
  }

  if (!edge.targetNodeId) {
    errors.push("Target node ID is required");
  }

  if (edge.sourceNodeId === edge.targetNodeId) {
    errors.push("Source and target nodes cannot be the same");
  }

  if (edge.weight !== undefined && (edge.weight < 0 || edge.weight > 1)) {
    errors.push("Weight must be between 0 and 1");
  }

  return errors;
}

// Edge utilities
export function getEdgeLabel(edge: KnowledgeEdge): string {
  const config = EDGE_TYPE_CONFIG[edge.type];
  return edge.label || config.directionLabel;
}

export function getEdgeColor(edge: KnowledgeEdge): string {
  const config = EDGE_TYPE_CONFIG[edge.type];
  const strengthConfig = EDGE_STRENGTH_CONFIG[edge.strength];

  // Adjust color based on strength
  return strengthConfig.color;
}

export function getEdgeDescription(edge: KnowledgeEdge): string {
  const config = EDGE_TYPE_CONFIG[edge.type];
  return edge.description || config.description;
}

// Calculate edge weight based on usage
export function calculateEdgeWeight(edge: KnowledgeEdge): number {
  // Base weight from strength
  let weight = edge.weight;

  // Increase weight based on use count (logarithmic scale)
  if (edge.useCount > 0) {
    weight = Math.min(1, weight + Math.log(edge.useCount + 1) * 0.1);
  }

  return weight;
}

// Get reverse edge type
export function getReverseEdgeType(type: EdgeType): EdgeType | null {
  const reverseMap: Partial<Record<EdgeType, EdgeType>> = {
    prerequisite: "leads_to",
    explains: "explains",
    uses: "uses",
    extends: "extends",
    part_of: "part_of",
    references: "references",
    examples: "examples",
    derives_from: "leads_to"
  };

  return reverseMap[type] || null;
}

// Check if edge is navigable
export function isEdgeNavigable(edge: KnowledgeEdge): boolean {
  // Certain edge types should not be directly navigated
  const nonNavigableTypes: EdgeType[] = ["contradicts"];

  return !nonNavigableTypes.includes(edge.type);
}

// Filter edges by type
export function filterEdgesByType(edges: KnowledgeEdge[], types: EdgeType[]): KnowledgeEdge[] {
  return edges.filter(edge => types.includes(edge.type));
}

// Filter edges by strength
export function filterEdgesByStrength(edges: KnowledgeEdge[], strengths: EdgeStrength[]): KnowledgeEdge[] {
  return edges.filter(edge => strengths.includes(edge.strength));
}

// Get edges for a node
export function getNodeEdges(
  edges: KnowledgeEdge[],
  nodeId: string
): { incoming: KnowledgeEdge[]; outgoing: KnowledgeEdge[] } {
  return {
    incoming: edges.filter(e => e.targetNodeId === nodeId),
    outgoing: edges.filter(e => e.sourceNodeId === nodeId)
  };
}

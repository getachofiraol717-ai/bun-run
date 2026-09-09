// Visual Learning Engine — Mind Map and Concept Map models
// Feature 2: Mind Map Generator, Feature 3: Concept Map Engine

export type MindMapNodeType = "root" | "branch" | "leaf";

export interface MindMapNode {
  id: string;
  text: string;
  type: MindMapNodeType;

  // Position
  x: number;
  y: number;

  // Layout
  width: number;
  height: number;
  depth: number;
  angle: number; // Radians from parent
  radius: number; // Distance from center

  // Hierarchy
  parentId?: string;
  childIds: string[];

  // Styling
  color?: string;
  icon?: string;
  imageUrl?: string;
  collapsed?: boolean;

  // Content
  details?: string;
  notes?: string;
  tags?: string[];

  // State
  selected?: boolean;
  highlighted?: boolean;
  editing?: boolean;
}

export interface MindMap {
  id: string;
  title: string;
  description?: string;

  // Structure
  rootId: string;
  nodes: Map<string, MindMapNode>;

  // Layout
  layout: MindMapLayout;
  centerX: number;
  centerY: number;
  radiusStep: number;
  angleSpread: number;

  // Style
  style: MindMapStyle;

  // Content
  rootText: string;
  branchCount: number;
  maxDepth: number;

  // Source
  sourceIds: string[];
  topicId?: string;

  // Accessibility
  ariaLabel: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface MindMapLayout {
  type: "radial" | "tree" | "horizontal" | "vertical";
  direction?: "clockwise" | "anticlockwise" | "mixed";
  spacing: {
    levelGap: number;
    siblingGap: number;
    nodeWidth: number;
    nodeHeight: number;
  };
}

export interface MindMapStyle {
  rootColor: string;
  branchColors: string[];
  leafColor: string;
  fontSize: number;
  fontFamily: string;
  lineColor: string;
  lineWidth: number;
  backgroundColor: string;
  borderRadius: number;
  padding: number;
}

// Concept Map Models
export interface ConceptMapNode {
  id: string;
  concept: string;
  definition?: string;

  // Position
  x: number;
  y: number;

  // Dimensions
  width: number;
  height: number;

  // Visual
  shape: "rectangle" | "ellipse" | "diamond" | "hexagon";
  color: string;
  borderColor: string;

  // Content
  examples?: string[];
  importance?: number; // 0-1

  // Connections
  links: string[]; // IDs of connected concepts
  linkLabels: Map<string, string>; // conceptId -> relationship label

  // State
  selected?: boolean;
  highlighted?: boolean;
  faded?: boolean;
}

export interface ConceptMapLink {
  id: string;
  sourceId: string;
  targetId: string;

  // Relationship
  label: string;
  relationshipType: ConceptRelationshipType;

  // Visual
  color: string;
  lineStyle: "solid" | "dashed" | "dotted";
  arrowHead: boolean;

  // Weight
  strength: number; // 0-1

  // For causal links
  direction?: "forward" | "backward" | "bidirectional";

  // Cross-reference
  crossTopic?: boolean;
  sourceTopicId?: string;
}

export type ConceptRelationshipType =
  | "is_a"
  | "part_of"
  | "related_to"
  | "causes"
  | "depends_on"
  | "enables"
  | "contradicts"
  | "similar_to"
  | "example_of"
  | "leads_to"
  | "requires"
  | "produces";

export interface ConceptMap {
  id: string;
  title: string;
  description?: string;

  // Structure
  nodes: Map<string, ConceptMapNode>;
  links: Map<string, ConceptMapLink>;

  // Layout
  layout: ConceptMapLayout;
  bounds: { x: number; y: number; width: number; height: number };

  // Central concept
  centralConceptId?: string;
  focusConceptId?: string;

  // Organization
  clusters?: ConceptCluster[];
  topics?: string[];

  // Style
  style: ConceptMapStyle;

  // Source
  sourceIds: string[];
  topicId?: string;

  // Accessibility
  ariaLabel: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ConceptCluster {
  id: string;
  label: string;
  nodeIds: string[];
  color: string;
  position?: { x: number; y: number };
}

export interface ConceptMapLayout {
  type: "force" | "hierarchical" | "circular" | "grid";
  spacing: number;
  clustering: boolean;
}

export interface ConceptMapStyle {
  nodeBackgroundColor: string;
  nodeBorderColor: string;
  linkColor: string;
  linkWidth: number;
  fontSize: number;
  fontFamily: string;
  backgroundColor: string;
  showLabels: boolean;
  showArrows: boolean;
}

// Flowchart Models
export interface FlowchartNode {
  id: string;
  label: string;
  type: FlowchartNodeType;

  // Position
  x: number;
  y: number;

  // Dimensions
  width: number;
  height: number;

  // Visual
  shape: "rectangle" | "diamond" | "oval" | "parallelogram" | "trapezoid";
  color: string;

  // Content
  description?: string;
  code?: string;

  // Connections
  nextIds: string[];
  previousIds: string[];

  // Decision branches
  yesNextId?: string;
  noNextId?: string;

  // State
  status?: "pending" | "current" | "completed" | "skipped";
}

export type FlowchartNodeType =
  | "start"
  | "end"
  | "process"
  | "decision"
  | "input"
  | "output"
  | "subprocess"
  | "connector";

export interface FlowchartLink {
  id: string;
  sourceId: string;
  targetId: string;

  // Routing
  type: "straight" | "elbow" | "curved";
  points?: { x: number; y: number }[];

  // Label
  label?: string;
  labelPosition?: "above" | "below" | "center";

  // Style
  color: string;
  lineStyle: "solid" | "dashed" | "dotted";
  animated?: boolean;
}

export interface Flowchart {
  id: string;
  title: string;
  description?: string;

  // Structure
  startNodeId: string;
  endNodeIds: string[];
  nodes: Map<string, FlowchartNode>;
  links: Map<string, FlowchartLink>;

  // Layout
  bounds: { x: number; y: number; width: number; height: number };

  // Style
  style: FlowchartStyle;

  // Source
  sourceIds: string[];
  topicId?: string;

  // Accessibility
  ariaLabel: string;
  steps: FlowchartStep[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface FlowchartStep {
  stepNumber: number;
  nodeId: string;
  instruction: string;
  expectedOutcome?: string;
  hint?: string;
}

export interface FlowchartStyle {
  nodeColor: string;
  decisionColor: string;
  startColor: string;
  endColor: string;
  linkColor: string;
  fontSize: number;
  fontFamily: string;
  backgroundColor: string;
}

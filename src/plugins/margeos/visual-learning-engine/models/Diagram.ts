// Visual Learning Engine — Core data models
// Feature 1: Auto Diagram Generation, Feature 6: Formula Visualization

export type DiagramType =
  | "scientific"
  | "system"
  | "relationship"
  | "structural"
  | "educational"
  | "anatomical"
  | "mechanical"
  | "electrical"
  | "chemical"
  | "process";

export type DiagramFormat = "svg" | "canvas" | "html";

export interface VisualStyle {
  colorScheme: ColorScheme;
  fontFamily: string;
  fontSize: number;
  backgroundColor: string;
  nodeStyle: NodeStyle;
  edgeStyle: EdgeStyle;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  success: string;
  warning: string;
  error: string;
  nodes: string[];
}

export interface NodeStyle {
  borderRadius: number;
  borderWidth: number;
  shadow: boolean;
  padding: number;
  minWidth: number;
  maxWidth: number;
}

export interface EdgeStyle {
  strokeWidth: number;
  strokeStyle: "solid" | "dashed" | "dotted";
  arrowHead: "none" | "arrow" | "triangle" | "diamond";
  labelPosition: number; // 0-1 along edge
}

export interface Diagram {
  id: string;
  type: DiagramType;
  title: string;
  description?: string;

  // Content
  nodes: DiagramNode[];
  edges: DiagramEdge[];

  // Metadata
  sourceIds: string[]; // Which engines/sources generated this
  conceptIds: string[];
  topicId?: string;

  // Style
  style: VisualStyle;

  // Bounds
  width: number;
  height: number;

  // Accessibility
  altText: string;
  ariaLabel: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  cachedAt?: Date;
}

export interface DiagramNode {
  id: string;
  label: string;
  type: NodeType;

  // Position (for layout algorithms)
  x: number;
  y: number;

  // Dimensions
  width: number;
  height: number;

  // Style overrides
  style?: Partial<NodeStyle>;
  color?: string;
  icon?: string;

  // Content
  content?: string;
  imageUrl?: string;

  // Grouping
  parentId?: string;
  childIds?: string[];

  // State
  expanded?: boolean;
  highlighted?: boolean;
  disabled?: boolean;

  // Accessibility
  ariaLabel?: string;
  description?: string;
}

export type NodeType =
  | "concept"
  | "process"
  | "entity"
  | "event"
  | "value"
  | "group"
  | "container"
  | "start"
  | "end"
  | "decision"
  | "action";

export interface DiagramEdge {
  id: string;
  sourceId: string;
  targetId: string;

  // Routing
  type: EdgeType;
  points?: { x: number; y: number }[];

  // Style overrides
  style?: Partial<EdgeStyle>;
  color?: string;
  label?: string;

  // Animation
  animated?: boolean;
  animationDirection?: "forward" | "backward" | "both";

  // Relationship
  relationship?: string;
  weight?: number;

  // Accessibility
  ariaLabel?: string;
}

export type EdgeType =
  | "direct"
  | "curved"
  | "orthogonal"
  | "bezier"
  | "step"
  | "smooth";

// Diagram generation input
export interface DiagramInput {
  type: DiagramType;
  title: string;
  sourceData: DiagramSourceData;
  options?: DiagramOptions;
}

export interface DiagramSourceData {
  // From Smart PDF Engine
  concepts?: { name: string; definition?: string; related?: string[] }[];
  formulas?: { formula: string; variables: string[] }[];
  processes?: { step: string; inputs?: string[]; outputs?: string[] }[];

  // From Reference Book Engine
  relationships?: { source: string; target: string; type: string }[];
  hierarchies?: { parent: string; children: string[] }[];

  // Generic
  entities?: { name: string; type?: string; description?: string }[];
  connections?: { from: string; to: string; label?: string }[];
}

export interface DiagramOptions {
  layout?: "auto" | "hierarchical" | "force" | "circular" | "grid";
  direction?: "TB" | "BT" | "LR" | "RL";
  maxNodes?: number;
  includeLabels?: boolean;
  colorScheme?: ColorScheme;
  accessible?: boolean;
}

// Diagram cache
export interface DiagramCache {
  diagramId: string;
  checksum: string;
  renderedSvg?: string;
  renderedCanvas?: string;
  lastAccessed: Date;
  hitCount: number;
}

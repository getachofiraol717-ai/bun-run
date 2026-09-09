// Visual Learning Engine — Animation models
// Feature 5: Process Animation Engine

export type AnimationType =
  | "process"
  | "sequence"
  | "transformation"
  | "comparison"
  | "revelation"
  | "highlight";

export type AnimationTrigger = "auto" | "click" | "hover" | "scroll" | "manual";

export interface Animation {
  id: string;
  type: AnimationType;
  title: string;
  description?: string;

  // Content
  frames: AnimationFrame[];
  currentFrame: number;

  // Playback
  playback: AnimationPlayback;

  // Source
  sourceIds: string[];
  topicId?: string;
  conceptId?: string;

  // Accessibility
  audioDescription?: string;
  captions: AnimationCaption[];

  // Metadata
  duration?: number; // Total duration in seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface AnimationFrame {
  frameNumber: number;
  timestamp: number; // Seconds from start

  // Visual elements
  elements: AnimationElement[];

  // Annotations
  annotations: AnimationAnnotation[];

  // Narrations
  narration?: string;
  captions: string[];

  // Transitions
  transition?: AnimationTransition;
}

export interface AnimationElement {
  id: string;
  type: AnimationElementType;

  // Reference
  targetId?: string; // ID of diagram/mindmap element

  // Visual state
  visible: boolean;
  opacity: number;
  position: { x: number; y: number };
  scale: number;
  rotation: number;

  // Styling
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;

  // For particles/flow
  velocity?: { x: number; y: number };
  particleCount?: number;

  // For text
  text?: string;
  fontSize?: number;
}

export type AnimationElementType =
  | "shape"
  | "text"
  | "line"
  | "arrow"
  | "image"
  | "particle"
  | "path"
  | "highlight"
  | "group";

export interface AnimationAnnotation {
  type: "arrow" | "circle" | "rectangle" | "text" | "callout";

  // Position
  x: number;
  y: number;
  width?: number;
  height?: number;

  // Content
  text?: string;
  color: string;

  // Animation
  animate?: boolean;
  animationType?: "pulse" | "bounce" | "fade" | "draw";
}

export interface AnimationTransition {
  type: TransitionType;
  duration: number; // Seconds
  easing: EasingFunction;
}

export type TransitionType =
  | "fade"
  | "slide"
  | "zoom"
  | "flip"
  | "morph"
  | "draw"
  | "none";

export type EasingFunction =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "bounce"
  | "elastic";

export interface AnimationPlayback {
  playing: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  loop: boolean;

  // Controls
  autoplay: boolean;
  showControls: boolean;
  showProgress: boolean;

  // Sound
  muted: boolean;
  volume: number;
}

export interface AnimationCaption {
  startTime: number;
  endTime: number;
  text: string;
  language?: string;
}

// Visual Node and Connection (for interactive exploration)
export interface VisualNode {
  id: string;
  type: VisualNodeType;

  // Content
  label: string;
  description?: string;
  details?: string;

  // Position
  x: number;
  y: number;

  // Dimensions
  width: number;
  height: number;

  // Visual
  shape: VisualShape;
  color: string;
  icon?: string;
  imageUrl?: string;

  // State
  state: VisualNodeState;
  level?: "primary" | "secondary" | "tertiary";

  // Hierarchy
  parentId?: string;
  childIds: string[];
  depth: number;

  // Connections
  connectionIds: string[];

  // Interactive
  expandable?: boolean;
  collapsed?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  disabled?: boolean;
  hovered?: boolean;

  // Accessibility
  ariaLabel: string;
  tabIndex: number;
}

export type VisualNodeType =
  | "concept"
  | "topic"
  | "process"
  | "entity"
  | "formula"
  | "definition"
  | "example"
  | "source";

export type VisualShape =
  | "rectangle"
  | "roundedRectangle"
  | "ellipse"
  | "circle"
  | "diamond"
  | "hexagon"
  | "parallelogram"
  | "cylinder";

export interface VisualNodeState {
  default: {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    opacity: number;
  };
  hover?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    scale?: number;
    shadow?: boolean;
  };
  selected?: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    glow?: boolean;
  };
  highlighted?: {
    backgroundColor?: string;
    borderColor?: string;
    glow?: boolean;
  };
  disabled?: {
    opacity?: number;
    grayscale?: boolean;
  };
}

export interface VisualConnection {
  id: string;
  sourceId: string;
  targetId: string;

  // Type
  type: VisualConnectionType;
  label?: string;

  // Routing
  path: { x: number; y: number }[];
  curve?: "bezier" | "elbow" | "straight" | "step";

  // Visual
  color: string;
  lineWidth: number;
  lineStyle: "solid" | "dashed" | "dotted";
  arrowHead: boolean;
  arrowPosition?: "source" | "target" | "both";

  // Animation
  animated?: boolean;
  animationDirection?: "forward" | "backward" | "bidirectional";
  animationSpeed?: number;

  // State
  visible: boolean;
  highlighted: boolean;
  faded: boolean;

  // Interaction
  clickable?: boolean;
  onClick?: string; // Action identifier

  // Accessibility
  ariaLabel: string;
}

export type VisualConnectionType =
  | "association"
  | "dependency"
  | "composition"
  | "inheritance"
  | "causation"
  | "sequence"
  | "flow";

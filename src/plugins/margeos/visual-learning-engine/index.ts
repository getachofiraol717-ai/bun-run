// Visual Learning Engine — Barrel Export
// Main entry point for the Visual Learning Engine plugin

// Core Engine
export { VisualLearningEngine, visualLearningEngine } from "./core/VisualLearningEngine";
export type { VisualLearningConfig, EngineResult, GenerationRequest, GenerationResult } from "./core/VisualLearningEngine";

// Generators
export { DiagramGenerator } from "./core/DiagramGenerator";
export { MindMapGenerator } from "./core/MindMapGenerator";
export { ConceptMapGenerator } from "./core/ConceptMapGenerator";
export { FlowchartGenerator } from "./core/FlowchartGenerator";
export { ProcessAnimationGenerator } from "./core/ProcessAnimationGenerator";
export { LayoutEngine } from "./core/LayoutEngine";
export { RenderingEngine } from "./core/RenderingEngine";

// Models - Diagram, MindMap, Animation
export * from "./models/Diagram";
export * from "./models/MindMap";
export * from "./models/Animation";

// Interfaces
export * from "./interfaces/VisualizationEngine";
export * from "./interfaces/DiagramRenderer";
export * from "./interfaces/AnimationRenderer";

// Services
export { DiagramService, diagramService } from "./services/DiagramService";
export type { DiagramMetadata } from "./services/DiagramService";

export { AnimationService, animationService } from "./services/AnimationService";
export type { AnimationState, PlaybackState } from "./services/AnimationService";

export { NodeLayoutService, nodeLayoutService } from "./services/NodeLayoutService";
export type { LayoutPosition, LayoutBounds, NodeDimensions } from "./services/NodeLayoutService";

export { ConceptRelationshipService, conceptRelationshipService } from "./services/ConceptRelationshipService";
export type { ConceptNode, ConceptRelationship, RelationshipCluster } from "./services/ConceptRelationshipService";

export { RenderingService, renderingService } from "./services/RenderingService";
export type { RenderFormat, RenderOptions, RenderResult } from "./services/RenderingService";

export { ExportService, exportService } from "./services/ExportService";
export type { ExportFormat, ExportOptions, ExportMetadata } from "./services/ExportService";

// Hooks
export { useVisualLearning } from "./hooks/useVisualLearning";
export type { UseVisualLearningOptions, UseVisualLearningResult } from "./hooks/useVisualLearning";

export { useMindMaps } from "./hooks/useMindMaps";
export type { UseMindMapsOptions, UseMindMapsResult } from "./hooks/useMindMaps";

export { useConceptMaps } from "./hooks/useConceptMaps";
export type { UseConceptMapsOptions, UseConceptMapsResult } from "./hooks/useConceptMaps";

export { useFlowcharts } from "./hooks/useFlowcharts";
export type { UseFlowchartsOptions, UseFlowchartsResult } from "./hooks/useFlowcharts";

export { useAnimations } from "./hooks/useAnimations";
export type { UseAnimationsOptions, UseAnimationsResult, AnimationState as AnimationHookState } from "./hooks/useAnimations";

// Store
export { visualLearningStore, useVisualLearningStore, useVisualLearningStoreWithActions } from "./store/visualLearningStore";
export type {
  VisualLearningState,
  VisualLearningSettings,
  VisualizationType
} from "./store/visualLearningStore";

// Utils - Layout
export {
  distance,
  angle,
  radToDeg,
  degToRad,
  pointAtDistance,
  calculateBounds,
  calculateCenter,
  rectsOverlap,
  pointInRect,
  circularLayout,
  gridLayout,
  radialTreeLayout,
  hierarchicalLayout,
  normalizePositions,
  centerPositions,
  snapToGrid,
  springForce,
  repulsionForce
} from "./utils/layoutUtils";
export type { Point, Size, Bounds } from "./utils/layoutUtils";

// Utils - Animation
export {
  lerp,
  easingFunctions,
  getEasingFunction,
  interpolateKeyframes,
  calculateFrameAtTime,
  calculateTransition,
  calculatePathAnimation,
  generateFramesFromSteps,
  calculateDuration,
  getTransitionName,
  getEasingName
} from "./utils/animationUtils";
export type { AnimationKeyframe, InterpolationResult } from "./utils/animationUtils";

// Utils - Diagram
export {
  calculateDiagramStatistics,
  findConnectedNodes,
  findPath,
  findAllPaths,
  detectCycles,
  topologicalSort,
  findRootNodes,
  findLeafNodes,
  getNodeTypeColor,
  getEdgeTypeName,
  getDiagramTypeName,
  createEmptyDiagram,
  cloneDiagram
} from "./utils/diagramUtils";
export type { DiagramStatistics } from "./utils/diagramUtils";

// Utils - Graph
export {
  createGraph,
  addGraphNode,
  addGraphEdge,
  getNeighbors,
  getOutgoingNeighbors,
  getIncomingNeighbors,
  edgeExists,
  getEdgeWeight,
  bfs,
  dfs,
  dijkstra,
  findConnectedComponents,
  findBridges,
  degreeCentrality,
  betweennessCentrality,
  hasCycle,
  topologicalSort as graphTopologicalSort,
  toAdjacencyList,
  fromAdjacencyList
} from "./utils/graphUtils";
export type { GraphNode, GraphEdge, Graph } from "./utils/graphUtils";

// Utils - Rendering
export {
  createRenderContext,
  clearCanvas,
  drawRoundedRect,
  drawEllipse,
  drawDiamond,
  drawLine,
  drawArrow,
  drawCurvedLine,
  drawText,
  drawWrappedText,
  setShadow,
  clearShadow,
  svgToDataUrl,
  canvasToDataUrl,
  canvasToBlob,
  loadImage,
  drawImage
} from "./utils/renderingUtils";
export type { RenderContext } from "./utils/renderingUtils";

// Interfaces
export type {
  IVisualizationEngine,
  IVisualizationRenderer,
  ILayoutEngine,
  IDiagramEngine,
  IMindMapEngine,
  IConceptMapEngine,
  IFlowchartEngine,
  IAnimationEngine,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  VisualizationMetadata
} from "./interfaces/VisualizationEngine";

export type {
  IDiagramRenderer,
  INodeRenderer,
  IEdgeRenderer,
  IShapeRenderer,
  ILabelRenderer,
  IInteractiveDiagramRenderer,
  DiagramRendererEvents,
  DiagramRenderOptions,
  DiagramDimensions,
  NodeRenderStyle,
  BoundingBox,
  EdgeRenderStyle,
  PathPoint,
  LabelRenderOptions
} from "./interfaces/DiagramRenderer";

export type {
  IAnimationRenderer,
  IAnimationPlayer,
  IElementRenderer,
  ITransitionRenderer,
  ICaptionRenderer,
  IAnimationSynthesizer,
  AnimationPlayerEvents,
  AnimationRenderOptions,
  VideoRenderOptions,
  PlayerState,
  ElementRenderStyle,
  TextRenderStyle,
  LineRenderStyle,
  ArrowRenderStyle,
  ParticleRenderStyle,
  PathRenderStyle,
  HighlightRenderStyle,
  CaptionRenderStyle,
  SynthesisOptions
} from "./interfaces/AnimationRenderer";

// Plugin info
export const PLUGIN_INFO = {
  name: "Visual Learning Generator Engine",
  version: "1.0.0",
  description: "Generates visual learning materials including diagrams, mind maps, concept maps, flowcharts, and animations",
  features: [
    "Auto Diagram Generation",
    "Mind Map Generator",
    "Concept Map Engine",
    "Flowchart Generator",
    "Process Animation Engine",
    "Formula Visualization",
    "Interactive Learning"
  ],
  author: "MarGEOS",
  dependencies: []
} as const;

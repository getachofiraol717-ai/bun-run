// Visual Learning Engine — VisualizationEngine Interface
// Defines the contract for visualization engines

import type { Diagram } from "../models/Diagram";
import type { MindMap } from "../models/MindMap";
import type { ConceptMap } from "../models/MindMap";
import type { Flowchart } from "../models/MindMap";
import type { Animation } from "../models/Animation";

/**
 * Base visualization engine interface
 */
export interface IVisualizationEngine<T> {
  /**
   * Generate visualization from input data
   */
  generate(input: any, options?: any): Promise<T>;

  /**
   * Update existing visualization
   */
  update(visualization: T, changes: Partial<T>): T;

  /**
   * Validate visualization data
   */
  validate(visualization: T): ValidationResult;

  /**
   * Get visualization metadata
   */
  getMetadata(visualization: T): VisualizationMetadata;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface VisualizationMetadata {
  id: string;
  type: string;
  title: string;
  nodeCount: number;
  edgeCount: number;
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

/**
 * Diagram engine interface
 */
export interface IDiagramEngine extends IVisualizationEngine<Diagram> {
  /**
   * Generate from structured data
   */
  generateFromData(
    type: string,
    title: string,
    data: {
      nodes?: { id: string; label: string; type?: string }[];
      edges?: { source: string; target: string; label?: string }[];
      concepts?: { name: string; definition?: string }[];
      formulas?: { formula: string; variables: string[] }[];
      processes?: { step: string; inputs?: string[]; outputs?: string[] }[];
    },
    options?: any
  ): Promise<Diagram>;

  /**
   * Add node to diagram
   */
  addNode(diagram: Diagram, node: Partial<Diagram["nodes"][0]>): Diagram;

  /**
   * Remove node from diagram
   */
  removeNode(diagram: Diagram, nodeId: string): Diagram;

  /**
   * Connect nodes
   */
  connectNodes(diagram: Diagram, sourceId: string, targetId: string, label?: string): Diagram;

  /**
   * Get node by ID
   */
  getNode(diagram: Diagram, nodeId: string): Diagram["nodes"][0] | undefined;

  /**
   * Get connected nodes
   */
  getConnectedNodes(diagram: Diagram, nodeId: string): string[];
}

/**
 * Mind map engine interface
 */
export interface IMindMapEngine extends IVisualizationEngine<MindMap> {
  /**
   * Generate from topic
   */
  generateFromTopic(
    title: string,
    centralConcept: string,
    branches: { name: string; subtopics?: string[] }[],
    options?: any
  ): Promise<MindMap>;

  /**
   * Add branch to mind map
   */
  addBranch(mindMap: MindMap, parentId: string, text: string): MindMap;

  /**
   * Remove branch and descendants
   */
  removeBranch(mindMap: MindMap, nodeId: string): MindMap;

  /**
   * Collapse branch
   */
  collapseBranch(mindMap: MindMap, nodeId: string): MindMap;

  /**
   * Expand branch
   */
  expandBranch(mindMap: MindMap, nodeId: string): MindMap;

  /**
   * Update node text
   */
  updateNodeText(mindMap: MindMap, nodeId: string, text: string): MindMap;

  /**
   * Change node color
   */
  changeNodeColor(mindMap: MindMap, nodeId: string, color: string): MindMap;
}

/**
 * Concept map engine interface
 */
export interface IConceptMapEngine extends IVisualizationEngine<ConceptMap> {
  /**
   * Generate from concepts and relationships
   */
  generateFromConcepts(
    title: string,
    concepts: { id: string; name: string; definition?: string }[],
    relationships: { source: string; target: string; label: string; type: string }[],
    options?: any
  ): Promise<ConceptMap>;

  /**
   * Add concept
   */
  addConcept(conceptMap: ConceptMap, concept: Partial<ConceptMap["nodes"] extends Map<string, infer T> ? T : never>): ConceptMap;

  /**
   * Remove concept and related links
   */
  removeConcept(conceptMap: ConceptMap, conceptId: string): ConceptMap;

  /**
   * Add relationship
   */
  addRelationship(
    conceptMap: ConceptMap,
    sourceId: string,
    targetId: string,
    label: string,
    type: string
  ): ConceptMap;

  /**
   * Remove relationship
   */
  removeRelationship(conceptMap: ConceptMap, linkId: string): ConceptMap;

  /**
   * Highlight concept
   */
  highlightConcept(conceptMap: ConceptMap, conceptId: string): ConceptMap;

  /**
   * Fade concept
   */
  fadeConcept(conceptMap: ConceptMap, conceptId: string): ConceptMap;
}

/**
 * Flowchart engine interface
 */
export interface IFlowchartEngine extends IVisualizationEngine<Flowchart> {
  /**
   * Generate from process steps
   */
  generateFromSteps(
    title: string,
    steps: { id: string; label: string; type?: string; next?: string; yes?: string; no?: string }[],
    options?: any
  ): Promise<Flowchart>;

  /**
   * Add step
   */
  addStep(flowchart: Flowchart, step: Partial<Flowchart["nodes"] extends Map<string, infer T> ? T : never>): Flowchart;

  /**
   * Remove step
   */
  removeStep(flowchart: Flowchart, stepId: string): Flowchart;

  /**
   * Update step order
   */
  reorderSteps(flowchart: Flowchart, stepIds: string[]): Flowchart;

  /**
   * Connect steps
   */
  connectSteps(flowchart: Flowchart, fromId: string, toId: string): Flowchart;

  /**
   * Get next step
   */
  getNextStep(flowchart: Flowchart, stepId: string): string | null;
}

/**
 * Animation engine interface
 */
export interface IAnimationEngine extends IVisualizationEngine<Animation> {
  /**
   * Generate from process
   */
  generateFromProcess(
    title: string,
    frames: { elements: any[]; narration?: string; duration?: number }[],
    options?: any
  ): Promise<Animation>;

  /**
   * Add frame
   */
  addFrame(animation: Animation, frame: Partial<Animation["frames"][0]>): Animation;

  /**
   * Remove frame
   */
  removeFrame(animation: Animation, frameIndex: number): Animation;

  /**
   * Update frame
   */
  updateFrame(animation: Animation, frameIndex: number, updates: Partial<Animation["frames"][0]>): Animation;

  /**
   * Get frame at time
   */
  getFrameAtTime(animation: Animation, time: number): Animation["frames"][0] | null;

  /**
   * Set playback position
   */
  seekTo(animation: Animation, time: number): Animation;
}

/**
 * Visualization renderer interface
 */
export interface IVisualizationRenderer {
  /**
   * Render to SVG
   */
  renderToSvg(visualization: Diagram | MindMap | ConceptMap | Flowchart): Promise<string>;

  /**
   * Render to canvas
   */
  renderToCanvas(
    visualization: Diagram | MindMap | ConceptMap | Flowchart,
    canvas: HTMLCanvasElement,
    options?: RenderOptions
  ): Promise<void>;

  /**
   * Get render dimensions
   */
  getDimensions(visualization: Diagram | MindMap | ConceptMap | Flowchart): { width: number; height: number };
}

export interface RenderOptions {
  scale?: number;
  backgroundColor?: string;
  padding?: number;
  quality?: number;
}

/**
 * Layout engine interface
 */
export interface ILayoutEngine {
  /**
   * Apply layout to diagram
   */
  applyDiagramLayout(diagram: Diagram, layoutType: "hierarchical" | "force" | "circular" | "grid"): Promise<void>;

  /**
   * Apply layout to mind map
   */
  applyMindMapLayout(mindMap: MindMap, layoutType: "radial" | "tree" | "horizontal" | "vertical"): Promise<void>;

  /**
   * Apply layout to concept map
   */
  applyConceptMapLayout(conceptMap: ConceptMap, layoutType: "force" | "hierarchical" | "circular" | "grid"): Promise<void>;

  /**
   * Apply layout to flowchart
   */
  applyFlowchartLayout(flowchart: Flowchart): Promise<void>;

  /**
   * Optimize layout
   */
  optimizeLayout(visualization: Diagram | MindMap | ConceptMap | Flowchart): Promise<void>;
}

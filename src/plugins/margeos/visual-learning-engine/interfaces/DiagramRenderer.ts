// Visual Learning Engine — DiagramRenderer Interface
// Defines contracts for diagram rendering

import type { Diagram, DiagramNode, DiagramEdge } from "../models/Diagram";

/**
 * Diagram renderer interface
 */
export interface IDiagramRenderer {
  /**
   * Render diagram to SVG
   */
  renderToSvg(diagram: Diagram): Promise<string>;

  /**
   * Render diagram to canvas
   */
  renderToCanvas(diagram: Diagram, canvas: HTMLCanvasElement, options?: DiagramRenderOptions): Promise<void>;

  /**
   * Get rendered dimensions
   */
  getDimensions(diagram: Diagram): DiagramDimensions;

  /**
   * Update rendered output
   */
  update(diagram: Diagram, previousSvg?: string): Promise<string>;

  /**
   * Export diagram
   */
  export(diagram: Diagram, format: "svg" | "png" | "jpeg"): Promise<Blob | string>;
}

export interface DiagramRenderOptions {
  width?: number;
  height?: number;
  scale?: number;
  backgroundColor?: string;
  padding?: number;
  showGrid?: boolean;
  gridSize?: number;
  theme?: "light" | "dark";
  interactive?: boolean;
}

export interface DiagramDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Node renderer interface
 */
export interface INodeRenderer {
  /**
   * Render node to SVG element
   */
  renderToSvg(node: DiagramNode, style: NodeRenderStyle): string;

  /**
   * Render node to canvas
   */
  renderToCanvas(
    ctx: CanvasRenderingContext2D,
    node: DiagramNode,
    style: NodeRenderStyle,
    scale?: number
  ): void;

  /**
   * Get node bounding box
   */
  getBoundingBox(node: DiagramNode): BoundingBox;

  /**
   * Check if point is inside node
   */
  hitTest(node: DiagramNode, x: number, y: number): boolean;
}

export interface NodeRenderStyle {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Edge renderer interface
 */
export interface IEdgeRenderer {
  /**
   * Render edge to SVG element
   */
  renderToSvg(
    source: DiagramNode,
    target: DiagramNode,
    edge: DiagramEdge,
    style: EdgeRenderStyle
  ): string;

  /**
   * Render edge to canvas
   */
  renderToCanvas(
    ctx: CanvasRenderingContext2D,
    source: DiagramNode,
    target: DiagramNode,
    edge: DiagramEdge,
    style: EdgeRenderStyle,
    scale?: number
  ): void;

  /**
   * Get edge path points
   */
  getEdgePath(
    source: DiagramNode,
    target: DiagramNode,
    edge: DiagramEdge
  ): PathPoint[];

  /**
   * Check if point is near edge
   */
  hitTest(
    source: DiagramNode,
    target: DiagramNode,
    edge: DiagramEdge,
    x: number,
    y: number,
    threshold?: number
  ): boolean;
}

export interface EdgeRenderStyle {
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: "solid" | "dashed" | "dotted";
  arrowHead?: "none" | "arrow" | "triangle" | "diamond";
  arrowColor?: string;
  arrowSize?: number;
  labelFontFamily?: string;
  labelFontSize?: number;
  labelColor?: string;
}

export interface PathPoint {
  x: number;
  y: number;
}

/**
 * Shape renderer interface
 */
export interface IShapeRenderer {
  /**
   * Render rectangle
   */
  renderRectangle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius?: number,
    style?: Partial<NodeRenderStyle>
  ): void;

  /**
   * Render ellipse
   */
  renderEllipse(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    style?: Partial<NodeRenderStyle>
  ): void;

  /**
   * Render diamond
   */
  renderDiamond(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    width: number,
    height: number,
    style?: Partial<NodeRenderStyle>
  ): void;

  /**
   * Render parallelogram
   */
  renderParallelogram(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    offset?: number,
    style?: Partial<NodeRenderStyle>
  ): void;

  /**
   * Render cylinder
   */
  renderCylinder(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    width: number,
    height: number,
    style?: Partial<NodeRenderStyle>
  ): void;
}

/**
 * Label renderer interface
 */
export interface ILabelRenderer {
  /**
   * Render text
   */
  renderText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    options?: LabelRenderOptions
  ): TextMetrics;

  /**
   * Render wrapped text
   */
  renderWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    options?: LabelRenderOptions
  ): number;

  /**
   * Measure text
   */
  measureText(ctx: CanvasRenderingContext2D, text: string, options?: LabelRenderOptions): TextMetrics;

  /**
   * Wrap text
   */
  wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[];
}

export interface LabelRenderOptions {
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: "normal" | "italic";
  fontWeight?: "normal" | "bold";
  color?: string;
  align?: "left" | "center" | "right";
  baseline?: "top" | "middle" | "bottom";
  maxWidth?: number;
}

/**
 * Interactive diagram renderer
 */
export interface IInteractiveDiagramRenderer extends IDiagramRenderer {
  /**
   * Handle click event
   */
  onClick(x: number, y: number): DiagramNode | DiagramEdge | null;

  /**
   * Handle double click event
   */
  onDoubleClick(x: number, y: number): DiagramNode | null;

  /**
   * Handle hover event
   */
  onHover(x: number, y: number): DiagramNode | DiagramEdge | null;

  /**
   * Handle drag start
   */
  onDragStart(nodeId: string, x: number, y: number): void;

  /**
   * Handle drag move
   */
  onDragMove(nodeId: string, x: number, y: number): void;

  /**
   * Handle drag end
   */
  onDragEnd(nodeId: string, x: number, y: number): void;

  /**
   * Handle selection change
   */
  onSelectionChange(selectedIds: string[]): void;

  /**
   * Highlight node
   */
  highlightNode(nodeId: string, highlight: boolean): void;

  /**
   * Highlight edge
   */
  highlightEdge(edgeId: string, highlight: boolean): void;

  /**
   * Fade node
   */
  fadeNode(nodeId: string, faded: boolean): void;

  /**
   * Get selected elements
   */
  getSelection(): { nodes: string[]; edges: string[] };
}

/**
 * Diagram renderer events
 */
export interface DiagramRendererEvents {
  onNodeClick?: (node: DiagramNode) => void;
  onNodeDoubleClick?: (node: DiagramNode) => void;
  onNodeHover?: (node: DiagramNode | null) => void;
  onEdgeClick?: (edge: DiagramEdge) => void;
  onEdgeHover?: (edge: DiagramEdge | null) => void;
  onSelectionChange?: (selected: { nodes: string[]; edges: string[] }) => void;
  onDragStart?: (nodeId: string) => void;
  onDrag?: (nodeId: string, x: number, y: number) => void;
  onDragEnd?: (nodeId: string, x: number, y: number) => void;
}

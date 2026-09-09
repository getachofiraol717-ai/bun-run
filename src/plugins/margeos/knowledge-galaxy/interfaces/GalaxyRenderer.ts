// @ts-nocheck
// Knowledge Galaxy — GalaxyRenderer Interface
// Interface for rendering the knowledge galaxy

import type { KnowledgeNode, KnowledgeEdge, GalaxyCluster } from "../models";

export interface GalaxyRendererConfig {
  canvasId: string;
  width: number;
  height: number;
  backgroundColor?: string;
  showGrid?: boolean;
  enablePhysics?: boolean;
  enableLabels?: boolean;
}

export interface RenderNode {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  label: string;
  type: string;
  mastery: number;
  status: string;
  opacity: number;
}

export interface RenderEdge {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  color: string;
  width: number;
  type: string;
  strength: string;
  label?: string;
  dashed: boolean;
}

export interface GalaxyRenderData {
  nodes: RenderNode[];
  edges: RenderEdge[];
  clusters: Array<{
    id: string;
    x: number;
    y: number;
    radius: number;
    color: string;
    label: string;
  }>;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface IGalaxyRenderer {
  initialize(config: GalaxyRendererConfig): Promise<void>;
  render(data: GalaxyRenderData): void;
  updateViewport(viewport: { x: number; y: number; zoom: number }): void;
  highlightNodes(nodeIds: string[]): void;
  highlightEdges(edgeIds: string[]): void;
  selectNode(nodeId: string): void;
  clearSelection(): void;
  zoomTo(level: number, animated?: boolean): void;
  panTo(x: number, y: number, animated?: boolean): void;
  fitToContent(animated?: boolean): void;
  destroy(): void;
}

export interface INodeRenderer {
  render(node: RenderNode, ctx: CanvasRenderingContext2D): void;
  hitTest(x: number, y: number, node: RenderNode): boolean;
  getTooltip(node: RenderNode): string;
}

export interface IEdgeRenderer {
  render(edge: RenderEdge, ctx: CanvasRenderingContext2D): void;
  hitTest(x: number, y: number, edge: RenderEdge): boolean;
}

export interface IClusterRenderer {
  render(cluster: GalaxyRenderData["clusters"][0], ctx: CanvasRenderingContext2D): void;
}

export type RenderEventType =
  | "node_click"
  | "node_hover"
  | "node_select"
  | "edge_click"
  | "edge_hover"
  | "viewport_change"
  | "zoom_change"
  | "pan_end";

export interface RenderEvent {
  type: RenderEventType;
  data: any;
  timestamp: Date;
}

export type RenderEventHandler = (event: RenderEvent) => void;

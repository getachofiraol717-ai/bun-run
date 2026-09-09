// @ts-nocheck
// Knowledge Galaxy — State Store
// Centralized state management for Knowledge Galaxy

import type { KnowledgeNode, KnowledgeEdge, GalaxyCluster, LearningPath } from "../models";

export interface GalaxyState {
  userId: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Data
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  clusters: GalaxyCluster[];
  paths: LearningPath[];

  // View state
  viewMode: "galaxy" | "graph" | "tree" | "list";
  viewport: { x: number; y: number; zoom: number };

  // Selection
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  hoveredNodeId: string | null;

  // Filters
  filters: {
    types: string[];
    subjects: string[];
    masteryLevels: string[];
    searchQuery: string;
  };

  // Performance
  visibleNodeCount: number;
  maxVisibleNodes: number;

  // Accessibility
  accessibilityMode: boolean;
  reducedMotion: boolean;
}

export type GalaxyAction =
  | { type: "INITIALIZE"; payload: { userId: string } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DATA"; payload: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[]; clusters: GalaxyCluster[]; paths: LearningPath[] } }
  | { type: "SET_VIEW_MODE"; payload: GalaxyState["viewMode"] }
  | { type: "UPDATE_VIEWPORT"; payload: Partial<GalaxyState["viewport"]> }
  | { type: "SELECT_NODE"; payload: { nodeId: string; multiSelect?: boolean } }
  | { type: "SELECT_EDGE"; payload: { edgeId: string; multiSelect?: boolean } }
  | { type: "SET_HOVERED_NODE"; payload: string | null }
  | { type: "CLEAR_SELECTION" }
  | { type: "UPDATE_FILTERS"; payload: Partial<GalaxyState["filters"]> }
  | { type: "RESET_FILTERS" }
  | { type: "RESET" };

export const initialState: GalaxyState = {
  userId: null,
  isInitialized: false,
  isLoading: false,
  error: null,
  nodes: [],
  edges: [],
  clusters: [],
  paths: [],
  viewMode: "galaxy",
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeIds: [],
  selectedEdgeIds: [],
  hoveredNodeId: null,
  filters: {
    types: [],
    subjects: [],
    masteryLevels: [],
    searchQuery: ""
  },
  visibleNodeCount: 0,
  maxVisibleNodes: 500,
  accessibilityMode: false,
  reducedMotion: false
};

export function galaxyReducer(state: GalaxyState, action: GalaxyAction): GalaxyState {
  switch (action.type) {
    case "INITIALIZE":
      return {
        ...state,
        userId: action.payload.userId,
        isInitialized: true,
        isLoading: false,
        error: null
      };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "SET_DATA":
      return {
        ...state,
        nodes: action.payload.nodes,
        edges: action.payload.edges,
        clusters: action.payload.clusters,
        paths: action.payload.paths,
        visibleNodeCount: action.payload.nodes.length
      };

    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };

    case "UPDATE_VIEWPORT":
      return {
        ...state,
        viewport: { ...state.viewport, ...action.payload }
      };

    case "SELECT_NODE":
      if (action.payload.multiSelect) {
        const exists = state.selectedNodeIds.includes(action.payload.nodeId);
        return {
          ...state,
          selectedNodeIds: exists
            ? state.selectedNodeIds.filter(id => id !== action.payload.nodeId)
            : [...state.selectedNodeIds, action.payload.nodeId]
        };
      }
      return { ...state, selectedNodeIds: [action.payload.nodeId] };

    case "SELECT_EDGE":
      if (action.payload.multiSelect) {
        const exists = state.selectedEdgeIds.includes(action.payload.edgeId);
        return {
          ...state,
          selectedEdgeIds: exists
            ? state.selectedEdgeIds.filter(id => id !== action.payload.edgeId)
            : [...state.selectedEdgeIds, action.payload.edgeId]
        };
      }
      return { ...state, selectedEdgeIds: [action.payload.edgeId] };

    case "SET_HOVERED_NODE":
      return { ...state, hoveredNodeId: action.payload };

    case "CLEAR_SELECTION":
      return { ...state, selectedNodeIds: [], selectedEdgeIds: [] };

    case "UPDATE_FILTERS":
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

    case "RESET_FILTERS":
      return {
        ...state,
        filters: initialState.filters
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

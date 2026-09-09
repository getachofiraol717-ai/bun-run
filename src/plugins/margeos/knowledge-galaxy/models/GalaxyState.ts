// Knowledge Galaxy — GalaxyState Model
// Represents the current state of the knowledge galaxy

import type { KnowledgeNode } from "./KnowledgeNode";
import type { KnowledgeEdge } from "./KnowledgeEdge";
import type { GalaxyCluster } from "./GalaxyCluster";
import type { LearningPath } from "./LearningPath";

export type ViewMode = "galaxy" | "graph" | "tree" | "list";
export type ZoomLevel = "overview" | "cluster" | "node" | "detail";

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  rotation?: number;
}

export interface SelectionState {
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  selectedClusterId?: string;
  hoveredNodeId?: string;
  hoveredEdgeId?: string;
}

export interface FilterState {
  nodeTypes: string[];
  edgeTypes: string[];
  subjects: string[];
  masteryLevels: string[];
  status: string[];
  searchQuery: string;
}

export interface GalaxyState {
  // User info
  userId: string;

  // Current graph data
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  clusters: GalaxyCluster[];
  learningPaths: LearningPath[];

  // View state
  viewMode: ViewMode;
  zoomLevel: ZoomLevel;
  viewport: ViewportState;
  isAnimating: boolean;

  // Selection state
  selection: SelectionState;

  // Filter state
  filters: FilterState;

  // UI state
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;

  // Galaxy state
  isGalaxyInitialized: boolean;
  lastRefreshAt?: Date;
  refreshInterval: number; // minutes

  // Performance
  visibleNodeCount: number;
  maxVisibleNodes: number;
  isLazyLoading: boolean;

  // Accessibility
  accessibilityMode: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface GalaxyStateExtended extends GalaxyState {
  // Derived data
  visibleNodes: KnowledgeNode[];
  visibleEdges: KnowledgeEdge[];
  selectedNodes: KnowledgeNode[];
  selectedEdges: KnowledgeEdge[];

  // Statistics
  statistics: GalaxyStatistics;

  // Graph algorithms
  adjacencyList: Map<string, string[]>;
  clusterAssignments: Map<string, string>;

  // User progress
  progress: UserProgress;
}

export interface GalaxyStatistics {
  totalNodes: number;
  totalEdges: number;
  totalClusters: number;
  totalPaths: number;
  masteredNodes: number;
  inProgressNodes: number;
  discoveredNodes: number;
  hiddenNodes: number;
  averageMastery: number;
  totalStudyTime: number;
}

export interface UserProgress {
  overallProgress: number;
  weeklyProgress: number;
  monthlyProgress: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyTime: number;
  masteredNodes: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress: number;
  target: number;
}

// Initial state factory
export function createInitialState(userId: string): GalaxyState {
  return {
    userId,
    nodes: [],
    edges: [],
    clusters: [],
    learningPaths: [],
    viewMode: "galaxy",
    zoomLevel: "overview",
    viewport: { x: 0, y: 0, zoom: 1 },
    isAnimating: false,
    selection: {
      selectedNodeIds: [],
      selectedEdgeIds: [],
      selectedClusterId: undefined,
      hoveredNodeId: undefined,
      hoveredEdgeId: undefined
    },
    filters: {
      nodeTypes: [],
      edgeTypes: [],
      subjects: [],
      masteryLevels: [],
      status: [],
      searchQuery: ""
    },
    isLoading: false,
    error: null,
    isDirty: false,
    isGalaxyInitialized: false,
    refreshInterval: 5,
    visibleNodeCount: 0,
    maxVisibleNodes: 500,
    isLazyLoading: false,
    accessibilityMode: false,
    highContrastMode: false,
    reducedMotion: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Selection actions
export function selectNode(state: GalaxyState, nodeId: string, multiSelect: boolean = false): GalaxyState {
  const currentSelection = state.selection.selectedNodeIds;

  let newSelection: string[];
  if (multiSelect) {
    if (currentSelection.includes(nodeId)) {
      newSelection = currentSelection.filter(id => id !== nodeId);
    } else {
      newSelection = [...currentSelection, nodeId];
    }
  } else {
    newSelection = [nodeId];
  }

  return {
    ...state,
    selection: {
      ...state.selection,
      selectedNodeIds: newSelection
    },
    updatedAt: new Date()
  };
}

export function selectEdge(state: GalaxyState, edgeId: string, multiSelect: boolean = false): GalaxyState {
  const currentSelection = state.selection.selectedEdgeIds;

  let newSelection: string[];
  if (multiSelect) {
    if (currentSelection.includes(edgeId)) {
      newSelection = currentSelection.filter(id => id !== edgeId);
    } else {
      newSelection = [...currentSelection, edgeId];
    }
  } else {
    newSelection = [edgeId];
  }

  return {
    ...state,
    selection: {
      ...state.selection,
      selectedEdgeIds: newSelection
    },
    updatedAt: new Date()
  };
}

export function selectCluster(state: GalaxyState, clusterId: string | undefined): GalaxyState {
  return {
    ...state,
    selection: {
      ...state.selection,
      selectedClusterId: clusterId
    },
    updatedAt: new Date()
  };
}

export function clearSelection(state: GalaxyState): GalaxyState {
  return {
    ...state,
    selection: {
      selectedNodeIds: [],
      selectedEdgeIds: [],
      selectedClusterId: undefined,
      hoveredNodeId: undefined,
      hoveredEdgeId: undefined
    },
    updatedAt: new Date()
  };
}

// Filter actions
export function updateFilters(state: GalaxyState, filters: Partial<FilterState>): GalaxyState {
  return {
    ...state,
    filters: {
      ...state.filters,
      ...filters
    },
    updatedAt: new Date()
  };
}

export function resetFilters(state: GalaxyState): GalaxyState {
  return {
    ...state,
    filters: {
      nodeTypes: [],
      edgeTypes: [],
      subjects: [],
      masteryLevels: [],
      status: [],
      searchQuery: ""
    },
    updatedAt: new Date()
  };
}

// View state actions
export function setViewMode(state: GalaxyState, mode: ViewMode): GalaxyState {
  return {
    ...state,
    viewMode: mode,
    zoomLevel: getZoomLevelForMode(mode),
    updatedAt: new Date()
  };
}

export function setZoomLevel(state: GalaxyState, level: ZoomLevel): GalaxyState {
  return {
    ...state,
    zoomLevel: level,
    updatedAt: new Date()
  };
}

export function updateViewport(state: GalaxyState, viewport: Partial<ViewportState>): GalaxyState {
  return {
    ...state,
    viewport: {
      ...state.viewport,
      ...viewport
    },
    updatedAt: new Date()
  };
}

export function getZoomLevelForMode(mode: ViewMode): ZoomLevel {
  switch (mode) {
    case "galaxy":
      return "overview";
    case "graph":
      return "cluster";
    case "tree":
      return "node";
    case "list":
      return "detail";
    default:
      return "overview";
  }
}

// Apply filters to nodes
export function applyNodeFilters(nodes: KnowledgeNode[], filters: FilterState): KnowledgeNode[] {
  return nodes.filter(node => {
    // Node type filter
    if (filters.nodeTypes.length > 0 && !filters.nodeTypes.includes(node.type)) {
      return false;
    }

    // Subject filter
    if (filters.subjects.length > 0 && !filters.subjects.includes(node.subject)) {
      return false;
    }

    // Mastery level filter
    if (filters.masteryLevels.length > 0) {
      const masteryLevel = getMasteryLevelFromScore(node.masteryScore);
      if (!filters.masteryLevels.includes(masteryLevel)) {
        return false;
      }
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(node.status)) {
      return false;
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = node.title.toLowerCase().includes(query);
      const matchesDescription = node.description.toLowerCase().includes(query);
      const matchesTags = node.tags.some(tag => tag.toLowerCase().includes(query));
      const matchesKeywords = node.keywords.some(keyword => keyword.toLowerCase().includes(query));

      if (!matchesTitle && !matchesDescription && !matchesTags && !matchesKeywords) {
        return false;
      }
    }

    return true;
  });
}

// Apply filters to edges
export function applyEdgeFilters(edges: KnowledgeEdge[], filters: FilterState): KnowledgeEdge[] {
  return edges.filter(edge => {
    // Edge type filter
    if (filters.edgeTypes.length > 0 && !filters.edgeTypes.includes(edge.type)) {
      return false;
    }

    return true;
  });
}

// Get mastery level from score
export function getMasteryLevelFromScore(score: number): string {
  if (score >= 80) return "expert";
  if (score >= 60) return "advanced";
  if (score >= 40) return "intermediate";
  if (score >= 20) return "beginner";
  return "none";
}

// Calculate statistics from state
export function calculateStatistics(state: GalaxyState): GalaxyStatistics {
  const nodes = state.nodes;
  const masteredNodes = nodes.filter(n => n.masteryScore >= 80).length;
  const inProgressNodes = nodes.filter(n => n.status === "in_progress").length;
  const discoveredNodes = nodes.filter(n => n.status !== "hidden").length;
  const hiddenNodes = nodes.filter(n => n.status === "hidden").length;
  const totalMastery = nodes.reduce((sum, n) => sum + n.masteryScore, 0);

  return {
    totalNodes: nodes.length,
    totalEdges: state.edges.length,
    totalClusters: state.clusters.length,
    totalPaths: state.learningPaths.length,
    masteredNodes,
    inProgressNodes,
    discoveredNodes,
    hiddenNodes,
    averageMastery: nodes.length > 0 ? Math.round(totalMastery / nodes.length) : 0,
    totalStudyTime: nodes.reduce((sum, n) => sum + (n.timesStudied * n.estimatedStudyTime), 0)
  };
}

// Check if state needs refresh
export function needsRefresh(state: GalaxyState): boolean {
  if (!state.lastRefreshAt) return true;

  const minutesSinceRefresh = (Date.now() - state.lastRefreshAt.getTime()) / (1000 * 60);
  return minutesSinceRefresh >= state.refreshInterval;
}

// Mark state as refreshed
export function markRefreshed(state: GalaxyState): GalaxyState {
  return {
    ...state,
    lastRefreshAt: new Date(),
    isDirty: false,
    updatedAt: new Date()
  };
}

// Mark state as dirty
export function markDirty(state: GalaxyState): GalaxyState {
  return {
    ...state,
    isDirty: true,
    updatedAt: new Date()
  };
}

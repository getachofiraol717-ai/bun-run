// @ts-nocheck
// Knowledge Galaxy — KnowledgeExplorer Interface
// Interface for exploring the knowledge galaxy

import type { KnowledgeNode, KnowledgeEdge } from "../models";

export interface ExplorerConfig {
  userId: string;
  autoInitialize?: boolean;
  defaultView?: "galaxy" | "graph" | "tree" | "list";
}

export interface ExplorerState {
  currentNode: KnowledgeNode | null;
  selectedNodes: KnowledgeNode[];
  hoveredNode: KnowledgeNode | null;
  viewport: { x: number; y: number; zoom: number };
  viewMode: "galaxy" | "graph" | "tree" | "list";
  filters: ExplorerFilters;
  searchQuery: string;
  history: string[];
  historyIndex: number;
}

export interface ExplorerFilters {
  nodeTypes: string[];
  subjects: string[];
  masteryLevels: string[];
  showMastered: boolean;
  showInProgress: boolean;
  showDiscovered: boolean;
}

export interface KnowledgeExplorerAPI {
  // Initialization
  initialize(config: ExplorerConfig): Promise<void>;
  destroy(): Promise<void>;

  // Navigation
  navigateToNode(nodeId: string, addToHistory?: boolean): Promise<void>;
  navigateBack(): Promise<void>;
  navigateForward(): Promise<void>;
  canNavigateBack(): boolean;
  canNavigateForward(): boolean;

  // Selection
  selectNode(nodeId: string, multiSelect?: boolean): void;
  clearSelection(): void;
  getSelectedNodes(): KnowledgeNode[];

  // Exploration
  getRelatedNodes(nodeId: string, depth?: number): Promise<KnowledgeNode[]>;
  getPathBetweenNodes(startId: string, endId: string): Promise<string[]>;
  exploreSubject(subject: string): Promise<void>;
  exploreTopic(topicId: string): Promise<void>;

  // Search
  search(query: string): Promise<KnowledgeNode[]>;
  searchByType(type: string): Promise<KnowledgeNode[]>;
  searchBySubject(subject: string): Promise<KnowledgeNode[]>;

  // Filtering
  setFilters(filters: Partial<ExplorerFilters>): void;
  clearFilters(): void;
  getFilters(): ExplorerFilters;

  // View modes
  setViewMode(mode: "galaxy" | "graph" | "tree" | "list"): void;
  getViewMode(): ExplorerState["viewMode"];

  // Recommendations
  getRecommendations(): Promise<KnowledgeNode[]>;
  getLearningSuggestions(nodeId: string): Promise<KnowledgeNode[]>;

  // Knowledge gaps
  getKnowledgeGaps(): Promise<KnowledgeNode[]>;
  getPrerequisiteChain(nodeId: string): Promise<KnowledgeNode[]>;

  // State
  getState(): ExplorerState;
  subscribe(listener: (state: ExplorerState) => void): () => void;
}

export interface ExplorationContext {
  startNode: KnowledgeNode;
  targetNodes: KnowledgeNode[];
  currentDepth: number;
  maxDepth: number;
  path: KnowledgeNode[];
  visited: Set<string>;
}

export type ExplorationStrategy =
  | "breadth_first"
  | "depth_first"
  | "dijkstra"
  | "prerequisite_first"
  | "mastery_first";

export interface ExplorationResult {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  path: string[];
  distance: number;
  strategy: ExplorationStrategy;
  timeMs: number;
}

export interface KnowledgeExplorerEvents {
  onNodeSelect: (node: KnowledgeNode) => void;
  onNodeHover: (node: KnowledgeNode | null) => void;
  onNavigation: (nodeId: string) => void;
  onViewModeChange: (mode: ExplorerState["viewMode"]) => void;
  onFilterChange: (filters: ExplorerFilters) => void;
}

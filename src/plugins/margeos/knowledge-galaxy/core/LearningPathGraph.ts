// @ts-nocheck
// Knowledge Galaxy — LearningPathGraph
// Generates and manages learning path visualizations

import type { LearningPath, PathNode, PathType, PathStatus } from "../models/LearningPath";
import {
  createLearningPath,
  createMasteryPath,
  updatePathProgress,
  unlockNextNodes,
  getNextAvailableNode,
  canContinuePath
} from "../models/LearningPath";
import type { KnowledgeNode, KnowledgeEdge } from "../models";

export interface LearningPathOptions {
  startNodeId?: string;
  endNodeId?: string;
  maxNodes?: number;
  preferredTypes?: string[];
  excludeMastered?: boolean;
}

export class LearningPathGraph {
  private static instance: LearningPathGraph;
  private initialized: boolean = false;
  private userId: string | null = null;

  // Path storage
  private paths: Map<string, LearningPath> = new Map();
  private nodePathIndex: Map<string, Set<string>> = new Map(); // nodeId -> pathIds

  private constructor() {}

  public static getInstance(): LearningPathGraph {
    if (!LearningPathGraph.instance) {
      LearningPathGraph.instance = new LearningPathGraph();
    }
    return LearningPathGraph.instance;
  }

  public async initialize(userId: string): Promise<void> {
    this.userId = userId;
    this.initialized = true;
    await this.loadPaths();
  }

  private async loadPaths(): Promise<void> {
    // Load from storage
  }

  private async savePath(path: LearningPath): Promise<void> {
    this.paths.set(path.id, path);
    // Persist to storage
  }

  // Generate learning path from nodes
  public generatePath(
    title: string,
    subject: string,
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    options?: LearningPathOptions
  ): LearningPath {
    const pathNodes = this.buildPathNodes(nodes, edges, options);

    const path = createLearningPath(title, "prerequisite", subject, pathNodes, {
      description: `Learning path for ${title}`
    });

    this.paths.set(path.id, path);
    this.indexPath(path);

    return path;
  }

  // Build path nodes from knowledge graph
  private buildPathNodes(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    options?: LearningPathOptions
  ): PathNode[] {
    const { maxNodes = 10, excludeMastered = true } = options || {};

    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    for (const edge of edges) {
      if (edge.type === "prerequisite" || edge.type === "part_of") {
        const existing = adjacency.get(edge.sourceNodeId) || [];
        existing.push(edge.targetNodeId);
        adjacency.set(edge.sourceNodeId, existing);
      }
    }

    // Find start nodes (no incoming prerequisite edges)
    const hasIncoming = new Set(edges.filter(e => e.type === "prerequisite").map(e => e.targetNodeId));
    const startNodes = nodes.filter(n => !hasIncoming.has(n.id));

    // BFS to build path
    const pathNodes: PathNode[] = [];
    const visited = new Set<string>();

    const queue: Array<{ nodeId: string; depth: number }> = startNodes.map(n => ({
      nodeId: n.id,
      depth: 0
    }));

    while (queue.length > 0 && pathNodes.length < maxNodes) {
      const { nodeId, depth } = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

      // Skip mastered if option set
      if (excludeMastered && node.masteryScore >= 80) continue;

      // Get prerequisites for this node
      const prereqEdges = edges.filter(
        e => e.targetNodeId === nodeId && e.type === "prerequisite"
      );
      const prerequisiteIds = prereqEdges.map(e => e.sourceNodeId);

      // Check if all prerequisites are in path or mastered
      const allPrereqsMet = prerequisiteIds.every(prereqId =>
        visited.has(prereqId) || nodes.find(n => n.id === prereqId)?.masteryScore >= 80
      );

      if (!allPrereqsMet && pathNodes.length > 0) continue;

      // Create path node
      const pathNode: PathNode = {
        nodeId: node.id,
        title: node.title,
        type: node.type,
        status: pathNodes.length === 0 ? "available" : "locked",
        isRequired: true,
        progress: node.masteryScore,
        attempts: 0,
        estimatedTime: node.estimatedStudyTime,
        prerequisiteNodeIds: prerequisiteIds
      };

      pathNodes.push(pathNode);

      // Add children to queue
      const children = adjacency.get(nodeId) || [];
      for (const childId of children) {
        if (!visited.has(childId)) {
          queue.push({ nodeId: childId, depth: depth + 1 });
        }
      }

      // Sort queue by depth
      queue.sort((a, b) => a.depth - b.depth);
    }

    return pathNodes;
  }

  // Generate mastery path
  public generateMasteryPath(
    title: string,
    subject: string,
    concepts: Array<{ id: string; title: string; difficulty: number }>
  ): LearningPath {
    const path = createMasteryPath(title, subject, concepts);
    this.paths.set(path.id, path);
    this.indexPath(path);
    return path;
  }

  // Get path by ID
  public getPath(pathId: string): LearningPath | undefined {
    return this.paths.get(pathId);
  }

  // Get all paths
  public getAllPaths(): LearningPath[] {
    return Array.from(this.paths.values());
  }

  // Get paths containing a node
  public getPathsForNode(nodeId: string): LearningPath[] {
    const pathIds = this.nodePathIndex.get(nodeId);
    if (!pathIds) return [];

    return Array.from(pathIds)
      .map(id => this.paths.get(id))
      .filter((p): p is LearningPath => p !== undefined);
  }

  // Update path node progress
  public async updateNodeProgress(
    pathId: string,
    nodeId: string,
    progress: number,
    score?: number
  ): Promise<void> {
    const path = this.paths.get(pathId);
    if (!path) return;

    const pathNode = path.nodes.find(n => n.nodeId === nodeId);
    if (!pathNode) return;

    pathNode.progress = Math.min(100, Math.max(0, progress));
    pathNode.attempts++;

    if (score !== undefined) {
      pathNode.bestScore = Math.max(pathNode.bestScore || 0, score);
    }

    if (progress >= 80 && pathNode.status !== "completed") {
      pathNode.status = "completed";
      pathNode.completedAt = new Date();
    }

    // Unlock next nodes
    const updatedPath = unlockNextNodes(path, nodeId);
    const withProgress = updatePathProgress(updatedPath);

    await this.savePath(withProgress);
  }

  // Get next node in path
  public getNextNode(pathId: string): PathNode | null {
    const path = this.paths.get(pathId);
    if (!path) return null;

    return getNextAvailableNode(path);
  }

  // Check if path can continue
  public canContinue(pathId: string): boolean {
    const path = this.paths.get(pathId);
    if (!path) return false;

    return canContinuePath(path);
  }

  // Start path
  public async startPath(pathId: string): Promise<void> {
    const path = this.paths.get(pathId);
    if (!path || path.status !== "not_started") return;

    path.status = "in_progress";
    path.startedAt = new Date();
    path.lastAccessedAt = new Date();

    if (path.nodes.length > 0) {
      path.nodes[0].status = "current";
      path.nodes[0].startedAt = new Date();
    }

    await this.savePath(path);
  }

  // Complete path
  public async completePath(pathId: string): Promise<void> {
    const path = this.paths.get(pathId);
    if (!path) return;

    path.status = "completed";
    path.progress = 100;
    path.completedAt = new Date();
    path.nodes.forEach(n => {
      n.status = "completed";
      if (!n.completedAt) {
        n.completedAt = new Date();
      }
    });

    await this.savePath(path);
  }

  // Get active paths
  public getActivePaths(): LearningPath[] {
    return Array.from(this.paths.values()).filter(
      p => p.status === "in_progress"
    );
  }

  // Get recommended paths
  public getRecommendedPaths(limit: number = 5): LearningPath[] {
    return Array.from(this.paths.values())
      .filter(p => p.status === "not_started" && p.isRecommended)
      .sort((a, b) => {
        // Sort by progress potential and relevance
        return (b.progress || 0) - (a.progress || 0);
      })
      .slice(0, limit);
  }

  // Get path statistics
  public getPathStatistics(): {
    totalPaths: number;
    activePaths: number;
    completedPaths: number;
    averageProgress: number;
    totalEstimatedTime: number;
  } {
    const paths = this.getAllPaths();
    const active = paths.filter(p => p.status === "in_progress");
    const completed = paths.filter(p => p.status === "completed");

    const totalProgress = paths.reduce((sum, p) => sum + (p.progress || 0), 0);
    const totalTime = paths.reduce((sum, p) => sum + p.estimatedTotalTime, 0);

    return {
      totalPaths: paths.length,
      activePaths: active.length,
      completedPaths: completed.length,
      averageProgress: paths.length > 0 ? Math.round(totalProgress / paths.length) : 0,
      totalEstimatedTime: totalTime
    };
  }

  // Generate visual path data
  public getVisualPathData(pathId: string): {
    nodes: Array<{ id: string; label: string; status: string; position: number }>;
    connections: Array<{ from: number; to: number }>;
  } {
    const path = this.paths.get(pathId);
    if (!path) {
      return { nodes: [], connections: [] };
    }

    const nodes = path.nodes.map((n, index) => ({
      id: n.nodeId,
      label: n.title,
      status: n.status,
      position: index
    }));

    const connections: Array<{ from: number; to: number }> = [];
    for (let i = 0; i < path.nodes.length - 1; i++) {
      connections.push({ from: i, to: i + 1 });
    }

    return { nodes, connections };
  }

  // Index path for quick lookup
  private indexPath(path: LearningPath): void {
    for (const node of path.nodes) {
      const existing = this.nodePathIndex.get(node.nodeId) || new Set();
      existing.add(path.id);
      this.nodePathIndex.set(node.nodeId, existing);
    }
  }

  // Suggest optimal path based on current state
  public suggestOptimalPath(
    targetSkillId: string,
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): LearningPath {
    // Find path using Dijkstra's algorithm
    const path = this.findOptimalPath(targetSkillId, nodes, edges);
    return path;
  }

  // Find optimal learning path
  private findOptimalPath(
    targetId: string,
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): LearningPath {
    // Build graph
    const graph = new Map<string, Set<string>>();
    for (const edge of edges) {
      if (edge.type === "prerequisite") {
        const existing = graph.get(edge.targetNodeId) || new Set();
        existing.add(edge.sourceNodeId);
        graph.set(edge.targetNodeId, existing);
      }
    }

    // Find all prerequisites using BFS
    const prerequisites = new Set<string>();
    const queue = [targetId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const prereqs = graph.get(current);

      if (prereqs) {
        for (const prereq of prereqs) {
          if (!prerequisites.has(prereq)) {
            prerequisites.add(prereq);
            queue.push(prereq);
          }
        }
      }
    }

    // Build path with prerequisites
    const pathNodes: PathNode[] = [];
    const allRequired = [...prerequisites, targetId];

    for (let i = 0; i < allRequired.length; i++) {
      const nodeId = allRequired[i];
      const node = nodes.find(n => n.id === nodeId);

      if (node) {
        const prereqs = graph.get(nodeId);
        pathNodes.push({
          nodeId: node.id,
          title: node.title,
          type: node.type,
          status: node.masteryScore >= 80 ? "completed" : i === 0 ? "available" : "locked",
          isRequired: true,
          progress: node.masteryScore,
          attempts: 0,
          estimatedTime: node.estimatedStudyTime,
          prerequisiteNodeIds: prereqs ? Array.from(prereqs) : []
        });
      }
    }

    const targetNode = nodes.find(n => n.id === targetId);
    return createLearningPath(
      `Path to ${targetNode?.title || "Goal"}`,
      "prerequisite",
      targetNode?.subject || "General",
      pathNodes
    );
  }
}

// Singleton export
export const learningPathGraph = LearningPathGraph.getInstance();

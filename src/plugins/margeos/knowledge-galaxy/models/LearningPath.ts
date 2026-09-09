// Knowledge Galaxy — LearningPath Model
// Represents learning paths through the knowledge graph

export type PathType =
  | "prerequisite"
  | "skill_tree"
  | "mastery"
  | "project_based"
  | "exam_prep"
  | "custom";

export type PathStatus = "not_started" | "in_progress" | "completed" | "paused";

export type NodeStatus = "locked" | "available" | "current" | "completed" | "skipped";

export interface PathNode {
  nodeId: string;
  title: string;
  type: string;
  status: NodeStatus;
  isRequired: boolean;

  // Progress
  progress: number; // 0-100
  attempts: number;
  bestScore?: number;

  // Timing
  estimatedTime: number; // minutes
  actualTime?: number;
  startedAt?: Date;
  completedAt?: Date;

  // Dependencies
  prerequisiteNodeIds: string[];

  // Alternative nodes (can skip if one is completed)
  alternativeNodeIds?: string[];

  // Learning materials
  resourceIds?: string[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  type: PathType;
  subject: string;

  // Nodes in order
  nodes: PathNode[];

  // Progress tracking
  status: PathStatus;
  currentNodeIndex: number;
  completedNodes: number;
  progress: number; // 0-100

  // Timing
  estimatedTotalTime: number;
  actualTotalTime?: number;
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt?: Date;

  // Goals
  goalId?: string;
  targetDate?: Date;

  // Accessibility
  ariaLabel: string;
  screenReaderDescription: string;

  // Source
  sourceEngine?: string;
  sourceId?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Additional
  tags: string[];
  isRecommended: boolean;
  recommendationReason?: string;
  customData?: Record<string, any>;
}

export interface LearningPathExtended extends LearningPath {
  // Extended properties
  currentNode?: PathNode;
  nextNodes: PathNode[];
  skippedNodes: PathNode[];
  prerequisitePaths: LearningPath[];

  // Statistics
  averageProgress?: number;
  estimatedCompletionDate?: Date;
  difficulty?: number;

  // User-specific
  userMotivation?: number;
}

// Path type configurations
export const PATH_TYPE_CONFIG: Record<PathType, {
  icon: string;
  color: string;
  defaultEstimatedMinutes: number;
  description: string;
}> = {
  prerequisite: {
    icon: "list-ordered",
    color: "#EF4444",
    defaultEstimatedMinutes: 120,
    description: "Prerequisite knowledge chain"
  },
  skill_tree: {
    icon: "git-branch",
    color: "#10B981",
    defaultEstimatedMinutes: 240,
    description: "Skill progression tree"
  },
  mastery: {
    icon: "target",
    color: "#8B5CF6",
    defaultEstimatedMinutes: 480,
    description: "Mastery path"
  },
  project_based: {
    icon: "folder-plus",
    color: "#F59E0B",
    defaultEstimatedMinutes: 600,
    description: "Project-based learning"
  },
  exam_prep: {
    icon: "clipboard-check",
    color: "#3B82F6",
    defaultEstimatedMinutes: 300,
    description: "Exam preparation"
  },
  custom: {
    icon: "edit",
    color: "#EC4899",
    defaultEstimatedMinutes: 180,
    description: "Custom learning path"
  }
};

// Status configurations
export const PATH_STATUS_CONFIG: Record<PathStatus, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  not_started: {
    label: "Not Started",
    color: "#6B7280",
    icon: "circle",
    description: "Path has not been started"
  },
  in_progress: {
    label: "In Progress",
    color: "#F59E0B",
    icon: "loader",
    description: "Currently working on this path"
  },
  completed: {
    label: "Completed",
    color: "#10B981",
    icon: "check-circle",
    description: "Path has been completed"
  },
  paused: {
    label: "Paused",
    color: "#9CA3AF",
    icon: "pause-circle",
    description: "Path is paused"
  }
};

// Factory functions
export function createLearningPath(
  title: string,
  type: PathType,
  subject: string,
  nodes: PathNode[],
  options?: Partial<LearningPath>
): LearningPath {
  const id = `path-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const config = PATH_TYPE_CONFIG[type];

  const totalTime = nodes.reduce((sum, n) => sum + n.estimatedTime, 0);

  return {
    id,
    title,
    description: "",
    type,
    subject,
    nodes,
    status: "not_started",
    currentNodeIndex: 0,
    completedNodes: 0,
    progress: 0,
    estimatedTotalTime: totalTime || config.defaultEstimatedMinutes,
    ariaLabel: `${type} learning path: ${title}`,
    screenReaderDescription: `${title}, ${nodes.length} steps`,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    isRecommended: false,
    ...options
  };
}

// Create path from goal
export function createPathFromGoal(
  goalId: string,
  title: string,
  subject: string,
  targetNodes: string[],
  options?: Partial<LearningPath>
): LearningPath {
  const nodes: PathNode[] = targetNodes.map((nodeId, index) => ({
    nodeId,
    title: "",
    type: "concept",
    status: index === 0 ? "available" : "locked",
    isRequired: true,
    progress: 0,
    attempts: 0,
    estimatedTime: 30,
    prerequisiteNodeIds: index > 0 ? [targetNodes[index - 1]] : []
  }));

  return createLearningPath(title, "custom", subject, nodes, {
    goalId,
    ...options
  });
}

// Create mastery path
export function createMasteryPath(
  title: string,
  subject: string,
  concepts: { id: string; title: string; difficulty: number }[],
  options?: Partial<LearningPath>
): LearningPath {
  const sortedConcepts = [...concepts].sort((a, b) => a.difficulty - b.difficulty);

  const nodes: PathNode[] = sortedConcepts.map((concept, index) => ({
    nodeId: concept.id,
    title: concept.title,
    type: "concept",
    status: index === 0 ? "available" : "locked",
    isRequired: true,
    progress: 0,
    attempts: 0,
    estimatedTime: 30 + concept.difficulty * 10,
    prerequisiteNodeIds: index > 0 ? [sortedConcepts[index - 1].id] : []
  }));

  return createLearningPath(title, "mastery", subject, nodes, {
    description: `Master ${title} from beginner to expert`,
    ...options
  });
}

// Update path progress
export function updatePathProgress(path: LearningPath): LearningPath {
  const completedNodes = path.nodes.filter(n => n.status === "completed").length;
  const progress = Math.round((completedNodes / path.nodes.length) * 100);

  // Find current node (first non-completed)
  const currentIndex = path.nodes.findIndex(n => n.status !== "completed");

  // Calculate actual time
  const actualTotalTime = path.nodes.reduce((sum, n) => sum + (n.actualTime || 0), 0);

  // Determine status
  let status: PathStatus = path.status;
  if (progress === 100) {
    status = "completed";
  } else if (progress > 0 && status === "not_started") {
    status = "in_progress";
  }

  return {
    ...path,
    completedNodes,
    progress,
    currentNodeIndex: currentIndex === -1 ? path.nodes.length - 1 : currentIndex,
    actualTotalTime,
    status,
    completedAt: progress === 100 ? new Date() : undefined,
    updatedAt: new Date()
  };
}

// Get next available node
export function getNextAvailableNode(path: LearningPath): PathNode | null {
  for (const node of path.nodes) {
    if (node.status === "available" || node.status === "current") {
      return node;
    }
  }
  return null;
}

// Check if path can continue
export function canContinuePath(path: LearningPath): boolean {
  if (path.status === "completed") return false;

  const nextNode = getNextAvailableNode(path);
  return nextNode !== null;
}

// Get estimated completion date
export function getEstimatedCompletionDate(
  path: LearningPath,
  dailyStudyMinutes: number = 60
): Date | null {
  if (path.status === "completed") return new Date();
  if (dailyStudyMinutes <= 0) return null;

  const remainingTime = path.estimatedTotalTime - (path.actualTotalTime || 0);
  const daysNeeded = Math.ceil(remainingTime / dailyStudyMinutes);

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysNeeded);

  return estimatedDate;
}

// Unlock next nodes
export function unlockNextNodes(path: LearningPath, completedNodeId: string): LearningPath {
  const completedIndex = path.nodes.findIndex(n => n.nodeId === completedNodeId);
  if (completedIndex === -1) return path;

  const updatedNodes = path.nodes.map((node, index) => {
    // If this node depends on the completed node
    if (node.prerequisiteNodeIds.includes(completedNodeId)) {
      // Check if all prerequisites are met
      const allPrereqsMet = node.prerequisiteNodeIds.every(prereqId => {
        const prereqNode = path.nodes.find(n => n.nodeId === prereqId);
        return prereqNode?.status === "completed";
      });

      if (allPrereqsMet && node.status === "locked") {
        return { ...node, status: "available" as NodeStatus };
      }
    }
    return node;
  });

  return {
    ...path,
    nodes: updatedNodes,
    updatedAt: new Date()
  };
}

// Validate learning path
export function validateLearningPath(path: Partial<LearningPath>): string[] {
  const errors: string[] = [];

  if (!path.title || path.title.trim().length === 0) {
    errors.push("Path title is required");
  }

  if (!path.type) {
    errors.push("Path type is required");
  }

  if (!path.subject || path.subject.trim().length === 0) {
    errors.push("Subject is required");
  }

  if (!path.nodes || path.nodes.length === 0) {
    errors.push("At least one node is required");
  }

  // Check for circular dependencies
  const nodeIds = new Set<string>();
  for (const node of path.nodes || []) {
    if (nodeIds.has(node.nodeId)) {
      errors.push(`Duplicate node ID: ${node.nodeId}`);
    }
    nodeIds.add(node.nodeId);
  }

  return errors;
}

// Calculate path difficulty
export function calculatePathDifficulty(path: LearningPath): number {
  if (path.nodes.length === 0) return 0;

  const totalDifficulty = path.nodes.reduce((sum, n) => sum + (n.estimatedTime / 30), 0);
  return Math.round(totalDifficulty / path.nodes.length);
}

// Filter paths by status
export function filterPathsByStatus(
  paths: LearningPath[],
  status: PathStatus
): LearningPath[] {
  return paths.filter(p => p.status === status);
}

// Sort paths by various criteria
export function sortPaths(
  paths: LearningPath[],
  criteria: "progress" | "time" | "recent" | "name"
): LearningPath[] {
  const sorted = [...paths];

  switch (criteria) {
    case "progress":
      return sorted.sort((a, b) => b.progress - a.progress);

    case "time":
      return sorted.sort((a, b) => a.estimatedTotalTime - b.estimatedTotalTime);

    case "recent":
      return sorted.sort((a, b) => {
        const aTime = a.lastAccessedAt?.getTime() || a.createdAt.getTime();
        const bTime = b.lastAccessedAt?.getTime() || b.createdAt.getTime();
        return bTime - aTime;
      });

    case "name":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));

    default:
      return sorted;
  }
}

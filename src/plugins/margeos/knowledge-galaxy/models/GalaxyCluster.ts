// Knowledge Galaxy — GalaxyCluster Model
// Represents clusters/galaxies of related knowledge nodes

export type ClusterType =
  | "subject"
  | "topic"
  | "skill_tree"
  | "chapter"
  | "domain"
  | "curriculum"
  | "custom";

export type ClusterStatus = "active" | "inactive" | "hidden" | "expanding";

export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface GalaxyCluster {
  id: string;
  name: string;
  type: ClusterType;
  description: string;

  // Node membership
  nodeIds: string[];
  primaryNodeId?: string; // Central/main node

  // Cluster hierarchy
  parentClusterId?: string;
  childClusterIds: string[];
  parentSubject?: string;

  // Visual properties
  position: Position;
  size: number; // Calculated based on content
  color: string;
  icon: string;
  opacity: number;

  // Status
  status: ClusterStatus;
  isExpanded: boolean;
  isHighlighted: boolean;

  // Statistics
  totalNodes: number;
  masteredNodes: number;
  inProgressNodes: number;
  averageMastery: number;

  // Accessibility
  ariaLabel: string;
  screenReaderDescription: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastExploredAt?: Date;

  // Source
  sourceEngine?: string;
  sourceId?: string;

  // Additional
  tags: string[];
  customData?: Record<string, any>;
}

export interface GalaxyClusterExtended extends GalaxyCluster {
  // Extended properties
  nodes?: any[];
  childClusters?: GalaxyClusterExtended[];
  parentCluster?: GalaxyClusterExtended;

  // Graph properties
  density?: number;
  centrality?: number;

  // User-specific
  userProgress?: number;
  userMastery?: number;
}

// Cluster configurations
export const CLUSTER_TYPE_CONFIG: Record<ClusterType, {
  icon: string;
  defaultColor: string;
  defaultSize: number;
  description: string;
}> = {
  subject: {
    icon: "globe",
    defaultColor: "#6366F1",
    defaultSize: 200,
    description: "Subject area cluster"
  },
  topic: {
    icon: "folder",
    defaultColor: "#8B5CF6",
    defaultSize: 150,
    description: "Topic cluster"
  },
  skill_tree: {
    icon: "git-branch",
    defaultColor: "#10B981",
    defaultSize: 180,
    description: "Skill progression tree"
  },
  chapter: {
    icon: "book-open",
    defaultColor: "#3B82F6",
    defaultSize: 160,
    description: "Chapter cluster"
  },
  domain: {
    icon: "grid",
    defaultColor: "#EC4899",
    defaultSize: 170,
    description: "Knowledge domain cluster"
  },
  curriculum: {
    icon: "clipboard",
    defaultColor: "#F59E0B",
    defaultSize: 220,
    description: "Curriculum cluster"
  },
  custom: {
    icon: "star",
    defaultColor: "#14B8A6",
    defaultSize: 140,
    description: "Custom cluster"
  }
};

// Factory functions
export function createGalaxyCluster(
  name: string,
  type: ClusterType,
  options?: Partial<GalaxyCluster>
): GalaxyCluster {
  const id = `cluster-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const config = CLUSTER_TYPE_CONFIG[type];

  return {
    id,
    name,
    type,
    description: "",
    nodeIds: [],
    childClusterIds: [],
    position: { x: 0, y: 0 },
    size: config.defaultSize,
    color: config.defaultColor,
    icon: config.icon,
    opacity: 1,
    status: "active",
    isExpanded: true,
    isHighlighted: false,
    totalNodes: 0,
    masteredNodes: 0,
    inProgressNodes: 0,
    averageMastery: 0,
    ariaLabel: `${type} cluster: ${name}`,
    screenReaderDescription: `${name} ${config.description}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    ...options
  };
}

// Create subject cluster
export function createSubjectCluster(
  subjectName: string,
  subjectId?: string,
  options?: Partial<GalaxyCluster>
): GalaxyCluster {
  return createGalaxyCluster(subjectName, "subject", {
    primaryNodeId: subjectId,
    sourceEngine: "pdf",
    sourceId: subjectId,
    ...options
  });
}

// Create skill tree cluster
export function createSkillTreeCluster(
  name: string,
  options?: Partial<GalaxyCluster>
): GalaxyCluster {
  return createGalaxyCluster(name, "skill_tree", {
    description: `Skill tree for ${name}`,
    sourceEngine: "tutor",
    ...options
  });
}

// Cluster validation
export function validateGalaxyCluster(cluster: Partial<GalaxyCluster>): string[] {
  const errors: string[] = [];

  if (!cluster.name || cluster.name.trim().length === 0) {
    errors.push("Cluster name is required");
  }

  if (!cluster.type) {
    errors.push("Cluster type is required");
  }

  if (cluster.size !== undefined && cluster.size < 0) {
    errors.push("Size cannot be negative");
  }

  if (cluster.opacity !== undefined && (cluster.opacity < 0 || cluster.opacity > 1)) {
    errors.push("Opacity must be between 0 and 1");
  }

  return errors;
}

// Calculate cluster statistics
export function calculateClusterStats(cluster: GalaxyCluster, nodes: any[]): GalaxyCluster {
  const clusterNodes = nodes.filter(n => cluster.nodeIds.includes(n.id));

  const mastered = clusterNodes.filter(n => n.masteryScore >= 80).length;
  const inProgress = clusterNodes.filter(n => n.status === "in_progress").length;
  const totalMastery = clusterNodes.reduce((sum, n) => sum + (n.masteryScore || 0), 0);

  return {
    ...cluster,
    totalNodes: clusterNodes.length,
    masteredNodes: mastered,
    inProgressNodes: inProgress,
    averageMastery: clusterNodes.length > 0 ? Math.round(totalMastery / clusterNodes.length) : 0
  };
}

// Get cluster progress
export function getClusterProgress(cluster: GalaxyCluster): number {
  if (cluster.totalNodes === 0) return 0;
  return Math.round((cluster.masteredNodes / cluster.totalNodes) * 100);
}

// Check if cluster is complete
export function isClusterComplete(cluster: GalaxyCluster): boolean {
  return cluster.totalNodes > 0 && cluster.masteredNodes === cluster.totalNodes;
}

// Get cluster color based on progress
export function getClusterProgressColor(cluster: GalaxyCluster): string {
  const progress = getClusterProgress(cluster);

  if (progress >= 80) return "#10B981"; // Green - mastered
  if (progress >= 50) return "#3B82F6"; // Blue - in progress
  if (progress >= 20) return "#F59E0B"; // Orange - started
  return "#6B7280"; // Gray - not started
}

// Merge clusters
export function mergeClusters(
  clusters: GalaxyCluster[],
  keepIds: string[]
): GalaxyCluster {
  const toMerge = clusters.filter(c => keepIds.includes(c.id));
  const primary = toMerge[0];

  if (toMerge.length === 1) return primary;

  const allNodeIds = toMerge.reduce((ids, c) => [...ids, ...c.nodeIds], []);
  const allChildIds = toMerge.reduce((ids, c) => [...ids, ...c.id], []);

  return {
    ...primary,
    id: `cluster-merged-${Date.now()}`,
    nodeIds: [...new Set(allNodeIds)],
    childClusterIds: allChildIds.filter(id => !keepIds.includes(id)),
    totalNodes: allNodeIds.length,
    updatedAt: new Date()
  };
}

// Filter clusters by status
export function filterClustersByStatus(
  clusters: GalaxyCluster[],
  status: ClusterStatus
): GalaxyCluster[] {
  return clusters.filter(c => c.status === status);
}

// Sort clusters by various criteria
export function sortClusters(
  clusters: GalaxyCluster[],
  criteria: "name" | "progress" | "size" | "recent"
): GalaxyCluster[] {
  const sorted = [...clusters];

  switch (criteria) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case "progress":
      return sorted.sort((a, b) => getClusterProgress(b) - getClusterProgress(a));

    case "size":
      return sorted.sort((a, b) => b.totalNodes - a.totalNodes);

    case "recent":
      return sorted.sort((a, b) => {
        const aTime = a.lastExploredAt?.getTime() || a.createdAt.getTime();
        const bTime = b.lastExploredAt?.getTime() || b.createdAt.getTime();
        return bTime - aTime;
      });

    default:
      return sorted;
  }
}

// Get root clusters (no parent)
export function getRootClusters(clusters: GalaxyCluster[]): GalaxyCluster[] {
  return clusters.filter(c => !c.parentClusterId);
}

// Get child clusters
export function getChildClusters(
  clusters: GalaxyCluster[],
  parentId: string
): GalaxyCluster[] {
  return clusters.filter(c => c.parentClusterId === parentId);
}

// Get cluster hierarchy
export function getClusterHierarchy(
  clusters: GalaxyCluster[],
  rootId?: string
): GalaxyClusterExtended[] {
  const buildHierarchy = (parentId?: string): GalaxyClusterExtended[] => {
    return clusters
      .filter(c => c.parentClusterId === parentId)
      .map(c => ({
        ...c,
        childClusters: buildHierarchy(c.id) as GalaxyClusterExtended[]
      }));
  };

  return buildHierarchy(rootId);
}

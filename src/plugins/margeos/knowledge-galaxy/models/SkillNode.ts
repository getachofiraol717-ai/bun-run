// @ts-nocheck
// Knowledge Galaxy — SkillNode Model
// Represents skills within the knowledge graph

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert" | "master";

export type SkillCategory =
  | "technical"
  | "cognitive"
  | "analytical"
  | "creative"
  | "practical"
  | "communication";

export type SkillStatus = "locked" | "available" | "in_progress" | "practicing" | "mastered";

export interface SkillPrerequisite {
  skillId: string;
  requiredLevel: SkillLevel;
  masteryRequired: number; // 0-100
}

export interface SkillConnection {
  targetSkillId: string;
  edgeType: "leads_to" | "related_to" | "alternative" | "builds_on";
  weight: number;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;

  // Classification
  category: SkillCategory;
  subject: string;
  topic?: string;

  // Level progression
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
  masteryScore: number; // 0-100

  // Prerequisites
  prerequisites: SkillPrerequisite[];
  unlocksSkillIds: string[];

  // Connections
  connectedSkillIds: SkillConnection[];

  // Practice data
  practiceCount: number;
  averagePracticeScore: number;
  lastPracticedAt?: Date;

  // Learning path
  learningPathId?: string;
  positionInPath: number;

  // Assessment
  assessmentScore?: number;
  lastAssessedAt?: Date;

  // Source
  sourceNodeId?: string; // Linked knowledge node
  sourceEngine?: string;

  // Timestamps
  unlockedAt?: Date;
  masteredAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Additional
  tags: string[];
  customData?: Record<string, any>;
}

export interface SkillNodeExtended extends SkillNode {
  // Extended properties
  prerequisitesMet: boolean;
  canPractice: boolean;
  nextLevelProgress: number;
  timeToMastery: number; // estimated minutes
  relatedKnowledgeNodes?: any[];

  // Graph properties
  centrality?: number;
  difficulty?: number;
  importance?: number;
}

// Skill level configurations
export const SKILL_LEVEL_CONFIG: Record<SkillLevel, {
  label: string;
  color: string;
  minScore: number;
  maxScore: number;
  description: string;
  icon: string;
}> = {
  beginner: {
    label: "Beginner",
    color: "#6B7280",
    minScore: 0,
    maxScore: 25,
    description: "Just started learning",
    icon: "star"
  },
  intermediate: {
    label: "Intermediate",
    color: "#3B82F6",
    minScore: 25,
    maxScore: 50,
    description: "Basic understanding",
    icon: "star"
  },
  intermediate: {
    label: "Intermediate",
    color: "#3B82F6",
    minScore: 25,
    maxScore: 50,
    description: "Can apply with guidance",
    icon: "star"
  },
  advanced: {
    label: "Advanced",
    color: "#8B5CF6",
    minScore: 50,
    maxScore: 75,
    description: "Proficient and confident",
    icon: "star"
  },
  expert: {
    label: "Expert",
    color: "#10B981",
    minScore: 75,
    maxScore: 95,
    description: "Deep understanding",
    icon: "star"
  },
  master: {
    label: "Master",
    color: "#F59E0B",
    minScore: 95,
    maxScore: 100,
    description: "Full mastery",
    icon: "award"
  }
};

// Skill category configurations
export const SKILL_CATEGORY_CONFIG: Record<SkillCategory, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  technical: {
    label: "Technical",
    color: "#6366F1",
    icon: "code",
    description: "Technical and programming skills"
  },
  cognitive: {
    label: "Cognitive",
    color: "#8B5CF6",
    icon: "brain",
    description: "Thinking and reasoning skills"
  },
  analytical: {
    label: "Analytical",
    color: "#3B82F6",
    icon: "bar-chart",
    description: "Analysis and data skills"
  },
  creative: {
    label: "Creative",
    color: "#EC4899",
    icon: "palette",
    description: "Creative and design skills"
  },
  practical: {
    label: "Practical",
    color: "#10B981",
    icon: "tool",
    description: "Practical application skills"
  },
  communication: {
    label: "Communication",
    color: "#F59E0B",
    icon: "message-circle",
    description: "Communication skills"
  }
};

// Status configurations
export const SKILL_STATUS_CONFIG: Record<SkillStatus, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  locked: {
    label: "Locked",
    color: "#374151",
    icon: "lock",
    description: "Prerequisites not met"
  },
  available: {
    label: "Available",
    color: "#10B981",
    icon: "unlock",
    description: "Ready to learn"
  },
  in_progress: {
    label: "In Progress",
    color: "#F59E0B",
    icon: "loader",
    description: "Currently learning"
  },
  practicing: {
    label: "Practicing",
    color: "#3B82F6",
    icon: "repeat",
    description: "Reinforcing through practice"
  },
  mastered: {
    label: "Mastered",
    color: "#8B5CF6",
    icon: "check-circle",
    description: "Fully mastered"
  }
};

// Factory functions
export function createSkillNode(
  name: string,
  category: SkillCategory,
  subject: string,
  options?: Partial<SkillNode>
): SkillNode {
  const id = `skill-${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    name,
    description: "",
    category,
    subject,
    currentLevel: "beginner",
    targetLevel: "expert",
    masteryScore: 0,
    prerequisites: [],
    unlocksSkillIds: [],
    connectedSkillIds: [],
    practiceCount: 0,
    averagePracticeScore: 0,
    positionInPath: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    ...options
  };
}

// Create skill from knowledge node
export function createSkillFromNode(
  node: any,
  options?: Partial<SkillNode>
): SkillNode {
  return createSkillNode(node.title, "technical", node.subject, {
    sourceNodeId: node.id,
    description: node.description,
    topic: node.topic,
    ...options
  });
}

// Get skill status
export function getSkillStatus(skill: SkillNode): SkillStatus {
  if (skill.masteryScore >= 95) return "mastered";
  if (skill.prerequisites.some(p => p.masteryRequired > 80)) return "locked";
  if (skill.practiceCount > 0 && skill.masteryScore < 80) return "practicing";
  if (skill.unlockedAt && skill.masteryScore > 0) return "in_progress";
  return "available";
}

// Check if prerequisites are met
export function arePrerequisitesMet(
  skill: SkillNode,
  userSkillLevels: Map<string, number>
): boolean {
  return skill.prerequisites.every(prereq => {
    const userLevel = userSkillLevels.get(prereq.skillId) || 0;
    return userLevel >= prereq.masteryRequired;
  });
}

// Calculate time to mastery
export function calculateTimeToMastery(skill: SkillNode): number {
  const scoreRemaining = 100 - skill.masteryScore;
  const avgScorePerPractice = skill.practiceCount > 0
    ? skill.masteryScore / skill.practiceCount
    : 5;

  if (avgScorePerPractice <= 0) return 0;

  const practicesNeeded = Math.ceil(scoreRemaining / avgScorePerPractice);
  const minutesPerPractice = 15; // Average practice time

  return practicesNeeded * minutesPerPractice;
}

// Get next level progress
export function getNextLevelProgress(skill: SkillNode): number {
  const currentConfig = SKILL_LEVEL_CONFIG[skill.currentLevel];
  const nextLevel = getNextLevel(skill.currentLevel);

  if (!nextLevel) return 100;

  const nextConfig = SKILL_LEVEL_CONFIG[nextLevel];
  const levelRange = currentConfig.maxScore - currentConfig.minScore;
  const scoreInLevel = skill.masteryScore - currentConfig.minScore;

  return Math.round((scoreInLevel / levelRange) * 100);
}

// Get next skill level
export function getNextLevel(current: SkillLevel): SkillLevel | null {
  const levels: SkillLevel[] = ["beginner", "intermediate", "advanced", "expert", "master"];
  const currentIndex = levels.indexOf(current);

  if (currentIndex === -1 || currentIndex === levels.length - 1) return null;

  return levels[currentIndex + 1];
}

// Skill validation
export function validateSkillNode(skill: Partial<SkillNode>): string[] {
  const errors: string[] = [];

  if (!skill.name || skill.name.trim().length === 0) {
    errors.push("Skill name is required");
  }

  if (!skill.category) {
    errors.push("Skill category is required");
  }

  if (!skill.subject || skill.subject.trim().length === 0) {
    errors.push("Subject is required");
  }

  if (skill.masteryScore !== undefined && (skill.masteryScore < 0 || skill.masteryScore > 100)) {
    errors.push("Mastery score must be between 0 and 100");
  }

  return errors;
}

// Calculate skill centrality (simplified PageRank-like algorithm)
export function calculateSkillCentrality(
  skill: SkillNode,
  allSkills: SkillNode[]
): number {
  let centrality = 0;

  // Count connections
  centrality += skill.connectedSkillIds.length * 2;

  // Count prerequisites
  centrality += skill.prerequisites.length * 3;

  // Count unlocks
  centrality += skill.unlocksSkillIds.length * 3;

  // Count as entry point if no prerequisites
  if (skill.prerequisites.length === 0) {
    centrality += 5;
  }

  // Normalize by total skills
  return centrality / (allSkills.length + 1);
}

// Sort skills by progression
export function sortSkillsByProgression(skills: SkillNode[]): SkillNode[] {
  return [...skills].sort((a, b) => {
    // By level first
    const levelOrder: Record<SkillLevel, number> = {
      beginner: 0,
      intermediate: 1,
      advanced: 2,
      expert: 3,
      master: 4
    };

    if (levelOrder[a.currentLevel] !== levelOrder[b.currentLevel]) {
      return levelOrder[b.currentLevel] - levelOrder[a.currentLevel];
    }

    // Then by mastery score
    return b.masteryScore - a.masteryScore;
  });
}

// Get skill path (sequence of skills to learn)
export function getSkillPath(
  targetSkillId: string,
  allSkills: SkillNode[],
  userSkillLevels: Map<string, number>
): SkillNode[] {
  const path: SkillNode[] = [];
  const visited = new Set<string>();

  const findPath = (skillId: string) => {
    if (visited.has(skillId)) return;
    visited.add(skillId);

    const skill = allSkills.find(s => s.id === skillId);
    if (!skill) return;

    // Add prerequisites first
    for (const prereq of skill.prerequisites) {
      findPath(prereq.skillId);
    }

    // Add this skill if not mastered
    const userLevel = userSkillLevels.get(skillId) || 0;
    if (userLevel < 80) {
      path.push(skill);
    }
  };

  findPath(targetSkillId);
  return path;
}

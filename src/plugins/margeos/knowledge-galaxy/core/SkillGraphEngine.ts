// @ts-nocheck
// Knowledge Galaxy — SkillGraphEngine
// Manages skill networks and skill progression

import type { SkillNode, SkillCategory, SkillLevel, SkillStatus } from "../models/SkillNode";
import { createSkillNode, getSkillStatus, SKILL_CATEGORY_CONFIG } from "../models/SkillNode";
import type { KnowledgeNode } from "../models/KnowledgeNode";

export interface SkillConnection {
  skillId: string;
  type: "prerequisite" | "builds_on" | "related_to" | "leads_to";
  strength: number;
}

export interface SkillGraph {
  id: string;
  name: string;
  skills: SkillNode[];
  connections: SkillConnection[];
  categories: SkillCategory[];
  totalProgress: number;
  masteredSkills: number;
  inProgressSkills: number;
}

export class SkillGraphEngine {
  private static instance: SkillGraphEngine;
  private initialized: boolean = false;
  private userId: string | null = null;

  // Skill storage
  private skills: Map<string, SkillNode> = new Map();
  private skillConnections: Map<string, SkillConnection[]> = new Map();
  private knowledgeToSkillMap: Map<string, string> = new Map();
  private skillProgress: Map<string, number> = new Map();

  // Category tracking
  private categories: Set<SkillCategory> = new Set();

  private constructor() {}

  public static getInstance(): SkillGraphEngine {
    if (!SkillGraphEngine.instance) {
      SkillGraphEngine.instance = new SkillGraphEngine();
    }
    return SkillGraphEngine.instance;
  }

  public async initialize(userId: string): Promise<void> {
    this.userId = userId;
    this.initialized = true;

    // Load existing skill data from storage
    await this.loadSkillData();
  }

  private async loadSkillData(): Promise<void> {
    // In production, load from storage
    // For now, initialize empty
  }

  // Create skill from knowledge node
  public createSkillFromNode(node: KnowledgeNode): SkillNode {
    const category = this.inferSkillCategory(node);
    const skill = createSkillNode(node.title, category, node.subject, {
      sourceNodeId: node.id,
      description: node.description,
      topic: node.topic,
      masteryScore: node.masteryScore
    });

    this.skills.set(skill.id, skill);
    this.knowledgeToSkillMap.set(node.id, skill.id);
    this.categories.add(category);

    return skill;
  }

  // Infer skill category from node
  private inferSkillCategory(node: KnowledgeNode): SkillCategory {
    const title = node.title.toLowerCase();
    const description = node.description.toLowerCase();
    const text = `${title} ${description}`;

    if (text.includes("code") || text.includes("program") || text.includes("function") ||
        text.includes("algorithm") || text.includes("database") || text.includes("api")) {
      return "technical";
    }

    if (text.includes("analyze") || text.includes("calculate") || text.includes("measure") ||
        text.includes("statistics") || text.includes("data")) {
      return "analytical";
    }

    if (text.includes("think") || text.includes("reason") || text.includes("problem") ||
        text.includes("solve") || text.includes("decide")) {
      return "cognitive";
    }

    if (text.includes("design") || text.includes("create") || text.includes("art") ||
        text.includes("creative") || text.includes("imagine")) {
      return "creative";
    }

    if (text.includes("apply") || text.includes("use") || text.includes("implement") ||
        text.includes("practice") || text.includes("do")) {
      return "practical";
    }

    if (text.includes("explain") || text.includes("present") || text.includes("communicate") ||
        text.includes("write") || text.includes("speak")) {
      return "communication";
    }

    return "cognitive";
  }

  // Get or create skill for knowledge node
  public getOrCreateSkill(node: KnowledgeNode): SkillNode {
    const existingSkillId = this.knowledgeToSkillMap.get(node.id);
    if (existingSkillId) {
      const skill = this.skills.get(existingSkillId);
      if (skill) return skill;
    }

    return this.createSkillFromNode(node);
  }

  // Get skill by ID
  public getSkill(skillId: string): SkillNode | undefined {
    return this.skills.get(skillId);
  }

  // Get all skills
  public getAllSkills(): SkillNode[] {
    return Array.from(this.skills.values());
  }

  // Get skills by category
  public getSkillsByCategory(category: SkillCategory): SkillNode[] {
    return Array.from(this.skills.values()).filter(s => s.category === category);
  }

  // Get skills by subject
  public getSkillsBySubject(subject: string): SkillNode[] {
    return Array.from(this.skills.values()).filter(s => s.subject === subject);
  }

  // Update skill progress
  public async updateSkillProgress(skillId: string, progress: number): Promise<void> {
    const skill = this.skills.get(skillId);
    if (!skill) return;

    const oldScore = skill.masteryScore;
    skill.masteryScore = Math.min(100, Math.max(0, progress));
    skill.practiceCount++;
    skill.lastPracticedAt = new Date();

    // Update level based on score
    skill.currentLevel = this.getLevelFromScore(skill.masteryScore);

    // Check if mastered
    if (skill.masteryScore >= 80 && oldScore < 80) {
      skill.masteredAt = new Date();
    }

    // Save progress
    this.skillProgress.set(skillId, skill.masteryScore);
    await this.saveSkillProgress(skillId, skill.masteryScore);
  }

  // Get level from mastery score
  private getLevelFromScore(score: number): SkillLevel {
    if (score >= 95) return "master";
    if (score >= 75) return "expert";
    if (score >= 50) return "advanced";
    if (score >= 25) return "intermediate";
    return "beginner";
  }

  // Add prerequisite relationship
  public addPrerequisite(skillId: string, prerequisiteId: string, masteryRequired: number = 50): void {
    const skill = this.skills.get(skillId);
    if (!skill) return;

    const existing = skill.prerequisites.find(p => p.skillId === prerequisiteId);
    if (!existing) {
      skill.prerequisites.push({
        skillId: prerequisiteId,
        requiredLevel: this.getLevelFromScore(masteryRequired),
        masteryRequired
      });
    }

    // Update connections
    this.addConnection(skillId, prerequisiteId, "prerequisite");
  }

  // Add skill connection
  public addConnection(
    skillId: string,
    connectedSkillId: string,
    type: SkillConnection["type"],
    strength: number = 0.5
  ): void {
    const connections = this.skillConnections.get(skillId) || [];
    const existing = connections.find(c => c.skillId === connectedSkillId);

    if (!existing) {
      connections.push({ skillId: connectedSkillId, type, strength });
      this.skillConnections.set(skillId, connections);
    }
  }

  // Get skill connections
  public getSkillConnections(skillId: string): SkillConnection[] {
    return this.skillConnections.get(skillId) || [];
  }

  // Check if skill is available (prerequisites met)
  public isSkillAvailable(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    for (const prereq of skill.prerequisites) {
      const prereqSkill = this.skills.get(prereq.skillId);
      if (!prereqSkill || prereqSkill.masteryScore < prereq.masteryRequired) {
        return false;
      }
    }

    return true;
  }

  // Get skill status
  public getSkillStatus(skillId: string): SkillStatus {
    const skill = this.skills.get(skillId);
    if (!skill) return "locked";

    return getSkillStatus(skill);
  }

  // Get skill path (learning sequence)
  public getSkillPath(targetSkillId: string): SkillNode[] {
    const path: SkillNode[] = [];
    const visited = new Set<string>();

    const buildPath = (skillId: string) => {
      if (visited.has(skillId)) return;
      visited.add(skillId);

      const skill = this.skills.get(skillId);
      if (!skill) return;

      // Add prerequisites first
      for (const prereq of skill.prerequisites) {
        buildPath(prereq.skillId);
      }

      // Add this skill if not mastered
      if (skill.masteryScore < 80) {
        path.push(skill);
      }
    };

    buildPath(targetSkillId);
    return path;
  }

  // Get next recommended skills
  public getNextSkills(limit: number = 5): SkillNode[] {
    const available: SkillNode[] = [];

    for (const skill of this.skills.values()) {
      if (this.isSkillAvailable(skill.id) && skill.masteryScore < 80) {
        available.push(skill);
      }
    }

    // Sort by progress potential and importance
    return available
      .sort((a, b) => {
        // Prefer skills with prerequisites that are near mastery
        const aPrereqProgress = this.getPrerequisiteProgress(a);
        const bPrereqProgress = this.getPrerequisiteProgress(b);

        if (aPrereqProgress !== bPrereqProgress) {
          return bPrereqProgress - aPrereqProgress;
        }

        // Then by importance
        return (b.practiceCount || 0) - (a.practiceCount || 0);
      })
      .slice(0, limit);
  }

  // Get prerequisite progress for a skill
  private getPrerequisiteProgress(skill: SkillNode): number {
    if (skill.prerequisites.length === 0) return 100;

    const totalProgress = skill.prerequisites.reduce((sum, prereq) => {
      const prereqSkill = this.skills.get(prereq.skillId);
      return sum + (prereqSkill?.masteryScore || 0);
    }, 0);

    return totalProgress / skill.prerequisites.length;
  }

  // Get skill graph for a category or all
  public async getSkillGraph(category?: SkillCategory): Promise<SkillGraph> {
    const skills = category
      ? this.getSkillsByCategory(category)
      : this.getAllSkills();

    const allConnections: SkillConnection[] = [];
    for (const skill of skills) {
      allConnections.push(...this.getSkillConnections(skill.id));
    }

    const mastered = skills.filter(s => s.masteryScore >= 80).length;
    const inProgress = skills.filter(s => s.status === "in_progress" || s.practiceCount > 0).length;

    const totalProgress = skills.length > 0
      ? Math.round(skills.reduce((sum, s) => sum + s.masteryScore, 0) / skills.length)
      : 0;

    return {
      id: `skill-graph-${category || "all"}`,
      name: category ? `${category} Skills` : "All Skills",
      skills,
      connections: allConnections,
      categories: Array.from(this.categories),
      totalProgress,
      masteredSkills: mastered,
      inProgressSkills: inProgress
    };
  }

  // Generate skill recommendations
  public getSkillRecommendations(subject?: string): SkillNode[] {
    let skills = this.getAllSkills();

    if (subject) {
      skills = skills.filter(s => s.subject === subject);
    }

    // Filter available skills that aren't mastered
    const available = skills.filter(s =>
      this.isSkillAvailable(s.id) && s.masteryScore < 80
    );

    // Sort by learning value
    return available.sort((a, b) => {
      // Higher priority to skills with more dependents
      const aDependents = this.getDependentSkills(a.id).length;
      const bDependents = this.getDependentSkills(b.id).length;

      if (aDependents !== bDependents) {
        return bDependents - aDependents;
      }

      // Then by progress gap
      const aGap = 80 - a.masteryScore;
      const bGap = 80 - b.masteryScore;

      return bGap - aGap;
    });
  }

  // Get skills that depend on this skill
  public getDependentSkills(skillId: string): SkillNode[] {
    return Array.from(this.skills.values()).filter(skill =>
      skill.prerequisites.some(p => p.skillId === skillId)
    );
  }

  // Calculate skill tree statistics
  public getSkillStatistics(): {
    totalSkills: number;
    byCategory: Record<SkillCategory, number>;
    byLevel: Record<SkillLevel, number>;
    averageProgress: number;
    totalPracticeSessions: number;
  } {
    const skills = this.getAllSkills();

    const byCategory: Record<SkillCategory, number> = {
      technical: 0,
      cognitive: 0,
      analytical: 0,
      creative: 0,
      practical: 0,
      communication: 0
    };

    const byLevel: Record<SkillLevel, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0,
      master: 0
    };

    let totalProgress = 0;
    let totalPractice = 0;

    for (const skill of skills) {
      byCategory[skill.category]++;
      byLevel[skill.currentLevel]++;
      totalProgress += skill.masteryScore;
      totalPractice += skill.practiceCount;
    }

    return {
      totalSkills: skills.length,
      byCategory,
      byLevel,
      averageProgress: skills.length > 0 ? Math.round(totalProgress / skills.length) : 0,
      totalPracticeSessions: totalPractice
    };
  }

  // Save skill progress
  private async saveSkillProgress(skillId: string, progress: number): Promise<void> {
    // In production, save to storage
    // localStorage.setItem(`skill-progress-${skillId}`, progress.toString());
  }

  // Export skill graph
  public exportSkillGraph(): any {
    return {
      skills: Array.from(this.skills.values()),
      connections: Array.from(this.skillConnections.entries()).map(([id, conns]) => ({
        skillId: id,
        connections: conns
      })),
      progress: Array.from(this.skillProgress.entries())
    };
  }

  // Import skill graph
  public async importSkillGraph(data: any): Promise<void> {
    if (data.skills) {
      for (const skill of data.skills) {
        this.skills.set(skill.id, skill);
        this.categories.add(skill.category);
      }
    }

    if (data.connections) {
      for (const { skillId, connections } of data.connections) {
        this.skillConnections.set(skillId, connections);
      }
    }

    if (data.progress) {
      for (const [skillId, progress] of data.progress) {
        this.skillProgress.set(skillId, progress as number);
      }
    }
  }
}

// Singleton export
export const skillGraphEngine = SkillGraphEngine.getInstance();

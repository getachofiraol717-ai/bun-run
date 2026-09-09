// AI Exam Simulator — WeaknessReport Model
// Detailed weakness identification and analysis

export type WeaknessType = "topic" | "concept" | "formula" | "prerequisite" | "skill" | "misconception";

export type WeaknessSeverity = "critical" | "major" | "minor";

export interface Weakness {
  id: string;
  type: WeaknessType;
  topic: string;
  subject: string;
  chapter?: string;
  name: string;
  description: string;
  severity: WeaknessSeverity;
  score: number;
  questionsAffected: number;
  impact: WeaknessImpact;
  evidence: WeaknessEvidence[];
  rootCauses: string[];
  relatedWeaknesses: string[];
  remediation: RemediationPlan;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeaknessImpact {
  examImpact: number;
  learningImpact: number;
  overallImpact: "high" | "medium" | "low";
  affectedTopics: string[];
  estimatedQuestionsInExam: number;
  estimatedScoreImpact: number;
}

export interface WeaknessEvidence {
  type: "question" | "quiz" | "exam" | "pattern";
  description: string;
  questionId?: string;
  examId?: string;
  date?: Date;
  result?: "incorrect" | "partial" | "correct_after_hint";
  timeSpent?: number;
}

export interface RemediationPlan {
  steps: RemediationStep[];
  estimatedTime: number;
  resources: RemediationResource[];
  successCriteria: string[];
  milestones: Milestone[];
}

export interface RemediationStep {
  step: number;
  type: "study" | "practice" | "review" | "tutor" | "flashcard" | "assessment";
  title: string;
  description: string;
  estimatedTime: number;
  resources: string[];
  completed: boolean;
}

export interface RemediationResource {
  type: "pdf" | "video" | "tutor" | "formula" | "flashcard" | "visual" | "reference" | "practice";
  id: string;
  title: string;
  url?: string;
  estimatedTime?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

export interface Milestone {
  title: string;
  description: string;
  targetDate?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface WeaknessReport {
  id: string;
  userId: string;
  examId?: string;
  generatedAt: Date;
  validUntil: Date;
  summary: WeaknessReportSummary;
  weaknesses: Weakness[];
  categorizedWeaknesses: CategorizedWeakness[];
  prioritizedWeaknesses: Weakness[];
  criticalWeaknesses: Weakness[];
  quickWins: QuickWin[];
  longTermFocus: Weakness[];
  recommendations: WeaknessRecommendation[];
  estimatedRemediationTime: number;
  projectedImprovement: number;
}

export interface WeaknessReportSummary {
  totalWeaknesses: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  byType: Record<WeaknessType, number>;
  bySubject: Record<string, number>;
  byChapter: Record<string, number>;
  overallWeaknessScore: number;
  improvementPotential: number;
  focusAreas: string[];
}

export interface CategorizedWeakness {
  category: WeaknessType;
  weaknesses: Weakness[];
  totalImpact: number;
  estimatedFixTime: number;
}

export interface QuickWin {
  weakness: Weakness;
  effortToFix: number;
  impactGain: number;
  efficiency: number;
}

export interface WeaknessRecommendation {
  type: "immediate" | "short_term" | "long_term";
  title: string;
  description: string;
  weaknesses: string[];
  estimatedTime: number;
  priority: number;
  resources: RemediationResource[];
}

export interface WeaknessPattern {
  type: "repeated_mistakes" | "topic_cluster" | "cognitive_gap" | "time_overrun" | "difficulty_spike";
  description: string;
  affectedWeaknesses: string[];
  severity: WeaknessSeverity;
  patternData: any;
}

export interface WeaknessComparison {
  currentWeaknesses: Weakness[];
  previousWeaknesses: Weakness[];
  improvements: WeaknessImprovement[];
  newWeaknesses: Weakness[];
  persistentWeaknesses: Weakness[];
  overallTrend: "improving" | "stable" | "declining";
}

export interface WeaknessImprovement {
  weaknessId: string;
  previousScore: number;
  currentScore: number;
  improvement: number;
  methods: string[];
}

export function createWeaknessReport(params: {
  userId: string;
  examId?: string;
  weaknesses: Weakness[];
}): WeaknessReport {
  const id = `weakness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Categorize weaknesses
  const categorizedWeaknesses: CategorizedWeakness[] = [];
  const weaknessTypes: WeaknessType[] = ["topic", "concept", "formula", "prerequisite", "skill", "misconception"];

  weaknessTypes.forEach(type => {
    const typeWeaknesses = params.weaknesses.filter(w => w.type === type);
    if (typeWeaknesses.length > 0) {
      categorizedWeaknesses.push({
        category: type,
        weaknesses: typeWeaknesses,
        totalImpact: typeWeaknesses.reduce((sum, w) => sum + w.impact.examImpact, 0),
        estimatedFixTime: typeWeaknesses.reduce((sum, w) => sum + w.remediation.estimatedTime, 0)
      });
    }
  });

  // Sort by impact
  const prioritizedWeaknesses = [...params.weaknesses].sort((a, b) => b.impact.examImpact - a.impact.examImpact);

  // Filter critical
  const criticalWeaknesses = params.weaknesses.filter(w => w.severity === "critical");

  // Find quick wins (high impact, low effort)
  const quickWins: QuickWin[] = params.weaknesses
    .filter(w => w.impact.overallImpact === "high" && w.remediation.estimatedTime <= 30)
    .map(w => ({
      weakness: w,
      effortToFix: w.remediation.estimatedTime,
      impactGain: w.impact.examImpact,
      efficiency: w.impact.examImpact / Math.max(1, w.remediation.estimatedTime)
    }))
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 5);

  // Long-term focus (low priority but high impact)
  const longTermFocus = prioritizedWeaknesses
    .filter(w => w.severity !== "critical" && w.impact.overallImpact === "medium")
    .slice(0, 5);

  // Generate recommendations
  const recommendations = generateWeaknessRecommendations(params.weaknesses);

  // Calculate summary
  const summary: WeaknessReportSummary = {
    totalWeaknesses: params.weaknesses.length,
    criticalCount: params.weaknesses.filter(w => w.severity === "critical").length,
    majorCount: params.weaknesses.filter(w => w.severity === "major").length,
    minorCount: params.weaknesses.filter(w => w.severity === "minor").length,
    byType: weaknessTypes.reduce((acc, type) => ({
      ...acc,
      [type]: params.weaknesses.filter(w => w.type === type).length
    }), {} as Record<WeaknessType, number>),
    bySubject: {},
    byChapter: {},
    overallWeaknessScore: calculateOverallWeaknessScore(params.weaknesses),
    improvementPotential: calculateImprovementPotential(params.weaknesses),
    focusAreas: prioritizedWeaknesses.slice(0, 3).map(w => w.topic)
  };

  // Count by subject and chapter
  params.weaknesses.forEach(w => {
    summary.bySubject[w.subject] = (summary.bySubject[w.subject] || 0) + 1;
    if (w.chapter) {
      summary.byChapter[w.chapter] = (summary.byChapter[w.chapter] || 0) + 1;
    }
  });

  return {
    id,
    userId: params.userId,
    examId: params.examId,
    generatedAt: new Date(),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    summary,
    weaknesses: params.weaknesses,
    categorizedWeaknesses,
    prioritizedWeaknesses,
    criticalWeaknesses,
    quickWins,
    longTermFocus,
    recommendations,
    estimatedRemediationTime: params.weaknesses.reduce((sum, w) => sum + w.remediation.estimatedTime, 0),
    projectedImprovement: calculateProjectedImprovement(params.weaknesses)
  };
}

function calculateOverallWeaknessScore(weaknesses: Weakness[]): number {
  if (weaknesses.length === 0) return 0;
  const totalScore = weaknesses.reduce((sum, w) => sum + w.score, 0);
  return totalScore / weaknesses.length;
}

function calculateImprovementPotential(weaknesses: Weakness[]): number {
  if (weaknesses.length === 0) return 0;

  const highImpactWeaknesses = weaknesses.filter(w => w.impact.overallImpact === "high");
  const potential = highImpactWeaknesses.reduce((sum, w) => sum + w.impact.examImpact, 0);

  return Math.min(100, potential);
}

function calculateProjectedImprovement(weaknesses: Weakness[]): number {
  const quickFixImpact = weaknesses
    .filter(w => w.remediation.estimatedTime <= 30)
    .reduce((sum, w) => sum + w.impact.examImpact, 0);

  return Math.min(30, quickFixImpact);
}

function generateWeaknessRecommendations(weaknesses: Weakness[]): WeaknessRecommendation[] {
  const recommendations: WeaknessRecommendation[] = [];

  // Immediate actions for critical weaknesses
  const criticalWeaknesses = weaknesses.filter(w => w.severity === "critical");
  if (criticalWeaknesses.length > 0) {
    recommendations.push({
      type: "immediate",
      title: "Address Critical Weaknesses",
      description: "Focus on high-impact weaknesses that affect exam performance",
      weaknesses: criticalWeaknesses.map(w => w.id),
      estimatedTime: criticalWeaknesses.reduce((sum, w) => sum + w.remediation.estimatedTime, 0),
      priority: 1,
      resources: criticalWeaknesses.flatMap(w => w.remediation.resources).slice(0, 5)
    });
  }

  // Short-term plan
  const majorWeaknesses = weaknesses.filter(w => w.severity === "major");
  if (majorWeaknesses.length > 0) {
    recommendations.push({
      type: "short_term",
      title: "Strengthen Major Weak Areas",
      description: "Work on weaknesses identified in recent exams",
      weaknesses: majorWeaknesses.map(w => w.id),
      estimatedTime: majorWeaknesses.reduce((sum, w) => sum + w.remediation.estimatedTime, 0),
      priority: 2,
      resources: majorWeaknesses.flatMap(w => w.remediation.resources).slice(0, 5)
    });
  }

  // Long-term improvement
  recommendations.push({
    type: "long_term",
    title: "Build Strong Foundations",
    description: "Focus on prerequisite knowledge and core concepts",
    weaknesses: weaknesses.filter(w => w.type === "prerequisite").map(w => w.id),
    estimatedTime: 240,
    priority: 3,
    resources: []
  });

  return recommendations;
}

export const WEAKNESS_TYPE_LABELS: Record<WeaknessType, string> = {
  topic: "Topic",
  concept: "Concept",
  formula: "Formula",
  prerequisite: "Prerequisite",
  skill: "Skill",
  misconception: "Misconception"
};

export const WEAKNESS_SEVERITY_COLORS: Record<WeaknessSeverity, string> = {
  critical: "#ef4444",
  major: "#f97316",
  minor: "#eab308"
};

export const WEAKNESS_SEVERITY_LABELS: Record<WeaknessSeverity, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor"
};

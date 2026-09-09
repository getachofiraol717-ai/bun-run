// @ts-nocheck
// AI Exam Simulator — ReadinessReport Model
// Student readiness assessment

export type ReadinessLevel = "not_ready" | "slightly_ready" | "moderately_ready" | "ready" | "well_prepared" | "highly_prepared";

export type ReadinessFactor =
  | "completed_lessons"
  | "quiz_performance"
  | "mastered_concepts"
  | "knowledge_gaps"
  | "study_consistency"
  | "practice_exams"
  | "time_management"
  | "formula_proficiency"
  | "weak_areas_addressed";

export interface ReadinessScore {
  overall: number;
  byFactor: Record<ReadinessFactor, FactorScore>;
  confidence: number;
  trend: "improving" | "stable" | "declining";
}

export interface FactorScore {
  score: number;
  weight: number;
  status: "critical" | "warning" | "good" | "excellent";
  details: string;
  evidence: string[];
  recommendations?: string[];
}

export interface ReadinessAnalysis {
  userId: string;
  targetExam?: {
    examId: string;
    title: string;
    date?: Date;
  };
  overallLevel: ReadinessLevel;
  readinessScore: ReadinessScore;
  factors: ReadinessFactorAnalysis[];
  strengths: string[];
  weaknesses: string[];
  criticalGaps: CriticalGap[];
  recommendations: ReadinessRecommendation[];
  estimatedReadinessDate?: Date;
  confidenceInterval: { min: number; max: number };
  generatedAt: Date;
  validUntil: Date;
}

export interface ReadinessFactorAnalysis {
  factor: ReadinessFactor;
  weight: number;
  currentValue: number;
  targetValue: number;
  score: number;
  status: "critical" | "warning" | "good" | "excellent";
  description: string;
  evidence: EvidenceItem[];
  impact: "high" | "medium" | "low";
  progress: number;
}

export interface EvidenceItem {
  type: "quiz" | "lesson" | "practice" | "time" | "mastery";
  description: string;
  date?: Date;
  value?: number;
  target?: number;
}

export interface CriticalGap {
  topic: string;
  subject: string;
  severity: "critical" | "major" | "minor";
  description: string;
  impactOnExam: string;
  estimatedQuestions: number;
  estimatedImpact: number;
  remediationTime: number;
  priority: number;
}

export interface ReadinessRecommendation {
  type: "study" | "practice" | "review" | "tutor" | "flashcard" | "formula" | "video" | "pdf";
  title: string;
  description: string;
  estimatedTime: number;
  priority: number;
  topic?: string;
  impact: "high" | "medium" | "low";
  resources?: RecommendationResource[];
  deadline?: Date;
}

export interface RecommendationResource {
  type: string;
  id: string;
  title: string;
  url?: string;
  estimatedTime?: number;
}

export interface ReadinessTrend {
  date: Date;
  score: number;
  level: ReadinessLevel;
  examId?: string;
}

export interface ReadinessHistory {
  userId: string;
  trends: ReadinessTrend[];
  averageScore: number;
  improvementRate: number;
  lastUpdated: Date;
}

export interface ExamReadinessConfig {
  targetDate?: Date;
  examId?: string;
  topics: string[];
  weightByFactor: Record<ReadinessFactor, number>;
  thresholds: ReadinessThresholds;
}

export interface ReadinessThresholds {
  not_ready: number;
  slightly_ready: number;
  moderately_ready: number;
  ready: number;
  well_prepared: number;
  highly_prepared: number;
}

export function createReadinessReport(params: {
  userId: string;
  targetExam?: ReadinessAnalysis["targetExam"];
  readinessScore: ReadinessScore;
  factors: ReadinessFactorAnalysis[];
}): ReadinessAnalysis {
  const id = `readiness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const overallLevel = calculateReadinessLevel(params.readinessScore.overall);

  const strengths = params.factors
    .filter(f => f.status === "excellent" || f.status === "good")
    .map(f => f.description);

  const weaknesses = params.factors
    .filter(f => f.status === "critical" || f.status === "warning")
    .map(f => f.description);

  const criticalGaps = params.factors
    .filter(f => f.impact === "high" && (f.status === "critical" || f.status === "warning"))
    .map(f => ({
      topic: f.factor,
      subject: "General",
      severity: f.status === "critical" ? "critical" as const : "major" as const,
      description: f.description,
      impactOnExam: `This gap may significantly affect exam performance`,
      estimatedQuestions: Math.floor(f.weight * 10),
      estimatedImpact: f.weight * 100,
      remediationTime: Math.ceil((1 - f.progress) * 120),
      priority: f.impact === "high" ? 1 : 2
    }));

  const recommendations = generateReadinessRecommendations(params.factors);

  return {
    userId: params.userId,
    targetExam: params.targetExam,
    overallLevel,
    readinessScore: params.readinessScore,
    factors: params.factors,
    strengths,
    weaknesses,
    criticalGaps,
    recommendations,
    estimatedReadinessDate: calculateEstimatedReadinessDate(params.factors),
    confidenceInterval: {
      min: Math.max(0, params.readinessScore.overall - 15),
      max: Math.min(100, params.readinessScore.overall + 10)
    },
    generatedAt: new Date(),
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };
}

export function calculateReadinessLevel(score: number): ReadinessLevel {
  if (score >= 95) return "highly_prepared";
  if (score >= 85) return "well_prepared";
  if (score >= 70) return "ready";
  if (score >= 50) return "moderately_ready";
  if (score >= 30) return "slightly_ready";
  return "not_ready";
}

export function calculateReadinessScore(factors: FactorScore[]): ReadinessScore {
  let weightedSum = 0;
  let totalWeight = 0;
  const byFactor: Record<ReadinessFactor, FactorScore> = {} as any;

  factors.forEach(factor => {
    byFactor[factor.factor] = factor;
    weightedSum += factor.score * factor.weight;
    totalWeight += factor.weight;
  });

  const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const confidence = calculateConfidence(factors);
  const trend = calculateTrend(factors);

  return { overall, byFactor, confidence, trend };
}

function calculateConfidence(factors: FactorScore[]): number {
  const evidenceCount = factors.reduce((sum, f) => sum + f.evidence.length, 0);
  return Math.min(1, evidenceCount / 10);
}

function calculateTrend(factors: FactorScore[]): "improving" | "stable" | "declining" {
  let improving = 0;
  let declining = 0;

  factors.forEach(f => {
    if (f.status === "excellent" || f.status === "good") improving++;
    if (f.status === "critical") declining++;
  });

  if (improving > declining) return "improving";
  if (declining > improving) return "declining";
  return "stable";
}

function generateReadinessRecommendations(factors: ReadinessFactorAnalysis[]): ReadinessRecommendation[] {
  const recommendations: ReadinessRecommendation[] = [];

  factors
    .filter(f => f.status === "critical" || f.status === "warning")
    .sort((a, b) => a.impact === "high" && b.impact !== "high" ? -1 : 1)
    .slice(0, 5)
    .forEach((factor, index) => {
      recommendations.push({
        type: factor.factor === "formula_proficiency" ? "formula" : "study",
        title: `Address ${factor.factor.replace(/_/g, " ")}`,
        description: factor.description,
        estimatedTime: Math.ceil((1 - factor.progress) * 60),
        priority: index + 1,
        impact: factor.impact,
        resources: []
      });
    });

  return recommendations;
}

function calculateEstimatedReadinessDate(factors: ReadinessFactorAnalysis[]): Date | undefined {
  const maxRemediation = Math.max(...factors.map(f => Math.ceil((1 - f.progress) * 120)));

  if (maxRemediation <= 0) return new Date();

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + Math.ceil(maxRemediation / 60));

  return estimatedDate;
}

export const READINESS_LEVEL_LABELS: Record<ReadinessLevel, string> = {
  not_ready: "Not Ready",
  slightly_ready: "Slightly Ready",
  moderately_ready: "Moderately Ready",
  ready: "Ready",
  well_prepared: "Well Prepared",
  highly_prepared: "Highly Prepared"
};

export const READINESS_LEVEL_COLORS: Record<ReadinessLevel, string> = {
  not_ready: "#ef4444",
  slightly_ready: "#f97316",
  moderately_ready: "#eab308",
  ready: "#22c55e",
  well_prepared: "#3b82f6",
  highly_prepared: "#8b5cf6"
};

export const READINESS_FACTOR_WEIGHTS: Record<ReadinessFactor, number> = {
  completed_lessons: 0.15,
  quiz_performance: 0.20,
  mastered_concepts: 0.20,
  knowledge_gaps: 0.15,
  study_consistency: 0.10,
  practice_exams: 0.10,
  time_management: 0.05,
  formula_proficiency: 0.03,
  weak_areas_addressed: 0.02
};

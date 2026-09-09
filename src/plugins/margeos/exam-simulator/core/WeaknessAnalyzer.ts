// @ts-nocheck
/**
 * WeaknessAnalyzer.ts
 *
 * Identifies and analyzes student weaknesses across topics, concepts,
 * and skills. Provides detailed remediation plans and prioritization.
 */

import type { WeaknessType, Weakness, WeaknessReport, CategorizedWeakness, QuickWin } from '../models/WeaknessReport';
import type { Exam, ExamResult, QuestionResult } from '../models';
import { examStorage } from '../store/examSimulatorStore';

export interface WeaknessAnalysisConfig {
  minimumIncorrectForWeakness: number;
  includePrerequisiteGaps: boolean;
  includeMisconceptions: boolean;
  confidenceThreshold: number;
}

const DEFAULT_CONFIG: WeaknessAnalysisConfig = {
  minimumIncorrectForWeakness: 1,
  includePrerequisiteGaps: true,
  includeMisconceptions: true,
  confidenceThreshold: 0.7
};

export class WeaknessAnalyzer {
  private static instance: WeaknessAnalyzer;
  private config: WeaknessAnalysisConfig;
  private initialized: boolean = false;
  private knownMisconceptions: Map<string, string[]> = new Map();

  private constructor(config?: Partial<WeaknessAnalysisConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<WeaknessAnalysisConfig>): WeaknessAnalyzer {
    if (!WeaknessAnalyzer.instance) {
      WeaknessAnalyzer.instance = new WeaknessAnalyzer(config);
    }
    return WeaknessAnalyzer.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize known misconceptions database
    this.initializeMisconceptions();

    this.initialized = true;
  }

  /**
   * Analyze weaknesses from exam results
   */
  async analyzeWeaknesses(
    exam: Exam,
    answers: Map<string, string | string[] | boolean>,
    result: ExamResult
  ): Promise<WeaknessReport> {
    const weaknesses: Weakness[] = [];

    // Analyze incorrect answers
    for (const questionResult of result.questionResults) {
      if (!questionResult.isCorrect) {
        const weakness = this.analyzeQuestionWeakness(
          exam,
          questionResult,
          answers
        );
        weaknesses.push(weakness);
      }
    }

    // Categorize weaknesses
    const categorized = this.categorizeWeaknesses(weaknesses);

    // Find prerequisite gaps
    if (this.config.includePrerequisiteGaps) {
      const prerequisiteGaps = await this.identifyPrerequisiteGaps(
        categorized.topicWeaknesses
      );
      weaknesses.push(...prerequisiteGaps);
    }

    // Identify misconceptions
    if (this.config.includeMisconceptions) {
      const misconceptions = this.identifyMisconceptions(
        exam,
        result.questionResults
      );
      weaknesses.push(...misconceptions);
    }

    // Calculate priority scores
    const prioritizedWeaknesses = this.calculatePriorityScores(weaknesses);

    // Find quick wins
    const quickWins = this.identifyQuickWins(prioritizedWeaknesses);

    // Generate remediation plans
    const remediationPlans = this.generateRemediationPlans(prioritizedWeaknesses);

    // Generate report
    const report: WeaknessReport = {
      id: `WEAKNESS-${Date.now()}-${this.generateRandomId()}`,
      examId: exam.id,
      userId: result.userId,
      generatedAt: new Date().toISOString(),
      examMode: exam.mode,
      examTopics: exam.config.topics,
      totalWeaknesses: prioritizedWeaknesses.length,
      criticalWeaknesses: prioritizedWeaknesses.filter(w => w.priority === 'critical').length,
      topicWeaknesses: categorized.topicWeaknesses,
      conceptWeaknesses: categorized.conceptWeaknesses,
      skillWeaknesses: categorized.skillWeaknesses,
      formulaWeaknesses: categorized.formulaWeaknesses,
      prerequisiteGaps: categorized.prerequisiteWeaknesses,
      misconceptionWeaknesses: categorized.misconceptionWeaknesses,
      quickWins,
      remediationPlans,
      improvementAreas: this.identifyImprovementAreas(prioritizedWeaknesses),
      studyRecommendations: this.generateStudyRecommendations(prioritizedWeaknesses),
      estimatedImprovement: this.estimateImprovement(prioritizedWeaknesses)
    };

    examStorage.saveWeaknessReport(report);
    return report;
  }

  /**
   * Get weakness report for topics
   */
  async getWeaknessReport(topics: string[]): Promise<WeaknessReport | null> {
    const reports = examStorage.getWeaknessReports();
    const latestReport = reports
      .filter(r => r.examTopics.some(t => topics.includes(t)))
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];

    return latestReport || null;
  }

  /**
   * Analyze a single question's weakness
   */
  private analyzeQuestionWeakness(
    exam: Exam,
    questionResult: QuestionResult,
    answers: Map<string, string | string[] | boolean>
  ): Weakness {
    const question = exam.questions.find(q => q.id === questionResult.questionId);
    if (!question) {
      return this.createGenericWeakness(questionResult);
    }

    const weaknessType = this.determineWeaknessType(question);
    const evidence = this.gatherEvidence(questionResult, question, answers);
    const relatedTopics = this.findRelatedTopics(question);

    return {
      id: `W-${Date.now()}-${this.generateRandomId()}`,
      type: weaknessType,
      topic: question.content.topic,
      subtopic: question.content.subtopic,
      description: this.generateWeaknessDescription(weaknessType, question),
      severity: this.calculateSeverity(questionResult, question),
      evidence,
      affectedQuestions: [questionResult.questionId],
      firstOccurrence: questionResult.attemptedAt,
      frequency: 1,
      isImproving: false,
      relatedConcepts: relatedTopics,
      remediationResources: this.suggestRemediationResources(weaknessType, question),
      estimatedMasteryTime: this.estimateMasteryTime(weaknessType, questionResult.difficulty),
      priority: 'medium',
      metadata: {
        questionType: question.content.type,
        difficulty: question.content.difficulty,
        timeSpent: questionResult.timeSpent,
        hintUsed: questionResult.hintUsed
      }
    };
  }

  /**
   * Determine the type of weakness
   */
  private determineWeaknessType(question: any): WeaknessType {
    const content = question.content;

    // Check if it's a formula-related question
    if (content.tags?.some((t: string) =>
      ['formula', 'equation', 'calculation', 'derivation'].includes(t.toLowerCase())
    )) {
      return 'formula';
    }

    // Check if it's a conceptual question
    if (content.type === 'SHORT_ANSWER' || content.type === 'ESSAY') {
      return 'concept';
    }

    // Check if it requires a specific skill
    if (content.type === 'MULTI_SELECT' || content.type === 'MATCHING') {
      return 'skill';
    }

    // Check for prerequisite knowledge
    if (content.difficulty > 0.7) {
      return 'prerequisite';
    }

    return 'topic';
  }

  /**
   * Gather evidence for a weakness
   */
  private gatherEvidence(
    questionResult: QuestionResult,
    question: any,
    answers: Map<string, string | string[] | boolean>
  ): Weakness['evidence'] {
    const userAnswer = answers.get(questionResult.questionId);

    return {
      incorrectAnswers: userAnswer ? [this.formatAnswer(userAnswer)] : [],
      commonMistakes: question.solution?.commonMistakes || [],
      misconceptions: this.checkForMisconceptions(question, userAnswer),
      conceptualGaps: this.identifyConceptualGaps(question),
      incorrectReasoning: questionResult.feedback || 'Answer did not match expected solution'
    };
  }

  /**
   * Check for known misconceptions
   */
  private checkForMisconceptions(question: any, userAnswer: any): string[] {
    const topicMisconceptions = this.knownMisconceptions.get(question.content.topic) || [];
    const detectedMisconceptions: string[] = [];

    topicMisconceptions.forEach(misconception => {
      if (this.answerMatchesMisconception(userAnswer, misconception)) {
        detectedMisconceptions.push(misconception);
      }
    });

    return detectedMisconceptions;
  }

  /**
   * Categorize weaknesses by type
   */
  private categorizeWeaknesses(weaknesses: Weakness[]): CategorizedWeakness {
    return {
      topics: this.groupByTopic(weaknesses.filter(w => w.type === 'topic')),
      concepts: this.groupByConcept(weaknesses.filter(w => w.type === 'concept')),
      skills: this.groupBySkill(weaknesses.filter(w => w.type === 'skill')),
      formulas: this.groupByFormula(weaknesses.filter(w => w.type === 'formula')),
      prerequisites: this.groupByPrerequisite(weaknesses.filter(w => w.type === 'prerequisite')),
      misconceptions: this.groupByMisconception(weaknesses.filter(w => w.type === 'misconception'))
    };
  }

  private groupByTopic(weaknesses: Weakness[]): Weakness[] {
    const grouped = new Map<string, Weakness>();

    weaknesses.forEach(w => {
      const existing = grouped.get(w.topic);
      if (existing) {
        existing.severity = Math.max(existing.severity, w.severity);
        existing.affectedQuestions.push(...w.affectedQuestions);
        existing.frequency += w.frequency;
      } else {
        grouped.set(w.topic, { ...w });
      }
    });

    return Array.from(grouped.values());
  }

  private groupByConcept(weaknesses: Weakness[]): Weakness[] {
    return weaknesses;
  }

  private groupBySkill(weaknesses: Weakness[]): Weakness[] {
    return weaknesses;
  }

  private groupByFormula(weaknesses: Weakness[]): Weakness[] {
    return weaknesses;
  }

  private groupByPrerequisite(weaknesses: Weakness[]): Weakness[] {
    return weaknesses;
  }

  private groupByMisconception(weaknesses: Weakness[]): Weakness[] {
    return weaknesses;
  }

  /**
   * Identify prerequisite gaps
   */
  private async identifyPrerequisiteGaps(
    topicWeaknesses: Weakness[]
  ): Promise<Weakness[]> {
    const gaps: Weakness[] = [];

    for (const weakness of topicWeaknesses) {
      if (weakness.severity >= 0.7) {
        const prerequisites = await this.getPrerequisites(weakness.topic);

        for (const prereq of prerequisites) {
          const prereqMastery = await this.checkPrerequisiteMastery(prereq);

          if (prereqMastery < 0.5) {
            gaps.push({
              id: `PREREQ-${Date.now()}-${this.generateRandomId()}`,
              type: 'prerequisite',
              topic: prereq,
              subtopic: weakness.topic,
              description: `Missing prerequisite knowledge: ${prereq}`,
              severity: weakness.severity * 0.8,
              evidence: {
                incorrectAnswers: [],
                commonMistakes: [],
                misconceptions: [],
                conceptualGaps: [`Prerequisite ${prereq} not fully understood`],
                incorrectReasoning: 'Cannot solve advanced problems without foundation'
              },
              affectedQuestions: weakness.affectedQuestions,
              firstOccurrence: weakness.firstOccurrence,
              frequency: 1,
              isImproving: false,
              relatedConcepts: [weakness.topic],
              remediationResources: [`Review ${prereq} fundamentals`],
              estimatedMasteryTime: '1-2 hours',
              priority: weakness.severity >= 0.8 ? 'high' : 'medium'
            });
          }
        }
      }
    }

    return gaps;
  }

  /**
   * Identify misconceptions
   */
  private identifyMisconceptions(exam: Exam, questionResults: QuestionResult[]): Weakness[] {
    const misconceptions: Weakness[] = [];

    for (const qr of questionResults) {
      if (!qr.isCorrect) {
        const question = exam.questions.find(q => q.id === qr.questionId);
        if (question) {
          const detectedMisconceptions = this.checkForMisconceptions(question, null);

          detectedMisconceptions.forEach(misconception => {
            misconceptions.push({
              id: `MISCON-${Date.now()}-${this.generateRandomId()}`,
              type: 'misconception',
              topic: question.content.topic,
              description: misconception,
              severity: 0.7,
              evidence: {
                incorrectAnswers: [],
                commonMistakes: [],
                misconceptions: [misconception],
                conceptualGaps: [],
                incorrectReasoning: 'Common misconception detected'
              },
              affectedQuestions: [qr.questionId],
              firstOccurrence: qr.attemptedAt,
              frequency: 1,
              isImproving: false,
              relatedConcepts: [],
              remediationResources: [],
              estimatedMasteryTime: '30-60 minutes',
              priority: 'medium'
            });
          });
        }
      }
    }

    return misconceptions;
  }

  /**
   * Calculate priority scores for weaknesses
   */
  private calculatePriorityScores(weaknesses: Weakness[]): Weakness[] {
    return weaknesses.map(w => ({
      ...w,
      priority: this.determinePriority(w)
    }));
  }

  private determinePriority(weakness: Weakness): 'critical' | 'high' | 'medium' | 'low' {
    if (weakness.severity >= 0.9 && weakness.frequency >= 3) return 'critical';
    if (weakness.severity >= 0.7) return 'high';
    if (weakness.severity >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Identify quick wins
   */
  private identifyQuickWins(weaknesses: Weakness[]): QuickWin[] {
    return weaknesses
      .filter(w => w.estimatedMasteryTime && this.parseTimeToHours(w.estimatedMasteryTime) <= 1)
      .slice(0, 5)
      .map(w => ({
        weaknessId: w.id,
        topic: w.topic,
        subtopic: w.subtopic,
        action: `Focus on ${w.topic}: ${w.description}`,
        estimatedTime: w.estimatedMasteryTime || '30 minutes',
        impact: 'medium',
        difficulty: 'easy'
      }));
  }

  /**
   * Generate remediation plans
   */
  private generateRemediationPlans(weaknesses: Weakness[]): WeaknessReport['remediationPlans'] {
    const plans: WeaknessReport['remediationPlans'] = [];

    // Group by priority
    const critical = weaknesses.filter(w => w.priority === 'critical');
    const high = weaknesses.filter(w => w.priority === 'high');
    const medium = weaknesses.filter(w => w.priority === 'medium');

    if (critical.length > 0) {
      plans.push({
        focusArea: 'Critical Weaknesses',
        targetWeaknesses: critical.map(w => w.id),
        activities: this.suggestActivities(critical),
        duration: '1 week',
        milestones: ['Complete fundamentals review', 'Practice 50+ questions'],
        successCriteria: 'Score above 70% on related questions'
      });
    }

    if (high.length > 0) {
      plans.push({
        focusArea: 'High Priority Weaknesses',
        targetWeaknesses: high.map(w => w.id),
        activities: this.suggestActivities(high),
        duration: '2 weeks',
        milestones: ['Complete topic review', 'Practice 30+ questions'],
        successCriteria: 'Score above 60% on related questions'
      });
    }

    if (medium.length > 0) {
      plans.push({
        focusArea: 'Medium Priority Weaknesses',
        targetWeaknesses: medium.map(w => w.id),
        activities: this.suggestActivities(medium),
        duration: '2-3 weeks',
        milestones: ['Complete concept review', 'Practice 20+ questions'],
        successCriteria: 'Score above 50% on related questions'
      });
    }

    return plans;
  }

  private suggestActivities(weaknesses: Weakness[]): string[] {
    const activities: string[] = [];
    const hasTopic = weaknesses.some(w => w.type === 'topic');
    const hasConcept = weaknesses.some(w => w.type === 'concept');
    const hasFormula = weaknesses.some(w => w.type === 'formula');
    const hasSkill = weaknesses.some(w => w.type === 'skill');

    if (hasTopic) {
      activities.push('Review topic fundamentals with examples');
      activities.push('Complete topic-based practice questions');
    }
    if (hasConcept) {
      activities.push('Read detailed explanations of key concepts');
      activities.push('Create concept maps for visual understanding');
    }
    if (hasFormula) {
      activities.push('Practice formula derivations');
      activities.push('Solve calculation-based problems');
    }
    if (hasSkill) {
      activities.push('Practice multi-step problem solving');
      activities.push('Review worked examples');
    }

    return activities;
  }

  private identifyImprovementAreas(weaknesses: Weakness[]): string[] {
    const areas = new Set<string>();

    weaknesses.forEach(w => {
      if (w.priority === 'critical' || w.priority === 'high') {
        areas.add(w.topic);
      }
    });

    return Array.from(areas);
  }

  private generateStudyRecommendations(weaknesses: Weakness[]): string[] {
    const recommendations: string[] = [];
    const criticalTopics = weaknesses
      .filter(w => w.priority === 'critical')
      .map(w => w.topic);

    if (criticalTopics.length > 0) {
      recommendations.push(`Focus study sessions on: ${criticalTopics.join(', ')}`);
    }

    recommendations.push('Spend 30 minutes daily on weak areas');
    recommendations.push('Complete practice questions after each review session');
    recommendations.push('Use spaced repetition for formula memorization');

    return recommendations;
  }

  private estimateImprovement(weaknesses: Weakness[]): {
    potentialScoreIncrease: number;
    timeframe: string;
    confidence: number;
  } {
    const criticalCount = weaknesses.filter(w => w.priority === 'critical').length;
    const highCount = weaknesses.filter(w => w.priority === 'high').length;

    const potentialIncrease = (criticalCount * 8) + (highCount * 5);

    return {
      potentialScoreIncrease: Math.min(30, potentialIncrease),
      timeframe: criticalCount > 3 ? '2-3 weeks' : '1-2 weeks',
      confidence: 0.75
    };
  }

  private initializeMisconceptions(): void {
    // Add common misconceptions
    this.knownMisconceptions.set('mathematics', [
      'Multiplication always makes things bigger',
      'Dividing makes things smaller',
      'Negative numbers are not real'
    ]);
    this.knownMisconceptions.set('physics', [
      'Heavier objects fall faster',
      'Force is required for motion',
      'Energy can be created or destroyed'
    ]);
  }

  private createGenericWeakness(questionResult: QuestionResult): Weakness {
    return {
      id: `W-${Date.now()}-${this.generateRandomId()}`,
      type: 'topic',
      topic: 'general',
      description: 'Area requiring improvement',
      severity: 0.5,
      evidence: {
        incorrectAnswers: [],
        commonMistakes: [],
        misconceptions: [],
        conceptualGaps: [],
        incorrectReasoning: questionResult.feedback || 'Answer was incorrect'
      },
      affectedQuestions: [questionResult.questionId],
      firstOccurrence: questionResult.attemptedAt,
      frequency: 1,
      isImproving: false,
      relatedConcepts: [],
      remediationResources: [],
      estimatedMasteryTime: '1-2 hours',
      priority: 'medium'
    };
  }

  private generateWeaknessDescription(type: WeaknessType, question: any): string {
    return `Difficulty with ${type} questions in ${question.content.topic}`;
  }

  private calculateSeverity(questionResult: QuestionResult, question: any): number {
    const baseSeverity = question.content.difficulty || 0.5;
    const timeFactor = questionResult.timeSpent > 120 ? 0.2 : 0;

    return Math.min(1, baseSeverity + timeFactor);
  }

  private findRelatedTopics(question: any): string[] {
    return question.content.tags || [question.content.topic];
  }

  private suggestRemediationResources(type: WeaknessType, question: any): string[] {
    const resources: string[] = [];

    resources.push(`Review ${question.content.topic} fundamentals`);

    if (type === 'formula') {
      resources.push('Practice formula derivations');
      resources.push('Watch worked examples');
    }
    if (type === 'concept') {
      resources.push('Read detailed explanations');
      resources.push('Create concept summaries');
    }

    return resources;
  }

  private estimateMasteryTime(type: WeaknessType, difficulty: number): string {
    const baseTime = difficulty > 0.7 ? 2 : difficulty > 0.4 ? 1.5 : 1;

    if (type === 'formula') return `${baseTime * 30}-${baseTime * 60} minutes`;
    if (type === 'concept') return `${baseTime}-${baseTime * 2} hours`;
    return `${baseTime * 2}-${baseTime * 3} hours`;
  }

  private parseTimeToHours(timeString: string): number {
    const match = timeString.match(/(\d+(?:\.\d+)?)/);
    if (!match) return 1;

    const value = parseFloat(match[1]);
    if (timeString.includes('minute')) return value / 60;
    return value;
  }

  private formatAnswer(answer: string | string[] | boolean): string {
    if (typeof answer === 'boolean') return answer ? 'True' : 'False';
    if (Array.isArray(answer)) return answer.join(', ');
    return String(answer);
  }

  private answerMatchesMisconception(answer: any, misconception: string): boolean {
    // Simplified check - in production would use more sophisticated matching
    return false;
  }

  private async getPrerequisites(topic: string): Promise<string[]> {
    // In production, this would integrate with Knowledge Galaxy engine
    return [];
  }

  private async checkPrerequisiteMastery(prereq: string): Promise<number> {
    // In production, this would check performance history
    return 0.5;
  }

  private identifyConceptualGaps(question: any): string[] {
    return question.solution?.relatedConcepts || [];
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}

export default WeaknessAnalyzer;

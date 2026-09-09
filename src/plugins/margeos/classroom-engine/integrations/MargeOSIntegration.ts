// @ts-nocheck
/**
 * MargeOSIntegration.ts
 *
 * Main integration module that connects the Classroom Communication Hub
 * with all other MargeOS engines for seamless educational platform functionality.
 */

import { Message, Channel, EducationalLink } from '../models';

// Integration types for each MargeOS engine
export interface IntegrationConfig {
  enableSmartPDFIntegration?: boolean;
  enableAITutorIntegration?: boolean;
  enableFormulaIntegration?: boolean;
  enableReferenceBookIntegration?: boolean;
  enableVisualLearningIntegration?: boolean;
  enableAccessibilityIntegration?: boolean;
  enableStudyCompanionIntegration?: boolean;
  enableMemoryVaultIntegration?: boolean;
  enableKnowledgeGalaxyIntegration?: boolean;
  enableQuizEngineIntegration?: boolean;
  enableExamSimulatorIntegration?: boolean;
  enableAnalyticsIntegration?: boolean;
  enableWorldBuilderIntegration?: boolean;
}

export interface IntegrationEvent {
  source: string;
  type: string;
  data: any;
  timestamp: string;
}

export interface LinkedContent {
  type: 'pdf' | 'concept' | 'formula' | 'reference_book' | 'knowledge_node' | 'quiz' | 'lesson' | 'visual';
  id: string;
  title: string;
  url?: string;
  pageNumber?: number;
  excerpt?: string;
  relevance?: number;
  metadata?: Record<string, any>;
}

/**
 * Main integration manager for all MargeOS engines
 */
export class MargeOSIntegration {
  private static instance: MargeOSIntegration;
  private config: IntegrationConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private integrations: Map<string, any> = new Map();
  private initialized: boolean = false;

  private constructor(config: IntegrationConfig = {}) {
    this.config = {
      enableSmartPDFIntegration: true,
      enableAITutorIntegration: true,
      enableFormulaIntegration: true,
      enableReferenceBookIntegration: true,
      enableVisualLearningIntegration: true,
      enableAccessibilityIntegration: true,
      enableStudyCompanionIntegration: true,
      enableMemoryVaultIntegration: true,
      enableKnowledgeGalaxyIntegration: true,
      enableQuizEngineIntegration: true,
      enableExamSimulatorIntegration: true,
      enableAnalyticsIntegration: true,
      enableWorldBuilderIntegration: true,
      ...config
    };
  }

  static getInstance(config?: IntegrationConfig): MargeOSIntegration {
    if (!MargeOSIntegration.instance) {
      MargeOSIntegration.instance = new MargeOSIntegration(config);
    }
    return MargeOSIntegration.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize all integrations based on config
    await this.initializeIntegrations();

    this.initialized = true;
    this.emit('integrationsInitialized', { config: this.config });
  }

  private async initializeIntegrations(): Promise<void> {
    const initPromises: Promise<void>[] = [];

    if (this.config.enableSmartPDFIntegration) {
      initPromises.push(this.initializeSmartPDF());
    }
    if (this.config.enableAITutorIntegration) {
      initPromises.push(this.initializeAITutor());
    }
    if (this.config.enableFormulaIntegration) {
      initPromises.push(this.initializeFormula());
    }
    if (this.config.enableReferenceBookIntegration) {
      initPromises.push(this.initializeReferenceBook());
    }
    if (this.config.enableVisualLearningIntegration) {
      initPromises.push(this.initializeVisualLearning());
    }
    if (this.config.enableAccessibilityIntegration) {
      initPromises.push(this.initializeAccessibility());
    }
    if (this.config.enableStudyCompanionIntegration) {
      initPromises.push(this.initializeStudyCompanion());
    }
    if (this.config.enableMemoryVaultIntegration) {
      initPromises.push(this.initializeMemoryVault());
    }
    if (this.config.enableKnowledgeGalaxyIntegration) {
      initPromises.push(this.initializeKnowledgeGalaxy());
    }
    if (this.config.enableQuizEngineIntegration) {
      initPromises.push(this.initializeQuizEngine());
    }
    if (this.config.enableExamSimulatorIntegration) {
      initPromises.push(this.initializeExamSimulator());
    }
    if (this.config.enableAnalyticsIntegration) {
      initPromises.push(this.initializeAnalytics());
    }
    if (this.config.enableWorldBuilderIntegration) {
      initPromises.push(this.initializeWorldBuilder());
    }

    await Promise.all(initPromises);
  }

  private async initializeSmartPDF(): Promise<void> {
    try {
      // Import Smart PDF Engine
      const { SmartPDFEngine } = await import('../../smart-pdf-engine');
      const smartPDF = SmartPDFEngine.getInstance();
      this.integrations.set('smartPDF', smartPDF);
    } catch (error) {
      console.warn('Smart PDF Integration not available:', error);
    }
  }

  private async initializeAITutor(): Promise<void> {
    try {
      // Import AI Tutor Engine
      const { AITutorEngine } = await import('../../ai-tutor-engine');
      const aiTutor = AITutorEngine.getInstance();
      this.integrations.set('aiTutor', aiTutor);
    } catch (error) {
      console.warn('AI Tutor Integration not available:', error);
    }
  }

  private async initializeFormula(): Promise<void> {
    try {
      // Import Formula Engine
      const { FormulaEngine } = await import('../../formula-engine');
      const formula = FormulaEngine.getInstance();
      this.integrations.set('formula', formula);
    } catch (error) {
      console.warn('Formula Integration not available:', error);
    }
  }

  private async initializeReferenceBook(): Promise<void> {
    try {
      // Import Reference Book Engine
      const { ReferenceBookEngine } = await import('../../reference-book-engine');
      const reference = ReferenceBookEngine.getInstance();
      this.integrations.set('referenceBook', reference);
    } catch (error) {
      console.warn('Reference Book Integration not available:', error);
    }
  }

  private async initializeVisualLearning(): Promise<void> {
    try {
      // Import Visual Learning Engine
      const { VisualLearningEngine } = await import('../../visual-learning-engine');
      const visual = VisualLearningEngine.getInstance();
      this.integrations.set('visualLearning', visual);
    } catch (error) {
      console.warn('Visual Learning Integration not available:', error);
    }
  }

  private async initializeAccessibility(): Promise<void> {
    try {
      // Import Accessibility Engine
      const { AccessibilityEngine } = await import('../../accessibility-engine');
      const accessibility = AccessibilityEngine.getInstance();
      this.integrations.set('accessibility', accessibility);
    } catch (error) {
      console.warn('Accessibility Integration not available:', error);
    }
  }

  private async initializeStudyCompanion(): Promise<void> {
    try {
      // Import Study Companion
      const { StudyCompanionEngine } = await import('../../study-companion');
      const study = StudyCompanionEngine.getInstance();
      this.integrations.set('studyCompanion', study);
    } catch (error) {
      console.warn('Study Companion Integration not available:', error);
    }
  }

  private async initializeMemoryVault(): Promise<void> {
    try {
      // Memory Vault integration - uses global window object
      const memoryVault = (window as any).MargeOS?.MemoryVault;
      if (memoryVault) {
        this.integrations.set('memoryVault', memoryVault);
      }
    } catch (error) {
      console.warn('Memory Vault Integration not available:', error);
    }
  }

  private async initializeKnowledgeGalaxy(): Promise<void> {
    try {
      // Import Knowledge Galaxy Engine
      const { KnowledgeGalaxyEngine } = await import('../../knowledge-galaxy');
      const galaxy = KnowledgeGalaxyEngine.getInstance();
      this.integrations.set('knowledgeGalaxy', galaxy);
    } catch (error) {
      console.warn('Knowledge Galaxy Integration not available:', error);
    }
  }

  private async initializeQuizEngine(): Promise<void> {
    try {
      // Import Quiz Engine
      const { QuizEngine } = await import('../../quiz-engine');
      const quiz = QuizEngine.getInstance();
      this.integrations.set('quizEngine', quiz);
    } catch (error) {
      console.warn('Quiz Engine Integration not available:', error);
    }
  }

  private async initializeExamSimulator(): Promise<void> {
    try {
      // Import Exam Simulator
      const { ExamSimulatorEngine } = await import('../../exam-simulator');
      const exam = ExamSimulatorEngine.getInstance();
      this.integrations.set('examSimulator', exam);
    } catch (error) {
      console.warn('Exam Simulator Integration not available:', error);
    }
  }

  private async initializeAnalytics(): Promise<void> {
    try {
      // Analytics integration - uses global analytics
      const analytics = (window as any).MargeOS?.Analytics;
      if (analytics) {
        this.integrations.set('analytics', analytics);
      }
    } catch (error) {
      console.warn('Analytics Integration not available:', error);
    }
  }

  private async initializeWorldBuilder(): Promise<void> {
    try {
      // World Builder integration
      const worldBuilder = (window as any).MargeOS?.WorldBuilder;
      if (worldBuilder) {
        this.integrations.set('worldBuilder', worldBuilder);
      }
    } catch (error) {
      console.warn('World Builder Integration not available:', error);
    }
  }

  // ==================== Smart PDF Integration ====================

  async linkPDFToMessage(
    messageId: string,
    pdfId: string,
    pageNumber: number,
    context?: string
  ): Promise<EducationalLink | null> {
    const smartPDF = this.integrations.get('smartPDF');
    if (!smartPDF) return null;

    try {
      const pdfData = await smartPDF.getPDF(pdfId);
      if (!pdfData) return null;

      const link: EducationalLink = {
        id: `PDF-LINK-${Date.now()}`,
        type: 'pdf',
        targetId: pdfId,
        targetType: 'pdf',
        url: `/pdf/${pdfId}?page=${pageNumber}`,
        title: pdfData.title || 'PDF Document',
        pageNumber,
        context: context || '',
        metadata: {
          pdfTitle: pdfData.title,
          chapter: pdfData.chapters?.find((c: any) => c.page <= pageNumber && c.endPage >= pageNumber)?.title,
          createdAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      };

      return link;
    } catch (error) {
      console.error('Failed to link PDF:', error);
      return null;
    }
  }

  async getPDFContext(
    pdfId: string,
    pageNumber: number
  ): Promise<{ text: string; concepts: string[]; formulas: string[] } | null> {
    const smartPDF = this.integrations.get('smartPDF');
    if (!smartPDF) return null;

    try {
      return await smartPDF.getPageContext(pdfId, pageNumber);
    } catch (error) {
      console.error('Failed to get PDF context:', error);
      return null;
    }
  }

  // ==================== AI Tutor Integration ====================

  async explainConceptInContext(
    concept: string,
    context: {
      classroomId: string;
      channelId: string;
      userId: string;
      linkedContent?: LinkedContent[];
    }
  ): Promise<{ explanation: string; relatedContent: LinkedContent[] } | null> {
    const aiTutor = this.integrations.get('aiTutor');
    if (!aiTutor) return null;

    try {
      const explanation = await aiTutor.explainConcept(concept, {
        userId: context.userId,
        topic: context.linkedContent?.[0]?.title
      });

      const relatedContent = await this.findRelatedContent(concept, context);

      return {
        explanation,
        relatedContent
      };
    } catch (error) {
      console.error('Failed to explain concept:', error);
      return null;
    }
  }

  async generateQuizFromDiscussion(
    messages: Message[],
    context: {
      classroomId: string;
      channelId: string;
      difficulty?: 'easy' | 'medium' | 'hard';
    }
  ): Promise<any | null> {
    const aiTutor = this.integrations.get('aiTutor');
    const quizEngine = this.integrations.get('quizEngine');
    if (!aiTutor || !quizEngine) return null;

    try {
      // Extract key topics from messages
      const topics = await aiTutor.extractTopics(messages);
      if (!topics.length) return null;

      // Generate quiz based on topics
      return await quizEngine.generateQuiz({
        topics,
        difficulty: context.difficulty || 'medium',
        questionCount: 5
      });
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      return null;
    }
  }

  // ==================== Formula Integration ====================

  async linkFormulaToMessage(
    messageId: string,
    formula: string,
    context?: string
  ): Promise<EducationalLink | null> {
    const formulaEngine = this.integrations.get('formula');
    if (!formulaEngine) return null;

    try {
      const formulaData = await formulaEngine.getFormulaByExpression(formula);
      if (!formulaData) return null;

      const link: EducationalLink = {
        id: `FORMULA-LINK-${Date.now()}`,
        type: 'formula',
        targetId: formulaData.id,
        targetType: 'formula',
        url: `/formula/${formulaData.id}`,
        title: formulaData.name || 'Formula',
        context: context || formula,
        metadata: {
          expression: formula,
          explanation: formulaData.explanation,
          createdAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      };

      return link;
    } catch (error) {
      console.error('Failed to link formula:', error);
      return null;
    }
  }

  async explainFormula(formula: string, context?: any): Promise<{
    explanation: string;
    variables: { name: string; description: string }[];
    examples: string[];
  } | null> {
    const formulaEngine = this.integrations.get('formula');
    if (!formulaEngine) return null;

    try {
      return await formulaEngine.explainFormula(formula, context);
    } catch (error) {
      console.error('Failed to explain formula:', error);
      return null;
    }
  }

  // ==================== Reference Book Integration ====================

  async linkReferenceToMessage(
    messageId: string,
    referenceId: string,
    excerpt?: string
  ): Promise<EducationalLink | null> {
    const referenceBook = this.integrations.get('referenceBook');
    if (!referenceBook) return null;

    try {
      const reference = await referenceBook.getReference(referenceId);
      if (!reference) return null;

      const link: EducationalLink = {
        id: `REF-LINK-${Date.now()}`,
        type: 'reference_book',
        targetId: referenceId,
        targetType: 'reference_book',
        url: `/reference/${referenceId}`,
        title: reference.title || 'Reference',
        context: excerpt || '',
        metadata: {
          author: reference.author,
          source: reference.source,
          createdAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      };

      return link;
    } catch (error) {
      console.error('Failed to link reference:', error);
      return null;
    }
  }

  async searchReferences(
    query: string,
    options?: {
      limit?: number;
      types?: string[];
    }
  ): Promise<LinkedContent[]> {
    const referenceBook = this.integrations.get('referenceBook');
    if (!referenceBook) return [];

    try {
      const results = await referenceBook.searchReferences(query, options);
      return results.map((ref: any) => ({
        type: 'reference_book' as const,
        id: ref.id,
        title: ref.title,
        excerpt: ref.excerpt,
        metadata: ref
      }));
    } catch (error) {
      console.error('Failed to search references:', error);
      return [];
    }
  }

  // ==================== Visual Learning Integration ====================

  async generateConceptMap(
    topic: string,
    context: {
      classroomId: string;
      userId: string;
    }
  ): Promise<any | null> {
    const visualLearning = this.integrations.get('visualLearning');
    if (!visualLearning) return null;

    try {
      return await visualLearning.generateConceptMap(topic, {
        userId: context.userId,
        classroomId: context.classroomId
      });
    } catch (error) {
      console.error('Failed to generate concept map:', error);
      return null;
    }
  }

  async linkVisualToMessage(
    messageId: string,
    visualType: 'mindmap' | 'flowchart' | 'diagram',
    content: any
  ): Promise<EducationalLink | null> {
    const visualLearning = this.integrations.get('visualLearning');
    if (!visualLearning) return null;

    try {
      const visual = await visualLearning.createVisual(visualType, content);
      if (!visual) return null;

      const link: EducationalLink = {
        id: `VISUAL-LINK-${Date.now()}`,
        type: 'visual',
        targetId: visual.id,
        targetType: visualType,
        url: `/visual/${visual.id}`,
        title: visual.title || `${visualType} Visualization`,
        context: '',
        metadata: {
          visualType,
          createdAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      };

      return link;
    } catch (error) {
      console.error('Failed to link visual:', error);
      return null;
    }
  }

  // ==================== Knowledge Galaxy Integration ====================

  async linkToKnowledgeNode(
    messageId: string,
    nodeId: string,
    context?: string
  ): Promise<EducationalLink | null> {
    const knowledgeGalaxy = this.integrations.get('knowledgeGalaxy');
    if (!knowledgeGalaxy) return null;

    try {
      const node = await knowledgeGalaxy.getNode(nodeId);
      if (!node) return null;

      const link: EducationalLink = {
        id: `NODE-LINK-${Date.now()}`,
        type: 'knowledge_node',
        targetId: nodeId,
        targetType: 'knowledge_node',
        url: `/galaxy/node/${nodeId}`,
        title: node.title || 'Knowledge Node',
        context: context || '',
        metadata: {
          cluster: node.cluster,
          connections: node.connections?.length || 0,
          createdAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      };

      return link;
    } catch (error) {
      console.error('Failed to link to knowledge node:', error);
      return null;
    }
  }

  async findRelatedNodes(
    topic: string,
    options?: { limit?: number; depth?: number }
  ): Promise<LinkedContent[]> {
    const knowledgeGalaxy = this.integrations.get('knowledgeGalaxy');
    if (!knowledgeGalaxy) return [];

    try {
      const nodes = await knowledgeGalaxy.findRelatedNodes(topic, options);
      return nodes.map((node: any) => ({
        type: 'knowledge_node' as const,
        id: node.id,
        title: node.title,
        relevance: node.relevance,
        metadata: node
      }));
    } catch (error) {
      console.error('Failed to find related nodes:', error);
      return [];
    }
  }

  async getLearningPath(
    startNodeId: string,
    endNodeId: string
  ): Promise<any[] | null> {
    const knowledgeGalaxy = this.integrations.get('knowledgeGalaxy');
    if (!knowledgeGalaxy) return null;

    try {
      return await knowledgeGalaxy.getLearningPath(startNodeId, endNodeId);
    } catch (error) {
      console.error('Failed to get learning path:', error);
      return null;
    }
  }

  // ==================== Study Companion Integration ====================

  async createStudyGoal(
    topic: string,
    context: {
      classroomId: string;
      userId: string;
      targetDate?: string;
    }
  ): Promise<any | null> {
    const studyCompanion = this.integrations.get('studyCompanion');
    if (!studyCompanion) return null;

    try {
      return await studyCompanion.createGoal({
        topic,
        userId: context.userId,
        classroomId: context.classroomId,
        targetDate: context.targetDate
      });
    } catch (error) {
      console.error('Failed to create study goal:', error);
      return null;
    }
  }

  async getStudyRecommendations(
    userId: string,
    options?: { limit?: number }
  ): Promise<LinkedContent[]> {
    const studyCompanion = this.integrations.get('studyCompanion');
    if (!studyCompanion) return [];

    try {
      const recommendations = await studyCompanion.getRecommendations(userId, options);
      return recommendations.map((rec: any) => ({
        type: rec.type || 'recommendation',
        id: rec.id,
        title: rec.title,
        relevance: rec.priority,
        metadata: rec
      }));
    } catch (error) {
      console.error('Failed to get study recommendations:', error);
      return [];
    }
  }

  // ==================== Quiz Engine Integration ====================

  async linkQuizToMessage(
    messageId: string,
    quizId: string,
    context?: string
  ): Promise<EducationalLink | null> {
    const quizEngine = this.integrations.get('quizEngine');
    if (!quizEngine) return null;

    try {
      const quiz = await quizEngine.getQuiz(quizId);
      if (!quiz) return null;

      const link: EducationalLink = {
        id: `QUIZ-LINK-${Date.now()}`,
        type: 'quiz',
        targetId: quizId,
        targetType: 'quiz',
        url: `/quiz/${quizId}`,
        title: quiz.title || 'Quiz',
        context: context || '',
        metadata: {
          questionCount: quiz.questions?.length || 0,
          difficulty: quiz.difficulty,
          createdAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      };

      return link;
    } catch (error) {
      console.error('Failed to link quiz:', error);
      return null;
    }
  }

  async generateAdaptiveQuiz(
    topics: string[],
    context: {
      classroomId: string;
      userId: string;
      questionCount?: number;
    }
  ): Promise<any | null> {
    const quizEngine = this.integrations.get('quizEngine');
    if (!quizEngine) return null;

    try {
      return await quizEngine.generateAdaptiveQuiz({
        topics,
        userId: context.userId,
        questionCount: context.questionCount || 10
      });
    } catch (error) {
      console.error('Failed to generate adaptive quiz:', error);
      return null;
    }
  }

  // ==================== Exam Simulator Integration ====================

  async createPracticeExam(
    topics: string[],
    context: {
      classroomId: string;
      userId: string;
      duration?: number;
      questionCount?: number;
    }
  ): Promise<any | null> {
    const examSimulator = this.integrations.get('examSimulator');
    if (!examSimulator) return null;

    try {
      return await examSimulator.createPracticeExam({
        topics,
        userId: context.userId,
        classroomId: context.classroomId,
        duration: context.duration,
        questionCount: context.questionCount
      });
    } catch (error) {
      console.error('Failed to create practice exam:', error);
      return null;
    }
  }

  // ==================== Accessibility Integration ====================

  async getAccessibleContent(
    contentId: string,
    contentType: string,
    accessibilityNeeds: {
      screenReader?: boolean;
      highContrast?: boolean;
      captions?: boolean;
    }
  ): Promise<any | null> {
    const accessibility = this.integrations.get('accessibility');
    if (!accessibility) return null;

    try {
      return await accessibility.getAccessibleVersion(contentId, contentType, accessibilityNeeds);
    } catch (error) {
      console.error('Failed to get accessible content:', error);
      return null;
    }
  }

  async generateAudioDescription(
    visualContent: any
  ): Promise<string | null> {
    const accessibility = this.integrations.get('accessibility');
    if (!accessibility) return null;

    try {
      return await accessibility.generateAudioDescription(visualContent);
    } catch (error) {
      console.error('Failed to generate audio description:', error);
      return null;
    }
  }

  // ==================== Memory Vault Integration ====================

  async saveToMemory(
    content: any,
    context: {
      classroomId: string;
      userId: string;
      type: string;
      tags?: string[];
    }
  ): Promise<boolean> {
    const memoryVault = this.integrations.get('memoryVault');
    if (!memoryVault) return false;

    try {
      await memoryVault.save({
        ...content,
        classroomId: context.classroomId,
        userId: context.userId,
        type: context.type,
        tags: context.tags || [],
        savedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Failed to save to memory:', error);
      return false;
    }
  }

  async retrieveFromMemory(
    context: {
      userId: string;
      query?: string;
      type?: string;
    }
  ): Promise<any[]> {
    const memoryVault = this.integrations.get('memoryVault');
    if (!memoryVault) return [];

    try {
      return await memoryVault.retrieve({
        userId: context.userId,
        query: context.query,
        type: context.type
      });
    } catch (error) {
      console.error('Failed to retrieve from memory:', error);
      return [];
    }
  }

  // ==================== Analytics Integration ====================

  async trackEngagement(
    event: {
      type: string;
      classroomId: string;
      channelId?: string;
      messageId?: string;
      userId: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const analytics = this.integrations.get('analytics');
    if (!analytics) return;

    try {
      await analytics.trackEvent({
        ...event,
        timestamp: new Date().toISOString(),
        source: 'classroom-engine'
      });
    } catch (error) {
      console.error('Failed to track engagement:', error);
    }
  }

  async getEngagementReport(
    classroomId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      groupBy?: 'day' | 'week' | 'month';
    }
  ): Promise<any | null> {
    const analytics = this.integrations.get('analytics');
    if (!analytics) return null;

    try {
      return await analytics.getClassroomReport(classroomId, options);
    } catch (error) {
      console.error('Failed to get engagement report:', error);
      return null;
    }
  }

  // ==================== Utility Methods ====================

  async findRelatedContent(
    topic: string,
    context: {
      classroomId: string;
      channelId: string;
      userId: string;
    }
  ): Promise<LinkedContent[]> {
    const results: LinkedContent[] = [];

    // Search across all integrated engines
    const searchPromises = [
      this.searchReferences(topic, { limit: 3 }),
      this.findRelatedNodes(topic, { limit: 3 }),
      this.getStudyRecommendations(context.userId, { limit: 3 })
    ];

    const searchResults = await Promise.all(searchPromises);
    searchResults.forEach(result => results.push(...result));

    // Remove duplicates and sort by relevance
    const uniqueResults = results.filter((item, index, self) =>
      index === self.findIndex((t) => t.id === item.id)
    );

    return uniqueResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  }

  // ==================== Event System ====================

  subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // ==================== Status Methods ====================

  isInitialized(): boolean {
    return this.initialized;
  }

  getIntegration(name: string): any {
    return this.integrations.get(name);
  }

  isIntegrationAvailable(name: string): boolean {
    return this.integrations.has(name);
  }

  getAvailableIntegrations(): string[] {
    return Array.from(this.integrations.keys());
  }
}

export default MargeOSIntegration;

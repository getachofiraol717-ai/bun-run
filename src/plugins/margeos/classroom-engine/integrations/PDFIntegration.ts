// @ts-nocheck
/**
 * PDFIntegration.ts
 *
 * Integration module for Smart PDF Engine with Classroom Communication Hub.
 * Enables linking PDF pages to messages and conversations.
 */

import { Message, EducationalLink } from '../models';

export interface PDFContext {
  pdfId: string;
  pageNumber: number;
  title?: string;
  chapter?: string;
  excerpt?: string;
  concepts?: string[];
  formulas?: string[];
}

export interface PDFSearchOptions {
  classroomId?: string;
  channelId?: string;
  limit?: number;
}

/**
 * Smart PDF integration for classroom messaging
 */
export class PDFIntegration {
  private static instance: PDFIntegration;
  private smartPDFEngine: any = null;
  private listeners: Map<string, Set<Function>> = new Map();

  private constructor() {}

  static getInstance(): PDFIntegration {
    if (!PDFIntegration.instance) {
      PDFIntegration.instance = new PDFIntegration();
    }
    return PDFIntegration.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Dynamic import of Smart PDF Engine
      const { SmartPDFEngine } = await import('../../smart-pdf-engine');
      this.smartPDFEngine = SmartPDFEngine.getInstance();
      await this.smartPDFEngine.initialize();
      this.emit('initialized', { engine: 'SmartPDF' });
    } catch (error) {
      console.warn('Smart PDF Engine not available:', error);
    }
  }

  /**
   * Link a PDF page to a message
   */
  async linkPDFToMessage(
    messageId: string,
    pdfId: string,
    pageNumber: number,
    options?: {
      highlight?: boolean;
      annotation?: string;
      context?: string;
    }
  ): Promise<EducationalLink | null> {
    if (!this.smartPDFEngine) {
      console.warn('Smart PDF Engine not initialized');
      return null;
    }

    try {
      const pdfData = await this.smartPDFEngine.getPDF(pdfId);
      if (!pdfData) return null;

      // Get page context
      const pageContext = await this.smartPDFEngine.getPageContext(pdfId, pageNumber);

      const link: EducationalLink = {
        id: `PDF-LINK-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        type: 'pdf',
        targetId: pdfId,
        targetType: 'pdf',
        url: `/pdf/${pdfId}?page=${pageNumber}`,
        title: `${pdfData.title || 'PDF'} - Page ${pageNumber}`,
        pageNumber,
        context: options?.context || '',
        metadata: {
          pdfTitle: pdfData.title,
          pdfUrl: pdfData.url,
          chapter: pageContext?.chapter || pdfData.chapters?.find(
            (c: any) => c.page <= pageNumber && c.endPage >= pageNumber
          )?.title,
          excerpt: pageContext?.text?.substring(0, 200),
          concepts: pageContext?.concepts || [],
          formulas: pageContext?.formulas || [],
          highlight: options?.highlight,
          annotation: options?.annotation,
          createdAt: new Date().toISOString(),
          source: 'classroom-engine-pdf-integration'
        },
        createdAt: new Date().toISOString()
      };

      this.emit('pdfLinked', { messageId, link });
      return link;
    } catch (error) {
      console.error('Failed to link PDF to message:', error);
      return null;
    }
  }

  /**
   * Get PDF context for a specific page
   */
  async getPDFContext(pdfId: string, pageNumber: number): Promise<PDFContext | null> {
    if (!this.smartPDFEngine) return null;

    try {
      const pdfData = await this.smartPDFEngine.getPDF(pdfId);
      if (!pdfData) return null;

      const pageContext = await this.smartPDFEngine.getPageContext(pdfId, pageNumber);

      return {
        pdfId,
        pageNumber,
        title: pdfData.title,
        chapter: pageContext?.chapter || pdfData.chapters?.find(
          (c: any) => c.page <= pageNumber && c.endPage >= pageNumber
        )?.title,
        excerpt: pageContext?.text?.substring(0, 500),
        concepts: pageContext?.concepts || [],
        formulas: pageContext?.formulas || []
      };
    } catch (error) {
      console.error('Failed to get PDF context:', error);
      return null;
    }
  }

  /**
   * Search PDFs for content
   */
  async searchPDFs(
    query: string,
    options?: PDFSearchOptions
  ): Promise<Array<{
    pdfId: string;
    title: string;
    pageNumber: number;
    excerpt: string;
    relevance: number;
  }>> {
    if (!this.smartPDFEngine) return [];

    try {
      const results = await this.smartPDFEngine.searchContent(query, {
        classroomId: options?.classroomId,
        channelId: options?.channelId
      });

      return results
        .filter((r: any) => !options?.limit || results.indexOf(r) < options.limit)
        .map((r: any) => ({
          pdfId: r.pdfId,
          title: r.title,
          pageNumber: r.pageNumber,
          excerpt: r.excerpt?.substring(0, 200),
          relevance: r.relevance || 0.5
        }));
    } catch (error) {
      console.error('Failed to search PDFs:', error);
      return [];
    }
  }

  /**
   * Get PDF preview for message attachment
   */
  async getPDFPreview(
    pdfId: string,
    options?: { width?: number; height?: number }
  ): Promise<{
    thumbnail: string;
    pageCount: number;
    title: string;
  } | null> {
    if (!this.smartPDFEngine) return null;

    try {
      const pdf = await this.smartPDFEngine.getPDF(pdfId);
      if (!pdf) return null;

      const thumbnail = await this.smartPDFEngine.generatePreview(pdfId, {
        width: options?.width || 200,
        height: options?.height || 280
      });

      return {
        thumbnail,
        pageCount: pdf.pageCount || 0,
        title: pdf.title || 'Untitled PDF'
      };
    } catch (error) {
      console.error('Failed to get PDF preview:', error);
      return null;
    }
  }

  /**
   * Extract key concepts from PDF discussion
   */
  async extractConceptsFromDiscussion(
    messages: Message[],
    pdfId: string
  ): Promise<string[]> {
    if (!this.smartPDFEngine) return [];

    try {
      const pdfConcepts = await this.smartPDFEngine.getConcepts(pdfId);
      const messageText = messages.map(m => m.content).join(' ');

      // Find intersection of PDF concepts and message concepts
      const messageConcepts = this.extractConceptsFromText(messageText);

      return pdfConcepts.filter((concept: string) =>
        messageConcepts.some(mc =>
          mc.toLowerCase().includes(concept.toLowerCase()) ||
          concept.toLowerCase().includes(mc.toLowerCase())
        )
      );
    } catch (error) {
      console.error('Failed to extract concepts:', error);
      return [];
    }
  }

  private extractConceptsFromText(text: string): string[] {
    // Simple concept extraction (could be enhanced with NLP)
    const words = text.split(/\s+/);
    const concepts: Set<string> = new Set();

    // Extract capitalized phrases and important terms
    const phrasePattern = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g;
    const phrases = text.match(phrasePattern) || [];
    phrases.forEach(p => concepts.add(p));

    // Extract words that appear multiple times
    const wordCounts = new Map<string, number>();
    words.forEach(w => {
      const clean = w.replace(/[^\w]/g, '');
      if (clean.length > 4) {
        wordCounts.set(clean, (wordCounts.get(clean) || 0) + 1);
      }
    });

    wordCounts.forEach((count, word) => {
      if (count >= 3) concepts.add(word);
    });

    return Array.from(concepts);
  }

  /**
   * Create PDF reading assignment from messages
   */
  async createReadingAssignment(
    pdfId: string,
    pages: number[],
    context: {
      classroomId: string;
      channelId: string;
      createdBy: string;
    }
  ): Promise<{
    assignmentId: string;
    pdfId: string;
    pages: number[];
    instructions: string;
  } | null> {
    if (!this.smartPDFEngine) return null;

    try {
      const pdf = await this.smartPDFEngine.getPDF(pdfId);
      if (!pdf) return null;

      const pageContexts = await Promise.all(
        pages.map(p => this.getPDFContext(pdfId, p))
      );

      const assignmentId = `ASSIGN-${Date.now()}`;
      const instructions = `Read pages ${pages.join(', ')} of "${pdf.title}". ` +
        `Key concepts to focus on: ${pageContexts
          .filter(c => c)
          .flatMap(c => c!.concepts || [])
          .filter((c, i, arr) => arr.indexOf(c) === i)
          .slice(0, 5)
          .join(', ')}`;

      this.emit('readingAssignmentCreated', {
        assignmentId,
        pdfId,
        pages,
        context
      });

      return {
        assignmentId,
        pdfId,
        pages,
        instructions
      };
    } catch (error) {
      console.error('Failed to create reading assignment:', error);
      return null;
    }
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
}

export default PDFIntegration;

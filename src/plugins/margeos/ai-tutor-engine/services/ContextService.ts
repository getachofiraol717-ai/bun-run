export interface DocumentPageContext {
  documentId: string;
  pageNumber: number;
  bookTitle?: string;
  chapterTitle?: string;
  pageText?: string;
  concepts?: string[];
  formulas?: string[];
  diagrams?: string[];
}

const contextCache = new Map<string, DocumentPageContext>();

export class ContextService {
  static savePageContext(ctx: DocumentPageContext): void {
    const key = `${ctx.documentId}_${ctx.pageNumber}`;
    contextCache.set(key, ctx);
  }

  static getPageContext(documentId: string, pageNumber: number): DocumentPageContext | null {
    const key = `${documentId}_${pageNumber}`;
    return contextCache.get(key) || null;
  }
}

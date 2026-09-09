import { ContextService, DocumentPageContext } from "../services/ContextService";

export class ContextEngine {
  static setContext(ctx: DocumentPageContext) {
    ContextService.savePageContext(ctx);
  }

  static getContext(docId: string, page: number): DocumentPageContext | null {
    return ContextService.getPageContext(docId, page);
  }
}

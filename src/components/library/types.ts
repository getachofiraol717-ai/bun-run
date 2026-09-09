export interface CompanionContext {
  contentItemId?: string;
  bookTitle: string;
  subject?: string;
  grade?: number;
  currentPage: number;
  totalPages: number;
  /** Extracted plain text of the page currently on screen */
  pageText: string;
  /** Extracted text for the chapter containing the current page (lazy) */
  getChapterText: () => Promise<string>;
  /** Sampled text across the whole book (lazy, capped) */
  getBookSampleText: () => Promise<string>;
  onJumpToPage: (page: number) => void;
  /** Extracted Document Intelligence Context from Smart PDF Engine */
  analysis?: {
    topics?: Array<{ label: string; pages: number[]; definition?: string }>;
    formulas?: Array<{ formula: string; explanation?: string | { text?: string; [key: string]: any }; pageNumber?: number }>;
    chapters?: Array<{ title: string; pageStart: number }>;
    learningPath?: Array<{ title: string; pageStart: number }>;
  };
}

export interface SecondBookRef {
  id: string;
  title: string;
  getText: () => Promise<string>;
}

export type Scope = 'page' | 'chapter' | 'book';
export type SummaryLevel = '30s' | '5min' | 'full';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'adaptive';

export const SCOPE_LABELS: Record<Scope, string> = {
  page: 'This page',
  chapter: 'This chapter',
  book: 'Whole book',
};

export async function resolveScopeText(ctx: CompanionContext, scope: Scope): Promise<string> {
  if (scope === 'chapter') return ctx.getChapterText();
  if (scope === 'book') return ctx.getBookSampleText();
  return ctx.pageText;
}

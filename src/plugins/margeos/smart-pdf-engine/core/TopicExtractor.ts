// Smart PDF Engine — TopicExtractor (Feature 2)
import type { PageText } from "../services/TextExtractionService";
import { buildKnowledgeGraph } from "../services/SemanticAnalysisService";
import { extractCapitalizedPhrases, extractDefinitions, tokenize } from "../utils/topicUtils";
import type { Topic, TopicGraph } from "../types/Topic";

let topicCounter = 0;
function nextTopicId(): string {
  topicCounter += 1;
  return `topic-${topicCounter}`;
}

interface Accumulator {
  label: string;
  kind: Topic["kind"];
  definition: string | null;
  pages: Set<number>;
  count: number;
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export interface TopicExtractorOptions {
  pages: PageText[];
  subject?: string | null;
  /** Cap on distinct topics returned — keeps huge documents from producing thousands of low-value nodes. */
  maxTopics?: number;
  onProgress?: (pagesProcessed: number, totalPages: number) => void;
}

export async function extractTopics(opts: TopicExtractorOptions): Promise<TopicGraph> {
  const acc = new Map<string, Accumulator>();
  const maxTopics = opts.maxTopics ?? 80;

  const bump = (label: string, page: number, kind: Topic["kind"], definition: string | null = null) => {
    const key = label.toLowerCase();
    const entry = acc.get(key);
    if (entry) {
      entry.pages.add(page);
      entry.count += 1;
      if (!entry.definition && definition) entry.definition = definition;
      // Definitions/terms are more specific than a bare keyword — upgrade kind if we learn more.
      if (kind === "definition" || kind === "term") entry.kind = kind;
    } else {
      acc.set(key, { label, kind, definition, pages: new Set([page]), count: 1 });
    }
  };

  for (let i = 0; i < opts.pages.length; i++) {
    const { page, text } = opts.pages[i];
    if (!text) continue;

    for (const word of tokenize(text)) bump(word, page, "keyword");
    for (const phrase of extractCapitalizedPhrases(text)) bump(phrase, page, "concept");
    for (const def of extractDefinitions(text)) bump(def.term, page, "definition", def.definition);

    opts.onProgress?.(i + 1, opts.pages.length);
    if (i % 25 === 24) await yieldToMain();
  }

  let maxCount = 1;
  for (const a of acc.values()) if (a.count > maxCount) maxCount = a.count;
  const topics: Topic[] = [...acc.values()]
    // Drop single-occurrence bare keywords — they're mostly noise, but always
    // keep definitions/terms since those carry explicit pedagogical intent.
    .filter((a) => a.kind !== "keyword" || a.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, maxTopics)
    .map((a) => ({
      id: nextTopicId(),
      label: a.label,
      kind: a.kind,
      definition: a.definition,
      pages: [...a.pages].sort((x, y) => x - y),
      weight: a.count / maxCount,
      subject: opts.subject ?? null,
    }));

  return buildKnowledgeGraph(topics);
}

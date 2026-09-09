// Smart PDF Engine — SemanticAnalysisService (Feature 7)
// Builds a lightweight knowledge graph by measuring how often topics
// co-occur on the same page. This is a well-established, fast heuristic for
// "what relates to what" in a document without requiring an external model
// call — keeping the engine fully offline-capable. The resulting graph is
// shaped so a future LLM-backed pass (e.g. via the AI Tutor edge function)
// could refine edge weights without changing the consuming code.
import type { Topic, TopicEdge, TopicGraph } from "../types/Topic";

export function buildKnowledgeGraph(topics: Topic[]): TopicGraph {
  const edgeMap = new Map<string, number>();

  // Group topics by page for co-occurrence counting.
  const byPage = new Map<number, Topic[]>();
  for (const t of topics) {
    for (const p of t.pages) {
      const list = byPage.get(p) ?? [];
      list.push(t);
      byPage.set(p, list);
    }
  }

  for (const list of byPage.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i].id;
        const b = list[j].id;
        if (a === b) continue;
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
      }
    }
  }

  const maxCount = Math.max(1, ...edgeMap.values());
  const edges: TopicEdge[] = [...edgeMap.entries()].map(([key, count]) => {
    const [source, target] = key.split("|");
    return { source, target, strength: Math.min(1, count / maxCount) };
  });

  return { nodes: topics, edges };
}

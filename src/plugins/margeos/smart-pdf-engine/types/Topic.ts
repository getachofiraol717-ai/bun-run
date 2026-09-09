// Smart PDF Engine — Topic types
// A Topic is a detected keyword/concept/definition/important term. Topics are
// linked into a TopicGraph (concept → related concepts) that the Knowledge
// Galaxy / Memory Vault can later consume.

export type TopicKind = "keyword" | "concept" | "definition" | "term";

export interface Topic {
  id: string;
  label: string;
  kind: TopicKind;
  /** If kind === "definition", the captured definition text. */
  definition: string | null;
  /** Pages where this topic appears. */
  pages: number[];
  /** Relative importance 0–1, derived from frequency + heading proximity. */
  weight: number;
  subject: string | null;
}

export interface TopicEdge {
  source: string; // Topic.id
  target: string; // Topic.id
  /** Co-occurrence strength 0–1 (how often the two topics appear together). */
  strength: number;
}

export interface TopicGraph {
  nodes: Topic[];
  edges: TopicEdge[];
}

/** Topics most strongly related to a given topic, sorted by edge strength. */
export function relatedTopics(graph: TopicGraph, topicId: string, limit = 5): Topic[] {
  const scored = graph.edges
    .filter((e) => e.source === topicId || e.target === topicId)
    .map((e) => ({ id: e.source === topicId ? e.target : e.source, strength: e.strength }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit);
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  return scored.map((s) => byId.get(s.id)).filter((t): t is Topic => Boolean(t));
}

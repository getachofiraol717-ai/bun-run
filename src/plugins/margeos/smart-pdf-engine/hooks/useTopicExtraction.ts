// Smart PDF Engine — useTopicExtraction
import { useMemo, useState } from "react";
import { relatedTopics } from "../types/Topic";
import type { DocumentState } from "../store/smartPDFStore";
import type { Topic } from "../types/Topic";

export interface UseTopicExtractionResult {
  topics: Topic[];
  query: string;
  setQuery: (q: string) => void;
  filtered: Topic[];
  relatedTo: (topicId: string, limit?: number) => Topic[];
}

/** Pair with usePDFAnalysis: `useTopicExtraction(usePDFAnalysis(...))`. */
export function useTopicExtraction(state: Pick<DocumentState, "analysis">): UseTopicExtractionResult {
  const [query, setQuery] = useState("");
  const graph = state.analysis?.topics ?? { nodes: [], edges: [] };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return graph.nodes;
    return graph.nodes.filter((t) => t.label.toLowerCase().includes(q));
  }, [graph.nodes, query]);

  return {
    topics: graph.nodes,
    query,
    setQuery,
    filtered,
    relatedTo: (topicId: string, limit = 5) => relatedTopics(graph, topicId, limit),
  };
}

// AI Tutor Engine — useConceptExplanation (Feature 3, on-demand/lazy)
import { useCallback, useState } from "react";
import type { ExplanationMode } from "../models/StudentProfile";
import type { TeachingResult } from "../models/TeachingResult";

export interface ConceptExplanationState {
  status: "idle" | "loading" | "done" | "error";
  content: string;
  error: string | null;
}

export interface UseConceptExplanationResult extends ConceptExplanationState {
  explain: (conceptLabel: string, mode?: ExplanationMode) => Promise<TeachingResult | null>;
}

export interface ExplainConceptFn {
  (conceptLabel: string, mode?: ExplanationMode, onChunk?: (partial: string) => void): Promise<TeachingResult>;
}

const IDLE_STATE: ConceptExplanationState = { status: "idle", content: "", error: null };

/** Pair with useAITutor: `useConceptExplanation(useAITutor(...).explainConcept)`. */
export function useConceptExplanation(explainConceptFn: ExplainConceptFn): UseConceptExplanationResult {
  const [state, setState] = useState<ConceptExplanationState>(IDLE_STATE);

  const explain = useCallback(
    async (conceptLabel: string, mode?: ExplanationMode): Promise<TeachingResult | null> => {
      setState({ status: "loading", content: "", error: null });
      try {
        const result = await explainConceptFn(conceptLabel, mode, (partial) => setState({ status: "loading", content: partial, error: null }));
        setState({ status: result.message.status === "error" ? "error" : "done", content: result.message.content, error: result.message.error });
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to explain concept.";
        setState({ status: "error", content: "", error: message });
        return null;
      }
    },
    [explainConceptFn]
  );

  return { ...state, explain };
}

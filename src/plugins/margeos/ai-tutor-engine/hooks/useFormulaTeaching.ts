// AI Tutor Engine — useFormulaTeaching (Feature 4, on-demand/lazy)
import { useCallback, useState } from "react";
import type { TeachingResult } from "../models/TeachingResult";

export interface FormulaTeachingState {
  status: "idle" | "loading" | "done" | "error";
  content: string;
  error: string | null;
}

export interface UseFormulaTeachingResult extends FormulaTeachingState {
  teach: (formulaId: string) => Promise<TeachingResult | null>;
}

export interface TeachFormulaFn {
  (formulaId: string, onChunk?: (partial: string) => void): Promise<TeachingResult>;
}

const IDLE_STATE: FormulaTeachingState = { status: "idle", content: "", error: null };

/** Pair with useAITutor: `useFormulaTeaching(useAITutor(...).teachFormula)`. */
export function useFormulaTeaching(teachFormulaFn: TeachFormulaFn): UseFormulaTeachingResult {
  const [state, setState] = useState<FormulaTeachingState>(IDLE_STATE);

  const teach = useCallback(
    async (formulaId: string): Promise<TeachingResult | null> => {
      setState({ status: "loading", content: "", error: null });
      try {
        const result = await teachFormulaFn(formulaId, (partial) => setState({ status: "loading", content: partial, error: null }));
        setState({ status: result.message.status === "error" ? "error" : "done", content: result.message.content, error: result.message.error });
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to teach formula.";
        setState({ status: "error", content: "", error: message });
        return null;
      }
    },
    [teachFormulaFn]
  );

  return { ...state, teach };
}

// Smart PDF Engine — useLearningPath
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { flattenLearningPath, type LearningPath, type LearningPathStep } from "../types/LearningPath";
import { getCompletedSteps, setStepCompleted, subscribe } from "../store/smartPDFStore";
import type { DocumentState } from "../store/smartPDFStore";
import { libraryAiJSON } from "@/components/library/libraryAiClient";

export interface GenerateWithAIInput {
  contextText?: string;
  pageText?: string;
  bookTitle?: string;
  subject?: string;
  grade?: number;
  language?: string;
}

export interface UseLearningPathResult {
  path: LearningPath | null;
  steps: LearningPathStep[];
  progressPercent: number;
  toggleStepCompleted: (stepId: string) => void;
  /** Ask Library AI to generate a learning path when none exists yet. */
  generateWithAI: (input: GenerateWithAIInput) => Promise<LearningPath | null>;
  isGenerating: boolean;
  aiError: string | null;
  source: "analysis" | "ai" | "none";
}

const EMPTY_SET = new Set<string>();

/** Pair with usePDFAnalysis: `useLearningPath(documentId, usePDFAnalysis(...))`. */
export function useLearningPath(
  documentId: string | null,
  state: Pick<DocumentState, "analysis">
): UseLearningPathResult {
  const completed = useSyncExternalStore(
    useCallback((listener) => (documentId ? subscribe(documentId, listener) : () => {}), [documentId]),
    () => (documentId ? getCompletedSteps(documentId) : EMPTY_SET)
  );

  const [aiPath, setAiPath] = useState<LearningPath | null>(null);
  const [isGenerating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const analysisPath = state.analysis?.learningPath ?? null;
  const path = analysisPath ?? aiPath;
  const source: "analysis" | "ai" | "none" = analysisPath ? "analysis" : aiPath ? "ai" : "none";

  const steps = useMemo(() => {
    if (!path) return [];
    return flattenLearningPath(path).map((s) => ({ ...s, completed: completed.has(s.id) }));
  }, [path, completed]);

  const progressPercent = steps.length === 0
    ? 0
    : Math.round((steps.filter((s) => s.completed).length / steps.length) * 100);

  const toggleStepCompleted = useCallback(
    (stepId: string) => {
      if (!documentId) return;
      setStepCompleted(documentId, stepId, !completed.has(stepId));
    },
    [documentId, completed]
  );

  const generateWithAI = useCallback(async (input: GenerateWithAIInput) => {
    setGenerating(true);
    setAiError(null);
    try {
      const res = await libraryAiJSON<{ path?: LearningPath; error?: string }>({
        action: "learning_path",
        contextText: input.contextText ?? "",
        pageText: input.pageText ?? "",
        bookTitle: input.bookTitle ?? "",
        subject: input.subject ?? "",
        grade: input.grade,
        language: input.language ?? "en",
      });
      if (res?.error) setAiError(res.error);
      const next = res?.path && (res.path.beginner || res.path.intermediate || res.path.advanced)
        ? {
            beginner: res.path.beginner ?? [],
            intermediate: res.path.intermediate ?? [],
            advanced: res.path.advanced ?? [],
          }
        : null;
      setAiPath(next);
      return next;
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Failed to generate learning path");
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  return { path, steps, progressPercent, toggleStepCompleted, generateWithAI, isGenerating, aiError, source };
}

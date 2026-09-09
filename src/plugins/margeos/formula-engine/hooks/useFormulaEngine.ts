// @ts-nocheck
// Formula Engine — useFormulaEngine hook
// React hook for accessing formula engine functionality
import { useState, useCallback, useEffect } from "react";
import type { Formula } from "@/plugins/margeos/smart-pdf-engine";
import type {
  EnrichedFormula,
  AgeBand,
  LearningStyle,
  ExplanationMode,
  PracticeQuestion,
  PracticeSession,
} from "../models/FormulaModels";
import {
  enrichFormula,
  analyzeFormula,
  solveProblem,
  createFormulaPracticeSession,
  type FormulaEnrichmentResult,
  type FormulaControllerConfig,
} from "../core/FormulaController";
import { evaluateAnswer } from "../core/PracticeGenerator";

export interface UseFormulaEngineOptions {
  ageBand?: AgeBand;
  learningStyle?: LearningStyle;
  explanationMode?: ExplanationMode;
  autoEnrich?: boolean;
}

const DEFAULT_OPTIONS: UseFormulaEngineOptions = {
  ageBand: "14-16",
  learningStyle: "mixed",
  explanationMode: "detailed",
  autoEnrich: true
};

export function useFormulaEngine(
  formula: Formula | null,
  options: UseFormulaEngineOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [enrichedFormula, setEnrichedFormula] = useState<EnrichedFormula | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [practiceSession, setPracticeSession] = useState<PracticeSession | null>(null);

  // Auto-enrich when formula changes
  useEffect(() => {
    if (formula && opts.autoEnrich) {
      setLoading(true);
      setError(null);

      try {
        const result = enrichFormula(formula, {
          ageBand: opts.ageBand,
          learningStyle: opts.learningStyle,
          explanationMode: opts.explanationMode
        });
        setEnrichedFormula(result.enrichedFormula);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to enrich formula");
      } finally {
        setLoading(false);
      }
    }
  }, [formula, opts.ageBand, opts.learningStyle, opts.explanationMode, opts.autoEnrich]);

  // Manual enrichment
  const enrich = useCallback((customConfig?: Partial<FormulaControllerConfig>) => {
    if (!formula) return;

    setLoading(true);
    setError(null);

    try {
      const result = enrichFormula(formula, {
        ...opts,
        ...customConfig
      });
      setEnrichedFormula(result.enrichedFormula);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to enrich formula");
    } finally {
      setLoading(false);
    }
  }, [formula, opts]);

  // Change explanation mode
  const setExplanationMode = useCallback((mode: ExplanationMode) => {
    if (!formula) return;
    enrich({ explanationMode: mode });
  }, [formula, enrich]);

  // Start practice session
  const startPractice = useCallback(() => {
    if (!formula) return;

    const session = createFormulaPracticeSession(formula, {
      ageBand: opts.ageBand,
      explanationMode: opts.explanationMode
    });
    setPracticeSession(session);
    return session;
  }, [formula, opts.ageBand, opts.explanationMode]);

  // Answer practice question
  const answerQuestion = useCallback((questionId: string, answer: string) => {
    if (!practiceSession) return null;

    const result = evaluateAnswer(practiceSession, questionId, answer);

    // Update session with answer
    setPracticeSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        answers: { ...prev.answers, [questionId]: answer }
      };
    });

    return result;
  }, [practiceSession]);

  // Solve a specific problem
  const solve = useCallback((
    given: Record<string, number>,
    find: string
  ) => {
    if (!formula) return null;

    return solveProblem(formula, given, find, {
      ageBand: opts.ageBand,
      explanationMode: opts.explanationMode
    });
  }, [formula, opts.ageBand, opts.explanationMode]);

  // Get analysis result
  const analysis = useCallback(() => {
    if (!formula) return null;

    return analyzeFormula(formula, {
      ageBand: opts.ageBand,
      learningStyle: opts.learningStyle,
      explanationMode: opts.explanationMode
    });
  }, [formula, opts.ageBand, opts.learningStyle, opts.explanationMode]);

  return {
    // State
    enrichedFormula,
    loading,
    error,
    practiceSession,

    // Actions
    enrich,
    setExplanationMode,
    startPractice,
    answerQuestion,
    solve,
    analysis
  };
}

// Simplified hook for quick formula access
export function useFormula(formula: Formula | null) {
  const [result, setResult] = useState<EnrichedFormula | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!formula) {
      setResult(null);
      return;
    }

    setLoading(true);
    const enriched = enrichFormula(formula);
    setResult(enriched.enrichedFormula);
    setLoading(false);
  }, [formula]);

  return { result, loading };
}

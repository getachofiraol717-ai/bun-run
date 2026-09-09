// Smart PDF Engine — useFormulaDetection
import { useMemo } from "react";
import type { DocumentState } from "../store/smartPDFStore";
import type { Formula, FormulaSubject } from "../types/Formula";

export interface UseFormulaDetectionResult {
  formulas: Formula[];
  bySubject: (subject: FormulaSubject) => Formula[];
  onPage: (pageNumber: number) => Formula[];
  getById: (id: string) => Formula | null;
}

/** Pair with usePDFAnalysis: `useFormulaDetection(usePDFAnalysis(...))`. */
export function useFormulaDetection(state: Pick<DocumentState, "analysis">): UseFormulaDetectionResult {
  const formulas = state.analysis?.formulas ?? [];

  return useMemo(() => {
    const byId = new Map(formulas.map((f) => [f.id, f]));
    return {
      formulas,
      bySubject: (subject: FormulaSubject) => formulas.filter((f) => f.subject === subject),
      onPage: (pageNumber: number) => formulas.filter((f) => f.pageNumber === pageNumber),
      getById: (id: string) => byId.get(id) ?? null,
    };
  }, [formulas]);
}

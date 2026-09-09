// Formula Engine — formulaStore
// Zustand-like store for formula engine state management
import type { Formula } from "@/plugins/margeos/smart-pdf-engine";
import type { EnrichedFormula, AgeBand, LearningStyle, ExplanationMode } from "../models/FormulaModels";
import { enrichFormula } from "../core/FormulaController";

export interface FormulaConfig {
  ageBand: AgeBand;
  learningStyle: LearningStyle;
  explanationMode: ExplanationMode;
}

export interface FormulaState {
  // Configuration
  config: FormulaConfig;

  // Formula data
  currentFormula: Formula | null;
  enrichedFormulas: Map<string, EnrichedFormula>;

  // Practice state
  practiceAttempts: Map<string, number>;
  masteryLevels: Map<string, "not_started" | "introduced" | "practicing" | "mastered">;

  // Actions
  setConfig: (config: Partial<FormulaConfig>) => void;
  setCurrentFormula: (formula: Formula | null) => void;
  enrichCurrentFormula: () => EnrichedFormula | null;
  getEnrichedFormula: (formulaId: string) => EnrichedFormula | null;
  incrementPracticeAttempt: (formulaId: string) => void;
  setMasteryLevel: (formulaId: string, level: "not_started" | "introduced" | "practicing" | "mastered") => void;
  clearFormulaData: () => void;
}

// Default configuration
const DEFAULT_CONFIG: FormulaConfig = {
  ageBand: "14-16",
  learningStyle: "mixed",
  explanationMode: "detailed"
};

// Local storage key
const STORAGE_KEY = "formula_engine_state";

// Simple store implementation (can be replaced with Zustand later)
function createFormulaStore() {
  // State
  let config = { ...DEFAULT_CONFIG };
  let currentFormula: Formula | null = null;
  let enrichedFormulas = new Map<string, EnrichedFormula>();
  let practiceAttempts = new Map<string, number>();
  let masteryLevels = new Map<string, "not_started" | "introduced" | "practicing" | "mastered">();

  // Subscribers
  const subscribers = new Set<() => void>();

  // Load from localStorage if available
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        config = { ...DEFAULT_CONFIG, ...data.config };
        practiceAttempts = new Map(Object.entries(data.practiceAttempts || {}));
        masteryLevels = new Map(Object.entries(data.masteryLevels || {}));
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Save to localStorage
  function saveToStorage() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          config,
          practiceAttempts: Object.fromEntries(practiceAttempts),
          masteryLevels: Object.fromEntries(masteryLevels)
        }));
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  // Notify subscribers
  function notify() {
    subscribers.forEach(fn => fn());
  }

  const store: FormulaState = {
    // Configuration
    get config() { return config; },

    // Formula data
    get currentFormula() { return currentFormula; },
    get enrichedFormulas() { return enrichedFormulas; },

    // Practice state
    get practiceAttempts() { return practiceAttempts; },
    get masteryLevels() { return masteryLevels; },

    // Actions
    setConfig(newConfig) {
      config = { ...config, ...newConfig };
      saveToStorage();
      notify();
    },

    setCurrentFormula(formula) {
      currentFormula = formula;
      notify();
    },

    enrichCurrentFormula() {
      if (!currentFormula) return null;

      // Check cache first
      if (enrichedFormulas.has(currentFormula.id)) {
        return enrichedFormulas.get(currentFormula.id)!;
      }

      // Enrich formula
      const result = enrichFormula(currentFormula, config);
      enrichedFormulas.set(currentFormula.id, result.enrichedFormula);
      notify();
      return result.enrichedFormula;
    },

    getEnrichedFormula(formulaId) {
      return enrichedFormulas.get(formulaId) || null;
    },

    incrementPracticeAttempt(formulaId) {
      const current = practiceAttempts.get(formulaId) || 0;
      practiceAttempts.set(formulaId, current + 1);
      saveToStorage();
      notify();
    },

    setMasteryLevel(formulaId, level) {
      masteryLevels.set(formulaId, level);
      saveToStorage();
      notify();
    },

    clearFormulaData() {
      enrichedFormulas.clear();
      practiceAttempts.clear();
      masteryLevels.clear();
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      notify();
    }
  };

  return store;
}

// Export singleton store
export const formulaStore = createFormulaStore();

// Export store getters for use in components
export function getFormulaConfig(): FormulaConfig {
  return formulaStore.config;
}

export function getCurrentFormula(): Formula | null {
  return formulaStore.currentFormula;
}

export function getEnrichedFormula(formulaId: string): EnrichedFormula | null {
  return formulaStore.getEnrichedFormula(formulaId);
}

export function getMasteryLevel(formulaId: string): "not_started" | "introduced" | "practicing" | "mastered" | undefined {
  return formulaStore.masteryLevels.get(formulaId);
}

// Subscribe to store changes
export function subscribeToFormulaStore(callback: () => void): () => void {
  formulaStore.enrichedFormulas; // Trigger getter access
  const subscribers = new Set<() => void>();
  subscribers.add(callback);
  return () => { subscribers.delete(callback); };
}

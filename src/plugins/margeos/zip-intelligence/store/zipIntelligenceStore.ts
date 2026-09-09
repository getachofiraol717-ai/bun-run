// @ts-nocheck
/**
 * ZIP Intelligence Store
 * Central state management for ZIP Intelligence features
 */

import { Project } from '../models/ProjectModel';
import { AnalysisReport } from '../models/AnalysisReport';
import { BugReport } from '../models/BugReport';
import { Documentation } from '../models/Documentation';
import { DependencyGraph } from '../models/DependencyGraph';

export interface StoreState {
  // Project State
  currentProject: Project | null;
  recentProjects: Array<{ id: string; name: string; uploadedAt: Date }>;
  isLoading: boolean;
  isAnalyzing: boolean;

  // Analysis State
  analysis: AnalysisReport | null;
  bugReport: BugReport | null;
  documentation: Documentation | null;
  dependencyGraph: DependencyGraph | null;

  // UI State
  activeView: 'overview' | 'files' | 'analysis' | 'bugs' | 'docs' | 'search' | 'settings';
  selectedFileId: string | null;
  expandedFolders: Set<string>;
  searchQuery: string;
  searchResults: SearchResult[] | null;

  // Settings
  settings: StoreSettings;

  // Error State
  error: string | null;
  warnings: string[];
}

export interface StoreSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'zh' | 'es' | 'ja';
  autoAnalyze: boolean;
  maxFileSize: number;
  excludedPatterns: string[];
  defaultAnalysisOptions: {
    includeSecurity: boolean;
    includePerformance: boolean;
    includeDocumentation: boolean;
  };
}

export interface SearchResult {
  fileId: string;
  fileName: string;
  filePath: string;
  matches: number;
  preview: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  theme: 'auto',
  language: 'en',
  autoAnalyze: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  excludedPatterns: ['node_modules', '.git', 'dist', 'build', '.next'],
  defaultAnalysisOptions: {
    includeSecurity: true,
    includePerformance: true,
    includeDocumentation: true,
  },
};

const DEFAULT_STATE: StoreState = {
  currentProject: null,
  recentProjects: [],
  isLoading: false,
  isAnalyzing: false,
  analysis: null,
  bugReport: null,
  documentation: null,
  dependencyGraph: null,
  activeView: 'overview',
  selectedFileId: null,
  expandedFolders: new Set(),
  searchQuery: '',
  searchResults: null,
  settings: DEFAULT_SETTINGS,
  error: null,
  warnings: [],
};

export type StoreAction =
  | { type: 'SET_PROJECT'; payload: Project | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_ANALYSIS'; payload: AnalysisReport | null }
  | { type: 'SET_BUG_REPORT'; payload: BugReport | null }
  | { type: 'SET_DOCUMENTATION'; payload: Documentation | null }
  | { type: 'SET_DEPENDENCY_GRAPH'; payload: DependencyGraph | null }
  | { type: 'SET_ACTIVE_VIEW'; payload: StoreState['activeView'] }
  | { type: 'SET_SELECTED_FILE'; payload: string | null }
  | { type: 'TOGGLE_FOLDER'; payload: string }
  | { type: 'SET_EXPANDED_FOLDERS'; payload: Set<string> }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: SearchResult[] | null }
  | { type: 'SET_SETTINGS'; payload: Partial<StoreSettings> }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_WARNING'; payload: string }
  | { type: 'CLEAR_WARNINGS' }
  | { type: 'ADD_RECENT_PROJECT'; payload: { id: string; name: string; uploadedAt: Date } }
  | { type: 'CLEAR_PROJECT' }
  | { type: 'RESET' };

export interface Store extends StoreState {
  dispatch: (action: StoreAction) => void;
  subscribe: (listener: () => void) => () => void;
  getState: () => StoreState;
}

class ZipIntelligenceStore implements Store {
  private state: StoreState;
  private listeners: Set<() => void> = new Set();
  private storageKey = 'zip-intelligence-store';

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): StoreState {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          expandedFolders: new Set(parsed.expandedFolders || []),
          recentProjects: (parsed.recentProjects || []).map((p: { uploadedAt: string }) => ({
            ...p,
            uploadedAt: new Date(p.uploadedAt),
          })),
        };
      }
    } catch (error) {
      console.warn('Failed to load store from storage:', error);
    }

    return { ...DEFAULT_STATE };
  }

  private saveToStorage(): void {
    try {
      const toSave = {
        ...this.state,
        expandedFolders: Array.from(this.state.expandedFolders),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(toSave));
    } catch (error) {
      console.warn('Failed to save store to storage:', error);
    }
  }

  dispatch(action: StoreAction): void {
    this.state = this.reduce(this.state, action);
    this.saveToStorage();

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        console.error('Store listener error:', error);
      }
    }
  }

  private reduce(state: StoreState, action: StoreAction): StoreState {
    switch (action.type) {
      case 'SET_PROJECT':
        return { ...state, currentProject: action.payload, error: null };

      case 'SET_LOADING':
        return { ...state, isLoading: action.payload };

      case 'SET_ANALYZING':
        return { ...state, isAnalyzing: action.payload };

      case 'SET_ANALYSIS':
        return { ...state, analysis: action.payload };

      case 'SET_BUG_REPORT':
        return { ...state, bugReport: action.payload };

      case 'SET_DOCUMENTATION':
        return { ...state, documentation: action.payload };

      case 'SET_DEPENDENCY_GRAPH':
        return { ...state, dependencyGraph: action.payload };

      case 'SET_ACTIVE_VIEW':
        return { ...state, activeView: action.payload };

      case 'SET_SELECTED_FILE':
        return { ...state, selectedFileId: action.payload };

      case 'TOGGLE_FOLDER': {
        const newExpanded = new Set(state.expandedFolders);
        if (newExpanded.has(action.payload)) {
          newExpanded.delete(action.payload);
        } else {
          newExpanded.add(action.payload);
        }
        return { ...state, expandedFolders: newExpanded };
      }

      case 'SET_EXPANDED_FOLDERS':
        return { ...state, expandedFolders: action.payload };

      case 'SET_SEARCH_QUERY':
        return { ...state, searchQuery: action.payload };

      case 'SET_SEARCH_RESULTS':
        return { ...state, searchResults: action.payload };

      case 'SET_SETTINGS':
        return {
          ...state,
          settings: { ...state.settings, ...action.payload },
        };

      case 'SET_ERROR':
        return { ...state, error: action.payload };

      case 'ADD_WARNING':
        return { ...state, warnings: [...state.warnings, action.payload] };

      case 'CLEAR_WARNINGS':
        return { ...state, warnings: [] };

      case 'ADD_RECENT_PROJECT': {
        const filtered = state.recentProjects.filter(
          (p) => p.id !== action.payload.id
        );
        return {
          ...state,
          recentProjects: [action.payload, ...filtered].slice(0, 10),
        };
      }

      case 'CLEAR_PROJECT':
        return {
          ...state,
          currentProject: null,
          analysis: null,
          bugReport: null,
          documentation: null,
          dependencyGraph: null,
          selectedFileId: null,
          searchQuery: '',
          searchResults: null,
          error: null,
          warnings: [],
        };

      case 'RESET':
        return { ...DEFAULT_STATE, settings: state.settings };

      default:
        return state;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): StoreState {
    return this.state;
  }

  // Utility methods
  clearStorage(): void {
    localStorage.removeItem(this.storageKey);
    this.state = { ...DEFAULT_STATE, settings: this.state.settings };
    this.dispatch({ type: 'RESET' });
  }

  exportState(): string {
    return JSON.stringify({
      ...this.state,
      expandedFolders: Array.from(this.state.expandedFolders),
    }, null, 2);
  }

  importState(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      const validState: Partial<StoreState> = {
        settings: parsed.settings,
      };

      this.dispatch({ type: 'SET_SETTINGS', payload: validState.settings || {} });
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let storeInstance: ZipIntelligenceStore | null = null;

export function getStore(): ZipIntelligenceStore {
  if (!storeInstance) {
    storeInstance = new ZipIntelligenceStore();
  }
  return storeInstance;
}

export function resetStore(): void {
  storeInstance = null;
}

// React hook for using the store
export function createStoreHook() {
  const store = getStore();

  return function useStore(): Store {
    // This is a simplified hook - in production, you'd use React context
    return store;
  };
}

export default getStore();

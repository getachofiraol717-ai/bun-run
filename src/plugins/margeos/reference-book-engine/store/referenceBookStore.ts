// Reference Book Engine — referenceBookStore
// Zustand-like store for reference book state management
import type { ReferenceSource } from "../models/ReferenceBook";
import type { SourceComparison, UnifiedConcept, AcademicSummary } from "../models/SourceComparison";
import { referenceController } from "../core/ReferenceController";

export interface ReferenceBookState {
  // Data
  sources: ReferenceSource[];
  comparisons: Map<string, SourceComparison>;
  unifiedConcepts: Map<string, UnifiedConcept>;
  summaries: Map<string, AcademicSummary>;

  // UI State
  selectedSourceId: string | null;
  searchQuery: string;
  filterType: string | null;
  filterSubject: string | null;
  sortBy: "relevance" | "quality" | "date" | "title";
  sortOrder: "asc" | "desc";

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSources: () => Promise<void>;
  addSource: (documentId: string, metadata: any) => Promise<ReferenceSource | null>;
  selectSource: (sourceId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: string | null) => void;
  setFilterSubject: (subject: string | null) => void;
  setSorting: (sortBy: "relevance" | "quality" | "date" | "title", order: "asc" | "desc") => void;
  clearFilters: () => void;
}

// Simple store implementation
function createReferenceBookStore(): ReferenceBookState {
  // State
  let sources: ReferenceSource[] = [];
  let comparisons = new Map<string, SourceComparison>();
  let unifiedConcepts = new Map<string, UnifiedConcept>();
  let summaries = new Map<string, AcademicSummary>();

  let selectedSourceId: string | null = null;
  let searchQuery = "";
  let filterType: string | null = null;
  let filterSubject: string | null = null;
  let sortBy: "relevance" | "quality" | "date" | "title" = "relevance";
  let sortOrder: "asc" | "desc" = "desc";

  let isLoading = false;
  let error: string | null = null;

  // Subscribers
  const subscribers = new Set<() => void>();

  // Notify subscribers
  function notify() {
    subscribers.forEach(fn => fn());
  }

  const store: ReferenceBookState = {
    // Getters
    get sources() { return sources; },
    get comparisons() { return comparisons; },
    get unifiedConcepts() { return unifiedConcepts; },
    get summaries() { return summaries; },
    get selectedSourceId() { return selectedSourceId; },
    get searchQuery() { return searchQuery; },
    get filterType() { return filterType; },
    get filterSubject() { return filterSubject; },
    get sortBy() { return sortBy; },
    get sortOrder() { return sortOrder; },
    get isLoading() { return isLoading; },
    get error() { return error; },

    // Actions
    async loadSources() {
      isLoading = true;
      error = null;
      notify();

      try {
        sources = await referenceController.getAllSources();
        error = null;
      } catch (e) {
        error = e instanceof Error ? e.message : "Failed to load sources";
      } finally {
        isLoading = false;
        notify();
      }
    },

    async addSource(documentId: string, metadata: any) {
      isLoading = true;
      error = null;
      notify();

      try {
        const source = await referenceController.createSource(documentId, metadata);
        sources.push(source);
        error = null;
        notify();
        return source;
      } catch (e) {
        error = e instanceof Error ? e.message : "Failed to add source";
        notify();
        return null;
      } finally {
        isLoading = false;
        notify();
      }
    },

    selectSource(sourceId: string | null) {
      selectedSourceId = sourceId;
      notify();
    },

    setSearchQuery(query: string) {
      searchQuery = query;
      notify();
    },

    setFilterType(type: string | null) {
      filterType = type;
      notify();
    },

    setFilterSubject(subject: string | null) {
      filterSubject = subject;
      notify();
    },

    setSorting(newSortBy: "relevance" | "quality" | "date" | "title", newSortOrder: "asc" | "desc") {
      sortBy = newSortBy;
      sortOrder = newSortOrder;
      notify();
    },

    clearFilters() {
      searchQuery = "";
      filterType = null;
      filterSubject = null;
      sortBy = "relevance";
      sortOrder = "desc";
      notify();
    }
  };

  return store;
}

// Export singleton store
export const referenceBookStore = createReferenceBookStore();

// Selector hooks (for React)
export function getFilteredSources(): ReferenceSource[] {
  let filtered = referenceBookStore.sources;

  // Apply search
  if (referenceBookStore.searchQuery) {
    const query = referenceBookStore.searchQuery.toLowerCase();
    filtered = filtered.filter(s =>
      s.metadata.title.toLowerCase().includes(query) ||
      s.metadata.authors.some(a => a.toLowerCase().includes(query)) ||
      s.topics.some(t => t.name.toLowerCase().includes(query))
    );
  }

  // Apply type filter
  if (referenceBookStore.filterType) {
    filtered = filtered.filter(s => s.metadata.sourceType === referenceBookStore.filterType);
  }

  // Apply subject filter
  if (referenceBookStore.filterSubject) {
    filtered = filtered.filter(s => s.metadata.subject === referenceBookStore.filterSubject);
  }

  // Apply sorting
  const sorted = [...filtered];
  switch (referenceBookStore.sortBy) {
    case "quality":
      sorted.sort((a, b) => referenceBookStore.sortOrder === "desc"
        ? b.confidenceScore - a.confidenceScore
        : a.confidenceScore - b.confidenceScore);
      break;
    case "date":
      sorted.sort((a, b) => referenceBookStore.sortOrder === "desc"
        ? new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        : new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
      break;
    case "title":
      sorted.sort((a, b) => referenceBookStore.sortOrder === "desc"
        ? b.metadata.title.localeCompare(a.metadata.title)
        : a.metadata.title.localeCompare(b.metadata.title));
      break;
  }

  return sorted;
}

// Subscribe to store changes
export function subscribeToStore(callback: () => void): () => void {
  referenceBookStore.loadSources(); // Trigger initial load
  return () => { /* cleanup */ };
}

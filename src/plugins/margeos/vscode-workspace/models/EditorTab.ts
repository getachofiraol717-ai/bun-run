/**
 * EditorTab.ts
 *
 * Model for EditorTab representing open files in the editor.
 */

export type EditorTabState = 'active' | 'inactive' | 'pinned' | 'preview';

export interface EditorTabPosition {
  line: number;
  column: number;
}

export interface EditorTabSelection {
  start: EditorTabPosition;
  end: EditorTabPosition;
  isReversed: boolean;
}

export interface EditorTabViewState {
  scrollTop: number;
  scrollLeft: number;
  viewportX: number;
  viewportY: number;
}

export interface EditorTabHistoryEntry {
  position: EditorTabPosition;
  selection: EditorTabSelection | null;
  timestamp: string;
}

export interface EditorTab {
  id: string;
  fileId: string;
  fileName: string;
  filePath: string;
  language: string;
  content: string;
  originalContent: string;
  state: EditorTabState;
  isDirty: boolean;
  isReadOnly: boolean;
  isLocked: boolean;
  encoding: string;
  eol: '\n' | '\r\n';
  tabSize: number;
  insertSpaces: boolean;
  cursorPosition: EditorTabPosition;
  selection: EditorTabSelection | null;
  viewState: EditorTabViewState;
  history: EditorTabHistoryEntry[];
  historyIndex: number;
  foldState: Record<number, boolean>;
  diagnostics: EditorDiagnostic[];
  linkedDocPath?: string;
  preview?: boolean;
  openedAt: string;
  lastModifiedAt: string;
  lastSavedAt?: string;
}

export interface EditorDiagnostic {
  id: string;
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  source: string;
  code?: string;
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

export interface EditorGroup {
  id: string;
  tabs: EditorTab[];
  activeTabId: string | null;
  scrollPosition: number;
  splitDirection: 'horizontal' | 'vertical' | null;
  splitRatio: number;
}

export interface EditorSession {
  id: string;
  workspaceId: string;
  groups: EditorGroup[];
  activeGroupId: string;
  totalTabs: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Factory functions
 */

export function getDefaultCursorPosition(): EditorTabPosition {
  return { line: 1, column: 1 };
}

export function getDefaultViewState(): EditorTabViewState {
  return {
    scrollTop: 0,
    scrollLeft: 0,
    viewportX: 0,
    viewportY: 0
  };
}

export function createEditorTab(
  fileId: string,
  fileName: string,
  filePath: string,
  language: string,
  content: string = ''
): EditorTab {
  return {
    id: `TAB-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    fileId,
    fileName,
    filePath,
    language,
    content,
    originalContent: content,
    state: 'active',
    isDirty: false,
    isReadOnly: false,
    isLocked: false,
    encoding: 'utf-8',
    eol: '\n',
    tabSize: 2,
    insertSpaces: true,
    cursorPosition: getDefaultCursorPosition(),
    selection: null,
    viewState: getDefaultViewState(),
    history: [],
    historyIndex: -1,
    foldState: {},
    diagnostics: [],
    openedAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString()
  };
}

export function updateTabContent(tab: EditorTab, content: string): EditorTab {
  tab.content = content;
  tab.isDirty = content !== tab.originalContent;
  tab.lastModifiedAt = new Date().toISOString();
  return tab;
}

export function setCursorPosition(tab: EditorTab, line: number, column: number): EditorTab {
  // Save to history before moving
  addHistoryEntry(tab);

  tab.cursorPosition = { line, column };
  tab.viewState.scrollLeft = Math.max(0, column - 1);
  return tab;
}

export function setSelection(tab: EditorTab, selection: EditorTabSelection): EditorTab {
  addHistoryEntry(tab);
  tab.selection = selection;
  return tab;
}

export function addHistoryEntry(tab: EditorTab): void {
  const entry: EditorTabHistoryEntry = {
    position: { ...tab.cursorPosition },
    selection: tab.selection ? { ...tab.selection } : null,
    timestamp: new Date().toISOString()
  };

  // Remove any future history if we're not at the end
  if (tab.historyIndex < tab.history.length - 1) {
    tab.history = tab.history.slice(0, tab.historyIndex + 1);
  }

  tab.history.push(entry);
  tab.historyIndex = tab.history.length - 1;

  // Keep only last 100 entries
  if (tab.history.length > 100) {
    tab.history.shift();
    tab.historyIndex--;
  }
}

export function undo(tab: EditorTab): EditorTab | null {
  if (tab.historyIndex > 0) {
    tab.historyIndex--;
    const entry = tab.history[tab.historyIndex];
    tab.cursorPosition = { ...entry.position };
    tab.selection = entry.selection ? { ...entry.selection } : null;
    return tab;
  }
  return null;
}

export function redo(tab: EditorTab): EditorTab | null {
  if (tab.historyIndex < tab.history.length - 1) {
    tab.historyIndex++;
    const entry = tab.history[tab.historyIndex];
    tab.cursorPosition = { ...entry.position };
    tab.selection = entry.selection ? { ...entry.selection } : null;
    return tab;
  }
  return null;
}

export function pinTab(tab: EditorTab): EditorTab {
  tab.state = 'pinned';
  return tab;
}

export function unpinTab(tab: EditorTab): EditorTab {
  tab.state = 'active';
  return tab;
}

export function markAsSaved(tab: EditorTab): EditorTab {
  tab.originalContent = tab.content;
  tab.isDirty = false;
  tab.lastSavedAt = new Date().toISOString();
  return tab;
}

export function addDiagnostic(tab: EditorTab, diagnostic: Omit<EditorDiagnostic, 'id'>): EditorTab {
  const diag: EditorDiagnostic = {
    ...diagnostic,
    id: `DIAG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  };
  tab.diagnostics.push(diag);
  return tab;
}

export function clearDiagnostics(tab: EditorTab): EditorTab {
  tab.diagnostics = [];
  return tab;
}

export function removeDiagnostic(tab: EditorTab, diagnosticId: string): EditorTab {
  tab.diagnostics = tab.diagnostics.filter(d => d.id !== diagnosticId);
  return tab;
}

export function getDiagnosticSummary(tab: EditorTab): { errors: number; warnings: number; infos: number } {
  return tab.diagnostics.reduce(
    (acc, d) => {
      if (d.severity === 'error') acc.errors++;
      else if (d.severity === 'warning') acc.warnings++;
      else if (d.severity === 'info') acc.infos++;
      return acc;
    },
    { errors: 0, warnings: 0, infos: 0 }
  );
}

export function toggleFold(tab: EditorTab, line: number): EditorTab {
  tab.foldState[line] = !tab.foldState[line];
  return tab;
}

export function createEditorGroup(id: string): EditorGroup {
  return {
    id,
    tabs: [],
    activeTabId: null,
    scrollPosition: 0,
    splitDirection: null,
    splitRatio: 0.5
  };
}

export function addTabToGroup(group: EditorGroup, tab: EditorTab): EditorGroup {
  const existing = group.tabs.find(t => t.fileId === tab.fileId);
  if (!existing) {
    group.tabs.push(tab);
  }
  group.activeTabId = tab.id;
  return group;
}

export function removeTabFromGroup(group: EditorGroup, tabId: string): EditorGroup {
  const index = group.tabs.findIndex(t => t.id === tabId);
  if (index > -1) {
    group.tabs.splice(index, 1);

    // Update active tab
    if (group.activeTabId === tabId) {
      group.activeTabId = group.tabs[Math.min(index, group.tabs.length - 1)]?.id || null;
    }
  }
  return group;
}

export function setActiveTab(group: EditorGroup, tabId: string): EditorGroup {
  if (group.tabs.find(t => t.id === tabId)) {
    group.activeTabId = tabId;
  }
  return group;
}

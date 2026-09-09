/**
 * EditorManager.ts
 *
 * Engine for managing code editor operations, multi-tab support, and editing features.
 */

import {
  EditorTab,
  EditorTabState,
  EditorTabPosition,
  EditorTabSelection,
  EditorGroup,
  EditorDiagnostic,
  EditorSession,
  createEditorTab,
  updateTabContent,
  setCursorPosition,
  setSelection,
  pinTab,
  unpinTab,
  markAsSaved,
  addDiagnostic,
  clearDiagnostics,
  removeDiagnostic,
  getDiagnosticSummary,
  undo,
  redo,
  createEditorGroup,
  addTabToGroup,
  removeTabFromGroup,
  setActiveTab
} from '../models/EditorTab';

const STORAGE_KEY = 'editor_manager_data';

export interface EditorAction {
  type: 'edit' | 'cursor' | 'selection' | 'scroll';
  tabId: string;
  timestamp: string;
  data: any;
}

export interface FindReplaceOptions {
  find: string;
  replace?: string;
  isRegex: boolean;
  matchCase: boolean;
  wholeWord: boolean;
  searchUp: boolean;
  wrapAround: boolean;
}

export interface EditorStats {
  totalEdits: number;
  charactersTyped: number;
  linesAdded: number;
  linesDeleted: number;
  searchesPerformed: number;
  replacementsMade: number;
}

export class EditorManager {
  private static instance: EditorManager;
  private sessions: Map<string, EditorSession> = new Map();
  private activeSessionId: string | null = null;
  private history: EditorAction[] = [];
  private stats: EditorStats = {
    totalEdits: 0,
    charactersTyped: 0,
    linesAdded: 0,
    linesDeleted: 0,
    searchesPerformed: 0,
    replacementsMade: 0
  };
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;
  private maxHistorySize: number = 1000;

  private constructor() {
    this.loadState();
  }

  static getInstance(): EditorManager {
    if (!EditorManager.instance) {
      EditorManager.instance = new EditorManager();
    }
    return EditorManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadState();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.activeSessionId = data.activeSessionId || null;
        this.stats = data.stats || this.stats;
      }
    } catch (error) {
      console.error('Failed to load editor state:', error);
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        activeSessionId: this.activeSessionId,
        stats: this.stats
      }));
    } catch (error) {
      console.error('Failed to save editor state:', error);
    }
  }

  // Session Management
  createSession(workspaceId: string): EditorSession {
    const session: EditorSession = {
      id: `SESSION-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      workspaceId,
      groups: [createEditorGroup(`GROUP-${Date.now()}-0`)],
      activeGroupId: 'GROUP-0',
      totalTabs: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;
    this.saveState();
    this.emit('sessionCreated', session);

    return session;
  }

  getSession(sessionId: string): EditorSession | undefined {
    return this.sessions.get(sessionId);
  }

  getActiveSession(): EditorSession | undefined {
    return this.activeSessionId ? this.sessions.get(this.activeSessionId) : undefined;
  }

  setActiveSession(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      this.activeSessionId = sessionId;
      this.saveState();
      this.emit('activeSessionChanged', { sessionId });
    }
  }

  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted && this.activeSessionId === sessionId) {
      this.activeSessionId = this.sessions.size > 0
        ? Array.from(this.sessions.keys())[0]
        : null;
    }
    this.saveState();
    this.emit('sessionDeleted', { sessionId });
    return deleted;
  }

  // Tab Management
  openFile(
    sessionId: string,
    fileId: string,
    fileName: string,
    filePath: string,
    language: string,
    content: string = ''
  ): EditorTab | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const activeGroup = session.groups.find(g => g.id === session.activeGroupId);
    if (!activeGroup) return undefined;

    // Check if file is already open
    const existingTab = activeGroup.tabs.find(t => t.fileId === fileId);
    if (existingTab) {
      this.setActiveTab(sessionId, activeGroup.id, existingTab.id);
      return existingTab;
    }

    // Create new tab
    const tab = createEditorTab(fileId, fileName, filePath, language, content);
    addTabToGroup(activeGroup, tab);
    session.totalTabs++;
    session.updatedAt = new Date().toISOString();

    this.saveState();
    this.emit('fileOpened', { sessionId, groupId: activeGroup.id, tab });

    return tab;
  }

  closeFile(sessionId: string, tabId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    for (const group of session.groups) {
      const index = group.tabs.findIndex(t => t.id === tabId);
      if (index > -1) {
        const tab = group.tabs[index];
        removeTabFromGroup(group, tabId);
        session.totalTabs--;
        session.updatedAt = new Date().toISOString();

        this.saveState();
        this.emit('fileClosed', { sessionId, groupId: group.id, tabId, fileName: tab.fileName });

        return true;
      }
    }
    return false;
  }

  closeOtherFiles(sessionId: string, keepTabId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;

    let closedCount = 0;
    for (const group of session.groups) {
      const tabsToClose = group.tabs.filter(t => t.id !== keepTabId && t.state !== 'pinned');
      tabsToClose.forEach(tab => {
        removeTabFromGroup(group, tab.id);
        closedCount++;
      });
      session.totalTabs -= tabsToClose.length;
    }

    if (closedCount > 0) {
      session.updatedAt = new Date().toISOString();
      this.saveState();
      this.emit('otherFilesClosed', { sessionId, closedCount });
    }

    return closedCount;
  }

  closeAllFiles(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;

    let closedCount = 0;
    for (const group of session.groups) {
      const pinnedTabs = group.tabs.filter(t => t.state === 'pinned');
      group.tabs = pinnedTabs;
      closedCount = session.totalTabs - pinnedTabs.length;
      session.totalTabs = pinnedTabs.length;
      group.activeTabId = pinnedTabs[0]?.id || null;
    }

    if (closedCount > 0) {
      session.updatedAt = new Date().toISOString();
      this.saveState();
      this.emit('allFilesClosed', { sessionId, closedCount });
    }

    return closedCount;
  }

  setActiveTab(sessionId: string, groupId: string, tabId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const group = session.groups.find(g => g.id === groupId);
    if (!group) return;

    setActiveTab(group, tabId);
    session.activeGroupId = groupId;
    session.updatedAt = new Date().toISOString();

    const tab = group.tabs.find(t => t.id === tabId);
    this.saveState();
    this.emit('activeTabChanged', { sessionId, groupId, tabId, tab });
  }

  pinTab(sessionId: string, tabId: string): void {
    const tab = this.findTab(sessionId, tabId);
    if (tab) {
      pinTab(tab);
      this.saveState();
      this.emit('tabPinned', { sessionId, tabId });
    }
  }

  unpinTab(sessionId: string, tabId: string): void {
    const tab = this.findTab(sessionId, tabId);
    if (tab) {
      unpinTab(tab);
      this.saveState();
      this.emit('tabUnpinned', { sessionId, tabId });
    }
  }

  private findTab(sessionId: string, tabId: string): EditorTab | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    for (const group of session.groups) {
      const tab = group.tabs.find(t => t.id === tabId);
      if (tab) return tab;
    }
    return undefined;
  }

  private findTabByFileId(sessionId: string, fileId: string): EditorTab | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    for (const group of session.groups) {
      const tab = group.tabs.find(t => t.fileId === fileId);
      if (tab) return tab;
    }
    return undefined;
  }

  // Content Editing
  updateContent(sessionId: string, tabId: string, content: string): EditorTab | undefined {
    const tab = this.findTab(sessionId, tabId);
    if (!tab) return undefined;

    const oldLines = tab.content.split('\n').length;
    const newLines = content.split('\n').length;

    updateTabContent(tab, content);

    // Update stats
    this.stats.totalEdits++;
    this.stats.charactersTyped += Math.abs(content.length - tab.content.length);
    this.stats.linesAdded += Math.max(0, newLines - oldLines);
    this.stats.linesDeleted += Math.max(0, oldLines - newLines);

    this.addToHistory({ type: 'edit', tabId, timestamp: new Date().toISOString(), data: { content } });
    this.saveState();
    this.emit('contentChanged', { sessionId, tabId, content });

    return tab;
  }

  saveFile(sessionId: string, tabId: string): EditorTab | undefined {
    const tab = this.findTab(sessionId, tabId);
    if (!tab) return undefined;

    markAsSaved(tab);
    this.saveState();
    this.emit('fileSaved', { sessionId, tabId, fileName: tab.fileName });

    return tab;
  }

  saveAllFiles(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;

    let savedCount = 0;
    for (const group of session.groups) {
      group.tabs.forEach(tab => {
        if (tab.isDirty) {
          markAsSaved(tab);
          savedCount++;
        }
      });
    }

    if (savedCount > 0) {
      session.updatedAt = new Date().toISOString();
      this.saveState();
      this.emit('allFilesSaved', { sessionId, savedCount });
    }

    return savedCount;
  }

  // Cursor and Selection
  setCursor(sessionId: string, tabId: string, line: number, column: number): EditorTab | undefined {
    const tab = this.findTab(sessionId, tabId);
    if (!tab) return undefined;

    setCursorPosition(tab, line, column);
    this.addToHistory({ type: 'cursor', tabId, timestamp: new Date().toISOString(), data: { line, column } });
    this.emit('cursorMoved', { sessionId, tabId, position: { line, column } });

    return tab;
  }

  setSelection(sessionId: string, tabId: string, selection: EditorTabSelection): EditorTab | undefined {
    const tab = this.findTab(sessionId, tabId);
    if (!tab) return undefined;

    setSelection(tab, selection);
    this.addToHistory({ type: 'selection', tabId, timestamp: new Date().toISOString(), data: { selection } });
    this.emit('selectionChanged', { sessionId, tabId, selection });

    return tab;
  }

  goToLine(sessionId: string, tabId: string, line: number): EditorTab | undefined {
    const tab = this.findTab(sessionId, tabId);
    if (!tab) return undefined;

    const maxLine = tab.content.split('\n').length;
    setCursorPosition(tab, Math.min(line, maxLine), 1);
    this.emit('lineNavigated', { sessionId, tabId, line });

    return tab;
  }

  // Undo/Redo
  undo(sessionId: string, tabId: string): EditorTab | null {
    const tab = this.findTab(sessionId, tabId);
    if (!tab) return null;

    const result = undo(tab);
    if (result) {
      this.emit('undoPerformed', { sessionId, tabId });
    }
    return result;
  }

  redo(sessionId: string, tabId: string): EditorTab | null {
    const tab = this.findTab(sessionId, tabId);
    if (!tab) return null;

    const result = redo(tab);
    if (result) {
      this.emit('redoPerformed', { sessionId, tabId });
    }
    return result;
  }

  canUndo(sessionId: string, tabId: string): boolean {
    const tab = this.findTab(sessionId, tabId);
    return tab ? tab.historyIndex > 0 : false;
  }

  canRedo(sessionId: string, tabId: string): boolean {
    const tab = this.findTab(sessionId, tabId);
    return tab ? tab.historyIndex < tab.history.length - 1 : false;
  }

  // Diagnostics
  addDiagnostic(sessionId: string, tabId: string, diagnostic: Omit<EditorDiagnostic, 'id'>): EditorTab | undefined {
    const tab = this.findTab(sessionId, tabId);
    if (!tab) return undefined;

    addDiagnostic(tab, diagnostic);
    this.saveState();
    this.emit('diagnosticAdded', { sessionId, tabId, diagnostic });

    return tab;
  }

  clearDiagnostics(sessionId: string, tabId: string): EditorTab | undefined {
    const tab = this.findTab(sessionId, tabId);
    if (!tab) return undefined;

    clearDiagnostics(tab);
    this.saveState();
    this.emit('diagnosticsCleared', { sessionId, tabId });

    return tab;
  }

  getDiagnosticSummary(sessionId: string, tabId: string): { errors: number; warnings: number; infos: number } {
    const tab = this.findTab(sessionId, tabId);
    return tab ? getDiagnosticSummary(tab) : { errors: 0, warnings: 0, infos: 0 };
  }

  // Find and Replace
  find(sessionId: string, tabId: string, options: FindReplaceOptions): Array<{ start: EditorTabPosition; end: EditorTabPosition }> {
    const tab = this.findTab(sessionId, tabId);
    if (!tab) return [];

    this.stats.searchesPerformed++;
    const results: Array<{ start: EditorTabPosition; end: EditorTabPosition }> = [];
    const lines = tab.content.split('\n');

    const searchPattern = options.isRegex
      ? new RegExp(options.find, options.matchCase ? 'g' : 'gi')
      : null;

    lines.forEach((line, lineIndex) => {
      let searchText = line;
      let match;

      if (searchPattern) {
        while ((match = searchPattern.exec(line)) !== null) {
          results.push({
            start: { line: lineIndex + 1, column: match.index + 1 },
            end: { line: lineIndex + 1, column: match.index + match[0].length + 1 }
          });
        }
      } else {
        const lowerLine = options.matchCase ? line : line.toLowerCase();
        const lowerFind = options.matchCase ? options.find : options.find.toLowerCase();
        let index = 0;

        while ((index = lowerLine.indexOf(lowerFind, index)) !== -1) {
          if (options.wholeWord) {
            const before = index === 0 || /\s/.test(line[index - 1]);
            const after = index + lowerFind.length >= line.length || /\s/.test(line[index + lowerFind.length]);
            if (before && after) {
              results.push({
                start: { line: lineIndex + 1, column: index + 1 },
                end: { line: lineIndex + 1, column: index + options.find.length + 1 }
              });
            }
          } else {
            results.push({
              start: { line: lineIndex + 1, column: index + 1 },
              end: { line: lineIndex + 1, column: index + options.find.length + 1 }
            });
          }
          index++;
        }
      }
    });

    this.emit('findCompleted', { sessionId, tabId, count: results.length });
    return results;
  }

  replace(sessionId: string, tabId: string, options: FindReplaceOptions): number {
    const tab = this.findTab(sessionId, tabId);
    if (!tab || !options.replace) return 0;

    const matches = this.find(sessionId, tabId, options);
    if (matches.length === 0) return 0;

    let content = tab.content;

    // Sort matches in reverse order to preserve positions
    matches.sort((a, b) => {
      if (a.start.line !== b.start.line) return b.start.line - a.start.line;
      return b.start.column - a.start.column;
    });

    matches.forEach(match => {
      const lines = content.split('\n');
      const line = lines[match.start.line - 1];
      const before = line.substring(0, match.start.column - 1);
      const after = line.substring(match.end.column - 1);

      if (options.isRegex) {
        const pattern = new RegExp(options.find, options.matchCase ? 'g' : 'gi');
        lines[match.start.line - 1] = before + line.slice(match.start.column - 1, match.end.column - 1).replace(pattern, options.replace) + after;
      } else {
        lines[match.start.line - 1] = before + options.replace + after;
      }
      content = lines.join('\n');
    });

    this.stats.replacementsMade += matches.length;
    this.updateContent(sessionId, tabId, content);

    this.emit('replaceCompleted', { sessionId, tabId, count: matches.length });
    return matches.length;
  }

  replaceAll(sessionId: string, tabId: string, options: FindReplaceOptions): number {
    return this.replace(sessionId, tabId, options);
  }

  // Tab Navigation
  nextTab(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const group = session.groups.find(g => g.id === session.activeGroupId);
    if (!group || group.tabs.length <= 1) return;

    const currentIndex = group.tabs.findIndex(t => t.id === group.activeTabId);
    const nextIndex = (currentIndex + 1) % group.tabs.length;
    this.setActiveTab(sessionId, group.id, group.tabs[nextIndex].id);
  }

  previousTab(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const group = session.groups.find(g => g.id === session.activeGroupId);
    if (!group || group.tabs.length <= 1) return;

    const currentIndex = group.tabs.findIndex(t => t.id === group.activeTabId);
    const prevIndex = (currentIndex - 1 + group.tabs.length) % group.tabs.length;
    this.setActiveTab(sessionId, group.id, group.tabs[prevIndex].id);
  }

  // Group Management
  addGroup(sessionId: string, direction: 'horizontal' | 'vertical'): EditorGroup | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const newGroup = createEditorGroup(`GROUP-${Date.now()}`);
    newGroup.splitDirection = direction;
    session.groups.push(newGroup);
    session.activeGroupId = newGroup.id;
    session.updatedAt = new Date().toISOString();

    this.saveState();
    this.emit('groupAdded', { sessionId, group: newGroup });

    return newGroup;
  }

  removeGroup(sessionId: string, groupId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.groups.length <= 1) return false;

    const index = session.groups.findIndex(g => g.id === groupId);
    if (index === -1) return false;

    session.groups.splice(index, 1);
    if (session.activeGroupId === groupId) {
      session.activeGroupId = session.groups[0].id;
    }
    session.updatedAt = new Date().toISOString();

    this.saveState();
    this.emit('groupRemoved', { sessionId, groupId });

    return true;
  }

  // History
  private addToHistory(action: EditorAction): void {
    this.history.push(action);
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  getHistory(): EditorAction[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
    this.emit('historyCleared', {});
  }

  // Stats
  getStats(): EditorStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalEdits: 0,
      charactersTyped: 0,
      linesAdded: 0,
      linesDeleted: 0,
      searchesPerformed: 0,
      replacementsMade: 0
    };
    this.saveState();
    this.emit('statsReset', {});
  }

  // Events
  subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }
}

export default EditorManager;

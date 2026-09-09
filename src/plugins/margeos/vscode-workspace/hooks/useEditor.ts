/**
 * useEditor.ts
 *
 * React hooks for editor integration.
 */

import { useState, useEffect, useCallback } from 'react';
import { EditorTab, EditorTabPosition } from '../models/EditorTab';
import EditorManager from '../core/EditorManager';

export interface UseEditorOptions {
  autoInitialize?: boolean;
}

export interface UseEditorReturn {
  activeTab: EditorTab | null;
  tabs: EditorTab[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  openFile: (fileId: string, fileName: string, filePath: string, language: string, content?: string) => EditorTab | undefined;
  closeFile: (tabId: string) => boolean;
  closeAllFiles: () => number;
  setActiveTab: (tabId: string) => void;
  updateContent: (tabId: string, content: string) => EditorTab | undefined;
  saveFile: (tabId: string) => EditorTab | undefined;
  saveAllFiles: () => number;
  setCursorPosition: (tabId: string, line: number, column: number) => EditorTab | undefined;
  nextTab: () => void;
  previousTab: () => void;
  undo: (tabId: string) => EditorTab | null;
  redo: (tabId: string) => EditorTab | null;
}

export function useEditor(sessionId?: string, options: UseEditorOptions = {}): UseEditorReturn {
  const { autoInitialize = true } = options;
  const manager = EditorManager.getInstance();

  const [activeTab, setActiveTabState] = useState<EditorTab | null>(null);
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId || null);
  const [isLoading, setIsLoading] = useState(autoInitialize);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }
  }, [autoInitialize]);

  const initialize = async () => {
    try {
      setIsLoading(true);
      await manager.initialize();

      if (sessionId) {
        setActiveSessionId(sessionId);
        loadSessionTabs(sessionId);
      } else {
        const session = manager.getActiveSession();
        if (session) {
          setActiveSessionId(session.id);
          loadSessionTabs(session.id);
        }
      }

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize editor');
      setIsLoading(false);
    }
  };

  const loadSessionTabs = (id: string) => {
    const session = manager.getSession(id);
    if (session && session.groups.length > 0) {
      const activeGroup = session.groups.find(g => g.id === session.activeGroupId);
      if (activeGroup) {
        setTabs(activeGroup.tabs);
        if (activeGroup.activeTabId) {
          const active = activeGroup.tabs.find(t => t.id === activeGroup.activeTabId);
          setActiveTabState(active || null);
        }
      }
    }
  };

  const openFile = useCallback((
    fileId: string,
    fileName: string,
    filePath: string,
    language: string,
    content: string = ''
  ): EditorTab | undefined => {
    if (!activeSessionId) {
      setError('No active session');
      return undefined;
    }

    const tab = manager.openFile(activeSessionId, fileId, fileName, filePath, language, content);
    if (tab) {
      loadSessionTabs(activeSessionId);
      setActiveTabState(tab);
    }
    return tab;
  }, [activeSessionId]);

  const closeFile = useCallback((tabId: string): boolean => {
    if (!activeSessionId) return false;

    const result = manager.closeFile(activeSessionId, tabId);
    if (result) {
      loadSessionTabs(activeSessionId);
      if (activeTab?.id === tabId) {
        const session = manager.getSession(activeSessionId);
        if (session && session.groups.length > 0) {
          const group = session.groups.find(g => g.id === session.activeGroupId);
          if (group && group.tabs.length > 0) {
            setActiveTabState(group.tabs[group.tabs.length - 1]);
          } else {
            setActiveTabState(null);
          }
        }
      }
    }
    return result;
  }, [activeSessionId, activeTab]);

  const closeAllFiles = useCallback((): number => {
    if (!activeSessionId) return 0;
    const count = manager.closeAllFiles(activeSessionId);
    loadSessionTabs(activeSessionId);
    setActiveTabState(null);
    return count;
  }, [activeSessionId]);

  const setActiveTab = useCallback((tabId: string) => {
    if (!activeSessionId) return;

    const session = manager.getSession(activeSessionId);
    if (session && session.groups.length > 0) {
      const group = session.groups.find(g => g.id === session.activeGroupId);
      if (group) {
        manager.setActiveTab(activeSessionId, group.id, tabId);
        const tab = group.tabs.find(t => t.id === tabId);
        if (tab) {
          setActiveTabState(tab);
        }
      }
    }
  }, [activeSessionId]);

  const updateContent = useCallback((tabId: string, content: string): EditorTab | undefined => {
    if (!activeSessionId) return undefined;

    const tab = manager.updateContent(activeSessionId, tabId, content);
    if (tab) {
      loadSessionTabs(activeSessionId);
    }
    return tab;
  }, [activeSessionId]);

  const saveFile = useCallback((tabId: string): EditorTab | undefined => {
    if (!activeSessionId) return undefined;

    const tab = manager.saveFile(activeSessionId, tabId);
    if (tab) {
      loadSessionTabs(activeSessionId);
    }
    return tab;
  }, [activeSessionId]);

  const saveAllFiles = useCallback((): number => {
    if (!activeSessionId) return 0;
    const count = manager.saveAllFiles(activeSessionId);
    loadSessionTabs(activeSessionId);
    return count;
  }, [activeSessionId]);

  const setCursorPosition = useCallback((tabId: string, line: number, column: number): EditorTab | undefined => {
    if (!activeSessionId) return undefined;
    return manager.setCursor(activeSessionId, tabId, line, column);
  }, [activeSessionId]);

  const nextTab = useCallback(() => {
    if (!activeSessionId) return;
    manager.nextTab(activeSessionId);
    loadSessionTabs(activeSessionId);
  }, [activeSessionId]);

  const previousTab = useCallback(() => {
    if (!activeSessionId) return;
    manager.previousTab(activeSessionId);
    loadSessionTabs(activeSessionId);
  }, [activeSessionId]);

  const undo = useCallback((tabId: string): EditorTab | null => {
    if (!activeSessionId) return null;
    return manager.undo(activeSessionId, tabId);
  }, [activeSessionId]);

  const redo = useCallback((tabId: string): EditorTab | null => {
    if (!activeSessionId) return null;
    return manager.redo(activeSessionId, tabId);
  }, [activeSessionId]);

  return {
    activeTab,
    tabs,
    activeSessionId,
    isLoading,
    error,
    openFile,
    closeFile,
    closeAllFiles,
    setActiveTab,
    updateContent,
    saveFile,
    saveAllFiles,
    setCursorPosition,
    nextTab,
    previousTab,
    undo,
    redo
  };
}

export interface UseDebuggerReturn {
  activeSession: any;
  sessions: any[];
  breakpoints: any[];
  isRunning: boolean;
  isPaused: boolean;
  startDebug: (projectId: string, name: string, type: string) => any;
  stopDebug: () => void;
  stepOver: () => void;
  stepInto: () => void;
  stepOut: () => void;
  continue: () => void;
  pause: () => void;
  addBreakpoint: (fileId: string, filePath: string, line: number) => any;
  removeBreakpoint: (breakpointId: string) => boolean;
  toggleBreakpoint: (breakpointId: string) => any;
  addWatch: (expression: string) => any;
  removeWatch: (watchId: string) => boolean;
}

export async function useDebugger(): Promise<UseDebuggerReturn> {
  const manager = (await import('../core/DebugManager')).default.getInstance();

  const [activeSession, setActiveSession] = useState(manager.getActiveSession());
  const [sessions, setSessions] = useState(manager.getAllSessions());
  const [breakpoints, setBreakpoints] = useState(activeSession ? manager.getBreakpoints(activeSession.id) : []);

  useEffect(() => {
    const handleUpdate = () => {
      setActiveSession(manager.getActiveSession());
      setSessions(manager.getAllSessions());
      if (activeSession) {
        setBreakpoints(manager.getBreakpoints(activeSession.id));
      }
    };

    const unsubs: Array<() => void> = [];
    ['sessionCreated', 'sessionStarted', 'sessionStopped', 'breakpointAdded', 'breakpointRemoved'].forEach(event => {
      unsubs.push(manager.subscribe(event, handleUpdate));
    });

    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const isRunning = activeSession?.status === 'running';
  const isPaused = activeSession?.status === 'paused';

  const startDebug = useCallback((projectId: string, name: string, type: string) => {
    const session = manager.createSession(projectId, name, type as any);
    manager.startSession(session.id);
    return session;
  }, []);

  const stopDebug = useCallback(() => {
    if (activeSession) {
      manager.stopSession(activeSession.id);
    }
  }, [activeSession]);

  const stepOver = useCallback(() => {
    if (activeSession) {
      manager.stepOver(activeSession.id);
    }
  }, [activeSession]);

  const stepInto = useCallback(() => {
    if (activeSession) {
      manager.stepInto(activeSession.id);
    }
  }, [activeSession]);

  const stepOut = useCallback(() => {
    if (activeSession) {
      manager.stepOut(activeSession.id);
    }
  }, [activeSession]);

  const continue_ = useCallback(() => {
    if (activeSession) {
      manager.continue(activeSession.id);
    }
  }, [activeSession]);

  const pause = useCallback(() => {
    if (activeSession) {
      manager.pause(activeSession.id);
    }
  }, [activeSession]);

  const addBreakpoint = useCallback((fileId: string, filePath: string, line: number) => {
    if (!activeSession) return undefined;
    return manager.addBreakpoint(activeSession.id, fileId, filePath, line);
  }, [activeSession]);

  const removeBreakpoint = useCallback((breakpointId: string): boolean => {
    if (!activeSession) return false;
    return manager.removeBreakpoint(activeSession.id, breakpointId);
  }, [activeSession]);

  const toggleBreakpoint = useCallback((breakpointId: string) => {
    if (!activeSession) return undefined;
    return manager.toggleBreakpoint(activeSession.id, breakpointId);
  }, [activeSession]);

  const addWatch = useCallback((expression: string) => {
    if (!activeSession) return undefined;
    return manager.addWatch(activeSession.id, expression);
  }, [activeSession]);

  const removeWatch = useCallback((watchId: string): boolean => {
    if (!activeSession) return false;
    return manager.removeWatch(activeSession.id, watchId);
  }, [activeSession]);

  return {
    activeSession,
    sessions,
    breakpoints,
    isRunning,
    isPaused,
    startDebug,
    stopDebug,
    stepOver,
    stepInto,
    stepOut,
    continue: continue_,
    pause,
    addBreakpoint,
    removeBreakpoint,
    toggleBreakpoint,
    addWatch,
    removeWatch
  };
}

export default useEditor;

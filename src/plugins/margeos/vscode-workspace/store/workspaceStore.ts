// @ts-nocheck
/**
 * workspaceStore.ts
 *
 * Zustand store for VSCode Workspace state management.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type WorkspacePanel = 'explorer' | 'search' | 'debug' | 'extensions' | 'output' | 'problems' | 'terminal' | 'ai';
export type EditorLayout = 'single' | 'split-horizontal' | 'split-vertical' | 'grid';

export interface WorkspaceState {
  // Workspace
  currentWorkspaceId: string | null;
  workspaces: Array<{ id: string; name: string; userId: string }>;

  // Projects
  currentProjectId: string | null;
  recentProjects: string[];

  // Editor
  openTabs: Array<{
    id: string;
    fileId: string;
    fileName: string;
    filePath: string;
    language: string;
    content: string;
    isDirty: boolean;
    cursorPosition: { line: number; column: number };
  }>;
  activeTabId: string | null;
  editorLayout: EditorLayout;

  // Panels
  visiblePanels: WorkspacePanel[];
  panelSizes: Record<WorkspacePanel, number>;
  collapsedPanels: WorkspacePanel[];

  // Explorer
  expandedFolders: string[];
  selectedFiles: string[];

  // Debug
  debugSessionId: string | null;
  debugStatus: 'idle' | 'running' | 'paused' | 'stopped';
  breakpoints: Array<{ id: string; fileId: string; line: number; enabled: boolean }>;

  // AI
  aiSessionActive: boolean;
  aiTutorTopic: string | null;

  // Terminal
  terminalOutput: string[];
  terminalHistory: string[];

  // UI State
  theme: 'light' | 'dark' | 'auto';
  sidebarWidth: number;
  activityBarVisible: boolean;
  statusBarVisible: boolean;

  // Actions
  setCurrentWorkspace: (id: string | null) => void;
  addWorkspace: (workspace: { id: string; name: string; userId: string }) => void;
  removeWorkspace: (id: string) => void;

  setCurrentProject: (id: string | null) => void;
  addRecentProject: (id: string) => void;

  openTab: (tab: { id: string; fileId: string; fileName: string; filePath: string; language: string; content: string }) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  setEditorLayout: (layout: EditorLayout) => void;

  togglePanel: (panel: WorkspacePanel) => void;
  setPanelSize: (panel: WorkspacePanel, size: number) => void;
  setVisiblePanels: (panels: WorkspacePanel[]) => void;

  toggleFolder: (folderId: string) => void;
  selectFile: (fileId: string, multiSelect?: boolean) => void;
  clearSelection: () => void;

  setDebugSession: (id: string | null) => void;
  setDebugStatus: (status: 'idle' | 'running' | 'paused' | 'stopped') => void;
  addBreakpoint: (bp: { id: string; fileId: string; line: number; enabled: boolean }) => void;
  removeBreakpoint: (id: string) => void;
  toggleBreakpoint: (id: string) => void;

  setAiSessionActive: (active: boolean) => void;
  setAiTutorTopic: (topic: string | null) => void;

  appendTerminalOutput: (output: string) => void;
  clearTerminalOutput: () => void;

  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setSidebarWidth: (width: number) => void;
  toggleActivityBar: () => void;
  toggleStatusBar: () => void;

  reset: () => void;
}

const initialState = {
  currentWorkspaceId: null,
  workspaces: [],
  currentProjectId: null,
  recentProjects: [],
  openTabs: [],
  activeTabId: null,
  editorLayout: 'single' as EditorLayout,
  visiblePanels: ['explorer', 'editor'] as WorkspacePanel[],
  panelSizes: {
    explorer: 250,
    search: 300,
    debug: 300,
    extensions: 250,
    output: 200,
    problems: 150,
    terminal: 250,
    ai: 300
  },
  collapsedPanels: [] as WorkspacePanel[],
  expandedFolders: [],
  selectedFiles: [],
  debugSessionId: null,
  debugStatus: 'idle' as const,
  breakpoints: [],
  aiSessionActive: false,
  aiTutorTopic: null,
  terminalOutput: [],
  terminalHistory: [],
  theme: 'dark' as const,
  sidebarWidth: 50,
  activityBarVisible: true,
  statusBarVisible: true
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Workspace Actions
      setCurrentWorkspace: (id) => set({ currentWorkspaceId: id }),

      addWorkspace: (workspace) => set((state) => ({
        workspaces: [...state.workspaces.filter(w => w.id !== workspace.id), workspace]
      })),

      removeWorkspace: (id) => set((state) => ({
        workspaces: state.workspaces.filter(w => w.id !== id),
        currentWorkspaceId: state.currentWorkspaceId === id ? null : state.currentWorkspaceId
      })),

      // Project Actions
      setCurrentProject: (id) => set({ currentProjectId: id }),

      addRecentProject: (id) => set((state) => ({
        recentProjects: [id, ...state.recentProjects.filter(p => p !== id)].slice(0, 10)
      })),

      // Tab Actions
      openTab: (tab) => set((state) => {
        const existing = state.openTabs.find(t => t.fileId === tab.fileId);
        if (existing) {
          return { activeTabId: existing.id };
        }
        return {
          openTabs: [...state.openTabs, { ...tab, id: `TAB-${Date.now()}`, isDirty: false }],
          activeTabId: `TAB-${Date.now()}`
        };
      }),

      closeTab: (tabId) => set((state) => {
        const tabIndex = state.openTabs.findIndex(t => t.id === tabId);
        const newTabs = state.openTabs.filter(t => t.id !== tabId);
        let newActiveId = state.activeTabId;

        if (state.activeTabId === tabId) {
          if (newTabs.length > 0) {
            const newIndex = Math.min(tabIndex, newTabs.length - 1);
            newActiveId = newTabs[newIndex].id;
          } else {
            newActiveId = null;
          }
        }

        return { openTabs: newTabs, activeTabId: newActiveId };
      }),

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      updateTabContent: (tabId, content) => set((state) => ({
        openTabs: state.openTabs.map(t =>
          t.id === tabId ? { ...t, content, isDirty: true } : t
        )
      })),

      setEditorLayout: (layout) => set({ editorLayout: layout }),

      // Panel Actions
      togglePanel: (panel) => set((state) => {
        const isVisible = state.visiblePanels.includes(panel);
        return {
          visiblePanels: isVisible
            ? state.visiblePanels.filter(p => p !== panel)
            : [...state.visiblePanels, panel]
        };
      }),

      setPanelSize: (panel, size) => set((state) => ({
        panelSizes: { ...state.panelSizes, [panel]: size }
      })),

      setVisiblePanels: (panels) => set({ visiblePanels: panels }),

      // Explorer Actions
      toggleFolder: (folderId) => set((state) => ({
        expandedFolders: state.expandedFolders.includes(folderId)
          ? state.expandedFolders.filter(id => id !== folderId)
          : [...state.expandedFolders, folderId]
      })),

      selectFile: (fileId, multiSelect = false) => set((state) => ({
        selectedFiles: multiSelect
          ? state.selectedFiles.includes(fileId)
            ? state.selectedFiles.filter(id => id !== fileId)
            : [...state.selectedFiles, fileId]
          : [fileId]
      })),

      clearSelection: () => set({ selectedFiles: [] }),

      // Debug Actions
      setDebugSession: (id) => set({ debugSessionId: id }),

      setDebugStatus: (status) => set({ debugStatus: status }),

      addBreakpoint: (bp) => set((state) => ({
        breakpoints: [...state.breakpoints.filter(b => b.id !== bp.id), bp]
      })),

      removeBreakpoint: (id) => set((state) => ({
        breakpoints: state.breakpoints.filter(bp => bp.id !== id)
      })),

      toggleBreakpoint: (id) => set((state) => ({
        breakpoints: state.breakpoints.map(bp =>
          bp.id === id ? { ...bp, enabled: !bp.enabled } : bp
        )
      })),

      // AI Actions
      setAiSessionActive: (active) => set({ aiSessionActive: active }),

      setAiTutorTopic: (topic) => set({ aiTutorTopic: topic }),

      // Terminal Actions
      appendTerminalOutput: (output) => set((state) => ({
        terminalOutput: [...state.terminalOutput, output].slice(-1000)
      })),

      clearTerminalOutput: () => set({ terminalOutput: [] }),

      // UI Actions
      setTheme: (theme) => set({ theme }),

      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      toggleActivityBar: () => set((state) => ({
        activityBarVisible: !state.activityBarVisible
      })),

      toggleStatusBar: () => set((state) => ({
        statusBarVisible: !state.statusBarVisible
      })),

      // Reset
      reset: () => set(initialState)
    }),
    {
      name: 'vscode-workspace-storage',
      partialize: (state) => ({
        currentWorkspaceId: state.currentWorkspaceId,
        workspaces: state.workspaces,
        currentProjectId: state.currentProjectId,
        recentProjects: state.recentProjects,
        openTabs: state.openTabs,
        activeTabId: state.activeTabId,
        editorLayout: state.editorLayout,
        visiblePanels: state.visiblePanels,
        panelSizes: state.panelSizes,
        expandedFolders: state.expandedFolders,
        theme: state.theme,
        sidebarWidth: state.sidebarWidth,
        activityBarVisible: state.activityBarVisible,
        statusBarVisible: state.statusBarVisible
      })
    }
  )
);

export default useWorkspaceStore;

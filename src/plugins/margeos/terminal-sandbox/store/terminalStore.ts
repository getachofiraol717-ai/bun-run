/**
 * Terminal Store for Terminal Sandbox
 * Zustand store for terminal state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  TerminalSession,
  TerminalRuntime,
  Workspace,
  CommandResult,
} from '../models/types';

export interface TerminalState {
  // Session state
  currentSessionId: string | null;
  sessions: TerminalSession[];

  // Terminal state
  output: string;
  isExecuting: boolean;
  isConnected: boolean;

  // Workspace state
  currentWorkspaceId: string | null;
  workspaces: Workspace[];

  // Settings
  settings: TerminalSettings;

  // Actions
  setCurrentSession: (sessionId: string | null) => void;
  addSession: (session: TerminalSession) => void;
  removeSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<TerminalSession>) => void;

  appendOutput: (text: string) => void;
  clearOutput: () => void;
  setIsExecuting: (executing: boolean) => void;
  setIsConnected: (connected: boolean) => void;

  setCurrentWorkspace: (workspaceId: string | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (workspaceId: string) => void;

  updateSettings: (settings: Partial<TerminalSettings>) => void;
  reset: () => void;
}

export interface TerminalSettings {
  fontSize: number;
  fontFamily: string;
  theme: 'light' | 'dark' | 'system';
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  scrollback: number;
  maxOutputLines: number;
  Bell: boolean;
  autoClose: boolean;
  confirmBeforeClose: boolean;
  enableUndo: boolean;
  pasteWithNewlines: boolean;
  cursorColor: string;
  backgroundColor: string;
  foregroundColor: string;
  selectionColor: string;
}

const defaultSettings: TerminalSettings = {
  fontSize: 14,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  theme: 'dark',
  cursorStyle: 'block',
  cursorBlink: true,
  scrollback: 1000,
  maxOutputLines: 10000,
  Bell: true,
  autoClose: false,
  confirmBeforeClose: true,
  enableUndo: true,
  pasteWithNewlines: true,
  cursorColor: '#ffffff',
  backgroundColor: '#1e1e1e',
  foregroundColor: '#d4d4d4',
  selectionColor: '#264f78',
};

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSessionId: null,
      sessions: [],
      output: '',
      isExecuting: false,
      isConnected: false,
      currentWorkspaceId: null,
      workspaces: [],
      settings: defaultSettings,

      // Session actions
      setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),

      addSession: (session) =>
        set((state) => ({
          sessions: [...state.sessions, session],
        })),

      removeSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSessionId:
            state.currentSessionId === sessionId ? null : state.currentSessionId,
        })),

      updateSession: (sessionId, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, ...updates } : s
          ),
        })),

      // Terminal actions
      appendOutput: (text) =>
        set((state) => {
          const maxLines = state.settings.maxOutputLines;
          let newOutput = state.output + text;

          // Trim to max lines
          const lines = newOutput.split('\n');
          if (lines.length > maxLines) {
            newOutput = lines.slice(-maxLines).join('\n');
          }

          return { output: newOutput };
        }),

      clearOutput: () => set({ output: '' }),

      setIsExecuting: (executing) => set({ isExecuting: executing }),

      setIsConnected: (connected) => set({ isConnected: connected }),

      // Workspace actions
      setCurrentWorkspace: (workspaceId) =>
        set({ currentWorkspaceId: workspaceId }),

      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
        })),

      removeWorkspace: (workspaceId) =>
        set((state) => ({
          workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
          currentWorkspaceId:
            state.currentWorkspaceId === workspaceId
              ? null
              : state.currentWorkspaceId,
        })),

      // Settings actions
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Reset to default
      reset: () =>
        set({
          currentSessionId: null,
          sessions: [],
          output: '',
          isExecuting: false,
          isConnected: false,
          currentWorkspaceId: null,
          workspaces: [],
          settings: defaultSettings,
        }),
    }),
    {
      name: 'terminal-sandbox-storage',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);

// Selectors
export const selectCurrentSession = (state: TerminalState): TerminalSession | null =>
  state.sessions.find((s) => s.id === state.currentSessionId) || null;

export const selectCurrentWorkspace = (state: TerminalState): Workspace | null =>
  state.workspaces.find((w) => w.id === state.currentWorkspaceId) || null;

export const selectActiveSessions = (state: TerminalState): TerminalSession[] =>
  state.sessions.filter((s) => s.status === 'active' || s.status === 'idle');

export const selectSettings = (state: TerminalState): TerminalSettings => state.settings;

// Export default
export default useTerminalStore;

// @ts-nocheck
/**
 * useWorkspace.ts
 *
 * React hooks for workspace integration.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Workspace, WorkspacePanel } from '../models/Workspace';
import { Project } from '../models/Project';
import WorkspaceController from '../core/WorkspaceController';
import WorkspacePreferences from '../core/WorkspacePreferences';
import WorkspaceAnalytics from '../core/WorkspaceAnalytics';

export interface UseWorkspaceOptions {
  autoInitialize?: boolean;
  persistState?: boolean;
}

export interface UseWorkspaceReturn {
  workspace: Workspace | null;
  workspaces: Workspace[];
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  createWorkspace: (name: string, userId: string) => Workspace;
  updateWorkspace: (updates: Partial<Workspace>) => void;
  deleteWorkspace: () => boolean;
  setActiveWorkspace: (workspaceId: string) => void;
  createProject: (params: CreateProjectParams) => Project;
  togglePanel: (panel: WorkspacePanel) => void;
  setPanelSize: (panel: WorkspacePanel, size: number) => void;
  executeCommand: (type: string, payload: any) => string;
  refresh: () => void;
}

export interface CreateProjectParams {
  name: string;
  type: 'web' | 'mobile' | 'desktop' | 'api' | 'library' | 'script' | 'data-science' | 'machine-learning' | 'game' | 'other';
  language: string;
  description?: string;
  framework?: string;
}

export function useWorkspace(options: UseWorkspaceOptions = {}): UseWorkspaceReturn {
  const { autoInitialize = true, persistState = true } = options;
  const controller = WorkspaceController.getInstance();
  const preferences = WorkspacePreferences.getInstance();
  const analytics = WorkspaceAnalytics.getInstance();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (autoInitialize && !initialized.current) {
      initialize();
      initialized.current = true;
    }
  }, [autoInitialize]);

  const initialize = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await controller.initialize();

      const allWorkspaces = controller.getAllWorkspaces();
      setWorkspaces(allWorkspaces);

      const activeWorkspace = controller.getActiveWorkspace();
      if (activeWorkspace) {
        setWorkspace(activeWorkspace);
        setProjects(controller.getAllProjects());
      } else if (allWorkspaces.length > 0) {
        controller.setActiveWorkspace(allWorkspaces[0].id);
        setWorkspace(allWorkspaces[0]);
        setProjects(controller.getAllProjects());
      }

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize workspace');
      setIsLoading(false);
    }
  };

  const createWorkspace = useCallback((name: string, userId: string): Workspace => {
    const newWorkspace = controller.createWorkspace(name, userId);
    setWorkspaces(prev => [...prev, newWorkspace]);
    setWorkspace(newWorkspace);
    analytics.trackEvent('workspace', 'workspace', 'create', name);
    return newWorkspace;
  }, []);

  const updateWorkspace = useCallback((updates: Partial<Workspace>) => {
    if (!workspace) return;
    const updated = controller.updateWorkspace(workspace.id, updates);
    if (updated) {
      setWorkspace(updated);
      setWorkspaces(prev => prev.map(w => w.id === workspace.id ? updated : w));
    }
  }, [workspace]);

  const deleteWorkspace = useCallback((): boolean => {
    if (!workspace) return false;
    const deleted = controller.deleteWorkspace(workspace.id);
    if (deleted) {
      const remaining = workspaces.filter(w => w.id !== workspace.id);
      setWorkspaces(remaining);
      if (remaining.length > 0) {
        setActiveWorkspace(remaining[0].id);
      } else {
        setWorkspace(null);
      }
    }
    return deleted;
  }, [workspace, workspaces]);

  const setActiveWorkspace = useCallback((workspaceId: string) => {
    controller.setActiveWorkspace(workspaceId);
    const activeWs = controller.getWorkspace(workspaceId);
    if (activeWs) {
      setWorkspace(activeWs);
    }
  }, []);

  const createProject = useCallback((params: CreateProjectParams): Project => {
    if (!workspace) {
      throw new Error('No active workspace');
    }
    const newProject = controller.createProject(
      workspace.id,
      workspace.userId,
      params.name,
      params.type,
      params.language,
      params.description,
      params.framework
    );
    setProjects(prev => [...prev, newProject]);
    analytics.trackEvent('project', 'project', 'create', params.name);
    return newProject;
  }, [workspace]);

  const togglePanel = useCallback((panel: WorkspacePanel) => {
    if (!workspace) return;
    controller.togglePanel(workspace.id, panel);
    const updated = controller.getWorkspace(workspace.id);
    if (updated) {
      setWorkspace(updated);
    }
  }, [workspace]);

  const setPanelSize = useCallback((panel: WorkspacePanel, size: number) => {
    if (!workspace) return;
    controller.setPanelSize(workspace.id, panel, size);
  }, [workspace]);

  const executeCommand = useCallback((type: string, payload: any): string => {
    return controller.executeCommand(type, payload);
  }, []);

  const refresh = useCallback(() => {
    initialize();
  }, []);

  return {
    workspace,
    workspaces,
    projects,
    isLoading,
    error,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setActiveWorkspace,
    createProject,
    togglePanel,
    setPanelSize,
    executeCommand,
    refresh
  };
}

export interface UseWorkspaceSettingsReturn {
  preferences: ReturnType<typeof preferences.getPreferences>;
  updatePreferences: (updates: any) => void;
  resetPreferences: () => void;
  codingProfile: ReturnType<typeof preferences.getCodingProfile>;
  updateCodingProfile: (updates: any) => void;
}

export function useWorkspaceSettings(): UseWorkspaceSettingsReturn {
  const preferences = WorkspacePreferences.getInstance();
  const [prefs, setPrefs] = useState(preferences.getPreferences());
  const [profile, setProfile] = useState(preferences.getCodingProfile());

  useEffect(() => {
    const handleUpdate = () => {
      setPrefs(preferences.getPreferences());
      setProfile(preferences.getCodingProfile());
    };

    const unsubPrefs = preferences.subscribe('editorSettingsUpdated', handleUpdate);
    const unsubProfile = preferences.subscribe('codingProfileUpdated', handleUpdate);

    return () => {
      unsubPrefs();
      unsubProfile();
    };
  }, []);

  const updatePreferences = useCallback((updates: any) => {
    preferences.updateEditorSettings(updates);
  }, []);

  const resetPreferences = useCallback(() => {
    preferences.resetAllSettings();
  }, []);

  const updateCodingProfile = useCallback((updates: any) => {
    preferences.updateCodingProfile(updates);
  }, []);

  return {
    preferences: prefs,
    updatePreferences,
    resetPreferences,
    codingProfile: profile,
    updateCodingProfile
  };
}

export interface UseWorkspaceAnalyticsReturn {
  metrics: ReturnType<typeof analytics.getProductivityMetrics>;
  languageMetrics: ReturnType<typeof analytics.getLanguageMetrics>;
  projectMetrics: ReturnType<typeof analytics.getProjectMetrics>;
  dailySummaries: ReturnType<typeof analytics.getDailySummaries>;
  trackEvent: (type: string, category: string, action: string, metadata?: any) => void;
  refreshMetrics: () => void;
}

export function useWorkspaceAnalytics(days: number = 7): UseWorkspaceAnalyticsReturn {
  const analytics = WorkspaceAnalytics.getInstance();
  const [metrics, setMetrics] = useState(analytics.getProductivityMetrics());
  const [languageMetrics, setLanguageMetrics] = useState(analytics.getLanguageMetrics());
  const [projectMetrics, setProjectMetrics] = useState(analytics.getProjectMetrics());
  const [dailySummaries, setDailySummaries] = useState(() => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return analytics.getDailySummaries(startDate, endDate);
  });

  useEffect(() => {
    refreshMetrics();
  }, [days]);

  const refreshMetrics = useCallback(() => {
    setMetrics(analytics.getProductivityMetrics());
    setLanguageMetrics(analytics.getLanguageMetrics());
    setProjectMetrics(analytics.getProjectMetrics());

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDailySummaries(analytics.getDailySummaries(startDate, endDate));
  }, [days]);

  const trackEvent = useCallback((type: string, category: string, action: string, metadata?: any) => {
    analytics.trackEvent(type, category, action, undefined, undefined, metadata);
    refreshMetrics();
  }, [refreshMetrics]);

  return {
    metrics,
    languageMetrics,
    projectMetrics,
    dailySummaries,
    trackEvent,
    refreshMetrics
  };
}

export default useWorkspace;

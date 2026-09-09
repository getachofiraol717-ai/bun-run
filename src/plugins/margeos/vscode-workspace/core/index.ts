// @ts-nocheck
/**
 * Core Module Index
 *
 * Barrel export for all core engines.
 */

// Engine exports
export { WorkspaceEngine, default as WorkspaceEngineDefault } from './WorkspaceEngine';
export { ProjectManager, default as ProjectManagerDefault, ProjectTemplate } from './ProjectManager';
export { FileExplorerEngine, default as FileExplorerEngineDefault, FileOperationResult } from './FileExplorerEngine';
export { EditorManager, default as EditorManagerDefault, FindReplaceOptions, EditorStats } from './EditorManager';
export { DebugManager, default as DebugManagerDefault, DebugConfiguration, StepAction } from './DebugManager';
export { WorkspaceController, default as WorkspaceControllerDefault, WorkspaceCommand, WorkspaceAction } from './WorkspaceController';
export { SessionManager, default as SessionManagerDefault, UserSession, SessionPreferences, SessionActivity } from './SessionManager';
export { WorkspacePreferences, default as WorkspacePreferencesDefault, PreferenceCategory, PreferenceChange, WorkspaceTheme } from './WorkspacePreferences';
export { WorkspaceAnalytics, default as WorkspaceAnalyticsDefault, AnalyticsEvent, ProductivityMetrics, LanguageMetrics, ProjectMetrics } from './WorkspaceAnalytics';

// Singleton instances
let workspaceEngineInstance: WorkspaceEngine | null = null;
let projectManagerInstance: ProjectManager | null = null;
let fileExplorerEngineInstance: FileExplorerEngine | null = null;
let editorManagerInstance: EditorManager | null = null;
let debugManagerInstance: DebugManager | null = null;
let workspaceControllerInstance: WorkspaceController | null = null;
let sessionManagerInstance: SessionManager | null = null;
let workspacePreferencesInstance: WorkspacePreferences | null = null;
let workspaceAnalyticsInstance: WorkspaceAnalytics | null = null;

export function getWorkspaceEngine(): WorkspaceEngine {
  if (!workspaceEngineInstance) {
    workspaceEngineInstance = WorkspaceEngine.getInstance();
  }
  return workspaceEngineInstance;
}

export function getProjectManager(): ProjectManager {
  if (!projectManagerInstance) {
    projectManagerInstance = ProjectManager.getInstance();
  }
  return projectManagerInstance;
}

export function getFileExplorerEngine(): FileExplorerEngine {
  if (!fileExplorerEngineInstance) {
    fileExplorerEngineInstance = FileExplorerEngine.getInstance();
  }
  return fileExplorerEngineInstance;
}

export function getEditorManager(): EditorManager {
  if (!editorManagerInstance) {
    editorManagerInstance = EditorManager.getInstance();
  }
  return editorManagerInstance;
}

export function getDebugManager(): DebugManager {
  if (!debugManagerInstance) {
    debugManagerInstance = DebugManager.getInstance();
  }
  return debugManagerInstance;
}

export function getWorkspaceController(): WorkspaceController {
  if (!workspaceControllerInstance) {
    workspaceControllerInstance = WorkspaceController.getInstance();
  }
  return workspaceControllerInstance;
}

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = SessionManager.getInstance();
  }
  return sessionManagerInstance;
}

export function getWorkspacePreferences(): WorkspacePreferences {
  if (!workspacePreferencesInstance) {
    workspacePreferencesInstance = WorkspacePreferences.getInstance();
  }
  return workspacePreferencesInstance;
}

export function getWorkspaceAnalytics(): WorkspaceAnalytics {
  if (!workspaceAnalyticsInstance) {
    workspaceAnalyticsInstance = WorkspaceAnalytics.getInstance();
  }
  return workspaceAnalyticsInstance;
}

// Initialize all engines
export async function initializeAllEngines(): Promise<void> {
  await Promise.all([
    getWorkspaceEngine().initialize(),
    getProjectManager().initialize(),
    getFileExplorerEngine().initialize(),
    getEditorManager().initialize(),
    getDebugManager().initialize(),
    getSessionManager().initialize(),
    getWorkspacePreferences().initialize(),
    getWorkspaceAnalytics().initialize()
  ]);
}

// Default export with all engines
export default {
  WorkspaceEngine: getWorkspaceEngine,
  ProjectManager: getProjectManager,
  FileExplorerEngine: getFileExplorerEngine,
  EditorManager: getEditorManager,
  DebugManager: getDebugManager,
  WorkspaceController: getWorkspaceController,
  SessionManager: getSessionManager,
  WorkspacePreferences: getWorkspacePreferences,
  WorkspaceAnalytics: getWorkspaceAnalytics,
  initializeAllEngines
};

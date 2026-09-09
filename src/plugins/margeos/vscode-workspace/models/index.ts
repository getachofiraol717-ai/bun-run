/**
 * Models Index
 *
 * Barrel export for all models.
 */

// Explicitly re-export from Workspace, excluding 'WorkspaceSettings'
// (canonical, more detailed version lives in WorkspaceSettings.ts) to avoid ambiguity.
export type {
  WorkspacePanel,
  WorkspaceState,
  WorkspaceAnalytics,
  Workspace,
} from './Workspace';
export {
  getDefaultSettings,
  getDefaultPanels,
  createWorkspace,
  updateWorkspaceSettings,
  togglePanel,
  addRecentProject,
  pinProject,
  unpinProject,
} from './Workspace';

export * from './Project';
export * from './FileNode';
export * from './EditorTab';
export * from './DebugSession';
export * from './WorkspaceSettings';

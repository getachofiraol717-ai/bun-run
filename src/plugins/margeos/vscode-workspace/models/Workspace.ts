/**
 * Workspace.ts
 *
 * Model for Workspace entity representing a coding workspace.
 */

export interface WorkspaceSettings {
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimapEnabled: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  autoSave: boolean;
  autoSaveDelay: number;
  formatOnSave: boolean;
  bracketPairColorization: boolean;
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand';
  cursorStyle: 'line' | 'block' | 'underline';
  smoothScrolling: boolean;
  mouseWheelZoom: boolean;
}

export interface WorkspacePanel {
  id: string;
  type: 'explorer' | 'search' | 'debug' | 'extensions' | 'output' | 'terminal';
  visible: boolean;
  size: number;
  collapsed: boolean;
  position: 'left' | 'right' | 'bottom';
}

export interface WorkspaceState {
  openFiles: string[];
  openFolders: string[];
  expandedFolders: string[];
  activeFile: string | null;
  activeFolder: string | null;
  scrollPositions: Record<string, number>;
  panelStates: Record<string, WorkspacePanel>;
}

export interface WorkspaceAnalytics {
  totalCodingTime: number;
  filesCreated: number;
  filesEdited: number;
  linesAdded: number;
  linesDeleted: number;
  languagesUsed: string[];
  lastActivity: string;
  streakDays: number;
}

export interface Workspace {
  id: string;
  name: string;
  userId: string;
  description: string;
  rootPath: string;
  settings: WorkspaceSettings;
  panels: WorkspacePanel[];
  recentProjects: string[];
  pinnedProjects: string[];
  isActive: boolean;
  lastOpenedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Factory functions
 */

export function getDefaultSettings(): WorkspaceSettings {
  return {
    theme: 'dark',
    fontSize: 14,
    fontFamily: 'Fira Code, Consolas, monospace',
    tabSize: 2,
    wordWrap: true,
    minimapEnabled: true,
    lineNumbers: 'on',
    autoSave: true,
    autoSaveDelay: 1000,
    formatOnSave: true,
    bracketPairColorization: true,
    cursorBlinking: 'smooth',
    cursorStyle: 'line',
    smoothScrolling: true,
    mouseWheelZoom: true
  };
}

export function getDefaultPanels(): WorkspacePanel[] {
  return [
    { id: 'explorer', type: 'explorer', visible: true, size: 250, collapsed: false, position: 'left' },
    { id: 'search', type: 'search', visible: true, size: 300, collapsed: false, position: 'left' },
    { id: 'debug', type: 'debug', visible: false, size: 200, collapsed: true, position: 'bottom' },
    { id: 'output', type: 'output', visible: false, size: 150, collapsed: true, position: 'bottom' }
  ];
}

export function createWorkspace(
  userId: string,
  name: string,
  description: string = '',
  rootPath: string = '/workspace'
): Workspace {
  return {
    id: `WS-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    name,
    userId,
    description,
    rootPath,
    settings: getDefaultSettings(),
    panels: getDefaultPanels(),
    recentProjects: [],
    pinnedProjects: [],
    isActive: true,
    lastOpenedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function updateWorkspaceSettings(
  workspace: Workspace,
  settings: Partial<WorkspaceSettings>
): Workspace {
  workspace.settings = { ...workspace.settings, ...settings };
  workspace.updatedAt = new Date().toISOString();
  return workspace;
}

export function togglePanel(workspace: Workspace, panelId: string): Workspace {
  const panel = workspace.panels.find(p => p.id === panelId);
  if (panel) {
    panel.visible = !panel.visible;
  }
  workspace.updatedAt = new Date().toISOString();
  return workspace;
}

export function addRecentProject(workspace: Workspace, projectId: string): Workspace {
  if (!workspace.recentProjects.includes(projectId)) {
    workspace.recentProjects.unshift(projectId);
    workspace.recentProjects = workspace.recentProjects.slice(0, 10); // Keep last 10
  }
  workspace.lastOpenedAt = new Date().toISOString();
  workspace.updatedAt = new Date().toISOString();
  return workspace;
}

export function pinProject(workspace: Workspace, projectId: string): Workspace {
  if (!workspace.pinnedProjects.includes(projectId)) {
    workspace.pinnedProjects.push(projectId);
  }
  workspace.updatedAt = new Date().toISOString();
  return workspace;
}

export function unpinProject(workspace: Workspace, projectId: string): Workspace {
  workspace.pinnedProjects = workspace.pinnedProjects.filter(id => id !== projectId);
  workspace.updatedAt = new Date().toISOString();
  return workspace;
}

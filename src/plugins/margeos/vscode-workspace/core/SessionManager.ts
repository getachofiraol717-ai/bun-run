/**
 * SessionManager.ts
 *
 * Engine for managing user sessions, authentication, and workspace persistence.
 */

import { Workspace, WorkspaceSettings } from '../models/Workspace';

const STORAGE_KEY = 'session_manager_data';

export interface UserSession {
  id: string;
  userId: string;
  workspaceId: string;
  token: string;
  refreshToken?: string;
  expiresAt: string;
  createdAt: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionState {
  currentSession: UserSession | null;
  recentSessions: UserSession[];
  activeWorkspaces: string[];
  preferences: SessionPreferences;
}

export interface SessionPreferences {
  autoSave: boolean;
  autoSaveInterval: number;
  rememberWorkspace: boolean;
  defaultWorkspace?: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
}

export interface SessionActivity {
  type: string;
  workspaceId: string;
  timestamp: string;
  duration?: number;
}

export class SessionManager {
  private static instance: SessionManager;
  private state: SessionState = {
    currentSession: null,
    recentSessions: [],
    activeWorkspaces: [],
    preferences: {
      autoSave: true,
      autoSaveInterval: 30000,
      rememberWorkspace: true,
      theme: 'auto',
      language: 'en',
      notifications: {
        enabled: true,
        sound: true,
        desktop: false
      }
    }
  };
  private activityLog: SessionActivity[] = [];
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;
  private sessionTimeout: number = 3600000; // 1 hour
  private activityCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.loadState();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadState();
    this.startActivityCheck();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.state = {
          ...this.state,
          ...data,
          preferences: { ...this.state.preferences, ...data.preferences }
        };
      }
    } catch (error) {
      console.error('Failed to load session state:', error);
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentSession: this.state.currentSession,
        recentSessions: this.state.recentSessions,
        activeWorkspaces: this.state.activeWorkspaces,
        preferences: this.state.preferences
      }));
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }

  // Session Management
  createSession(userId: string, workspaceId: string): UserSession {
    const session: UserSession = {
      id: `SESSION-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      userId,
      workspaceId,
      token: this.generateToken(),
      refreshToken: this.generateToken(),
      expiresAt: new Date(Date.now() + this.sessionTimeout).toISOString(),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };

    // Move current session to recent
    if (this.state.currentSession) {
      this.state.recentSessions.unshift(this.state.currentSession);
      if (this.state.recentSessions.length > 10) {
        this.state.recentSessions = this.state.recentSessions.slice(0, 10);
      }
    }

    this.state.currentSession = session;
    this.addActiveWorkspace(workspaceId);
    this.logActivity('session_created', workspaceId);
    this.saveState();
    this.emit('sessionCreated', session);

    return session;
  }

  private generateToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  getCurrentSession(): UserSession | null {
    return this.state.currentSession;
  }

  getSession(sessionId: string): UserSession | undefined {
    if (this.state.currentSession?.id === sessionId) {
      return this.state.currentSession;
    }
    return this.state.recentSessions.find(s => s.id === sessionId);
  }

  getRecentSessions(): UserSession[] {
    return [...this.state.recentSessions];
  }

  getUserSessions(userId: string): UserSession[] {
    return this.state.recentSessions.filter(s => s.userId === userId);
  }

  refreshSession(): UserSession | null {
    if (!this.state.currentSession) return null;

    this.state.currentSession.expiresAt = new Date(Date.now() + this.sessionTimeout).toISOString();
    this.state.currentSession.lastActivity = new Date().toISOString();
    this.state.currentSession.token = this.generateToken();
    this.saveState();
    this.emit('sessionRefreshed', this.state.currentSession);

    return this.state.currentSession;
  }

  extendSession(additionalTime: number = 3600000): UserSession | null {
    if (!this.state.currentSession) return null;

    const currentExpiry = new Date(this.state.currentSession.expiresAt).getTime();
    const newExpiry = Math.max(currentExpiry, Date.now()) + additionalTime;
    this.state.currentSession.expiresAt = new Date(newExpiry).toISOString();
    this.state.currentSession.lastActivity = new Date().toISOString();
    this.saveState();
    this.emit('sessionExtended', { session: this.state.currentSession, newExpiry });

    return this.state.currentSession;
  }

  destroySession(sessionId?: string): boolean {
    const targetId = sessionId || this.state.currentSession?.id;
    if (!targetId) return false;

    if (this.state.currentSession?.id === targetId) {
      this.logActivity('session_destroyed', this.state.currentSession.workspaceId);
      this.state.currentSession = null;
      this.saveState();
      this.emit('sessionDestroyed', { sessionId: targetId });
      return true;
    }

    const index = this.state.recentSessions.findIndex(s => s.id === targetId);
    if (index !== -1) {
      this.state.recentSessions.splice(index, 1);
      this.saveState();
      this.emit('sessionDestroyed', { sessionId: targetId });
      return true;
    }

    return false;
  }

  destroyAllSessions(): void {
    this.state.currentSession = null;
    this.state.recentSessions = [];
    this.saveState();
    this.emit('allSessionsDestroyed', {});
  }

  // Activity Tracking
  updateActivity(): void {
    if (this.state.currentSession) {
      this.state.currentSession.lastActivity = new Date().toISOString();
      this.saveState();
    }
  }

  private logActivity(type: string, workspaceId: string, duration?: number): void {
    this.activityLog.push({
      type,
      workspaceId,
      timestamp: new Date().toISOString(),
      duration
    });

    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(-1000);
    }
  }

  getActivityLog(limit: number = 100): SessionActivity[] {
    return this.activityLog.slice(-limit);
  }

  getActivityByWorkspace(workspaceId: string, limit: number = 50): SessionActivity[] {
    return this.activityLog
      .filter(a => a.workspaceId === workspaceId)
      .slice(-limit);
  }

  // Active Workspaces
  addActiveWorkspace(workspaceId: string): void {
    if (!this.state.activeWorkspaces.includes(workspaceId)) {
      this.state.activeWorkspaces.push(workspaceId);
      this.saveState();
      this.emit('workspaceActivated', { workspaceId });
    }
  }

  removeActiveWorkspace(workspaceId: string): void {
    const index = this.state.activeWorkspaces.indexOf(workspaceId);
    if (index !== -1) {
      this.state.activeWorkspaces.splice(index, 1);
      this.saveState();
      this.emit('workspaceDeactivated', { workspaceId });
    }
  }

  getActiveWorkspaces(): string[] {
    return [...this.state.activeWorkspaces];
  }

  isWorkspaceActive(workspaceId: string): boolean {
    return this.state.activeWorkspaces.includes(workspaceId);
  }

  // Preferences
  getPreferences(): SessionPreferences {
    return { ...this.state.preferences };
  }

  updatePreferences(updates: Partial<SessionPreferences>): void {
    this.state.preferences = { ...this.state.preferences, ...updates };
    this.saveState();
    this.emit('preferencesUpdated', this.state.preferences);
  }

  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.state.preferences.theme = theme;
    this.saveState();
    this.emit('themeChanged', { theme });
  }

  setLanguage(language: string): void {
    this.state.preferences.language = language;
    this.saveState();
    this.emit('languageChanged', { language });
  }

  setAutoSave(enabled: boolean, interval?: number): void {
    this.state.preferences.autoSave = enabled;
    if (interval !== undefined) {
      this.state.preferences.autoSaveInterval = interval;
    }
    this.saveState();
    this.emit('autoSaveChanged', { enabled, interval: this.state.preferences.autoSaveInterval });
  }

  // Session Validation
  isSessionValid(): boolean {
    if (!this.state.currentSession) return false;

    const expiresAt = new Date(this.state.currentSession.expiresAt).getTime();
    return Date.now() < expiresAt;
  }

  isSessionExpired(): boolean {
    if (!this.state.currentSession) return true;

    const expiresAt = new Date(this.state.currentSession.expiresAt).getTime();
    return Date.now() >= expiresAt;
  }

  getSessionTimeRemaining(): number {
    if (!this.state.currentSession) return 0;

    const expiresAt = new Date(this.state.currentSession.expiresAt).getTime();
    return Math.max(0, expiresAt - Date.now());
  }

  // Activity Check
  private startActivityCheck(): void {
    if (typeof window !== 'undefined') {
      this.activityCheckInterval = setInterval(() => {
        this.checkSessionActivity();
      }, 60000); // Check every minute
    }
  }

  private checkSessionActivity(): void {
    if (!this.state.currentSession) return;

    const lastActivity = new Date(this.state.currentSession.lastActivity).getTime();
    const now = Date.now();

    // If inactive for more than 30 minutes, extend session
    if (now - lastActivity > 1800000) {
      this.extendSession(3600000);
    }
  }

  // Token Management
  validateToken(token: string): boolean {
    return this.state.currentSession?.token === token;
  }

  getToken(): string | null {
    return this.state.currentSession?.token || null;
  }

  // Cleanup
  cleanup(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }

    // Clean up expired sessions
    const now = Date.now();
    this.state.recentSessions = this.state.recentSessions.filter(session => {
      const expiresAt = new Date(session.expiresAt).getTime();
      return expiresAt > now;
    });

    this.activityLog = this.activityLog.filter(activity => {
      const timestamp = new Date(activity.timestamp).getTime();
      return now - timestamp < 604800000; // 7 days
    });

    this.saveState();
    this.emit('cleanupCompleted', {});
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

export default SessionManager;

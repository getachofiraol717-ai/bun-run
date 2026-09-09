// @ts-nocheck
/**
 * WorkspacePreferences.ts
 *
 * Engine for managing workspace preferences, settings, and configurations.
 */

import {
  EditorSettings,
  DebugSettings,
  TerminalSettings,
  FileSettings,
  AccessibilitySettings,
  CodingProfile,
  getDefaultSettings,
  updateCodingProfile,
  incrementStat
} from '../models/WorkspaceSettings';

const STORAGE_KEY = 'workspace_preferences_data';

export interface PreferenceCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  settings: string[];
}

export interface PreferenceChange {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
  source: 'user' | 'system' | 'extension';
}

export interface WorkspaceTheme {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: Record<string, string>;
  fonts?: Record<string, string>;
}

export class WorkspacePreferences {
  private static instance: WorkspacePreferences;
  private editorSettings: EditorSettings;
  private debugSettings: DebugSettings;
  private terminalSettings: TerminalSettings;
  private fileSettings: FileSettings;
  private accessibilitySettings: AccessibilitySettings;
  private codingProfile: CodingProfile;
  private themes: Map<string, WorkspaceTheme> = new Map();
  private changeHistory: PreferenceChange[] = [];
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;
  private maxHistorySize: number = 100;

  private constructor() {
    const defaults = getDefaultSettings();
    this.editorSettings = defaults.editor;
    this.debugSettings = defaults.debug;
    this.terminalSettings = defaults.terminal;
    this.fileSettings = defaults.files;
    this.accessibilitySettings = defaults.accessibility;
    this.codingProfile = defaults.codingProfile;
  }

  static getInstance(): WorkspacePreferences {
    if (!WorkspacePreferences.instance) {
      WorkspacePreferences.instance = new WorkspacePreferences();
    }
    return WorkspacePreferences.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadState();
    this.initializeDefaultThemes();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.editorSettings = { ...this.editorSettings, ...data.editorSettings };
        this.debugSettings = { ...this.debugSettings, ...data.debugSettings };
        this.terminalSettings = { ...this.terminalSettings, ...data.terminalSettings };
        this.fileSettings = { ...this.fileSettings, ...data.fileSettings };
        this.accessibilitySettings = { ...this.accessibilitySettings, ...data.accessibilitySettings };
        this.codingProfile = { ...this.codingProfile, ...data.codingProfile };
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        editorSettings: this.editorSettings,
        debugSettings: this.debugSettings,
        terminalSettings: this.terminalSettings,
        fileSettings: this.fileSettings,
        accessibilitySettings: this.accessibilitySettings,
        codingProfile: this.codingProfile
      }));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  private initializeDefaultThemes(): void {
    this.themes.set('vs-dark', {
      id: 'vs-dark',
      name: 'Dark+',
      type: 'dark',
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'activityBar.background': '#333333',
        'statusBar.background': '#007acc'
      }
    });

    this.themes.set('vs-light', {
      id: 'vs-light',
      name: 'Light+',
      type: 'light',
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        'editorLineNumber.foreground': '#237893',
        'activityBar.background': '#f0f0f0',
        'statusBar.background': '#007acc'
      }
    });

    this.themes.set('hc-black', {
      id: 'hc-black',
      name: 'High Contrast',
      type: 'dark',
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#ffffff',
        'activityBar.background': '#000000',
        'statusBar.background': '#000000'
      }
    });
  }

  // Editor Settings
  getEditorSettings(): EditorSettings {
    return { ...this.editorSettings };
  }

  updateEditorSettings(updates: Partial<EditorSettings>): void {
    Object.entries(updates).forEach(([key, value]) => {
      const oldValue = (this.editorSettings as any)[key];
      this.recordChange(key, oldValue, value, 'user');
      (this.editorSettings as any)[key] = value;
    });
    this.saveState();
    this.emit('editorSettingsUpdated', this.editorSettings);
  }

  setFontSize(size: number): void {
    this.updateEditorSettings({ fontSize: size });
  }

  setFontFamily(family: string): void {
    this.updateEditorSettings({ fontFamily: family });
  }

  setTabSize(size: number): void {
    this.updateEditorSettings({ tabSize: size });
  }

  setInsertSpaces(insert: boolean): void {
    this.updateEditorSettings({ insertSpaces: insert });
  }

  setWordWrap(enabled: boolean): void {
    this.updateEditorSettings({ wordWrap: enabled ? 'on' : 'off' });
  }

  setMinimap(enabled: boolean): void {
    this.updateEditorSettings({ minimap: { enabled } });
  }

  setLineNumbers(type: 'on' | 'off' | 'relative'): void {
    this.updateEditorSettings({ lineNumbers: type });
  }

  // Debug Settings
  getDebugSettings(): DebugSettings {
    return { ...this.debugSettings };
  }

  updateDebugSettings(updates: Partial<DebugSettings>): void {
    Object.entries(updates).forEach(([key, value]) => {
      const oldValue = (this.debugSettings as any)[key];
      this.recordChange(key, oldValue, value, 'user');
      (this.debugSettings as any)[key] = value;
    });
    this.saveState();
    this.emit('debugSettingsUpdated', this.debugSettings);
  }

  setDebugSettings(settings: Partial<DebugSettings>): void {
    this.updateDebugSettings(settings);
  }

  // Terminal Settings
  getTerminalSettings(): TerminalSettings {
    return { ...this.terminalSettings };
  }

  updateTerminalSettings(updates: Partial<TerminalSettings>): void {
    Object.entries(updates).forEach(([key, value]) => {
      const oldValue = (this.terminalSettings as any)[key];
      this.recordChange(key, oldValue, value, 'user');
      (this.terminalSettings as any)[key] = value;
    });
    this.saveState();
    this.emit('terminalSettingsUpdated', this.terminalSettings);
  }

  setTerminalFontSize(size: number): void {
    this.updateTerminalSettings({ fontSize: size });
  }

  setTerminalFontFamily(family: string): void {
    this.updateTerminalSettings({ fontFamily: family });
  }

  setCursorStyle(style: 'block' | 'underline' | 'line'): void {
    this.updateTerminalSettings({ cursorStyle: style });
  }

  // File Settings
  getFileSettings(): FileSettings {
    return { ...this.fileSettings };
  }

  updateFileSettings(updates: Partial<FileSettings>): void {
    Object.entries(updates).forEach(([key, value]) => {
      const oldValue = (this.fileSettings as any)[key];
      this.recordChange(key, oldValue, value, 'user');
      (this.fileSettings as any)[key] = value;
    });
    this.saveState();
    this.emit('fileSettingsUpdated', this.fileSettings);
  }

  setAutoSave(mode: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange'): void {
    this.updateFileSettings({ autoSave: mode });
  }

  setTrimTrailingWhitespace(enabled: boolean): void {
    this.updateFileSettings({ trimTrailingWhitespace: enabled });
  }

  setInsertFinalNewline(enabled: boolean): void {
    this.updateFileSettings({ insertFinalNewline: enabled });
  }

  // Accessibility Settings
  getAccessibilitySettings(): AccessibilitySettings {
    return { ...this.accessibilitySettings };
  }

  updateAccessibilitySettings(updates: Partial<AccessibilitySettings>): void {
    Object.entries(updates).forEach(([key, value]) => {
      const oldValue = (this.accessibilitySettings as any)[key];
      this.recordChange(key, oldValue, value, 'user');
      (this.accessibilitySettings as any)[key] = value;
    });
    this.saveState();
    this.emit('accessibilitySettingsUpdated', this.accessibilitySettings);
  }

  setScreenReaderSupport(enabled: boolean): void {
    this.updateAccessibilitySettings({ screenReaderSupport: enabled ? 'auto' : 'off' });
  }

  setHighContrast(enabled: boolean): void {
    this.updateAccessibilitySettings({ highContrast: enabled });
  }

  setReducedMotion(enabled: boolean): void {
    this.updateAccessibilitySettings({ reducedMotion: enabled });
  }

  setLargeCursor(enabled: boolean): void {
    this.updateAccessibilitySettings({ largeCursor: enabled });
  }

  setStickyScroll(enabled: boolean): void {
    this.updateAccessibilitySettings({ stickyScroll: enabled });
  }

  // Coding Profile
  getCodingProfile(): CodingProfile {
    return { ...this.codingProfile };
  }

  updateCodingProfile(updates: Partial<CodingProfile>): void {
    this.codingProfile = updateCodingProfile(this.codingProfile, updates);
    this.saveState();
    this.emit('codingProfileUpdated', this.codingProfile);
  }

  incrementCodingStat(stat: keyof CodingProfile['stats']): void {
    this.codingProfile = incrementStat(this.codingProfile, stat);
    this.saveState();
    this.emit('codingStatIncremented', { stat });
  }

  addSkill(skill: string): void {
    if (!this.codingProfile.skills.includes(skill)) {
      this.codingProfile.skills.push(skill);
      this.saveState();
      this.emit('skillAdded', { skill });
    }
  }

  removeSkill(skill: string): void {
    const index = this.codingProfile.skills.indexOf(skill);
    if (index !== -1) {
      this.codingProfile.skills.splice(index, 1);
      this.saveState();
      this.emit('skillRemoved', { skill });
    }
  }

  addCompletedChallenge(challengeId: string): void {
    if (!this.codingProfile.completedChallenges.includes(challengeId)) {
      this.codingProfile.completedChallenges.push(challengeId);
      this.saveState();
      this.emit('challengeCompleted', { challengeId });
    }
  }

  setPreferredLanguage(language: string): void {
    this.updateCodingProfile({ preferredLanguage: language });
  }

  setPreferredFramework(framework: string): void {
    this.updateCodingProfile({ preferredFramework: framework });
  }

  // Themes
  getThemes(): WorkspaceTheme[] {
    return Array.from(this.themes.values());
  }

  getTheme(themeId: string): WorkspaceTheme | undefined {
    return this.themes.get(themeId);
  }

  addTheme(theme: WorkspaceTheme): void {
    this.themes.set(theme.id, theme);
    this.emit('themeAdded', theme);
  }

  removeTheme(themeId: string): boolean {
    const deleted = this.themes.delete(themeId);
    if (deleted) {
      this.emit('themeRemoved', { themeId });
    }
    return deleted;
  }

  // Change History
  private recordChange(key: string, oldValue: any, newValue: any, source: PreferenceChange['source']): void {
    const change: PreferenceChange = {
      key,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
      source
    };

    this.changeHistory.push(change);
    if (this.changeHistory.length > this.maxHistorySize) {
      this.changeHistory = this.changeHistory.slice(-this.maxHistorySize);
    }
  }

  getChangeHistory(limit?: number): PreferenceChange[] {
    return limit ? this.changeHistory.slice(-limit) : [...this.changeHistory];
  }

  clearChangeHistory(): void {
    this.changeHistory = [];
    this.emit('changeHistoryCleared', {});
  }

  // Reset
  resetEditorSettings(): void {
    const defaults = getDefaultSettings();
    this.updateEditorSettings(defaults.editor);
  }

  resetDebugSettings(): void {
    const defaults = getDefaultSettings();
    this.updateDebugSettings(defaults.debug);
  }

  resetTerminalSettings(): void {
    const defaults = getDefaultSettings();
    this.updateTerminalSettings(defaults.terminal);
  }

  resetFileSettings(): void {
    const defaults = getDefaultSettings();
    this.updateFileSettings(defaults.files);
  }

  resetAccessibilitySettings(): void {
    const defaults = getDefaultSettings();
    this.updateAccessibilitySettings(defaults.accessibility);
  }

  resetAllSettings(): void {
    const defaults = getDefaultSettings();
    this.editorSettings = defaults.editor;
    this.debugSettings = defaults.debug;
    this.terminalSettings = defaults.terminal;
    this.fileSettings = defaults.files;
    this.accessibilitySettings = defaults.accessibility;
    this.saveState();
    this.emit('allSettingsReset', {});
  }

  // Export/Import
  exportPreferences(): string {
    return JSON.stringify({
      editorSettings: this.editorSettings,
      debugSettings: this.debugSettings,
      terminalSettings: this.terminalSettings,
      fileSettings: this.fileSettings,
      accessibilitySettings: this.accessibilitySettings,
      codingProfile: this.codingProfile
    }, null, 2);
  }

  importPreferences(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (data.editorSettings) this.updateEditorSettings(data.editorSettings);
      if (data.debugSettings) this.updateDebugSettings(data.debugSettings);
      if (data.terminalSettings) this.updateTerminalSettings(data.terminalSettings);
      if (data.fileSettings) this.updateFileSettings(data.fileSettings);
      if (data.accessibilitySettings) this.updateAccessibilitySettings(data.accessibilitySettings);
      if (data.codingProfile) this.updateCodingProfile(data.codingProfile);
      this.emit('preferencesImported', {});
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
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

export default WorkspacePreferences;

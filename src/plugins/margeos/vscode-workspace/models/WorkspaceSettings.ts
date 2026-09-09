// @ts-nocheck
/**
 * WorkspaceSettings.ts
 *
 * Model for workspace and coding settings.
 */

export interface CodingProfile {
  id: string;
  userId: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredLanguages: string[];
  preferredFrameworks: string[];
  codingStyle: string;
  learningGoals: string[];
  completedCourses: string[];
  achievements: string[];
  totalCodingHours: number;
  projectsCompleted: number;
  bugsFixed: number;
  streakDays: number;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccessibilitySettings {
  screenReader: boolean;
  keyboardNavigation: boolean;
  voiceInteraction: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  cursorSize: 'small' | 'medium' | 'large';
  focusIndicator: boolean;
}

export interface EditorSettings {
  theme: string;
  fontFamily: string;
  fontSize: number;
  fontLigatures: boolean;
  lineHeight: number;
  letterSpacing: number;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: string;
  minimap: boolean;
  scrollBeyondLastLine: boolean;
  smoothScrolling: boolean;
  cursorStyle: string;
  cursorBlinking: string;
  cursorWidth: number;
  renderWhitespace: string;
  bracketPairColorization: boolean;
  guides: {
    bracketPairs: boolean;
    indentation: boolean;
    highlightActive: boolean;
  };
  format: {
    onSave: boolean;
    onPaste: boolean;
    onType: boolean;
  };
}

export interface FileSettings {
  autoSave: string;
  autoSaveDelay: number;
  trimTrailingWhitespace: boolean;
  insertFinalNewline: boolean;
  defaultEncoding: string;
  eol: string;
  autoGuessEncoding: boolean;
  largeFileThreshold: number;
}

export interface DebugSettings {
  console: {
    fontFamily: string;
    fontSize: number;
    wordWrap: boolean;
  };
  inlineValues: boolean;
  pauseOnFirstLine: boolean;
  openDebug: string;
  showInStatusBar: boolean;
  configurationAttributes: Record<string, any>;
}

export interface TerminalSettings {
  fontFamily: string;
  fontSize: number;
  fontLigatures: boolean;
  cursorStyle: string;
  cursorBlinking: boolean;
  scrollback: number;
  lineHeight: number;
  shell: {
    windows: string;
    linux: string;
    mac: string;
  };
}

export interface WorkspaceSettings {
  editor: EditorSettings;
  file: FileSettings;
  debug: DebugSettings;
  terminal: TerminalSettings;
  accessibility: AccessibilitySettings;
  extensions: Record<string, any>;
  keybindings: Record<string, string>;
  features: {
    intellisense: boolean;
    hoverDocs: boolean;
    formatOnSave: boolean;
    bracketMatching: boolean;
    autoClosingBrackets: boolean;
    autoClosingQuotes: boolean;
    formatOnPaste: boolean;
    suggestOnTriggerCharacters: boolean;
    acceptSuggestionOnEnter: boolean;
    quickSuggestions: boolean;
    parameterHints: boolean;
  };
}

/**
 * Factory functions
 */

export function getDefaultCodingProfile(userId: string): CodingProfile {
  return {
    id: `PROFILE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    userId,
    skillLevel: 'beginner',
    preferredLanguages: [],
    preferredFrameworks: [],
    codingStyle: 'standard',
    learningGoals: [],
    completedCourses: [],
    achievements: [],
    totalCodingHours: 0,
    projectsCompleted: 0,
    bugsFixed: 0,
    streakDays: 0,
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function getDefaultAccessibilitySettings(): AccessibilitySettings {
  return {
    screenReader: false,
    keyboardNavigation: true,
    voiceInteraction: false,
    highContrast: false,
    reduceMotion: false,
    fontSize: 14,
    lineHeight: 1.5,
    letterSpacing: 0,
    colorBlindMode: 'none',
    cursorSize: 'medium',
    focusIndicator: true
  };
}

export function getDefaultEditorSettings(): EditorSettings {
  return {
    theme: 'vs-dark',
    fontFamily: 'Fira Code, Consolas, monospace',
    fontSize: 14,
    fontLigatures: true,
    lineHeight: 1.5,
    letterSpacing: 0,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'off',
    minimap: true,
    scrollBeyondLastLine: true,
    smoothScrolling: true,
    cursorStyle: 'line',
    cursorBlinking: 'smooth',
    cursorWidth: 3,
    renderWhitespace: 'selection',
    bracketPairColorization: true,
    guides: {
      bracketPairs: true,
      indentation: true,
      highlightActive: true
    },
    format: {
      onSave: true,
      onPaste: false,
      onType: false
    }
  };
}

export function getDefaultFileSettings(): FileSettings {
  return {
    autoSave: 'afterDelay',
    autoSaveDelay: 1000,
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
    defaultEncoding: 'utf8',
    eol: '\n',
    autoGuessEncoding: true,
    largeFileThreshold: 512 * 1024 // 512KB
  };
}

export function getDefaultDebugSettings(): DebugSettings {
  return {
    console: {
      fontFamily: 'vscode-console',
      fontSize: 13,
      wordWrap: true
    },
    inlineValues: false,
    pauseOnFirstLine: false,
    openDebug: 'openOnDebugBreak',
    showInStatusBar: 'always',
    configurationAttributes: {}
  };
}

export function getDefaultTerminalSettings(): TerminalSettings {
  return {
    fontFamily: 'Consolas, monospace',
    fontSize: 14,
    fontLigatures: false,
    cursorStyle: 'block',
    cursorBlinking: true,
    scrollback: 1000,
    lineHeight: 1.2,
    shell: {
      windows: 'cmd.exe',
      linux: '/bin/bash',
      mac: '/bin/zsh'
    }
  };
}

export function getDefaultWorkspaceSettings(): WorkspaceSettings {
  return {
    editor: getDefaultEditorSettings(),
    file: getDefaultFileSettings(),
    debug: getDefaultDebugSettings(),
    terminal: getDefaultTerminalSettings(),
    accessibility: getDefaultAccessibilitySettings(),
    extensions: {},
    keybindings: {},
    features: {
      intellisense: true,
      hoverDocs: true,
      formatOnSave: true,
      bracketMatching: true,
      autoClosingBrackets: true,
      autoClosingQuotes: true,
      formatOnPaste: false,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      quickSuggestions: { other: true, comments: false, strings: false },
      parameterHints: true
    }
  };
}

export function updateCodingProfile(profile: CodingProfile, updates: Partial<CodingProfile>): CodingProfile {
  Object.assign(profile, updates);
  profile.lastActiveAt = new Date().toISOString();
  profile.updatedAt = new Date().toISOString();
  return profile;
}

export function addAchievement(profile: CodingProfile, achievement: string): CodingProfile {
  if (!profile.achievements.includes(achievement)) {
    profile.achievements.push(achievement);
    profile.updatedAt = new Date().toISOString();
  }
  return profile;
}

export function addSkillLevel(profile: CodingProfile, language: string): CodingProfile {
  if (!profile.preferredLanguages.includes(language)) {
    profile.preferredLanguages.push(language);
    profile.updatedAt = new Date().toISOString();
  }
  return profile;
}

export function incrementStat(profile: CodingProfile, stat: 'totalCodingHours' | 'projectsCompleted' | 'bugsFixed', value: number = 1): CodingProfile {
  profile[stat] += value;
  profile.lastActiveAt = new Date().toISOString();
  profile.updatedAt = new Date().toISOString();
  return profile;
}

export function updateStreak(profile: CodingProfile): CodingProfile {
  const lastActive = new Date(profile.lastActiveAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 1) {
    profile.streakDays += 1;
  } else if (daysDiff > 1) {
    profile.streakDays = 1;
  }

  profile.lastActiveAt = now.toISOString();
  profile.updatedAt = now.toISOString();
  return profile;
}

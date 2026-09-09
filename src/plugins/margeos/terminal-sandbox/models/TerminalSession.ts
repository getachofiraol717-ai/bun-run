/**
 * Terminal Session Model
 * Session management for Terminal Sandbox
 */

import type { TerminalSession, SessionStatus, TerminalRuntime, CommandHistoryEntry } from './types';

export function createTerminalSession(
  id: string,
  userId: string,
  runtime: TerminalRuntime
): TerminalSession {
  return {
    id,
    userId,
    runtime,
    status: 'idle',
    startedAt: new Date(),
    lastActivity: new Date(),
    workingDirectory: '/tmp/terminal-sandbox',
    environmentVariables: {
      HOME: '/tmp/terminal-sandbox',
      PATH: '/usr/local/bin:/usr/bin:/bin',
      TERM: 'xterm-256color',
    },
    history: [],
    permissions: ['read', 'write', 'execute'],
  };
}

export function updateSessionStatus(
  session: TerminalSession,
  status: SessionStatus
): TerminalSession {
  return {
    ...session,
    status,
    lastActivity: new Date(),
  };
}

export function addToHistory(
  session: TerminalSession,
  entry: CommandHistoryEntry
): TerminalSession {
  return {
    ...session,
    history: [...session.history, entry].slice(-1000),
    lastActivity: new Date(),
  };
}

export function getSessionDuration(session: TerminalSession): number {
  return Date.now() - new Date(session.startedAt).getTime();
}

export function isSessionActive(session: TerminalSession): boolean {
  return session.status === 'active' || session.status === 'idle';
}

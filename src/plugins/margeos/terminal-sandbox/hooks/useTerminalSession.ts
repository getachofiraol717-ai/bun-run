/**
 * useTerminalSession Hook for Terminal Sandbox
 * React hook for managing terminal session state
 */

import { useState, useCallback, useEffect } from 'react';
import SessionService from '../services/SessionService';
import type { TerminalSession, SessionStatus } from '../models/types';

export interface SessionSnapshot {
  id: string;
  timestamp: Date;
  state: {
    status: SessionStatus;
    history: { command: string; exitCode: number; timestamp: Date }[];
    workingDirectory: string;
  };
}

export interface UseTerminalSessionReturn {
  // State
  sessions: TerminalSession[];
  activeSessions: TerminalSession[];
  currentSession: TerminalSession | null;
  snapshots: SessionSnapshot[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createSession: (userId: string, runtime?: string) => Promise<TerminalSession | null>;
  closeSession: (sessionId: string) => Promise<boolean>;
  closeAllSessions: (userId: string) => Promise<number>;
  setCurrentSession: (sessionId: string) => void;

  // Status
  updateStatus: (sessionId: string, status: SessionStatus) => boolean;
  getSession: (sessionId: string) => TerminalSession | undefined;

  // Snapshots
  createSnapshot: (sessionId: string) => SessionSnapshot | null;
  restoreSnapshot: (snapshotId: string) => boolean;
  deleteSnapshot: (snapshotId: string) => boolean;

  // Statistics
  statistics: {
    totalSessions: number;
    activeSessions: number;
    closedSessions: number;
    byStatus: Record<SessionStatus, number>;
    byRuntime: Record<string, number>;
  };
}

export function useTerminalSession(userId?: string): UseTerminalSessionReturn {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [currentSession, setCurrentSessionState] = useState<TerminalSession | null>(null);
  const [snapshots, setSnapshots] = useState<SessionSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const service = SessionService.getInstance();

  // Load sessions
  const loadSessions = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const allSessions = service.getAllSessions();
      setSessions(userId ? service.getSessionsByUser(userId) : allSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Create session
  const createSession = useCallback(
    async (ownerId: string, runtime: string = 'bash'): Promise<TerminalSession | null> => {
      setError(null);

      try {
        const session = await service.createSession(ownerId, runtime);
        if (session) {
          setSessions((prev) => [...prev, session]);
        }
        return session;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create session');
        return null;
      }
    },
    []
  );

  // Close session
  const closeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    setError(null);

    try {
      const success = await service.closeSession(sessionId);
      if (success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSession?.id === sessionId) {
          setCurrentSessionState(null);
        }
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close session');
      return false;
    }
  }, [currentSession]);

  // Close all user sessions
  const closeAllSessions = useCallback(async (ownerId: string): Promise<number> => {
    setError(null);

    try {
      const count = await service.closeUserSessions(ownerId);
      loadSessions();
      return count;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close sessions');
      return 0;
    }
  }, [loadSessions]);

  // Set current session
  const setCurrentSession = useCallback((sessionId: string) => {
    const session = service.getSession(sessionId);
    if (session) {
      setCurrentSessionState(session);
      setSnapshots(service.getSnapshots(sessionId));
    }
  }, []);

  // Update session status
  const updateStatus = useCallback((sessionId: string, status: SessionStatus): boolean => {
    const success = service.updateStatus(sessionId, status);
    if (success) {
      loadSessions();
      if (currentSession?.id === sessionId) {
        setCurrentSessionState(service.getSession(sessionId) || null);
      }
    }
    return success;
  }, [loadSessions, currentSession]);

  // Get session by ID
  const getSession = useCallback((sessionId: string): TerminalSession | undefined => {
    return service.getSession(sessionId);
  }, []);

  // Create snapshot
  const createSnapshot = useCallback((sessionId: string): SessionSnapshot | null => {
    const snapshot = service.createSnapshot(sessionId);
    if (snapshot) {
      setSnapshots((prev) => [...prev, snapshot]);
    }
    return snapshot;
  }, []);

  // Restore snapshot
  const restoreSnapshot = useCallback((snapshotId: string): boolean => {
    const success = service.restoreSnapshot(snapshotId);
    if (success) {
      loadSessions();
    }
    return success;
  }, [loadSessions]);

  // Delete snapshot
  const deleteSnapshot = useCallback((snapshotId: string): boolean => {
    const success = service.deleteSnapshot(snapshotId);
    if (success) {
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
    }
    return success;
  }, []);

  // Get statistics
  const statistics = service.getStatistics();

  // Filter active sessions
  const activeSessions = sessions.filter((s) => s.status === 'active' || s.status === 'idle');

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    activeSessions,
    currentSession,
    snapshots,
    isLoading,
    error,
    createSession,
    closeSession,
    closeAllSessions,
    setCurrentSession,
    updateStatus,
    getSession,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    statistics,
  };
}

export default useTerminalSession;

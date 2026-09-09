/**
 * useTerminal Hook for Terminal Sandbox
 * React hook for terminal operations
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import TerminalService from '../services/TerminalService';
import type { TerminalSession, CommandResult, TerminalRuntime } from '../models/types';

export interface UseTerminalOptions {
  userId?: string;
  runtime?: TerminalRuntime;
  workspaceId?: string;
  autoConnect?: boolean;
}

export interface UseTerminalReturn {
  // State
  session: TerminalSession | null;
  output: string;
  isConnected: boolean;
  isExecuting: boolean;
  error: string | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  execute: (command: string) => Promise<CommandResult>;
  clear: () => void;
  write: (text: string) => void;

  // Session info
  sessionId: string | null;
  history: { command: string; exitCode: number; timestamp: Date }[];
}

export function useTerminal(options: UseTerminalOptions = {}): UseTerminalReturn {
  const {
    userId = 'default',
    runtime = 'bash',
    workspaceId,
    autoConnect = true,
  } = options;

  const [session, setSession] = useState<TerminalSession | null>(null);
  const [output, setOutput] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const service = useRef(TerminalService.getInstance());
  const outputRef = useRef<string>('');

  // Connect to terminal
  const connect = useCallback(async () => {
    try {
      setError(null);
      const newSession = await service.current.createSession({
        userId,
        runtime,
        workspaceId,
      });

      if (newSession) {
        setSession(newSession);
        setIsConnected(true);

        // Set up event listeners
        service.current.on(newSession.id, 'output', (data) => {
          outputRef.current += data;
          setOutput(outputRef.current);
        });

        service.current.on(newSession.id, 'error', (data) => {
          outputRef.current += `\x1b[31m${data}\x1b[0m`;
          setOutput(outputRef.current);
        });
      } else {
        setError('Failed to create session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, [userId, runtime, workspaceId]);

  // Disconnect from terminal
  const disconnect = useCallback(async () => {
    if (session) {
      await service.current.closeSession(session.id);
      setSession(null);
      setIsConnected(false);
      setOutput('');
      outputRef.current = '';
    }
  }, [session]);

  // Execute command
  const execute = useCallback(async (command: string): Promise<CommandResult> => {
    if (!session || !isConnected) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: 'Not connected',
        executionTime: 0,
        timestamp: new Date(),
      };
    }

    setIsExecuting(true);
    setError(null);

    try {
      const result = await service.current.executeCommand(session.id, command);
      return result;
    } catch (err) {
      const errorResult: CommandResult = {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Execution failed',
        executionTime: 0,
        timestamp: new Date(),
      };
      setError(errorResult.stderr);
      return errorResult;
    } finally {
      setIsExecuting(false);
    }
  }, [session, isConnected]);

  // Clear terminal output
  const clear = useCallback(() => {
    setOutput('');
    outputRef.current = '';
  }, []);

  // Write to terminal
  const write = useCallback((text: string) => {
    if (session) {
      service.current.write(session.id, text);
    }
  }, [session]);

  // Get history
  const history = session
    ? service.current.getHistory(session.id)
    : [];

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (session) {
        service.current.closeSession(session.id);
      }
    };
  }, []);

  return {
    session,
    output,
    isConnected,
    isExecuting,
    error,
    connect,
    disconnect,
    execute,
    clear,
    write,
    sessionId: session?.id || null,
    history,
  };
}

export default useTerminal;

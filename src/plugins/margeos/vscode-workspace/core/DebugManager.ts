// @ts-nocheck
/**
 * DebugManager.ts
 *
 * Engine for managing debug sessions, breakpoints, and debugging operations.
 */

import {
  DebugSession,
  DebugSessionStatus,
  DebugBreakpoint,
  DebugBreakpointType,
  DebugStackFrame,
  DebugThread,
  DebugVariable,
  DebugWatchExpression,
  DebugExceptionInfo,
  DebugConsoleEntry,
  DebugScope,
  DebugCallStack,
  createDebugSession,
  createBreakpoint,
  createStackFrame,
  createWatchExpression,
  createConsoleEntry,
  addBreakpoint,
  removeBreakpoint,
  toggleBreakpoint,
  updateCallStack,
  addConsoleOutput,
  addWatchExpression,
  removeWatchExpression,
  updateVariable,
  setExceptionInfo,
  startSession,
  pauseSession,
  stopSession,
  terminateSession,
  getSessionDuration
} from '../models/DebugSession';

const STORAGE_KEY = 'debug_manager_data';

export interface DebugConfiguration {
  type: DebugSession['type'];
  name: string;
  request: 'launch' | 'attach';
  program?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  port?: number;
  host?: string;
  preLaunchTask?: string;
  postDebugTask?: string;
  console?: 'internalConsole' | 'integratedTerminal' | 'externalTerminal';
  internalConsoleOptions?: {
    cwd?: string;
    env?: Record<string, string>;
  };
}

export interface StepAction {
  type: 'stepOver' | 'stepInto' | 'stepOut' | 'continue' | 'pause';
  sessionId: string;
  timestamp: string;
}

export class DebugManager {
  private static instance: DebugManager;
  private sessions: Map<string, DebugSession> = new Map();
  private activeSessionId: string | null = null;
  private breakpoints: Map<string, DebugBreakpoint[]> = new Map();
  private stepHistory: StepAction[] = [];
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;

  private constructor() {
    this.loadState();
  }

  static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager();
    }
    return DebugManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadState();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.breakpoints = new Map(
          Object.entries(data.breakpoints || {}).map(([k, v]) => [k, v as DebugBreakpoint[]])
        );
      }
    } catch (error) {
      console.error('Failed to load debug state:', error);
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        breakpoints: Object.fromEntries(this.breakpoints)
      }));
    } catch (error) {
      console.error('Failed to save debug state:', error);
    }
  }

  // Session Management
  createSession(projectId: string, name: string, type: DebugSession['type'], configuration: Record<string, any> = {}): DebugSession {
    const session = createDebugSession(projectId, name, type, configuration);
    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;

    // Load breakpoints for this project
    const projectBreakpoints = this.breakpoints.get(projectId) || [];
    session.breakpoints = [...projectBreakpoints];

    this.emit('sessionCreated', session);
    return session;
  }

  startSession(sessionId: string, configuration?: DebugConfiguration): DebugSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    startSession(session);

    if (configuration) {
      session.configuration = { ...session.configuration, ...configuration };
    }

    this.emit('sessionStarted', session);
    return session;
  }

  pauseSession(sessionId: string): DebugSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    pauseSession(session);
    this.emit('sessionPaused', session);
    return session;
  }

  stopSession(sessionId: string): DebugSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    stopSession(session);
    this.emit('sessionStopped', session);
    return session;
  }

  terminateSession(sessionId: string): DebugSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    terminateSession(session);
    this.emit('sessionTerminated', session);
    return session;
  }

  getSession(sessionId: string): DebugSession | undefined {
    return this.sessions.get(sessionId);
  }

  getActiveSession(): DebugSession | undefined {
    return this.activeSessionId ? this.sessions.get(this.activeSessionId) : undefined;
  }

  setActiveSession(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      this.activeSessionId = sessionId;
      this.emit('activeSessionChanged', { sessionId });
    }
  }

  getAllSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }

  getRunningSessions(): DebugSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'running');
  }

  getProjectSessions(projectId: string): DebugSession[] {
    return Array.from(this.sessions.values()).filter(s => s.projectId === projectId);
  }

  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      if (this.activeSessionId === sessionId) {
        this.activeSessionId = this.sessions.size > 0
          ? Array.from(this.sessions.keys())[0]
          : null;
      }
    }
    this.emit('sessionDeleted', { sessionId });
    return deleted;
  }

  // Breakpoint Management
  addBreakpoint(
    sessionId: string,
    fileId: string,
    filePath: string,
    line: number,
    type: DebugBreakpointType = 'line',
    options?: {
      condition?: string;
      hitCondition?: string;
      logMessage?: string;
      enabled?: boolean;
    }
  ): DebugBreakpoint | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const breakpoint = createBreakpoint(fileId, filePath, line, type, options);
    addBreakpoint(session, breakpoint);

    // Save to project breakpoints
    this.breakpoints.set(session.projectId, [...session.breakpoints]);
    this.saveState();

    this.emit('breakpointAdded', { sessionId, breakpoint });
    return breakpoint;
  }

  removeBreakpoint(sessionId: string, breakpointId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const removed = removeBreakpoint(session, breakpointId);
    if (removed) {
      this.breakpoints.set(session.projectId, [...session.breakpoints]);
      this.saveState();
      this.emit('breakpointRemoved', { sessionId, breakpointId });
    }
    return removed;
  }

  toggleBreakpoint(sessionId: string, breakpointId: string): DebugBreakpoint | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const bp = session.breakpoints.find(b => b.id === breakpointId);
    if (!bp) return undefined;

    toggleBreakpoint(session, breakpointId);
    this.breakpoints.set(session.projectId, [...session.breakpoints]);
    this.saveState();

    this.emit('breakpointToggled', { sessionId, breakpointId, enabled: bp.enabled });
    return bp;
  }

  enableAllBreakpoints(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.breakpoints.forEach(bp => {
      bp.enabled = true;
    });
    this.breakpoints.set(session.projectId, [...session.breakpoints]);
    this.saveState();
    this.emit('allBreakpointsEnabled', { sessionId });
  }

  disableAllBreakpoints(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.breakpoints.forEach(bp => {
      bp.enabled = false;
    });
    this.breakpoints.set(session.projectId, [...session.breakpoints]);
    this.saveState();
    this.emit('allBreakpointsDisabled', { sessionId });
  }

  removeAllBreakpoints(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;

    const count = session.breakpoints.length;
    session.breakpoints = [];
    session.exceptionBreakpoints = [];
    this.breakpoints.set(session.projectId, []);
    this.saveState();

    this.emit('allBreakpointsRemoved', { sessionId, count });
    return count;
  }

  getBreakpoints(sessionId: string): DebugBreakpoint[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.breakpoints] : [];
  }

  getBreakpointsByFile(sessionId: string, fileId: string): DebugBreakpoint[] {
    const session = this.sessions.get(sessionId);
    return session ? session.breakpoints.filter(bp => bp.fileId === fileId) : [];
  }

  getEnabledBreakpoints(sessionId: string): DebugBreakpoint[] {
    const session = this.sessions.get(sessionId);
    return session ? session.breakpoints.filter(bp => bp.enabled) : [];
  }

  // Exception Breakpoints
  setExceptionBreakpoint(
    sessionId: string,
    name: string,
    enabled: boolean = true
  ): DebugBreakpoint | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const breakpoint = createBreakpoint('', '', 0, 'exception', { enabled });
    breakpoint.filePath = name;
    session.exceptionBreakpoints.push(breakpoint);

    this.breakpoints.set(session.projectId, [...session.breakpoints]);
    this.saveState();

    this.emit('exceptionBreakpointSet', { sessionId, breakpoint });
    return breakpoint;
  }

  // Stepping
  stepOver(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'paused') return;

    this.addStepHistory({ type: 'stepOver', sessionId, timestamp: new Date().toISOString() });
    this.emit('stepOver', { sessionId });
  }

  stepInto(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'paused') return;

    this.addStepHistory({ type: 'stepInto', sessionId, timestamp: new Date().toISOString() });
    this.emit('stepInto', { sessionId });
  }

  stepOut(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'paused') return;

    this.addStepHistory({ type: 'stepOut', sessionId, timestamp: new Date().toISOString() });
    this.emit('stepOut', { sessionId });
  }

  continue(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'paused') return;

    this.addStepHistory({ type: 'continue', sessionId, timestamp: new Date().toISOString() });
    this.emit('continue', { sessionId });
  }

  pause(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'running') return;

    this.addStepHistory({ type: 'pause', sessionId, timestamp: new Date().toISOString() });
    this.emit('pause', { sessionId });
  }

  private addStepHistory(action: StepAction): void {
    this.stepHistory.push(action);
    if (this.stepHistory.length > 100) {
      this.stepHistory = this.stepHistory.slice(-100);
    }
  }

  getStepHistory(): StepAction[] {
    return [...this.stepHistory];
  }

  // Call Stack
  updateCallStack(sessionId: string, frames: DebugStackFrame[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    updateCallStack(session, frames);
    this.emit('callStackUpdated', { sessionId, frames });
  }

  getCallStack(sessionId: string): DebugCallStack | undefined {
    const session = this.sessions.get(sessionId);
    return session?.callStack;
  }

  getCurrentFrame(sessionId: string): DebugStackFrame | null {
    const session = this.sessions.get(sessionId);
    return session?.callStack.currentFrame || null;
  }

  // Threads
  updateThreads(sessionId: string, threads: DebugThread[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.threads = threads;
    if (threads.length > 0 && !session.currentThread) {
      session.currentThread = threads[0];
    }
    this.emit('threadsUpdated', { sessionId, threads });
  }

  getThreads(sessionId: string): DebugThread[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.threads] : [];
  }

  getCurrentThread(sessionId: string): DebugThread | null {
    const session = this.sessions.get(sessionId);
    return session?.currentThread || null;
  }

  setCurrentThread(sessionId: string, threadId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const thread = session.threads.find(t => t.id === threadId);
    if (thread) {
      session.currentThread = thread;
      this.emit('currentThreadChanged', { sessionId, threadId });
    }
  }

  // Variables
  updateVariables(sessionId: string, variables: DebugVariable[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.variables = variables;
    this.emit('variablesUpdated', { sessionId, variables });
  }

  addVariable(sessionId: string, name: string, value: string, type: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    updateVariable(session, name, value, type);
    this.emit('variableAdded', { sessionId, name, value, type });
  }

  setVariableValue(sessionId: string, name: string, value: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const variable = session.variables.find(v => v.name === name);
    if (variable) {
      updateVariable(session, name, value, variable.type);
      this.emit('variableValueChanged', { sessionId, name, value });
    }
  }

  getVariables(sessionId: string): DebugVariable[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.variables] : [];
  }

  getVariable(sessionId: string, name: string): DebugVariable | undefined {
    const session = this.sessions.get(sessionId);
    return session?.variables.find(v => v.name === name);
  }

  // Scopes
  setScopes(sessionId: string, scopes: DebugScope[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.scopes = scopes;
    this.emit('scopesUpdated', { sessionId, scopes });
  }

  getScopes(sessionId: string): DebugScope[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.scopes] : [];
  }

  // Watch Expressions
  addWatch(sessionId: string, expression: string): DebugWatchExpression | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const watch = addWatchExpression(session, expression);
    this.emit('watchAdded', { sessionId, watch });
    return watch;
  }

  removeWatch(sessionId: string, watchId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    removeWatchExpression(session, watchId);
    this.emit('watchRemoved', { sessionId, watchId });
    return true;
  }

  toggleWatch(sessionId: string, watchId: string): DebugWatchExpression | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const watch = session.watchExpressions.find(w => w.id === watchId);
    if (watch) {
      watch.enabled = !watch.enabled;
      this.emit('watchToggled', { sessionId, watchId, enabled: watch.enabled });
    }
    return watch;
  }

  updateWatchValue(sessionId: string, watchId: string, value: string, type?: string, error?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const watch = session.watchExpressions.find(w => w.id === watchId);
    if (watch) {
      watch.value = value;
      if (type) watch.type = type;
      if (error) watch.error = error;
      this.emit('watchValueUpdated', { sessionId, watchId, value, type, error });
    }
  }

  getWatches(sessionId: string): DebugWatchExpression[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.watchExpressions] : [];
  }

  // Console Output
  addConsoleOutput(sessionId: string, output: string, type: DebugConsoleEntry['type'] = 'stdout'): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    addConsoleOutput(session, output, type);
    this.emit('consoleOutput', { sessionId, output, type });
  }

  clearConsole(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.consoleOutput = [];
    this.emit('consoleCleared', { sessionId });
  }

  getConsoleOutput(sessionId: string): DebugConsoleEntry[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.consoleOutput] : [];
  }

  // Exception Handling
  setException(sessionId: string, exception: DebugExceptionInfo): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    setExceptionInfo(session, exception);
    this.emit('exceptionThrown', { sessionId, exception });
  }

  getExceptionInfo(sessionId: string): DebugExceptionInfo | null {
    const session = this.sessions.get(sessionId);
    return session?.exceptionInfo || null;
  }

  clearException(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.exceptionInfo = null;
    this.emit('exceptionCleared', { sessionId });
  }

  // Hit Breakpoint
  setHitBreakpoint(sessionId: string, breakpoint: DebugBreakpoint): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.currentBreakpoint = breakpoint;
    session.hitBreakpoint = breakpoint;
    this.emit('breakpointHit', { sessionId, breakpoint });
  }

  getHitBreakpoint(sessionId: string): DebugBreakpoint | null {
    const session = this.sessions.get(sessionId);
    return session?.hitBreakpoint || null;
  }

  // Duration
  getDuration(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    return session ? getSessionDuration(session) : '0s';
  }

  // Stats
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    totalBreakpoints: number;
    totalWatches: number;
  } {
    let totalBreakpoints = 0;
    let totalWatches = 0;

    this.sessions.forEach(session => {
      totalBreakpoints += session.breakpoints.length;
      totalWatches += session.watchExpressions.length;
    });

    return {
      totalSessions: this.sessions.size,
      activeSessions: this.getRunningSessions().length,
      totalBreakpoints,
      totalWatches
    };
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

export default DebugManager;

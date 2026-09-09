/**
 * DebugSession.ts
 *
 * Model for DebugSession representing a debugging session.
 */

export type DebugSessionStatus = 'initialized' | 'running' | 'paused' | 'stopped' | 'terminated' | 'error';
export type DebugBreakpointType = 'line' | 'function' | 'data' | 'exception';

export interface DebugBreakpoint {
  id: string;
  type: DebugBreakpointType;
  fileId: string;
  filePath: string;
  line: number;
  column?: number;
  condition?: string;
  hitCondition?: string;
  logMessage?: string;
  enabled: boolean;
  verified: boolean;
  reason?: string;
  createdAt: string;
}

export interface DebugStackFrame {
  id: string;
  name: string;
  fileId: string;
  filePath: string;
  line: number;
  column: number;
  source?: string;
  instructionPointerReference?: string;
  module?: string;
  presentationHint?: 'normal' | 'label' | 'subtle';
}

export interface DebugScope {
  name: string;
  variablesReference: number;
  namedVariables?: number;
  indexedVariables?: number;
  expensive: boolean;
  source?: string;
}

export interface DebugVariable {
  name: string;
  value: string;
  type: string;
  reference: number;
  variablesReference: number;
  presentationHint?: string;
  namedVariables?: number;
  indexedVariables?: number;
  evaluateName?: string;
}

export interface DebugThread {
  id: string;
  name: string;
  state: 'running' | 'sleeping' | 'blocked' | 'unknown';
  stackFrames: DebugStackFrame[];
  currentFrame: DebugStackFrame | null;
  stoppedReason?: string;
}

export interface DebugWatchExpression {
  id: string;
  expression: string;
  value?: string;
  type?: string;
  reference?: number;
  error?: string;
  enabled: boolean;
}

export interface DebugCallStack {
  frames: DebugStackFrame[];
  currentFrame: DebugStackFrame | null;
  totalFrames: number;
}

export interface DebugExceptionInfo {
  message: string;
  name: string;
  stackTrace?: string;
  details?: Record<string, any>;
}

export interface DebugConsoleEntry {
  id: string;
  output: string;
  type: 'stdout' | 'stderr' | 'system' | 'telemetry';
  timestamp: string;
  source?: string;
}

export interface DebugSession {
  id: string;
  projectId: string;
  name: string;
  type: 'node' | 'chrome' | 'firefox' | 'python' | 'java' | 'go' | 'rust' | 'cpp' | 'csharp' | 'extensionHost';
  status: DebugSessionStatus;
  configuration: Record<string, any>;
  breakpoints: DebugBreakpoint[];
  exceptionBreakpoints: DebugBreakpoint[];
  threads: DebugThread[];
  currentThread: DebugThread | null;
  callStack: DebugCallStack;
  watchExpressions: DebugWatchExpression[];
  scopes: DebugScope[];
  variables: DebugVariable[];
  consoleOutput: DebugConsoleEntry[];
  exceptionInfo: DebugExceptionInfo | null;
  currentBreakpoint: DebugBreakpoint | null;
  hitBreakpoint: DebugBreakpoint | null;
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: string;
  createdAt: string;
}

/**
 * Factory functions
 */

export function createDebugSession(
  projectId: string,
  name: string,
  type: DebugSession['type'],
  configuration: Record<string, any> = {}
): DebugSession {
  return {
    id: `DEBUG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    projectId,
    name,
    type,
    status: 'initialized',
    configuration,
    breakpoints: [],
    exceptionBreakpoints: [],
    threads: [],
    currentThread: null,
    callStack: { frames: [], currentFrame: null, totalFrames: 0 },
    watchExpressions: [],
    scopes: [],
    variables: [],
    consoleOutput: [],
    exceptionInfo: null,
    currentBreakpoint: null,
    hitBreakpoint: null,
    startTime: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
}

export function createBreakpoint(
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
): DebugBreakpoint {
  return {
    id: `BP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    type,
    fileId,
    filePath,
    line,
    enabled: options?.enabled ?? true,
    verified: false,
    condition: options?.condition,
    hitCondition: options?.hitCondition,
    logMessage: options?.logMessage,
    createdAt: new Date().toISOString()
  };
}

export function createStackFrame(
  name: string,
  fileId: string,
  filePath: string,
  line: number,
  column: number = 1
): DebugStackFrame {
  return {
    id: `FRAME-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    name,
    fileId,
    filePath,
    line,
    column
  };
}

export function createWatchExpression(expression: string): DebugWatchExpression {
  return {
    id: `WATCH-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    expression,
    enabled: true
  };
}

export function createConsoleEntry(
  output: string,
  type: DebugConsoleEntry['type'] = 'stdout'
): DebugConsoleEntry {
  return {
    id: `CONSOLE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    output,
    type,
    timestamp: new Date().toISOString()
  };
}

export function addBreakpoint(session: DebugSession, breakpoint: DebugBreakpoint): DebugSession {
  session.breakpoints.push(breakpoint);
  return session;
}

export function removeBreakpoint(session: DebugSession, breakpointId: string): DebugSession {
  session.breakpoints = session.breakpoints.filter(bp => bp.id !== breakpointId);
  return session;
}

export function toggleBreakpoint(session: DebugSession, breakpointId: string): DebugSession {
  const bp = session.breakpoints.find(b => b.id === breakpointId);
  if (bp) {
    bp.enabled = !bp.enabled;
  }
  return session;
}

export function updateCallStack(session: DebugSession, frames: DebugStackFrame[]): DebugSession {
  session.callStack = {
    frames,
    currentFrame: frames[0] || null,
    totalFrames: frames.length
  };

  if (frames.length > 0) {
    session.currentThread = {
      ...session.currentThread!,
      stackFrames: frames,
      currentFrame: frames[0]
    };
  }

  return session;
}

export function addConsoleOutput(session: DebugSession, output: string, type: DebugConsoleEntry['type'] = 'stdout'): DebugSession {
  session.consoleOutput.push(createConsoleEntry(output, type));

  // Keep only last 1000 entries
  if (session.consoleOutput.length > 1000) {
    session.consoleOutput = session.consoleOutput.slice(-1000);
  }

  return session;
}

export function addWatchExpression(session: DebugSession, expression: string): DebugSession {
  session.watchExpressions.push(createWatchExpression(expression));
  return session;
}

export function removeWatchExpression(session: DebugSession, watchId: string): DebugSession {
  session.watchExpressions = session.watchExpressions.filter(w => w.id !== watchId);
  return session;
}

export function updateVariable(session: DebugSession, name: string, value: string, type: string): DebugSession {
  const existing = session.variables.find(v => v.name === name);
  if (existing) {
    existing.value = value;
    existing.type = type;
  } else {
    session.variables.push({
      name,
      value,
      type,
      reference: 0,
      variablesReference: 0
    });
  }
  return session;
}

export function setExceptionInfo(session: DebugSession, exception: DebugExceptionInfo): DebugSession {
  session.exceptionInfo = exception;
  session.status = 'paused';
  return session;
}

export function startSession(session: DebugSession): DebugSession {
  session.status = 'running';
  return session;
}

export function pauseSession(session: DebugSession): DebugSession {
  session.status = 'paused';
  return session;
}

export function stopSession(session: DebugSession): DebugSession {
  session.status = 'stopped';
  session.endTime = new Date().toISOString();
  if (session.startTime) {
    session.duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
  }
  return session;
}

export function terminateSession(session: DebugSession): DebugSession {
  session.status = 'terminated';
  session.endTime = new Date().toISOString();
  if (session.startTime) {
    session.duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
  }
  return session;
}

export function getSessionDuration(session: DebugSession): string {
  if (!session.duration) return '0s';

  const seconds = Math.floor(session.duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

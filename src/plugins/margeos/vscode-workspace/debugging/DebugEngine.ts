/**
 * DebugEngine.ts
 *
 * Engine for debugging operations, error analysis, and bug detection.
 */

import { DebugSession, DebugBreakpoint, DebugStackFrame, DebugVariable, DebugThread } from '../models/DebugSession';
import DebugManager from '../core/DebugManager';

export interface DebugConfiguration {
  type: DebugSession['type'];
  name: string;
  request: 'launch' | 'attach';
  program?: string;
  url?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  port?: number;
  preLaunchTask?: string;
  postDebugTask?: string;
}

export interface ErrorAnalysis {
  type: 'syntax' | 'runtime' | 'logical' | 'type' | 'reference';
  message: string;
  severity: 'error' | 'warning' | 'info';
  line?: number;
  column?: number;
  file?: string;
  suggestion?: string;
  fix?: string;
  relatedErrors?: string[];
}

export interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reproducible: boolean;
  steps: string[];
  expected: string;
  actual: string;
  errorAnalysis?: ErrorAnalysis;
  suggestedFix?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface BreakpointCondition {
  expression: string;
  type: 'expression' | 'hitCount' | 'logMessage';
  hitCount?: number;
  logMessage?: string;
}

export interface WatchExpression {
  expression: string;
  evaluatedValue?: string;
  type?: string;
  error?: string;
}

export interface StackTraceAnalysis {
  summary: string;
  frames: DebugStackFrame[];
  entryPoint?: string;
  deepestFrame: string;
  suspiciousFrames: string[];
}

export class DebugEngine {
  private static instance: DebugEngine;
  private debugManager: DebugManager;
  private errorPatterns: Map<string, ErrorAnalysis> = new Map();
  private bugReports: Map<string, BugReport> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();

  private constructor() {
    this.debugManager = DebugManager.getInstance();
    this.initializeErrorPatterns();
  }

  static getInstance(): DebugEngine {
    if (!DebugEngine.instance) {
      DebugEngine.instance = new DebugEngine();
    }
    return DebugEngine.instance;
  }

  private initializeErrorPatterns(): void {
    // JavaScript/TypeScript error patterns
    this.errorPatterns.set('undefined', {
      type: 'reference',
      message: 'Cannot read property of undefined',
      severity: 'error',
      suggestion: 'Add a null/undefined check before accessing the property',
      fix: 'Add optional chaining (?.) or nullish coalescing (??)'
    });

    this.errorPatterns.set('not_a_function', {
      type: 'reference',
      message: 'is not a function',
      severity: 'error',
      suggestion: 'Check if the variable is defined and is actually a function'
    });

    this.errorPatterns.set('cannot_read', {
      type: 'reference',
      message: 'Cannot read',
      severity: 'error',
      suggestion: 'The property or variable does not exist or is not accessible'
    });

    // Python error patterns
    this.errorPatterns.set('index_error', {
      type: 'runtime',
      message: 'IndexError',
      severity: 'error',
      suggestion: 'The index is out of range. Check the length of the sequence before accessing'
    });

    this.errorPatterns.set('key_error', {
      type: 'runtime',
      message: 'KeyError',
      severity: 'error',
      suggestion: 'The key does not exist in the dictionary. Use dict.get() or check if key exists'
    });

    this.errorPatterns.set('attribute_error', {
      type: 'reference',
      message: 'AttributeError',
      severity: 'error',
      suggestion: 'The object does not have this attribute. Check the class definition'
    });

    this.errorPatterns.set('type_error', {
      type: 'type',
      message: 'TypeError',
      severity: 'error',
      suggestion: 'The operation is not supported for the given types. Check type compatibility'
    });
  }

  // Session Management
  createDebugSession(projectId: string, name: string, type: DebugSession['type']): DebugSession {
    return this.debugManager.createSession(projectId, name, type);
  }

  startDebugSession(sessionId: string, configuration?: DebugConfiguration): DebugSession | undefined {
    return this.debugManager.startSession(sessionId, configuration);
  }

  pauseDebugSession(sessionId: string): DebugSession | undefined {
    return this.debugManager.pauseSession(sessionId);
  }

  stopDebugSession(sessionId: string): DebugSession | undefined {
    return this.debugManager.stopSession(sessionId);
  }

  terminateDebugSession(sessionId: string): DebugSession | undefined {
    return this.debugManager.terminateSession(sessionId);
  }

  getDebugSession(sessionId: string): DebugSession | undefined {
    return this.debugManager.getSession(sessionId);
  }

  getActiveDebugSession(): DebugSession | undefined {
    return this.debugManager.getActiveSession();
  }

  getAllDebugSessions(): DebugSession[] {
    return this.debugManager.getAllSessions();
  }

  // Breakpoint Management
  addBreakpoint(
    sessionId: string,
    fileId: string,
    filePath: string,
    line: number,
    type: 'line' | 'function' | 'data' | 'exception' = 'line',
    condition?: BreakpointCondition
  ): DebugBreakpoint | undefined {
    return this.debugManager.addBreakpoint(
      sessionId,
      fileId,
      filePath,
      line,
      type,
      {
        condition: condition?.expression,
        hitCondition: condition?.hitCount?.toString(),
        logMessage: condition?.logMessage
      }
    );
  }

  removeBreakpoint(sessionId: string, breakpointId: string): boolean {
    return this.debugManager.removeBreakpoint(sessionId, breakpointId);
  }

  toggleBreakpoint(sessionId: string, breakpointId: string): DebugBreakpoint | undefined {
    return this.debugManager.toggleBreakpoint(sessionId, breakpointId);
  }

  setBreakpointCondition(
    sessionId: string,
    breakpointId: string,
    condition: BreakpointCondition
  ): DebugBreakpoint | undefined {
    const session = this.debugManager.getSession(sessionId);
    if (!session) return undefined;

    const breakpoint = session.breakpoints.find(bp => bp.id === breakpointId);
    if (breakpoint) {
      breakpoint.condition = condition.expression;
      breakpoint.hitCondition = condition.hitCount?.toString();
      breakpoint.logMessage = condition.logMessage;
      this.emit('breakpointConditionChanged', { sessionId, breakpointId, condition });
    }
    return breakpoint;
  }

  enableAllBreakpoints(sessionId: string): void {
    this.debugManager.enableAllBreakpoints(sessionId);
  }

  disableAllBreakpoints(sessionId: string): void {
    this.debugManager.disableAllBreakpoints(sessionId);
  }

  removeAllBreakpoints(sessionId: string): number {
    return this.debugManager.removeAllBreakpoints(sessionId);
  }

  getBreakpoints(sessionId: string): DebugBreakpoint[] {
    return this.debugManager.getBreakpoints(sessionId);
  }

  // Stepping
  stepOver(sessionId: string): void {
    this.debugManager.stepOver(sessionId);
  }

  stepInto(sessionId: string): void {
    this.debugManager.stepInto(sessionId);
  }

  stepOut(sessionId: string): void {
    this.debugManager.stepOut(sessionId);
  }

  continue(sessionId: string): void {
    this.debugManager.continue(sessionId);
  }

  pause(sessionId: string): void {
    this.debugManager.pause(sessionId);
  }

  // Watch Management
  addWatch(sessionId: string, expression: string): WatchExpression | undefined {
    const watch = this.debugManager.addWatch(sessionId, expression);
    if (watch) {
      return {
        expression,
        evaluatedValue: watch.value,
        type: watch.type,
        error: watch.error
      };
    }
    return undefined;
  }

  removeWatch(sessionId: string, watchId: string): boolean {
    return this.debugManager.removeWatch(sessionId, watchId);
  }

  getWatches(sessionId: string): WatchExpression[] {
    return this.debugManager.getWatches(sessionId).map(w => ({
      expression: w.expression,
      evaluatedValue: w.value,
      type: w.type,
      error: w.error
    }));
  }

  // Error Analysis
  analyzeError(error: string, stackTrace?: string): ErrorAnalysis {
    const lowerError = error.toLowerCase();

    // Check for known error patterns
    for (const [pattern, analysis] of this.errorPatterns.entries()) {
      if (lowerError.includes(pattern.replace('_', ' '))) {
        return this.parseErrorWithStackTrace({ ...analysis, message: error }, stackTrace);
      }
    }

    // Default analysis for unknown errors
    return this.parseErrorWithStackTrace({
      type: 'runtime',
      message: error,
      severity: 'error'
    }, stackTrace);
  }

  private parseErrorWithStackTrace(analysis: ErrorAnalysis, stackTrace?: string): ErrorAnalysis {
    if (!stackTrace) return analysis;

    const lines = stackTrace.split('\n');
    if (lines.length > 0) {
      const match = lines[0].match(/:(\d+):(\d+)/);
      if (match) {
        analysis.line = parseInt(match[1], 10);
        analysis.column = parseInt(match[2], 10);
      }

      // Extract file from stack trace
      const fileMatch = lines[0].match(/\/([^\/]+\.\w+):\d+/);
      if (fileMatch) {
        analysis.file = fileMatch[1];
      }
    }

    return analysis;
  }

  analyzeCodeForBugs(code: string, language: string): BugReport[] {
    const reports: BugReport[] = [];

    // Check for common bugs
    if (language === 'javascript' || language === 'typescript') {
      reports.push(...this.checkJavaScriptBugs(code));
    } else if (language === 'python') {
      reports.push(...this.checkPythonBugs(code));
    }

    reports.forEach(report => {
      this.bugReports.set(report.id, report);
    });

    return reports;
  }

  private checkJavaScriptBugs(code: string): BugReport[] {
    const reports: BugReport[] = [];

    // Check for == instead of ===
    const looseEqualityRegex = /[^!]={2}[^=]/g;
    let match;
    while ((match = looseEqualityRegex.exec(code)) !== null) {
      reports.push({
        id: `BUG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: 'Use strict equality',
        description: 'Using loose equality (==) instead of strict equality (===)',
        severity: 'medium',
        reproducible: false,
        steps: ['Code uses loose equality'],
        expected: 'Use === for comparison',
        actual: 'Using == for comparison',
        suggestedFix: 'Replace == with === for type-safe comparison',
        createdAt: new Date().toISOString()
      });
    }

    // Check for console.log left in code
    if (code.includes('console.log')) {
      reports.push({
        id: `BUG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: 'Debug statement found',
        description: 'console.log statement found in code',
        severity: 'low',
        reproducible: false,
        steps: ['console.log is present'],
        expected: 'Remove debug statements before production',
        actual: 'console.log is in the code',
        suggestedFix: 'Remove all console.log statements or use a proper logging framework',
        createdAt: new Date().toISOString()
      });
    }

    // Check for missing error handling
    if (code.includes('.then(') && !code.includes('catch(')) {
      reports.push({
        id: `BUG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: 'Missing error handling',
        description: 'Promise chain without catch handler',
        severity: 'high',
        reproducible: false,
        steps: ['Promise without catch'],
        expected: 'Add .catch() handler',
        actual: 'No error handling for promise rejection',
        suggestedFix: 'Add .catch(error => console.error(error)) or handle the rejection',
        createdAt: new Date().toISOString()
      });
    }

    // Check for mutate loop variable
    if (/for\s*\([^)]*let\s+\w+[^)]*\)/.test(code) && code.includes('let') && code.includes('i++')) {
      const loopVars = code.match(/let\s+(\w+)/g);
      if (loopVars && loopVars.length > 1) {
        reports.push({
          id: `BUG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: 'Loop variable modification',
          description: 'Loop variable may be modified inside the loop body',
          severity: 'medium',
          reproducible: false,
          steps: ['Loop variable defined and modified'],
          expected: 'Loop variable should not be reassigned inside loop',
          actual: 'Loop variable might be modified',
          suggestedFix: 'Ensure loop variable is only modified by the loop construct',
          createdAt: new Date().toISOString()
        });
      }
    }

    return reports;
  }

  private checkPythonBugs(code: string): BugReport[] {
    const reports: BugReport[] = [];

    // Check for mutable default arguments
    const mutableDefaultRegex = /def\s+\w+\([^)]*=\s*\[\s*\]|[^=]=\s*\{\s*\}/g;
    let match;
    while ((match = mutableDefaultRegex.exec(code)) !== null) {
      reports.push({
        id: `BUG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: 'Mutable default argument',
        description: 'Using mutable object as default argument',
        severity: 'high',
        reproducible: true,
        steps: ['Function defines mutable default argument'],
        expected: 'Use None as default and initialize inside function',
        actual: 'Mutable object used as default',
        suggestedFix: 'def func(arg=None): if arg is None: arg = []',
        createdAt: new Date().toISOString()
      });
    }

    // Check for bare except
    if (code.includes('except:') || code.includes('except :')) {
      reports.push({
        id: `BUG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: 'Bare except clause',
        description: 'Using bare except without specifying exception type',
        severity: 'medium',
        reproducible: false,
        steps: ['except: found in code'],
        expected: 'Specify exception type: except Exception as e:',
        actual: 'Bare except catches all exceptions',
        suggestedFix: 'Replace except: with except Exception as e:',
        createdAt: new Date().toISOString()
      });
    }

    // Check for print statements
    if (/\bprint\s*\(/.test(code)) {
      reports.push({
        id: `BUG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: 'Print statement found',
        description: 'Using print() instead of logging',
        severity: 'low',
        reproducible: false,
        steps: ['print() statement in code'],
        expected: 'Use proper logging module',
        actual: 'print() used for output',
        suggestedFix: 'Replace with logging.info(), logging.warning(), etc.',
        createdAt: new Date().toISOString()
      });
    }

    return reports;
  }

  // Stack Trace Analysis
  analyzeStackTrace(stackTrace: string, language: string): StackTraceAnalysis {
    const frames = this.parseStackTrace(stackTrace, language);

    let deepestFrame = '';
    let entryPoint = '';
    const suspiciousFrames: string[] = [];

    if (frames.length > 0) {
      deepestFrame = frames[frames.length - 1].name;
      entryPoint = frames[0].name;

      // Check for suspicious patterns
      frames.forEach(frame => {
        if (frame.name.includes('anonymous') || frame.name.includes('<anonymous>')) {
          suspiciousFrames.push(frame.name);
        }
        if (frame.name.includes('??')) {
          suspiciousFrames.push(frame.name);
        }
      });
    }

    const summary = this.generateStackTraceSummary(frames, language);

    return {
      summary,
      frames,
      entryPoint,
      deepestFrame,
      suspiciousFrames
    };
  }

  private parseStackTrace(stackTrace: string, language: string): DebugStackFrame[] {
    const frames: DebugStackFrame[] = [];
    const lines = stackTrace.split('\n');

    // Different stack trace formats for different languages
    const patterns: Record<string, RegExp> = {
      javascript: /at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/,
      python: /File\s+"(.+?)",\s+line\s+(\d+)(?:,\s+in\s+(.+?))?/,
      java: /at\s+(.+?)\((.+?):(\d+)\)/,
      go: /^(.+?):(\d+):(\d+)?/,
      rust: /^\s*at\s+(.+?)\s+-->\s+(.+?):(\d+)/,
      cpp: /^(\w+)\s+at\s+(.+?):(\d+)/
    };

    const pattern = patterns[language] || patterns.javascript;

    lines.forEach(line => {
      const match = line.match(pattern);
      if (match) {
        let name = '';
        let filePath = '';
        let lineNum = 1;
        let column = 1;

        if (language === 'python') {
          filePath = match[1];
          lineNum = parseInt(match[2], 10);
          name = match[3] || 'unknown';
        } else if (language === 'java') {
          name = match[1];
          filePath = match[2];
          lineNum = parseInt(match[3], 10);
        } else {
          name = match[1] || 'anonymous';
          filePath = match[2];
          lineNum = parseInt(match[3], 10);
          column = match[4] ? parseInt(match[4], 10) : 1;
        }

        frames.push({
          id: `FRAME-${frames.length}`,
          name,
          fileId: filePath,
          filePath,
          line: lineNum,
          column
        });
      }
    });

    return frames;
  }

  private generateStackTraceSummary(frames: DebugStackFrame[], language: string): string {
    if (frames.length === 0) {
      return 'No stack trace information available';
    }

    const frameCount = frames.length;
    const topFrame = frames[0];

    if (frameCount === 1) {
      return `Error occurred at ${topFrame.name} in ${topFrame.filePath}:${topFrame.line}`;
    }

    return `${frameCount} frames in stack trace. Entry point: ${topFrame.name}. Error originated from: ${frames[frames.length - 1].name}`;
  }

  // Bug Reports
  createBugReport(report: Omit<BugReport, 'id' | 'createdAt'>): BugReport {
    const bugReport: BugReport = {
      ...report,
      id: `BUG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString()
    };

    this.bugReports.set(bugReport.id, bugReport);
    this.emit('bugReportCreated', bugReport);

    return bugReport;
  }

  getBugReport(reportId: string): BugReport | undefined {
    return this.bugReports.get(reportId);
  }

  getAllBugReports(): BugReport[] {
    return Array.from(this.bugReports.values());
  }

  updateBugReport(reportId: string, updates: Partial<BugReport>): BugReport | undefined {
    const report = this.bugReports.get(reportId);
    if (!report) return undefined;

    Object.assign(report, updates);
    this.emit('bugReportUpdated', report);

    return report;
  }

  resolveBugReport(reportId: string): BugReport | undefined {
    return this.updateBugReport(reportId, { resolvedAt: new Date().toISOString() });
  }

  deleteBugReport(reportId: string): boolean {
    const deleted = this.bugReports.delete(reportId);
    if (deleted) {
      this.emit('bugReportDeleted', { reportId });
    }
    return deleted;
  }

  getBugReportsBySeverity(severity: BugReport['severity']): BugReport[] {
    return Array.from(this.bugReports.values()).filter(r => r.severity === severity);
  }

  getUnresolvedBugReports(): BugReport[] {
    return Array.from(this.bugReports.values()).filter(r => !r.resolvedAt);
  }

  // Variable Inspection
  evaluateExpression(expression: string, variables: DebugVariable[]): WatchExpression {
    // Simple expression evaluation
    try {
      // Check if expression matches a variable name
      const variable = variables.find(v => v.name === expression);
      if (variable) {
        return {
          expression,
          evaluatedValue: variable.value,
          type: variable.type
        };
      }

      // Handle simple property access
      const match = expression.match(/^(\w+)\.(\w+)$/);
      if (match) {
        const [, objName, propName] = match;
        const obj = variables.find(v => v.name === objName);
        if (obj) {
          return {
            expression,
            evaluatedValue: `${objName}.${propName}`,
            type: 'unknown'
          };
        }
      }

      // Evaluate simple math expressions
      const safeEval = new Function(...variables.map(v => v.name), `return ${expression}`);
      const result = safeEval(...variables.map(v => {
        try {
          return JSON.parse(v.value);
        } catch {
          return v.value;
        }
      }));

      return {
        expression,
        evaluatedValue: String(result),
        type: typeof result
      };
    } catch (error) {
      return {
        expression,
        error: error instanceof Error ? error.message : 'Evaluation failed'
      };
    }
  }

  // Debugger Configuration Templates
  getConfigurationTemplates(): Record<DebugSession['type'], DebugConfiguration[]> {
    return {
      node: [
        { type: 'node', name: 'Node.js Program', request: 'launch', program: '${workspaceFolder}/index.js' },
        { type: 'node', name: 'Node.js Attach', request: 'attach', port: 9229 }
      ],
      chrome: [
        { type: 'chrome', name: 'Launch Chrome', request: 'launch', program: '${workspaceFolder}/index.html', url: 'http://localhost:3000' },
        { type: 'chrome', name: 'Attach to Chrome', request: 'attach', url: 'http://localhost:3000' }
      ],
      python: [
        { type: 'python', name: 'Python: Current File', request: 'launch', program: '${file}' },
        { type: 'python', name: 'Python: Module', request: 'launch', program: '-m ${selectedText}' }
      ],
      java: [
        { type: 'java', name: 'Java: Launch', request: 'launch', program: '${workspaceFolder}/bin/${fileBasename}' }
      ],
      go: [
        { type: 'go', name: 'Go: Launch', request: 'launch', program: '${workspaceFolder}' }
      ],
      rust: [
        { type: 'rust', name: 'Rust: LLDB', request: 'launch', program: '${workspaceFolder}/target/debug/${workspaceFolderBasename}' }
      ],
      cpp: [
        { type: 'cpp', name: 'C++: Launch', request: 'launch', program: '${workspaceFolder}/a.out' }
      ],
      csharp: [
        { type: 'csharp', name: 'C#: .NET Core Launch', request: 'launch', program: '${workspaceFolder}/bin/Debug/netcoreapp2.1/*.dll' }
      ],
      firefox: [],
      extensionHost: []
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

export default DebugEngine;

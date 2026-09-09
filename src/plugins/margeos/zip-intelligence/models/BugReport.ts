/**
 * Bug Report Model
 * Potential issues and bugs identified in projects
 */

export interface BugReport {
  id: string;
  projectId: string;
  createdAt: Date;
  bugs: Bug[];
  statistics: BugStatistics;
  severityBreakdown: Record<BugSeverity, number>;
  categoryBreakdown: Record<string, number>;
}

export type BugSeverity = 'critical' | 'major' | 'minor' | 'info';

export type BugCategory =
  | 'logic'
  | 'syntax'
  | 'type'
  | 'null-pointer'
  | 'memory'
  | 'performance'
  | 'security'
  | 'configuration'
  | 'dependency'
  | 'style'
  | 'documentation'
  | 'other';

export interface Bug {
  id: string;
  severity: BugSeverity;
  category: BugCategory;
  title: string;
  description: string;
  file?: string;
  line?: number;
  function?: string;
  class?: string;
  suggestion?: string;
  educationalExplanation?: string;
  references?: string[];
  effort: 'low' | 'medium' | 'high';
  autoFixable?: boolean;
  fixSuggestion?: string;
}

export interface BugStatistics {
  totalBugs: number;
  criticalBugs: number;
  majorBugs: number;
  minorBugs: number;
  infoBugs: number;
  autoFixableBugs: number;
  bugsPerFile: Record<string, number>;
  bugsPerCategory: Record<string, number>;
}

export interface BugPattern {
  pattern: RegExp;
  category: BugCategory;
  severity: BugSeverity;
  title: string;
  description: string;
  suggestion: string;
  educationalExplanation: string;
}

export const COMMON_BUG_PATTERNS: BugPattern[] = [
  {
    pattern: /==\s*(true|false|null|undefined)/,
    category: 'logic',
    severity: 'major',
    title: 'Potential equality check issue',
    description: 'Using loose equality with primitive values may lead to unexpected behavior',
    suggestion: 'Use strict equality (===) instead of loose equality (==)',
    educationalExplanation: 'Strict equality (===) checks both value and type, while loose equality (==) performs type coercion which can lead to surprising results. For example, 0 == false is true, but 0 === false is false.',
  },
  {
    pattern: /console\.(log|debug|info)/,
    category: 'style',
    severity: 'info',
    title: 'Console statement found',
    description: 'Console statements should be removed or replaced with proper logging in production',
    suggestion: 'Use a proper logging library or environment-aware logging',
    educationalExplanation: 'Console statements can expose sensitive information and may impact performance. Using a structured logging approach helps with debugging and monitoring in production environments.',
  },
  {
    pattern: /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/,
    category: 'logic',
    severity: 'major',
    title: 'Empty catch block',
    description: 'Error is being caught but not handled',
    suggestion: 'Add error handling logic or log the error',
    educationalExplanation: 'Empty catch blocks silently swallow errors, making debugging difficult. Always handle errors appropriately or at least log them for future investigation.',
  },
  {
    pattern: /var\s+\w+/,
    category: 'style',
    severity: 'minor',
    title: 'Use of var keyword',
    description: 'Consider using let or const for better scoping',
    suggestion: 'Replace var with let or const',
    educationalExplanation: 'let and const have block-level scoping, while var has function-level scoping. Using modern declarations prevents hoisting-related bugs and makes code more predictable.',
  },
  {
    pattern: /\.innerHTML\s*=/,
    category: 'security',
    severity: 'critical',
    title: 'Potential XSS vulnerability',
    description: 'Direct innerHTML assignment can lead to Cross-Site Scripting (XSS) attacks',
    suggestion: 'Use textContent or sanitize input before DOM manipulation',
    educationalExplanation: 'XSS attacks occur when untrusted data is inserted into web pages without proper sanitization. Always validate and sanitize user input before displaying it.',
  },
  {
    pattern: /new\s+Array\s*\(\s*\)/,
    category: 'style',
    severity: 'minor',
    title: 'Array constructor usage',
    description: 'Use array literal syntax for better readability',
    suggestion: 'Use [] instead of new Array()',
    educationalExplanation: 'Array literals are more concise and avoid the confusing behavior of the Array constructor with multiple arguments.',
  },
  {
    pattern: /setTimeout\s*\(\s*[^,]+,\s*0\s*\)/,
    category: 'performance',
    severity: 'info',
    title: 'setTimeout with 0ms delay',
    description: 'Consider using requestAnimationFrame or queueMicrotask for better performance',
    suggestion: 'Use requestAnimationFrame for visual updates, queueMicrotask for async operations',
    educationalExplanation: 'While setTimeout(fn, 0) is useful for deferring execution, alternatives like queueMicrotask offer better performance characteristics for non-visual async operations.',
  },
  {
    pattern: /for\s*\(\s*let\s+\w+\s+in\s+\w+/,
    category: 'logic',
    severity: 'major',
    title: 'Using for...in for arrays',
    description: 'for...in iterates over all enumerable properties, not just array elements',
    suggestion: 'Use for...of or traditional for loop for arrays',
    educationalExplanation: 'for...in returns enumerable properties including those from the prototype chain and non-index properties. For arrays, use for...of to iterate over values or a traditional for loop to access indices.',
  },
  {
    pattern: /\|\|\s*\{\}/,
    category: 'logic',
    severity: 'major',
    title: 'Potential falsy value issue',
    description: 'Using || with objects may not work as expected for empty objects',
    suggestion: 'Use ?? (nullish coalescing) for objects',
    educationalExplanation: 'Empty objects {} are truthy, so || will not trigger the fallback. Nullish coalescing (??) only uses the fallback for null or undefined, which is often what you want.',
  },
  {
    pattern: /async\s+function.*\n[^}]*return\s+[^}]*(?!\.then|\.catch|\.finally)/,
    category: 'logic',
    severity: 'minor',
    title: 'Async function without await',
    description: 'Async function returns a Promise, but the value might not be awaited',
    suggestion: 'Ensure async results are properly awaited',
    educationalExplanation: 'Async functions always return Promises. If you forget to await an async call, errors may not be caught and execution order may be unexpected.',
  },
];

// Helper functions
export function createBugReport(
  id: string,
  projectId: string,
  bugs: Bug[]
): BugReport {
  const statistics = calculateBugStatistics(bugs);
  const severityBreakdown: Record<BugSeverity, number> = {
    critical: 0,
    major: 0,
    minor: 0,
    info: 0,
  };

  for (const bug of bugs) {
    severityBreakdown[bug.severity]++;
  }

  const categoryBreakdown: Record<string, number> = {};
  for (const bug of bugs) {
    categoryBreakdown[bug.category] = (categoryBreakdown[bug.category] || 0) + 1;
  }

  return {
    id,
    projectId,
    createdAt: new Date(),
    bugs,
    statistics,
    severityBreakdown,
    categoryBreakdown,
  };
}

export function calculateBugStatistics(bugs: Bug[]): BugStatistics {
  const bugsPerFile: Record<string, number> = {};
  const bugsPerCategory: Record<string, number> = {};

  for (const bug of bugs) {
    if (bug.file) {
      bugsPerFile[bug.file] = (bugsPerFile[bug.file] || 0) + 1;
    }
    bugsPerCategory[bug.category] = (bugsPerCategory[bug.category] || 0) + 1;
  }

  return {
    totalBugs: bugs.length,
    criticalBugs: bugs.filter((b) => b.severity === 'critical').length,
    majorBugs: bugs.filter((b) => b.severity === 'major').length,
    minorBugs: bugs.filter((b) => b.severity === 'minor').length,
    infoBugs: bugs.filter((b) => b.severity === 'info').length,
    autoFixableBugs: bugs.filter((b) => b.autoFixable).length,
    bugsPerFile,
    bugsPerCategory,
  };
}

export function sortBugsBySeverity(bugs: Bug[]): Bug[] {
  const order: Record<BugSeverity, number> = {
    critical: 0,
    major: 1,
    minor: 2,
    info: 3,
  };

  return [...bugs].sort((a, b) => order[a.severity] - order[b.severity]);
}

export function filterBugsBySeverity(bugs: Bug[], severity: BugSeverity[]): Bug[] {
  return bugs.filter((b) => severity.includes(b.severity));
}

export function filterBugsByCategory(bugs: Bug[], categories: BugCategory[]): Bug[] {
  return bugs.filter((b) => categories.includes(b.category));
}

export default {
  createBugReport,
  calculateBugStatistics,
  sortBugsBySeverity,
  filterBugsBySeverity,
  filterBugsByCategory,
  COMMON_BUG_PATTERNS,
};

/**
 * editorUtils.ts
 *
 * Utility functions for code editor operations.
 */

import { EditorTabPosition, EditorTabSelection } from '../models/EditorTab';

/**
 * Position and Selection Utilities
 */
export function positionEquals(a: EditorTabPosition, b: EditorTabPosition): boolean {
  return a.line === b.line && a.column === b.column;
}

export function positionCompare(a: EditorTabPosition, b: EditorTabPosition): number {
  if (a.line !== b.line) return a.line - b.line;
  return a.column - b.column;
}

export function isPositionInRange(position: EditorTabPosition, start: EditorTabPosition, end: EditorTabPosition): boolean {
  if (position.line < start.line || position.line > end.line) return false;
  if (position.line === start.line && position.column < start.column) return false;
  if (position.line === end.line && position.column > end.column) return false;
  return true;
}

export function selectionEquals(a: EditorTabSelection, b: EditorTabSelection): boolean {
  return positionEquals(a.start, b.start) && positionEquals(a.end, b.end) && a.isReversed === b.isReversed;
}

export function createSelection(startLine: number, startCol: number, endLine: number, endCol: number): EditorTabSelection {
  const start: EditorTabPosition = { line: startLine, column: startCol };
  const end: EditorTabPosition = { line: endLine, column: endCol };
  return {
    start,
    end,
    isReversed: startLine > endLine || (startLine === endLine && startCol > endCol)
  };
}

/**
 * Line and Column Utilities
 */
export function offsetToPosition(content: string, offset: number): EditorTabPosition {
  const lines = content.split('\n');
  let currentOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length + 1;
    if (currentOffset + lineLength > offset) {
      return {
        line: i + 1,
        column: offset - currentOffset + 1
      };
    }
    currentOffset += lineLength;
  }

  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

export function positionToOffset(content: string, position: EditorTabPosition): number {
  const lines = content.split('\n');
  let offset = 0;

  for (let i = 0; i < position.line - 1 && i < lines.length; i++) {
    offset += lines[i].length + 1;
  }

  offset += position.column - 1;
  return Math.min(offset, content.length);
}

export function getLineAtPosition(content: string, line: number): string {
  const lines = content.split('\n');
  return lines[line - 1] || '';
}

export function getLineCount(content: string): number {
  return content.split('\n').length;
}

export function getIndentation(content: string, line: number): string {
  const lineContent = getLineAtPosition(content, line);
  const match = lineContent.match(/^(\s*)/);
  return match ? match[1] : '';
}

export function getLineIndentLevel(content: string, line: number, tabSize: number = 2): number {
  const indentation = getIndentation(content, line);
  return indentation.split(' ').length + (indentation.includes('\t') ? indentation.split('\t').length - 1 : 0);
}

/**
 * Text Manipulation
 */
export function insertText(content: string, position: EditorTabPosition, text: string): string {
  const offset = positionToOffset(content, position);
  return content.slice(0, offset) + text + content.slice(offset);
}

export function deleteText(content: string, start: EditorTabPosition, end: EditorTabPosition): string {
  const startOffset = positionToOffset(content, start);
  const endOffset = positionToOffset(content, end);
  return content.slice(0, startOffset) + content.slice(endOffset);
}

export function replaceText(content: string, start: EditorTabPosition, end: EditorTabPosition, text: string): string {
  return deleteText(content, start, end).slice(0, positionToOffset(content, start)) + text + content.slice(positionToOffset(content, start));
}

export function getSelectedText(content: string, selection: EditorTabSelection): string {
  const lines = content.split('\n');
  const startLine = selection.start.line - 1;
  const endLine = selection.end.line - 1;

  if (startLine === endLine) {
    return lines[startLine]?.slice(selection.start.column - 1, selection.end.column - 1) || '';
  }

  const selectedLines = [];
  selectedLines.push(lines[startLine]?.slice(selection.start.column - 1) || '');

  for (let i = startLine + 1; i < endLine; i++) {
    selectedLines.push(lines[i] || '');
  }

  selectedLines.push(lines[endLine]?.slice(0, selection.end.column - 1) || '');

  return selectedLines.join('\n');
}

/**
 * Indentation Utilities
 */
export function adjustIndentation(content: string, delta: number): string {
  const lines = content.split('\n');
  const adjusted = lines.map(line => {
    if (delta > 0) {
      return ' '.repeat(delta) + line;
    } else if (delta < 0) {
      const spacesToRemove = Math.min(delta * -1, getLeadingSpaces(line));
      return line.slice(spacesToRemove);
    }
    return line;
  });
  return adjusted.join('\n');
}

function getLeadingSpaces(line: string): number {
  let count = 0;
  for (const char of line) {
    if (char === ' ') count++;
    else if (char === '\t') count += 2;
    else break;
  }
  return count;
}

export function normalizeIndentation(content: string, tabSize: number = 2): string {
  const lines = content.split('\n');
  const normalized = lines.map(line => {
    return line.replace(/\t/g, ' '.repeat(tabSize));
  });
  return normalized.join('\n');
}

export function getIndentString(useSpaces: boolean, tabSize: number): string {
  return useSpaces ? ' '.repeat(tabSize) : '\t';
}

/**
 * Code Formatting
 */
export function formatJson(content: string, indent: number = 2): string {
  try {
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, indent);
  } catch {
    return content;
  }
}

export function formatXml(content: string, indent: string = '  '): string {
  let formatted = '';
  let indentLevel = 0;
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('</')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    formatted += indent.repeat(indentLevel) + trimmed + '\n';

    if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.startsWith('<?') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
      indentLevel++;
    }
  }

  return formatted.trim();
}

export function formatHtml(content: string): string {
  return formatXml(content, '  ');
}

export function sortImports(content: string, language: string): string {
  if (language === 'javascript' || language === 'typescript') {
    const importRegex = /^import\s+.*$/gm;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[0]);
    }

    imports.sort((a, b) => {
      if (a.includes('"') && b.includes("'")) return 1;
      if (a.includes("'") && b.includes('"')) return -1;
      return a.localeCompare(b);
    });

    let result = content.replace(importRegex, '');
    result = result.replace(/^\n+/, '');

    return imports.join('\n') + '\n\n' + result;
  }
  return content;
}

/**
 * Search Utilities
 */
export function findAll(content: string, query: string, options: {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  isRegex?: boolean;
} = {}): Array<{ start: EditorTabPosition; end: EditorTabPosition }> {
  const matches: Array<{ start: EditorTabPosition; end: EditorTabPosition }> = [];
  let searchQuery = query;

  if (!options.caseSensitive) {
    searchQuery = query.toLowerCase();
  }

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let searchLine = lines[i];
    if (!options.caseSensitive) {
      searchLine = searchLine.toLowerCase();
    }

    let index = 0;
    while ((index = searchLine.indexOf(searchQuery, index)) !== -1) {
      const endIndex = index + query.length;

      if (options.wholeWord) {
        const beforeValid = index === 0 || /\W/.test(lines[i][index - 1]);
        const afterValid = endIndex >= lines[i].length || /\W/.test(lines[i][endIndex]);
        if (!beforeValid || !afterValid) {
          index++;
          continue;
        }
      }

      matches.push({
        start: { line: i + 1, column: index + 1 },
        end: { line: i + 1, column: endIndex + 1 }
      });

      index = endIndex;
    }
  }

  return matches;
}

export function replaceAll(content: string, find: string, replace: string, options: {
  caseSensitive?: boolean;
  wholeWord?: boolean;
} = {}): string {
  const matches = findAll(content, find, options);
  if (matches.length === 0) return content;

  let result = content;
  let offset = 0;

  for (const match of matches) {
    const startOffset = positionToOffset(result, { line: match.start.line, column: match.start.column - offset });
    const endOffset = positionToOffset(result, { line: match.end.line, column: match.end.column - offset });

    result = result.slice(0, startOffset) + replace + result.slice(endOffset);
    offset += find.length - replace.length;
  }

  return result;
}

/**
 * Code Analysis
 */
export function getWordAtPosition(content: string, position: EditorTabPosition): string {
  const line = getLineAtPosition(content, position.line);
  const before = line.slice(0, position.column - 1);
  const after = line.slice(position.column - 1);

  const wordBefore = before.match(/\w+$/)?.[0] || '';
  const wordAfter = after.match(/^\w+/)?.[0] || '';

  return wordBefore + wordAfter;
}

export function getWordRange(content: string, position: EditorTabPosition): { start: EditorTabPosition; end: EditorTabPosition } {
  const line = getLineAtPosition(content, position.line);

  let start = position.column;
  while (start > 1 && /\w/.test(line[start - 2])) {
    start--;
  }

  let end = position.column;
  while (end <= line.length && /\w/.test(line[end - 1])) {
    end++;
  }

  return {
    start: { line: position.line, column: start },
    end: { line: position.line, column: end }
  };
}

export function getFunctionAtPosition(content: string, position: EditorTabPosition): {
  name: string;
  startLine: number;
  endLine: number;
} | null {
  const lines = content.split('\n');
  const lineNumber = position.line - 1;

  // Search backwards for function declaration
  let funcStart = lineNumber;
  let braceCount = 0;
  let foundOpen = false;

  for (let i = lineNumber; i >= 0; i--) {
    const line = lines[i];
    if (/function\s+\w+/.test(line) || /^\s*(async\s+)?(\w+\s*=>|\([^)]*\)\s*=>)/.test(line)) {
      funcStart = i;
      break;
    }

    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;

    if (braceCount > 0 && /=>\s*{/.test(line)) {
      foundOpen = true;
    }
  }

  // Search forwards for end of function
  let funcEnd = lineNumber;
  braceCount = 0;

  for (let i = funcStart; i < lines.length; i++) {
    const line = lines[i];
    braceCount += (line.match(/{/g) || []).length;

    if (i === funcStart && /=>\s*{/.test(line)) {
      continue;
    }

    if (braceCount > 0) {
      funcEnd = i;
    }

    braceCount -= (line.match(/}/g) || []).length;

    if (braceCount === 0 && i > funcStart) {
      break;
    }
  }

  const funcLine = lines[funcStart];
  const nameMatch = funcLine.match(/function\s+(\w+)|(\w+)\s*=>/);
  const name = nameMatch ? (nameMatch[1] || nameMatch[2]) : 'anonymous';

  return {
    name,
    startLine: funcStart + 1,
    endLine: funcEnd + 1
  };
}

export default {
  positionEquals,
  positionCompare,
  isPositionInRange,
  selectionEquals,
  createSelection,
  offsetToPosition,
  positionToOffset,
  getLineAtPosition,
  getLineCount,
  getIndentation,
  insertText,
  deleteText,
  replaceText,
  getSelectedText,
  adjustIndentation,
  normalizeIndentation,
  getIndentString,
  formatJson,
  formatXml,
  formatHtml,
  sortImports,
  findAll,
  replaceAll,
  getWordAtPosition,
  getWordRange,
  getFunctionAtPosition
};

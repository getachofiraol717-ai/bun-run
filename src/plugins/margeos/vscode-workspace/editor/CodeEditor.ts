/**
 * CodeEditor.ts
 *
 * Component for code editing with syntax highlighting, autocomplete, and formatting.
 */

import { EditorTab, EditorTabPosition, EditorTabSelection } from '../models/EditorTab';
import EditorManager from '../core/EditorManager';

export interface EditorCommand {
  type: 'insert' | 'delete' | 'replace' | 'format' | 'indent' | 'comment';
  position?: EditorTabPosition;
  text?: string;
  start?: EditorTabPosition;
  end?: EditorTabPosition;
}

export interface SyntaxToken {
  type: string;
  value: string;
  start: EditorTabPosition;
  end: EditorTabPosition;
}

export interface AutocompleteItem {
  label: string;
  kind: 'function' | 'method' | 'property' | 'variable' | 'class' | 'interface' | 'module' | 'keyword' | 'snippet';
  detail?: string;
  documentation?: string;
  insertText: string;
  range?: { start: EditorTabPosition; end: EditorTabPosition };
  sortText?: string;
  filterText?: string;
}

export interface FormattingOptions {
  tabSize: number;
  insertSpaces: boolean;
  insertFinalNewline: boolean;
  trimTrailingWhitespace: boolean;
  eol: '\n' | '\r\n';
}

export interface CodeLens {
  range: { startLine: number; endLine: number };
  command?: {
    title: string;
    command: string;
    arguments?: any[];
  };
  isResolved: boolean;
}

export interface GlyphMargin {
  line: number;
  glyphType: 'class' | 'method' | 'variable' | 'comment' | 'folder' | 'color' | 'enum' | 'field' | 'function' | 'interface' | 'keyword' | 'property' | 'reference' | 'string';
  tooltip?: string;
}

export class CodeEditor {
  private static instance: CodeEditor;
  private editorManager: EditorManager;
  private languageHandlers: Map<string, LanguageHandler> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();

  private constructor() {
    this.editorManager = EditorManager.getInstance();
    this.initializeLanguageHandlers();
  }

  static getInstance(): CodeEditor {
    if (!CodeEditor.instance) {
      CodeEditor.instance = new CodeEditor();
    }
    return CodeEditor.instance;
  }

  private initializeLanguageHandlers(): void {
    // JavaScript/TypeScript
    this.languageHandlers.set('javascript', new JavaScriptHandler());
    this.languageHandlers.set('typescript', new TypeScriptHandler());
    this.languageHandlers.set('javascriptreact', new JavaScriptHandler());
    this.languageHandlers.set('typescriptreact', new TypeScriptHandler());

    // Python
    this.languageHandlers.set('python', new PythonHandler());

    // HTML/CSS
    this.languageHandlers.set('html', new HtmlHandler());
    this.languageHandlers.set('css', new CssHandler());
    this.languageHandlers.set('scss', new CssHandler());

    // JSON
    this.languageHandlers.set('json', new JsonHandler());
    this.languageHandlers.set('jsonc', new JsonHandler());

    // Markdown
    this.languageHandlers.set('markdown', new MarkdownHandler());

    // SQL
    this.languageHandlers.set('sql', new SqlHandler());

    // Shell
    this.languageHandlers.set('shell', new ShellHandler());
    this.languageHandlers.set('bash', new ShellHandler());

    // Go
    this.languageHandlers.set('go', new GoHandler());

    // Rust
    this.languageHandlers.set('rust', new RustHandler());

    // Java
    this.languageHandlers.set('java', new JavaHandler());

    // C/C++
    this.languageHandlers.set('c', new CppHandler());
    this.languageHandlers.set('cpp', new CppHandler());
    this.languageHandlers.set('csharp', new CSharpHandler());

    // Default
    this.languageHandlers.set('plaintext', new PlaintextHandler());
  }

  getLanguageHandler(language: string): LanguageHandler {
    return this.languageHandlers.get(language) || this.languageHandlers.get('plaintext')!;
  }

  // Tokenization
  tokenize(content: string, language: string): SyntaxToken[] {
    return this.getLanguageHandler(language).tokenize(content);
  }

  // Syntax Highlighting
  getHighlighting(tokens: SyntaxToken[], theme: Record<string, string>): Array<{ start: number; end: number; className: string }> {
    const highlights: Array<{ start: number; end: number; className: string }> = [];

    const colorMap: Record<string, string> = {
      keyword: theme['syntax.keyword'] || 'keyword',
      string: theme['syntax.string'] || 'string',
      number: theme['syntax.number'] || 'number',
      comment: theme['syntax.comment'] || 'comment',
      function: theme['syntax.function'] || 'function',
      variable: theme['syntax.variable'] || 'variable',
      type: theme['syntax.type'] || 'type',
      operator: theme['syntax.operator'] || 'operator',
      punctuation: theme['syntax.punctuation'] || 'punctuation'
    };

    tokens.forEach(token => {
      const className = colorMap[token.type] || token.type;
      const startOffset = this.positionToOffset(token.start, content);
      const endOffset = this.positionToOffset(token.end, content);
      highlights.push({ start: startOffset, end: endOffset, className });
    });

    return highlights;
  }

  private positionToOffset(position: EditorTabPosition, content: string): number {
    const lines = content.split('\n');
    let offset = 0;
    for (let i = 0; i < position.line - 1 && i < lines.length; i++) {
      offset += lines[i].length + 1;
    }
    offset += position.column - 1;
    return offset;
  }

  private offsetToPosition(offset: number, content: string): EditorTabPosition {
    const lines = content.split('\n');
    let currentOffset = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1;
      if (currentOffset + lineLength > offset) {
        return { line: i + 1, column: offset - currentOffset + 1 };
      }
      currentOffset += lineLength;
    }
    return { line: lines.length, column: lines[lines.length - 1].length + 1 };
  }

  // Autocomplete
  getAutocompleteItems(
    content: string,
    position: EditorTabPosition,
    language: string
  ): AutocompleteItem[] {
    return this.getLanguageHandler(language).getAutocomplete(content, position);
  }

  resolveAutocompleteItem(item: AutocompleteItem): AutocompleteItem {
    return this.getLanguageHandler('typescript').resolve(item);
  }

  // Formatting
  format(content: string, options: FormattingOptions, language: string): string {
    return this.getLanguageHandler(language).format(content, options);
  }

  formatRange(content: string, start: EditorTabPosition, end: EditorTabPosition, options: FormattingOptions, language: string): string {
    return this.getLanguageHandler(language).formatRange(content, start, end, options);
  }

  // Code Actions
  getCodeActions(content: string, position: EditorTabPosition, language: string): Array<{ title: string; kind: string; command?: string }> {
    return this.getLanguageHandler(language).getCodeActions(content, position);
  }

  // Code Lenses
  getCodeLenses(content: string, language: string): CodeLens[] {
    return this.getLanguageHandler(language).getCodeLenses(content);
  }

  // Folding
  getFoldingRanges(content: string, language: string): Array<{ start: number; end: number; kind?: string }> {
    return this.getLanguageHandler(language).getFoldingRanges(content);
  }

  // Navigation
  getDefinition(content: string, position: EditorTabPosition, language: string): EditorTabPosition | undefined {
    return this.getLanguageHandler(language).getDefinition(content, position);
  }

  getTypeDefinition(content: string, position: EditorTabPosition, language: string): EditorTabPosition | undefined {
    return this.getLanguageHandler(language).getTypeDefinition(content, position);
  }

  getReferences(content: string, position: EditorTabPosition, language: string): Array<{ position: EditorTabPosition; line: string }> {
    return this.getLanguageHandler(language).getReferences(content, position);
  }

  getDocumentSymbol(content: string, language: string): Array<{ name: string; kind: string; position: EditorTabPosition; endPosition: EditorTabPosition }> {
    return this.getLanguageHandler(language).getDocumentSymbols(content);
  }

  // Commands
  executeCommand(command: EditorCommand, content: string, language: string): { content: string; cursorPosition: EditorTabPosition } {
    const handler = this.getLanguageHandler(language);
    return handler.executeCommand(command, content);
  }

  // Comments
  toggleLineComment(content: string, line: number, language: string): string {
    const lines = content.split('\n');
    const lineContent = lines[line - 1];
    const commentPrefix = this.getLineCommentPrefix(language);

    if (lineContent.trimStart().startsWith(commentPrefix)) {
      // Remove comment
      lines[line - 1] = lineContent.replace(new RegExp(`^(\\s*)${this.escapeRegex(commentPrefix)}\\s*`), '$1');
    } else {
      // Add comment
      const match = lineContent.match(/^(\s*)/);
      lines[line - 1] = (match ? match[1] : '') + commentPrefix + ' ' + lineContent.trimStart();
    }

    return lines.join('\n');
  }

  toggleBlockComment(content: string, start: EditorTabPosition, end: EditorTabPosition, language: string): string {
    const lines = content.split('\n');
    const startLine = lines[start.line - 1];
    const endLine = lines[end.line - 1];
    const blockComment = this.getBlockComment(language);

    if (startLine.includes(blockComment.start) && endLine.includes(blockComment.end)) {
      // Remove comment
      lines[start.line - 1] = startLine.replace(blockComment.start, '');
      lines[end.line - 1] = endLine.replace(blockComment.end, '');
    } else {
      // Add comment
      lines[start.line - 1] = blockComment.start + startLine;
      lines[end.line - 1] = endLine + blockComment.end;
    }

    return lines.join('\n');
  }

  private getLineCommentPrefix(language: string): string {
    const prefixes: Record<string, string> = {
      javascript: '//',
      typescript: '//',
      python: '#',
      html: '<!--',
      css: '/*',
      scss: '//',
      json: '//',
      markdown: '<!--',
      sql: '--',
      shell: '#',
      go: '//',
      rust: '//',
      java: '//',
      c: '//',
      cpp: '//',
      csharp: '//'
    };
    return prefixes[language] || '//';
  }

  private getBlockComment(language: string): { start: string; end: string } {
    const comments: Record<string, { start: string; end: string }> = {
      javascript: { start: '/* ', end: ' */' },
      typescript: { start: '/* ', end: ' */' },
      python: { start: '"""', end: '"""' },
      css: { start: '/* ', end: ' */' },
      html: { start: '<!-- ', end: ' -->' },
      markdown: { start: '<!-- ', end: ' -->' }
    };
    return comments[language] || { start: '/* ', end: ' */' };
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

// Base Language Handler Interface
export interface LanguageHandler {
  tokenize(content: string): SyntaxToken[];
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[];
  resolve(item: AutocompleteItem): AutocompleteItem;
  format(content: string, options: FormattingOptions): string;
  formatRange(content: string, start: EditorTabPosition, end: EditorTabPosition, options: FormattingOptions): string;
  getCodeActions(content: string, position: EditorTabPosition): Array<{ title: string; kind: string; command?: string }>;
  getCodeLenses(content: string): CodeLens[];
  getFoldingRanges(content: string): Array<{ start: number; end: number; kind?: string }>;
  getDefinition(content: string, position: EditorTabPosition): EditorTabPosition | undefined;
  getTypeDefinition(content: string, position: EditorTabPosition): EditorTabPosition | undefined;
  getReferences(content: string, position: EditorTabPosition): Array<{ position: EditorTabPosition; line: string }>;
  getDocumentSymbols(content: string): Array<{ name: string; kind: string; position: EditorTabPosition; endPosition: EditorTabPosition }>;
  executeCommand(command: EditorCommand, content: string): { content: string; cursorPosition: EditorTabPosition };
}

// Base implementation
abstract class BaseLanguageHandler implements LanguageHandler {
  tokenize(content: string): SyntaxToken[] {
    return [];
  }

  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    return [];
  }

  resolve(item: AutocompleteItem): AutocompleteItem {
    return item;
  }

  format(content: string, options: FormattingOptions): string {
    return content;
  }

  formatRange(content: string, start: EditorTabPosition, end: EditorTabPosition, options: FormattingOptions): string {
    return content;
  }

  getCodeActions(content: string, position: EditorTabPosition): Array<{ title: string; kind: string; command?: string }> {
    return [];
  }

  getCodeLenses(content: string): CodeLens[] {
    return [];
  }

  getFoldingRanges(content: string): Array<{ start: number; end: number; kind?: string }> {
    return [];
  }

  getDefinition(content: string, position: EditorTabPosition): EditorTabPosition | undefined {
    return undefined;
  }

  getTypeDefinition(content: string, position: EditorTabPosition): EditorTabPosition | undefined {
    return undefined;
  }

  getReferences(content: string, position: EditorTabPosition): Array<{ position: EditorTabPosition; line: string }> {
    return [];
  }

  getDocumentSymbols(content: string): Array<{ name: string; kind: string; position: EditorTabPosition; endPosition: EditorTabPosition }> {
    return [];
  }

  executeCommand(command: EditorCommand, content: string): { content: string; cursorPosition: EditorTabPosition } {
    return { content, cursorPosition: { line: 1, column: 1 } };
  }

  protected getLineTokens(line: string): Array<{ type: string; value: string }> {
    const tokens: Array<{ type: string; value: string }> = [];
    const patterns = [
      { type: 'string', regex: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/ },
      { type: 'number', regex: /\b\d+\.?\d*\b/ },
      { type: 'keyword', regex: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|extends|implements|interface|type|enum|namespace|module|declare|public|private|protected|static|readonly|abstract|as|is|in|of|get|set)\b/ },
      { type: 'comment', regex: /\/\/.*|\/\*[\s\S]*?\*\// },
      { type: 'operator', regex: /[+\-*/%=<>!&|^~?:]+/ },
      { type: 'punctuation', regex: /[{}[\]();,.]/ }
    ];

    let remaining = line;
    while (remaining.length > 0) {
      let matched = false;
      for (const pattern of patterns) {
        const match = remaining.match(pattern.regex);
        if (match && match.index === 0) {
          tokens.push({ type: pattern.type, value: match[0] });
          remaining = remaining.slice(match[0].length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        const nextSpecial = remaining.search(/["'`\/\d]|[a-zA-Z_$][\w$]*|[+\-*/%=<>!&|^~?:]|[\[\]{}();,.]/);
        if (nextSpecial > 0) {
          tokens.push({ type: 'identifier', value: remaining.slice(0, nextSpecial) });
          remaining = remaining.slice(nextSpecial);
        } else if (nextSpecial === 0) {
          tokens.push({ type: 'identifier', value: remaining[0] });
          remaining = remaining.slice(1);
        } else {
          tokens.push({ type: 'identifier', value: remaining });
          break;
        }
      }
    }
    return tokens;
  }
}

// JavaScript Handler
class JavaScriptHandler extends BaseLanguageHandler {
  tokenize(content: string): SyntaxToken[] {
    const tokens: SyntaxToken[] = [];
    const lines = content.split('\n');
    let line = 1;
    let column = 1;

    for (const lineContent of lines) {
      const lineTokens = this.getLineTokens(lineContent);
      let currentColumn = 1;
      for (const token of lineTokens) {
        tokens.push({
          type: token.type,
          value: token.value,
          start: { line, column: currentColumn },
          end: { line, column: currentColumn + token.value.length }
        });
        currentColumn += token.value.length;
      }
      line++;
    }
    return tokens;
  }

  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    const keywords: AutocompleteItem[] = [
      { label: 'const', kind: 'keyword', insertText: 'const ' },
      { label: 'let', kind: 'keyword', insertText: 'let ' },
      { label: 'var', kind: 'keyword', insertText: 'var ' },
      { label: 'function', kind: 'keyword', insertText: 'function ${1:name}(${2:params}) {\n\t$0\n}', sortText: '1' },
      { label: 'return', kind: 'keyword', insertText: 'return ' },
      { label: 'if', kind: 'keyword', insertText: 'if (${1:condition}) {\n\t$0\n}' },
      { label: 'else', kind: 'keyword', insertText: 'else {\n\t$0\n}' },
      { label: 'for', kind: 'keyword', insertText: 'for (${1:let i = 0; i < ${2:length}; i++) {\n\t$0\n}' },
      { label: 'while', kind: 'keyword', insertText: 'while (${1:condition}) {\n\t$0\n}' },
      { label: 'class', kind: 'keyword', insertText: 'class ${1:ClassName} {\n\tconstructor(${2:params}) {\n\t\t$0\n\t}\n}' },
      { label: 'import', kind: 'keyword', insertText: 'import { ${1:member} } from \'${2:module}\';' },
      { label: 'export', kind: 'keyword', insertText: 'export ' },
      { label: 'async', kind: 'keyword', insertText: 'async ' },
      { label: 'await', kind: 'keyword', insertText: 'await ' },
      { label: 'try', kind: 'keyword', insertText: 'try {\n\t$0\n} catch (${1:error}) {\n\t${2:console.error(error);}\n}' },
      { label: 'catch', kind: 'keyword', insertText: 'catch (${1:error}) {\n\t$0\n}' },
      { label: 'console.log', kind: 'function', detail: 'console.log(...data)', insertText: 'console.log(${1:data});' },
      { label: 'console.error', kind: 'function', detail: 'console.error(...data)', insertText: 'console.error(${1:data});' }
    ];
    return keywords;
  }

  getCodeActions(content: string, position: EditorTabPosition): Array<{ title: string; kind: string; command?: string }> {
    return [
      { title: 'Add missing semicolon', kind: 'quickfix', command: 'editor.action.addSemicolon' },
      { title: 'Convert to arrow function', kind: 'refactor', command: 'editor.action.arrowFunction' },
      { title: 'Extract to function', kind: 'refactor', command: 'editor.action.extractFunction' },
      { title: 'Organize imports', kind: 'source', command: 'editor.action.organizeImports' }
    ];
  }

  getCodeLenses(content: string): CodeLens[] {
    const lenses: CodeLens[] = [];
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const funcMatch = line.match(/^(export\s+)?(async\s+)?function\s+(\w+)/);
      if (funcMatch) {
        lenses.push({
          range: { startLine: index + 1, endLine: index + 1 },
          isResolved: true
        });
      }
    });
    return lenses;
  }

  getDocumentSymbols(content: string): Array<{ name: string; kind: string; position: EditorTabPosition; endPosition: EditorTabPosition }> {
    const symbols: Array<{ name: string; kind: string; position: EditorTabPosition; endPosition: EditorTabPosition }> = [];
    const lines = content.split('\n');
    let braceCount = 0;
    let currentFunction: string | null = null;
    let functionStartLine = 0;

    lines.forEach((line, index) => {
      const funcMatch = line.match(/^(export\s+)?(async\s+)?function\s+(\w+)/);
      if (funcMatch) {
        currentFunction = funcMatch[3];
        functionStartLine = index + 1;
        braceCount = 0;
        symbols.push({
          name: funcMatch[3],
          kind: 'function',
          position: { line: index + 1, column: 1 },
          endPosition: { line: index + 1, column: line.length }
        });
      }

      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
    });

    return symbols;
  }
}

// TypeScript Handler
class TypeScriptHandler extends JavaScriptHandler {
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    const base = super.getAutocomplete(content, position);
    const typescript: AutocompleteItem[] = [
      { label: 'interface', kind: 'keyword', insertText: 'interface ${1:Name} {\n\t$0\n}' },
      { label: 'type', kind: 'keyword', insertText: 'type ${1:Name} = ${2:string};' },
      { label: 'enum', kind: 'keyword', insertText: 'enum ${1:Name} {\n\t$0\n}' },
      { label: 'namespace', kind: 'keyword', insertText: 'namespace ${1:Name} {\n\t$0\n}' },
      { label: 'readonly', kind: 'keyword', insertText: 'readonly ' },
      { label: 'as', kind: 'keyword', insertText: 'as ${1:type}' },
      { label: 'keyof', kind: 'keyword', insertText: 'keyof ' },
      { label: 'typeof', kind: 'keyword', insertText: 'typeof ' }
    ];
    return [...base, ...typescript];
  }
}

// Python Handler
class PythonHandler extends BaseLanguageHandler {
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    return [
      { label: 'def', kind: 'function', insertText: 'def ${1:name}(${2:args}):\n\t$0' },
      { label: 'class', kind: 'class', insertText: 'class ${1:Name}(${2:object}):\n\tdef __init__(self${3: args}):\n\t\t$0' },
      { label: 'if', kind: 'keyword', insertText: 'if ${1:condition}:\n\t$0' },
      { label: 'elif', kind: 'keyword', insertText: 'elif ${1:condition}:\n\t$0' },
      { label: 'else', kind: 'keyword', insertText: 'else:\n\t$0' },
      { label: 'for', kind: 'keyword', insertText: 'for ${1:item} in ${2:iterable}:\n\t$0' },
      { label: 'while', kind: 'keyword', insertText: 'while ${1:condition}:\n\t$0' },
      { label: 'try', kind: 'keyword', insertText: 'try:\n\t$0\nexcept ${1:Exception} as ${2:e}:\n\t${3:pass}' },
      { label: 'with', kind: 'keyword', insertText: 'with ${1:context}:' },
      { label: 'import', kind: 'keyword', insertText: 'import ' },
      { label: 'from', kind: 'keyword', insertText: 'from ${1:module} import ${2:name}' },
      { label: 'async', kind: 'keyword', insertText: 'async ' },
      { label: 'await', kind: 'keyword', insertText: 'await ' },
      { label: 'lambda', kind: 'keyword', insertText: 'lambda ${1:x}: ${2:x}' },
      { label: 'print', kind: 'function', detail: 'print(*objects)', insertText: 'print($0)' },
      { label: 'self', kind: 'variable', detail: 'self', insertText: 'self' }
    ];
  }
}

// HTML Handler
class HtmlHandler extends BaseLanguageHandler {
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    return [
      { label: 'div', kind: 'snippet', insertText: '<div>\n\t$0\n</div>' },
      { label: 'span', kind: 'snippet', insertText: '<span>$0</span>' },
      { label: 'p', kind: 'snippet', insertText: '<p>$0</p>' },
      { label: 'a', kind: 'snippet', insertText: '<a href="$1">$0</a>' },
      { label: 'img', kind: 'snippet', insertText: '<img src="$1" alt="$2">' },
      { label: 'ul', kind: 'snippet', insertText: '<ul>\n\t<li>$0</li>\n</ul>' },
      { label: 'ol', kind: 'snippet', insertText: '<ol>\n\t<li>$0</li>\n</ol>' },
      { label: 'li', kind: 'snippet', insertText: '<li>$0</li>' },
      { label: 'table', kind: 'snippet', insertText: '<table>\n\t<tr>\n\t\t<td>$0</td>\n\t</tr>\n</table>' },
      { label: 'form', kind: 'snippet', insertText: '<form action="$1" method="${2:POST}">\n\t$0\n</form>' },
      { label: 'input', kind: 'snippet', insertText: '<input type="$1" name="$2" id="$3">' },
      { label: 'button', kind: 'snippet', insertText: '<button type="${1:button}">$0</button>' },
      { label: 'script', kind: 'snippet', insertText: '<script>\n\t$0\n</script>' },
      { label: 'style', kind: 'snippet', insertText: '<style>\n\t$0\n</style>' },
      { label: 'link', kind: 'snippet', insertText: '<link rel="${1:stylesheet}" href="${2:style.css}">' },
      { label: 'meta', kind: 'snippet', insertText: '<meta name="${1:name}" content="${2:content}">' },
      { label: 'DOCTYPE', kind: 'snippet', insertText: '<!DOCTYPE html>' }
    ];
  }
}

// CSS Handler
class CssHandler extends BaseLanguageHandler {
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    return [
      { label: 'color', kind: 'property', detail: 'color: value;', insertText: 'color: $0;' },
      { label: 'background', kind: 'property', detail: 'background: value;', insertText: 'background: $0;' },
      { label: 'margin', kind: 'property', detail: 'margin: value;', insertText: 'margin: $0;' },
      { label: 'padding', kind: 'property', detail: 'padding: value;', insertText: 'padding: $0;' },
      { label: 'display', kind: 'property', detail: 'display: value;', insertText: 'display: $0;' },
      { label: 'flex', kind: 'property', detail: 'flex: value;', insertText: 'flex: $0;' },
      { label: 'grid', kind: 'property', detail: 'grid: value;', insertText: 'grid: $0;' },
      { label: 'position', kind: 'property', detail: 'position: value;', insertText: 'position: $0;' },
      { label: 'width', kind: 'property', detail: 'width: value;', insertText: 'width: $0;' },
      { label: 'height', kind: 'property', detail: 'height: value;', insertText: 'height: $0;' },
      { label: 'border', kind: 'property', detail: 'border: value;', insertText: 'border: $0;' },
      { label: 'font-size', kind: 'property', detail: 'font-size: value;', insertText: 'font-size: $0;' },
      { label: 'font-family', kind: 'property', detail: 'font-family: value;', insertText: 'font-family: $0;' },
      { label: 'text-align', kind: 'property', detail: 'text-align: value;', insertText: 'text-align: $0;' },
      { label: 'overflow', kind: 'property', detail: 'overflow: value;', insertText: 'overflow: $0;' }
    ];
  }
}

// JSON Handler
class JsonHandler extends BaseLanguageHandler {
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    return [
      { label: '{ }', kind: 'snippet', insertText: '{\n\t$0\n}' },
      { label: '[ ]', kind: 'snippet', insertText: '[\n\t$0\n]' },
      { label: '"key": "value"', kind: 'snippet', insertText: '"${1:key}": "${2:value}"' }
    ];
  }
}

// Markdown Handler
class MarkdownHandler extends BaseLanguageHandler {
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    return [
      { label: '# Heading', kind: 'snippet', insertText: '# ${1:Heading}' },
      { label: '## Heading', kind: 'snippet', insertText: '## ${1:Heading}' },
      { label: '### Heading', kind: 'snippet', insertText: '### ${1:Heading}' },
      { label: '**bold**', kind: 'snippet', insertText: '**${1:text}**' },
      { label: '*italic*', kind: 'snippet', insertText: '*${1:text}*' },
      { label: '[link](url)', kind: 'snippet', insertText: '[${1:text}](${2:url})' },
      { label: '![image](url)', kind: 'snippet', insertText: '![${1:alt}](${2:url})' },
      { label: '```code```', kind: 'snippet', insertText: '```${1:language}\n$0\n```' },
      { label: '- list item', kind: 'snippet', insertText: '- ${1:item}' },
      { label: '1. list item', kind: 'snippet', insertText: '1. ${1:item}' },
      { label: '> quote', kind: 'snippet', insertText: '> ${1:quote}' },
      { label: '---', kind: 'snippet', insertText: '---' },
      { label: '| table |', kind: 'snippet', insertText: '| ${1:Header 1} | ${2:Header 2} |\n|---------|--------|\n| ${3:Cell 1}   | ${4:Cell 2}   |' }
    ];
  }
}

// SQL Handler
class SqlHandler extends BaseLanguageHandler {
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    return [
      { label: 'SELECT', kind: 'keyword', insertText: 'SELECT ${1:*} FROM ${2:table}' },
      { label: 'SELECT DISTINCT', kind: 'keyword', insertText: 'SELECT DISTINCT ${1:*} FROM ${2:table}' },
      { label: 'WHERE', kind: 'keyword', insertText: 'WHERE ${1:condition}' },
      { label: 'ORDER BY', kind: 'keyword', insertText: 'ORDER BY ${1:column} ${2:ASC}' },
      { label: 'GROUP BY', kind: 'keyword', insertText: 'GROUP BY ${1:column}' },
      { label: 'HAVING', kind: 'keyword', insertText: 'HAVING ${1:condition}' },
      { label: 'JOIN', kind: 'keyword', insertText: 'JOIN ${1:table} ON ${2:condition}' },
      { label: 'LEFT JOIN', kind: 'keyword', insertText: 'LEFT JOIN ${1:table} ON ${2:condition}' },
      { label: 'RIGHT JOIN', kind: 'keyword', insertText: 'RIGHT JOIN ${1:table} ON ${2:condition}' },
      { label: 'INSERT INTO', kind: 'keyword', insertText: 'INSERT INTO ${1:table} (${2:columns}) VALUES (${3:values})' },
      { label: 'UPDATE', kind: 'keyword', insertText: 'UPDATE ${1:table} SET ${2:column} = ${3:value}' },
      { label: 'DELETE FROM', kind: 'keyword', insertText: 'DELETE FROM ${1:table} WHERE ${2:condition}' },
      { label: 'CREATE TABLE', kind: 'keyword', insertText: 'CREATE TABLE ${1:table} (\n\t${2:id} INT PRIMARY KEY,\n\t$0\n)' },
      { label: 'ALTER TABLE', kind: 'keyword', insertText: 'ALTER TABLE ${1:table} ADD ${2:column} ${3:type}' },
      { label: 'DROP TABLE', kind: 'keyword', insertText: 'DROP TABLE ${1:table}' }
    ];
  }
}

// Shell Handler
class ShellHandler extends BaseLanguageHandler {
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    return [
      { label: 'echo', kind: 'function', insertText: 'echo "${1:text}"' },
      { label: 'if', kind: 'keyword', insertText: 'if [ ${1:condition} ]; then\n\t$0\nfi' },
      { label: 'for', kind: 'keyword', insertText: 'for ${1:var} in ${2:list}; do\n\t$0\ndone' },
      { label: 'while', kind: 'keyword', insertText: 'while [ ${1:condition} ]; do\n\t$0\ndone' },
      { label: 'case', kind: 'keyword', insertText: 'case ${1:var} in\n\t${2:pattern}) ${3:command};;\nesac' },
      { label: 'function', kind: 'keyword', insertText: '${1:name}() {\n\t$0\n}' },
      { label: 'export', kind: 'keyword', insertText: 'export ${1:VAR}=${2:value}' },
      { label: 'cd', kind: 'function', insertText: 'cd ${1:directory}' },
      { label: 'ls', kind: 'function', insertText: 'ls ${1:-la}' },
      { label: 'grep', kind: 'function', insertText: 'grep "${1:pattern}" ${2:file}' },
      { label: 'awk', kind: 'function', insertText: "awk '${1:{print $2}}' ${2:file}" },
      { label: 'sed', kind: 'function', insertText: "sed '${1:s/old/new/g}' ${2:file}" },
      { label: 'npm', kind: 'function', insertText: 'npm ${1:install} ${2:package}' },
      { label: 'git', kind: 'function', insertText: 'git ${1:status}' }
    ];
  }
}

// Go Handler
class GoHandler extends BaseLanguageHandler {
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    return [
      { label: 'func', kind: 'function', insertText: 'func ${1:name}(${2:params}) ${3:returnType} {\n\t$0\n}' },
      { label: 'package', kind: 'keyword', insertText: 'package ${1:main}' },
      { label: 'import', kind: 'keyword', insertText: 'import "${1:package}"' },
      { label: 'type', kind: 'keyword', insertText: 'type ${1:Name} struct {\n\t$0\n}' },
      { label: 'interface', kind: 'keyword', insertText: 'type ${1:Name} interface {\n\t$0\n}' },
      { label: 'struct', kind: 'keyword', insertText: 'struct {\n\t$0\n}' },
      { label: 'if', kind: 'keyword', insertText: 'if ${1:err} != nil {\n\t$0\n}' },
      { label: 'for', kind: 'keyword', insertText: 'for ${1:i := 0; i < ${2:len}; i++} {\n\t$0\n}' },
      { label: 'range', kind: 'keyword', insertText: 'for ${1:k}, ${2:v} := range ${3:collection} {\n\t$0\n}' },
      { label: 'switch', kind: 'keyword', insertText: 'switch ${1:value} {\ncase ${2:condition}:\n\t$0\n}' },
      { label: 'defer', kind: 'keyword', insertText: 'defer ' },
      { label: 'go', kind: 'keyword', insertText: 'go ' },
      { label: 'chan', kind: 'keyword', insertText: 'chan ' },
      { label: 'make', kind: 'function', insertText: 'make(${1:type})' },
      { label: 'append', kind: 'function', insertText: 'append(${1:slice}, ${2:element})' },
      { label: 'fmt.Println', kind: 'function', insertText: 'fmt.Println("${1:text}")' }
    ];
  }
}

// Rust Handler
class RustHandler extends BaseLanguageHandler {
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    return [
      { label: 'fn', kind: 'function', insertText: 'fn ${1:name}(${2:params}) ${3:-> ReturnType} {\n\t$0\n}' },
      { label: 'let', kind: 'keyword', insertText: 'let ${1:name} = ${2:value};' },
      { label: 'let mut', kind: 'keyword', insertText: 'let mut ${1:name} = ${2:value};' },
      { label: 'struct', kind: 'keyword', insertText: 'struct ${1:Name} {\n\t$0\n}' },
      { label: 'impl', kind: 'keyword', insertText: 'impl ${1:Type} {\n\t$0\n}' },
      { label: 'enum', kind: 'keyword', insertText: 'enum ${1:Name} {\n\t$0\n}' },
      { label: 'trait', kind: 'keyword', insertText: 'trait ${1:Name} {\n\t$0\n}' },
      { label: 'pub', kind: 'keyword', insertText: 'pub ' },
      { label: 'use', kind: 'keyword', insertText: 'use ${1:module};' },
      { label: 'mod', kind: 'keyword', insertText: 'mod ${1:name};' },
      { label: 'match', kind: 'keyword', insertText: 'match ${1:value} {\n\t${2:pattern} => $0\n}' },
      { label: 'if let', kind: 'keyword', insertText: 'if let ${1:Some(value)} = ${2:option} {\n\t$0\n}' },
      { label: 'while let', kind: 'keyword', insertText: 'while let ${1:Some(value)} = ${2:option} {\n\t$0\n}' },
      { label: 'for', kind: 'keyword', insertText: 'for ${1:item} in ${2:collection} {\n\t$0\n}' },
      { label: 'println!', kind: 'function', insertText: 'println!("${1:text}")' }
    ];
  }
}

// Java Handler
class JavaHandler extends BaseLanguageHandler {
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    return [
      { label: 'public class', kind: 'class', insertText: 'public class ${1:Name} {\n\t$0\n}' },
      { label: 'public static void main', kind: 'snippet', insertText: 'public static void main(String[] args) {\n\t$0\n}' },
      { label: 'public', kind: 'keyword', insertText: 'public ' },
      { label: 'private', kind: 'keyword', insertText: 'private ' },
      { label: 'protected', kind: 'keyword', insertText: 'protected ' },
      { label: 'void', kind: 'keyword', insertText: 'void ' },
      { label: 'extends', kind: 'keyword', insertText: 'extends ' },
      { label: 'implements', kind: 'keyword', insertText: 'implements ' },
      { label: 'import', kind: 'keyword', insertText: 'import ${1:package}.${2:Class};' },
      { label: 'package', kind: 'keyword', insertText: 'package ${1:package};' },
      { label: 'new', kind: 'keyword', insertText: 'new ' },
      { label: 'System.out.println', kind: 'function', insertText: 'System.out.println(${1:arg});' },
      { label: 'try', kind: 'keyword', insertText: 'try {\n\t$0\n} catch (${1:Exception} e) {\n\t${2:e.printStackTrace();}\n}' }
    ];
  }
}

// C++ Handler
class CppHandler extends BaseLanguageHandler {
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    return [
      { label: '#include', kind: 'keyword', insertText: '#include <${1:header}>' },
      { label: '#define', kind: 'keyword', insertText: '#define ${1:MACRO} ${2:value}' },
      { label: 'int main', kind: 'snippet', insertText: 'int main(${1:int argc, char* argv[]}) {\n\t$0\n\treturn 0;\n}' },
      { label: 'class', kind: 'keyword', insertText: 'class ${1:Name} {\npublic:\n\t$0\nprivate:\n\t\n};' },
      { label: 'struct', kind: 'keyword', insertText: 'struct ${1:Name} {\n\t$0\n};' },
      { label: 'namespace', kind: 'keyword', insertText: 'namespace ${1:Name} {\n\t$0\n}' },
      { label: 'template', kind: 'keyword', insertText: 'template <typename ${1:T}>\n$0' },
      { label: 'std::', kind: 'snippet', insertText: 'std::' },
      { label: 'cout <<', kind: 'function', insertText: 'std::cout << ${1:arg} << std::endl;' },
      { label: 'cin >>', kind: 'function', insertText: 'std::cin >> ${1:var};' },
      { label: 'for', kind: 'keyword', insertText: 'for (${1:int i = 0; i < ${2:n}; i++}) {\n\t$0\n}' }
    ];
  }
}

// C# Handler
class CSharpHandler extends BaseLanguageHandler {
  getAutocomplete(content: string, position: EditorTabPosition): AutocompleteItem[] {
    return [
      { label: 'using', kind: 'keyword', insertText: 'using ${1:System};' },
      { label: 'namespace', kind: 'keyword', insertText: 'namespace ${1:Namespace} {\n\t$0\n}' },
      { label: 'public class', kind: 'class', insertText: 'public class ${1:Name} {\n\t$0\n}' },
      { label: 'public static void Main', kind: 'snippet', insertText: 'public static void Main(string[] args) {\n\t$0\n}' },
      { label: 'public', kind: 'keyword', insertText: 'public ' },
      { label: 'private', kind: 'keyword', insertText: 'private ' },
      { label: 'protected', kind: 'keyword', insertText: 'protected ' },
      { label: 'internal', kind: 'keyword', insertText: 'internal ' },
      { label: 'async Task', kind: 'keyword', insertText: 'async Task ${1:MethodName}Async() {\n\t$0\n}' },
      { label: 'Console.WriteLine', kind: 'function', insertText: 'Console.WriteLine(${1:arg});' },
      { label: 'var', kind: 'keyword', insertText: 'var ${1:name} = ${2:value};' },
      { label: 'new', kind: 'keyword', insertText: 'new ' },
      { label: 'if', kind: 'keyword', insertText: 'if (${1:condition}) {\n\t$0\n}' },
      { label: 'foreach', kind: 'keyword', insertText: 'foreach (var ${1:item} in ${2:collection}) {\n\t$0\n}' }
    ];
  }
}

// Plaintext Handler
class PlaintextHandler extends BaseLanguageHandler {}

export default CodeEditor;

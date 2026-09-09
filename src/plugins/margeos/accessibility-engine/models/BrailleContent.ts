// @ts-nocheck
// Accessibility Engine — BrailleContent Models
// Braille content types and configurations

export type BrailleGrade = 1 | 2;
export type BrailleTableType = "unified" | "computer" | "literary" | "math" | "music" | "nemeth";
export type BrailleStandard = "ueb" | "ebaeb" | "bana" | "custom";

export interface BrailleContent {
  id: string;

  // Source content
  sourceContent: string;
  sourceFormat: "text" | "html" | "latex" | "mathml" | "audio_timestamp";

  // Braille conversion
  brailleText: string;
  formattedBraille: string[];

  // Metadata
  language: string;
  grade: BrailleGrade;
  tableType: BrailleTableType;
  standard: BrailleStandard;

  // Technical details
  dotPattern: boolean[][]; // 6 or 8 dot patterns
  useEightDot: boolean;

  // Formatting
  lineLength: number; // characters per line
  linesPerPage: number;
  pageCount: number;

  // Navigation
  pageBreaks: number[]; // indices where pages start
  sectionMarkers: SectionMarker[];

  // Version
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionMarker {
  type: "heading" | "page" | "chapter" | "note" | "table" | "list" | "custom";
  position: number;
  text: string;
  level?: number;
  brailleText: string;
}

export interface BrailleDisplayState {
  // Display info
  connected: boolean;
  displayName: string;
  manufacturer?: string;

  // Capabilities
  rowCount: number;
  columnCount: number;
  supportsEightDot: boolean;
  supportsInput: boolean;
  supportsRouting: boolean;
  hasStatusCells: boolean;
  statusCellCount: number;

  // Current content
  currentPosition: number;
  currentContent: string;
  cursorPosition: number;

  // Settings
  brailleTable: string;
  cursorStyle: "blinking" | "steady" | "off";
  routerKeyMode: "pan" | "select" | "routing";
}

export interface BrailleNavigationContext {
  content: BrailleContent;

  // Current position
  currentPage: number;
  currentLine: number;
  currentIndex: number;

  // Viewport
  visibleLines: number;
  viewportStart: number;

  // History
  navigationHistory: NavigationPoint[];

  // Bookmarks
  bookmarks: BrailleBookmark[];

  // Position info
  contextInfo: string; // "Page X of Y", "Section: ..."
}

export interface NavigationPoint {
  position: number;
  page: number;
  line: number;
  timestamp: Date;
  action: "goto" | "find" | "scroll" | "link";
  reference?: string;
}

export interface BrailleBookmark {
  id: string;
  position: number;
  label: string;
  note?: string;
  createdAt: Date;
}

export interface BrailleTable {
  id: string;
  name: string;
  type: BrailleTableType;
  standard: BrailleStandard;

  // Mappings
  characterToDots: Map<string, string>; // character -> dot pattern (e.g., "a" -> "1")
  dotsToCharacter: Map<string, string>; // reverse mapping
  contractionMap: Map<string, string>; // word -> contracted form

  // Rules
  rules: BrailleRule[];

  // Metadata
  language: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface BrailleRule {
  type: "capital" | "number" | "contraction" | "symbol" | "grade_change" | "emphasis" | "custom";
  pattern: string;
  replacement: string;
  context?: string; // when this rule applies
  priority: number; // higher = applied first
}

// Braille generation request
export interface BrailleGenerationRequest {
  contentId: string;
  sourceContent: string;
  sourceFormat: BrailleContent["sourceFormat"];

  // Braille settings
  language: string;
  grade: BrailleGrade;
  tableType: BrailleTableType;
  standard: BrailleStandard;

  // Formatting
  lineLength: number;
  linesPerPage: number;
  useEightDot: boolean;

  // Options
  preserveFormatting: boolean;
  includePageNumbers: boolean;
  includeRunningHeads: boolean;
  useContractions: boolean;
}

// Braille rendering for display
export interface BrailleDisplayRenderer {
  // Render content to display
  render(content: BrailleContent, position: number): string;

  // Navigate
  nextLine(): string;
  previousLine(): string;
  nextPage(): string;
  previousPage(): string;
  goToPosition(position: number): string;

  // Find
  find(text: string): number | null;

  // Status line
  getStatusLine(context: BrailleNavigationContext): string;
}

// Dot patterns (6-dot braille)
export const BRAILLE_DOT_PATTERNS: Record<string, string> = {
  " ": "000000",  // Space
  // Letters a-j (dots 1)
  "a": "100000", "b": "110000", "c": "100100", "d": "100110", "e": "100010",
  "f": "110100", "g": "110110", "h": "110010", "i": "010100", "j": "010110",
  // Letters k-t (dots 2)
  "k": "101000", "l": "111000", "m": "101100", "n": "101110", "o": "101010",
  "p": "111100", "q": "111110", "r": "111010", "s": "011100", "t": "011110",
  // Letters u-z (dots 3)
  "u": "101001", "v": "111001", "w": "010111", "x": "101101", "y": "101111",
  "z": "101011",
  // Numbers (indicator + letter)
  "1": "100000", "2": "110000", "3": "100100", "4": "100110", "5": "100010",
  "6": "110100", "7": "110110", "8": "110010", "9": "010100", "0": "010110",
  // Punctuation
  ",": "010000", ";": "011000", ":": "011010", ".": "010010", "!": "011010",
  "(": "011001", ")": "011001", "?": "011001", "-": "001000", "\"": "000001",
  "'": "000001", "\n": "000000", "\t": "000000",
  // Contractions (Grade 2)
  "the": "101110", "and": "100110", "for": "101100", "of": "110110", "to": "110010",
  "in": "010100", "is": "011100", "it": "011100", "be": "110000", "his": "110000",
  "was": "101000", "as": "101100", "with": "101000", "he": "110000", "have": "110000",
  "this": "101110", "from": "101100", "they": "011110", "I": "000001", "you": "011110",
  "he": "110000", "she": "101001", "were": "111000", "their": "011110", "that": "110000",
  "in": "010100", "for": "101100", "are": "100000", "with": "101000", "on": "110010",
  "not": "011100", "but": "110000", "by": "110000", "or": "110110", "on": "110010",
  "and": "100110", "a": "100000", "an": "100000", "by": "110000"
};

// Braille Unicode representation
export const BRAILLE_UNICODE_BASE = 0x2800;

export function dotsToUnicode(dotPattern: string): string {
  let code = BRAILLE_UNICODE_BASE;
  for (let i = 0; i < 6; i++) {
    if (dotPattern[i] === "1") {
      code |= (1 << i);
    }
  }
  return String.fromCharCode(code);
}

export function unicodeToDots(char: string): string {
  const code = char.charCodeAt(0) - BRAILLE_UNICODE_BASE;
  if (code < 0 || code > 63) return "000000";

  return [
    (code & 1) ? "1" : "0",
    (code & 2) ? "1" : "0",
    (code & 4) ? "1" : "0",
    (code & 8) ? "1" : "0",
    (code & 16) ? "1" : "0",
    (code & 32) ? "1" : "0"
  ].join("");
}

// Helper functions
export function createEmptyBrailleContent(
  contentId: string,
  sourceContent: string,
  sourceFormat: BrailleContent["sourceFormat"],
  language: string = "en"
): BrailleContent {
  return {
    id: `braille-${Date.now()}`,
    sourceContent,
    sourceFormat,
    brailleText: "",
    formattedBraille: [],
    language,
    grade: 2,
    tableType: "unified",
    standard: "ueb",
    dotPattern: [],
    useEightDot: false,
    lineLength: 40,
    linesPerPage: 25,
    pageCount: 0,
    pageBreaks: [],
    sectionMarkers: [],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export function textToBraille(
  text: string,
  grade: BrailleGrade = 2,
  tableType: BrailleTableType = "unified"
): string {
  let braille = "";
  let inNumber = false;
  let inWord = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i].toLowerCase();

    // Number mode
    if (/\d/.test(char)) {
      if (!inNumber) {
        braille += dotsToUnicode("001111"); // Number sign
        inNumber = true;
      }
      // Numbers use letter patterns
      const numberPattern = BRAILLE_DOT_PATTERNS[char.replace(/\d/, "0")];
      if (numberPattern) {
        braille += dotsToUnicode(numberPattern);
      }
      continue;
    } else if (inNumber) {
      inNumber = false;
    }

    // Word contractions (Grade 2)
    if (grade === 2) {
      inWord += char;

      // Check for contractions
      const contraction = BRAILLE_DOT_PATTERNS[inWord];
      if (contraction && (text[i + 1] === " " || text[i + 1] === "\n" || i === text.length - 1)) {
        braille += dotsToUnicode(contraction);
        inWord = "";
        continue;
      }

      // Reset if not a contraction word
      if (inWord.length > 5) {
        for (const c of inWord.slice(0, -1)) {
          const pattern = BRAILLE_DOT_PATTERNS[c];
          if (pattern) braille += dotsToUnicode(pattern);
        }
        inWord = inWord.slice(-1);
      }
    }

    // Capital letter indicator
    if (text[i] === text[i].toUpperCase() && /[a-z]/i.test(text[i])) {
      braille += dotsToUnicode("001110"); // Capital sign
    }

    // Regular character
    const pattern = BRAILLE_DOT_PATTERNS[char];
    if (pattern) {
      braille += dotsToUnicode(pattern);
    } else {
      braille += char; // Pass through unknown characters
    }
  }

  return braille;
}

export function formatBrailleForDisplay(
  braille: string,
  lineLength: number = 40,
  linesPerPage: number = 25
): string[] {
  const lines: string[] = [];
  let currentLine = "";

  for (const char of braille) {
    // Handle line breaks
    if (char === "\n") {
      lines.push(currentLine);
      currentLine = "";
      continue;
    }

    currentLine += char;

    if (currentLine.length >= lineLength) {
      // Word wrap
      const lastSpace = currentLine.lastIndexOf(" ");
      if (lastSpace > 0) {
        lines.push(currentLine.slice(0, lastSpace));
        currentLine = currentLine.slice(lastSpace + 1);
      } else {
        lines.push(currentLine);
        currentLine = "";
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  // Paginate
  const pages: string[] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage).join("\n"));
  }

  return pages;
}

export function calculateBraillePageCount(
  textLength: number,
  lineLength: number = 40,
  linesPerPage: number = 25
): number {
  // Account for expansion from contractions and indicators
  const estimatedExpansion = 1.3;
  const adjustedLength = textLength * estimatedExpansion;

  const charsPerPage = lineLength * linesPerPage;
  return Math.ceil(adjustedLength / charsPerPage);
}

export function getBraillePositionInfo(
  content: BrailleContent,
  position: number
): {
  page: number;
  line: number;
  column: number;
  context: string;
} {
  const lineIndex = Math.floor(position / content.lineLength);
  const pageIndex = Math.floor(lineIndex / content.linesPerPage);

  return {
    page: pageIndex + 1,
    line: (lineIndex % content.linesPerPage) + 1,
    column: (position % content.lineLength) + 1,
    context: `Page ${pageIndex + 1} of ${content.pageCount}`
  };
}

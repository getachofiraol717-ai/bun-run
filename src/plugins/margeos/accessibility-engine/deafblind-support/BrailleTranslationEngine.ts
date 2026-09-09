// @ts-nocheck
// Accessibility Engine — Braille Translation Engine
// Provides comprehensive Braille translation services

import type { AccessibilityProfile } from "../models/AccessibilityProfile";
import type { BrailleCell } from "../models/BrailleContent";

export interface BrailleTranslationConfig {
  enabled: boolean;
  grade: 1 | 2;
  system: "ueb" | "nemeth" | "comp6" | "computer";
  contractions: boolean;
  twoCellWords: boolean;
}

export interface TranslationResult {
  braille: string;
  asciiBraille: string;
  wordCount: number;
  charCount: number;
  translationTime: number;
}

export interface BrailleWord {
  original: string;
  braille: string;
  contracted: boolean;
  type: "word" | "number" | "punctuation" | "symbol";
}

export interface BrailleGrade2Entry {
  grade1: string;
  grade2: string;
  type: "contraction" | "shortform" | "punctuation" | "ligature";
}

export class BrailleTranslationEngine {
  private config: BrailleTranslationConfig | null = null;
  private profile: AccessibilityProfile | null = null;

  // Grade 2 contractions and shortforms
  private grade2Table: BrailleGrade2Entry[] = [
    { grade1: "and", grade2: "⠯", type: "contraction" },
    { grade1: "for", grade2: "⠷", type: "contraction" },
    { grade1: "of", grade2: "⠻", type: "contraction" },
    { grade1: "the", grade2: "⠮", type: "contraction" },
    { grade1: "with", grade2: "⠿", type: "contraction" },
    { grade1: "ing", grade2: "⠬", type: "contraction" },
    { grade1: "ble", grade2: "⠜", type: "contraction" },
    { grade1: "con", grade2: "⠣", type: "contraction" },
    { grade1: "dis", grade2: "⠮", type: "contraction" },
    { grade1: "com", grade2: "⠡", type: "contraction" },
    { grade1: "ed", grade2: "⠂", type: "contraction" },
    { grade1: "er", grade2: "⠼", type: "contraction" },
    { grade1: "ound", grade2: "⠱", type: "contraction" },
    { grade1: "tion", grade2: "⠾", type: "contraction" },
    { grade1: "wh", grade2: "⠺", type: "contraction" },
    { grade1: "ea", grade2: "⠔", type: "contraction" },
    { grade1: "bb", grade2: "⠃", type: "contraction" },
    { grade1: "cc", grade2: "⠉", type: "contraction" },
    { grade1: "ff", grade2: "⠋", type: "contraction" },
    { grade1: "gg", grade2: "⠛", type: "contraction" },
    { grade1: "st", grade2: "⠌", type: "contraction" },
    { grade1: "ar", grade2: "⠜", type: "contraction" },
    { grade1: "be", grade2: "⠆", type: "shortform" },
    { grade1: "was", grade2: "⠲", type: "shortform" },
    { grade1: "his", grade2: "⠔", type: "shortform" },
    { grade1: "in", grade2: "⠔", type: "shortform" },
    { grade1: "to", grade2: "⠠", type: "shortform" },
    { grade1: "but", grade2: "⠲", type: "shortform" }
  ];

  // Literary Braille mapping (grade 1)
  private literaryBraille: Record<string, string> = {
    "a": "⠁", "b": "⠃", "c": "⠉", "d": "⠙", "e": "⠑",
    "f": "⠋", "g": "⠛", "h": "⠓", "i": "⠊", "j": "⠚",
    "k": "⠅", "l": "⠇", "m": "⠍", "n": "⠝", "o": "⠕",
    "p": "⠏", "q": "⠟", "r": "⠗", "s": "⠎", "t": "⠞",
    "u": "⠥", "v": "⠧", "w": "⠺", "x": "⠭", "y": "⠽", "z": "⠵",
    " ": " ", "\n": "\n"
  };

  // Computer Braille
  private computerBraille: Record<string, string> = {
    "a": "a", "b": "b", "c": "c", "d": "d", "e": "e",
    "f": "f", "g": "g", "h": "h", "i": "i", "j": "j",
    "k": "k", "l": "l", "m": "m", "n": "n", "o": "o",
    "p": "p", "q": "q", "r": "r", "s": "s", "t": "t",
    "u": "u", "v": "v", "w": "w", "x": "x", "y": "y", "z": "z",
    " ": " ", "\n": "\n", "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
    "5": "5", "6": "6", "7": "7", "8": "8", "9": "9"
  };

  // Punctuation mapping
  private punctuationMap: Record<string, string> = {
    ".": "⠄", ",": "⠂", ";": "⠔", ":": "⠒", "!": "⠖",
    "?": "⠦", "(": "⠦", ")": "⠴", "-": "⠤", "\"": "⠦",
    "'": "⠄", "/": "⠸�_slash", "*": "⠸⠔", "&": "⠸⠯",
    "#": "⠼", "@": "⠸⠁", "%": "⠸�⠒⠔", "+": "⠸�_plus",
    "=": "⠸⠶", "<": "⠸�_lt", ">": "⠸⠂", "[": "⠸⠦",
    "]": "⠸⠴", "{": "⠸⠦", "}": "⠸⠴"
  };

  // Initialize
  async initialize(config: {
    profile: AccessibilityProfile | null;
    settings: any;
  }): Promise<void> {
    this.profile = config.profile;

    if (config.profile) {
      this.config = {
        enabled: true,
        grade: config.profile.deafblind?.brailleGrade || 1,
        system: "ueb",
        contractions: config.profile.deafblind?.brailleGrade === 2,
        twoCellWords: true
      };
    }
  }

  // Check availability
  isAvailable(): boolean {
    return true;
  }

  // Enable translation
  enable(profile: AccessibilityProfile): void {
    this.config = {
      enabled: true,
      grade: profile.deafblind?.brailleGrade || 1,
      system: "ueb",
      contractions: profile.deafblind?.brailleGrade === 2,
      twoCellWords: true
    };
  }

  // Disable translation
  disable(): void {
    this.config = null;
  }

  // Set configuration
  setConfig(config: Partial<BrailleTranslationConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...config };
    }
  }

  // Get configuration
  getConfig(): BrailleTranslationConfig | null {
    return this.config;
  }

  // Translate text to Braille
  translate(text: string, options?: Partial<BrailleTranslationConfig>): TranslationResult {
    const startTime = performance.now();
    const grade = options?.grade || this.config?.grade || 1;
    const system = options?.system || this.config?.system || "ueb";
    const useContractions = options?.contractions ?? this.config?.contractions ?? false;

    let braille = "";
    const words: BrailleWord[] = [];

    // Split into words while preserving structure
    const tokens = this.tokenize(text);

    for (const token of tokens) {
      if (token.type === "whitespace") {
        braille += token.value;
      } else if (token.type === "number") {
        const numberBraille = this.translateNumber(token.value);
        braille += numberBraille;
        words.push({
          original: token.value,
          braille: numberBraille,
          contracted: false,
          type: "number"
        });
      } else if (token.type === "punctuation") {
        const puncBraille = this.translatePunctuation(token.value);
        braille += puncBraille;
        words.push({
          original: token.value,
          braille: puncBraille,
          contracted: false,
          type: "punctuation"
        });
      } else {
        // Word
        let wordBraille: string;
        let contracted = false;

        if (system === "computer" || system === "comp6") {
          wordBraille = this.translateToComputerBraille(token.value);
        } else if (grade === 2 && useContractions) {
          wordBraille = this.translateToGrade2(token.value);
          contracted = wordBraille !== this.translateToGrade1(token.value);
        } else {
          wordBraille = this.translateToGrade1(token.value);
        }

        braille += wordBraille;
        words.push({
          original: token.value,
          braille: wordBraille,
          contracted,
          type: "word"
        });
      }
    }

    const endTime = performance.now();

    return {
      braille,
      asciiBraille: this.toAsciiBraille(braille),
      wordCount: words.filter(w => w.type === "word").length,
      charCount: text.length,
      translationTime: endTime - startTime
    };
  }

  // Tokenize input text
  private tokenize(text: string): { type: "word" | "number" | "punctuation" | "whitespace"; value: string }[] {
    const tokens: { type: "word" | "number" | "punctuation" | "whitespace"; value: string }[] = [];
    let current = "";
    let currentType: "word" | "number" | "punctuation" | "whitespace" = "word";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charType = this.getCharType(char);

      if (charType === currentType || current === "") {
        current += char;
      } else {
        if (current) {
          tokens.push({ type: currentType, value: current });
        }
        current = char;
        currentType = charType;
      }
    }

    if (current) {
      tokens.push({ type: currentType, value: current });
    }

    return tokens;
  }

  // Get character type
  private getCharType(char: string): "word" | "number" | "punctuation" | "whitespace" {
    if (/\s/.test(char)) return "whitespace";
    if (/[0-9]/.test(char)) return "number";
    if (/[a-zA-Z]/.test(char)) return "word";
    return "punctuation";
  }

  // Translate to grade 1 Braille
  private translateToGrade1(text: string): string {
    let braille = "";

    // Add word indicator if at start of word
    if (this.shouldAddWordIndicator(text)) {
      braille += "⠄";
    }

    for (const char of text.toLowerCase()) {
      if (this.literaryBraille[char]) {
        braille += this.literaryBraille[char];
      } else if (this.punctuationMap[char]) {
        braille += this.punctuationMap[char];
      } else {
        braille += char; // Keep unknown characters as-is
      }
    }

    return braille;
  }

  // Translate to grade 2 Braille
  private translateToGrade2(text: string): string {
    const lowerText = text.toLowerCase();
    let braille = "";

    // Check for two-cell words first
    for (const entry of this.grade2Table) {
      if (lowerText === entry.grade1 && entry.type === "shortform") {
        return this.translateToGrade1(text).substring(0, -1) + entry.grade2;
      }
    }

    // Process word with contractions
    let processed = lowerText;

    // Apply contractions in order of length (longest first)
    const sortedContractions = [...this.grade2Table]
      .filter(e => e.type === "contraction")
      .sort((a, b) => b.grade1.length - a.grade1.length);

    for (const entry of sortedContractions) {
      if (processed.includes(entry.grade1)) {
        processed = processed.replace(entry.grade1, entry.grade2);
      }
    }

    // Translate remaining characters
    for (const char of processed) {
      if (this.literaryBraille[char]) {
        braille += this.literaryBraille[char];
      } else if (this.punctuationMap[char]) {
        braille += this.punctuationMap[char];
      } else {
        braille += char;
      }
    }

    return braille;
  }

  // Should add word indicator
  private shouldAddWordIndicator(text: string): boolean {
    // Word indicator is used for words containing certain letters
    // Simplified version - always add for non-trivial words
    return text.length > 0;
  }

  // Translate to computer Braille
  private translateToComputerBraille(text: string): string {
    let braille = "";

    // Add computer indicator
    braille += "⠸";

    for (const char of text.toLowerCase()) {
      if (this.computerBraille[char]) {
        braille += this.computerBraille[char];
      } else {
        braille += char;
      }
    }

    return braille;
  }

  // Translate number
  private translateNumber(text: string): string {
    let braille = "⠼"; // Number indicator

    for (const char of text) {
      if (this.literaryBraille[char]) {
        braille += this.literaryBraille[char];
      } else {
        braille += char;
      }
    }

    return braille;
  }

  // Translate punctuation
  private translatePunctuation(text: string): string {
    let braille = "";

    for (const char of text) {
      if (this.punctuationMap[char]) {
        braille += this.punctuationMap[char];
      } else {
        braille += char;
      }
    }

    return braille;
  }

  // Convert to ASCII Braille
  toAsciiBraille(braille: string): string {
    return braille.replace(/[⠁-⠿]/g, (match) => {
      // Simplified ASCII representation
      const index = match.charCodeAt(0) - 0x2800;
      return String.fromCharCode(97 + (index % 26)); // Simplified
    });
  }

  // Get Braille cell
  getBrailleCell(char: string): BrailleCell | null {
    const lowerChar = char.toLowerCase();

    if (this.literaryBraille[lowerChar]) {
      return {
        dots: this.getDotsFromUnicode(this.literaryBraille[lowerChar]),
        unicode: this.literaryBraille[lowerChar],
        ascii: lowerChar
      };
    }

    return null;
  }

  // Get dots from Unicode Braille character
  private getDotsFromUnicode(unicode: string): number[] {
    const code = unicode.charCodeAt(0);
    const dotValue = code - 0x2800;
    const dots: number[] = [];

    for (let i = 0; i < 6; i++) {
      if (dotValue & (1 << i)) {
        dots.push(i + 1);
      }
    }

    return dots;
  }

  // Get Unicode Braille character from dots
  getUnicodeFromDots(dots: number[]): string {
    let dotValue = 0x2800;

    for (const dot of dots) {
      if (dot >= 1 && dot <= 6) {
        dotValue |= (1 << (dot - 1));
      }
    }

    return String.fromCharCode(dotValue);
  }

  // Translate from Braille to text
  reverseTranslate(braille: string): string {
    // Create reverse mapping
    const reverseMap: Record<string, string> = {};
    for (const [char, braille] of Object.entries(this.literaryBraille)) {
      reverseMap[braille] = char;
    }

    let text = "";

    for (const char of braille) {
      if (reverseMap[char]) {
        text += reverseMap[char];
      } else if (char === " " || char === "\n") {
        text += char;
      } else if (char === "⠼") {
        // Number indicator - next chars are numbers
        // Simplified: just skip
      } else {
        text += char;
      }
    }

    return text;
  }

  // Validate Braille text
  validate(braille: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for valid Braille Unicode range
    for (const char of braille) {
      if (char === " " || char === "\n") continue;

      const code = char.charCodeAt(0);
      if (code < 0x2800 || code > 0x28FF) {
        errors.push(`Invalid Braille character: ${char}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Get grade 2 table
  getGrade2Table(): BrailleGrade2Entry[] {
    return [...this.grade2Table];
  }

  // Add custom contraction
  addContraction(entry: BrailleGrade2Entry): void {
    this.grade2Table.push(entry);
  }

  // Remove custom contraction
  removeContraction(grade1: string): void {
    const index = this.grade2Table.findIndex(e => e.grade1 === grade1 && e.type === "shortform");
    if (index !== -1) {
      this.grade2Table.splice(index, 1);
    }
  }

  // Cleanup
  destroy(): void {
    this.config = null;
  }
}

// Export singleton
export const brailleTranslationEngine = new BrailleTranslationEngine();

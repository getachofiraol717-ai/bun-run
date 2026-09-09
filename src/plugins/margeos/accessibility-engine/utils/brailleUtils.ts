// @ts-nocheck
// Accessibility Engine — Braille Utilities
// Utility functions for Braille conversion

import type { BrailleCell } from "../models/BrailleContent";

/**
 * Get dot pattern from Unicode Braille character
 */
export function getDotsFromUnicode(char: string): number[] {
  const code = char.charCodeAt(0);

  if (code < 0x2800 || code > 0x28FF) {
    return [];
  }

  const dotValue = code - 0x2800;
  const dots: number[] = [];

  for (let i = 0; i < 6; i++) {
    if (dotValue & (1 << i)) {
      dots.push(i + 1);
    }
  }

  return dots;
}

/**
 * Get Unicode character from dot pattern
 */
export function getUnicodeFromDots(dots: number[]): string {
  let dotValue = 0x2800;

  for (const dot of dots) {
    if (dot >= 1 && dot <= 6) {
      dotValue |= (1 << (dot - 1));
    }
  }

  return String.fromCharCode(dotValue);
}

/**
 * Get ASCII representation of Braille character
 */
export function brailleToAscii(char: string): string {
  const dots = getDotsFromDots(char);
  if (dots.length === 0) return char;

  // Simplified ASCII mapping based on dot pattern
  const dotToLetter: Record<string, string> = {
    "1": "a", "12": "b", "14": "c", "145": "d", "15": "e",
    "124": "f", "1245": "g", "125": "h", "24": "i", "245": "j",
    "13": "k", "123": "l", "134": "m", "1345": "n", "135": "o",
    "1234": "p", "12345": "q", "1235": "r", "234": "s", "2345": "t",
    "136": "u", "1236": "v", "2456": "w", "1346": "x", "13456": "y", "1356": "z"
  };

  const dotKey = dots.sort().join("");
  return dotToLetter[dotKey] || "?";
}

/**
 * Get dot pattern from character
 */
export function getDotsFromCharacter(char: string): number[] {
  const lowerChar = char.toLowerCase();

  const charToDots: Record<string, number[]> = {
    "a": [1], "b": [1, 2], "c": [1, 4], "d": [1, 4, 5], "e": [1, 5],
    "f": [1, 2, 4], "g": [1, 2, 4, 5], "h": [1, 2, 5], "i": [2, 4], "j": [2, 4, 5],
    "k": [1, 3], "l": [1, 2, 3], "m": [1, 3, 4], "n": [1, 3, 4, 5], "o": [1, 3, 5],
    "p": [1, 2, 3, 4], "q": [1, 2, 3, 4, 5], "r": [1, 2, 3, 5], "s": [2, 3, 4], "t": [2, 3, 4, 5],
    "u": [1, 3, 6], "v": [1, 2, 3, 6], "w": [2, 4, 5, 6], "x": [1, 3, 4, 6], "y": [1, 3, 4, 5, 6], "z": [1, 3, 5, 6]
  };

  return charToDots[lowerChar] || [];
}

/**
 * Convert text to Braille Unicode
 */
export function textToBrailleUnicode(text: string): string {
  return text
    .split("")
    .map(char => {
      const dots = getDotsFromCharacter(char);
      if (dots.length === 0) {
        return char === " " ? " " : char;
      }
      return getUnicodeFromDots(dots);
    })
    .join("");
}

/**
 * Convert Braille Unicode to text
 */
export function brailleUnicodeToText(braille: string): string {
  return braille
    .split("")
    .map(char => brailleToAscii(char))
    .join("");
}

/**
 * Get Braille cell pattern as binary
 */
export function getBrailleBinary(dots: number[]): string {
  const pattern = [0, 0, 0, 0, 0, 0];

  for (const dot of dots) {
    if (dot >= 1 && dot <= 6) {
      pattern[dot - 1] = 1;
    }
  }

  return pattern.join("");
}

/**
 * Check if character is a valid Braille character
 */
export function isBrailleCharacter(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x2800 && code <= 0x28FF;
}

/**
 * Get Braille character name (for screen readers)
 */
export function getBrailleCharacterName(char: string): string {
  const dots = getDotsFromUnicode(char);

  if (dots.length === 0) return "space";

  const dotNames = ["1", "2", "3", "4", "5", "6"];
  const activeDots = dots.map(d => dotNames[d - 1]);

  return "braille " + activeDots.join("-");
}

/**
 * Format Braille for display (add spacing)
 */
export function formatBrailleForDisplay(braille: string, charsPerLine: number = 40): string {
  const lines: string[] = [];

  for (let i = 0; i < braille.length; i += charsPerLine) {
    lines.push(braille.substring(i, i + charsPerLine));
  }

  return lines.join("\n");
}

/**
 * Validate Braille text
 */
export function validateBraille(braille: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (let i = 0; i < braille.length; i++) {
    const char = braille[i];
    const code = char.charCodeAt(0);

    if (char !== " " && char !== "\n" && (code < 0x2800 || code > 0x28FF)) {
      errors.push(`Invalid Braille character at position ${i}: ${char}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create blank Braille line
 */
export function createBlankBrailleLine(cols: number = 40): string {
  return getUnicodeFromDots([]).repeat(cols);
}

/**
 * Create Braille divider
 */
export function createBrailleDivider(cols: number = 40): string {
  const dots = [2, 3, 5]; // Line pattern
  const lineChar = getUnicodeFromDots(dots);
  return lineChar.repeat(cols);
}

/**
 * Convert position to braille line and column
 */
export function positionToBrailleCoords(position: number, cols: number = 40): {
  line: number;
  col: number;
} {
  return {
    line: Math.floor(position / cols),
    col: position % cols
  };
}

/**
 * Convert braille line and column to position
 */
export function brailleCoordsToPosition(line: number, col: number, cols: number = 40): number {
  return line * cols + col;
}

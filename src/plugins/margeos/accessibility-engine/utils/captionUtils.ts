// @ts-nocheck
// Accessibility Engine — Caption Utilities
// Utility functions for caption processing

import type { Caption, CaptionCue } from "../models/Caption";

export interface CaptionWord {
  word: string;
  startTime: number;
  endTime: number;
}

/**
 * Parse SRT format captions
 */
export function parseSRT(srtContent: string): CaptionCue[] {
  const cues: CaptionCue[] = [];
  const blocks = srtContent.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length < 3) continue;

    const timeLine = lines[1];
    const timeMatch = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    );

    if (!timeMatch) continue;

    const startTime =
      parseInt(timeMatch[1]) * 3600000 +
      parseInt(timeMatch[2]) * 60000 +
      parseInt(timeMatch[3]) * 1000 +
      parseInt(timeMatch[4]);

    const endTime =
      parseInt(timeMatch[5]) * 3600000 +
      parseInt(timeMatch[6]) * 60000 +
      parseInt(timeMatch[7]) * 1000 +
      parseInt(timeMatch[8]);

    const text = lines.slice(2).join("\n");

    cues.push({
      id: `cue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime,
      endTime,
      text
    });
  }

  return cues;
}

/**
 * Convert captions to SRT format
 */
export function captionsToSRT(captions: CaptionCue[]): string {
  return captions
    .map((cue, index) => {
      const start = formatSRTTime(cue.startTime);
      const end = formatSRTTime(cue.endTime);
      return `${index + 1}\n${start} --> ${end}\n${cue.text}`;
    })
    .join("\n\n");
}

/**
 * Format milliseconds to SRT time format
 */
export function formatSRTTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

/**
 * Pad number with leading zeros
 */
function pad(num: number, size: number = 2): string {
  return num.toString().padStart(size, "0");
}

/**
 * Parse VTT format captions
 */
export function parseVTT(vttContent: string): CaptionCue[] {
  const cues: CaptionCue[] = [];
  const lines = vttContent.split("\n");
  let i = 0;

  // Skip header
  while (i < lines.length && !lines[i].includes("-->")) {
    i++;
  }

  while (i < lines.length) {
    const timeLine = lines[i];
    const timeMatch = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/
    ) || timeLine.match(
      /(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2})\.(\d{3})/
    );

    if (timeMatch) {
      let startTime: number, endTime: number;

      if (timeMatch.length === 9) {
        // HH:MM:SS.mmm format
        startTime =
          parseInt(timeMatch[1]) * 3600000 +
          parseInt(timeMatch[2]) * 60000 +
          parseInt(timeMatch[3]) * 1000 +
          parseInt(timeMatch[4]);

        endTime =
          parseInt(timeMatch[5]) * 3600000 +
          parseInt(timeMatch[6]) * 60000 +
          parseInt(timeMatch[7]) * 1000 +
          parseInt(timeMatch[8]);
      } else {
        // MM:SS.mmm format
        startTime =
          parseInt(timeMatch[1]) * 60000 +
          parseInt(timeMatch[2]) * 1000 +
          parseInt(timeMatch[3]);

        endTime =
          parseInt(timeMatch[4]) * 60000 +
          parseInt(timeMatch[5]) * 1000 +
          parseInt(timeMatch[6]);
      }

      i++;
      const textLines: string[] = [];

      while (i < lines.length && lines[i].trim() !== "" && !lines[i].includes("-->")) {
        textLines.push(lines[i]);
        i++;
      }

      cues.push({
        id: `cue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startTime,
        endTime,
        text: textLines.join("\n").replace(/<[^>]+>/g, "") // Strip HTML tags
      });
    } else {
      i++;
    }
  }

  return cues;
}

/**
 * Convert captions to VTT format
 */
export function captionsToVTT(captions: CaptionCue[]): string {
  let vtt = "WEBVTT\n\n";

  for (const cue of captions) {
    const start = formatVTTTime(cue.startTime);
    const end = formatVTTTime(cue.endTime);
    vtt += `${start} --> ${end}\n${cue.text}\n\n`;
  }

  return vtt;
}

/**
 * Format milliseconds to VTT time format
 */
function formatVTTTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
}

/**
 * Word-level sync for captions
 */
export function wordSync(text: string, startTime: number, endTime: number): CaptionWord[] {
  const words = text.split(/\s+/);
  const totalDuration = endTime - startTime;
  const wordDuration = totalDuration / words.length;

  return words.map((word, index) => ({
    word,
    startTime: startTime + index * wordDuration,
    endTime: startTime + (index + 1) * wordDuration
  }));
}

/**
 * Simplify caption text for better readability
 */
export function simplifyCaptionText(text: string): string {
  return text
    .replace(/\[.*?\]/g, "") // Remove stage directions
    .replace(/\(.*?\)/g, "") // Remove parentheticals
    .replace(/\s+/g, " ")    // Normalize whitespace
    .trim();
}

/**
 * Calculate caption reading speed
 */
export function calculateReadingSpeed(captions: CaptionCue[]): {
  averageWordsPerMinute: number;
  averageCharactersPerSecond: number;
} {
  let totalWords = 0;
  let totalChars = 0;
  let totalDuration = 0;

  for (const cue of captions) {
    const words = cue.text.split(/\s+/).length;
    totalWords += words;
    totalChars += cue.text.length;
    totalDuration += (cue.endTime - cue.startTime) / 1000;
  }

  const durationMinutes = totalDuration / 60;

  return {
    averageWordsPerMinute: durationMinutes > 0 ? totalWords / durationMinutes : 0,
    averageCharactersPerSecond: totalDuration > 0 ? totalChars / totalDuration : 0
  };
}

/**
 * Merge overlapping captions
 */
export function mergeOverlappingCaptions(captions: CaptionCue[]): CaptionCue[] {
  if (captions.length === 0) return [];

  const sorted = [...captions].sort((a, b) => a.startTime - b.startTime);
  const merged: CaptionCue[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.startTime <= last.endTime) {
      // Overlapping - extend the last caption
      last.endTime = Math.max(last.endTime, current.endTime);
      last.text += " " + current.text;
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Split long captions into smaller chunks
 */
export function splitLongCaptions(captions: CaptionCue[], maxDuration: number = 5000): CaptionCue[] {
  const result: CaptionCue[] = [];

  for (const cue of captions) {
    const duration = cue.endTime - cue.startTime;

    if (duration <= maxDuration) {
      result.push(cue);
    } else {
      // Split into chunks
      const chunkCount = Math.ceil(duration / maxDuration);
      const chunkDuration = duration / chunkCount;
      const words = cue.text.split(/\s+/);
      const wordsPerChunk = Math.ceil(words.length / chunkCount);

      for (let i = 0; i < chunkCount; i++) {
        const startTime = cue.startTime + i * chunkDuration;
        const endTime = startTime + chunkDuration;
        const startWord = i * wordsPerChunk;
        const endWord = Math.min((i + 1) * wordsPerChunk, words.length);
        const text = words.slice(startWord, endWord).join(" ");

        result.push({
          id: `${cue.id}-chunk-${i}`,
          startTime,
          endTime,
          text
        });
      }
    }
  }

  return result;
}

// Accessibility Engine — Voice Utilities
// Utility functions for voice/speech functionality

export interface VoiceInfo {
  name: string;
  lang: string;
  local: boolean;
  default: boolean;
}

/**
 * Get available voices from speech synthesis
 */
export function getAvailableVoices(): VoiceInfo[] {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return [];
  }

  const voices = window.speechSynthesis.getVoices();
  return voices.map(voice => ({
    name: voice.name,
    lang: voice.lang,
    local: voice.localService,
    default: voice.default
  }));
}

/**
 * Find the best voice for a given language
 */
export function findBestVoice(lang: string, voices?: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return null;
  }

  const availableVoices = voices || window.speechSynthesis.getVoices();
  const langCode = lang.split("-")[0].toLowerCase();

  // Try exact match first
  let best = availableVoices.find(v =>
    v.lang.toLowerCase().startsWith(langCode) && v.localService
  );

  if (best) return best;

  // Try any voice for language
  best = availableVoices.find(v =>
    v.lang.toLowerCase().startsWith(langCode)
  );

  if (best) return best;

  // Default to first available
  return availableVoices[0] || null;
}

/**
 * Normalize language code
 */
export function normalizeLanguageCode(code: string): string {
  const parts = code.split("-");
  const lang = parts[0].toLowerCase();
  const region = parts[1]?.toUpperCase();

  if (region) {
    return `${lang}-${region}`;
  }

  return lang;
}

/**
 * Check if language matches
 */
export function languageMatches(voiceLang: string, targetLang: string): boolean {
  const normalizedVoice = normalizeLanguageCode(voiceLang);
  const normalizedTarget = normalizeLanguageCode(targetLang);

  return normalizedVoice.startsWith(normalizedTarget.split("-")[0]);
}

/**
 * Clean text for speech synthesis
 */
export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[{}]/g, "") // Remove braces
    .replace(/\s+/g, " ")  // Normalize whitespace
    .replace(/https?:\/\/\S+/g, "link") // Replace URLs with "link"
    .replace(/[A-Z]{2,}/g, match => match.split("").join(" ")) // Space out acronyms
    .trim();
}

/**
 * Split text into speakable chunks
 */
export function splitIntoSpeakableChunks(text: string, maxLength: number = 200): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Extract numbers for speech
 */
export function numberToWords(num: number): string {
  if (num === 0) return "zero";
  if (num < 0) return "negative " + numberToWords(Math.abs(num));

  const units = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen"
  ];

  const tens = [
    "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"
  ];

  if (num < 20) return units[num];
  if (num < 100) {
    return tens[Math.floor(num / 10)] + (num % 10 ? " " + units[num % 10] : "");
  }
  if (num < 1000) {
    return units[Math.floor(num / 100)] + " hundred" +
      (num % 100 ? " " + numberToWords(num % 100) : "");
  }
  if (num < 1000000) {
    return numberToWords(Math.floor(num / 1000)) + " thousand" +
      (num % 1000 ? " " + numberToWords(num % 1000) : "");
  }

  return num.toString();
}

/**
 * Format time for speech
 */
export function formatTimeForSpeech(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs} ${secs === 1 ? "second" : "seconds"}`);
  }

  return parts.join(" ");
}

/**
 * Convert date to spoken format
 */
export function formatDateForSpeech(date: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Check speech synthesis support
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Check speech recognition support
 */
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
}

/**
 * Get speech rate label
 */
export function getSpeechRateLabel(rate: number): string {
  if (rate <= 0.5) return "Very slow";
  if (rate <= 0.75) return "Slow";
  if (rate <= 1.0) return "Normal";
  if (rate <= 1.25) return "Fast";
  if (rate <= 1.5) return "Very fast";
  return "Extremely fast";
}

/**
 * Convert speech rate to WPM (words per minute)
 */
export function speechRateToWPM(rate: number): number {
  // Average adult reads at ~150 WPM at rate 1.0
  return Math.round(150 * rate);
}

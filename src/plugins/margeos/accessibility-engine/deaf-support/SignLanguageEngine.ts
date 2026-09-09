// Accessibility Engine — Sign Language Engine
// Provides sign language support for deaf students

import type { AccessibilityProfile } from "../models/AccessibilityProfile";
import type { GlobalAccessibilitySettings } from "../models/AccessibilitySettings";

export interface SignLanguageSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  signs: SignSequence[];
}

export interface SignSequence {
  id: string;
  handshape: string;
  movement: string;
  position: string;
  facial?: string;
  duration: number;
}

export interface SignLanguageConfig {
  language: string;
  dialect?: string;
  avatarEnabled: boolean;
  avatarPosition: "bottom_right" | "bottom_left" | "corner";
  avatarSize: "small" | "medium" | "large";
  quality: "low" | "medium" | "high";
  autoPlay: boolean;
}

export interface SignLanguageContent {
  id: string;
  text: string;
  segments: SignLanguageSegment[];
  language: string;
  avatarConfig: SignLanguageConfig;
  generatedAt: Date;
}

export type SignLanguageEngineState = "idle" | "playing" | "paused" | "loading" | "error";

export class SignLanguageEngine {
  private state: SignLanguageEngineState = "idle";
  private config: SignLanguageConfig | null = null;
  private currentContent: SignLanguageContent | null = null;
  private currentSegmentIndex: number = 0;
  private listeners: Set<(state: SignLanguageEngineState) => void> = new Set();
  private animationFrame: number | null = null;
  private lastUpdateTime: number = 0;

  // Supported languages
  private supportedLanguages = ["ase", "bfi", "bfg", "csl", "csv", "dsg", "fsl", "gss", "haf", "ins", "isg", "jsl", "ksl", "lsa", "msl", "ncs", "nsp", "pgm", "prl", "rms", "rsl", "sgn", "ssp", "svk", "swl", "tsm", "ugd", "usr", "vgt", "vsv", "xsp", "zib"];

  // Initialize the engine
  async initialize(config: {
    profile: AccessibilityProfile | null;
    settings: GlobalAccessibilitySettings | null;
  }): Promise<void> {
    if (config.profile) {
      this.config = {
        language: config.profile.audio.speechLanguage || "en",
        avatarEnabled: config.profile.audio.signLanguageEnabled,
        avatarPosition: "bottom_right",
        avatarSize: config.profile.audio.avatarSize || "medium",
        quality: "high",
        autoPlay: true
      };
    }
  }

  // Check availability
  isAvailable(): boolean {
    return typeof window !== "undefined";
  }

  // Enable sign language
  enable(profile: AccessibilityProfile): void {
    this.config = {
      language: profile.audio.speechLanguage || "en",
      avatarEnabled: true,
      avatarPosition: "bottom_right",
      avatarSize: profile.audio.avatarSize || "medium",
      quality: "high",
      autoPlay: true
    };
    this.setState("idle");
  }

  // Disable sign language
  disable(): void {
    this.stop();
    this.setState("idle");
  }

  // Generate sign language content
  async generateContent(text: string, language?: string): Promise<SignLanguageContent> {
    this.setState("loading");

    try {
      // Segment text into sign-friendly chunks
      const segments = await this.segmentText(text, language || this.config?.language || "en");

      const content: SignLanguageContent = {
        id: `sign-${Date.now()}`,
        text,
        segments,
        language: language || this.config?.language || "en",
        avatarConfig: this.config || {
          language: "en",
          avatarEnabled: true,
          avatarPosition: "bottom_right",
          avatarSize: "medium",
          quality: "high",
          autoPlay: true
        },
        generatedAt: new Date()
      };

      this.currentContent = content;
      this.setState("idle");
      return content;
    } catch (error) {
      this.setState("error");
      throw error;
    }
  }

  // Segment text for sign language
  private async segmentText(text: string, language: string): Promise<SignLanguageSegment[]> {
    // Split text into sentences
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());

    const segments: SignLanguageSegment[] = [];
    let currentTime = 0;

    for (const sentence of sentences) {
      const words = sentence.split(/\s+/).filter(w => w);
      const estimatedDuration = words.length * 500; // ~500ms per word

      // Generate signs for each word
      const signs: SignSequence[] = [];
      let signTime = currentTime;

      for (const word of words) {
        const cleanWord = word.replace(/[.,!?;:]/g, "").toLowerCase();
        if (cleanWord.length > 0) {
          signs.push(this.generateSign(cleanWord, signTime));
          signTime += 500;
        }
      }

      segments.push({
        id: `segment-${segments.length}`,
        text: sentence.trim(),
        startTime: currentTime,
        endTime: currentTime + estimatedDuration,
        signs
      });

      currentTime += estimatedDuration + 200; // Add pause between sentences
    }

    return segments;
  }

  // Generate sign sequence for a word
  private generateSign(word: string, startTime: number): SignSequence {
    // Simplified sign generation based on word characteristics
    const handshapes = ["flat", "fist", "point", "pinch", "spread"];
    const movements = ["static", "arc", "circular", "linear", "wave"];
    const positions = ["neutral", "forward", "side", "high", "low"];

    // Generate based on word length and structure
    const wordLength = word.length;

    return {
      id: `sign-${word}-${startTime}`,
      handshape: handshapes[wordLength % handshapes.length],
      movement: movements[Math.floor(wordLength / 3) % movements.length],
      position: positions[Math.floor(wordLength / 2) % positions.length],
      duration: 400 + (wordLength * 20)
    };
  }

  // Play sign language content
  async play(content?: SignLanguageContent): Promise<void> {
    const targetContent = content || this.currentContent;
    if (!targetContent) {
      throw new Error("No sign language content to play");
    }

    this.currentContent = targetContent;
    this.currentSegmentIndex = 0;
    this.setState("playing");
    this.lastUpdateTime = performance.now();

    this.playLoop();
  }

  private playLoop(): void {
    if (this.state !== "playing" || !this.currentContent) {
      return;
    }

    const currentTime = performance.now() - this.lastUpdateTime;
    const segment = this.currentContent.segments[this.currentSegmentIndex];

    if (segment && currentTime >= segment.endTime) {
      this.currentSegmentIndex++;

      if (this.currentSegmentIndex >= this.currentContent.segments.length) {
        this.setState("idle");
        return;
      }
    }

    this.animationFrame = requestAnimationFrame(() => this.playLoop());
  }

  // Pause playback
  pause(): void {
    if (this.state === "playing") {
      this.setState("paused");
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
    }
  }

  // Resume playback
  resume(): void {
    if (this.state === "paused") {
      this.lastUpdateTime = performance.now() - (
        this.currentContent?.segments[this.currentSegmentIndex]?.startTime || 0
      );
      this.setState("playing");
      this.playLoop();
    }
  }

  // Stop playback
  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.currentSegmentIndex = 0;
    this.setState("idle");
  }

  // Seek to segment
  seekToSegment(index: number): void {
    if (this.currentContent && index >= 0 && index < this.currentContent.segments.length) {
      this.currentSegmentIndex = index;
    }
  }

  // Get current segment
  getCurrentSegment(): SignLanguageSegment | null {
    if (!this.currentContent) return null;
    return this.currentContent.segments[this.currentSegmentIndex] || null;
  }

  // Render avatar frame
  renderAvatarFrame(): {
    signs: SignSequence[];
    position: string;
    size: string;
  } | null {
    const segment = this.getCurrentSegment();
    if (!segment || !this.config) return null;

    const currentSigns = segment.signs.filter(sign => {
      const signStart = segment.startTime + segment.signs.indexOf(sign) * 500;
      return performance.now() - this.lastUpdateTime >= signStart;
    });

    return {
      signs: currentSigns,
      position: this.config.avatarPosition,
      size: this.config.avatarSize
    };
  }

  // Get state
  getState(): SignLanguageEngineState {
    return this.state;
  }

  private setState(state: SignLanguageEngineState): void {
    this.state = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  // Subscribe to state changes
  subscribe(listener: (state: SignLanguageEngineState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Check if language is supported
  isLanguageSupported(language: string): boolean {
    return this.supportedLanguages.includes(language.toLowerCase());
  }

  // Get supported languages
  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }

  // Update settings
  updateSettings(settings: GlobalAccessibilitySettings): void {
    // Settings would be applied here
  }

  // Cleanup
  destroy(): void {
    this.stop();
    this.listeners.clear();
  }
}

// Export singleton
export const signLanguageEngine = new SignLanguageEngine();

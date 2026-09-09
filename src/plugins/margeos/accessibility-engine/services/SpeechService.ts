// Accessibility Engine — Speech Service
// Centralized speech synthesis service

import type { AccessibilityProfile } from "../models/AccessibilityProfile";

export interface SpeechOptions {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
  priority?: "polite" | "assertive";
}

export interface Voice {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export class SpeechService {
  private static instance: SpeechService;
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private profile: AccessibilityProfile | null = null;
  private queue: SpeechOptions[] = [];
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis;
      this.loadVoices();

      // Voices may load asynchronously
      if (this.synth) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }

  private loadVoices(): void {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  initialize(profile: AccessibilityProfile | null): void {
    this.profile = profile;
  }

  isAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  getVoices(): Voice[] {
    return this.voices.map(v => ({
      name: v.name,
      lang: v.lang,
      localService: v.localService,
      default: v.default
    }));
  }

  getVoice(name?: string): SpeechSynthesisVoice | null {
    if (name) {
      return this.voices.find(v => v.name === name) || this.voices[0];
    }
    return this.voices[0];
  }

  speak(options: SpeechOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth || !options.text) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(options.text);

      // Apply options
      if (options.lang) {
        utterance.lang = options.lang;
      } else if (this.profile?.audio.speechLanguage) {
        utterance.lang = this.profile.audio.speechLanguage;
      }

      if (options.rate !== undefined) {
        utterance.rate = options.rate;
      } else if (this.profile?.audio.speechRate) {
        utterance.rate = this.profile.audio.speechRate;
      }

      if (options.pitch !== undefined) {
        utterance.pitch = options.pitch;
      } else if (this.profile?.audio.pitch) {
        utterance.pitch = this.profile.audio.pitch;
      }

      if (options.volume !== undefined) {
        utterance.volume = options.volume;
      } else if (this.profile?.audio.volume !== undefined) {
        utterance.volume = this.profile.audio.volume;
      }

      if (options.voice) {
        const voice = this.getVoice(options.voice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.processQueue();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.processQueue();
        reject(event);
      };

      this.currentUtterance = utterance;
      this.isSpeaking = true;
      this.synth.speak(utterance);
    });
  }

  speakImmediate(options: SpeechOptions): void {
    if (!this.synth) return;

    // Cancel current speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(options.text);

    if (options.lang) utterance.lang = options.lang;
    if (options.rate !== undefined) utterance.rate = options.rate;
    if (options.pitch !== undefined) utterance.pitch = options.pitch;
    if (options.volume !== undefined) utterance.volume = options.volume;

    if (options.voice) {
      const voice = this.getVoice(options.voice);
      if (voice) utterance.voice = voice;
    }

    this.synth.speak(utterance);
  }

  queueSpeech(options: SpeechOptions): void {
    this.queue.push(options);
    if (!this.isSpeaking) {
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;

    const next = this.queue.shift();
    if (next) {
      this.speak(next).catch(() => {});
    }
  }

  cancel(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    this.queue = [];
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  pause(): void {
    if (this.synth) {
      this.synth.pause();
    }
  }

  resume(): void {
    if (this.synth) {
      this.synth.resume();
    }
  }

  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  // Announce to screen readers
  announce(message: string, priority: "polite" | "assertive" = "polite"): void {
    // Create live region announcement
    if (typeof document !== "undefined") {
      let liveRegion = document.getElementById("a11y-announcer") as HTMLElement;

      if (!liveRegion) {
        liveRegion = document.createElement("div");
        liveRegion.id = "a11y-announcer";
        liveRegion.setAttribute("role", "status");
        liveRegion.setAttribute("aria-live", priority);
        liveRegion.setAttribute("aria-atomic", "true");
        liveRegion.style.cssText = `
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        `;
        document.body.appendChild(liveRegion);
      }

      // Update priority
      liveRegion.setAttribute("aria-live", priority);

      // Clear and set with delay
      liveRegion.textContent = "";
      setTimeout(() => {
        liveRegion.textContent = message;
      }, 100);
    }
  }

  // Cleanup
  destroy(): void {
    this.cancel();
    this.profile = null;
  }
}

export const speechService = SpeechService.getInstance();

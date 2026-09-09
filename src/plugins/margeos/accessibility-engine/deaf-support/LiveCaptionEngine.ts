// @ts-nocheck
// Accessibility Engine — Live Caption Engine
// Provides real-time captioning for audio content

import type { Caption, CaptionSegment, CaptionStyle } from "../models/Caption";
import type { AccessibilityProfile } from "../models/AccessibilityProfile";

export interface LiveCaptionConfig {
  enabled: boolean;
  style: CaptionStyle;
  position: "bottom" | "top" | "overlay";
  showSpeakerLabels: boolean;
  includeSoundDescriptions: boolean;
  autoHide: boolean;
  autoHideDelay: number;
}

export type LiveCaptionState = "idle" | "listening" | "paused" | "error";

export class LiveCaptionEngine {
  private state: LiveCaptionState = "idle";
  private config: LiveCaptionConfig | null = null;
  private currentCaption: Caption | null = null;
  private segments: CaptionSegment[] = [];
  private currentSegmentIndex: number = 0;
  private listeners: Set<(segment: CaptionSegment | null) => void> = new Set();
  private stateListeners: Set<(state: LiveCaptionState) => void> = new Set();
  private animationFrame: number | null = null;
  private startTime: number = 0;

  // Speech recognition
  private recognition: any = null;
  private finalTranscript: string = "";
  private interimTranscript: string = "";

  constructor() {
    this.initSpeechRecognition();
  }

  // Initialize speech recognition
  private initSpeechRecognition(): void {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onresult = (event: any) => {
        this.handleSpeechResult(event);
      };

      this.recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          this.setState("error");
        }
      };

      this.recognition.onend = () => {
        if (this.state === "listening") {
          // Restart recognition if still in listening state
          try {
            this.recognition.start();
          } catch (e) {
            // Ignore restart errors
          }
        }
      };
    }
  }

  // Initialize
  async initialize(config: {
    profile: AccessibilityProfile | null;
    settings: any;
  }): Promise<void> {
    if (config.profile) {
      this.config = {
        enabled: true,
        style: config.profile.audio.captionStyle,
        position: config.profile.audio.captionPosition || "bottom",
        showSpeakerLabels: config.profile.audio.captionStyle ? false : true,
        includeSoundDescriptions: false,
        autoHide: false,
        autoHideDelay: 3000
      };
    } else {
      this.config = {
        enabled: true,
        style: {
          backgroundColor: "#000000",
          backgroundOpacity: 0.8,
          textColor: "#FFFFFF",
          textSize: 16,
          fontFamily: "system-ui",
          borderRadius: 4,
          padding: 8,
          maxWidth: 600
        },
        position: "bottom",
        showSpeakerLabels: false,
        includeSoundDescriptions: false,
        autoHide: false,
        autoHideDelay: 3000
      };
    }
  }

  // Check availability
  isAvailable(): boolean {
    return this.recognition !== null;
  }

  // Enable captions
  enable(profile: AccessibilityProfile): void {
    this.config = {
      enabled: true,
      style: profile.audio.captionStyle,
      position: profile.audio.captionPosition || "bottom",
      showSpeakerLabels: false,
      includeSoundDescriptions: false,
      autoHide: false,
      autoHideDelay: 3000
    };
    this.setState("idle");
  }

  // Disable captions
  disable(): void {
    this.stop();
    this.setState("idle");
  }

  // Handle speech recognition results
  private handleSpeechResult(event: any): void {
    let interimText = "";
    let finalText = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += transcript + " ";
      } else {
        interimText += transcript;
      }
    }

    this.finalTranscript += finalText;
    this.interimTranscript = interimText;

    // Update current caption segment
    if (finalText || interimText) {
      this.updateCurrentCaption(finalText || interimText);
    }
  }

  // Update current caption
  private updateCurrentCaption(text: string): void {
    if (!this.config) return;

    const now = Date.now();
    const segmentDuration = 3000; // 3 seconds per segment

    const newSegment: CaptionSegment = {
      id: `segment-${now}`,
      text: text.trim(),
      startTime: now,
      endTime: now + segmentDuration,
      duration: segmentDuration,
      position: { x: 0, y: 0, width: 0, height: 0 }
    };

    // Add to segments array
    this.segments.push(newSegment);

    // Keep only recent segments
    if (this.segments.length > 100) {
      this.segments = this.segments.slice(-50);
    }

    // Update caption object
    this.currentCaption = {
      id: "live-caption",
      segments: this.segments,
      fullText: this.segments.map(s => s.text).join(" "),
      language: "en",
      type: "live",
      source: "speech_recognition",
      startTime: this.segments[0]?.startTime || now,
      endTime: now,
      duration: now - (this.segments[0]?.startTime || now),
      state: "ready",
      isAIGenerated: false,
      syncedWithContent: "",
      syncOffset: 0,
      style: this.config.style,
      speakerLabels: this.config.showSpeakerLabels,
      soundDescriptions: this.config.includeSoundDescriptions,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Notify listeners
    for (const listener of this.listeners) {
      listener(newSegment);
    }
  }

  // Start listening
  async startListening(): Promise<void> {
    if (!this.recognition) {
      this.setState("error");
      throw new Error("Speech recognition not available");
    }

    try {
      this.finalTranscript = "";
      this.interimTranscript = "";
      this.segments = [];
      this.currentSegmentIndex = 0;
      this.startTime = Date.now();

      this.recognition.lang = "en-US";
      this.recognition.start();
      this.setState("listening");
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      this.setState("error");
      throw error;
    }
  }

  // Stop listening
  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.setState("idle");
  }

  // Pause
  pause(): void {
    if (this.state === "listening") {
      if (this.recognition) {
        this.recognition.stop();
      }
      this.setState("paused");
    }
  }

  // Resume
  resume(): void {
    if (this.state === "paused") {
      try {
        this.recognition.start();
        this.setState("listening");
      } catch (error) {
        this.setState("error");
      }
    }
  }

  // Get current caption
  getCurrentCaption(): Caption | null {
    return this.currentCaption;
  }

  // Get current segment
  getCurrentSegment(): CaptionSegment | null {
    const now = Date.now();

    for (let i = this.segments.length - 1; i >= 0; i--) {
      const segment = this.segments[i];
      if (now >= segment.startTime && now <= segment.endTime) {
        return segment;
      }
    }

    return this.segments[this.segments.length - 1] || null;
  }

  // Get all segments
  getAllSegments(): CaptionSegment[] {
    return [...this.segments];
  }

  // Set language
  setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  // Update style
  updateStyle(style: Partial<CaptionStyle>): void {
    if (this.config) {
      this.config.style = { ...this.config.style, ...style };
    }
  }

  // Get state
  getState(): LiveCaptionState {
    return this.state;
  }

  private setState(state: LiveCaptionState): void {
    this.state = state;
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  // Subscribe to caption updates
  subscribe(listener: (segment: CaptionSegment | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Subscribe to state changes
  subscribeToState(listener: (state: LiveCaptionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  // Generate caption from text (for pre-recorded content)
  async generateCaption(text: string, timing?: number[]): Promise<Caption> {
    const words = text.split(/\s+/);
    const segments: CaptionSegment[] = [];

    let currentTime = 0;
    const wordDuration = 500; // 500ms per word

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const startTime = currentTime;
      const endTime = startTime + (timing?.[i] || wordDuration);

      segments.push({
        id: `segment-${i}`,
        text: word,
        startTime,
        endTime,
        duration: endTime - startTime,
        position: { x: 0, y: 0, width: 0, height: 0 }
      });

      currentTime = endTime;
    }

    return {
      id: `caption-${Date.now()}`,
      segments,
      fullText: text,
      language: "en",
      type: "subtitle",
      source: "auto_generated",
      startTime: 0,
      endTime: currentTime,
      duration: currentTime,
      state: "ready",
      isAIGenerated: false,
      syncedWithContent: "",
      syncOffset: 0,
      style: this.config?.style || {
        backgroundColor: "#000000",
        backgroundOpacity: 0.8,
        textColor: "#FFFFFF",
        textSize: 16,
        fontFamily: "system-ui",
        borderRadius: 4,
        padding: 8,
        maxWidth: 600
      },
      speakerLabels: false,
      soundDescriptions: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Cleanup
  destroy(): void {
    this.stopListening();
    this.listeners.clear();
    this.stateListeners.clear();
  }
}

// Export singleton
export const liveCaptionEngine = new LiveCaptionEngine();

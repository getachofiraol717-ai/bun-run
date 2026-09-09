// Accessibility Engine — Voice Recognition Service
// Centralized speech recognition service

import type { AccessibilityProfile } from "../models/AccessibilityProfile";

export interface VoiceRecognitionConfig {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  language: string;
  silenceTimeout: number;
}

export interface RecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: string[];
}

export class VoiceRecognitionService {
  private static instance: VoiceRecognitionService;
  private recognition: any = null;
  private profile: AccessibilityProfile | null = null;
  private config: VoiceRecognitionConfig | null = null;
  private isListening: boolean = false;
  private listeners: Set<(result: RecognitionResult) => void> = new Set();
  private stateListeners: Set<(state: "idle" | "listening" | "processing" | "error") => void> = new Set();

  private constructor() {
    this.initRecognition();
  }

  static getInstance(): VoiceRecognitionService {
    if (!VoiceRecognitionService.instance) {
      VoiceRecognitionService.instance = new VoiceRecognitionService();
    }
    return VoiceRecognitionService.instance;
  }

  private initRecognition(): void {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        this.handleResult(event);
      };

      this.recognition.onerror = (event: any) => {
        this.handleError(event);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.notifyStateListeners("idle");
      };
    }
  }

  initialize(profile: AccessibilityProfile | null): void {
    this.profile = profile;

    if (profile) {
      this.config = {
        continuous: profile.motor.voiceControlEnabled,
        interimResults: true,
        maxAlternatives: 1,
        language: profile.audio.speechLanguage || "en-US",
        silenceTimeout: 3000
      };
    }
  }

  isAvailable(): boolean {
    return this.recognition !== null;
  }

  setConfig(config: Partial<VoiceRecognitionConfig>): void {
    this.config = { ...this.config!, ...config };
  }

  getConfig(): VoiceRecognitionConfig | null {
    return this.config;
  }

  // Start listening
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error("Speech recognition not available"));
        return;
      }

      if (this.isListening) {
        resolve();
        return;
      }

      try {
        if (this.config) {
          this.recognition.lang = this.config.language;
          this.recognition.continuous = this.config.continuous;
          this.recognition.interimResults = this.config.interimResults;
          this.recognition.maxAlternatives = this.config.maxAlternatives;
        }

        this.recognition.start();
        this.isListening = true;
        this.notifyStateListeners("listening");
        resolve();
      } catch (error) {
        this.isListening = false;
        this.notifyStateListeners("error");
        reject(error);
      }
    });
  }

  // Stop listening
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.notifyStateListeners("idle");
    }
  }

  // Handle recognition result
  private handleResult(event: any): void {
    this.notifyStateListeners("processing");

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      const recognitionResult: RecognitionResult = {
        transcript,
        confidence,
        isFinal
      };

      if (result.length > 1) {
        recognitionResult.alternatives = [];
        for (let j = 1; j < result.length; j++) {
          recognitionResult.alternatives.push(result[j].transcript);
        }
      }

      this.notifyListeners(recognitionResult);
    }
  }

  // Handle errors
  private handleError(event: any): void {
    console.error("Speech recognition error:", event.error);
    this.isListening = false;

    if (event.error !== "no-speech" && event.error !== "aborted") {
      this.notifyStateListeners("error");
    }
  }

  // Notify listeners
  private notifyListeners(result: RecognitionResult): void {
    for (const listener of this.listeners) {
      listener(result);
    }
  }

  private notifyStateListeners(state: "idle" | "listening" | "processing" | "error"): void {
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  // Subscribe to recognition results
  subscribe(listener: (result: RecognitionResult) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Subscribe to state changes
  subscribeToState(listener: (state: "idle" | "listening" | "processing" | "error") => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  // Check if listening
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Cleanup
  destroy(): void {
    this.stop();
    this.listeners.clear();
    this.stateListeners.clear();
    this.recognition = null;
  }
}

export const voiceRecognitionService = VoiceRecognitionService.getInstance();

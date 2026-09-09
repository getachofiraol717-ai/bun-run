// Accessibility Engine — Audio Description Engine
// Provides audio descriptions for visual content

import type { AccessibilityProfile } from "../models/AccessibilityProfile";
import type { AudioDescription, AudioDescriptionSegment } from "../models/AudioDescription";

export interface AudioDescriptionConfig {
  enabled: boolean;
  volume: number;
  rate: number;
  pitch: number;
  voice: string;
  autoPlay: boolean;
  describeVisuals: boolean;
}

export type AudioDescriptionState = "idle" | "playing" | "paused" | "error";

export class AudioDescriptionEngine {
  private state: AudioDescriptionState = "idle";
  private config: AudioDescriptionConfig | null = null;
  private currentDescription: AudioDescription | null = null;
  private currentSegmentIndex: number = 0;
  private listeners: Set<(state: AudioDescriptionState) => void> = new Set();
  private segmentListeners: Set<(segment: AudioDescriptionSegment | null) => void> = new Set();
  private speechSynthesis: SpeechSynthesisUtterance | null = null;

  // Initialize
  async initialize(config: {
    profile: AccessibilityProfile | null;
    settings: any;
  }): Promise<void> {
    if (config.profile) {
      this.config = {
        enabled: true,
        volume: config.profile.audio.audioDescriptionVolume || 0.8,
        rate: config.profile.audio.speechRate || 1.0,
        pitch: config.profile.audio.pitch || 1.0,
        voice: "default",
        autoPlay: false,
        describeVisuals: true
      };
    }
  }

  // Check availability
  isAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  // Enable audio descriptions
  enable(profile: AccessibilityProfile): void {
    this.config = {
      enabled: true,
      volume: profile.audio.audioDescriptionVolume || 0.8,
      rate: profile.audio.speechRate || 1.0,
      pitch: profile.audio.pitch || 1.0,
      voice: "default",
      autoPlay: false,
      describeVisuals: true
    };
  }

  // Disable audio descriptions
  disable(): void {
    this.stop();
    this.setState("idle");
  }

  // Generate description for content
  async generateDescription(content: any, type: string): Promise<AudioDescription> {
    let description = "";

    switch (type) {
      case "image":
        description = this.generateImageDescription(content);
        break;
      case "diagram":
        description = this.generateDiagramDescription(content);
        break;
      case "chart":
        description = this.generateChartDescription(content);
        break;
      case "video":
        description = this.generateVideoDescription(content);
        break;
      case "animation":
        description = this.generateAnimationDescription(content);
        break;
      default:
        description = this.generateGenericDescription(content);
    }

    return this.createDescriptionObject(description, content, type);
  }

  // Generate image description
  private generateImageDescription(image: any): string {
    let desc = "";

    if (image.title) {
      desc += `Image titled "${image.title}". `;
    }

    if (image.type) {
      desc += `This is a ${image.type}. `;
    }

    if (image.description) {
      desc += `${image.description}. `;
    }

    if (image.subject) {
      desc += `The main subject is ${image.subject}. `;
    }

    if (image.setting) {
      desc += `The setting is ${image.setting}. `;
    }

    if (image.text) {
      desc += `Visible text reads: "${image.text}". `;
    }

    if (image.emotion) {
      desc += `The mood appears to be ${image.emotion}.`;
    }

    return desc.trim() || "An image with no description available.";
  }

  // Generate diagram description
  private generateDiagramDescription(diagram: any): string {
    let desc = "";

    if (diagram.title) {
      desc += `Diagram: ${diagram.title}. `;
    }

    if (diagram.type) {
      desc += `This is a ${diagram.type} diagram. `;
    }

    if (diagram.nodes && Array.isArray(diagram.nodes)) {
      desc += `Contains ${diagram.nodes.length} elements. `;

      for (const node of diagram.nodes.slice(0, 5)) {
        if (node.label) {
          desc += `${node.label}. `;
        }
      }

      if (diagram.nodes.length > 5) {
        desc += `And ${diagram.nodes.length - 5} more elements. `;
      }
    }

    if (diagram.relationships) {
      desc += "The elements are connected through relationships. ";
    }

    return desc.trim();
  }

  // Generate chart description
  private generateChartDescription(chart: any): string {
    let desc = "";

    if (chart.title) {
      desc += `Chart titled "${chart.title}". `;
    }

    if (chart.type) {
      desc += `This is a ${chart.type} chart. `;
    }

    if (chart.xAxis && chart.yAxis) {
      desc += `The X-axis represents ${chart.xAxis}. `;
      desc += `The Y-axis represents ${chart.yAxis}. `;
    }

    if (chart.data) {
      if (chart.data.labels && chart.data.values) {
        desc += "Key data points: ";
        for (let i = 0; i < Math.min(chart.data.labels.length, 5); i++) {
          desc += `${chart.data.labels[i]}: ${chart.data.values[i]}. `;
        }
      }
    }

    if (chart.trend) {
      desc += `Overall trend: ${chart.trend}.`;
    }

    return desc.trim();
  }

  // Generate video description
  private generateVideoDescription(video: any): string {
    let desc = "";

    if (video.title) {
      desc += `Video: ${video.title}. `;
    }

    if (video.duration) {
      const minutes = Math.floor(video.duration / 60);
      desc += `Duration: ${minutes} minutes. `;
    }

    if (video.scenes) {
      desc += "Contains scenes: ";
      for (const scene of video.scenes.slice(0, 3)) {
        desc += `${scene.description}. `;
      }
    }

    if (video.hasVisuals) {
      desc += "Contains visual elements that may not be apparent from audio alone.";
    }

    return desc.trim();
  }

  // Generate animation description
  private generateAnimationDescription(animation: any): string {
    let desc = "";

    if (animation.title) {
      desc += `Animation: ${animation.title}. `;
    }

    if (animation.steps) {
      desc += "Animation steps: ";
      for (const step of animation.steps.slice(0, 5)) {
        desc += `${step}. `;
      }
    }

    if (animation.repeat) {
      desc += "The animation repeats. ";
    }

    return desc.trim();
  }

  // Generate generic description
  private generateGenericDescription(content: any): string {
    let desc = "";

    if (content.title) {
      desc += `${content.title}. `;
    }

    if (content.description) {
      desc += content.description;
    }

    return desc.trim() || "Visual content with no description available.";
  }

  // Create description object
  private createDescriptionObject(description: string, content: any, type: string): AudioDescription {
    const words = description.split(/\s+/);
    const segmentDuration = 3000; // 3 seconds per segment
    const segments: AudioDescriptionSegment[] = [];

    let currentTime = 0;
    let currentText = "";
    let wordCount = 0;

    for (const word of words) {
      currentText += (currentText ? " " : "") + word;
      wordCount++;

      if (wordCount >= 15) {
        segments.push({
          id: `segment-${segments.length}`,
          text: currentText,
          startTime: currentTime,
          endTime: currentTime + segmentDuration,
          duration: segmentDuration,
          descriptionType: "visual"
        });

        currentTime += segmentDuration;
        currentText = "";
        wordCount = 0;
      }
    }

    // Add remaining text
    if (currentText) {
      segments.push({
        id: `segment-${segments.length}`,
        text: currentText,
        startTime: currentTime,
        endTime: currentTime + segmentDuration,
        duration: segmentDuration,
        descriptionType: "visual"
      });
    }

    return {
      id: `audiodesc-${Date.now()}`,
      contentId: content.id || "unknown",
      contentType: type as any,
      descriptions: segments,
      fullDescription: description,
      language: "en",
      type: "standard",
      source: "ai_generated",
      state: "ready",
      isAIGenerated: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Set description
  setDescription(description: AudioDescription): void {
    this.currentDescription = description;
    this.currentSegmentIndex = 0;
  }

  // Play description
  async play(): Promise<void> {
    if (!this.currentDescription) {
      throw new Error("No audio description set");
    }

    this.setState("playing");

    for (let i = this.currentSegmentIndex; i < this.currentDescription.descriptions.length; i++) {
      if (this.state !== "playing") break;

      const segment = this.currentDescription.descriptions[i];
      this.currentSegmentIndex = i;

      await this.speak(segment.text);

      // Notify segment listeners
      for (const listener of this.segmentListeners) {
        listener(segment);
      }
    }

    this.setState("idle");
  }

  // Speak text
  private speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve();
        return;
      }

      this.speechSynthesis = new SpeechSynthesisUtterance(text);

      if (this.config) {
        this.speechSynthesis.volume = this.config.volume;
        this.speechSynthesis.rate = this.config.rate;
        this.speechSynthesis.pitch = this.config.pitch;
      }

      this.speechSynthesis.onend = () => resolve();
      this.speechSynthesis.onerror = () => resolve();

      speechSynthesis.speak(this.speechSynthesis);
    });
  }

  // Pause
  pause(): void {
    if (this.state === "playing") {
      speechSynthesis.pause();
      this.setState("paused");
    }
  }

  // Resume
  resume(): void {
    if (this.state === "paused") {
      speechSynthesis.resume();
      this.setState("playing");
    }
  }

  // Stop
  stop(): void {
    speechSynthesis.cancel();
    this.currentSegmentIndex = 0;
    this.setState("idle");
  }

  // Skip to segment
  skipToSegment(index: number): void {
    if (this.currentDescription && index >= 0 && index < this.currentDescription.descriptions.length) {
      this.currentSegmentIndex = index;
    }
  }

  // Get current segment
  getCurrentSegment(): AudioDescriptionSegment | null {
    if (!this.currentDescription) return null;
    return this.currentDescription.descriptions[this.currentSegmentIndex] || null;
  }

  // Get progress
  getProgress(): { current: number; total: number; percentage: number } {
    if (!this.currentDescription) {
      return { current: 0, total: 0, percentage: 0 };
    }

    const total = this.currentDescription.descriptions.length;
    const current = this.currentSegmentIndex;
    const percentage = total > 0 ? (current / total) * 100 : 0;

    return { current, total, percentage };
  }

  // Get state
  getState(): AudioDescriptionState {
    return this.state;
  }

  private setState(state: AudioDescriptionState): void {
    this.state = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  // Subscribe to state changes
  subscribe(listener: (state: AudioDescriptionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Subscribe to segment changes
  subscribeToSegments(listener: (segment: AudioDescriptionSegment | null) => void): () => void {
    this.segmentListeners.add(listener);
    return () => this.segmentListeners.delete(listener);
  }

  // Cleanup
  destroy(): void {
    this.stop();
    this.listeners.clear();
    this.segmentListeners.clear();
  }
}

// Export singleton
export const audioDescriptionEngine = new AudioDescriptionEngine();

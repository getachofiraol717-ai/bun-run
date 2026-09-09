// @ts-nocheck
// Accessibility Engine — Caption Service
// Manages caption generation and display

import type { AccessibilityProfile } from "../models/AccessibilityProfile";
import type { Caption, CaptionStyle, CaptionCue } from "../models/Caption";

export interface CaptionServiceConfig {
  enabled: boolean;
  style: CaptionStyle;
  position: "bottom" | "top" | "overlay";
  maxLines: number;
  autoHide: boolean;
  autoHideDelay: number;
}

export class CaptionService {
  private static instance: CaptionService;
  private profile: AccessibilityProfile | null = null;
  private config: CaptionServiceConfig | null = null;
  private captions: Caption[] = [];
  private activeCaption: Caption | null = null;
  private listeners: Set<(caption: Caption | null) => void> = new Set();
  private container: HTMLElement | null = null;

  private constructor() {}

  static getInstance(): CaptionService {
    if (!CaptionService.instance) {
      CaptionService.instance = new CaptionService();
    }
    return CaptionService.instance;
  }

  initialize(profile: AccessibilityProfile | null): void {
    this.profile = profile;

    if (profile) {
      this.config = {
        enabled: true,
        style: profile.caption?.style || "default",
        position: profile.caption?.position || "bottom",
        maxLines: profile.caption?.maxLines || 2,
        autoHide: profile.caption?.autoHide ?? true,
        autoHideDelay: profile.caption?.autoHideDelay || 3000
      };
    }

    this.createContainer();
  }

  private createContainer(): void {
    if (typeof document === "undefined") return;

    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "a11y-caption-container";
      this.container.setAttribute("role", "region");
      this.container.setAttribute("aria-label", "Captions");
      this.container.style.cssText = `
        position: fixed;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        max-width: 80%;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
  }

  isAvailable(): boolean {
    return true;
  }

  setConfig(config: Partial<CaptionServiceConfig>): void {
    this.config = { ...this.config!, ...config };
  }

  getConfig(): CaptionServiceConfig | null {
    return this.config;
  }

  // Create caption
  createCaption(options: {
    text: string;
    startTime: number;
    endTime: number;
    speaker?: string;
    style?: CaptionStyle;
  }): Caption {
    const caption: Caption = {
      id: `caption-${Date.now()}`,
      text: options.text,
      startTime: options.startTime,
      endTime: options.endTime,
      speaker: options.speaker,
      style: options.style || this.config?.style || "default",
      position: this.config?.position || "bottom"
    };

    this.captions.push(caption);
    return caption;
  }

  // Add caption cue
  addCue(cue: CaptionCue): void {
    const caption: Caption = {
      id: cue.id,
      text: cue.text,
      startTime: cue.startTime,
      endTime: cue.endTime,
      style: this.config?.style || "default",
      position: this.config?.position || "bottom"
    };

    this.captions.push(caption);
    this.captions.sort((a, b) => a.startTime - b.startTime);
  }

  // Load captions from array
  loadCaptions(cues: CaptionCue[]): void {
    this.captions = cues.map(cue => ({
      id: cue.id,
      text: cue.text,
      startTime: cue.startTime,
      endTime: cue.endTime,
      style: this.config?.style || "default",
      position: this.config?.position || "bottom"
    }));
    this.captions.sort((a, b) => a.startTime - b.startTime);
  }

  // Get caption at time
  getCaptionAtTime(time: number): Caption | null {
    return this.captions.find(
      c => time >= c.startTime && time <= c.endTime
    ) || null;
  }

  // Set active caption
  setActiveCaption(caption: Caption | null): void {
    this.activeCaption = caption;
    this.render();
    this.notifyListeners();
  }

  // Render captions
  render(): void {
    if (!this.container || !this.activeCaption) {
      if (this.container) {
        this.container.innerHTML = "";
      }
      return;
    }

    const caption = this.activeCaption;
    const style = this.getStyle(caption.style);

    this.container.innerHTML = `
      <div class="caption-display" style="${style}">
        <span class="caption-text">${this.escapeHtml(caption.text)}</span>
      </div>
    `;
  }

  private getStyle(style: CaptionStyle): string {
    switch (style) {
      case "high_contrast":
        return `
          background: rgba(0, 0, 0, 0.95);
          color: #ffffff;
          font-size: 1.2em;
          font-weight: bold;
          padding: 12px 24px;
          border-radius: 4px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        `;
      case "large_text":
        return `
          background: rgba(0, 0, 0, 0.9);
          color: #ffffff;
          font-size: 1.8em;
          font-weight: bold;
          padding: 16px 32px;
          border-radius: 8px;
        `;
      case "immersive":
        return `
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
          color: #ffffff;
          font-size: 1.4em;
          padding: 40px 20px;
          text-align: center;
          border-radius: 0;
        `;
      default:
        return `
          background: rgba(0, 0, 0, 0.8);
          color: #ffffff;
          font-size: 1em;
          padding: 8px 16px;
          border-radius: 4px;
        `;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Get all captions
  getAllCaptions(): Caption[] {
    return [...this.captions];
  }

  // Clear captions
  clear(): void {
    this.captions = [];
    this.activeCaption = null;
    this.render();
  }

  // Subscribe to caption changes
  subscribe(listener: (caption: Caption | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.activeCaption);
    }
  }

  // Export captions as SRT format
  exportAsSRT(): string {
    let srt = "";

    this.captions.forEach((caption, index) => {
      srt += `${index + 1}\n`;
      srt += `${this.formatSRTTime(caption.startTime)} --> ${this.formatSRTTime(caption.endTime)}\n`;
      srt += `${caption.text}\n\n`;
    });

    return srt;
  }

  private formatSRTTime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`;
  }

  // Cleanup
  destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.captions = [];
    this.activeCaption = null;
    this.listeners.clear();
  }
}

export const captionService = CaptionService.getInstance();

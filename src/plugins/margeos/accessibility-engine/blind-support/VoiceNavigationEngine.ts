// Accessibility Engine — Voice Navigation Engine
// Provides voice-controlled navigation for blind users

import type { AccessibilityProfile } from "../models/AccessibilityProfile";

export interface VoiceNavigationConfig {
  enabled: boolean;
  language: string;
  continuous: boolean;
  interimResults: boolean;
  sensitivity: number;
  activationPhrase?: string;
}

export interface NavigationTarget {
  id: string;
  label: string;
  type: "link" | "button" | "input" | "heading" | "region" | "listitem" | "menuitem";
  href?: string;
  level?: number;
  enabled: boolean;
  parent?: string;
  children?: string[];
}

export type VoiceNavigationState = "idle" | "listening" | "processing" | "navigating" | "error";

export interface VoiceCommand {
  command: string;
  action: string;
  params?: Record<string, any>;
}

export class VoiceNavigationEngine {
  private state: VoiceNavigationState = "idle";
  private config: VoiceNavigationConfig | null = null;
  private recognition: any = null;
  private targets: Map<string, NavigationTarget> = new Map();
  private listeners: Set<(state: VoiceNavigationState) => void> = new Set();
  private navigationListeners: Set<(target: NavigationTarget) => void> = new Set();
  private speechListeners: Set<(text: string) => void> = new Set();

  // Built-in commands
  private commands: VoiceCommand[] = [
    { command: "go to", action: "navigate" },
    { command: "click", action: "click" },
    { command: "select", action: "select" },
    { command: "open", action: "open" },
    { command: "next", action: "next" },
    { command: "previous", action: "previous" },
    { command: "back", action: "back" },
    { command: "home", action: "home" },
    { command: "menu", action: "menu" },
    { command: "search", action: "search" },
    { command: "read", action: "read" },
    { command: "scroll", action: "scroll" },
    { command: "top", action: "scrollTop" },
    { command: "bottom", action: "scrollBottom" },
    { command: "help", action: "help" },
    { command: "stop", action: "stop" }
  ];

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

      this.recognition.onresult = (event: any) => {
        this.handleRecognitionResult(event);
      };

      this.recognition.onerror = (event: any) => {
        console.error("Voice navigation error:", event.error);
        if (event.error !== "no-speech") {
          this.setState("error");
        }
      };

      this.recognition.onend = () => {
        if (this.state === "listening" && this.config?.continuous) {
          try {
            this.recognition.start();
          } catch (e) {
            // Ignore restart errors
          }
        } else if (this.state === "listening") {
          this.setState("idle");
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
        language: config.profile.audio.speechLanguage || "en-US",
        continuous: config.profile.motor.voiceControlEnabled,
        interimResults: true,
        sensitivity: config.profile.motor.voiceControlSensitivity || 0.5,
        activationPhrase: "Hey Assistant"
      };
    }
  }

  // Check availability
  isAvailable(): boolean {
    return this.recognition !== null;
  }

  // Enable voice navigation
  enable(profile: AccessibilityProfile): void {
    this.config = {
      enabled: true,
      language: profile.audio.speechLanguage || "en-US",
      continuous: true,
      interimResults: true,
      sensitivity: profile.motor.voiceControlSensitivity || 0.5
    };
  }

  // Disable voice navigation
  disable(): void {
    this.stopListening();
    this.setState("idle");
  }

  // Start listening
  async startListening(): Promise<void> {
    if (!this.recognition || !this.config) {
      this.setState("error");
      throw new Error("Speech recognition not available");
    }

    try {
      this.recognition.lang = this.config.language;
      this.recognition.start();
      this.setState("listening");
    } catch (error) {
      console.error("Failed to start voice navigation:", error);
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

  // Handle recognition results
  private handleRecognitionResult(event: any): void {
    let transcript = "";
    let isFinal = false;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript = event.results[i][0].transcript;
      isFinal = event.results[i].isFinal;
    }

    if (transcript) {
      this.processCommand(transcript.trim().toLowerCase(), isFinal);
    }
  }

  // Process voice command
  private processCommand(transcript: string, isFinal: boolean): void {
    if (!isFinal) return;

    this.setState("processing");

    // Parse command
    const matchedCommand = this.findMatchingCommand(transcript);

    if (matchedCommand) {
      this.executeCommand(matchedCommand, transcript);
    } else {
      // Try to navigate to text
      this.navigateToText(transcript);
    }
  }

  // Find matching command
  private findMatchingCommand(transcript: string): VoiceCommand | null {
    for (const cmd of this.commands) {
      if (transcript.includes(cmd.command)) {
        return cmd;
      }
    }
    return null;
  }

  // Execute command
  private executeCommand(command: VoiceCommand, transcript: string): void {
    this.setState("navigating");

    switch (command.action) {
      case "navigate":
        this.navigateToTarget(transcript.replace("go to", "").trim());
        break;

      case "click":
      case "select":
        this.clickTarget(transcript.replace(/click|select/g, "").trim());
        break;

      case "next":
        this.navigateNext();
        break;

      case "previous":
        this.navigatePrevious();
        break;

      case "back":
        this.navigateBack();
        break;

      case "home":
        this.navigateHome();
        break;

      case "scrollTop":
        this.scrollToTop();
        break;

      case "scrollBottom":
        this.scrollToBottom();
        break;

      case "help":
        this.provideHelp();
        break;

      case "stop":
        this.stopListening();
        break;

      default:
        this.setState("idle");
    }
  }

  // Navigate to target
  private navigateToTarget(text: string): void {
    const normalizedText = text.toLowerCase().trim();

    // Find matching target
    for (const [id, target] of this.targets) {
      const targetLabel = target.label.toLowerCase();
      if (targetLabel.includes(normalizedText) || normalizedText.includes(targetLabel)) {
        this.navigateTo(target);
        return;
      }
    }

    // No match found
    this.speak(`No match found for ${text}`);
    this.setState("idle");
  }

  // Navigate to text
  private navigateToText(text: string): void {
    if (typeof document === "undefined") {
      this.setState("idle");
      return;
    }

    // Search for text in page
    const found = document.evaluate(
      `//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${text.toLowerCase()}')]`,
      document.body,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );

    if (found.singleNodeValue) {
      const element = found.singleNodeValue as HTMLElement;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus();
      this.speak(`Found: ${element.textContent?.slice(0, 50)}`);
    } else {
      this.speak(`No match found for ${text}`);
    }

    this.setState("idle");
  }

  // Click target
  private clickTarget(text: string): void {
    this.navigateToTarget(text);
    // After navigation, click will be triggered
  }

  // Navigate to target
  navigateTo(target: NavigationTarget): void {
    // Notify listeners
    for (const listener of this.navigationListeners) {
      listener(target);
    }

    // Perform navigation
    const element = document.getElementById(target.id);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      // Click if it's a button or link
      if (target.type === "button" || target.type === "link") {
        (element as HTMLElement).click();
      }
    }

    this.speak(`Navigated to ${target.label}`);
    this.setState("idle");
  }

  // Navigate next
  navigateNext(): void {
    const currentFocus = document.activeElement;
    if (!currentFocus) return;

    const focusable = this.getFocusableElements();
    const currentIndex = focusable.indexOf(currentFocus as HTMLElement);

    if (currentIndex < focusable.length - 1) {
      const next = focusable[currentIndex + 1];
      next.focus();
      this.speak(this.getElementDescription(next));
    }

    this.setState("idle");
  }

  // Navigate previous
  navigatePrevious(): void {
    const currentFocus = document.activeElement;
    if (!currentFocus) return;

    const focusable = this.getFocusableElements();
    const currentIndex = focusable.indexOf(currentFocus as HTMLElement);

    if (currentIndex > 0) {
      const prev = focusable[currentIndex - 1];
      prev.focus();
      this.speak(this.getElementDescription(prev));
    }

    this.setState("idle");
  }

  // Navigate back
  navigateBack(): void {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      this.speak("Going back");
    }
    this.setState("idle");
  }

  // Navigate home
  navigateHome(): void {
    const homeLink = document.querySelector('a[href="/"], a[href="/home"], [role="home"]');
    if (homeLink) {
      (homeLink as HTMLElement).click();
      this.speak("Going home");
    }
    this.setState("idle");
  }

  // Scroll to top
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: "smooth" });
    this.speak("Scrolled to top");
    this.setState("idle");
  }

  // Scroll to bottom
  scrollToBottom(): void {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    this.speak("Scrolled to bottom");
    this.setState("idle");
  }

  // Provide help
  provideHelp(): void {
    this.speak("Voice navigation commands: say 'go to' followed by a link name, say 'next' or 'previous' to navigate, say 'click' or 'select' to activate, say 'scroll top' or 'scroll bottom', say 'back' to go back, say 'home' to go home, say 'stop' to stop listening.");
    this.setState("idle");
  }

  // Get focusable elements
  private getFocusableElements(): HTMLElement[] {
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }

  // Get element description
  private getElementDescription(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const text = element.textContent?.trim().slice(0, 30) || "";
    const type = element.getAttribute("type") || "";
    const placeholder = element.getAttribute("placeholder") || "";

    if (text) return `${tagName}: ${text}`;
    if (placeholder) return `${tagName} placeholder: ${placeholder}`;
    if (type) return `${tagName} type ${type}`;

    return tagName;
  }

  // Update navigation targets
  updateTargets(targets: NavigationTarget[]): void {
    this.targets.clear();
    for (const target of targets) {
      this.targets.set(target.id, target);
    }
  }

  // Scan page for targets
  scanPage(): void {
    if (typeof document === "undefined") return;

    const newTargets: NavigationTarget[] = [];

    // Scan links
    document.querySelectorAll("a[href]").forEach(el => {
      const htmlEl = el as HTMLElement;
      const text = htmlEl.textContent?.trim() || "";
      if (text && text.length > 0 && text.length < 100) {
        newTargets.push({
          id: htmlEl.id || `link-${newTargets.length}`,
          label: text,
          type: "link",
          href: htmlEl.getAttribute("href") || undefined,
          enabled: !htmlEl.hasAttribute("disabled")
        });
      }
    });

    // Scan buttons
    document.querySelectorAll("button").forEach(el => {
      const htmlEl = el as HTMLElement;
      const text = htmlEl.textContent?.trim() || htmlEl.getAttribute("aria-label") || "";
      if (text) {
        newTargets.push({
          id: htmlEl.id || `button-${newTargets.length}`,
          label: text,
          type: "button",
          enabled: !htmlEl.hasAttribute("disabled")
        });
      }
    });

    // Scan headings
    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(el => {
      const htmlEl = el as HTMLElement;
      const level = parseInt(htmlEl.tagName[1]);
      newTargets.push({
        id: htmlEl.id || `heading-${newTargets.length}`,
        label: `Heading ${level}: ${htmlEl.textContent?.trim()}`,
        type: "heading",
        level,
        enabled: true
      });
    });

    this.updateTargets(newTargets);
  }

  // Speak text
  speak(text: string): void {
    if (typeof window === "undefined") return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.config?.sensitivity || 1;
    utterance.pitch = 1;

    speechSynthesis.speak(utterance);

    // Notify listeners
    for (const listener of this.speechListeners) {
      listener(text);
    }
  }

  // Get state
  getState(): VoiceNavigationState {
    return this.state;
  }

  private setState(state: VoiceNavigationState): void {
    this.state = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  // Subscribe to state changes
  subscribe(listener: (state: VoiceNavigationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Subscribe to navigation
  subscribeToNavigation(listener: (target: NavigationTarget) => void): () => void {
    this.navigationListeners.add(listener);
    return () => this.navigationListeners.delete(listener);
  }

  // Subscribe to speech
  subscribeToSpeech(listener: (text: string) => void): () => void {
    this.speechListeners.add(listener);
    return () => this.speechListeners.delete(listener);
  }

  // Cleanup
  destroy(): void {
    this.stopListening();
    this.listeners.clear();
    this.navigationListeners.clear();
    this.speechListeners.clear();
  }
}

// Export singleton
export const voiceNavigationEngine = new VoiceNavigationEngine();

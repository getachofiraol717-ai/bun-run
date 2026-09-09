// Accessibility Engine — Voice Command Engine
// Processes voice commands for hands-free control

import type { AccessibilityProfile } from "../models/AccessibilityProfile";

export interface VoiceCommandDefinition {
  name: string;
  patterns: RegExp[];
  action: (params: Record<string, string>) => Promise<void> | void;
  description: string;
  examples: string[];
  category: "navigation" | "action" | "content" | "system";
}

export interface VoiceCommandResult {
  command: string;
  success: boolean;
  message?: string;
  action?: string;
}

export class VoiceCommandEngine {
  private profile: AccessibilityProfile | null = null;
  private commands: Map<string, VoiceCommandDefinition> = new Map();
  private listeners: Set<(result: VoiceCommandResult) => void> = new Set();
  private enabled: boolean = false;

  constructor() {
    this.registerDefaultCommands();
  }

  // Initialize
  async initialize(config: {
    profile: AccessibilityProfile | null;
    settings: any;
  }): Promise<void> {
    this.profile = config.profile;
    this.enabled = true;
  }

  // Check availability
  isAvailable(): boolean {
    return typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }

  // Register default commands
  private registerDefaultCommands(): void {
    // Navigation commands
    this.registerCommand({
      name: "go_to",
      patterns: [/go to (.+)/i, /navigate to (.+)/i, /open (.+)/i, /visit (.+)/i],
      action: async (params) => {
        const target = Object.values(params)[0];
        this.executeNavigation(target as string);
      },
      description: "Navigate to a page or section",
      examples: ["go to settings", "open dashboard", "navigate to profile"],
      category: "navigation"
    });

    this.registerCommand({
      name: "scroll",
      patterns: [/scroll (up|down|top|bottom)/i, /scroll/i],
      action: async (params) => {
        const direction = Object.values(params)[0] || "down";
        this.executeScroll(direction as string);
      },
      description: "Scroll the page",
      examples: ["scroll down", "scroll up", "scroll to top"],
      category: "navigation"
    });

    // Action commands
    this.registerCommand({
      name: "click",
      patterns: [/click (.+)/i, /press (.+)/i, /select (.+)/i, /activate (.+)/i],
      action: async (params) => {
        const target = Object.values(params)[0];
        await this.executeClick(target as string);
      },
      description: "Click or activate an element",
      examples: ["click submit", "press button", "select option"],
      category: "action"
    });

    this.registerCommand({
      name: "read",
      patterns: [/read (.+)/i, /read page/i, /read content/i, /what does it say/i],
      action: async (params) => {
        const target = Object.values(params)[0];
        await this.executeRead(target as string);
      },
      description: "Read content aloud",
      examples: ["read this section", "read page", "read the title"],
      category: "content"
    });

    this.registerCommand({
      name: "repeat",
      patterns: [/repeat/i, /say again/i, /what was that/i],
      action: async () => {
        this.executeRepeat();
      },
      description: "Repeat the last spoken content",
      examples: ["repeat", "say again"],
      category: "content"
    });

    this.registerCommand({
      name: "search",
      patterns: [/search for (.+)/i, /find (.+)/i, /look up (.+)/i],
      action: async (params) => {
        const query = Object.values(params)[0];
        await this.executeSearch(query as string);
      },
      description: "Search for content",
      examples: ["search for JavaScript", "find tutorials", "look up CSS"],
      category: "action"
    });

    this.registerCommand({
      name: "next",
      patterns: [/next/i, /continue/i, /forward/i],
      action: async () => {
        this.executeNext();
      },
      description: "Go to next item",
      examples: ["next", "continue"],
      category: "navigation"
    });

    this.registerCommand({
      name: "previous",
      patterns: [/previous/i, /back/i, /go back/i],
      action: async () => {
        this.executePrevious();
      },
      description: "Go to previous item",
      examples: ["previous", "go back"],
      category: "navigation"
    });

    // System commands
    this.registerCommand({
      name: "help",
      patterns: [/help/i, /commands/i, /what can i say/i, /show commands/i],
      action: async () => {
        await this.showHelp();
      },
      description: "Show available voice commands",
      examples: ["help", "what can I say"],
      category: "system"
    });

    this.registerCommand({
      name: "stop",
      patterns: [/stop/i, /quiet/i, /silence/i, /be quiet/i],
      action: async () => {
        this.executeStop();
      },
      description: "Stop current speech",
      examples: ["stop", "be quiet"],
      category: "system"
    });

    this.registerCommand({
      name: "menu",
      patterns: [/show menu/i, /open menu/i, /menu/i],
      action: async () => {
        await this.executeMenu();
      },
      description: "Open the main menu",
      examples: ["show menu", "open menu"],
      category: "navigation"
    });

    this.registerCommand({
      name: "home",
      patterns: [/go home/i, /home/i, /main page/i],
      action: async () => {
        await this.executeHome();
      },
      description: "Go to home page",
      examples: ["go home", "home"],
      category: "navigation"
    });

    // Content commands
    this.registerCommand({
      name: "explain",
      patterns: [/explain (.+)/i, /what is (.+)/i, /tell me about (.+)/i],
      action: async (params) => {
        const topic = Object.values(params)[0];
        await this.executeExplain(topic as string);
      },
      description: "Explain a topic or concept",
      examples: ["explain this", "what is recursion", "tell me about arrays"],
      category: "content"
    });

    this.registerCommand({
      name: "quiz",
      patterns: [/start quiz/i, /take quiz/i, /quiz/i],
      action: async () => {
        await this.executeQuiz();
      },
      description: "Start a quiz",
      examples: ["start quiz", "take quiz"],
      category: "action"
    });

    this.registerCommand({
      name: "flashcards",
      patterns: [/show flashcards/i, /flashcards/i, /study cards/i],
      action: async () => {
        await this.executeFlashcards();
      },
      description: "Open flashcards",
      examples: ["show flashcards", "study cards"],
      category: "action"
    });
  }

  // Register a command
  registerCommand(command: VoiceCommandDefinition): void {
    this.commands.set(command.name, command);
  }

  // Unregister a command
  unregisterCommand(name: string): void {
    this.commands.delete(name);
  }

  // Process voice input
  async process(input: string): Promise<VoiceCommandResult> {
    if (!this.enabled) {
      return {
        command: input,
        success: false,
        message: "Voice commands are disabled"
      };
    }

    const normalizedInput = input.toLowerCase().trim();

    // Try to match each command
    for (const [name, command] of this.commands) {
      for (const pattern of command.patterns) {
        const match = normalizedInput.match(pattern);
        if (match) {
          try {
            // Extract parameters
            const params: Record<string, string> = {};
            if (match[1]) {
              params.value = match[1];
            }

            // Execute action
            await command.action(params);

            return {
              command: input,
              success: true,
              action: name
            };
          } catch (error) {
            return {
              command: input,
              success: false,
              message: `Error executing command: ${error}`
            };
          }
        }
      }
    }

    return {
      command: input,
      success: false,
      message: "Command not recognized"
    };
  }

  // Get all commands
  getCommands(): VoiceCommandDefinition[] {
    return Array.from(this.commands.values());
  }

  // Get commands by category
  getCommandsByCategory(category: VoiceCommandDefinition["category"]): VoiceCommandDefinition[] {
    return Array.from(this.commands.values()).filter(cmd => cmd.category === category);
  }

  // Execute navigation
  private executeNavigation(target: string): void {
    // Try to find matching link or element
    const normalizedTarget = target.toLowerCase();

    // Check for common navigation targets
    const navTargets: Record<string, string> = {
      "home": "/",
      "settings": "/settings",
      "profile": "/profile",
      "dashboard": "/dashboard",
      "help": "/help"
    };

    const href = navTargets[normalizedTarget];
    if (href) {
      window.location.href = href;
      return;
    }

    // Try to find link with matching text
    const links = document.querySelectorAll("a");
    for (const link of links) {
      const text = link.textContent?.toLowerCase() || "";
      if (text.includes(normalizedTarget) || normalizedTarget.includes(text)) {
        (link as HTMLElement).click();
        return;
      }
    }

    // Use screen reader to announce
    this.speak(`Could not find ${target}`);
  }

  // Execute scroll
  private executeScroll(direction: string): void {
    switch (direction.toLowerCase()) {
      case "up":
        window.scrollBy({ top: -300, behavior: "smooth" });
        this.speak("Scrolling up");
        break;
      case "down":
        window.scrollBy({ top: 300, behavior: "smooth" });
        this.speak("Scrolling down");
        break;
      case "top":
        window.scrollTo({ top: 0, behavior: "smooth" });
        this.speak("Scrolling to top");
        break;
      case "bottom":
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        this.speak("Scrolling to bottom");
        break;
    }
  }

  // Execute click
  private async executeClick(target: string): Promise<void> {
    const normalizedTarget = target.toLowerCase();

    // Find matching element
    const elements = document.querySelectorAll("button, a, [role='button'], input, select");

    for (const el of elements) {
      const text = (el.textContent || el.getAttribute("aria-label") || "").toLowerCase();
      if (text.includes(normalizedTarget) || normalizedTarget.includes(text)) {
        (el as HTMLElement).click();
        this.speak(`Clicked ${target}`);
        return;
      }
    }

    this.speak(`Could not find ${target}`);
  }

  // Execute read
  private async executeRead(target: string): Promise<void> {
    if (!target || target === "page" || target === "content") {
      // Read the main content
      const main = document.querySelector("main") || document.body;
      const text = main.textContent || "";
      this.speak(text.slice(0, 500) + (text.length > 500 ? "..." : ""));
    } else {
      // Find specific element
      const elements = document.querySelectorAll("*");
      for (const el of elements) {
        const text = el.textContent?.toLowerCase() || "";
        if (text.includes(target.toLowerCase())) {
          this.speak(el.textContent || "");
          return;
        }
      }
      this.speak(`Could not find ${target}`);
    }
  }

  // Execute repeat
  private executeRepeat(): void {
    // Would need to store last spoken text
    this.speak("There is nothing to repeat");
  }

  // Execute search
  private async executeSearch(query: string): Promise<void> {
    const searchInput = document.querySelector("input[type='search'], input[placeholder*='search' i]") as HTMLInputElement;
    if (searchInput) {
      searchInput.value = query;
      searchInput.focus();
      const event = new Event("input", { bubbles: true });
      searchInput.dispatchEvent(event);
      this.speak(`Searching for ${query}`);
    } else {
      this.speak("Search field not found");
    }
  }

  // Execute next
  private executeNext(): void {
    // Navigate to next logical item
    const focusable = this.getFocusableElements();
    const current = document.activeElement;
    const index = focusable.indexOf(current as HTMLElement);

    if (index < focusable.length - 1) {
      focusable[index + 1].focus();
    }
  }

  // Execute previous
  private executePrevious(): void {
    const focusable = this.getFocusableElements();
    const current = document.activeElement;
    const index = focusable.indexOf(current as HTMLElement);

    if (index > 0) {
      focusable[index - 1].focus();
    }
  }

  // Show help
  private async showHelp(): Promise<void> {
    const commands = this.getCommands();
    const navigation = commands.filter(c => c.category === "navigation").map(c => c.name).join(", ");
    const actions = commands.filter(c => c.category === "action").map(c => c.name).join(", ");
    const content = commands.filter(c => c.category === "content").map(c => c.name).join(", ");
    const system = commands.filter(c => c.category === "system").map(c => c.name).join(", ");

    this.speak(`Available commands. Navigation: ${navigation}. Actions: ${actions}. Content: ${content}. System: ${system}.`);
  }

  // Execute stop
  private executeStop(): void {
    if (typeof window !== "undefined") {
      speechSynthesis.cancel();
    }
  }

  // Execute menu
  private async executeMenu(): Promise<void> {
    const menuButton = document.querySelector("button[aria-label*='menu' i], [role='menu'], nav") as HTMLElement;
    if (menuButton) {
      menuButton.click();
      this.speak("Menu opened");
    } else {
      this.speak("Menu not found");
    }
  }

  // Execute home
  private async executeHome(): Promise<void> {
    window.location.href = "/";
    this.speak("Going home");
  }

  // Execute explain
  private async executeExplain(topic: string): Promise<void> {
    // Integration with AI Tutor would happen here
    this.speak(`Explaining ${topic}. This feature connects to the AI Tutor for detailed explanations.`);
  }

  // Execute quiz
  private async executeQuiz(): Promise<void> {
    window.location.href = "/quiz";
    this.speak("Starting quiz");
  }

  // Execute flashcards
  private async executeFlashcards(): Promise<void> {
    window.location.href = "/flashcards";
    this.speak("Opening flashcards");
  }

  // Speak text
  private speak(text: string): void {
    if (typeof window === "undefined") return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.profile?.audio.speechRate || 1;
    speechSynthesis.speak(utterance);
  }

  // Get focusable elements
  private getFocusableElements(): HTMLElement[] {
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }

  // Subscribe to results
  subscribe(listener: (result: VoiceCommandResult) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Enable/disable
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Cleanup
  destroy(): void {
    this.commands.clear();
    this.listeners.clear();
  }
}

// Export singleton
export const voiceCommandEngine = new VoiceCommandEngine();

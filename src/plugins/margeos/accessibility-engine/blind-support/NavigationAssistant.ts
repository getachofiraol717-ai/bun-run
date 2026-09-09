// Accessibility Engine — Navigation Assistant
// Provides guided navigation for screen reader users

import type { AccessibilityProfile } from "../models/AccessibilityProfile";

export interface NavigationStep {
  level: number;
  type: "heading" | "landmark" | "link" | "control" | "region";
  label: string;
  position: number;
  element?: HTMLElement;
}

export interface NavigationContext {
  current: NavigationStep | null;
  previous: NavigationStep | null;
  next: NavigationStep | null;
  breadcrumb: NavigationStep[];
  position: number;
  total: number;
}

export interface NavigationGuide {
  heading: string;
  level: number;
  items: string[];
  instructions: string[];
}

export class NavigationAssistant {
  private profile: AccessibilityProfile | null = null;
  private currentPosition: number = 0;
  private navigationItems: NavigationStep[] = [];
  private breadcrumb: NavigationStep[] = [];
  private listeners: Set<(context: NavigationContext) => void> = new Set();
  private speechEnabled: boolean = true;

  // Initialize
  async initialize(config: {
    profile: AccessibilityProfile | null;
    settings: any;
  }): Promise<void> {
    this.profile = config.profile;
    this.scanPage();
  }

  // Scan page for navigable elements
  scanPage(): void {
    if (typeof document === "undefined") return;

    this.navigationItems = [];
    this.breadcrumb = [];
    this.currentPosition = 0;

    let position = 0;

    // Add landmarks
    const landmarks = document.querySelectorAll(
      "nav, main, header, footer, aside, [role='navigation'], [role='main'], [role='banner'], [role='contentinfo'], [role='complementary']"
    );

    landmarks.forEach(el => {
      const htmlEl = el as HTMLElement;
      const role = htmlEl.getAttribute("role");
      const label = htmlEl.getAttribute("aria-label") || htmlEl.tagName.toLowerCase();

      this.navigationItems.push({
        level: 0,
        type: role === "navigation" || htmlEl.tagName === "NAV" ? "landmark" : "region",
        label,
        position: position++,
        element: htmlEl
      });
    });

    // Add headings
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");

    headings.forEach(el => {
      const htmlEl = el as HTMLElement;
      const level = parseInt(htmlEl.tagName[1]);
      const text = htmlEl.textContent?.trim() || "Untitled";

      this.navigationItems.push({
        level,
        type: "heading",
        label: text,
        position: position++,
        element: htmlEl
      });
    });

    // Add links
    const links = document.querySelectorAll("a[href]");

    links.forEach(el => {
      const htmlEl = el as HTMLElement;
      const text = htmlEl.textContent?.trim();

      if (text && text.length > 0 && text.length < 100) {
        this.navigationItems.push({
          level: 0,
          type: "link",
          label: text,
          position: position++,
          element: htmlEl
        });
      }
    });

    // Add controls
    const controls = document.querySelectorAll("button, input, select, textarea, [role='button'], [role='checkbox'], [role='radio'], [role='textbox']");

    controls.forEach(el => {
      const htmlEl = el as HTMLElement;
      const label = this.getControlLabel(htmlEl);

      if (label) {
        this.navigationItems.push({
          level: 0,
          type: "control",
          label,
          position: position++,
          element: htmlEl
        });
      }
    });

    // Sort by document position
    this.navigationItems.sort((a, b) => {
      const aRect = a.element?.getBoundingClientRect();
      const bRect = b.element?.getBoundingClientRect();
      return (aRect?.top || 0) - (bRect?.top || 0);
    });

    // Update positions after sort
    this.navigationItems.forEach((item, index) => {
      item.position = index;
    });
  }

  // Get control label
  private getControlLabel(element: HTMLElement): string {
    // Check aria-label
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    // Check associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent?.trim() || "";
    }

    // Check parent label
    const parent = element.closest("label");
    if (parent) return parent.textContent?.trim() || "";

    // For inputs, check placeholder
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      const placeholder = element.getAttribute("placeholder");
      if (placeholder) return placeholder;
    }

    // Fall back to text content
    const text = element.textContent?.trim();
    if (text) return text;

    // Check role
    const role = element.getAttribute("role");
    if (role) return role;

    return "";
  }

  // Get current context
  getContext(): NavigationContext {
    const current = this.navigationItems[this.currentPosition] || null;
    const previous = this.navigationItems[this.currentPosition - 1] || null;
    const next = this.navigationItems[this.currentPosition + 1] || null;

    return {
      current,
      previous,
      next,
      breadcrumb: this.breadcrumb,
      position: this.currentPosition,
      total: this.navigationItems.length
    };
  }

  // Navigate to item at index
  navigateToIndex(index: number): void {
    if (index >= 0 && index < this.navigationItems.length) {
      this.currentPosition = index;
      this.navigateToCurrent();
      this.notifyListeners();
    }
  }

  // Navigate to heading by level
  navigateToHeading(level: number): void {
    const headingIndex = this.navigationItems.findIndex(
      item => item.type === "heading" && item.level === level
    );

    if (headingIndex !== -1) {
      this.navigateToIndex(headingIndex);
    } else {
      this.speak(`No level ${level} heading found`);
    }
  }

  // Navigate to next item
  navigateNext(): void {
    if (this.currentPosition < this.navigationItems.length - 1) {
      this.currentPosition++;
      this.navigateToCurrent();
      this.notifyListeners();
    } else {
      this.speak("End of page");
    }
  }

  // Navigate to previous item
  navigatePrevious(): void {
    if (this.currentPosition > 0) {
      this.currentPosition--;
      this.navigateToCurrent();
      this.notifyListeners();
    } else {
      this.speak("Beginning of page");
    }
  }

  // Navigate to current item
  private navigateToCurrent(): void {
    const context = this.getContext();

    if (context.current) {
      // Add to breadcrumb
      this.breadcrumb.push(context.current);
      if (this.breadcrumb.length > 10) {
        this.breadcrumb.shift();
      }

      // Focus element if exists
      if (context.current.element) {
        context.current.element.focus();
      }

      // Announce
      this.announceCurrent(context.current);
    }
  }

  // Announce current item
  private announceCurrent(item: NavigationStep): void {
    let announcement = "";

    // Add position info
    announcement += `${item.position + 1} of ${this.navigationItems.length}. `;

    // Add type
    if (item.type === "heading") {
      announcement += `Heading ${item.level}. `;
    } else if (item.type === "landmark") {
      announcement += "Landmark. ";
    } else if (item.type === "link") {
      announcement += "Link. ";
    } else if (item.type === "control") {
      announcement += "Control. ";
    }

    // Add label
    announcement += item.label;

    this.speak(announcement);
  }

  // Generate navigation guide
  generateGuide(): NavigationGuide {
    const headings = this.navigationItems.filter(item => item.type === "heading");
    const levels = [...new Set(headings.map(h => h.level))].sort((a, b) => a - b);

    return {
      heading: "Page Navigation Guide",
      level: 0,
      items: this.navigationItems.map(item => {
        const indent = "  ".repeat(item.level);
        return `${indent}${item.label}`;
      }),
      instructions: [
        "Say 'next' or 'previous' to navigate items",
        "Say 'go to heading [level]' to jump to a heading",
        "Say 'read' to read the current item's content",
        "Say 'list headings' to hear all headings",
        "Say 'list links' to hear all links"
      ]
    };
  }

  // List headings
  listHeadings(): void {
    const headings = this.navigationItems.filter(item => item.type === "heading");

    if (headings.length === 0) {
      this.speak("No headings found on this page");
      return;
    }

    const headingList = headings.map(h => `Level ${h.level}: ${h.label}`).join(". ");
    this.speak(`Found ${headings.length} headings. ${headingList}`);
  }

  // List links
  listLinks(): void {
    const links = this.navigationItems.filter(item => item.type === "link");

    if (links.length === 0) {
      this.speak("No links found on this page");
      return;
    }

    const linkList = links.slice(0, 20).map(l => l.label).join(". ");
    const more = links.length > 20 ? `. And ${links.length - 20} more.` : ".";

    this.speak(`Found ${links.length} links. ${linkList}${more}`);
  }

  // List landmarks
  listLandmarks(): void {
    const landmarks = this.navigationItems.filter(
      item => item.type === "landmark" || item.type === "region"
    );

    if (landmarks.length === 0) {
      this.speak("No landmarks found on this page");
      return;
    }

    const landmarkList = landmarks.map(l => l.label).join(". ");
    this.speak(`Found ${landmarks.length} landmarks. ${landmarkList}`);
  }

  // Get item at index
  getItemAtIndex(index: number): NavigationStep | null {
    return this.navigationItems[index] || null;
  }

  // Get total items
  getTotalItems(): number {
    return this.navigationItems.length;
  }

  // Get current position
  getCurrentPosition(): number {
    return this.currentPosition;
  }

  // Get breadcrumb
  getBreadcrumb(): NavigationStep[] {
    return [...this.breadcrumb];
  }

  // Speak text
  private speak(text: string): void {
    if (!this.speechEnabled || typeof window === "undefined") return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.profile?.audio.speechRate || 1;
    speechSynthesis.speak(utterance);
  }

  // Enable/disable speech
  setSpeechEnabled(enabled: boolean): void {
    this.speechEnabled = enabled;
  }

  // Reset navigation
  reset(): void {
    this.currentPosition = 0;
    this.breadcrumb = [];
    this.notifyListeners();
  }

  // Refresh scan
  refresh(): void {
    this.scanPage();
    this.reset();
  }

  // Notify listeners
  private notifyListeners(): void {
    const context = this.getContext();
    for (const listener of this.listeners) {
      listener(context);
    }
  }

  // Subscribe to navigation changes
  subscribe(listener: (context: NavigationContext) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Cleanup
  destroy(): void {
    this.listeners.clear();
    this.navigationItems = [];
    this.breadcrumb = [];
  }
}

// Export singleton
export const navigationAssistant = new NavigationAssistant();

// Accessibility Engine — Screen Reader Integration
// Optimizes content for screen readers

import type { AccessibilityProfile } from "../models/AccessibilityProfile";

export interface ScreenReaderConfig {
  enabled: boolean;
  announceDynamicChanges: boolean;
  announcePageChanges: boolean;
  liveRegions: boolean;
  politeAnnouncements: boolean;
  verbosity: "brief" | "verbose";
}

export interface AccessibleElement {
  element: HTMLElement;
  role: string;
  label: string;
  description?: string;
  value?: string;
  state?: string[];
  properties?: Record<string, string>;
}

export class ScreenReaderIntegration {
  private config: ScreenReaderConfig | null = null;
  private profile: AccessibilityProfile | null = null;
  private liveRegion: HTMLElement | null = null;
  private announcementQueue: string[] = [];
  private isAnnouncing: boolean = false;

  // Initialize
  async initialize(config: {
    profile: AccessibilityProfile | null;
    settings: any;
  }): Promise<void> {
    this.profile = config.profile;

    if (config.profile) {
      this.config = {
        enabled: true,
        announceDynamicChanges: true,
        announcePageChanges: true,
        liveRegions: true,
        politeAnnouncements: true,
        verbosity: "verbose"
      };
    }

    this.createLiveRegion();
  }

  // Check availability
  isAvailable(): boolean {
    return typeof window !== "undefined" && typeof document !== "undefined";
  }

  // Enable screen reader support
  enable(profile: AccessibilityProfile): void {
    this.config = {
      enabled: true,
      announceDynamicChanges: true,
      announcePageChanges: true,
      liveRegions: true,
      politeAnnouncements: true,
      verbosity: "verbose"
    };
    this.createLiveRegion();
  }

  // Disable screen reader support
  disable(): void {
    this.config = null;
    this.removeLiveRegion();
  }

  // Create live region
  private createLiveRegion(): void {
    if (typeof document === "undefined") return;
    if (this.liveRegion) return;

    this.liveRegion = document.createElement("div");
    this.liveRegion.id = "sr-live-region";
    this.liveRegion.setAttribute("role", "status");
    this.liveRegion.setAttribute("aria-live", "polite");
    this.liveRegion.setAttribute("aria-atomic", "true");
    this.liveRegion.style.cssText = `
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
    document.body.appendChild(this.liveRegion);
  }

  // Remove live region
  private removeLiveRegion(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
      this.liveRegion = null;
    }
  }

  // Announce to screen reader
  announce(message: string, priority: "polite" | "assertive" = "polite"): void {
    if (!this.config?.enabled || !this.liveRegion) return;

    // Update aria-live
    this.liveRegion.setAttribute("aria-live", priority);

    // Clear and announce
    this.liveRegion.textContent = "";

    // Small delay to ensure screen reader picks up change
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 100);
  }

  // Announce page change
  announcePageChange(pageTitle: string): void {
    if (!this.config?.announcePageChanges) return;
    this.announce(`Navigated to ${pageTitle}`);
  }

  // Announce dynamic content change
  announceChange(element: HTMLElement, changeType: string): void {
    if (!this.config?.announceDynamicChanges) return;

    const description = this.describeChange(element, changeType);
    this.announce(description);
  }

  // Describe change
  private describeChange(element: HTMLElement, changeType: string): string {
    const label = element.getAttribute("aria-label") || element.textContent || "element";
    const role = element.getAttribute("role") || this.inferRole(element);

    switch (changeType) {
      case "added":
        return `${label} added`;
      case "removed":
        return `${label} removed`;
      case "updated":
        return `${label} updated`;
      case "selected":
        return `${label} selected`;
      case "expanded":
        return `${label} expanded`;
      case "collapsed":
        return `${label} collapsed`;
      case "loading":
        return `Loading ${label}`;
      case "loaded":
        return `${label} loaded`;
      default:
        return `${label} ${changeType}`;
    }
  }

  // Get accessible element info
  getAccessibleElement(element: HTMLElement): AccessibleElement {
    return {
      element,
      role: this.getRole(element),
      label: this.getLabel(element),
      description: element.getAttribute("aria-describedby") || undefined,
      value: this.getValue(element),
      state: this.getState(element),
      properties: this.getProperties(element)
    };
  }

  // Get role
  private getRole(element: HTMLElement): string {
    return element.getAttribute("role") || this.inferRole(element);
  }

  // Infer role from element type
  private inferRole(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();

    const roleMap: Record<string, string> = {
      a: "link",
      button: "button",
      input: element.getAttribute("type") === "checkbox" ? "checkbox" :
             element.getAttribute("type") === "radio" ? "radio" : "textbox",
      select: "listbox",
      textarea: "textbox",
      nav: "navigation",
      main: "main",
      header: "banner",
      footer: "contentinfo",
      article: "article",
      section: "region",
      aside: "complementary",
      form: "form"
    };

    return roleMap[tagName] || "";
  }

  // Get label
  private getLabel(element: HTMLElement): string {
    // Check aria-label first
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    // Check aria-labelledby
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      return labelElement?.textContent || "";
    }

    // Check for associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent || "";
    }

    // Check parent label
    const parent = element.closest("label");
    if (parent) return parent.textContent || "";

    // Fall back to text content
    return element.textContent?.trim() || "";
  }

  // Get value
  private getValue(element: HTMLElement): string | undefined {
    const tagName = element.tagName.toLowerCase();

    if (tagName === "input" || tagName === "textarea") {
      return (element as HTMLInputElement).value;
    }

    if (tagName === "select") {
      const selected = (element as HTMLSelectElement).selectedOptions;
      return Array.from(selected).map(opt => opt.text).join(", ");
    }

    return element.getAttribute("aria-valuenow") || undefined;
  }

  // Get state
  private getState(element: HTMLElement): string[] {
    const states: string[] = [];

    // Check common states
    if (element.hasAttribute("disabled")) states.push("disabled");
    if (element.hasAttribute("readonly")) states.push("read only");
    if (element.hasAttribute("required")) states.push("required");
    if (element.hasAttribute("hidden")) states.push("hidden");
    if (element.hasAttribute("selected")) states.push("selected");
    if (element.hasAttribute("checked")) states.push("checked");
    if (element.hasAttribute("expanded")) states.push(element.getAttribute("expanded") === "true" ? "expanded" : "collapsed");

    // Check aria states
    const ariaStates = [
      "aria-disabled", "aria-readonly", "aria-required", "aria-selected",
      "aria-checked", "aria-expanded", "aria-pressed", "aria-haspopup"
    ];

    for (const attr of ariaStates) {
      const value = element.getAttribute(attr);
      if (value && value !== "false") {
        const stateName = attr.replace("aria-", "").replace(/-/g, " ");
        states.push(stateName);
      }
    }

    return states;
  }

  // Get properties
  private getProperties(element: HTMLElement): Record<string, string> {
    const properties: Record<string, string> = {};

    // Set of properties to capture
    const props = [
      "aria-controls", "aria-owns", "aria-describedby",
      "aria-flowto", "aria-labelledby", "aria-errormessage"
    ];

    for (const prop of props) {
      const value = element.getAttribute(prop);
      if (value) {
        properties[prop] = value;
      }
    }

    // Level for headings
    const level = element.getAttribute("aria-level");
    if (level) {
      properties.level = level;
    }

    return properties;
  }

  // Make element accessible
  makeAccessible(element: HTMLElement, options: {
    role?: string;
    label?: string;
    description?: string;
    live?: boolean;
  }): void {
    if (options.role) {
      element.setAttribute("role", options.role);
    }

    if (options.label) {
      element.setAttribute("aria-label", options.label);
    }

    if (options.description) {
      const id = `desc-${Date.now()}`;
      element.setAttribute("aria-describedby", id);

      // Create description element
      const desc = document.createElement("span");
      desc.id = id;
      desc.style.display = "none";
      desc.textContent = options.description;
      element.appendChild(desc);
    }

    if (options.live) {
      element.setAttribute("aria-live", "polite");
    }
  }

  // Create skip link
  createSkipLink(targetId: string, text: string = "Skip to main content"): HTMLElement {
    const skipLink = document.createElement("a");
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = "skip-link";
    skipLink.style.cssText = `
      position: absolute;
      left: -9999px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
      z-index: 999999;
    `;

    skipLink.addEventListener("focus", () => {
      skipLink.style.cssText = `
        position: absolute;
        left: 10px;
        top: 10px;
        width: auto;
        height: auto;
        padding: 10px 20px;
        background: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        z-index: 999999;
      `;
    });

    skipLink.addEventListener("blur", () => {
      skipLink.style.cssText = `
        position: absolute;
        left: -9999px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
    });

    return skipLink;
  }

  // Scan page for accessibility issues
  scanPage(): { issues: AccessibilityIssue[] } {
    if (typeof document === "undefined") {
      return { issues: [] };
    }

    const issues: AccessibilityIssue[] = [];

    // Check images without alt text
    document.querySelectorAll("img").forEach(img => {
      if (!img.getAttribute("alt")) {
        issues.push({
          type: "missing_alt",
          severity: "critical",
          element: img as HTMLElement,
          message: "Image is missing alt text"
        });
      }
    });

    // Check buttons without accessible names
    document.querySelectorAll("button").forEach(btn => {
      const htmlBtn = btn as HTMLElement;
      const text = htmlBtn.textContent?.trim();
      const ariaLabel = htmlBtn.getAttribute("aria-label");

      if (!text && !ariaLabel && !htmlBtn.getAttribute("aria-labelledby")) {
        issues.push({
          type: "missing_name",
          severity: "critical",
          element: htmlBtn,
          message: "Button has no accessible name"
        });
      }
    });

    // Check links with same text but different destinations
    const linksByText = new Map<string, HTMLAnchorElement[]>();

    document.querySelectorAll("a[href]").forEach(link => {
      const htmlLink = link as HTMLAnchorElement;
      const text = htmlLink.textContent?.trim() || "";

      if (text) {
        if (!linksByText.has(text)) {
          linksByText.set(text, []);
        }
        linksByText.get(text)!.push(htmlLink);
      }
    });

    for (const [text, links] of linksByText) {
      const hrefs = new Set(links.map(l => l.getAttribute("href")));
      if (hrefs.size > 1) {
        links.forEach(link => {
          issues.push({
            type: "ambiguous_link",
            severity: "warning",
            element: link,
            message: `Link "${text}" has multiple destinations`
          });
        });
      }
    }

    return { issues };
  }

  // Get state
  getConfig(): ScreenReaderConfig | null {
    return this.config;
  }

  // Cleanup
  destroy(): void {
    this.removeLiveRegion();
  }
}

export interface AccessibilityIssue {
  type: string;
  severity: "warning" | "critical";
  element: HTMLElement;
  message: string;
}

// Export singleton
export const screenReaderIntegration = new ScreenReaderIntegration();

// Accessibility Engine — Content Transformation Engine
// Transforms content for accessibility

import type { AccessibilityProfile } from "../models/AccessibilityProfile";

export interface TransformOptions {
  profile: AccessibilityProfile | null;
  contentType: string;
  activeFeatures?: string[];
}

export interface TextTransformOptions extends TransformOptions {
  preserveFormatting?: boolean;
  simplify?: boolean;
  readingLevel?: number;
}

export class ContentTransformationEngine {
  // Transform content based on profile and active features
  transform(content: any, options: TransformOptions): any {
    if (!options.profile) return content;

    const { profile, contentType } = options;

    switch (contentType) {
      case "text":
      case "html":
        return this.transformTextContent(content, options);

      case "image":
        return this.transformImageContent(content, options);

      case "video":
        return this.transformVideoContent(content, options);

      case "audio":
        return this.transformAudioContent(content, options);

      case "diagram":
        return this.transformDiagramContent(content, options);

      case "quiz":
        return this.transformQuizContent(content, options);

      default:
        return this.transformGenericContent(content, options);
    }
  }

  // Transform text content
  transformText(text: string, options?: TextTransformOptions): string {
    if (!options?.profile) return text;

    let transformed = text;

    // Simplify if cognitive settings enabled
    if (options.profile.cognitive.enabled && options.profile.cognitive.simplifyContent) {
      transformed = this.simplifyText(transformed, options.profile.cognitive.readingLevel);
    }

    // Use shorter sentences if enabled
    if (options.profile.cognitive.enabled && options.profile.cognitive.shorterSentences) {
      transformed = this.shortenSentences(transformed);
    }

    // Prefer bullet points if enabled
    if (options.profile.cognitive.enabled && options.profile.cognitive.bulletPointsOnly) {
      transformed = this.formatAsBulletPoints(transformed);
    }

    return transformed;
  }

  private transformTextContent(content: any, options: TransformOptions): any {
    if (typeof content === "string") {
      return this.transformText(content, options);
    }

    // For HTML content
    if (typeof content === "object" && content.innerHTML) {
      return this.transformHtml(content.innerHTML, options);
    }

    return content;
  }

  private transformHtml(html: string, options: TransformOptions): string {
    if (!options.profile) return html;

    let transformed = html;

    // Add skip links if enabled
    if (this.isFeatureActive(options, "keyboard_navigation")) {
      transformed = this.addSkipLinks(transformed);
    }

    // Ensure proper heading structure
    transformed = this.ensureHeadingStructure(transformed);

    // Add ARIA labels
    transformed = this.addAriaLabels(transformed);

    // Ensure links have descriptive text
    transformed = this.fixLinkText(transformed);

    // Simplify if needed
    if (options.profile.cognitive.enabled && options.profile.cognitive.simplifyContent) {
      transformed = this.simplifyHtml(transformed, options.profile.cognitive.readingLevel);
    }

    return transformed;
  }

  private transformImageContent(content: any, options: TransformOptions): any {
    // Add enhanced alt text
    if (this.isFeatureActive(options, "screen_reader")) {
      content.altText = this.enhanceAltText(content.altText || "", content);
    }

    // Generate long description if needed
    if (this.isFeatureActive(options, "audio_descriptions")) {
      content.longDescription = this.generateLongDescription(content);
    }

    return content;
  }

  private transformVideoContent(content: any, options: TransformOptions): any {
    // Enable captions
    if (this.isFeatureActive(options, "captions")) {
      content.captionsEnabled = true;
    }

    // Enable audio descriptions
    if (this.isFeatureActive(options, "audio_descriptions")) {
      content.audioDescriptionsEnabled = true;
    }

    // Add sign language
    if (this.isFeatureActive(options, "sign_language")) {
      content.signLanguageEnabled = true;
    }

    return content;
  }

  private transformAudioContent(content: any, options: TransformOptions): any {
    // Generate transcript
    if (this.isFeatureActive(options, "captions")) {
      content.transcriptEnabled = true;
    }

    return content;
  }

  private transformDiagramContent(content: any, options: TransformOptions): any {
    // Generate accessible description
    if (this.isFeatureActive(options, "screen_reader") || this.isFeatureActive(options, "audio_descriptions")) {
      content.accessibleDescription = this.generateDiagramDescription(content);
    }

    return content;
  }

  private transformQuizContent(content: any, options: TransformOptions): any {
    if (!options.profile) return content;

    // Apply extended time
    if (options.profile.cognitive.enabled && options.profile.cognitive.extendedTime) {
      content.timeMultiplier = options.profile.cognitive.timeMultiplier;
    }

    // Simplify if needed
    if (options.profile.cognitive.enabled && options.profile.cognitive.simplifyContent) {
      content.simplified = true;
    }

    return content;
  }

  private transformGenericContent(content: any, options: TransformOptions): any {
    return content;
  }

  // Text simplification
  private simplifyText(text: string, readingLevel: number = 8): string {
    // Basic sentence shortening
    let simplified = text;

    // Split long sentences
    simplified = simplified.replace(/([.!?])\s*([A-Z])/g, "$1\n\n$2");

    // Replace complex words with simpler alternatives
    const complexWords: Record<string, string> = {
      "utilize": "use",
      "commence": "start",
      "terminate": "end",
      "approximately": "about",
      "consequently": "so",
      "nevertheless": "still",
      "furthermore": "also",
      "therefore": "so"
    };

    for (const [complex, simple] of Object.entries(complexWords)) {
      simplified = simplified.replace(new RegExp(complex, "gi"), simple);
    }

    return simplified;
  }

  private shortenSentences(text: string): string {
    // Split sentences longer than threshold
    return text.replace(/([.!?])\s*/g, "$1\n");
  }

  private formatAsBulletPoints(text: string): string {
    // Convert numbered lists to bullet points
    return text.replace(/^\d+\.\s+/gm, "• ");
  }

  private simplifyHtml(html: string, readingLevel: number): string {
    // Parse and simplify HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Process text nodes
    const walker = document.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text)) {
      textNodes.push(node);
    }

    for (const textNode of textNodes) {
      textNode.textContent = this.simplifyText(textNode.textContent || "", readingLevel);
    }

    return doc.body.innerHTML;
  }

  // HTML structure helpers
  private addSkipLinks(html: string): string {
    const skipLinks = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#main-navigation" class="skip-link">Skip to navigation</a>
    `;

    if (html.includes("<body")) {
      return html.replace("<body", `${skipLinks}<body`);
    }
    return skipLinks + html;
  }

  private ensureHeadingStructure(html: string): string {
    // Ensure h1 is present and only one
    const h1Count = (html.match(/<h1/g) || []).length;
    if (h1Count === 0) {
      // Try to find a title and wrap in h1
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        html = html.replace(/<body/, `<h1 class="sr-only">${titleMatch[1]}</h1><body`);
      }
    }

    return html;
  }

  private addAriaLabels(html: string): string {
    // Add role attributes where missing
    html = html.replace(/<nav(?![^>]*role)/g, '<nav role="navigation"');
    html = html.replace(/<main(?![^>]*role)/g, '<main role="main"');
    html = html.replace(/<aside(?![^>]*role)/g, '<aside role="complementary"');
    html = html.replace(/<header(?![^>]*role)/g, '<header role="banner"');
    html = html.replace(/<footer(?![^>]*role)/g, '<footer role="contentinfo"');

    return html;
  }

  private fixLinkText(html: string): string {
    // Fix links with generic text like "click here" or "read more"
    const genericTexts = ["click here", "read more", "learn more", "here", "link"];
    for (const text of genericTexts) {
      const regex = new RegExp(`<a([^>]*)>${text}</a>`, "gi");
      html = html.replace(regex, (match, attrs) => {
        // Try to get context from surrounding text or title
        return match; // In production, would extract more context
      });
    }
    return html;
  }

  // Alt text enhancement
  private enhanceAltText(altText: string, image: any): string {
    if (!altText || altText.length < 5) {
      // Generate descriptive alt text from image data
      return `Image${image.title ? `: ${image.title}` : ""}${image.description ? `: ${image.description}` : ""}`;
    }
    return altText;
  }

  private generateLongDescription(image: any): string {
    // Generate detailed description for screen readers
    let desc = "";

    if (image.title) {
      desc += `Title: ${image.title}. `;
    }

    if (image.description) {
      desc += `Description: ${image.description}. `;
    }

    if (image.text) {
      desc += `Text content: ${image.text}. `;
    }

    if (image.colors) {
      desc += `Main colors: ${image.colors.join(", ")}. `;
    }

    return desc.trim();
  }

  private generateDiagramDescription(diagram: any): string {
    let desc = "";

    if (diagram.title) {
      desc += `Diagram: ${diagram.title}. `;
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

    return desc.trim();
  }

  // Transform for screen reader
  transformForScreenReader(element: HTMLElement, profile: AccessibilityProfile | null): string {
    if (!element) return "";

    let description = "";

    // Get accessible name
    const accessibleName = this.getAccessibleName(element);
    if (accessibleName) {
      description += accessibleName + ". ";
    }

    // Get role
    const role = element.getAttribute("role") || this.inferRole(element);
    if (role) {
      description += `Is a ${role}. `;
    }

    // Get state/values
    const stateInfo = this.getStateInfo(element);
    if (stateInfo) {
      description += stateInfo + ". ";
    }

    // Get relationships
    const relationships = this.getRelationships(element);
    if (relationships) {
      description += relationships + ". ";
    }

    return description.trim();
  }

  private getAccessibleName(element: HTMLElement): string {
    // Check aria-label first
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    // Check aria-labelledby
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      return labelElement?.textContent || "";
    }

    // Fall back to visible text
    return element.textContent?.trim() || "";
  }

  private inferRole(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const roleMap: Record<string, string> = {
      a: "link",
      button: "button",
      input: "input",
      select: "dropdown",
      textarea: "text area",
      nav: "navigation",
      main: "main content",
      header: "header",
      footer: "footer",
      article: "article",
      section: "section",
      aside: "aside",
      form: "form"
    };

    return roleMap[tagName] || "";
  }

  private getStateInfo(element: HTMLElement): string {
    const states: string[] = [];

    if (element.hasAttribute("disabled")) states.push("disabled");
    if (element.hasAttribute("readonly")) states.push("read only");
    if (element.hasAttribute("required")) states.push("required");
    if (element.getAttribute("aria-expanded") === "true") states.push("expanded");
    if (element.getAttribute("aria-checked") === "true") states.push("checked");
    if (element.getAttribute("aria-selected") === "true") states.push("selected");

    return states.join(", ");
  }

  private getRelationships(element: HTMLElement): string {
    const relationships: string[] = [];

    // Check if it controls other elements
    const controls = element.getAttribute("aria-controls");
    if (controls) {
      relationships.push(`controls ${controls.split(" ").length} elements`);
    }

    // Check if it owns children
    const owns = element.getAttribute("aria-owns");
    if (owns) {
      relationships.push(`owns ${owns.split(" ").length} elements`);
    }

    // Check flowto
    const flowto = element.getAttribute("aria-flowto");
    if (flowto) {
      relationships.push(`flows to ${flowto}`);
    }

    return relationships.join(". ");
  }

  // Feature check helper
  private isFeatureActive(options: TransformOptions, feature: string): boolean {
    if (!options.activeFeatures) return false;
    return options.activeFeatures.includes(feature);
  }
}

// Export singleton
export const contentTransformationEngine = new ContentTransformationEngine();

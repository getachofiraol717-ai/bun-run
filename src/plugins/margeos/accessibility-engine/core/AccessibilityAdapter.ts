// @ts-nocheck
// Accessibility Engine — Accessibility Adapter
// Adapts content from other MargeOS engines for accessibility

import type { AccessibilityProfile } from "../models/AccessibilityProfile";
import type { AccessibilityFeature } from "../models/AccessibilityProfile";

export interface AdaptedContent {
  original: any;
  accessible: any;
  features: AccessibilityFeature[];
  warnings: string[];
}

export interface AdapterConfig {
  enableAutoAdaptation: boolean;
  preserveOriginal: boolean;
  warnOnDegradation: boolean;
}

export class AccessibilityAdapter {
  private config: AdapterConfig;
  private adapters: Map<string, ContentAdapter> = new Map();

  constructor(config?: Partial<AdapterConfig>) {
    this.config = {
      enableAutoAdaptation: true,
      preserveOriginal: true,
      warnOnDegradation: true,
      ...config
    };

    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters(): void {
    // Register AI Tutor adapter
    this.adapters.set("ai_tutor", new AITutorAdapter());

    // Register Formula Engine adapter
    this.adapters.set("formula", new FormulaAdapter());

    // Register Smart PDF adapter
    this.adapters.set("pdf", new PDFAdapter());

    // Register Visual Learning adapter
    this.adapters.set("visual", new VisualLearningAdapter());

    // Register Quiz adapter
    this.adapters.set("quiz", new QuizAdapter());

    // Register Flashcard adapter
    this.adapters.set("flashcard", new FlashcardAdapter());
  }

  /**
   * Adapt content from a specific engine
   */
  adapt(
    engine: string,
    content: any,
    profile: AccessibilityProfile,
    activeFeatures: AccessibilityFeature[]
  ): AdaptedContent {
    const adapter = this.adapters.get(engine);
    if (!adapter) {
      return {
        original: content,
        accessible: content,
        features: [],
        warnings: [`No adapter found for engine: ${engine}`]
      };
    }

    return adapter.adapt(content, profile, activeFeatures);
  }

  /**
   * Register a custom adapter
   */
  registerAdapter(engine: string, adapter: ContentAdapter): void {
    this.adapters.set(engine, adapter);
  }

  /**
   * Get supported engines
   */
  getSupportedEngines(): string[] {
    return Array.from(this.adapters.keys());
  }
}

export interface ContentAdapter {
  adapt(content: any, profile: AccessibilityProfile, activeFeatures: AccessibilityFeature[]): AdaptedContent;
}

// AI Tutor Adapter
class AITutorAdapter implements ContentAdapter {
  adapt(content: any, profile: AccessibilityProfile, activeFeatures: AccessibilityFeature[]): AdaptedContent {
    const warnings: string[] = [];
    let adapted = { ...content };

    // Add captions for speech
    if (activeFeatures.includes("captions") && content.explanation) {
      adapted.captionedExplanation = this.addCaptions(content.explanation);
      adapted.features = [...(adapted.features || []), "captions"];
    }

    // Add audio descriptions for visual explanations
    if (activeFeatures.includes("audio_descriptions") && content.visualElements) {
      adapted.audioDescription = this.generateAudioDescription(content);
      adapted.features = [...(adapted.features || []), "audio_descriptions"];
    }

    // Simplify for cognitive profiles
    if (profile.cognitive.enabled && profile.cognitive.simplifyContent) {
      adapted = this.simplifyExplanation(adapted, profile.cognitive.readingLevel);
      adapted.features = [...(adapted.features || []), "simplified_content"];
    }

    // Add sign language support
    if (activeFeatures.includes("sign_language") && content.explanation) {
      adapted.signLanguageReady = true;
      adapted.signLanguageSegments = this.segmentForSignLanguage(content.explanation);
      adapted.features = [...(adapted.features || []), "sign_language"];
    }

    return {
      original: content,
      accessible: adapted,
      features: adapted.features || [],
      warnings
    };
  }

  private addCaptions(text: string): string {
    // Format text for captioning
    return text.split(/(?<=[.!?])\s+/).map(sentence => ({
      text: sentence.trim(),
      start: 0,
      end: sentence.length * 50 // Estimate timing
    }));
  }

  private generateAudioDescription(content: any): string {
    let description = "";

    if (content.visualElements) {
      description += "The explanation includes visual elements. ";
      for (const element of content.visualElements) {
        description += `${element.type}: ${element.description}. `;
      }
    }

    return description;
  }

  private simplifyExplanation(content: any, level: number): any {
    return {
      ...content,
      explanation: this.simplifyText(content.explanation, level),
      useBulletPoints: true,
      maxSentenceLength: level < 6 ? 15 : 25
    };
  }

  private simplifyText(text: string, level: number): string {
    // Basic simplification
    return text
      .replace(/however/gi, "but")
      .replace(/therefore/gi, "so")
      .replace(/nevertheless/gi, "but");
  }

  private segmentForSignLanguage(text: string): string[] {
    // Split into segments suitable for sign language
    return text.split(/(?<=[.!?])\s+/).map(s => s.trim());
  }
}

// Formula Adapter
class FormulaAdapter implements ContentAdapter {
  adapt(content: any, profile: AccessibilityProfile, activeFeatures: AccessibilityFeature[]): AdaptedContent {
    const warnings: string[] = [];
    let adapted = { ...content };

    // Generate text description of formula
    if (activeFeatures.includes("audio_descriptions") || activeFeatures.includes("screen_reader")) {
      adapted.textDescription = this.generateFormulaDescription(content);
      adapted.features = [...(adapted.features || []), "text_description"];
    }

    // Generate Braille-compatible formula
    if (activeFeatures.includes("braille")) {
      adapted.brailleFormula = this.generateBrailleFormula(content);
      adapted.features = [...(adapted.features || []), "braille"];
      warnings.push("Formula may require specialized Braille notation");
    }

    // Simplify for cognitive profiles
    if (profile.cognitive.enabled) {
      adapted.simplifiedSteps = this.generateSimplifiedSteps(content);
      adapted.features = [...(adapted.features || []), "simplified_content"];
    }

    return {
      original: content,
      accessible: adapted,
      features: adapted.features || [],
      warnings
    };
  }

  private generateFormulaDescription(formula: any): string {
    if (!formula.latex && !formula.raw) return "";

    let description = `Formula: ${formula.name || "unnamed"}. `;

    if (formula.description) {
      description += `${formula.description}. `;
    }

    if (formula.variables) {
      description += "Variables: ";
      for (const v of formula.variables) {
        description += `${v.symbol} equals ${v.description}. `;
      }
    }

    return description;
  }

  private generateBrailleFormula(formula: any): string {
    // Convert to Nemeth Braille code (simplified)
    let braille = "";

    if (formula.raw) {
      // Basic symbol mapping
      const symbolMap: Record<string, string> = {
        "+": "+",
        "-": "-",
        "=": "=",
        "*": "×",
        "/": "÷",
        "(": "(",
        ")": ")",
        "x": "x",
        "y": "y"
      };

      for (const char of formula.raw) {
        braille += symbolMap[char] || char;
      }
    }

    return braille;
  }

  private generateSimplifiedSteps(formula: any): string[] {
    const steps: string[] = [];

    if (formula.steps) {
      for (let i = 0; i < formula.steps.length; i++) {
        steps.push(`Step ${i + 1}: ${formula.steps[i]}`);
      }
    }

    return steps;
  }
}

// PDF Adapter
class PDFAdapter implements ContentAdapter {
  adapt(content: any, profile: AccessibilityProfile, activeFeatures: AccessibilityFeature[]): AdaptedContent {
    const warnings: string[] = [];
    let adapted = { ...content };

    // Ensure proper reading order
    if (activeFeatures.includes("screen_reader")) {
      adapted.readingOrder = this.ensureReadingOrder(content);
      adapted.features = [...(adapted.features || []), "reading_order"];
    }

    // Add image descriptions
    if (activeFeatures.includes("audio_descriptions") && content.images) {
      adapted.imageDescriptions = this.generateImageDescriptions(content.images);
      adapted.features = [...(adapted.features || []), "image_descriptions"];
    }

    // Ensure heading structure
    if (activeFeatures.includes("keyboard_navigation")) {
      adapted.headingStructure = this.ensureHeadingStructure(content);
      adapted.features = [...(adapted.features || []), "heading_structure"];
    }

    return {
      original: content,
      accessible: adapted,
      features: adapted.features || [],
      warnings
    };
  }

  private ensureReadingOrder(content: any): string[] {
    // Return logical reading order of content
    const order: string[] = [];

    if (content.title) order.push("title");
    if (content.abstract) order.push("abstract");
    if (content.sections) {
      for (const section of content.sections) {
        order.push(`section:${section.id}`);
      }
    }

    return order;
  }

  private generateImageDescriptions(images: any[]): string[] {
    return images.map((img, i) =>
      img.alt || img.description || `Image ${i + 1}`
    );
  }

  private ensureHeadingStructure(content: any): any[] {
    const headings: any[] = [];

    if (content.title) {
      headings.push({ level: 1, text: content.title });
    }

    if (content.sections) {
      for (const section of content.sections) {
        headings.push({ level: 2, text: section.title });
      }
    }

    return headings;
  }
}

// Visual Learning Adapter
class VisualLearningAdapter implements ContentAdapter {
  adapt(content: any, profile: AccessibilityProfile, activeFeatures: AccessibilityFeature[]): AdaptedContent {
    const warnings: string[] = [];
    let adapted = { ...content };

    // Generate text alternatives
    if (activeFeatures.includes("audio_descriptions") || activeFeatures.includes("screen_reader")) {
      adapted.textAlternative = this.generateTextAlternative(content);
      adapted.features = [...(adapted.features || []), "text_alternative"];
    }

    // Generate Braille-compatible version
    if (activeFeatures.includes("braille")) {
      adapted.brailleVersion = this.generateBrailleVersion(content);
      adapted.features = [...(adapted.features || []), "braille"];
    }

    // Ensure keyboard navigation
    if (activeFeatures.includes("keyboard_navigation")) {
      adapted.keyboardNavigation = this.addKeyboardNavigation(content);
      adapted.features = [...(adapted.features || []), "keyboard_navigation"];
    }

    return {
      original: content,
      accessible: adapted,
      features: adapted.features || [],
      warnings
    };
  }

  private generateTextAlternative(content: any): string {
    let description = "";

    if (content.title) {
      description += `Diagram: ${content.title}. `;
    }

    if (content.type) {
      description += `Type: ${content.type}. `;
    }

    if (content.nodes) {
      description += `Contains ${content.nodes.length} elements. `;
      for (const node of content.nodes.slice(0, 5)) {
        description += `${node.label || node.text}. `;
      }
    }

    if (content.relationships) {
      description += `Relationships: `;
      for (const rel of content.relationships.slice(0, 3)) {
        description += `${rel.from} ${rel.type} ${rel.to}. `;
      }
    }

    return description;
  }

  private generateBrailleVersion(content: any): string {
    // Simplified Braille representation
    return JSON.stringify(content, null, 0)
      .replace(/[{}"\[\]]/g, "")
      .slice(0, 1000);
  }

  private addKeyboardNavigation(content: any): any {
    return {
      ...content,
      focusable: true,
      tabIndex: 0,
      ariaLabel: content.title || "Diagram"
    };
  }
}

// Quiz Adapter
class QuizAdapter implements ContentAdapter {
  adapt(content: any, profile: AccessibilityProfile, activeFeatures: AccessibilityFeature[]): AdaptedContent {
    const warnings: string[] = [];
    let adapted = { ...content };

    // Apply extended time
    if (profile.cognitive.enabled && profile.cognitive.extendedTime) {
      adapted.timeMultiplier = profile.cognitive.timeMultiplier;
      adapted.features = [...(adapted.features || []), "extended_time"];
    }

    // Simplify for cognitive profiles
    if (profile.cognitive.enabled && profile.cognitive.simplifyContent) {
      adapted = this.simplifyQuestions(adapted, profile.cognitive);
      adapted.features = [...(adapted.features || []), "simplified_content"];
    }

    // Ensure keyboard navigation
    if (activeFeatures.includes("keyboard_navigation")) {
      adapted.keyboardNavigable = true;
      adapted.features = [...(adapted.features || []), "keyboard_navigation"];
    }

    // Add screen reader support
    if (activeFeatures.includes("screen_reader")) {
      adapted.screenReaderLabels = this.addScreenReaderLabels(adapted);
      adapted.features = [...(adapted.features || []), "screen_reader"];
    }

    return {
      original: content,
      accessible: adapted,
      features: adapted.features || [],
      warnings
    };
  }

  private simplifyQuestions(content: any, cognitive: any): any {
    return {
      ...content,
      useBulletPoints: cognitive.bulletPointsOnly,
      maxSentenceLength: cognitive.maxReadingLevel < 6 ? 15 : 20,
      clearInstructions: true
    };
  }

  private addScreenReaderLabels(content: any): Record<string, string> {
    const labels: Record<string, string> = {};

    if (content.questions) {
      for (let i = 0; i < content.questions.length; i++) {
        labels[`question-${i}`] = `Question ${i + 1}: ${content.questions[i].text}`;
      }
    }

    return labels;
  }
}

// Flashcard Adapter
class FlashcardAdapter implements ContentAdapter {
  adapt(content: any, profile: AccessibilityProfile, activeFeatures: AccessibilityFeature[]): AdaptedContent {
    const warnings: string[] = [];
    let adapted = { ...content };

    // Add text-to-speech support
    if (profile.audio.speechSynthesisEnabled) {
      adapted.ttsReady = true;
      adapted.features = [...(adapted.features || []), "text_to_speech"];
    }

    // Simplify for cognitive profiles
    if (profile.cognitive.enabled && profile.cognitive.simplifyContent) {
      adapted.simplified = true;
      adapted.features = [...(adapted.features || []), "simplified_content"];
    }

    return {
      original: content,
      accessible: adapted,
      features: adapted.features || [],
      warnings
    };
  }
}

// Export singleton
export const accessibilityAdapter = new AccessibilityAdapter();

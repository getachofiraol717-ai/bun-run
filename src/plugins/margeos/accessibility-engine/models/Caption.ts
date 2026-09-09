// @ts-nocheck
// Accessibility Engine — Caption Models
// Caption types and configurations

export type CaptionType = "subtitle" | "closed" | "open" | "sdh" | "live";
export type CaptionState = "pending" | "generating" | "ready" | "error" | "disabled";

export interface Caption {
  id: string;

  // Content
  segments: CaptionSegment[];
  fullText: string;

  // Metadata
  language: string;
  type: CaptionType;
  source: CaptionSource;

  // Timing
  startTime: number; // ms
  endTime: number; // ms
  duration: number; // ms

  // Generation
  state: CaptionState;
  generatedAt?: Date;
  accuracy?: number;
  isAIGenerated: boolean;

  // Sync
  syncedWithContent: string; // Content ID
  syncOffset: number; // ms offset for sync adjustment

  // Styling
  style: CaptionStyle;

  // Accessibility
  speakerLabels: boolean;
  soundDescriptions: boolean;

  // Version
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaptionSegment {
  id: string;

  // Text content
  text: string;
  originalText?: string; // For translations

  // Timing
  startTime: number; // ms
  endTime: number; // ms
  duration: number; // ms

  // Speaker
  speaker?: string;
  speakerId?: string;
  isSystemMessage?: boolean;

  // Position
  position: CaptionPosition;

  // Styling
  style?: Partial<CaptionSegmentStyle>;

  // Audio description markers
  hasAudioDescription?: boolean;
  audioDescriptionText?: string;

  // Emotional indicators
  emotion?: string;
  emphasis?: boolean;
}

export interface CaptionPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CaptionSegmentStyle {
  color: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline";
  opacity: number;
}

export interface CaptionStyle {
  // Background
  backgroundColor: string;
  backgroundOpacity: number;
  borderRadius: number;
  padding: number;

  // Text
  textColor: string;
  textSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  lineHeight: number;

  // Effects
  textShadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };

  // Layout
  maxWidth: number;
  maxLines: number;
  alignment: "left" | "center" | "right";

  // Position
  position: "bottom" | "top" | "overlay";
  margin: number;
}

export type CaptionSource =
  | "manual"
  | "auto_generated"
  | "ai_generated"
  | "imported"
  | "speech_recognition";

export interface CaptionTrack {
  id: string;

  // Content reference
  contentId: string;
  contentType: "video" | "audio" | "live" | "text_to_speech";

  // Tracks
  tracks: CaptionTrackVariant[];

  // Active track
  activeTrackId: string | null;

  // Settings
  defaultLanguage: string;
  availableLanguages: string[];

  // Sync
  syncPoints: SyncPoint[];

  // Version
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaptionTrackVariant {
  id: string;

  // Caption data
  captions: Caption[];

  // Metadata
  language: string;
  label: string;
  isDefault: boolean;
  isForced: boolean;

  // Quality
  accuracy?: number;
  coverage?: number; // % of content covered
}

export interface SyncPoint {
  time: number; // ms
  type: "word" | "sentence" | "event" | "speaker_change";
  reference: string;
  segmentId?: string;
}

// Caption generation request
export interface CaptionGenerationRequest {
  contentId: string;
  contentType: "video" | "audio" | "text";
  sourceUrl?: string;
  sourceText?: string;

  // Generation options
  language: string;
  type: CaptionType;
  useAI: boolean;

  // Style options
  style?: Partial<CaptionStyle>;

  // Processing options
  includeSpeakerLabels: boolean;
  includeSoundDescriptions: boolean;
  includeEmotionIndicators: boolean;

  // Quality settings
  minConfidence?: number;
  maxSegments?: number;
}

// Caption rendering options
export interface CaptionRenderOptions {
  // Display
  visible: boolean;
  style: CaptionStyle;

  // Position
  position: "bottom" | "top" | "overlay";
  customPosition?: { x: number; y: number };

  // Behavior
  autoHide: boolean;
  autoHideDelay: number; // ms
  fadeAnimation: boolean;

  // Scrolling
  enableScrolling: boolean;
  scrollSpeed: number;

  // Focus
  focusOnCurrent: boolean;
  highlightCurrent: boolean;
}

// Live caption settings
export interface LiveCaptionSettings extends CaptionRenderOptions {
  // Live-specific
  bufferSize: number; // Number of segments to keep
  showHistory: boolean;
  historyCount: number;
  autoScroll: boolean;

  // Punctuation
  autoPunctuation: boolean;
  pauseThreshold: number; // ms of silence to end sentence

  // Language detection
  autoDetectLanguage: boolean;
  languageSwitchDelay: number; // ms

  // Speaker
  speakerChangeDetection: boolean;
  showSpeakerLabels: boolean;
}

// Caption template
export interface CaptionTemplate {
  id: string;
  name: string;
  description?: string;

  // Style
  style: CaptionStyle;

  // Preset type
  preset: "default" | "high_contrast" | "large_text" | "immersive" | "custom";

  // Color scheme
  colorScheme: CaptionColorScheme;

  // Font
  font: CaptionFont;

  // Effects
  effects: CaptionEffects;

  // Is default
  isDefault: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface CaptionColorScheme {
  name: string;
  background: string;
  backgroundOpacity: number;
  text: string;
  accent?: string;
}

export interface CaptionFont {
  family: string;
  weight: "normal" | "bold";
  size: number;
  lineHeight: number;
}

export interface CaptionEffects {
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  border: boolean;
  borderColor: string;
  borderWidth: number;
  glow: boolean;
  glowColor: string;
  glowBlur: number;
}

// Predefined templates
export const CAPTION_TEMPLATES: CaptionTemplate[] = [
  {
    id: "default",
    name: "Default",
    description: "Standard caption style for most users",
    style: {
      backgroundColor: "#000000",
      backgroundOpacity: 0.8,
      borderRadius: 4,
      padding: 8,
      textColor: "#FFFFFF",
      textSize: 16,
      fontFamily: "system-ui, sans-serif",
      fontWeight: "normal",
      lineHeight: 1.4,
      maxWidth: 600,
      maxLines: 2,
      alignment: "center",
      position: "bottom",
      margin: 20
    },
    preset: "default",
    colorScheme: {
      name: "white_on_black",
      background: "#000000",
      backgroundOpacity: 0.8,
      text: "#FFFFFF"
    },
    font: {
      family: "system-ui, sans-serif",
      weight: "normal",
      size: 16,
      lineHeight: 1.4
    },
    effects: {
      shadow: false,
      shadowColor: "rgba(0,0,0,0.5)",
      shadowBlur: 4,
      border: false,
      borderColor: "#FFFFFF",
      borderWidth: 1,
      glow: false,
      glowColor: "#FFFFFF",
      glowBlur: 0
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "high_contrast",
    name: "High Contrast",
    description: "Maximum contrast for visibility",
    style: {
      backgroundColor: "#000000",
      backgroundOpacity: 0.95,
      borderRadius: 0,
      padding: 12,
      textColor: "#FFFF00",
      textSize: 20,
      fontFamily: "Arial, sans-serif",
      fontWeight: "bold",
      lineHeight: 1.5,
      maxWidth: 800,
      maxLines: 3,
      alignment: "center",
      position: "bottom",
      margin: 20
    },
    preset: "high_contrast",
    colorScheme: {
      name: "yellow_on_black",
      background: "#000000",
      backgroundOpacity: 0.95,
      text: "#FFFF00"
    },
    font: {
      family: "Arial, sans-serif",
      weight: "bold",
      size: 20,
      lineHeight: 1.5
    },
    effects: {
      shadow: true,
      shadowColor: "#000000",
      shadowBlur: 2,
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      border: true,
      borderColor: "#FFFF00",
      borderWidth: 2,
      glow: false,
      glowColor: "#FFFF00",
      glowBlur: 0
    },
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "large_text",
    name: "Large Text",
    description: "Easier to read at distance",
    style: {
      backgroundColor: "#000000",
      backgroundOpacity: 0.9,
      borderRadius: 6,
      padding: 16,
      textColor: "#FFFFFF",
      textSize: 24,
      fontFamily: "Verdana, sans-serif",
      fontWeight: "bold",
      lineHeight: 1.6,
      maxWidth: 1000,
      maxLines: 2,
      alignment: "center",
      position: "bottom",
      margin: 30
    },
    preset: "large_text",
    colorScheme: {
      name: "white_on_black",
      background: "#000000",
      backgroundOpacity: 0.9,
      text: "#FFFFFF"
    },
    font: {
      family: "Verdana, sans-serif",
      weight: "bold",
      size: 24,
      lineHeight: 1.6
    },
    effects: {
      shadow: true,
      shadowColor: "rgba(0,0,0,0.8)",
      shadowBlur: 4,
      border: false,
      borderColor: "#FFFFFF",
      borderWidth: 1,
      glow: false,
      glowColor: "#FFFFFF",
      glowBlur: 0
    },
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "immersive",
    name: "Immersive",
    description: "Minimal distraction, floating captions",
    style: {
      backgroundColor: "transparent",
      backgroundOpacity: 0,
      borderRadius: 8,
      padding: 0,
      textColor: "#FFFFFF",
      textSize: 18,
      fontFamily: "system-ui, sans-serif",
      fontWeight: "normal",
      lineHeight: 1.4,
      maxWidth: 700,
      maxLines: 2,
      alignment: "center",
      position: "bottom",
      margin: 40
    },
    preset: "immersive",
    colorScheme: {
      name: "white_shadow",
      background: "transparent",
      backgroundOpacity: 0,
      text: "#FFFFFF",
      accent: "rgba(0,0,0,0.8)"
    },
    font: {
      family: "system-ui, sans-serif",
      weight: "normal",
      size: 18,
      lineHeight: 1.4
    },
    effects: {
      shadow: true,
      shadowColor: "rgba(0,0,0,0.8)",
      shadowBlur: 8,
      border: false,
      borderColor: "#FFFFFF",
      borderWidth: 0,
      glow: false,
      glowColor: "#FFFFFF",
      glowBlur: 0
    },
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
export function createEmptyCaption(
  contentId: string,
  language: string,
  type: CaptionType
): Caption {
  return {
    id: `caption-${Date.now()}`,
    segments: [],
    fullText: "",
    language,
    type,
    source: "manual",
    startTime: 0,
    endTime: 0,
    duration: 0,
    state: "pending",
    isAIGenerated: false,
    syncedWithContent: contentId,
    syncOffset: 0,
    style: CAPTION_TEMPLATES[0].style,
    speakerLabels: false,
    soundDescriptions: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export function segmentToText(segment: CaptionSegment): string {
  let text = segment.text;

  if (segment.emotion) {
    text = `[${segment.emotion}] ${text}`;
  }

  if (segment.speaker && segment.isSystemMessage) {
    text = `${segment.speaker}: ${text}`;
  }

  return text;
}

export function mergeCaptionSegments(segments: CaptionSegment[]): string {
  return segments.map(segmentToText).join("\n");
}

export function splitTextToSegments(
  text: string,
  startTime: number,
  duration: number,
  maxDuration: number = 5000
): CaptionSegment[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const segmentDuration = Math.min(duration / sentences.length, maxDuration);

  return sentences.map((sentence, index) => {
    const segmentStart = startTime + (index * duration / sentences.length);
    return {
      id: `segment-${Date.now()}-${index}`,
      text: sentence.trim(),
      startTime: Math.round(segmentStart),
      endTime: Math.round(segmentStart + segmentDuration),
      duration: Math.round(segmentDuration),
      position: { x: 0, y: 0, width: 0, height: 0 }
    };
  });
}

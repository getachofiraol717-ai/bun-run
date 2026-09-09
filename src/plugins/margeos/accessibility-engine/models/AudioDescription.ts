// Accessibility Engine — AudioDescription Models
// Audio description types and configurations

export type AudioDescriptionType =
  | "primary"
  | "secondary"
  | "extended"
  | "standard"
  | "simple";

export type AudioDescriptionState =
  | "pending"
  | "generating"
  | "ready"
  | "error"
  | "disabled";

export interface AudioDescription {
  id: string;

  // Content reference
  contentId: string;
  contentType: "image" | "video" | "diagram" | "chart" | "visualization" | "animation";

  // Description
  descriptions: AudioDescriptionSegment[];
  fullDescription: string;

  // Audio
  audioUrl?: string;
  audioDuration?: number; // ms

  // Metadata
  language: string;
  type: AudioDescriptionType;
  source: AudioDescriptionSource;

  // Quality
  state: AudioDescriptionState;
  generatedAt?: Date;
  accuracy?: number;
  isAIGenerated: boolean;

  // Version
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudioDescriptionSegment {
  id: string;

  // Timing
  startTime: number; // ms
  endTime: number; // ms
  duration: number; // ms

  // Content
  text: string;
  audioUrl?: string;

  // Type
  descriptionType: DescriptionType;

  // Context
  focus?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };

  // Voice settings
  voice?: {
    rate?: number;
    pitch?: number;
    volume?: number;
  };
}

export type DescriptionType =
  | "visual"
  | "action"
  | "character"
  | "setting"
  | "emotion"
  | "text"
  | "transition"
  | "important"
  | "context";

export type AudioDescriptionSource =
  | "manual"
  | "auto_generated"
  | "ai_generated"
  | "community";

export interface AudioDescriptionTrack {
  id: string;

  // Content reference
  contentId: string;
  contentDuration: number; // ms

  // Descriptions
  descriptions: AudioDescription[];

  // Active description
  activeDescriptionId: string | null;

  // Settings
  language: string;
  type: AudioDescriptionType;

  // Mixing
  mixSettings: AudioMixSettings;

  // Version
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudioMixSettings {
  // Volume
  mainVolume: number; // 0-1
  descriptionVolume: number; // 0-1

  // Panning
  mainPan: number; // -1 to 1
  descriptionPan: number; // -1 to 1

  // Timing
  preGap: number; // ms before description starts
  postGap: number; // ms after description ends
  minimumGap: number; // ms minimum gap between descriptions

  // Priority
  priority: "description" | "original" | "equal";

  // Ducking
  duckOriginal: boolean;
  duckAmount: number; // 0-1
  duckThreshold: number; // 0-1
}

// Audio description generation request
export interface AudioDescriptionGenerationRequest {
  contentId: string;
  contentType: AudioDescription["contentType"];
  sourceUrl?: string;

  // Generation options
  language: string;
  type: AudioDescriptionType;
  useAI: boolean;

  // Detail level
  detailLevel: "simple" | "standard" | "extended";

  // Voice options
  voice?: {
    name?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
  };

  // Timing
  maxDescriptionDuration?: number; // ms
  pauseForDescriptions: boolean;
}

// Visual element description template
export interface VisualDescriptionTemplate {
  id: string;
  name: string;
  contentType: AudioDescription["contentType"];

  // Description structure
  sections: DescriptionSection[];

  // Language settings
  language: string;

  // Style
  formality: "casual" | "neutral" | "formal";
  includePerspective: boolean;
  useRelativePositions: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface DescriptionSection {
  name: string;
  order: number;
  required: boolean;
  prompts?: string[]; // AI prompts for this section

  // Content rules
  minLength?: number;
  maxLength?: number;
  includeExamples?: boolean;
}

// Predefined templates
export const VISUAL_DESCRIPTION_TEMPLATES: VisualDescriptionTemplate[] = [
  {
    id: "image-standard",
    name: "Standard Image Description",
    contentType: "image",
    sections: [
      { name: "type", order: 1, required: true },
      { name: "mainSubject", order: 2, required: true },
      { name: "setting", order: 3, required: false },
      { name: "actions", order: 4, required: false },
      { name: "emotions", order: 5, required: false },
      { name: "text", order: 6, required: false },
      { name: "purpose", order: 7, required: false }
    ],
    language: "en",
    formality: "neutral",
    includePerspective: false,
    useRelativePositions: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "video-standard",
    name: "Standard Video Description",
    contentType: "video",
    sections: [
      { name: "scene", order: 1, required: true },
      { name: "actions", order: 2, required: true },
      { name: "characters", order: 3, required: false },
      { name: "setting", order: 4, required: false },
      { name: "dialogue", order: 5, required: false },
      { name: "emotions", order: 6, required: false },
      { name: "transitions", order: 7, required: false },
      { name: "important", order: 8, required: true }
    ],
    language: "en",
    formality: "neutral",
    includePerspective: true,
    useRelativePositions: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "diagram-standard",
    name: "Standard Diagram Description",
    contentType: "diagram",
    sections: [
      { name: "type", order: 1, required: true },
      { name: "title", order: 2, required: true },
      { name: "elements", order: 3, required: true },
      { name: "relationships", order: 4, required: false },
      { name: "values", order: 5, required: false },
      { name: "purpose", order: 6, required: false }
    ],
    language: "en",
    formality: "formal",
    includePerspective: false,
    useRelativePositions: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "chart-standard",
    name: "Standard Chart Description",
    contentType: "chart",
    sections: [
      { name: "type", order: 1, required: true },
      { name: "title", order: 2, required: true },
      { name: "axes", order: 3, required: true },
      { name: "data", order: 4, required: true },
      { name: "trends", order: 5, required: false },
      { name: "keyPoints", order: 6, required: false }
    ],
    language: "en",
    formality: "formal",
    includePerspective: false,
    useRelativePositions: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
export function createEmptyAudioDescription(
  contentId: string,
  contentType: AudioDescription["contentType"],
  language: string,
  type: AudioDescriptionType = "standard"
): AudioDescription {
  return {
    id: `audiodesc-${Date.now()}`,
    contentId,
    contentType,
    descriptions: [],
    fullDescription: "",
    language,
    type,
    source: "manual",
    state: "pending",
    isAIGenerated: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export function mergeDescriptionSegments(
  segments: AudioDescriptionSegment[]
): string {
  return segments
    .sort((a, b) => a.startTime - b.startTime)
    .map(s => s.text)
    .join(" ");
}

export function calculateTotalDuration(
  segments: AudioDescriptionSegment[]
): number {
  if (segments.length === 0) return 0;
  const sorted = segments.sort((a, b) => a.startTime - b.startTime);
  return sorted[sorted.length - 1].endTime;
}

export function getDescriptionAtTime(
  descriptions: AudioDescriptionSegment[],
  time: number
): AudioDescriptionSegment | null {
  return descriptions.find(
    d => time >= d.startTime && time < d.endTime
  ) || null;
}

export function generateDescriptionText(
  contentType: AudioDescription["contentType"],
  elements: Record<string, any>,
  template?: VisualDescriptionTemplate
): string {
  switch (contentType) {
    case "image":
      return generateImageDescription(elements);
    case "diagram":
      return generateDiagramDescription(elements);
    case "chart":
      return generateChartDescription(elements);
    case "video":
      return generateVideoDescription(elements);
    default:
      return generateGenericDescription(elements);
  }
}

function generateImageDescription(elements: Record<string, any>): string {
  const parts: string[] = [];

  if (elements.type) {
    parts.push(`This is ${elements.type}.`);
  }

  if (elements.subject) {
    parts.push(`The main subject is ${elements.subject}.`);
  }

  if (elements.setting) {
    parts.push(`The setting is ${elements.setting}.`);
  }

  if (elements.text) {
    parts.push(`Visible text reads: "${elements.text}"`);
  }

  if (elements.emotion) {
    parts.push(`The mood appears to be ${elements.emotion}.`);
  }

  return parts.join(" ");
}

function generateDiagramDescription(elements: Record<string, any>): string {
  const parts: string[] = [];

  if (elements.title) {
    parts.push(`Diagram titled "${elements.title}".`);
  }

  if (elements.type) {
    parts.push(`This is a ${elements.type} diagram.`);
  }

  if (elements.elements && Array.isArray(elements.elements)) {
    parts.push("The diagram contains the following elements:");
    elements.elements.forEach((el: any, i: number) => {
      parts.push(`${i + 1}. ${el.name}${el.value ? `: ${el.value}` : ""}`);
    });
  }

  if (elements.relationships) {
    parts.push("The elements are connected as follows:");
    elements.relationships.forEach((rel: any) => {
      parts.push(`- ${rel.from} ${rel.type} ${rel.to}`);
    });
  }

  return parts.join(" ");
}

function generateChartDescription(elements: Record<string, any>): string {
  const parts: string[] = [];

  if (elements.title) {
    parts.push(`Chart titled "${elements.title}".`);
  }

  if (elements.type) {
    parts.push(`This is a ${elements.type} chart.`);
  }

  if (elements.xAxis) {
    parts.push(`The X-axis represents ${elements.xAxis}.`);
  }

  if (elements.yAxis) {
    parts.push(`The Y-axis represents ${elements.yAxis}.`);
  }

  if (elements.data) {
    parts.push("Key data points include:");
    if (elements.data.labels && elements.data.values) {
      elements.data.labels.forEach((label: string, i: number) => {
        parts.push(`- ${label}: ${elements.data.values[i]}`);
      });
    }
  }

  if (elements.trend) {
    parts.push(`Overall trend: ${elements.trend}`);
  }

  return parts.join(" ");
}

function generateVideoDescription(elements: Record<string, any>): string {
  const parts: string[] = [];

  if (elements.scene) {
    parts.push(`Scene: ${elements.scene}`);
  }

  if (elements.actions) {
    parts.push(`Actions: ${elements.actions}`);
  }

  if (elements.characters) {
    parts.push(`Characters present: ${elements.characters.join(", ")}`);
  }

  if (elements.important) {
    parts.push(`Important visual information: ${elements.important}`);
  }

  return parts.join(" ");
}

function generateGenericDescription(elements: Record<string, any>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(elements)) {
    if (value) {
      parts.push(`${key}: ${value}`);
    }
  }

  return parts.join(". ") || "Visual content";
}

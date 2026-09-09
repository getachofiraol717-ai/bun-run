// AI Tutor Engine — LearningStyle model (Feature 7)

export type LearningStyle = "visual" | "auditory" | "reading_writing" | "hands_on" | "mixed";

export interface LearningStyleDescriptor {
  style: LearningStyle;
  label: string;
  /** Folded into the instruction sent to the AI so explanations actually shift in character. */
  promptHint: string;
}

export const LEARNING_STYLE_DESCRIPTORS: Record<LearningStyle, LearningStyleDescriptor> = {
  visual: {
    style: "visual",
    label: "Visual learner",
    promptHint: "Favor visual descriptions: describe diagrams, spatial relationships, colors, and shapes in words. Suggest what a sketch of this would look like.",
  },
  auditory: {
    style: "auditory",
    label: "Auditory learner",
    promptHint: "Favor rhythm and verbal patterns: use mnemonics, rhymes, spoken-style explanations, and analogies that work well read aloud.",
  },
  reading_writing: {
    style: "reading_writing",
    label: "Reading/writing learner",
    promptHint: "Favor well-structured text: clear definitions, bullet lists, numbered steps, and precise written wording the student can copy into notes.",
  },
  hands_on: {
    style: "hands_on",
    label: "Hands-on learner",
    promptHint: "Favor concrete actions: suggest a small experiment, physical analogy, or step-by-step activity the student could actually try.",
  },
  mixed: {
    style: "mixed",
    label: "Mixed learner",
    promptHint: "Blend a short visual description, a concrete real-world example, and a clear written definition.",
  },
};

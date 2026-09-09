// AI Tutor 2.0 — additive orchestrator exports.
// Coexists with the existing index.ts barrel; import from "@/plugins/margeos/ai-tutor-engine/v2".
export { TutorController } from "./core/TutorControllerV2";
export { ask } from "./core/ResponseOrchestrator";
export { useAITutor } from "./hooks/useAITutor";
export { generateProjectWithAITutor } from "./services/ProjectGeneratorService";
export { UniversalRenderer } from "./renderers/UniversalRenderer";
export { CardRenderer } from "./cards/CardRenderer";
export { detectSubject } from "./core/SubjectDetector";
export { detectDifficulty } from "./core/DifficultyDetector";
export type { Lesson, LessonCard, LessonCardType, Difficulty } from "./types/Lesson";
export type { SubjectType } from "./types/SubjectType";
export type { StudentContext } from "./types/StudentContext";

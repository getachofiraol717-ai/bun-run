# AI Tutor 2.0 — Phased Build Plan

Goal: Turn the existing AI Tutor page into an intelligent teaching OS via a new plugin at `src/plugins/margeos/ai-tutor-engine/`, without touching existing routes, UI language, Supabase schema, PDF Reader, Library, Dashboard, or auth. The existing `src/pages/AITutor.tsx` stays as the entry surface — we mount the new engine inside it behind a feature flag so nothing regresses.

## Phase 1 — Foundation (types, store, core engine, hook, LOVABLE_API_KEY streaming)
Files:
- `types/` — `SubjectType.ts`, `Lesson.ts`, `TeachingPlan.ts`, `StudentContext.ts`, `TutorResponse.ts`
- `store/aiTutorStore.ts` — vanilla subscribe/getState store (same pattern as `smart-pdf-engine/store/smartPDFStore.ts`)
- `core/` — `SubjectDetector.ts`, `DifficultyDetector.ts`, `LearningStyleDetector.ts`, `StudentContextBuilder.ts`, `TeachingPlanner.ts`, `LessonPlanner.ts`, `LessonComposer.ts`, `ResponseOrchestrator.ts`, `TutorController.ts`, `AITutorEngine.ts`
- `services/TutorService.ts` — streams from a new `supabase/functions/ai-tutor/index.ts` edge function using `LOVABLE_API_KEY` + `openai/gpt-5.5`, returns structured lesson JSON (sections → cards)
- `hooks/useAITutor.ts`, `hooks/useLesson.ts`, `hooks/useStudentContext.ts`
- `index.ts` — barrel exports
- New edge function `supabase/functions/ai-tutor/index.ts` (CORS, zod input validation, streams `UIMessage` parts + structured lesson via `Output.object`)

## Phase 2 — Renderers + Cards (interactive lesson UI)
- `cards/` — all 15 cards (Explanation, Code w/ syntax highlight, Formula w/ KaTeX, Diagram, Timeline, Summary, Practice, Quiz, Flashcard, Reference, CommonMistakes, Tips, Challenge, NextLesson, Progress). Reuses existing shadcn primitives + design tokens; no new color hex values.
- `renderers/` — one per subject, each composes cards for that domain (Programming = Explanation+Code+CommonMistakes+Practice+Quiz; Math = Explanation+Formula+Practice+Quiz; etc.) plus `UniversalRenderer.tsx` fallback and `PDFRenderer.tsx` for PDF-scoped answers.
- Utilities `utils/rendererUtils.ts`, `utils/lessonUtils.ts`, `utils/subjectUtils.ts`.

## Phase 3 — Planners + remaining services
- `planners/` — LessonFlow, Practice, Quiz, Review, Recommendation planners (pure functions producing plan objects consumed by `LessonComposer`)
- `services/` — SubjectAnalysis, TeachingStrategy, ResponseFormatting, MemorySync, PDFTeaching, Reference, Analytics (Analytics writes to existing `analytics_events` table)
- `hooks/useTeachingPlan.ts`, `hooks/usePractice.ts`

## Phase 4 — Integrations with existing engines
- `integrations/SmartPDFBridge.ts` — pulls active analysis from `smart-pdf-engine` store (already exported)
- `integrations/MemoryVaultBridge.ts`, `FormulaEngineBridge.ts`, `QuizBridge.ts`, `FlashcardBridge.ts`, `KnowledgeGalaxyBridge.ts`, `AccessibilityBridge.ts`, `VSCodeBridge.ts`, `ClassroomBridge.ts`. Bridges are thin adapters: if the target engine is present they wire through; if not they degrade gracefully (no crashes, no mock content).

## Phase 5 — Wire into `src/pages/AITutor.tsx`
- Import `AITutorEngine` and mount `<TutorController />` inside the existing chat area, keeping current header, sidebar, history, and Supabase message persistence. Feature-flag with `?tutor=v2` first, then flip the default once verified.
- Preserve all existing chat rows, quiz launches, and analytics events.

## Phase 6 — Verify
- `bun run build:dev` must pass.
- Smoke-test: ask a programming, math, and PDF-scoped question; confirm cards render, streaming works, analytics rows appear, and old chat history still loads.

## Technical notes
- Model: `openai/gpt-5.5` via Lovable AI Gateway (streaming chat completions from edge function; structured lesson via `Output.object` with small schema, no `.min/.max`). System prompt instructs the model to output a lesson JSON: `{ subject, difficulty, cards: [{ type, ...payload }] }`.
- No new DB tables required — reuse `analytics_events` for learning analytics and existing `ai_messages`/`ai_chats` (already accessed via `(supabase as any)`).
- All new files live only under `src/plugins/margeos/ai-tutor-engine/` and the one new edge function. No renames, no deletes, no route changes.

## Scale / cost warning
This is roughly 70 files, ~4–6k lines. I can't ship all of it in a single reply — the shell/edit budget won't fit. I'll deliver one phase per turn, verify build, then move to the next. **Reply "go" to start Phase 1**, or tell me which phases to drop / reorder (e.g. skip Classroom + VSCode bridges if those engines aren't live yet).

// MargeOS engine registry.
//
// Central wiring for all MargeOS plugin folders. Each engine lives in its own
// folder under src/plugins/margeos/<engine>/ with a barrel `index.ts`; this
// registry is the single place that maps an engine id to that barrel so panels,
// agents and the shell can discover engines without deep relative imports.
//
// Loaders come from `import.meta.glob` so every engine barrel is code-split and
// loaded lazily on first use.

export type MargeOSEngineId =
  | 'accessibility-engine'
  | 'ai-tutor-engine'
  | 'civilization-engine'
  | 'classroom-engine'
  | 'communication-engine'
  | 'exam-simulator'
  | 'formula-engine'
  | 'knowledge-galaxy'
  | 'quiz-engine'
  | 'reference-book-engine'
  | 'smart-pdf-engine'
  | 'study-companion'
  | 'terminal-sandbox'
  | 'visual-learning-engine'
  | 'vscode-workspace'
  | 'zip-intelligence';

export const MARGEOS_ENGINE_LABELS: Record<MargeOSEngineId, string> = {
  'accessibility-engine': 'Accessibility Engine',
  'ai-tutor-engine': 'AI Tutor Engine',
  'civilization-engine': 'Civilization Engine',
  'classroom-engine': 'Classroom Engine',
  'communication-engine': 'Communication Engine',
  'exam-simulator': 'Exam Simulator',
  'formula-engine': 'Formula Engine',
  'knowledge-galaxy': 'Knowledge Galaxy',
  'quiz-engine': 'Quiz Engine',
  'reference-book-engine': 'Reference Book Engine',
  'smart-pdf-engine': 'Smart PDF Engine',
  'study-companion': 'Study Companion',
  'terminal-sandbox': 'Terminal Sandbox',
  'visual-learning-engine': 'Visual Learning Engine',
  'vscode-workspace': 'VS Code Workspace',
  'zip-intelligence': 'Zip Intelligence',
};

// Vite resolves this at build time; each barrel becomes its own lazy chunk.
const ENGINE_MODULES = import.meta.glob('./*/index.ts') as Record<
  string,
  () => Promise<Record<string, unknown>>
>;

export interface MargeOSEngineDescriptor {
  id: MargeOSEngineId;
  label: string;
  /** Lazily import the engine's barrel module. */
  load: () => Promise<Record<string, unknown>>;
}

export const MARGEOS_ENGINES: MargeOSEngineDescriptor[] = (
  Object.keys(MARGEOS_ENGINE_LABELS) as MargeOSEngineId[]
).map((id) => ({
  id,
  label: MARGEOS_ENGINE_LABELS[id],
  load: () => {
    const loader = ENGINE_MODULES[`./${id}/index.ts`];
    if (!loader) return Promise.reject(new Error(`MargeOS engine barrel missing: ${id}/index.ts`));
    return loader();
  },
}));

const cache = new Map<MargeOSEngineId, Promise<Record<string, unknown>>>();

/** Load (and memoize) one engine module by id. */
export function loadMargeOSEngine(id: MargeOSEngineId) {
  const cached = cache.get(id);
  if (cached) return cached;
  const descriptor = MARGEOS_ENGINES.find((e) => e.id === id);
  if (!descriptor) return Promise.reject(new Error(`Unknown MargeOS engine: ${id}`));
  const promise = descriptor.load();
  cache.set(id, promise);
  return promise;
}

/** Diagnostic helper: report which engine barrels resolve successfully. */
export async function checkMargeOSEngines(): Promise<{ id: MargeOSEngineId; ok: boolean; error?: string }[]> {
  return Promise.all(
    MARGEOS_ENGINES.map(async (e) => {
      try {
        await loadMargeOSEngine(e.id);
        return { id: e.id, ok: true };
      } catch (err) {
        return { id: e.id, ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    }),
  );
}

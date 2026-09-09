// MargeOS multi-agent orchestration pipeline.
// Composes the existing single-agent edge personas into a real collaboration
// flow: Coordinator → Planner → Worker → Merge → Verifier. Each step streams,
// is persisted to margeos_agent_logs, and the task is closed out with the plan
// and final result. Pure helpers (buildStepPrompt, parseVerdict) are exported
// for unit testing.
import { streamAgent } from "./agentClient";
import { tasks, agentLogs, analytics } from "@/integrations/margeosBridge";
import type { AgentName } from "./types";

export type PipelineStep = "coordinator" | "planner" | "worker" | "merge" | "verifier";

export interface PipelineStepDef {
  step: PipelineStep;
  /** Default agent persona for the step ("worker" is overridden by the caller). */
  agent: AgentName;
  label: string;
}

export const PIPELINE: PipelineStepDef[] = [
  { step: "coordinator", agent: "coordinator", label: "Analyze & route" },
  { step: "planner", agent: "planner", label: "Build plan" },
  { step: "worker", agent: "qwen", label: "Execute" },
  { step: "merge", agent: "merge", label: "Synthesize" },
  { step: "verifier", agent: "verifier", label: "Verify" },
];

export interface PipelineContext {
  task: string;
  coordinator?: string;
  plan?: string;
  worker?: string;
  merged?: string;
}

/** Build the prompt handed to a given step from accumulated context. */
export function buildStepPrompt(step: PipelineStep, ctx: PipelineContext): string {
  const task = `Task: ${ctx.task}`;
  switch (step) {
    case "coordinator":
      return `${task}\n\nAnalyze the task, outline the high-level approach, and name the single specialist agent best suited to do the work (qwen, coding, research, teacher).`;
    case "planner":
      return `${task}\n\nCoordinator analysis:\n${ctx.coordinator ?? "(none)"}\n\nProduce a concise numbered plan with explicit success criteria.`;
    case "worker":
      return `${task}\n\nApproved plan:\n${ctx.plan ?? "(none)"}\n\nExecute the plan and produce the concrete deliverable. Be complete and self-contained.`;
    case "merge":
      return `${task}\n\nDraft deliverable:\n${ctx.worker ?? "(none)"}\n\nSynthesize this into one coherent, de-duplicated, well-structured final result.`;
    case "verifier":
      return `${task}\n\nFinal result:\n${ctx.merged ?? "(none)"}\n\nCritically review the result against the task. List any issues, then end with a line exactly like "verdict: pass" or "verdict: fail".`;
  }
}

export type Verdict = "pass" | "fail" | "unknown";

/** Extract the verifier verdict from its free-form critique. */
export function parseVerdict(text: string): Verdict {
  const m = text.toLowerCase().match(/verdict:\s*(pass|fail)/);
  if (m) return m[1] as Verdict;
  return "unknown";
}

export interface PipelineRunResult {
  steps: { step: PipelineStep; agent: AgentName; output: string }[];
  verdict: Verdict;
  plan: string;
  final: string;
}

export interface RunPipelineOptions {
  task: string;
  workspaceId: string | null;
  taskId: string;
  /** Specialist agent that performs the "worker" step. */
  worker?: AgentName;
  /** Called as each step streams so the UI can render live progress. */
  onStep?: (step: PipelineStep, agent: AgentName, partial: string) => void;
  signal?: AbortSignal;
}

/**
 * Run the full collaboration pipeline. Persists each step to agent logs and
 * closes the task with the plan + final result (status reflects the verdict).
 */
export async function runPipeline(opts: RunPipelineOptions): Promise<PipelineRunResult> {
  const ctx: PipelineContext = { task: opts.task };
  const steps: PipelineRunResult["steps"] = [];

  for (const def of PIPELINE) {
    const agent: AgentName = def.step === "worker" ? opts.worker ?? "qwen" : def.agent;
    const prompt = buildStepPrompt(def.step, ctx);

    let partial = "";
    const output = await streamAgent({
      agent,
      prompt,
      workspace_id: opts.workspaceId,
      task_id: opts.taskId,
      signal: opts.signal,
      onToken: (d) => {
        partial += d;
        opts.onStep?.(def.step, agent, partial);
      },
    });

    // Accumulate into context for downstream steps.
    if (def.step === "coordinator") ctx.coordinator = output;
    else if (def.step === "planner") ctx.plan = output;
    else if (def.step === "worker") ctx.worker = output;
    else if (def.step === "merge") ctx.merged = output;

    steps.push({ step: def.step, agent, output });

    // Best-effort per-step log (the edge function also logs streamed turns; this
    // records the pipeline role explicitly so the trace is self-describing).
    agentLogs
      .append({
        workspace_id: opts.workspaceId,
        task_id: opts.taskId,
        agent,
        role: `pipeline:${def.step}`,
        content: output,
        tokens: null,
        metadata: { pipeline: true, step: def.step },
      })
      .catch(() => void 0);
  }

  const verifierOut = steps.find((s) => s.step === "verifier")?.output ?? "";
  const verdict = parseVerdict(verifierOut);
  const plan = ctx.plan ?? "";
  const final = ctx.merged ?? ctx.worker ?? "";

  await tasks.setStatus(opts.taskId, verdict === "fail" ? "failed" : "completed", {
    plan: { text: plan } as unknown,
    result: { text: final, verdict } as unknown,
  });

  analytics.track({
    category: "agent",
    event: "agent.pipeline",
    subject: opts.worker ?? "qwen",
    value: steps.length,
    workspace_id: opts.workspaceId,
    metadata: { verdict },
  });

  return { steps, verdict, plan, final };
}

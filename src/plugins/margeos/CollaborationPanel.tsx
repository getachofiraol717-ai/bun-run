import { useRef, useState } from "react";
import { tasks } from "@/integrations/margeosBridge";
import { PIPELINE, runPipeline, type PipelineStep, type Verdict } from "./orchestrator";
import type { AgentName } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { PanelProps } from "./MargeOSShell";

// Specialist agents that can perform the "worker" step of the pipeline.
const WORKERS: AgentName[] = ["qwen", "coding", "research", "teacher"];

type StepState = { agent: AgentName; output: string; done: boolean };

export default function CollaborationPanel({ workspace }: PanelProps) {
  const [task, setTask] = useState("");
  const [worker, setWorker] = useState<AgentName>("qwen");
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Record<PipelineStep, StepState>>({} as Record<PipelineStep, StepState>);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function run() {
    if (!task.trim() || busy) return;
    setBusy(true);
    setVerdict(null);
    setSteps({} as Record<PipelineStep, StepState>);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const t = await tasks.create({
        title: task.trim(),
        assigned_agent: worker,
        workspace_id: workspace?.id ?? null,
      });
      const res = await runPipeline({
        task: t.title,
        workspaceId: workspace?.id ?? null,
        taskId: t.id,
        worker,
        signal: controller.signal,
        onStep: (step, agent, partial) => {
          setSteps((prev) => ({ ...prev, [step]: { agent, output: partial, done: false } }));
        },
      });
      const finalSteps = {} as Record<PipelineStep, StepState>;
      for (const s of res.steps) finalSteps[s.step] = { agent: s.agent, output: s.output, done: true };
      setSteps(finalSteps);
      setVerdict(res.verdict);
      toast.success(`Pipeline complete — verdict: ${res.verdict}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "pipeline failed");
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Five specialist agents collaborate on one task: the Coordinator routes it, the Planner
        scopes it, a worker executes, the Merge agent synthesizes, and the Verifier signs off.
      </p>

      <div className="flex flex-wrap gap-2">
        <Input
          className="min-w-[16rem] flex-1"
          placeholder="Describe a task for the agent team…"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") run(); }}
          disabled={busy}
        />
        <select
          className="bg-card border border-border rounded px-2 text-sm"
          value={worker}
          onChange={(e) => setWorker(e.target.value as AgentName)}
          disabled={busy}
        >
          {WORKERS.map((w) => <option key={w} value={w}>worker: {w}</option>)}
        </select>
        <Button onClick={run} disabled={busy}>{busy ? "Running…" : "Run pipeline"}</Button>
        {busy && <Button variant="secondary" onClick={stop}>Stop</Button>}
      </div>

      {verdict && (
        <Card className="p-2 text-sm">
          Verdict:{" "}
          <span className={verdict === "pass" ? "text-green-400" : verdict === "fail" ? "text-red-400" : "text-yellow-400"}>
            {verdict}
          </span>
        </Card>
      )}

      <div className="space-y-3">
        {PIPELINE.map((def, i) => {
          const s = steps[def.step];
          return (
            <Card key={def.step} className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">
                  {i + 1}. {def.label}
                  <span className="text-xs text-muted-foreground ml-2">
                    {s?.agent ?? (def.step === "worker" ? worker : def.agent)}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {s ? (s.done ? "done" : "streaming…") : "pending"}
                </span>
              </div>
              <div className="whitespace-pre-wrap text-sm max-h-64 overflow-auto">
                {s?.output || <span className="text-muted-foreground">—</span>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

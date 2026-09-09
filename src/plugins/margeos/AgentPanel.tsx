import { useEffect, useRef, useState } from "react";
import { tasks, agentLogs } from "@/integrations/margeosBridge";
import { streamAgent } from "./agentClient";
import type { Task, AgentLog, AgentName } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { PanelProps } from "./MargeOSShell";

const AGENTS: AgentName[] = [
  "coordinator","qwen","merge","executor","planner","verifier",
  "memory","teacher","coding","research","admin",
];

export default function AgentPanel({ workspace }: PanelProps) {
  const [title, setTitle] = useState("");
  const [agent, setAgent] = useState<AgentName>("coordinator");
  const [list, setList] = useState<Task[]>([]);
  const [sel, setSel] = useState<Task | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const streamRef = useRef("");

  const refresh = () => tasks.list(workspace?.id ?? null).then(setList).catch(() => void 0);
  useEffect(() => { refresh(); }, [workspace?.id]);
  useEffect(() => {
    if (!sel) return setLogs([]);
    agentLogs.list(sel.id).then(setLogs).catch(() => void 0);
  }, [sel?.id]);

  async function dispatch() {
    if (!title.trim() || busy) return;
    setBusy(true);
    streamRef.current = "";
    setStreaming("");
    try {
      const t = await tasks.create({
        title: title.trim(), assigned_agent: agent, workspace_id: workspace?.id ?? null,
      });
      await tasks.setStatus(t.id, "running");
      await agentLogs.append({
        workspace_id: workspace?.id ?? null, task_id: t.id, agent: "coordinator", role: "user",
        content: title.trim(), tokens: null, metadata: { agent },
      });
      setSel(t);
      setTitle("");
      await refresh();

      const final = await streamAgent({
        agent, prompt: t.title, workspace_id: workspace?.id ?? null, task_id: t.id,
        onToken: (d) => { streamRef.current += d; setStreaming(streamRef.current); },
      });

      await tasks.setStatus(t.id, "completed", { result: { text: final } as any });
      // Edge function logs the assistant turn server-side; refresh client view.
      const fresh = await agentLogs.list(t.id);
      setLogs(fresh);
      setStreaming("");
      await refresh();
      toast.success(`${agent} responded`);
    } catch (e: any) {
      toast.error(e.message ?? "agent failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Task description"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") dispatch(); }}
          />
          <select className="bg-card border border-border rounded px-2 text-sm" value={agent} onChange={(e) => setAgent(e.target.value as AgentName)}>
            {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <Button onClick={dispatch} disabled={busy}>{busy ? "…" : "Dispatch"}</Button>
        </div>
        <div className="space-y-2 max-h-80 overflow-auto">
          {list.map((t) => (
            <Card key={t.id} className={`p-2 cursor-pointer ${sel?.id === t.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSel(t)}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{t.title}</span>
                <span className="text-xs text-muted-foreground">{t.status} · {t.assigned_agent}</span>
              </div>
            </Card>
          ))}
          {!list.length && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
        </div>
      </div>
      <Card className="p-3 h-96 overflow-auto">
        {!sel && <p className="text-sm text-muted-foreground">Select a task to inspect agent trace.</p>}
        {sel && (
          <>
            <div className="font-semibold mb-2">{sel.title}</div>
            <div className="space-y-2 text-sm">
              {logs.map((l) => (
                <div key={l.id} className="border-l-2 border-primary/40 pl-2">
                  <div className="text-xs text-muted-foreground">{l.agent} · {l.role}</div>
                  <div className="whitespace-pre-wrap">{l.content}</div>
                </div>
              ))}
              {streaming && (
                <div className="border-l-2 border-accent pl-2">
                  <div className="text-xs text-muted-foreground">{agent} · streaming…</div>
                  <div className="whitespace-pre-wrap">{streaming}</div>
                </div>
              )}
              {!logs.length && !streaming && <p className="text-muted-foreground">No agent activity yet.</p>}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

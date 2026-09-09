// @ts-nocheck
import { useEffect, useState } from "react";
import { files, executions, analytics } from "@/integrations/margeosBridge";
import { callAgent } from "./agentClient";
import type { WorkspaceFile } from "./types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { PanelProps } from "./MargeOSShell";
import { ExecutionOrchestrator } from "./terminal-sandbox/core/ExecutionOrchestrator";
import { Container, Play, Terminal as TerminalIcon, Cpu, Layers } from "lucide-react";

// MargeOS shell: built-ins run against the virtual FS; unknown commands are
// routed to the Executor agent (Phase 2 — Lovable AI Gateway). Everything is
// logged to margeos_executions for the Execution Monitor.
type Line = { kind: "in" | "out" | "err"; text: string };

export default function TerminalPanel({ workspace }: PanelProps) {
  const [cwd, setCwd] = useState("/");
  const [lines, setLines] = useState<Line[]>([
    { kind: "out", text: "MargeOS shell v0.1 — type `help` for commands" },
  ]);
  const [cmd, setCmd] = useState("");
  const [fs, setFs] = useState<WorkspaceFile[]>([]);

  useEffect(() => {
    if (!workspace) return;
    files.list(workspace.id).then(setFs).catch(() => void 0);
  }, [workspace]);

  function resolve(p: string) {
    if (!p) return cwd;
    if (p.startsWith("/")) return p.replace(/\/+$/, "") || "/";
    const base = cwd.endsWith("/") ? cwd : cwd + "/";
    const out = (base + p).replace(/\/+/g, "/");
    return out.replace(/\/+$/, "") || "/";
  }

  async function run(raw: string) {
    if (!workspace) { setLines((l) => [...l, { kind: "err", text: "no workspace selected" }]); return; }
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (trimmed === "clear") { setLines([]); return; }

    const started = Date.now();
    let out = "";
    let err = "";
    let status: "success" | "error" = "success";

    try {
      const orchestrator = ExecutionOrchestrator.getInstance();
      const workspaceFiles = fs.map(f => ({ path: f.path, content: f.content || '' }));

      const execMeta = await orchestrator.execute({
        userId: workspace.owner_id || 'margeos-user',
        projectId: workspace.id,
        workspaceId: workspace.id,
        command: trimmed,
        cwd,
        files: workspaceFiles,
      });

      out = execMeta.stdout;
      err = execMeta.stderr || (execMeta.error ?? '');
      status = execMeta.status === 'completed' ? 'success' : 'error';

      // Update local CWD if cd was executed successfully
      if (trimmed.startsWith('cd ') && execMeta.status === 'completed') {
        const target = resolve(trimmed.slice(3).trim() || '/');
        setCwd(target);
      }
    } catch (e: any) {
      err = e.message ?? String(e);
      status = "error";
    }

    setLines((l) => [
      ...l,
      { kind: "in", text: `${cwd} $ ${raw}` },
      ...(out ? [{ kind: "out" as const, text: out }] : []),
      ...(err ? [{ kind: "err" as const, text: err }] : []),
    ]);

    const duration_ms = Date.now() - started;
    try {
      await executions.log({
        workspace_id: workspace.id, task_id: null, kind: "terminal",
        command: raw, status, output: out || null, error: err || null,
        duration_ms,
      });
    } catch { /* logging best-effort */ }

    analytics.track({
      category: "terminal",
      event: "terminal.run",
      subject: head || raw,
      value: duration_ms,
      workspace_id: workspace.id,
      metadata: { status },
    });
  }

  return (
    <div className="space-y-3">
      {/* Docker Container Status & Quick Shortcuts Bar */}
      <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Container className="h-4 w-4 text-cyan-400" />
          <span className="font-semibold font-orbitron text-foreground">Docker Engine Sandbox</span>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]">
            Active (v24.0.7)
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono">
          <Button
            size="sm"
            variant="outline"
            onClick={() => run('docker ps')}
            className="h-7 text-[11px] px-2.5 border-border hover:border-cyan-500/40"
          >
            docker ps
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => run('docker images')}
            className="h-7 text-[11px] px-2.5 border-border hover:border-cyan-500/40"
          >
            docker images
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => run('docker run node:20 node -e "console.log(\'Docker Node Container!\')"')}
            className="h-7 text-[11px] px-2.5 border-border hover:border-cyan-500/40 text-cyan-400"
          >
            run node:20
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => run('docker run python:3.11 python -c "print(\'Docker Python Container!\')"')}
            className="h-7 text-[11px] px-2.5 border-border hover:border-cyan-500/40 text-emerald-400"
          >
            run python:3.11
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => run('docker compose up')}
            className="h-7 text-[11px] px-2.5 border-border hover:border-cyan-500/40 text-blue-400"
          >
            compose up
          </Button>
        </div>
      </div>

      <div className="font-mono text-xs bg-black/80 border border-border text-green-300 rounded-xl p-3.5 h-72 overflow-auto whitespace-pre-wrap shadow-inner">
        {lines.map((l, i) => (
          <div key={i} className={l.kind === "err" ? "text-red-400" : l.kind === "in" ? "text-cyan-300 font-semibold" : ""}>
            {l.text}
          </div>
        ))}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = cmd; setCmd(""); run(v).catch((x) => toast.error(x.message)); }}>
        <span className="font-mono text-xs self-center text-muted-foreground">{cwd} $</span>
        <Input className="font-mono text-xs h-9 bg-muted/20" autoFocus value={cmd} onChange={(e) => setCmd(e.target.value)} placeholder="Type 'help' or 'docker ps' or 'docker run alpine'" />
        <Button type="submit" size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-4">Run</Button>
      </form>
    </div>
  );
}

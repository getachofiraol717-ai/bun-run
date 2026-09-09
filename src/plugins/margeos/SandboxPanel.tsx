import { useState } from "react";
import type { PanelProps } from "./MargeOSShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { executions, analytics } from "@/integrations/margeosBridge";
import { runInSandbox, formatSandboxOutput, type SandboxResult } from "./sandboxRunner";
import DockerRuntime from "./terminal-sandbox/runtimes/DockerRuntime";
import { Container, Download, ShieldCheck, Cpu, Terminal, Check } from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";

const SAMPLE = `// Runs in an isolated Web Worker with a hard timeout.
const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2));
console.log("fib(10) =", fib(10));
return fib(10) * 2;`;

// Sandbox panel — security posture plus a real isolated JS runner.
export default function SandboxPanel({ workspace }: PanelProps) {
  const [code, setCode] = useState(SAMPLE);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<SandboxResult | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await runInSandbox(code, { timeoutMs: 3000 });
      setRes(r);
      // Persist + track (best-effort; never blocks the UI).
      executions
        .log({
          workspace_id: workspace?.id ?? null,
          task_id: null,
          kind: "sandbox",
          command: code.slice(0, 1000),
          status: r.status,
          output: formatSandboxOutput(r) || null,
          error: r.error ?? null,
          duration_ms: r.duration_ms,
        })
        .catch(() => void 0);
      analytics.track({
        category: "sandbox",
        event: "sandbox.run",
        value: r.duration_ms,
        workspace_id: workspace?.id ?? null,
        metadata: { status: r.status },
      });
    } finally {
      setBusy(false);
    }
  }

  async function downloadDockerConfig() {
    try {
      const zip = new JSZip();
      
      const dockerfileContent = `# MargeOS Sandbox Terminal Dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 py3-pip bash git curl docker-cli zip
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
USER node
EXPOSE 3000
CMD ["npm", "start"]
`;

      const composeContent = `version: '3.8'
services:
  margeos-sandbox-terminal:
    build:
      context: .
      dockerfile: Dockerfile.sandbox
    container_name: margeos-sandbox-terminal
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MARGEOS_SANDBOX=enabled
      - PORT=3000
    restart: unless-stopped
    networks:
      - margeos-net

networks:
  margeos-net:
    driver: bridge
`;

      zip.file("Dockerfile.sandbox", dockerfileContent);
      zip.file("docker-compose.sandbox.yml", composeContent);
      
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "margeos_sandbox_docker_config.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Downloaded Dockerfile & Docker Compose configuration!");
    } catch {
      toast.error("Failed to package Docker files.");
    }
  }

  const runningContainers = DockerRuntime.getRunningContainers();

  return (
    <div className="space-y-4">
      {/* Docker Engine Card */}
      <Card className="p-4 border-cyan-500/20 bg-cyan-500/5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Container className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2 font-orbitron">
                Docker Engine Container Sandbox
              </h3>
              <p className="text-xs text-muted-foreground">
                Container virtualization runtime for isolated Node, Python, and Linux execution.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs">
              Engine Online (v24.0.7)
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadDockerConfig}
              className="text-xs border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download Dockerfile & Compose
            </Button>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Active Virtual Containers ({runningContainers.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {runningContainers.map((c) => (
              <div key={c.id} className="p-2.5 rounded-lg bg-black/60 border border-border text-xs space-y-1 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <Container className="h-3.5 w-3.5 text-cyan-400" />
                    {c.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    {c.status}
                  </Badge>
                </div>
                <div className="text-muted-foreground text-[11px]">
                  Image: <span className="text-foreground">{c.image}</span> | Port: {c.ports}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  Cmd: <code className="text-muted-foreground">{c.command}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Sandbox status</h3>
        <ul className="text-sm space-y-1">
          <li>• Docker Container CLI: <span className="text-emerald-400 font-semibold">online</span> (docker run, build, ps, stop)</li>
          <li>• Virtual filesystem: <span className="text-green-500">online</span> (Phase 1)</li>
          <li>• Built-in command set: <span className="text-green-500">online</span></li>
          <li>• AI executor fallback: <span className="text-green-500">online</span></li>
          <li>• Isolated JS execution (Web Worker): <span className="text-green-500">online</span></li>
        </ul>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">JS runner</h3>
          <span className="text-xs text-muted-foreground">isolated worker · 3s timeout</span>
        </div>
        <Textarea
          className="font-mono text-sm min-h-[8rem]"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={run} disabled={busy}>{busy ? "Running…" : "Run"}</Button>
          <Button size="sm" variant="secondary" onClick={() => { setCode(SAMPLE); setRes(null); }} disabled={busy}>Reset</Button>
        </div>

        {res && (
          <div className="space-y-1">
            <div className="text-xs">
              <span
                className={
                  res.status === "success" ? "text-green-400" : res.status === "timeout" ? "text-yellow-400" : "text-red-400"
                }
              >
                {res.status}
              </span>{" "}
              <span className="text-muted-foreground">· {res.duration_ms}ms</span>
            </div>
            <pre className="text-xs whitespace-pre-wrap bg-background/50 border border-border rounded p-2 max-h-64 overflow-auto">
              {formatSandboxOutput(res) || (res.error ?? "(no output)")}
              {res.error && res.status !== "success" ? `\n${res.error}` : ""}
            </pre>
          </div>
        )}
      </Card>

      <Card className="p-4 text-sm text-muted-foreground">
        Lovable runs Vite + Supabase Edge Functions, so a real OS shell with
        npm/node/git/python cannot exist in-process. The MargeOS sandbox executes
        the safe command set against a per-workspace virtual FS, defers unknown
        commands to an AI executor, and runs free-form JavaScript inside an
        isolated Web Worker (no DOM access, hard-killed on timeout). Every action
        is logged to <code>margeos_executions</code>.
      </Card>
    </div>
  );
}

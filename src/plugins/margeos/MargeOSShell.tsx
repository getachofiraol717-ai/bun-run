// MargeOS plugin host. Tabs through every panel so the OS lives at /margeos
// without redesigning any existing screen.
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import WorkspacePanel from "./WorkspacePanel";
import TerminalPanel from "./TerminalPanel";
import AgentPanel from "./AgentPanel";
import CollaborationPanel from "./CollaborationPanel";
import MemoryPanel from "./MemoryPanel";
import TutorPanel from "./TutorPanel";
import SandboxPanel from "./SandboxPanel";
import FileExplorer from "./FileExplorer";
import SessionViewer from "./SessionViewer";
import ExecutionMonitor from "./ExecutionMonitor";
import AnalyticsPanel from "./AnalyticsPanel";
import ZipIntelligencePanel from "./ZipIntelligencePanel";
import { workspaces } from "@/integrations/margeosBridge";
import type { Workspace } from "@/plugins/margeos/types";
import * as MargeOSEngines from "./index";
import { MARGEOS_ENGINES, checkMargeOSEngines, loadMargeOSEngine } from "./engines";

const TABS = [
  { id: "workspace", label: "Workspace", C: WorkspacePanel },
  { id: "files", label: "Files", C: FileExplorer },
  { id: "zip-intelligence", label: "ZIP Intelligence", C: ZipIntelligencePanel },
  { id: "terminal", label: "Terminal", C: TerminalPanel },
  { id: "sandbox", label: "Sandbox", C: SandboxPanel },
  { id: "agents", label: "Agents", C: AgentPanel },
  { id: "collab", label: "Collaboration", C: CollaborationPanel },
  { id: "memory", label: "Memory", C: MemoryPanel },
  { id: "tutor", label: "Tutor", C: TutorPanel },
  { id: "exec", label: "Executions", C: ExecutionMonitor },
  { id: "analytics", label: "Analytics", C: AnalyticsPanel },
  { id: "sessions", label: "Sessions", C: SessionViewer },
] as const;

export interface PanelProps {
  workspace: Workspace | null;
  onWorkspaceChange: (w: Workspace | null) => void;
}

export default function MargeOSShell() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [list, setList] = useState<Workspace[]>([]);
  const [tab, setTab] = useState<string>("workspace");

  useEffect(() => {
    workspaces.list().then((ws) => {
      setList(ws);
      if (!workspace && ws[0]) setWorkspace(ws[0]);
    }).catch(() => void 0);
  }, [workspace]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-orbitron neon-text">MargeOS</h1>
          <p className="text-sm text-muted-foreground">
            AI Operating System — Phase 1 foundation. Pluggable subsystems mount here.
          </p>
        </div>
        <select
          className="bg-card border border-border rounded px-3 py-2 text-sm"
          value={workspace?.id ?? ""}
          onChange={(e) => {
            const next = list.find((w) => w.id === e.target.value) ?? null;
            setWorkspace(next);
          }}
        >
          <option value="">— select workspace —</option>
          {list.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </header>

      <Card className="p-2">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
          {TABS.map(({ id, C }) => (
            <TabsContent key={id} value={id} className="p-2">
              <C workspace={workspace} onWorkspaceChange={setWorkspace} />
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}

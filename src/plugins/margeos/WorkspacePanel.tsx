import { useEffect, useState } from "react";
import { workspaces } from "@/integrations/margeosBridge";
import type { Workspace } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { PanelProps } from "./MargeOSShell";

export default function WorkspacePanel({ workspace, onWorkspaceChange }: PanelProps) {
  const [list, setList] = useState<Workspace[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => workspaces.list().then(setList).catch((e) => toast.error(e.message));
  useEffect(() => { refresh(); }, []);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const w = await workspaces.create({ name: name.trim() });
      setName("");
      onWorkspaceChange(w);
      await refresh();
      toast.success(`Created ${w.name}`);
    } catch (e: any) {
      toast.error(e.message ?? "Create failed");
    } finally { setBusy(false); }
  }

  async function archive(id: string) {
    await workspaces.archive(id, true); await refresh();
  }
  async function remove(id: string) {
    if (!confirm("Delete workspace and all contents?")) return;
    await workspaces.remove(id);
    if (workspace?.id === id) onWorkspaceChange(null);
    await refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="New workspace name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={create} disabled={busy}>Create</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((w) => (
          <Card key={w.id} className={`p-3 space-y-2 ${workspace?.id === w.id ? "ring-2 ring-primary" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{w.name}</div>
                <div className="text-xs text-muted-foreground">{w.slug}</div>
              </div>
              {w.archived && <span className="text-xs px-2 py-0.5 rounded bg-muted">archived</span>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onWorkspaceChange(w)}>Open</Button>
              <Button size="sm" variant="ghost" onClick={() => archive(w.id)}>Archive</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(w.id)}>Delete</Button>
            </div>
          </Card>
        ))}
        {!list.length && <p className="text-sm text-muted-foreground">No workspaces yet.</p>}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { sessions } from "@/integrations/margeosBridge";
import type { MargeSession } from "./types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { PanelProps } from "./MargeOSShell";

export default function SessionViewer({ workspace }: PanelProps) {
  const [list, setList] = useState<MargeSession[]>([]);
  const refresh = () => sessions.list().then(setList).catch(() => void 0);
  useEffect(() => { refresh(); }, []);

  async function open() {
    try {
      await sessions.open(workspace?.id ?? null, workspace ? `Session in ${workspace.name}` : "Quick session");
      await refresh(); toast.success("Session opened");
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-3">
      <Button onClick={open}>Open new session</Button>
      <div className="space-y-2 max-h-80 overflow-auto">
        {list.map((s) => (
          <Card key={s.id} className="p-2 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">{s.label ?? "Session"}</span>
              <span className="text-xs text-muted-foreground">{new Date(s.last_active_at).toLocaleString()}</span>
            </div>
          </Card>
        ))}
        {!list.length && <p className="text-sm text-muted-foreground">No sessions yet.</p>}
      </div>
    </div>
  );
}

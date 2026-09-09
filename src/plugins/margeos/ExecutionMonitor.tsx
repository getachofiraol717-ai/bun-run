import { useEffect, useState } from "react";
import { executions } from "@/integrations/margeosBridge";
import type { Execution } from "./types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PanelProps } from "./MargeOSShell";

export default function ExecutionMonitor({ workspace }: PanelProps) {
  const [list, setList] = useState<Execution[]>([]);
  const refresh = () => executions.list(workspace?.id ?? null).then(setList).catch(() => void 0);
  useEffect(() => { refresh(); }, [workspace?.id]);

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={refresh}>Refresh</Button>
      <div className="space-y-2 max-h-[28rem] overflow-auto">
        {list.map((e) => (
          <Card key={e.id} className="p-2 text-sm">
            <div className="flex justify-between">
              <span className="font-mono">{e.kind}{e.command ? ` · ${e.command}` : ""}</span>
              <span className={`text-xs ${e.status === "error" ? "text-red-400" : e.status === "success" ? "text-green-400" : "text-yellow-400"}`}>
                {e.status} · {e.duration_ms ?? 0}ms
              </span>
            </div>
            {e.output && <pre className="text-xs whitespace-pre-wrap mt-1">{e.output}</pre>}
            {e.error && <pre className="text-xs text-red-400 whitespace-pre-wrap mt-1">{e.error}</pre>}
            <div className="text-[10px] text-muted-foreground mt-1">{new Date(e.created_at).toLocaleString()}</div>
          </Card>
        ))}
        {!list.length && <p className="text-sm text-muted-foreground">No executions logged.</p>}
      </div>
    </div>
  );
}

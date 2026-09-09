import { useEffect, useState } from "react";
import { memory } from "@/integrations/margeosBridge";
import { embedMemory, searchMemory } from "./agentClient";
import type { MemoryEntry, MemoryScope } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { PanelProps } from "./MargeOSShell";

const SCOPES: MemoryScope[] = ["session", "long_term", "project", "conversation"];

export default function MemoryPanel({ workspace }: PanelProps) {
  const [scope, setScope] = useState<MemoryScope>("long_term");
  const [list, setList] = useState<MemoryEntry[]>([]);
  const [key, setKey] = useState("");
  const [content, setContent] = useState("");
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<(MemoryEntry & { similarity: number })[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = () => memory.list(workspace?.id ?? null, scope).then(setList).catch(() => void 0);
  useEffect(() => { refresh(); }, [workspace?.id, scope]);

  async function add() {
    if (!content.trim()) return;
    setBusy(true);
    try {
      const m = await memory.write({ workspace_id: workspace?.id ?? null, scope, key: key || null, content });
      // Best-effort embedding for semantic recall.
      embedMemory(m.id).catch(() => void 0);
      setKey(""); setContent(""); await refresh();
      toast.success("Memory stored — embedding in background");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  async function search() {
    if (!query.trim()) return;
    setBusy(true);
    try {
      const m = await searchMemory({ query, workspace_id: workspace?.id ?? null, k: 8 });
      setMatches(m);
      if (!m.length) toast.message("No semantic matches yet — store more memories first.");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {SCOPES.map((s) => (
          <Button key={s} size="sm" variant={s === scope ? "default" : "outline"} onClick={() => setScope(s)}>{s}</Button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        <Input placeholder="key (optional)" value={key} onChange={(e) => setKey(e.target.value)} />
        <Button onClick={add} disabled={busy}>Store</Button>
      </div>
      <Textarea rows={3} placeholder="memory content" value={content} onChange={(e) => setContent(e.target.value)} />

      <Card className="p-3 space-y-2">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Semantic recall</div>
        <div className="flex gap-2">
          <Input placeholder="ask anything…" value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") search(); }} />
          <Button onClick={search} disabled={busy}>Search</Button>
        </div>
        {!!matches.length && (
          <div className="space-y-1 max-h-60 overflow-auto">
            {matches.map((m) => (
              <div key={m.id} className="text-sm border-l-2 border-accent pl-2">
                <div className="text-xs text-muted-foreground">{m.scope} · {m.key ?? "—"} · {(m.similarity * 100).toFixed(0)}%</div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="space-y-2 max-h-80 overflow-auto">
        {list.map((m) => (
          <Card key={m.id} className="p-2 text-sm">
            <div className="text-xs text-muted-foreground">{m.scope} · {m.key ?? "—"} · {new Date(m.updated_at).toLocaleString()}</div>
            <div className="whitespace-pre-wrap">{m.content}</div>
            <div className="flex gap-2 mt-1">
              <Button size="sm" variant="ghost" onClick={async () => { await embedMemory(m.id).catch((e) => toast.error(e.message)); toast.success("re-embedded"); }}>re-embed</Button>
              <Button size="sm" variant="ghost" onClick={async () => { await memory.remove(m.id); refresh(); }}>delete</Button>
            </div>
          </Card>
        ))}
        {!list.length && <p className="text-sm text-muted-foreground">No memories in this scope.</p>}
      </div>
    </div>
  );
}

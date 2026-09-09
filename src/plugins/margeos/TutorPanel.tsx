import { useEffect, useState } from "react";
import { knowledge } from "@/integrations/margeosBridge";
import type { KnowledgeEntry } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { PanelProps } from "./MargeOSShell";
import { generateTutor, searchVault, embedVault, type TutorKind } from "./agentClient";
import { summarizeTutorProgress, TUTOR_KINDS } from "./tutorUtils";
import MargeOSTutorCard from "./MargeOSTutorCard";

const KINDS: { id: TutorKind; label: string }[] = [
  { id: "lesson", label: "Lesson" },
  { id: "quiz", label: "Quiz" },
  { id: "exam", label: "Exam" },
  { id: "flashcards", label: "Flashcards" },
  { id: "roadmap", label: "Roadmap" },
];

export default function TutorPanel(_: PanelProps) {
  const [list, setList] = useState<KnowledgeEntry[]>([]);
  const [q, setQ] = useState("");
  const [semantic, setSemantic] = useState<any[] | null>(null);

  // generator state
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("high-school");
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState<TutorKind | null>(null);

  // manual add
  const [cat, setCat] = useState("lesson");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const refresh = () =>
    knowledge.list(undefined, q || undefined).then(setList).catch(() => void 0);
  useEffect(() => { refresh(); }, [q]);

  async function add() {
    if (!title.trim() || !content.trim()) return;
    try {
      const e = await knowledge.add({ category: cat, title, content });
      embedVault(e.id).catch(() => void 0); // background embed
      setTitle(""); setContent(""); refresh();
      toast.success("Saved to vault");
    } catch (e: any) { toast.error(e.message); }
  }

  async function runGenerator(kind: TutorKind) {
    if (!topic.trim()) { toast.error("Enter a topic first"); return; }
    setBusy(kind);
    try {
      const r = await generateTutor({ kind, topic: topic.trim(), level, count });
      toast.success(`${kind} generated`);
      refresh();
      // surface in the list immediately if newly saved
      if (r.saved_id) {
        const saved = await knowledge.list().catch(() => []);
        setList(saved);
      }
    } catch (e: any) {
      toast.error(e.message ?? "generation failed");
    } finally { setBusy(null); }
  }

  async function runSemantic() {
    if (!q.trim()) { setSemantic(null); return; }
    try {
      const m = await searchVault({ query: q.trim(), k: 8 });
      setSemantic(m);
    } catch (e: any) {
      toast.error(e.message ?? "search failed");
    }
  }

  const progress = summarizeTutorProgress(list);

  return (
    <div className="space-y-4">
      {/* Featured MargeOS AI Tutor Card */}
      <MargeOSTutorCard onSelectTopic={(t) => setTopic(t)} />

      {/* Progress tracker */}
      <Card className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Learning progress</div>
          <div className="text-xs text-muted-foreground">
            {progress.total} items{progress.lastActivity ? ` · last ${new Date(progress.lastActivity).toLocaleDateString()}` : ""}
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {TUTOR_KINDS.map((k) => (
            <div key={k} className="rounded border border-border/50 p-2 text-center">
              <div className="text-xl font-orbitron neon-text">{progress.byKind[k]}</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Generators */}
      <Card className="p-3 space-y-2">
        <div className="text-sm font-semibold">AI Tutor — Generators</div>
        <div className="grid md:grid-cols-3 gap-2">
          <Input className="md:col-span-2" placeholder="Topic (e.g. Photosynthesis, React hooks…)" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <Input placeholder="Level (e.g. grade 9, university…)" value={level} onChange={(e) => setLevel(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-muted-foreground">Items:</label>
          <Input type="number" min={1} max={30} className="w-20" value={count} onChange={(e) => setCount(Number(e.target.value) || 5)} />
          {KINDS.map((k) => (
            <Button key={k.id} size="sm" variant="secondary" disabled={busy !== null}
              onClick={() => runGenerator(k.id)}>
              {busy === k.id ? "…" : k.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Results stream into the Knowledge Vault with embeddings for instant semantic recall.
        </p>
      </Card>

      {/* Search */}
      <Card className="p-3 space-y-2">
        <div className="flex gap-2">
          <Input placeholder="Search vault (title or semantic)…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button variant="outline" onClick={runSemantic}>Semantic</Button>
          <Button variant="ghost" onClick={() => { setSemantic(null); refresh(); }}>Reset</Button>
        </div>
        {semantic && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Semantic results</div>
            {semantic.map((m) => (
              <div key={m.id} className="text-sm border border-border/50 rounded p-2">
                <div className="text-xs text-muted-foreground">{m.category} · sim {(m.similarity ?? 0).toFixed(2)}</div>
                <div className="font-medium">{m.title}</div>
              </div>
            ))}
            {!semantic.length && <p className="text-sm text-muted-foreground">No semantic matches yet — generate or add content first.</p>}
          </div>
        )}
      </Card>

      {/* Manual add */}
      <Card className="p-3 space-y-2">
        <div className="text-sm font-semibold">Add to vault</div>
        <div className="grid md:grid-cols-3 gap-2">
          <Input placeholder="category (lesson / quiz / flashcard / roadmap…)" value={cat} onChange={(e) => setCat(e.target.value)} />
          <Input className="md:col-span-2" placeholder="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <Textarea rows={3} placeholder="content" value={content} onChange={(e) => setContent(e.target.value)} />
        <Button onClick={add}>Save</Button>
      </Card>

      {/* Vault list */}
      <div className="space-y-2 max-h-96 overflow-auto">
        {list.map((k) => (
          <Card key={k.id} className="p-2">
            <div className="text-xs text-muted-foreground">{k.category}</div>
            <div className="font-semibold">{k.title}</div>
            <pre className="text-xs whitespace-pre-wrap max-h-40 overflow-auto bg-muted/40 p-2 rounded">{k.content}</pre>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={async () => { try { await embedVault(k.id); toast.success("embedded"); } catch (e: any) { toast.error(e.message); } }}>embed</Button>
              <Button size="sm" variant="ghost" onClick={async () => { await knowledge.remove(k.id); refresh(); }}>delete</Button>
            </div>
          </Card>
        ))}
        {!list.length && <p className="text-sm text-muted-foreground">Vault is empty.</p>}
      </div>
    </div>
  );
}

// @ts-nocheck
// Smart PDF Engine — AnalysisPanel
// Displays analysis results: chapters, topics, formulas, diagrams, tables,
// and the adaptive learning path. Rendered as a side panel inside PDFReader.
import React, { useState, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  BookOpen, FlaskConical, Image, Table2, Route,
  ChevronRight, ChevronDown, CheckCircle2, Circle,
  Loader2, AlertCircle, X, Sparkles, Network, GraduationCap, MessageCircle,
  Maximize2, Minimize2, Columns2,
} from "lucide-react";
import { TutorController } from "../../ai-tutor-engine/core/TutorControllerV2";
import { useLearningPath } from "../hooks/useLearningPath";
import { getState, subscribe, type DocumentState } from "../store/smartPDFStore";
import { computeDocumentId } from "../core/SmartPDFController";
import LibraryCompanion from "@/components/library/LibraryCompanion";
import LibraryAITutorTab from "@/components/library/LibraryAITutorTab";
import LibraryStudyCompanionTab from "@/components/library/LibraryStudyCompanionTab";
import type { CompanionContext, SecondBookRef } from "@/components/library/types";
import type { PdfDoc } from "@/lib/pdfjs";
import type { Chapter, ChapterHierarchy } from "../types/Chapter";
import type { TopicGraph, Topic } from "../types/Topic";
import type { Formula } from "../types/Formula";
import type { Diagram } from "../types/Diagram";
import type { PDFTable } from "../types/Table";
import type { LearningPathStep } from "../types/LearningPath";

type TabId = "overview" | "chapters" | "topics" | "formulas" | "diagrams" | "tables" | "path" | "tutor" | "companion";

interface AnalysisPanelProps {
  /** pdf.js document instance */
  pdfDoc: PdfDoc | null;
  /** Source URL/identifier for cache lookup */
  source: string | null;
  onClose: () => void;
  onJumpToPage: (page: number) => void;
  className?: string;
  /** Optional Reading Companion context — enables the Companion tab. */
  companionCtx?: CompanionContext;
  secondBook?: SecondBookRef | null;
  /** Optional controlled tab. */
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  /** Initial tab (uncontrolled). */
  initialTab?: TabId;
  /** Controlled view-mode: 'split' side-panel or 'full' fullscreen. */
  viewMode?: "split" | "full";
  onViewModeChange?: (m: "split" | "full") => void;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "chapters", label: "Chapters", icon: BookOpen },
  { id: "topics", label: "Topics", icon: Network },
  { id: "formulas", label: "Formulas", icon: FlaskConical },
  { id: "diagrams", label: "Figures", icon: Image },
  { id: "tables", label: "Tables", icon: Table2 },
  { id: "path", label: "Learning Path", icon: Route },
  { id: "tutor", label: "AI Tutor", icon: GraduationCap },
  { id: "companion", label: "Companion", icon: MessageCircle },
];

const EMPTY: DocumentState = { status: "idle", progress: null, analysis: null, error: null };

// ── Hook to subscribe to store state ──────────────────────────────────────────
function useAnalysisState(pdfDoc: PdfDoc | null, source: string | null): DocumentState {
  const documentId = pdfDoc && source ? computeDocumentId(pdfDoc, source) : null;
  return useSyncExternalStore(
    useCallback(
      (listener: () => void) => {
        if (!documentId) return () => {};
        return subscribe(documentId, listener);
      },
      [documentId]
    ),
    useCallback(() => (documentId ? getState(documentId) : EMPTY), [documentId])
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "complete") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
        <CheckCircle2 className="h-3 w-3" /> Complete
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">
        <AlertCircle className="h-3 w-3" /> Error
      </span>
    );
  }
  if (status === "idle") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400">
        <Loader2 className="h-3 w-3" /> Waiting
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
      <Loader2 className="h-3 w-3 animate-spin" /> Analyzing…
    </span>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-primary to-neon-cyan rounded-full transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({
  analysis,
  progress,
}: {
  analysis: DocumentState["analysis"];
  progress: DocumentState["progress"];
}) {
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">
          {progress?.currentStep ?? "Preparing analysis…"}
        </p>
        {progress && <ProgressBar percent={progress.percent} />}
      </div>
    );
  }

  const { metadata, chapters, topics, formulas, diagrams, tables, learningPath } = analysis;
  const flatSteps = [
    ...learningPath.beginner,
    ...learningPath.intermediate,
    ...learningPath.advanced,
  ];
  const completedSteps = flatSteps.filter((s) => s.completed).length;

  return (
    <div className="space-y-4 p-2 overflow-auto max-h-[60vh]">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={BookOpen} label="Chapters" value={chapters.flatIndex.length} />
        <StatCard icon={Network} label="Topics" value={topics.nodes.length} />
        <StatCard icon={FlaskConical} label="Formulas" value={formulas.length} />
        <StatCard icon={Table2} label="Tables" value={tables.length} />
      </div>

      {/* Metadata */}
      <div className="rounded-lg bg-black/20 p-3 space-y-1.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document Info</h4>
        <p className="text-sm font-medium">{metadata.title ?? "Untitled"}</p>
        <p className="text-xs text-muted-foreground">{metadata.author ?? "Unknown author"}</p>
        <p className="text-xs text-muted-foreground">
          {metadata.numPages} pages · {metadata.wordCount.toLocaleString()} words
        </p>
      </div>

      {/* Learning Progress */}
      {flatSteps.length > 0 && (
        <div className="rounded-lg bg-black/20 p-3 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Learning Progress</h4>
          <div className="flex items-center gap-2">
            <ProgressBar percent={Math.round((completedSteps / flatSteps.length) * 100)} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completedSteps}/{flatSteps.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {completedSteps === 0
              ? "Start reading to track your progress"
              : completedSteps === flatSteps.length
              ? "All steps completed!"
              : `${flatSteps.length - completedSteps} steps remaining`}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/20 p-3">
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <div>
        <p className="text-lg font-bold font-orbitron">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── Chapters Tab ───────────────────────────────────────────────────────────────

function ChaptersTab({
  chapters,
  onJumpToPage,
}: {
  chapters: ChapterHierarchy | null;
  onJumpToPage: (page: number) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (!chapters || chapters.flatIndex.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No chapters detected in this document.
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2 overflow-auto max-h-[60vh]">
      <p className="text-xs text-muted-foreground px-2 pb-2">
        Source: {chapters.source === "outline" ? "PDF bookmarks" : "Heuristic detection"}
      </p>
      {chapters.flatIndex.map((ch) => (
        <ChapterItem
          key={ch.id}
          chapter={ch}
          expanded={expanded}
          onToggle={toggle}
          onJump={onJumpToPage}
        />
      ))}
    </div>
  );
}

function ChapterItem({
  chapter,
  expanded,
  onToggle,
  onJump,
}: {
  chapter: Chapter;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onJump: (page: number) => void;
}) {
  const hasChildren = chapter.children.length > 0;
  const isExpanded = expanded.has(chapter.id);
  const indent = chapter.depth * 4;

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-black/20 cursor-pointer group"
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => hasChildren && onToggle(chapter.id)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="text-xs font-medium flex-1 truncate group-hover:text-primary transition-colors">
          {chapter.title}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onJump(chapter.pageStart);
          }}
          className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          p.{chapter.pageStart}
        </button>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {chapter.children.map((child) => (
            <ChapterItem
              key={child.id}
              chapter={child}
              expanded={expanded}
              onToggle={onToggle}
              onJump={onJump}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Topics Tab ────────────────────────────────────────────────────────────────

function TopicsTab({
  topics,
  onJumpToPage,
}: {
  topics: TopicGraph | null;
  onJumpToPage: (page: number) => void;
}) {
  const [filter, setFilter] = useState<"all" | "concept" | "definition" | "keyword">("all");

  if (!topics || topics.nodes.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No topics extracted from this document.
      </div>
    );
  }

  const filtered = topics.nodes.filter((t) => filter === "all" || t.kind === filter);

  return (
    <div className="space-y-3 p-2 overflow-auto max-h-[60vh]">
      {/* Filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {(["all", "concept", "definition", "keyword"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-0.5 rounded-full text-xs capitalize transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-black/20 text-muted-foreground hover:bg-black/30"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Topic list */}
      <div className="space-y-1">
        {filtered.slice(0, 50).map((topic) => (
          <TopicItem key={topic.id} topic={topic} onJump={onJumpToPage} />
        ))}
      </div>
      {filtered.length > 50 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing 50 of {filtered.length} topics
        </p>
      )}

      {/* Knowledge graph hint */}
      {topics.edges.length > 0 && (
        <div className="rounded-lg bg-black/20 p-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Knowledge Graph
          </h4>
          <p className="text-xs text-muted-foreground">
            {topics.nodes.length} topics · {topics.edges.length} connections
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Topics that frequently appear together are connected in the knowledge graph.
          </p>
        </div>
      )}
    </div>
  );
}

function TopicItem({
  topic,
  onJump,
}: {
  topic: Topic;
  onJump: (page: number) => void;
}) {
  const kindColors: Record<string, string> = {
    concept: "text-neon-cyan",
    definition: "text-primary",
    keyword: "text-muted-foreground",
  };

  return (
    <div className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-black/20 group">
      <span
        className={`text-[10px] uppercase tracking-wider mt-0.5 shrink-0 ${kindColors[topic.kind]}`}
      >
        {topic.kind.slice(0, 3)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{topic.label}</p>
        {topic.definition && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {topic.definition}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground">
            Pages: {topic.pages.slice(0, 3).join(", ")}
            {topic.pages.length > 3 && ` +${topic.pages.length - 3}`}
          </span>
          <button
            onClick={() => onJump(topic.pages[0])}
            className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Jump
          </button>
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {Math.round(topic.weight * 100)}%
      </span>
    </div>
  );
}

// ── Formulas Tab ─────────────────────────────────────────────────────────────

function FormulasTab({
  formulas,
  onJumpToPage,
}: {
  formulas: Formula[] | null;
  onJumpToPage: (page: number) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filterSubject, setFilterSubject] = useState<string>("all");

  if (!formulas || formulas.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No formulas detected in this document.
      </div>
    );
  }

  const subjects = [...new Set(formulas.map((f) => f.subject))];
  const filtered =
    filterSubject === "all"
      ? formulas
      : formulas.filter((f) => f.subject === filterSubject);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3 p-2 overflow-auto max-h-[60vh]">
      {/* Subject filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setFilterSubject("all")}
          className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
            filterSubject === "all"
              ? "bg-primary text-white"
              : "bg-black/20 text-muted-foreground hover:bg-black/30"
          }`}
        >
          All ({formulas.length})
        </button>
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setFilterSubject(s)}
            className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
              filterSubject === s
                ? "bg-primary text-white"
                : "bg-black/20 text-muted-foreground hover:bg-black/30"
            }`}
          >
            {s} ({formulas.filter((f) => f.subject === s).length})
          </button>
        ))}
      </div>

      {/* Formula list */}
      <div className="space-y-2">
        {filtered.map((formula) => (
          <div
            key={formula.id}
            className="rounded-lg bg-black/20 overflow-hidden"
          >
            <button
              className="w-full flex items-start gap-2 p-3 text-left hover:bg-black/10 transition-colors"
              onClick={() => toggle(formula.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-primary break-all">
                  {formula.formula}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  p.{formula.pageNumber} · {formula.subject} ·{" "}
                  {formula.difficulty}
                </p>
              </div>
              {expanded.has(formula.id) ? (
                <ChevronDown className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
              )}
            </button>
            {expanded.has(formula.id) && (
              <div className="px-3 pb-3 border-t border-black/10">
                {formula.variables.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Variables
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {formula.variables.map((v) => (
                        <span
                          key={v}
                          className="px-1.5 py-0.5 rounded bg-primary/20 text-xs font-mono"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {formula.explanation && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Explanation
                    </p>
                    <p className="text-xs">{formula.explanation}</p>
                  </div>
                )}
                <button
                  onClick={() => onJumpToPage(formula.pageNumber)}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Go to page {formula.pageNumber} →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Diagrams Tab ──────────────────────────────────────────────────────────────

function DiagramsTab({
  diagrams,
  onJumpToPage,
}: {
  diagrams: Diagram[] | null;
  onJumpToPage: (page: number) => void;
}) {
  if (!diagrams || diagrams.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No diagrams detected in this document.
      </div>
    );
  }

  const typeIcons: Record<string, string> = {
    figure: "🖼️",
    chart: "📊",
    graph: "📈",
    image: "🖼️",
    illustration: "🎨",
    photo: "📷",
    map: "🗺️",
  };

  return (
    <div className="space-y-2 p-2 overflow-auto max-h-[60vh]">
      {diagrams.map((d) => (
        <div
          key={d.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
        >
          <span className="text-2xl">{typeIcons[d.type] ?? "🖼️"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{d.caption ?? d.type}</p>
            <p className="text-xs text-muted-foreground">
              Page {d.pageNumber} · {d.type}
            </p>
            {d.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {d.description}
              </p>
            )}
          </div>
          <button
            onClick={() => onJumpToPage(d.pageNumber)}
            className="px-2 py-1 rounded bg-primary/20 text-primary text-xs shrink-0"
          >
            Jump
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Tables Tab ───────────────────────────────────────────────────────────────

function TablesTab({
  tables,
  onJumpToPage,
}: {
  tables: PDFTable[] | null;
  onJumpToPage: (page: number) => void;
}) {
  if (!tables || tables.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No tables detected in this document.
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2 overflow-auto max-h-[60vh]">
      {tables.map((t) => (
        <div
          key={t.id}
          className="rounded-lg bg-black/20 p-3 hover:bg-black/30 transition-colors"
        >
          <div className="flex items-start gap-2">
            <span className="text-2xl">📋</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{t.caption ?? "Table"}</p>
              <p className="text-xs text-muted-foreground">
                Page {t.pageNumber} · {t.rows} rows × {t.columns} cols · {t.type}
              </p>
              {t.headers && t.headers.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Headers: {t.headers.join(" · ")}
                </p>
              )}
            </div>
            <button
              onClick={() => onJumpToPage(t.pageNumber)}
              className="px-2 py-1 rounded bg-primary/20 text-primary text-xs shrink-0"
            >
              Jump
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Learning Path Tab ────────────────────────────────────────────────────────

function LearningPathTab({
  lp,
  documentId,
  bookTitle,
  subject,
  pageText,
  onJumpToPage,
}: {
  lp: ReturnType<typeof useLearningPath>;
  documentId: string | null;
  bookTitle?: string;
  subject?: string;
  pageText?: string;
  onJumpToPage: (page: number) => void;
}) {
  const { path: learningPath, steps: hookSteps, generateWithAI, isGenerating, aiError, source } = lp;
  const completedIds = new Set(hookSteps.filter((s) => s.completed).map((s) => s.id));
  const toggleStep = lp.toggleStepCompleted;

  // Auto-generate with AI when analysis produces no path.
  const triedRef = useRef(false);
  useEffect(() => {
    if (triedRef.current) return;
    if (learningPath) return;
    if (isGenerating) return;
    if (!bookTitle && !pageText) return;
    triedRef.current = true;
    generateWithAI({ bookTitle, subject, pageText });
  }, [learningPath, isGenerating, bookTitle, subject, pageText, generateWithAI]);

  if (!learningPath) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground space-y-3">
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
            <p>Generating a personalized learning path with AI…</p>
          </>
        ) : (
          <>
            <Route className="h-6 w-6 mx-auto opacity-60" />
            <p>No learning path yet.</p>
            <button
              onClick={() => generateWithAI({ bookTitle, subject, pageText })}
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs"
            >
              Generate with AI
            </button>
            {aiError && <p className="text-red-400 text-xs">{aiError}</p>}
          </>
        )}
      </div>
    );
  }

  const { beginner, intermediate, advanced } = learningPath;
  const flatSteps = [...beginner, ...intermediate, ...advanced];

  if (flatSteps.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No learning path available.
      </div>
    );
  }

  const levelColors = {
    beginner: "text-green-400",
    intermediate: "text-yellow-400",
    advanced: "text-red-400",
  };

  return (
    <div className="space-y-4 p-2 overflow-auto max-h-[60vh]">
      {/* Source badge */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {source === "ai" ? "AI-generated path" : "Analyzed path"}
        </span>
        <button
          onClick={() => { triedRef.current = true; generateWithAI({ bookTitle, subject, pageText }); }}
          disabled={isGenerating}
          className="text-[10px] text-primary hover:underline disabled:opacity-50"
        >
          {isGenerating ? "Regenerating…" : "Regenerate with AI"}
        </button>
      </div>

      {/* Progress */}
      <div className="rounded-lg bg-black/20 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Overall Progress</span>
          <span className="text-xs font-bold text-primary">
            {completedIds.size}/{flatSteps.length}
          </span>
        </div>
        <ProgressBar
          percent={Math.round((completedIds.size / Math.max(flatSteps.length, 1)) * 100)}
        />
      </div>

      {/* Steps by level */}
      {(["beginner", "intermediate", "advanced"] as const).map((level) => {
        const steps = learningPath[level];
        if (!steps || steps.length === 0) return null;
        return (
          <div key={level}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${levelColors[level]}`}>
              {level} ({steps.filter((s) => completedIds.has(s.id)).length}/{steps.length})
            </h4>
            <div className="space-y-2">
              {steps.map((step) => (
                <LearningStepItem
                  key={step.id}
                  step={step}
                  completed={completedIds.has(step.id)}
                  onToggle={() => { if (documentId) toggleStep(step.id); }}
                  onJump={onJumpToPage}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function LearningStepItem({
  step,
  completed,
  onToggle,
  onJump,
}: {
  step: LearningPathStep;
  completed: boolean;
  onToggle: () => void;
  onJump: (page: number) => void;
}) {
  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        completed ? "border-primary/30 bg-primary/5" : "border-transparent bg-black/20"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={onToggle}
          className="mt-0.5 shrink-0 text-primary hover:text-primary/80 transition-colors"
        >
          {completed ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${completed ? "line-through opacity-60" : ""}`}>
            {step.title}
          </p>
          {step.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {step.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              p.{step.pageStart}
              {step.pageEnd && step.pageEnd !== step.pageStart
                ? `-${step.pageEnd}`
                : ""}
            </span>
            {step.topicIds.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {step.topicIds.length} topics
              </span>
            )}
            <button
              onClick={() => onJump(step.pageStart)}
              className="text-[10px] text-primary hover:underline ml-auto"
            >
              Go →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main AnalysisPanel ────────────────────────────────────────────────────────

export default function AnalysisPanel({
  pdfDoc,
  source,
  onClose,
  onJumpToPage,
  className = "",
  companionCtx,
  secondBook,
  activeTab: activeTabProp,
  onTabChange,
  initialTab = "overview",
  viewMode: viewModeProp,
  onViewModeChange,
}: AnalysisPanelProps) {
  const [internalTab, setInternalTab] = useState<TabId>(initialTab);
  const activeTab = activeTabProp ?? internalTab;
  const setActiveTab = (t: TabId) => {
    if (activeTabProp === undefined) setInternalTab(t);
    onTabChange?.(t);
  };
  const [internalView, setInternalView] = useState<"split" | "full">("split");
  const viewMode = viewModeProp ?? internalView;
  const setViewMode = (m: "split" | "full") => {
    if (viewModeProp === undefined) setInternalView(m);
    onViewModeChange?.(m);
  };

  // Subscribe to store state
  const { status, progress, analysis, error } = useAnalysisState(pdfDoc, source);

  // Get documentId for learning path hook
  const documentId = pdfDoc && source ? computeDocumentId(pdfDoc, source) : null;
  const lp = useLearningPath(documentId, { analysis });
  const learningPath = lp.path;

  const isCompanion = activeTab === "companion";
  const isFull = viewMode === "full";
  const panelStyle: React.CSSProperties = isFull
    ? { width: "100%", minWidth: 0 }
    : { width: isCompanion ? 416 : 320, minWidth: 280 };

  const visibleTabs = companionCtx ? TABS : TABS.filter((t) => t.id !== "companion");

  return (
    <div
      className={`flex flex-col h-full bg-card border-l border-border ${className}`}
      style={panelStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-orbitron text-sm font-bold">Analysis</span>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("split")}
            className={`p-1 rounded transition-colors ${!isFull ? "bg-primary/20 text-primary" : "hover:bg-black/20 text-muted-foreground"}`}
            title="Split screen with PDF"
            aria-label="Split screen"
          >
            <Columns2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode(isFull ? "split" : "full")}
            className={`p-1 rounded transition-colors ${isFull ? "bg-primary/20 text-primary" : "hover:bg-black/20 text-muted-foreground"}`}
            title={isFull ? "Shrink to side panel" : "Fullscreen analysis"}
            aria-label={isFull ? "Shrink view" : "Fullscreen view"}
          >
            {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/20 transition-colors"
            aria-label="Close analysis"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress */}
      {status !== "idle" && status !== "complete" && progress && (
        <div className="px-3 py-2 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">
              {progress.currentStep}
            </span>
            <span className="text-xs text-muted-foreground">
              {progress.percent}%
            </span>
          </div>
          <ProgressBar percent={progress.percent} />
        </div>
      )}

      {/* Error */}
      {status === "error" && error && (
        <div className="px-3 py-2 border-b border-border bg-red-500/10 shrink-0">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto shrink-0">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "overview" && (
          <OverviewTab
            analysis={analysis}
            progress={progress}
          />
        )}
        {activeTab === "chapters" && (
          <ChaptersTab chapters={analysis?.chapters ?? null} onJumpToPage={onJumpToPage} />
        )}
        {activeTab === "topics" && (
          <TopicsTab topics={analysis?.topics ?? null} onJumpToPage={onJumpToPage} />
        )}
        {activeTab === "formulas" && (
          <FormulasTab formulas={analysis?.formulas ?? null} onJumpToPage={onJumpToPage} />
        )}
        {activeTab === "diagrams" && (
          <DiagramsTab diagrams={analysis?.diagrams ?? null} onJumpToPage={onJumpToPage} />
        )}
        {activeTab === "tables" && (
          <TablesTab tables={analysis?.tables ?? null} onJumpToPage={onJumpToPage} />
        )}
        {activeTab === "path" && (
          <LearningPathTab
            lp={lp}
            documentId={documentId}
            bookTitle={companionCtx?.bookTitle ?? analysis?.metadata?.title ?? undefined}
            subject={companionCtx?.subject}
            pageText={companionCtx?.pageText}
            onJumpToPage={onJumpToPage}
          />
        )}
        {activeTab === "tutor" && (
          companionCtx ? (
            <div className="h-full overflow-y-auto">
              <LibraryAITutorTab ctx={companionCtx} secondBook={secondBook ?? null} />
            </div>
          ) : (
            <TutorController
              initialSubject={companionCtx?.subject ?? analysis?.metadata?.title}
              grade={companionCtx?.grade}
              language={undefined}
            />
          )
        )}
        {activeTab === "companion" && companionCtx && (
          <div className="h-full overflow-y-auto p-2">
            <LibraryStudyCompanionTab ctx={companionCtx} />
          </div>
        )}
      </div>
    </div>
  );
}

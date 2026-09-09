// @ts-nocheck
import React, { useState } from "react";
import { Loader2, Send, Sparkles, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAITutor } from "../hooks/useAITutor";
import { UniversalRenderer } from "../renderers/UniversalRenderer";
import { toast } from "sonner";

/**
 * TutorController — the interactive lesson surface for AI Tutor 2.0.
 * Additive: mounted inside the existing AITutor page behind a ?tutor=v2 flag.
 */
export const TutorController: React.FC<{
  initialSubject?: string;
  initialTopic?: string;
  initialQuestion?: string;
  pdfContext?: string;
  grade?: number;
  language?: string;
}> = ({ initialSubject, initialTopic, initialQuestion, pdfContext, grade, language }) => {
  const { currentLesson, history, loading, error, ask } = useAITutor();
  const [q, setQ] = useState("");
  const autoRunDone = React.useRef(false);

  React.useEffect(() => {
    if (autoRunDone.current) return;
    const initialPrompt = initialQuestion || (initialTopic ? `Teach me about ${initialTopic}` : undefined);
    if (initialPrompt && !currentLesson && !loading) {
      autoRunDone.current = true;
      ask({
        question: initialPrompt,
        subjectHint: initialSubject,
        context: { grade, language, pdfSnippet: pdfContext },
      }).catch((e: any) => toast.error(e?.message || "Tutor initial query failed"));
    }
  }, [initialQuestion, initialTopic, initialSubject, pdfContext, grade, language, currentLesson, loading, ask]);

  const run = async (overrideQ?: string) => {
    const question = (overrideQ || q).trim();
    if (!question || loading) return;
    if (!overrideQ) setQ("");
    try {
      await ask({
        question,
        subjectHint: initialSubject,
        context: { grade, language, pdfSnippet: pdfContext },
      });
    } catch (e: any) {
      toast.error(e?.message || "Tutor failed");
    }
  };

  const starterChips = [
    `Explain core concepts in ${initialSubject || "this topic"}`,
    `Derive key formulas & equations`,
    `Provide a worked step-by-step example`,
    `Create a 3-question quick quiz`,
    `Generate revision flashcards`,
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentLesson && !loading && (
          <div className="text-center text-muted-foreground text-sm py-8 space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-cyan-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground font-orbitron">MargeOS AI Teacher Engine V2</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                {pdfContext
                  ? "Connected to active PDF context. Ask any question to generate concept cards, formula derivations, code breakdowns, or quizzes."
                  : "Ask a question — the tutor will build an interactive lesson with cards, worked examples, and quick checks."}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto pt-2">
              {starterChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => run(chip)}
                  className="px-3 py-1.5 text-xs rounded-lg glass border border-primary/20 hover:border-cyan-400/50 hover:bg-cyan-500/10 text-foreground transition-all text-left font-poppins"
                >
                  ✨ {chip}
                </button>
              ))}
            </div>
          </div>
        )}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-2 p-6 bg-cyan-500/5 rounded-xl border border-cyan-500/20 text-cyan-400 text-sm">
            <div className="flex items-center gap-2 font-orbitron text-xs tracking-wider">
              <Cpu className="h-4 w-4 animate-pulse text-cyan-400" />
              <span>Generating AI lesson...</span>
            </div>
          </div>
        )}
        {error && <div className="p-3 text-destructive bg-destructive/10 rounded-xl text-sm border border-destructive/20">{error}</div>}
        {currentLesson && <UniversalRenderer lesson={currentLesson} />}
        {history.length > 1 && (
          <details className="mt-6 opacity-80">
            <summary className="cursor-pointer text-xs text-muted-foreground font-mono hover:text-foreground">Previous lessons ({history.length - 1})</summary>
            <div className="mt-3 space-y-4">
              {history.slice(1).map((l) => <UniversalRenderer key={l.id} lesson={l} />)}
            </div>
          </details>
        )}
      </div>
      <div className="p-3 border-t border-border bg-background/60 backdrop-blur">
        <div className="flex gap-2 items-end">
          <Textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(); } }}
            placeholder="Ask anything — e.g. Explain quantum tunneling, or Solve 2x+5=13"
            className="min-h-[44px] max-h-40 resize-none font-poppins text-xs"
            aria-label="Ask the tutor"
          />
          <Button onClick={() => run()} disabled={loading || !q.trim()} aria-label="Send question" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

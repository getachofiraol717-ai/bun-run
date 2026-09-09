import React, { useState, useRef, useCallback } from 'react';
import { CompanionContext, SecondBookRef } from './types';
import { libraryAiStream } from './libraryAiClient';
import {
  ChatInterface,
  CardRenderer,
  TeachingService,
} from '@/plugins/margeos/ai-tutor-engine';
import type { ChatMessageItem } from '@/plugins/margeos/ai-tutor-engine/components';
import type { LearningStyle } from '@/plugins/margeos/ai-tutor-engine/models/LearningStyle';
import type { ExplanationMode } from '@/plugins/margeos/ai-tutor-engine/models/StudentProfile';
import { Sparkles, FileText, HelpCircle, Brain, Sigma, Network, BookMarked, Code } from 'lucide-react';
import libraryAiTutorImg from '@/assets/images/library_ai_tutor_1786932398236.jpg';

interface LibraryAITutorTabProps {
  ctx: CompanionContext;
  language?: string;
  secondBook?: SecondBookRef | null;
}

export const LibraryAITutorTab: React.FC<LibraryAITutorTabProps> = ({
  ctx,
  language = 'en',
  secondBook,
}) => {
  const [currentStyle, setCurrentStyle] = useState<LearningStyle | string>('visual');
  const [currentMode, setCurrentMode] = useState<ExplanationMode>('simple');
  const [busy, setBusy] = useState<boolean>(false);
  const [activeCard, setActiveCard] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Hello! I am your AI Private Tutor for **${ctx.bookTitle}** (Page ${ctx.currentPage}). I am sitting right beside you to explain concepts, formulas, diagrams, generate practice quizzes, and draw concept maps!`,
      timestamp: 'Just now',
      conceptLabel: ctx.subject || 'Library Tutor',
    },
  ]);

  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || busyRef.current) return;

      const userMsgId = `u_${Date.now()}`;
      const aiMsgId = `ai_${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, sender: 'user', text, timestamp: 'Just now' },
        { id: aiMsgId, sender: 'ai', text: '', timestamp: 'Just now', isStreaming: true },
      ]);

      busyRef.current = true;
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const hist = messages
          .filter((m) => m.text.trim())
          .slice(-8)
          .map((m) => ({ role: (m.sender === 'user' ? 'user' : 'assistant') as "user" | "assistant", content: m.text }));

        let accumulated = "";
        await libraryAiStream(
          {
            mode: 'companion',
            subject: ctx.subject || ctx.bookTitle || 'General',
            pageText: ctx.pageText,
            pageNumber: ctx.currentPage,
            bookTitle: ctx.bookTitle,
            prompt: text,
            history: hist,
          },
          (delta) => {
            accumulated += delta;
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? { ...m, text: accumulated } : m))
            );
          },
          { signal: controller.signal }
        );
      } catch (err: any) {
        const errText = err?.name === 'AbortError' ? '⚠️ Generation stopped.' : `⚠️ ${err.message || 'Error fetching tutor response.'}`;
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, text: m.text + '\n' + errText } : m))
        );
      } finally {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false } : m))
        );
        busyRef.current = false;
        setBusy(false);
        abortRef.current = null;
      }
    },
    [messages, currentStyle, language, ctx]
  );

  const triggerCardTool = (type: string) => {
    const topic = ctx.bookTitle || "Page Concepts";
    let card: any = null;
    switch (type) {
      case 'summary':
        card = { type: 'summary', data: TeachingService.getSummaryCard(topic, ctx.pageText) };
        break;
      case 'quiz':
        card = { type: 'quiz', data: TeachingService.getQuizCard(topic) };
        break;
      case 'flashcard':
        card = { type: 'flashcard', data: TeachingService.getFlashcardCard(topic) };
        break;
      case 'formula':
        card = { type: 'formula', data: TeachingService.getFormulaCard(topic) };
        break;
      case 'visual':
        card = { type: 'visual', data: TeachingService.getVisualCard(topic) };
        break;
      case 'reference':
        card = { type: 'reference', data: TeachingService.getRecommendationCard(topic) };
        break;
      default:
        break;
    }
    setActiveCard(card);
  };

  return (
    <div className="p-3 space-y-4 overflow-y-auto max-h-full">
      {/* Top Graphic Card for Academic AI Tutor */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card/90 p-3 shadow-md flex items-center gap-3">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-primary/20">
          <img
            src={libraryAiTutorImg}
            alt="Library AI Tutor"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[11px] font-orbitron font-semibold text-primary">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>Academic AI Tutor Companion</span>
          </div>
          <div className="text-xs font-semibold text-foreground truncate mt-0.5">
            {ctx.bookTitle}
          </div>
          <div className="text-[11px] text-muted-foreground font-poppins line-clamp-1">
            Analyzing page {ctx.currentPage} · Live formulas, quiz & summaries
          </div>
        </div>
      </div>

      {/* Quick Interactive Proactive Tools */}
      <div className="p-3 bg-card/80 border border-primary/20 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Proactive AI Tutor Tools
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">Page {ctx.currentPage}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            onClick={() => triggerCardTool('summary')}
            className="px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center gap-1"
          >
            <FileText className="h-3 w-3" /> Summarize Section
          </button>
          <button
            onClick={() => triggerCardTool('quiz')}
            className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-1"
          >
            <HelpCircle className="h-3 w-3" /> Practice Quiz
          </button>
          <button
            onClick={() => triggerCardTool('flashcard')}
            className="px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex items-center gap-1"
          >
            <Brain className="h-3 w-3" /> Flashcard
          </button>
          <button
            onClick={() => triggerCardTool('formula')}
            className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1"
          >
            <Sigma className="h-3 w-3" /> Formulas
          </button>
          <button
            onClick={() => triggerCardTool('visual')}
            className="px-2.5 py-1 rounded-xl bg-pink-500/10 text-pink-300 border border-pink-500/20 hover:bg-pink-500/20 transition-all flex items-center gap-1"
          >
            <Network className="h-3 w-3" /> Concept Map
          </button>
          <button
            onClick={() => triggerCardTool('reference')}
            className="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-1"
          >
            <BookMarked className="h-3 w-3" /> References
          </button>
        </div>
      </div>

      {/* Render Active Response Card if generated */}
      {activeCard && (
        <div className="relative">
          <button
            onClick={() => setActiveCard(null)}
            className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-foreground z-10 px-2 py-0.5 rounded bg-muted/60"
          >
            Close Card
          </button>
          <CardRenderer card={activeCard} />
        </div>
      )}

      {/* Primary Chat Interface */}
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={busy}
        currentMode={currentMode}
        currentStyle={currentStyle as LearningStyle}
        onStyleChange={(st) => setCurrentStyle(st as LearningStyle)}
        onModeChange={(md) => setCurrentMode(md)}
        progressPercent={75}
        showCarousel={true}
        showCompare={true}
      />
    </div>
  );
};

export default LibraryAITutorTab;

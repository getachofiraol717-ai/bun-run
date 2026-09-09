import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Send, 
  Bot, 
  User, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Square,
  Trash2,
  History,
  Plus,
  MessageSquare,
  X,
  Clock,
  Sparkles,
  RotateCcw,
  BookOpen,
  Calculator,
  Atom,
  Dna,
  Code2,
  Globe,
  AlertCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import GalaxyBackground from "@/components/GalaxyBackground";
import SEO from "@/components/SEO";
import { aiStream } from "@/pages/creator/aiClient";
import { toast } from "sonner";
import { 
  ChatSession, 
  ChatMessage, 
  getStoredSessions, 
  saveStoredSessions, 
  getStoredActiveSessionId, 
  setStoredActiveSessionId, 
  createNewSession, 
  generateSessionTitle 
} from "@/services/aiChatStateManager";

// Safe Markdown wrapper with error fallback
interface SafeMarkdownProps {
  content: string;
}

class MarkdownErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackText: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallbackText: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn("Markdown rendering fallback:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="whitespace-pre-wrap font-mono text-xs text-foreground/90 leading-relaxed">
          {this.props.fallbackText}
        </div>
      );
    }
    return this.props.children;
  }
}

const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content }) => {
  return (
    <MarkdownErrorBoundary fallbackText={content}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </MarkdownErrorBoundary>
  );
};

// Academic Subject Chips
interface SubjectOption {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SUBJECT_PRESETS: SubjectOption[] = [
  { id: "all", name: "All Subjects", icon: Sparkles, color: "text-primary" },
  { id: "math", name: "Mathematics", icon: Calculator, color: "text-cyan-400" },
  { id: "physics", name: "Physics", icon: Atom, color: "text-amber-400" },
  { id: "biology", name: "Biology", icon: Dna, color: "text-emerald-400" },
  { id: "cs", name: "Computer Science", icon: Code2, color: "text-purple-400" },
  { id: "history", name: "History & Social", icon: Globe, color: "text-rose-400" },
  { id: "literature", name: "Writing & Reading", icon: BookOpen, color: "text-blue-400" },
];

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  all: [
    "📐 Solve step-by-step: Find the derivative of f(x) = x³ · sin(x)",
    "🧬 Explain how CRISPR gene editing works in plain English",
    "⚛️ Walk me through Newton's Third Law with real-world examples",
    "💻 Explain Big-O notation with quick TypeScript code examples",
  ],
  math: [
    "📐 Derive the Quadratic Formula step-by-step",
    "📊 How do limits and continuity work in Calculus?",
    "🎲 Explain the difference between Permutations and Combinations",
    "📐 Solve: 2x² - 8x + 6 = 0 with complete explanations",
  ],
  physics: [
    "⚛️ Derive Einstein's mass-energy equivalence E = mc²",
    "⚡ What is the difference between AC and DC current?",
    "🪐 Explain Kepler's laws of planetary motion",
    "🌊 How does wave-particle duality work in quantum mechanics?",
  ],
  biology: [
    "🧬 Explain the leading and lagging strand in DNA replication",
    "🍃 Describe the light and dark reactions of photosynthesis",
    "🧫 What is the difference between mitosis and meiosis?",
    "🧠 How do neurotransmitters transmit signals across synapses?",
  ],
  cs: [
    "💻 Explain how the QuickSort algorithm works with code",
    "🔄 What is the difference between synchronous and asynchronous JS?",
    "🌳 Explain binary search trees with an insertion example",
    "🛡️ What are SQL injection attacks and how do we prevent them?",
  ],
  history: [
    "📜 What were the primary causes of World War I?",
    "🏛️ How did the Silk Road shape global trade and culture?",
    "⚖️ Explain the significance of the Magna Carta in modern law",
    "🌍 Summarize the key achievements of the Ancient Egyptian civilization",
  ],
  literature: [
    "✍️ How do I write a compelling thesis statement for an essay?",
    "📖 Explain the difference between metaphor, simile, and analogy",
    "🎭 What are the major themes in Shakespeare's Hamlet?",
    "📝 Help me outline a persuasive argument on renewable energy",
  ],
};

const AITutor: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlTopic = searchParams.get("topic") || searchParams.get("q") || "";

  // Sessions state with validation
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const stored = getStoredSessions();
    if (stored.length > 0) return stored;
    const initial = createNewSession();
    saveStoredSessions([initial]);
    setStoredActiveSessionId(initial.id);
    return [initial];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const storedId = getStoredActiveSessionId();
    const stored = getStoredSessions();
    if (storedId && stored.some((s) => s.id === storedId)) {
      return storedId;
    }
    return stored[0]?.id || "";
  });

  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>("");

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialTopicHandledRef = useRef<boolean>(false);

  // Active session object (strictly guarded)
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  const messages = Array.isArray(activeSession?.messages) ? activeSession.messages : [];

  // Persist sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      saveStoredSessions(sessions);
    }
  }, [sessions]);

  // Persist active session id
  useEffect(() => {
    if (activeSessionId) {
      setStoredActiveSessionId(activeSessionId);
    }
  }, [activeSessionId]);

  // Scroll to bottom when messages update
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const startNewConversation = useCallback(() => {
    stopStreaming();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      setSpeakingMessageId(null);
    }
    const newSession = createNewSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setShowHistoryDrawer(false);
    toast.success("Started new lesson");
  }, [stopStreaming]);

  const selectConversation = useCallback((id: string) => {
    stopStreaming();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      setSpeakingMessageId(null);
    }
    setActiveSessionId(id);
    setShowHistoryDrawer(false);
  }, [stopStreaming]);

  const deleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    if (updated.length === 0) {
      const fresh = createNewSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      setSessions(updated);
      if (activeSessionId === id) {
        setActiveSessionId(updated[0].id);
      }
    }
    toast.success("Lesson history deleted");
  };

  const copyMessage = async (id: string, text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.warn("Clipboard copy failed:", err);
      toast.error("Unable to copy to clipboard in this browser");
    }
  };

  const toggleSpeech = (id: string, text: string) => {
    try {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        toast.error("Speech synthesis is not supported in this environment.");
        return;
      }

      if (speakingMessageId === id) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
        return;
      }

      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#`_~]/g, "").replace(/\[.*?\]\(.*?\)/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);

      setSpeakingMessageId(id);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis unavailable:", err);
      setSpeakingMessageId(null);
      toast.error("Audio playback is unavailable in this browser environment.");
    }
  };

  const clearCurrentChat = () => {
    stopStreaming();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      setSpeakingMessageId(null);
    }
    const welcomeMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: "👋 Lesson cleared! What would you like to explore next?",
      timestamp: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: "New Lesson",
              updatedAt: Date.now(),
              messages: [welcomeMsg],
            }
          : s
      )
    );
  };

  const sendMessage = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isStreaming || !activeSession) return;

    if (!customText) setInput("");
    setLastUserPrompt(textToSend);

    // Create user message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: Date.now(),
    };

    const assistantMsgId = `assistant_${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    const currentHistory = Array.isArray(activeSession.messages) ? activeSession.messages : [];
    const newHistory = [...currentHistory, userMsg];

    // Determine auto-title if session title is still default
    const isFirstUserMsg = !currentHistory.some((m) => m.role === "user");
    const updatedTitle = isFirstUserMsg
      ? generateSessionTitle(textToSend)
      : activeSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: updatedTitle,
              updatedAt: Date.now(),
              messages: [...newHistory, assistantMsg],
            }
          : s
      )
    );

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const subjectTag = selectedSubject !== "all" ? `[Focus: ${selectedSubject.toUpperCase()}] ` : "";
      const apiMessages = [
        {
          role: "system" as const,
          content: `You are Knowledge Universe's MargeOS AI Tutor, an elite, patient, and pedagogically sound academic tutor.
Your mission is to help students from Grade 1 through College master any subject through clear conceptual breakdowns, step-by-step worked examples, intuitive real-world analogies, and checking for understanding.
Format your responses beautifully with Markdown:
- Use clear ## and ### headings.
- Break steps into bullet points or numbered lists.
- Highlight key terms in **bold**.
- Wrap mathematical equations cleanly in LaTeX format (e.g. $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$).
- Wrap code blocks in standard triple backticks with syntax highlighting.
- End with a thought-provoking follow-up question or quick check to reinforce learning.`,
        },
        ...newHistory
          .filter((m) => m && m.id !== "welcome" && typeof m.content === "string")
          .map((m) => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.role === "user" && m.id === userMsg.id ? `${subjectTag}${m.content}` : m.content,
          })),
      ];

      let accumulated = "";

      await aiStream({
        messages: apiMessages,
        mode: "general",
        provider: "gemini",
        autoSwitch: true,
        onToken: (delta) => {
          accumulated += delta;
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    updatedAt: Date.now(),
                    messages: s.messages.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: accumulated }
                        : msg
                    ),
                  }
                : s
            )
          );
        },
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // User deliberately stopped generation
      } else {
        const errorText = err?.message || "Failed to generate tutor response.";
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  updatedAt: Date.now(),
                  messages: s.messages.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          content:
                            msg.content ||
                            `⚠️ ${errorText}\n\nClick **Retry** below to regenerate this response.`,
                        }
                      : msg
                  ),
                }
              : s
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Run initial topic if provided via query params (once only)
  useEffect(() => {
    if (urlTopic && !initialTopicHandledRef.current && activeSession && messages.length <= 1) {
      initialTopicHandledRef.current = true;
      sendMessage(urlTopic);
    }
  }, [urlTopic, activeSession, messages.length]);

  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const hasUserMessages = messages.some((m) => m.role === "user");
  const currentPrompts = SUGGESTED_PROMPTS[selectedSubject] || SUGGESTED_PROMPTS.all;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col pt-16">
      <SEO
        title="MargeOS AI Tutor — Knowledge Universe"
        description="Interactive AI Tutor with subject filters, step-by-step problem solver, and persistent lesson history in MargeOS."
      />
      <GalaxyBackground />

      <div className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 flex flex-col pb-4 h-[calc(100vh-4.5rem)]">
        {/* Top Navigation & History Controls */}
        <div className="flex items-center justify-between py-2.5 border-b border-border/40 backdrop-blur-md shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <button
              id="ai-tutor-history-btn"
              onClick={() => setShowHistoryDrawer(true)}
              className="p-2 rounded-xl glass border border-border/50 text-foreground hover:border-primary/50 hover:bg-primary/10 transition-all flex items-center gap-1.5"
              title="View Lesson History"
              aria-label="View Lesson History"
            >
              <History className="h-4 w-4 text-primary" />
              <span className="text-xs font-poppins font-medium hidden sm:inline">Lessons</span>
            </button>

            <button
              id="ai-tutor-new-chat-btn"
              onClick={startNewConversation}
              className="p-2 rounded-xl glass border border-border/50 text-foreground hover:border-primary/50 hover:bg-primary/10 transition-all flex items-center gap-1.5"
              title="New Lesson"
              aria-label="New Lesson"
            >
              <Plus className="h-4 w-4 text-primary" />
              <span className="text-xs font-poppins font-medium hidden sm:inline">New Lesson</span>
            </button>
          </div>

          <div className="flex items-center gap-2 min-w-0 max-w-[220px] sm:max-w-[360px]">
            <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1 text-[10px] border-primary/40 bg-primary/10 text-primary">
              <Sparkles className="h-2.5 w-2.5" />
              <span>AI Tutor Engine</span>
            </Badge>
            <h1 className="text-xs sm:text-sm font-bold font-orbitron text-foreground truncate text-center">
              {activeSession?.title || "AI Tutor"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 1 && (
              <button
                id="ai-tutor-clear-chat-btn"
                onClick={clearCurrentChat}
                className="p-2 rounded-xl glass border border-border/50 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                title="Clear Current Lesson"
                aria-label="Clear Current Lesson"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Subject Quick Selector Bar */}
        <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-b border-border/30">
          {SUBJECT_PRESETS.map((s) => {
            const Icon = s.icon;
            const isSelected = selectedSubject === s.id;
            return (
              <button
                key={s.id}
                id={`subject-tab-${s.id}`}
                onClick={() => setSelectedSubject(s.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "glass border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-primary-foreground" : s.color}`} />
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>

        {/* Chat History Sidebar / Drawer */}
        {showHistoryDrawer && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowHistoryDrawer(false)}
            />

            {/* Slide-in Drawer */}
            <div className="relative w-full max-w-sm bg-card/95 border-r border-border/80 h-full p-4 flex flex-col shadow-2xl backdrop-blur-xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold font-orbitron text-foreground">
                    Lesson History
                  </h2>
                </div>
                <button
                  id="ai-tutor-close-drawer-btn"
                  onClick={() => setShowHistoryDrawer(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="Close History"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* New Chat Button */}
              <div className="py-3">
                <Button
                  id="ai-tutor-drawer-new-btn"
                  onClick={startNewConversation}
                  className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary hover:text-primary text-xs font-poppins flex items-center justify-center gap-2 h-9 rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Start New Lesson</span>
                </Button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {sessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => selectConversation(session.id)}
                      className={`p-2.5 rounded-xl text-left text-xs font-poppins transition-all cursor-pointer flex items-center justify-between group ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                          : "glass border border-border/40 hover:bg-muted/60 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <MessageSquare
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isActive ? "text-primary-foreground" : "text-muted-foreground"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">
                            {session.title}
                          </p>
                          <span
                            className={`text-[10px] flex items-center gap-1 ${
                              isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                            }`}
                          >
                            <Clock className="h-2.5 w-2.5" />
                            {formatTimestamp(session.updatedAt || session.createdAt)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => deleteConversation(e, session.id)}
                        className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                          isActive
                            ? "hover:bg-primary-foreground/20 text-primary-foreground"
                            : "hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                        }`}
                        title="Delete Lesson"
                        aria-label="Delete Lesson"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-border/60 text-[10px] text-muted-foreground text-center font-mono">
                {sessions.length} saved lesson{sessions.length === 1 ? "" : "s"} in local storage
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 sm:pr-2">
          {/* Welcome Card & Starter Prompts (Shown if no user prompt yet) */}
          {!hasUserMessages && (
            <div className="p-4 sm:p-5 rounded-2xl glass border border-border/70 bg-card/60 backdrop-blur-md shadow-md space-y-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-cyan-500 to-blue-600 text-primary-foreground flex items-center justify-center shrink-0 shadow-lg">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-orbitron text-foreground">
                    Knowledge Universe AI Tutor
                  </h3>
                  <p className="text-xs text-muted-foreground font-poppins">
                    Select a prompt or ask any question to start learning with step-by-step guidance.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40">
                <p className="text-[11px] font-semibold text-foreground/80 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>Suggested Questions:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPrompts.map((promptText, idx) => (
                    <button
                      key={idx}
                      id={`starter-prompt-${idx}`}
                      onClick={() => sendMessage(promptText)}
                      className="p-2.5 rounded-xl text-left text-xs text-foreground/90 glass border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-start gap-2 group"
                    >
                      <span className="text-primary font-bold text-xs shrink-0 group-hover:translate-x-0.5 transition-transform">→</span>
                      <span className="line-clamp-2">{promptText}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Render Active Session Messages */}
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            const isErrorMsg = !isUser && typeof msg.content === "string" && msg.content.includes("⚠️");

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-sm animate-fade-in ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-cyan-500 to-blue-600 text-primary-foreground flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-4 space-y-2 shadow-md backdrop-blur-md transition-all ${
                    isUser
                      ? "bg-primary text-primary-foreground ml-8 rounded-br-none"
                      : isErrorMsg
                      ? "bg-destructive/10 text-foreground border border-destructive/40 rounded-bl-none glass"
                      : "bg-card/85 text-foreground border border-border/70 rounded-bl-none glass"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 text-[11px] opacity-75">
                    <span className="font-semibold font-orbitron">
                      {isUser ? "You" : "AI Tutor"}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!isUser && msg.content && (
                        <>
                          <button
                            onClick={() => toggleSpeech(msg.id, msg.content)}
                            className="p-1 hover:bg-muted/50 rounded transition-colors"
                            title="Read Aloud"
                            aria-label="Read Aloud"
                          >
                            {speakingMessageId === msg.id ? (
                              <VolumeX className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                            ) : (
                              <Volume2 className="h-3.5 w-3.5 hover:text-primary" />
                            )}
                          </button>
                          <button
                            onClick={() => copyMessage(msg.id, msg.content)}
                            className="p-1 hover:bg-muted/50 rounded transition-colors"
                            title="Copy Response"
                            aria-label="Copy Response"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 hover:text-primary" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="prose prose-sm dark:prose-invert max-w-none font-poppins leading-relaxed break-words">
                    {msg.content ? (
                      <SafeMarkdown content={msg.content} />
                    ) : isStreaming ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
                        <span>Formulating explanation...</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">No response</span>
                    )}
                  </div>

                  {/* Retry Button if an error occurred */}
                  {isErrorMsg && !isStreaming && lastUserPrompt && (
                    <div className="pt-2 border-t border-destructive/20 flex items-center justify-between">
                      <span className="text-[11px] text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Generation encountered an issue</span>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendMessage(lastUserPrompt)}
                        className="h-7 text-xs border-destructive/40 hover:bg-destructive/10 text-destructive flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Retry</span>
                      </Button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-muted border border-border text-foreground flex items-center justify-center shrink-0 shadow-sm">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="pt-2 shrink-0">
          <div className="p-3 rounded-2xl glass border border-border/80 bg-card/90 shadow-2xl space-y-2 backdrop-blur-xl">
            <div className="flex gap-2 items-end">
              <Textarea
                id="ai-tutor-query-input"
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask your AI Tutor anything (e.g., 'Derive formula', 'Explain concept', 'Give me a quiz')..."
                className="min-h-[50px] max-h-36 resize-none font-poppins text-xs sm:text-sm bg-background/50 border-border/60 focus-visible:ring-primary shadow-inner"
                rows={1}
              />

              {isStreaming ? (
                <Button
                  id="ai-tutor-stop-btn"
                  onClick={stopStreaming}
                  variant="destructive"
                  className="h-[50px] px-4 rounded-xl font-orbitron text-xs flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <Square className="h-4 w-4 fill-current" />
                  <span>Stop</span>
                </Button>
              ) : (
                <Button
                  id="ai-tutor-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  className="h-[50px] px-5 bg-gradient-to-r from-primary via-cyan-500 to-blue-600 hover:from-primary/90 text-primary-foreground font-orbitron font-semibold text-xs shadow-lg flex items-center gap-2 shrink-0 rounded-xl"
                >
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 font-mono">
              <span>Press Shift + Enter for new line</span>
              <span>Active Subject: {SUBJECT_PRESETS.find(s => s.id === selectedSubject)?.name || "All"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITutor;

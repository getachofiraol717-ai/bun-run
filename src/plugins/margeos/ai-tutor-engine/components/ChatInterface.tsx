// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, HelpCircle, Lightbulb, CheckCircle2, AlertCircle, RefreshCw, Volume2, Mic, MicOff, SlidersHorizontal, Sliders, BookOpen } from 'lucide-react';
import type { TutorMessage } from '../models/TutorMessage';
import type { ExplanationMode, StudentProfile } from '../models/StudentProfile';
import type { LearningStyle } from '../models/LearningStyle';
import Header from './Header';
import StyleCarousel from './StyleCarousel';
import CompareSlider from './CompareSlider';
import ScrollableCard from './ScrollableCard';

export interface ChatMessageItem {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  conceptLabel?: string;
  type?: string;
  isStreaming?: boolean;
}

export interface ChatInterfaceProps {
  messages?: ChatMessageItem[];
  onSendMessage?: (text: string) => void;
  onQuickAction?: (actionType: 'explain' | 'example' | 'confused' | 'quiz') => void;
  isLoading?: boolean;
  currentMode?: ExplanationMode;
  currentStyle?: LearningStyle;
  onStyleChange?: (style: LearningStyle | string) => void;
  onModeChange?: (mode: ExplanationMode) => void;
  progressPercent?: number;
  showCarousel?: boolean;
  showCompare?: boolean;
  className?: string;
}

const DEFAULT_INITIAL_MESSAGES: ChatMessageItem[] = [
  {
    id: 'msg-1',
    sender: 'ai',
    text: "👋 Welcome to your AI Tutor session! I'm ready to walk you through concepts step-by-step. What would you like to explore or clarify today?",
    timestamp: 'Just now',
    conceptLabel: 'Session Start',
    type: 'page_intro',
  },
];

const SAMPLE_REFERENCE_ITEMS = [
  { id: 1, title: 'Linear Momentum Equation', text: 'Linear momentum p = m * v. Expressed in kg*m/s or Newton-seconds (N*s). Vector direction matches velocity.', category: 'Formula' },
  { id: 2, title: 'Law of Conservation of Momentum', text: 'In an isolated physical system with no external net forces, the total momentum before collision equals total momentum after collision.', category: 'Law' },
  { id: 3, title: 'Elastic vs Inelastic Collisions', text: 'In elastic collisions both kinetic energy and momentum are conserved. In inelastic collisions, kinetic energy is partially lost to heat/deformation.', category: 'Concept' },
  { id: 4, title: 'Impulse-Momentum Theorem', text: 'Impulse J = Force * Delta_t = Delta_p. Applying a force over time causes a proportional change in momentum.', category: 'Theorem' },
  { id: 5, title: 'Relativistic Momentum', text: 'At speeds approaching speed of light c, momentum is modified by the Lorentz factor gamma: p = gamma * m * v.', category: 'Advanced' },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages = DEFAULT_INITIAL_MESSAGES,
  onSendMessage,
  onQuickAction,
  isLoading = false,
  currentMode = 'standard',
  currentStyle = 'visual',
  onStyleChange,
  onModeChange,
  progressPercent = 50,
  showCarousel = true,
  showCompare = false,
  className = '',
}) => {
  const [inputText, setInputText] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'compare' | 'style' | 'reference'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    if (onSendMessage) {
      onSendMessage(inputText);
    }
    setInputText('');
  };

  const handleQuickClick = (action: 'explain' | 'example' | 'confused' | 'quiz', label: string) => {
    if (onQuickAction) {
      onQuickAction(action);
    } else if (onSendMessage) {
      onSendMessage(label);
    }
  };

  return (
    <div className={`flex flex-col w-full h-full flex-1 min-h-0 ${className}`}>
      <div className="glass-strong rounded-2xl border border-border/80 shadow-xl overflow-hidden flex flex-col flex-1 min-h-[480px] lg:min-h-[580px] h-full">
        {/* Quick Action Bar / Prompt Chips */}
        <div className="p-2.5 sm:p-3 bg-muted/30 border-b border-border/40 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono text-muted-foreground uppercase px-1">
              Quick Actions:
            </span>
            <button
              onClick={() => handleQuickClick('explain', 'Can you explain this simply (ELI5)?')}
              className="px-2.5 py-1 rounded-lg glass hover:bg-primary/20 hover:border-primary/40 text-xs font-poppins text-foreground flex items-center gap-1 shrink-0 border border-border/40 transition-colors"
            >
              <Lightbulb className="h-3 w-3 text-amber-400" />
              <span>Explain simply</span>
            </button>
            <button
              onClick={() => handleQuickClick('example', 'Give me a real-world example.')}
              className="px-2.5 py-1 rounded-lg glass hover:bg-primary/20 hover:border-primary/40 text-xs font-poppins text-foreground flex items-center gap-1 shrink-0 border border-border/40 transition-colors"
            >
              <Sparkles className="h-3 w-3 text-cyan-400" />
              <span>Give example</span>
            </button>
            <button
              onClick={() => handleQuickClick('confused', 'I am confused, please re-explain.')}
              className="px-2.5 py-1 rounded-lg glass hover:bg-destructive/20 hover:border-destructive/40 text-xs font-poppins text-foreground flex items-center gap-1 shrink-0 border border-border/40 transition-colors"
            >
              <AlertCircle className="h-3 w-3 text-rose-400" />
              <span>I'm confused</span>
            </button>
            <button
              onClick={() => handleQuickClick('quiz', 'Test my understanding with a question.')}
              className="px-2.5 py-1 rounded-lg glass hover:bg-primary/20 hover:border-primary/40 text-xs font-poppins text-foreground flex items-center gap-1 shrink-0 border border-border/40 transition-colors"
            >
              <HelpCircle className="h-3 w-3 text-emerald-400" />
              <span>Test me</span>
            </button>
          </div>

          {/* Voice toggle */}
          <button
            type="button"
            onClick={() => setIsVoiceActive((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
              isVoiceActive
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'glass text-muted-foreground hover:text-foreground border-border/60 hover:bg-muted/40'
            }`}
            title={isVoiceActive ? 'Voice active' : 'Enable voice'}
          >
            {isVoiceActive ? <Volume2 className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 opacity-60" />}
            <span className="hidden sm:inline text-[11px] font-mono">{isVoiceActive ? 'Voice On' : 'Voice Off'}</span>
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 min-h-0 p-3 sm:p-5 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isAI = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 max-w-[88%] ${
                    isAI ? 'self-start' : 'self-end flex-row-reverse ml-auto'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      isAI
                        ? 'bg-gradient-to-br from-primary to-purple-600 text-white'
                        : 'bg-muted text-foreground border border-border'
                    }`}
                  >
                    {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[10px] font-mono font-semibold text-muted-foreground">
                        {isAI ? 'AI Tutor' : 'You'}
                      </span>
                      {msg.conceptLabel && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                          {msg.conceptLabel}
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground/60">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm font-poppins leading-relaxed shadow-sm whitespace-pre-line ${
                        isAI
                          ? 'glass-strong border border-border/70 text-foreground rounded-tl-sm'
                          : 'bg-primary text-primary-foreground rounded-tr-sm'
                      }`}
                    >
                      {msg.text}

                      {msg.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs font-poppins text-muted-foreground bg-muted/20 p-3 rounded-2xl w-max border border-border/40">
                <Sparkles className="h-4 w-4 text-primary animate-spin" />
                <span>AI Tutor is formulating explanation...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="p-3 bg-muted/20 border-t border-border/50 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question or type a topic..."
              className="flex-1 bg-background/80 border border-border/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-poppins text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron font-semibold text-xs flex items-center gap-1.5 hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md"
            >
              <span>Send</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
  );
};

export default ChatInterface;


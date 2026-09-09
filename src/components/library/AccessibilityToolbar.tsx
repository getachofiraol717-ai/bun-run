import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Eye, Type, Sun, X, Settings2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { accessibilityStore } from '@/plugins/margeos/accessibility-engine';

const LS_KEY = 'ku_accessibility_prefs';

export interface AccessibilityPrefs {
  dyslexiaFont: boolean;
  highContrast: boolean;
  textScale: number;   // 1.0 = 100%
  readAloud: boolean;
}

const DEFAULT_PREFS: AccessibilityPrefs = {
  dyslexiaFont: false, highContrast: false, textScale: 1, readAloud: false,
};

function loadPrefs(): AccessibilityPrefs {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(LS_KEY) || '{}') }; }
  catch { return DEFAULT_PREFS; }
}
function savePrefs(p: AccessibilityPrefs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch {}
}

interface Props {
  pageText: string;
  onJumpToPage?: (page: number) => void;
  onExplainPage?: () => void;
  onCreateQuiz?: () => void;
  onClose: () => void;
  prefs: AccessibilityPrefs;
  setPrefs: (p: AccessibilityPrefs) => void;
}

export default function AccessibilityToolbar({ pageText, onJumpToPage, onExplainPage, onCreateQuiz, onClose, prefs, setPrefs }: Props) {
  const [speaking, setSpeaking]   = useState(false);
  const [listening, setListening] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recRef   = useRef<any>(null);

  const update = (delta: Partial<AccessibilityPrefs>) => {
    const next = { ...prefs, ...delta };
    setPrefs(next); savePrefs(next);
    if (delta.highContrast !== undefined) {
      if (accessibilityStore.getState().features.highContrast !== delta.highContrast) {
        accessibilityStore.toggleFeature('highContrast');
      }
    }
  };

  // Apply global CSS for dyslexia font & high contrast via body data attributes
  useEffect(() => {
    document.body.setAttribute('data-dyslexia', prefs.dyslexiaFont ? '1' : '0');
    document.body.setAttribute('data-hc', prefs.highContrast ? '1' : '0');
    document.body.style.fontSize = `${prefs.textScale * 100}%`;
    return () => {
      document.body.removeAttribute('data-dyslexia');
      document.body.removeAttribute('data-hc');
      document.body.style.fontSize = '';
    };
  }, [prefs]);

  // Read aloud
  const toggleReadAloud = () => {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      update({ readAloud: false });
      return;
    }
    if (!pageText.trim()) { toast.error('No page text to read'); return; }
    const utter = new SpeechSynthesisUtterance(pageText.slice(0, 5000));
    utter.lang = 'en-US'; utter.rate = 0.9; utter.pitch = 1;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => { setSpeaking(false); update({ readAloud: false }); };
    utter.onerror = () => { setSpeaking(false); toast.error('Text-to-speech error'); };
    synthRef.current = utter;
    window.speechSynthesis?.speak(utter);
    update({ readAloud: true });
  };

  // Voice commands: "explain this page", "read chapter N", "create a quiz", "go to page N"
  const toggleVoiceCommands = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('Voice commands not supported in this browser'); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript: string = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
      if (transcript.includes('explain') || transcript.includes('explain this page')) {
        toast.info('🎙️ Opening AI Companion…'); onExplainPage?.();
      } else if (transcript.includes('quiz') || transcript.includes('create a quiz')) {
        toast.info('🎙️ Opening Quiz Generator…'); onCreateQuiz?.();
      } else if (transcript.match(/go to page (\d+)|page (\d+)/)) {
        const m = transcript.match(/(\d+)/);
        if (m) { const pg = parseInt(m[1]); toast.info(`🎙️ Going to page ${pg}…`); onJumpToPage?.(pg); }
      } else if (transcript.includes('read aloud') || transcript.includes('read this page')) {
        toggleReadAloud();
      } else {
        toast.info(`🎙️ Command not recognised: "${transcript}"`);
      }
    };
    rec.onerror = () => { setListening(false); toast.error('Voice command error'); };
    rec.onend = () => setListening(false);
    rec.start(); recRef.current = rec; setListening(true);
    toast.info('🎙️ Listening for commands… say "explain this page", "create a quiz", "go to page 5", or "read aloud"');
  };

  const scalePct = Math.round(prefs.textScale * 100);

  return (
    <div className="fixed bottom-16 right-4 z-50 rounded-2xl border border-border/60 bg-card/90 backdrop-blur shadow-2xl w-64 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <span className="text-xs font-semibold text-primary flex items-center gap-1.5"><Settings2 className="h-3.5 w-3.5" /> Accessibility</span>
        <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
      </div>

      <div className="p-3 space-y-3">
        {/* Dyslexia font */}
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 text-sm"><Type className="h-4 w-4 text-muted-foreground" /> Dyslexia Font</div>
          <Toggle checked={prefs.dyslexiaFont} onChange={v => update({ dyslexiaFont: v })} />
        </label>

        {/* High contrast */}
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 text-sm"><Eye className="h-4 w-4 text-muted-foreground" /> High Contrast</div>
          <Toggle checked={prefs.highContrast} onChange={v => update({ highContrast: v })} />
        </label>

        {/* Text scale */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm flex items-center gap-2"><Sun className="h-4 w-4 text-muted-foreground" /> Text Scale</span>
            <span className="text-xs text-muted-foreground">{scalePct}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => update({ textScale: Math.max(0.7, prefs.textScale - 0.1) })} className="p-1 rounded border border-border hover:text-primary"><ChevronDown className="h-3.5 w-3.5" /></button>
            <input type="range" min={70} max={150} step={5} value={scalePct} onChange={e => update({ textScale: parseInt(e.target.value) / 100 })} className="flex-1" />
            <button onClick={() => update({ textScale: Math.min(1.5, prefs.textScale + 0.1) })} className="p-1 rounded border border-border hover:text-primary"><ChevronUp className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        {/* Read aloud */}
        <button onClick={toggleReadAloud} className={`w-full flex items-center gap-2 py-2 px-3 rounded-xl border text-sm ${speaking ? 'border-destructive/50 text-destructive' : 'border-border text-muted-foreground hover:text-primary hover:border-primary/40'}`}>
          {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {speaking ? 'Stop Reading Aloud' : 'Read Page Aloud'}
        </button>

        {/* Voice commands */}
        <button onClick={toggleVoiceCommands} className={`w-full flex items-center gap-2 py-2 px-3 rounded-xl border text-sm ${listening ? 'border-accent text-accent' : 'border-border text-muted-foreground hover:text-primary hover:border-primary/40'}`}>
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {listening ? 'Stop Voice Commands' : 'Voice Commands'}
        </button>

        <p className="text-[10px] text-muted-foreground">Voice commands: "explain this page", "create a quiz", "go to page N", "read aloud"</p>
      </div>

      {/* Inline CSS for dyslexia font & high contrast */}
      <style>{`
        [data-dyslexia="1"] { font-family: 'OpenDyslexic', 'Arial', sans-serif !important; letter-spacing: 0.05em; word-spacing: 0.1em; line-height: 1.8 !important; }
        [data-hc="1"] { filter: contrast(1.6) brightness(1.05) !important; }
        [data-hc="1"] .glass, [data-hc="1"] .glass-strong { background: #000 !important; color: #fff !important; border-color: #fff !important; }
      `}</style>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} role="switch" aria-checked={checked}
      className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-muted'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

export { loadPrefs };

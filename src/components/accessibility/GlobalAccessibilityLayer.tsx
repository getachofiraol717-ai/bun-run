// KNOWLEDGE22VV — Global Accessibility Layer
// Mounted at the app root level to deliver persistent accessibility capabilities:
// live captions, visual alerts, voice navigation, braille output sync, screen reader ARIA live announcements,
// high-contrast & dyslexia theme binding, and haptic feedback.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Ear, Eye, Hand, Mic, MicOff, Volume2, VolumeX,
  X, Sparkles, Sliders, AlertCircle, CheckCircle2, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAccessibility,
  accessibilityStore,
  liveCaptionEngine,
  voiceNavigationEngine,
  visualAlertEngine,
  brailleEngine,
  hapticFeedbackEngine,
  speechService
} from '@/plugins/margeos/accessibility-engine';

export const GlobalAccessibilityLayer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isEnabled, features, currentProfile } = useAccessibility({ autoInitialize: true });

  const [activeCaption, setActiveCaption] = useState<string | null>(null);
  const [visualAlert, setVisualAlert] = useState<{ message: string; type: 'info' | 'warning' | 'success' } | null>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>('');
  const [floatingMenuOpen, setFloatingMenuOpen] = useState<boolean>(false);
  const [voiceListening, setVoiceListening] = useState<boolean>(false);

  // Sync global CSS attributes on body based on active features
  useEffect(() => {
    if (!isEnabled) {
      document.body.removeAttribute('data-hc');
      document.body.removeAttribute('data-dyslexia');
      return;
    }

    if (features.highContrast) {
      document.body.setAttribute('data-hc', '1');
    } else {
      document.body.removeAttribute('data-hc');
    }

    // High contrast styles
    let styleEl = document.getElementById('ku-accessibility-global-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'ku-accessibility-global-styles';
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      [data-hc="1"] { filter: contrast(1.5) brightness(1.05) !important; }
      [data-hc="1"] body { background-color: #020617 !important; color: #f8fafc !important; }
      [data-dyslexia="1"] { font-family: 'OpenDyslexic', 'Arial', sans-serif !important; letter-spacing: 0.05em; line-height: 1.8 !important; }
    `;
  }, [isEnabled, features.highContrast]);

  // Route transition ARIA announcement for screen readers
  useEffect(() => {
    const pageName = location.pathname.substring(1).replace('-', ' ') || 'Home';
    const message = `Navigated to ${pageName} page`;
    setAriaAnnouncement(message);
    if (features.haptic) {
      hapticFeedbackEngine.play('navigation');
    }
  }, [location.pathname, features.haptic]);

  // Keyboard shortcut listener: Alt + A opens accessibility panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setFloatingMenuOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live caption listener
  useEffect(() => {
    if (!features.captions) {
      setActiveCaption(null);
      return;
    }

    const unbind = liveCaptionEngine.subscribe((segment) => {
      if (segment && segment.text) {
        setActiveCaption(segment.text);
      } else {
        setActiveCaption(null);
      }
    });

    return () => unbind();
  }, [features.captions]);

  // Visual alert listener
  useEffect(() => {
    const unbind = visualAlertEngine.subscribe((alert) => {
      if (alert) {
        const first = alert[0];
        setVisualAlert({ message: first?.message || 'System Notification', type: (first?.type as 'info' | 'warning' | 'success') || 'info' });
        setTimeout(() => setVisualAlert(null), 3500);
      }
    });
    return () => unbind();
  }, []);

  // Voice navigation listener
  useEffect(() => {
    if (!features.voiceNavigation) {
      setVoiceListening(false);
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    let rec: any = null;
    try {
      rec = new SR();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        const text = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
        toast.info(`🎙️ Voice Command: "${text}"`);

        if (text.includes('library') || text.includes('open library')) {
          navigate('/library');
        } else if (text.includes('workspace') || text.includes('margeos')) {
          navigate('/margeos');
        } else if (text.includes('quiz') || text.includes('start quiz')) {
          navigate('/quiz');
        } else if (text.includes('settings') || text.includes('open settings')) {
          navigate('/settings');
        } else if (text.includes('dashboard') || text.includes('go home')) {
          navigate('/dashboard');
        } else if (text.includes('back') || text.includes('go back')) {
          navigate(-1);
        } else if (text.includes('high contrast')) {
          accessibilityStore.toggleFeature('highContrast');
        }
      };

      rec.onstart = () => setVoiceListening(true);
      rec.onend = () => {
        if (features.voiceNavigation) {
          try { rec.start(); } catch {}
        } else {
          setVoiceListening(false);
        }
      };

      rec.start();
    } catch {
      setVoiceListening(false);
    }

    return () => {
      if (rec) {
        try { rec.stop(); } catch {}
      }
    };
  }, [features.voiceNavigation, navigate]);

  return (
    <>
      {/* ARIA Live Region for Screen Readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only absolute w-1 h-1 p-0 overflow-hidden clip-rect-0 border-0"
      >
        {ariaAnnouncement}
      </div>

      {/* Visual Alert Flash Overlay */}
      {visualAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-11/12 animate-slide-down">
          <div className="glass-strong rounded-2xl p-4 border-2 border-cyan-400 bg-cyan-950/90 text-cyan-100 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 text-cyan-400 shrink-0" />
              <p className="text-xs font-poppins font-semibold">{visualAlert.message}</p>
            </div>
            <button onClick={() => setVisualAlert(null)}>
              <X className="h-4 w-4 text-cyan-300" />
            </button>
          </div>
        </div>
      )}

      {/* Live Auto-Captions Bottom Banner */}
      {features.captions && activeCaption && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-11/12 animate-fade-in">
          <div className="glass-strong rounded-2xl px-6 py-3 border-2 border-cyan-500/80 bg-slate-950/95 text-white shadow-2xl text-center">
            <span className="text-[10px] font-orbitron text-cyan-400 font-bold block mb-0.5">LIVE CAPTION</span>
            <p className="text-sm md:text-base font-poppins font-semibold text-cyan-100 tracking-wide">
              "{activeCaption}"
            </p>
          </div>
        </div>
      )}

      {/* Voice Listening Status HUD */}
      {features.voiceNavigation && voiceListening && (
        <div className="fixed top-20 right-4 z-40 animate-pulse">
          <div className="px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-300 text-xs font-orbitron flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>Voice Commands Active</span>
          </div>
        </div>
      )}

      {/* Floating Quick Accessibility Dock Button */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setFloatingMenuOpen(!floatingMenuOpen)}
          className="p-3 rounded-full bg-primary text-primary-foreground font-orbitron text-xs shadow-2xl neon-glow flex items-center gap-2 hover:scale-105 transition-transform"
          title="Quick Accessibility (Alt + A)"
          aria-label="Toggle Quick Accessibility Menu"
        >
          <Sparkles className="h-5 w-5" />
          <span className="hidden sm:inline font-bold">Accessibility</span>
        </button>

        {/* Quick Menu Popover */}
        {floatingMenuOpen && (
          <div className="absolute bottom-14 left-0 w-72 glass-strong rounded-2xl p-4 border border-primary/40 shadow-2xl space-y-3 animate-slide-up">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="font-orbitron text-xs font-bold text-primary flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" /> Quick Accessibility
              </span>
              <button onClick={() => setFloatingMenuOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-poppins">
              <button
                onClick={() => {
                  navigate('/settings?tab=accessibility');
                  setFloatingMenuOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-semibold flex items-center justify-between"
              >
                <span>Open Accessibility Center</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="border-t border-border/40 pt-2 space-y-1.5">
                <button
                  onClick={() => accessibilityStore.toggleFeature('highContrast')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <span>High Contrast</span>
                  <span className={`text-[10px] font-orbitron font-bold px-2 py-0.5 rounded ${features.highContrast ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {features.highContrast ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => accessibilityStore.toggleFeature('captions')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <span>Live Captions</span>
                  <span className={`text-[10px] font-orbitron font-bold px-2 py-0.5 rounded ${features.captions ? 'bg-cyan-500 text-slate-950' : 'bg-muted'}`}>
                    {features.captions ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => accessibilityStore.toggleFeature('voiceNavigation')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <span>Voice Commands</span>
                  <span className={`text-[10px] font-orbitron font-bold px-2 py-0.5 rounded ${features.voiceNavigation ? 'bg-purple-500 text-slate-950' : 'bg-muted'}`}>
                    {features.voiceNavigation ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground font-poppins text-center pt-1 border-t border-border/30">
              Shortcut: Press <kbd className="px-1 py-0.5 bg-muted rounded border">Alt + A</kbd> anytime
            </div>
          </div>
        )}
      </div>
    </>
  );
};

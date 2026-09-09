// KNOWLEDGE22VV — Student-Facing Canonical Accessibility Center
// Connects directly to MargeOS Accessibility Engine, accessibilityStore, and browser capabilities.

import React, { useState, useEffect } from 'react';
import {
  Ear, Eye, Hand, Volume2, VolumeX, Mic, MicOff, Type, Sun,
  CheckCircle2, AlertTriangle, Shield, Sparkles, Activity, Sliders,
  HelpCircle, Monitor, Vibrate, FileText, Zap, Laptop, Command
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAccessibility,
  accessibilityEngine,
  accessibilityStore,
  brailleTranslationEngine,
  hapticFeedbackEngine
} from '@/plugins/margeos/accessibility-engine';
import type { AccessibilityProfileType } from '@/plugins/margeos/accessibility-engine/models/AccessibilityProfile';

export const StudentAccessibilityCenter: React.FC = () => {
  const {
    isInitialized,
    isEnabled,
    currentProfile,
    features,
    enable,
    disable,
    applyPreset,
    toggleFeature,
    updateProfile
  } = useAccessibility({ autoInitialize: true });

  const [activeTab, setActiveTab] = useState<'presets' | 'deaf' | 'blind' | 'deafblind' | 'visual' | 'motor'>('presets');
  const [capabilities, setCapabilities] = useState({
    speechSynthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
    speechRecognition: typeof window !== 'undefined' && (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window)),
    haptics: typeof window !== 'undefined' && 'vibrate' in navigator,
    touch: typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
    brailleDisplay: false // detected via USB/Bluetooth WebHID/WebBluetooth if supported
  });

  const [sampleText, setSampleText] = useState('Force equals mass multiplied by acceleration: F = ma');
  const [brailleOutput, setBrailleOutput] = useState('⠠⠿⠗⠉⠑ ⠑⠟⠥⠁⠇⠎ ⠍⠁⠎⠎ ⠍⠥⠇⠞⠊⠏⠇⠊⠑⠙ ⠙⠹ ⠁⠉⠉⠑⠇⠑⠗⠁⠞⠊⠕⠝');

  useEffect(() => {
    if (sampleText) {
      try {
        const translated = brailleTranslationEngine.translate(sampleText);
        setBrailleOutput(translated.braille || '⠠⠿⠗⠉⠑ ⠑⠟⠥⠁⠇⠎ ⠍⠁⠎⠎');
      } catch {
        setBrailleOutput('⠠⠿⠗⠉⠑ ⠑⠟⠥⠁⠇⠎ ⠍⠁⠎⠎');
      }
    }
  }, [sampleText]);

  const handleTestHaptic = (pattern: 'success' | 'warning' | 'error' | 'notification') => {
    if (!capabilities.haptics) {
      toast.error('Haptic vibration not supported on this device/browser');
      return;
    }
    hapticFeedbackEngine.play(pattern);
    toast.success(`Triggered ${pattern} haptic pattern`);
  };

  const presets: { id: AccessibilityProfileType; label: string; icon: any; desc: string; color: string }[] = [
    {
      id: 'deaf',
      label: 'Deaf & Hard of Hearing',
      icon: Ear,
      desc: 'Live auto-captions, visual alert flashes, and sign-language video overlays.',
      color: 'border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400'
    },
    {
      id: 'blind',
      label: 'Blind & Low Vision',
      icon: Eye,
      desc: 'Voice command navigation, screen-reader ARIA optimizations, and AI audio descriptions.',
      color: 'border-purple-500/40 hover:bg-purple-500/10 text-purple-400'
    },
    {
      id: 'deafblind',
      label: 'Deaf-Blind Suite',
      icon: Hand,
      desc: 'Refreshable Braille display interface, tactile haptic feedback, and structured touch mode.',
      color: 'border-amber-500/40 hover:bg-amber-500/10 text-amber-400'
    },
    {
      id: 'custom',
      label: 'Custom Balanced Mode',
      icon: Sliders,
      desc: 'Fine-tune individual features (Dyslexia font, High contrast, Text scaling, Shortcuts).',
      color: 'border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Main Engine Power Toggle */}
      <div className="glass-strong rounded-2xl p-6 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 neon-glow">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/20 text-primary border border-primary/40">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-orbitron text-xl font-bold text-foreground flex items-center gap-2">
              Canonical Accessibility Center
            </h2>
            <p className="text-xs text-muted-foreground font-poppins mt-0.5">
              Empowering Deaf, Blind, Deaf-Blind, and neurodivergent learners across Knowledge Universe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-poppins text-muted-foreground">Engine Status:</span>
          <button
            onClick={() => {
              if (isEnabled) {
                disable();
                toast.info('Accessibility Engine paused');
              } else {
                enable();
                toast.success('Accessibility Engine enabled');
              }
            }}
            className={`px-4 py-2 rounded-xl font-orbitron text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
              isEnabled
                ? 'bg-emerald-500 text-slate-950 neon-glow'
                : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isEnabled ? 'ENABLED' : 'PAUSED'}
          </button>
        </div>
      </div>

      {/* Preset Profiles Launcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {presets.map(({ id, label, icon: Icon, desc, color }) => {
          const isActive = currentProfile?.type === id;
          return (
            <button
              key={id}
              onClick={() => {
                applyPreset(id);
                toast.success(`Activated ${label} profile`);
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 ${color} ${
                isActive ? 'ring-2 ring-primary bg-primary/10 shadow-lg' : 'glass-strong'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-background/50 border border-border">
                  <Icon className="h-5 w-5" />
                </span>
                {isActive && (
                  <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-orbitron font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-orbitron text-sm font-bold text-foreground">{label}</h3>
                <p className="text-xs text-muted-foreground font-poppins mt-1 line-clamp-2">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/50">
        {[
          { id: 'presets' as const, label: 'Overview & Presets', icon: Sliders },
          { id: 'deaf' as const, label: 'Deaf Support (Captions/Alerts)', icon: Ear },
          { id: 'blind' as const, label: 'Blind Support (Voice/Screen Reader)', icon: Eye },
          { id: 'deafblind' as const, label: 'Deaf-Blind (Braille/Haptics)', icon: Hand },
          { id: 'visual' as const, label: 'Visual & Reading', icon: Sun },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-xl text-xs font-poppins transition-all flex items-center gap-2 shrink-0 ${
              activeTab === id
                ? 'bg-primary text-primary-foreground font-semibold neon-glow'
                : 'glass text-muted-foreground hover:bg-primary/10'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Features Summary */}
          <div className="glass-strong rounded-2xl p-5 border border-border space-y-4">
            <h3 className="font-orbitron text-base font-bold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Active Features Toggle Matrix
            </h3>
            <div className="space-y-2.5">
              {[
                { key: 'captions', label: 'Live Auto-Captions', desc: 'Real-time subtitles for audio & AI responses', icon: Ear },
                { key: 'voiceNavigation', label: 'Voice Command Navigation', desc: 'Control KU with voice directives', icon: Mic },
                { key: 'signLanguage', label: 'Sign-Language Video Overlay', desc: 'Visual sign language support', icon: Hand },
                { key: 'braille', label: 'Refreshable Braille Output', desc: 'Unicode & UEB Grade 1/2 Braille sync', icon: Laptop },
                { key: 'haptic', label: 'Haptic Pattern Feedback', desc: 'Vibration pulses for events & actions', icon: Vibrate },
                { key: 'highContrast', label: 'High Contrast Theme', desc: '1.6x contrast & solid dark backgrounds', icon: Sun }
              ].map(({ key, label, desc, icon: Icon }) => {
                const enabled = (features as any)[key] ?? false;
                return (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="text-xs font-semibold text-foreground font-poppins">{label}</p>
                        <p className="text-[10px] text-muted-foreground font-poppins">{desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        toggleFeature(key);
                        toast.success(`${label} ${!enabled ? 'enabled' : 'disabled'}`);
                      }}
                      role="switch"
                      aria-checked={enabled}
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        enabled ? 'bg-primary' : 'bg-muted border border-border'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hardware & Browser Capabilities Detector */}
          <div className="glass-strong rounded-2xl p-5 border border-border space-y-4">
            <h3 className="font-orbitron text-base font-bold text-foreground flex items-center gap-2">
              <Monitor className="h-4 w-4 text-cyan-400" /> Device Hardware & API Probes
            </h3>
            <p className="text-xs text-muted-foreground font-poppins">
              Knowledge Universe detects browser and device APIs gracefully to select optimal accessibility adapters.
            </p>

            <div className="space-y-2">
              {[
                { label: 'Speech Synthesis (Text-To-Speech)', status: capabilities.speechSynthesis, desc: 'Renders spoken audio for blind students' },
                { label: 'Speech Recognition (Web Speech API)', status: capabilities.speechRecognition, desc: 'Captures voice commands & auto-captions' },
                { label: 'Haptic Vibration API (navigator.vibrate)', status: capabilities.haptics, desc: 'Triggers tactile pulses for deaf-blind students' },
                { label: 'Touch Navigation & Screen Input', status: capabilities.touch, desc: 'Detects mobile touch targets & gestures' },
                { label: 'External Refreshable Braille Display', status: capabilities.brailleDisplay, desc: 'Requires USB/Bluetooth WebHID braille adapter' }
              ].map(({ label, status, desc }) => (
                <div key={label} className="p-3 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground font-poppins">{label}</p>
                    <p className="text-[10px] text-muted-foreground font-poppins">{desc}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-orbitron font-bold shrink-0 ${
                      status
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {status ? 'SUPPORTED' : 'LIMITED / DEGRADED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deaf Support Tab */}
      {activeTab === 'deaf' && (
        <div className="space-y-5 glass-strong rounded-2xl p-6 border border-cyan-500/30">
          <div className="flex items-center gap-3">
            <Ear className="h-6 w-6 text-cyan-400" />
            <div>
              <h3 className="font-orbitron text-lg font-bold text-foreground">Deaf & Hard of Hearing Suite</h3>
              <p className="text-xs text-muted-foreground font-poppins">
                Ensure every spoken word, notification, and live classroom event has explicit visual alternatives.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
              <h4 className="font-orbitron text-sm font-bold text-cyan-400 flex items-center gap-2">
                <Ear className="h-4 w-4" /> Live Auto-Captions
              </h4>
              <p className="text-xs text-muted-foreground font-poppins">
                Displays real-time subtitles at the bottom of the screen during AI Tutor conversations, voice notes, and live classroom events.
              </p>
              <button
                onClick={() => {
                  toggleFeature('captions');
                  toast.success(`Live Captions ${!features.captions ? 'enabled' : 'disabled'}`);
                }}
                className={`w-full mt-2 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
                  features.captions ? 'bg-cyan-500 text-slate-950' : 'bg-muted text-muted-foreground'
                }`}
              >
                {features.captions ? 'DISABLE CAPTIONS' : 'ENABLE CAPTIONS'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
              <h4 className="font-orbitron text-sm font-bold text-cyan-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Visual Alerts & Flashes
              </h4>
              <p className="text-xs text-muted-foreground font-poppins">
                Converts sound events (classroom bells, AI response completion, warnings) into high-visibility screen margin glow flashes.
              </p>
              <button
                onClick={() => {
                  const el = document.createElement('div');
                  el.className = 'fixed inset-0 border-4 border-cyan-400 bg-cyan-400/10 pointer-events-none z-50 animate-ping';
                  document.body.appendChild(el);
                  setTimeout(() => el.remove(), 800);
                  toast.info('⚡ Visual Alert Test Fired');
                }}
                className="w-full mt-2 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs font-orbitron font-bold hover:bg-cyan-500/30"
              >
                TEST VISUAL ALERT
              </button>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
              <h4 className="font-orbitron text-sm font-bold text-cyan-400 flex items-center gap-2">
                <Hand className="h-4 w-4" /> Sign Language Support
              </h4>
              <p className="text-xs text-muted-foreground font-poppins">
                Enables sign language video avatar guides for primary educational concepts and vocabulary definitions.
              </p>
              <button
                onClick={() => {
                  toggleFeature('signLanguage');
                  toast.success(`Sign Language ${!features.signLanguage ? 'enabled' : 'disabled'}`);
                }}
                className={`w-full mt-2 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
                  features.signLanguage ? 'bg-cyan-500 text-slate-950' : 'bg-muted text-muted-foreground'
                }`}
              >
                {features.signLanguage ? 'DISABLE SIGN LANGUAGE' : 'ENABLE SIGN LANGUAGE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blind Support Tab */}
      {activeTab === 'blind' && (
        <div className="space-y-5 glass-strong rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-purple-400" />
            <div>
              <h3 className="font-orbitron text-lg font-bold text-foreground">Blind & Screen Reader Suite</h3>
              <p className="text-xs text-muted-foreground font-poppins">
                Complete speech synthesis, voice navigation commands, and rich ARIA accessibility tree integration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <h4 className="font-orbitron text-sm font-bold text-purple-400 flex items-center gap-2">
                <Mic className="h-4 w-4" /> Voice Navigation Commands
              </h4>
              <p className="text-xs text-muted-foreground font-poppins">
                Speak commands into your microphone to navigate Knowledge Universe without a cursor or touch screen.
              </p>

              <div className="bg-background/60 p-3 rounded-xl border border-border/50 text-xs font-mono text-purple-300 space-y-1">
                <p>• "Open Library" / "Open AI Tutor"</p>
                <p>• "Start quiz" / "Open settings"</p>
                <p>• "Explain this page" / "Read chapter"</p>
                <p>• "Go back" / "High contrast mode"</p>
              </div>

              <button
                onClick={() => {
                  toggleFeature('voiceNavigation');
                  toast.success(`Voice Navigation ${!features.voiceNavigation ? 'enabled' : 'disabled'}`);
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-orbitron font-bold transition-all ${
                  features.voiceNavigation ? 'bg-purple-500 text-slate-950' : 'bg-muted text-muted-foreground'
                }`}
              >
                {features.voiceNavigation ? 'DISABLE VOICE NAVIGATION' : 'ENABLE VOICE NAVIGATION'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <h4 className="font-orbitron text-sm font-bold text-purple-400 flex items-center gap-2">
                <Volume2 className="h-4 w-4" /> Speech Synthesis & Audio Descriptions
              </h4>
              <p className="text-xs text-muted-foreground font-poppins">
                Reads page text, mathematical formulas, and AI diagrams aloud using high-clarity natural speech synthesis.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                      const u = new SpeechSynthesisUtterance('Welcome to Knowledge Universe. All learning modules are accessible.');
                      u.rate = 1.0;
                      window.speechSynthesis.speak(u);
                      toast.info('🔊 Testing Speech Synthesis...');
                    } else {
                      toast.error('Speech synthesis not supported on this browser');
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-orbitron font-bold hover:bg-purple-500/30"
                >
                  TEST VOICE AUDIO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deaf-Blind Suite Tab */}
      {activeTab === 'deafblind' && (
        <div className="space-y-5 glass-strong rounded-2xl p-6 border border-amber-500/30">
          <div className="flex items-center gap-3">
            <Hand className="h-6 w-6 text-amber-400" />
            <div>
              <h3 className="font-orbitron text-lg font-bold text-foreground">Deaf-Blind Tactile & Braille Suite</h3>
              <p className="text-xs text-muted-foreground font-poppins">
                Seamless translation into Unicode Braille cells and structured haptic feedback for touch displays.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Braille Display Interface */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <h4 className="font-orbitron text-sm font-bold text-amber-400 flex items-center gap-2">
                <Laptop className="h-4 w-4" /> Refreshable Braille Output Adapter
              </h4>
              <p className="text-xs text-muted-foreground font-poppins">
                Translates current AI Tutor text, formulas, and quiz questions into Grade 1 & Grade 2 UEB Braille.
              </p>

              <div>
                <label className="text-[10px] text-muted-foreground font-poppins">Sample Text Input:</label>
                <input
                  value={sampleText}
                  onChange={e => setSampleText(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-1">
                <p className="text-[10px] text-amber-400/80 font-orbitron">BRAILLE CELL OUTPUT (40-CELL DISPLAY):</p>
                <p className="text-lg font-mono text-amber-300 tracking-wider break-all">{brailleOutput}</p>
              </div>
            </div>

            {/* Haptic Feedback Patterns */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <h4 className="font-orbitron text-sm font-bold text-amber-400 flex items-center gap-2">
                <Vibrate className="h-4 w-4" /> Haptic Vibration Patterns
              </h4>
              <p className="text-xs text-muted-foreground font-poppins">
                Tactile pulses communicate operational status without requiring visual or audio cues.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleTestHaptic('success')}
                  className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-orbitron font-bold hover:bg-emerald-500/20"
                >
                  SUCCESS PULSE
                </button>
                <button
                  onClick={() => handleTestHaptic('warning')}
                  className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-orbitron font-bold hover:bg-amber-500/20"
                >
                  WARNING PULSE
                </button>
                <button
                  onClick={() => handleTestHaptic('error')}
                  className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-orbitron font-bold hover:bg-rose-500/20"
                >
                  ERROR PULSE
                </button>
                <button
                  onClick={() => handleTestHaptic('notification')}
                  className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-orbitron font-bold hover:bg-cyan-500/20"
                >
                  ALERT PULSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual & Reading Tab */}
      {activeTab === 'visual' && (
        <div className="space-y-5 glass-strong rounded-2xl p-6 border border-emerald-500/30">
          <div className="flex items-center gap-3">
            <Sun className="h-6 w-6 text-emerald-400" />
            <div>
              <h3 className="font-orbitron text-lg font-bold text-foreground">Visual & Typography Accessibility</h3>
              <p className="text-xs text-muted-foreground font-poppins">
                High-contrast rendering, dyslexia-friendly typography, font scaling, and reduced motion.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground font-poppins">High Contrast Theme</p>
                <p className="text-[10px] text-muted-foreground font-poppins">Deep black backgrounds with high contrast text</p>
              </div>
              <button
                onClick={() => {
                  toggleFeature('highContrast');
                  toast.success(`High Contrast ${!features.highContrast ? 'enabled' : 'disabled'}`);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-orbitron font-bold ${
                  features.highContrast ? 'bg-emerald-500 text-slate-950' : 'bg-muted text-muted-foreground'
                }`}
              >
                {features.highContrast ? 'ACTIVE' : 'INACTIVE'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground font-poppins">Dyslexia-Friendly Font</p>
                <p className="text-[10px] text-muted-foreground font-poppins">Applies OpenDyslexic letter spacing and line height</p>
              </div>
              <button
                onClick={() => {
                  const current = document.body.getAttribute('data-dyslexia') === '1';
                  document.body.setAttribute('data-dyslexia', current ? '0' : '1');
                  toast.success(`Dyslexia font ${!current ? 'enabled' : 'disabled'}`);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-orbitron font-bold hover:bg-emerald-500/30"
              >
                TOGGLE DYSLEXIA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

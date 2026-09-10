import React, { useState, useEffect, useRef } from 'react';
import GalaxyBackground from '@/components/GalaxyBackground';
import SEO from '@/components/SEO';
import { useWellbeing, DailyCheckIn, WellbeingGoal, WellbeingHabit, JournalEntry } from '@/contexts/WellbeingContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Clock, Eye, Brain, Target, Timer, Moon,
  BarChart3, Smartphone, Zap, TrendingUp, Shield,
  Bell, Coffee, Pause, Play, Volume2, VolumeX,
  Sparkles, Palette, Activity, Droplets, Heart, Radio,
  CheckCircle2, RotateCcw, AlertCircle, Plus, Trash2,
  BookOpen, Award, MessageSquare, Send, Calendar,
  Smile, Meh, Frown, Sun, Lock, RefreshCw, Monitor,
  Sliders, UserCheck, Flame, Check, HelpCircle
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';

type DesignTheme = 'cyberpunk' | 'zen' | 'telemetry' | 'solar';

type TabType = 'overview' | 'checkin' | 'goals' | 'journal' | 'coach' | 'focus' | 'challenges' | 'alerts';

const Wellbeing = () => {
  const {
    data, settings, checkIns, goals, habits, journals, challenges, coachMessages,
    setDailyGoal, updateSettings, getFocusElapsed, startFocus, stopFocus, pauseFocus, resumeFocus,
    addCheckIn, addGoal, updateGoalProgress, toggleGoalStatus, deleteGoal,
    addHabit, toggleHabitForDate, deleteHabit, addJournalEntry, deleteJournalEntry,
    completeChallenge, sendCoachMessage
  } = useWellbeing();

  const { user, profile } = useAuth();
  const [goalInput, setGoalInput] = useState(data.dailyGoal);
  const [focusDisplay, setFocusDisplay] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Design Theme state, saved per account
  const [designTheme, setDesignTheme] = useState<DesignTheme>(() => {
    return (localStorage.getItem(scopedKey('ku_wellbeing_theme')) as DesignTheme) || 'cyberpunk';
  });

  const handleThemeChange = (theme: DesignTheme) => {
    setDesignTheme(theme);
    localStorage.setItem(scopedKey('ku_wellbeing_theme'), theme);
    toast.success(`Theme style updated to ${theme.toUpperCase()}`);
  };

  // Real-time live tracking states (second-by-second)
  const [livePageSeconds, setLivePageSeconds] = useState(0);
  const [eyeRestCountdown, setEyeRestCountdown] = useState(20 * 60); // 20 minutes countdown
  const [waterMl, setWaterMl] = useState(() => {
    return Number(localStorage.getItem('ku_wellbeing_water') || 1000);
  });
  const [postureAlertSecs, setPostureAlertSecs] = useState(45 * 60);

  // Audio Focus Synthesizer state
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [soundType, setSoundType] = useState<'rain' | 'binaural' | 'space'>('binaural');
  const [volume, setVolume] = useState(0.3);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundGainNodeRef = useRef<GainNode | null>(null);

  // Check-In Form state
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [ciMood, setCiMood] = useState<'great' | 'good' | 'okay' | 'tired' | 'stressed'>('good');
  const [ciEnergy, setCiEnergy] = useState(4);
  const [ciMotivation, setCiMotivation] = useState(4);
  const [ciStress, setCiStress] = useState(2);
  const [ciFocus, setCiFocus] = useState(4);
  const [ciSleep, setCiSleep] = useState(4);
  const [ciNote, setCiNote] = useState('');

  // New Goal Modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<'study' | 'health' | 'habits' | 'personal'>('study');
  const [newGoalTarget, setNewGoalTarget] = useState(120);
  const [newGoalUnit, setNewGoalUnit] = useState('mins');

  // New Habit Modal state
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<'study' | 'mindfulness' | 'health' | 'routine'>('study');

  // Journal Form state
  const [jTitle, setJTitle] = useState('');
  const [jLearned, setJLearned] = useState('');
  const [jAccomplished, setJAccomplished] = useState('');
  const [jDifficulties, setJDifficulties] = useState('');
  const [jProudOf, setJProudOf] = useState('');
  const [jTomorrow, setJTomorrow] = useState('');

  // AI Coach Input state
  const [coachInput, setCoachInput] = useState('');
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const coachChatEndRef = useRef<HTMLDivElement | null>(null);

  // Real-time Event Stream Log
  const [eventStream, setEventStream] = useState<Array<{ id: string; time: string; msg: string; type: 'info' | 'focus' | 'break' | 'health' }>>([
    { id: '1', time: new Date().toLocaleTimeString(), msg: 'Wellbeing & Self-Improvement Hub initialized', type: 'info' },
  ]);

  const addTelemetryLog = (msg: string, type: 'info' | 'focus' | 'break' | 'health' = 'info') => {
    setEventStream(prev => [
      { id: Date.now().toString(), time: new Date().toLocaleTimeString(), msg, type },
      ...prev.slice(0, 19)
    ]);
  };

  // 1. Second-by-second Real-time live ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setLivePageSeconds(prev => prev + 1);

      // Eye rest 20-20-20 rule timer
      setEyeRestCountdown(prev => {
        if (prev <= 1) {
          addTelemetryLog('👁️ Eye Rest Time: Look at an object 20ft away for 20s', 'break');
          toast.info('👁️ Time for a 20-20-20 Eye Break! Look 20 feet away for 20 seconds.', { duration: 6000 });
          return 20 * 60;
        }
        return prev - 1;
      });

      // Posture check timer
      setPostureAlertSecs(prev => {
        if (prev <= 1) {
          addTelemetryLog('🧘 Posture Check: Adjust seating & roll shoulders back', 'health');
          return 45 * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update focus timer display every second
  useEffect(() => {
    if (!settings.focusMode) { setFocusDisplay(0); return; }
    const update = () => setFocusDisplay(getFocusElapsed());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [settings.focusMode, settings.focusStartedAt, settings.focusPausedAt, getFocusElapsed]);

  // Real-time Canvas Focus Waveform
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      step += settings.focusMode ? 0.08 : 0.03;

      ctx.beginPath();
      ctx.lineWidth = 2;

      if (designTheme === 'cyberpunk') ctx.strokeStyle = '#06b6d4';
      else if (designTheme === 'zen') ctx.strokeStyle = '#10b981';
      else if (designTheme === 'telemetry') ctx.strokeStyle = '#f59e0b';
      else ctx.strokeStyle = '#eab308';

      const width = canvas.width;
      const height = canvas.height;
      const amplitude = settings.focusMode ? 18 : 8;
      const frequency = 0.03;

      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.sin(x * frequency + step) * amplitude * Math.cos(x * 0.01);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => cancelAnimationFrame(animId);
  }, [settings.focusMode, designTheme]);

  // Ambient Sound Generator using Web Audio API
  const toggleAmbientSound = () => {
    if (isPlayingSound) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsPlayingSound(false);
      addTelemetryLog('🔇 Ambient focus soundscape paused', 'info');
    } else {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(ctx.destination);
        soundGainNodeRef.current = gainNode;

        if (soundType === 'binaural') {
          const oscL = ctx.createOscillator();
          const oscR = ctx.createOscillator();
          const merger = ctx.createChannelMerger(2);

          oscL.frequency.value = 200;
          oscR.frequency.value = 210;

          oscL.connect(merger, 0, 0);
          oscR.connect(merger, 0, 1);
          merger.connect(gainNode);

          oscL.start();
          oscR.start();
        } else if (soundType === 'space') {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = 110;
          osc.connect(gainNode);
          osc.start();
        } else {
          const bufferSize = ctx.sampleRate * 2;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11;
            b6 = white * 0.115926;
          }
          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          whiteNoise.loop = true;
          whiteNoise.connect(gainNode);
          whiteNoise.start();
        }

        setIsPlayingSound(true);
        addTelemetryLog(`🎧 Ambient ${soundType.toUpperCase()} soundscape started`, 'focus');
      } catch (e) {
        toast.error('Could not initialize audio synthesizer');
      }
    }
  };

  const handleWaterAdd = (amount: number) => {
    const next = waterMl + amount;
    setWaterMl(next);
    localStorage.setItem('ku_wellbeing_water', next.toString());
    addTelemetryLog(`💧 Logged +${amount}ml water (${next}ml total)`, 'health');
    toast.success(`Hydration logged: ${next} / 2000 ml`);
  };

  const handleSaveCheckIn = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    addCheckIn({
      date: todayStr,
      mood: ciMood,
      energy: ciEnergy,
      motivation: ciMotivation,
      stress: ciStress,
      focus: ciFocus,
      sleepQuality: ciSleep,
      note: ciNote.trim() || undefined,
    });
    toast.success('Daily wellbeing check-in saved!');
    setShowCheckInModal(false);
    addTelemetryLog('✨ Daily wellbeing check-in recorded', 'health');
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    addGoal({
      title: newGoalTitle.trim(),
      description: newGoalDesc.trim() || 'Personal improvement goal',
      category: newGoalCategory,
      targetValue: newGoalTarget,
      unit: newGoalUnit,
    });
    setNewGoalTitle('');
    setNewGoalDesc('');
    setShowGoalModal(false);
    toast.success('Goal created successfully!');
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    addHabit({
      title: newHabitTitle.trim(),
      category: newHabitCategory,
      frequency: 'daily',
    });
    setNewHabitTitle('');
    setShowHabitModal(false);
    toast.success('Habit added!');
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jLearned.trim() && !jAccomplished.trim()) {
      toast.error('Please fill in at least what you learned or accomplished today.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    addJournalEntry({
      date: todayStr,
      title: jTitle.trim() || `Daily Reflection (${todayStr})`,
      learnedToday: jLearned.trim(),
      accomplished: jAccomplished.trim(),
      difficulties: jDifficulties.trim(),
      proudOf: jProudOf.trim(),
      tomorrowPlan: jTomorrow.trim(),
    });
    setJTitle('');
    setJLearned('');
    setJAccomplished('');
    setJDifficulties('');
    setJProudOf('');
    setJTomorrow('');
    toast.success('Journal entry saved privately!');
  };

  const handleSendCoachMsg = async (prompt?: string) => {
    const textToSend = prompt || coachInput;
    if (!textToSend.trim()) return;
    setCoachInput('');
    setIsCoachLoading(true);
    await sendCoachMessage(textToSend);
    setIsCoachLoading(false);
    setTimeout(() => coachChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatMinsSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalPageMinutes = Object.values(data.screenTimeByPage).reduce((a, b) => a + b, 0) || 1;
  const progressPercent = Math.min(((data.todayMinutes + (livePageSeconds / 60)) / data.dailyGoal) * 100, 100);
  const isFocusPaused = settings.focusMode && settings.focusPausedAt !== null;

  // Theme-dependent styling classes
  const themeContainerStyle = {
    cyberpunk: 'border border-cyan-500/30 bg-slate-950/85 backdrop-blur-xl shadow-[0_0_25px_rgba(6,182,212,0.15)] text-slate-100',
    zen: 'border border-emerald-500/30 bg-emerald-950/30 backdrop-blur-xl shadow-lg text-emerald-50 rounded-3xl',
    telemetry: 'border border-amber-500/30 bg-zinc-950/90 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.12)] text-amber-50 font-mono',
    solar: 'border border-yellow-500/30 bg-stone-900/85 backdrop-blur-xl text-yellow-50 shadow-md',
  }[designTheme];

  const themeAccentColor = {
    cyberpunk: 'text-cyan-400',
    zen: 'text-emerald-400',
    telemetry: 'text-amber-400',
    solar: 'text-yellow-400',
  }[designTheme];

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'checkin' as const, label: 'Daily Check-In', icon: UserCheck },
    { id: 'goals' as const, label: 'Goals & Habits', icon: Target },
    { id: 'journal' as const, label: 'Growth Journal', icon: BookOpen },
    { id: 'coach' as const, label: 'AI Coach', icon: MessageSquare },
    { id: 'focus' as const, label: 'Focus Engine', icon: Brain },
    { id: 'challenges' as const, label: 'Challenges', icon: Award },
    { id: 'alerts' as const, label: 'Settings', icon: Bell },
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckIn = checkIns.find(c => c.date === todayStr);

  return (
    <div className="min-h-screen relative pt-20 pb-12 px-4 transition-colors duration-500">
      <SEO
        title="Wellbeing & Self-Improvement Hub | Knowledge Universe"
        description="Empowering student balance, daily habits, goal tracking, focus soundscapes, and growth reflections."
        path="/wellbeing"
      />
      <GalaxyBackground />

      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        {/* Header & Theme Switcher */}
        <div className={`p-6 rounded-2xl ${themeContainerStyle} transition-all duration-500`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className={`h-7 w-7 ${themeAccentColor}`} />
                <h1 className="font-orbitron text-2xl sm:text-3xl font-bold tracking-tight">
                  Wellbeing & <span className={themeAccentColor}>Self-Improvement Hub</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 font-mono animate-pulse">
                  ● ACTIVE LEARNING
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-poppins mt-1">
                Maintain study-life balance, build sustainable habits, track personal goals, and reflect on your growth.
              </p>
            </div>

            {/* Design Theme Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 bg-black/40 rounded-xl border border-white/10">
              <span className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground px-2">
                <Palette className="h-3.5 w-3.5 text-primary" /> Theme:
              </span>
              <div className="grid grid-cols-2 sm:flex items-center gap-1 w-full sm:w-auto">
                {[
                  { id: 'cyberpunk', label: '🌌 Cyberpunk' },
                  { id: 'zen', label: '🌿 Zen' },
                  { id: 'telemetry', label: '⚡ Telemetry' },
                  { id: 'solar', label: '☀️ Solar' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id as DesignTheme)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      designTheme === t.id
                        ? 'bg-primary text-primary-foreground shadow-md font-bold scale-105'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-Time Ticker Banner */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-poppins">
            <div className="flex items-center gap-2">
              <Clock className={`h-4 w-4 ${themeAccentColor}`} />
              <div>
                <p className="text-muted-foreground text-[10px]">Active Page Session</p>
                <p className="font-bold font-mono text-foreground">{formatTime(livePageSeconds)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan-400" />
              <div>
                <p className="text-muted-foreground text-[10px]">Eye Rest (20-20-20)</p>
                <p className={`font-bold font-mono ${eyeRestCountdown < 120 ? 'text-amber-400 animate-bounce' : 'text-foreground'}`}>
                  {formatMinsSecs(eyeRestCountdown)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-muted-foreground text-[10px]">Hydration Log</p>
                <p className="font-bold font-mono text-foreground">{waterMl} / 2000 ml</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-muted-foreground text-[10px]">Focus Engine</p>
                <p className="font-bold font-mono text-foreground">{settings.focusMode ? 'ACTIVE' : 'IDLE'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-poppins transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Quick Actions Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setShowCheckInModal(true)}
                className="p-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <UserCheck className="h-4 w-4" /> Today's Check-In
              </button>
              <button
                onClick={() => setShowGoalModal(true)}
                className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add Goal
              </button>
              <button
                onClick={() => setShowHabitModal(true)}
                className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" /> Add Habit
              </button>
              <button
                onClick={() => setActiveTab('journal')}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <BookOpen className="h-4 w-4" /> Growth Journal
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Today's Learning Duration Ring */}
              <div className={`rounded-2xl p-6 ${themeContainerStyle} flex flex-col items-center justify-center text-center`}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 font-orbitron">
                  Today's Active Study Time
                </h3>
                <div className="relative w-44 h-44">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
                    <circle
                      cx="80" cy="80" r="70"
                      stroke={progressPercent > 80 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                      strokeWidth="12" fill="none" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 70}
                      strokeDashoffset={2 * Math.PI * 70 - (progressPercent / 100) * (2 * Math.PI * 70)}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-orbitron text-3xl font-extrabold text-foreground">
                      {Math.floor(data.todayMinutes + (livePageSeconds / 60))}
                    </span>
                    <span className="text-xs text-muted-foreground font-poppins">/ {data.dailyGoal} min goal</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-poppins">Daily goal:</span>
                  <input
                    type="number"
                    value={goalInput}
                    onChange={e => setGoalInput(Number(e.target.value))}
                    onBlur={() => setDailyGoal(goalInput)}
                    className="w-16 text-center bg-black/40 text-foreground text-xs rounded-lg px-2 py-1 border border-white/20 font-mono"
                  />
                  <span className="text-muted-foreground">min</span>
                </div>
              </div>

              {/* Core Stat Grid */}
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: Clock, label: 'Today Total', value: `${Math.floor(data.todayMinutes + (livePageSeconds / 60))}m`, color: 'text-cyan-400' },
                  { icon: BarChart3, label: 'This Week', value: `${Math.floor(data.weeklyMinutes / 60)}h ${Math.floor(data.weeklyMinutes % 60)}m`, color: 'text-purple-400' },
                  { icon: Eye, label: 'Sessions', value: data.sessionHistory.length.toString(), color: 'text-blue-400' },
                  { icon: Brain, label: 'Cognitive Balance', value: `${data.focusScore}%`, color: 'text-emerald-400' },
                  { icon: Target, label: 'Goal Reached', value: `${Math.floor(progressPercent)}%`, color: 'text-amber-400' },
                  { icon: Droplets, label: 'Hydration', value: `${waterMl}ml`, color: 'text-sky-400' },
                ].map((s) => (
                  <div key={s.label} className={`rounded-2xl p-4 ${themeContainerStyle} transition-all hover:scale-[1.02]`}>
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-2">
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <div className="font-orbitron text-lg font-bold text-foreground">{s.value}</div>
                    <div className="text-xs text-muted-foreground font-poppins">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Study Duration Chart */}
            <div className={`rounded-2xl p-6 ${themeContainerStyle}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2 font-orbitron">
                    <BarChart3 className={`h-4 w-4 ${themeAccentColor}`} /> Weekly Active Study Duration
                  </h3>
                  <p className="text-xs text-muted-foreground font-poppins mt-0.5">
                    Track daily active study minutes and maintain balanced study streaks across the week.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                  <span className="text-emerald-400 font-bold">AVG: {Math.round(data.weeklyMinutes / 7)}m/day</span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(data.weeklyData && data.weeklyData.length > 0)
                      ? data.weeklyData.map(d => ({
                          date: d.date,
                          duration: Math.round(d.totalMinutes),
                          sessions: d.sessions || 1,
                        }))
                      : [
                          { date: 'Mon', duration: 45, sessions: 2 },
                          { date: 'Tue', duration: 60, sessions: 3 },
                          { date: 'Wed', duration: 30, sessions: 1 },
                          { date: 'Thu', duration: 75, sessions: 4 },
                          { date: 'Fri', duration: 90, sessions: 5 },
                          { date: 'Sat', duration: 110, sessions: 6 },
                          { date: 'Sun', duration: Math.round(data.todayMinutes + (livePageSeconds / 60)), sessions: data.sessionHistory.length || 1 },
                        ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="Poppins"
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="Poppins"
                      unit="m"
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900/95 border border-cyan-500/40 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs font-poppins text-slate-100">
                              <p className="font-bold font-orbitron text-cyan-400">{label}</p>
                              <p className="text-emerald-400 mt-1 font-semibold">
                                Study Duration: <span className="font-mono text-white">{payload[0].value} mins</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="duration" radius={[8, 8, 0, 0]}>
                      {((data.weeklyData && data.weeklyData.length > 0) ? data.weeklyData : [1,2,3,4,5,6,7]).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 6 ? '#06b6d4' : index % 2 === 0 ? '#10b981' : '#f59e0b'}
                          className="hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Real-time Focus Waveform Canvas */}
            <div className={`rounded-2xl p-6 ${themeContainerStyle}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2 font-orbitron">
                  <Activity className={`h-4 w-4 ${themeAccentColor}`} /> Cognitive Focus Rhythm Waveform
                </h3>
                <span className="text-[10px] text-muted-foreground font-mono">LIVE WAVEFORM</span>
              </div>
              <div className="h-20 w-full bg-black/40 rounded-xl p-2 border border-white/10 overflow-hidden relative">
                <canvas ref={canvasRef} width={800} height={70} className="w-full h-full" />
              </div>
            </div>

            {/* Application Breakdown */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`rounded-2xl p-6 ${themeContainerStyle}`}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2 font-orbitron">
                  <Smartphone className={`h-4 w-4 ${themeAccentColor}`} /> Active Module Screen Time Breakdown
                </h3>
                {Object.keys(data.screenTimeByPage).length === 0 ? (
                  <p className="text-sm text-muted-foreground font-poppins">No page tracking recorded yet. Start exploring modules!</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.screenTimeByPage).sort((a, b) => b[1] - a[1]).map(([page, mins]) => (
                      <div key={page}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-foreground font-poppins font-medium">{page}</span>
                          <span className="text-muted-foreground font-mono">{Math.round(mins)}m</span>
                        </div>
                        <div className="h-2 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${(mins / totalPageMinutes) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ambient Focus Sound Synthesizer */}
              <div className={`rounded-2xl p-6 ${themeContainerStyle}`}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2 font-orbitron">
                  <Radio className={`h-4 w-4 ${themeAccentColor}`} /> Ambient Focus Soundscape Generator
                </h3>
                <p className="text-xs text-muted-foreground font-poppins mb-4">
                  Synthesize real-time soothing acoustic frequencies to boost cognitive focus and eliminate distractions.
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'binaural', label: '🧠 10Hz Alpha Beats' },
                      { id: 'rain', label: '🌧️ Soothing Rain' },
                      { id: 'space', label: '🌌 Deep Delta Space' },
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSoundType(s.id as any);
                          if (isPlayingSound) toggleAmbientSound();
                        }}
                        className={`p-2.5 rounded-xl text-xs font-poppins transition-all border ${
                          soundType === s.id
                            ? 'bg-primary/20 border-primary text-primary font-bold'
                            : 'bg-black/30 border-white/10 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAmbientSound}
                      className={`flex-1 py-3 rounded-xl font-poppins text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        isPlayingSound
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      }`}
                    >
                      {isPlayingSound ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isPlayingSound ? 'Pause Soundscape' : 'Play Soundscape'}
                    </button>

                    <div className="w-32 bg-black/40 p-2 rounded-xl border border-white/10 flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={e => {
                          const v = parseFloat(e.target.value);
                          setVolume(v);
                          if (soundGainNodeRef.current) soundGainNodeRef.current.gain.value = v;
                        }}
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DAILY CHECK-IN TAB */}
        {activeTab === 'checkin' && (
          <div className="space-y-6 animate-fade-in">
            <div className={`rounded-2xl p-6 ${themeContainerStyle} space-y-6`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="font-orbitron text-xl font-bold text-foreground flex items-center gap-2">
                    <UserCheck className={`h-6 w-6 ${themeAccentColor}`} /> Daily Wellbeing Check-In
                  </h2>
                  <p className="text-xs text-muted-foreground font-poppins mt-1">
                    Record your mood, energy, and stress levels to reflect on your learning rhythm.
                  </p>
                </div>
                {todayCheckIn && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Checked In Today
                  </span>
                )}
              </div>

              {/* Check-In Form */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Mood Selector */}
                <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/10">
                  <label className="text-xs font-semibold text-foreground block font-orbitron">How are you feeling today?</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'great', label: 'Great', emoji: '😄', color: 'text-emerald-400' },
                      { id: 'good', label: 'Good', emoji: '🙂', color: 'text-cyan-400' },
                      { id: 'okay', label: 'Okay', emoji: '😐', color: 'text-amber-400' },
                      { id: 'tired', label: 'Tired', emoji: '😔', color: 'text-purple-400' },
                      { id: 'stressed', label: 'Stressed', emoji: '😖', color: 'text-rose-400' },
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setCiMood(m.id as any)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          ciMood === m.id
                            ? 'bg-primary/20 border-primary scale-105 shadow-md'
                            : 'bg-black/20 border-white/5 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-2xl">{m.emoji}</span>
                        <span className="text-[10px] font-medium text-foreground">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Sliders */}
                <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-white/10">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">Energy Level: {ciEnergy} / 5</span>
                      <Zap className="h-4 w-4 text-amber-400" />
                    </div>
                    <input type="range" min="1" max="5" value={ciEnergy} onChange={e => setCiEnergy(Number(e.target.value))} className="w-full accent-amber-400" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">Motivation Level: {ciMotivation} / 5</span>
                      <Flame className="h-4 w-4 text-rose-400" />
                    </div>
                    <input type="range" min="1" max="5" value={ciMotivation} onChange={e => setCiMotivation(Number(e.target.value))} className="w-full accent-rose-400" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">Stress Level: {ciStress} / 5</span>
                      <Heart className="h-4 w-4 text-cyan-400" />
                    </div>
                    <input type="range" min="1" max="5" value={ciStress} onChange={e => setCiStress(Number(e.target.value))} className="w-full accent-cyan-400" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">Sleep Quality: {ciSleep} / 5</span>
                      <Moon className="h-4 w-4 text-purple-400" />
                    </div>
                    <input type="range" min="1" max="5" value={ciSleep} onChange={e => setCiSleep(Number(e.target.value))} className="w-full accent-purple-400" />
                  </div>
                </div>
              </div>

              {/* Optional Note */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block font-orbitron">Reflection Note (Optional)</label>
                <textarea
                  value={ciNote}
                  onChange={e => setCiNote(e.target.value)}
                  placeholder="How was your study day? Anything on your mind?"
                  rows={2}
                  className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => toast.info('Check-in skipped for now.')}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground text-xs font-poppins"
                >
                  Prefer not to answer
                </button>
                <button
                  type="button"
                  onClick={handleSaveCheckIn}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 hover:opacity-90"
                >
                  Save Daily Check-In
                </button>
              </div>

              {/* Recent Check-Ins History */}
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-xs font-semibold font-orbitron uppercase text-foreground mb-3">Recent Check-In History</h3>
                {checkIns.length === 0 ? (
                  <p className="text-xs text-muted-foreground font-poppins">No previous check-ins logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {checkIns.slice(0, 5).map(ci => (
                      <div key={ci.id} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-cyan-400 font-bold">{ci.date}</span>
                          <span className="capitalize font-semibold text-foreground">Mood: {ci.mood}</span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>⚡ Energy: {ci.energy}/5</span>
                          <span>🧠 Focus: {ci.focus}/5</span>
                          <span>😴 Sleep: {ci.sleepQuality}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GOALS & HABITS TAB */}
        {activeTab === 'goals' && (
          <div className="space-y-6 animate-fade-in">
            {/* Personal Goals Section */}
            <div className={`rounded-2xl p-6 ${themeContainerStyle} space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-orbitron text-lg font-bold text-foreground flex items-center gap-2">
                    <Target className={`h-5 w-5 ${themeAccentColor}`} /> Personal Self-Improvement Goals
                  </h2>
                  <p className="text-xs text-muted-foreground font-poppins mt-0.5">
                    Set tangible learning and habit objectives to keep your study journey structured.
                  </p>
                </div>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-md hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Add Goal
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {goals.map(goal => {
                  const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                  return (
                    <div key={goal.id} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 relative group">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                            {goal.category}
                          </span>
                          <h3 className="font-bold text-sm text-foreground mt-1.5">{goal.title}</h3>
                          <p className="text-xs text-muted-foreground">{goal.description}</p>
                        </div>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="text-muted-foreground hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-cyan-400 font-bold">{goal.currentValue} / {goal.targetValue} {goal.unit} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateGoalProgress(goal.id, 15)}
                            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono text-cyan-300"
                          >
                            +15 {goal.unit}
                          </button>
                          <button
                            onClick={() => updateGoalProgress(goal.id, 30)}
                            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono text-cyan-300"
                          >
                            +30 {goal.unit}
                          </button>
                        </div>
                        <button
                          onClick={() => toggleGoalStatus(goal.id)}
                          className={`px-3 py-1 rounded text-xs font-bold font-poppins transition-all ${
                            goal.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-white/5 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {goal.status === 'completed' ? '✓ Completed' : 'Mark Complete'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Habit Tracker */}
            <div className={`rounded-2xl p-6 ${themeContainerStyle} space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-orbitron text-lg font-bold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-purple-400" /> Daily Habits & Streaks
                  </h2>
                  <p className="text-xs text-muted-foreground font-poppins mt-0.5">
                    Build daily discipline by tracking essential study and wellness routines.
                  </p>
                </div>
                <button
                  onClick={() => setShowHabitModal(true)}
                  className="px-4 py-2 rounded-xl bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Add Habit
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {habits.map(habit => {
                  const isDoneToday = habit.completedDates.includes(todayStr);
                  return (
                    <div
                      key={habit.id}
                      className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                        isDoneToday
                          ? 'bg-purple-950/30 border-purple-500/40 text-foreground'
                          : 'bg-black/40 border-white/10 text-muted-foreground'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-purple-300">
                          {habit.category}
                        </span>
                        <h4 className="font-bold text-xs text-foreground mt-1">{habit.title}</h4>
                        <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">
                          🔥 {habit.streak} Day Streak
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleHabitForDate(habit.id)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            isDoneToday
                              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                              : 'bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/10'
                          }`}
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="text-muted-foreground hover:text-rose-400 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* GROWTH JOURNAL TAB */}
        {activeTab === 'journal' && (
          <div className="space-y-6 animate-fade-in">
            <div className={`rounded-2xl p-6 ${themeContainerStyle} space-y-6`}>
              <div>
                <h2 className="font-orbitron text-xl font-bold text-foreground flex items-center gap-2">
                  <BookOpen className={`h-6 w-6 ${themeAccentColor}`} /> Personal Growth & Reflection Journal
                </h2>
                <p className="text-xs text-muted-foreground font-poppins mt-1">
                  Private reflection entries to document your daily learning insights, challenges, and milestones.
                </p>
              </div>

              <form onSubmit={handleSaveJournal} className="space-y-4 bg-black/40 p-5 rounded-2xl border border-white/10">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground block font-orbitron">Entry Title</label>
                    <input
                      type="text"
                      value={jTitle}
                      onChange={e => setJTitle(e.target.value)}
                      placeholder="e.g., Deep Calculus Mastery & Reflection"
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground block font-orbitron">Date</label>
                    <input
                      type="text"
                      disabled
                      value={todayStr}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground block font-orbitron">What I Learned Today</label>
                    <textarea
                      value={jLearned}
                      onChange={e => setJLearned(e.target.value)}
                      placeholder="Key concepts, algorithms, theorems, or skills mastered..."
                      rows={3}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground block font-orbitron">What I Accomplished</label>
                    <textarea
                      value={jAccomplished}
                      onChange={e => setJAccomplished(e.target.value)}
                      placeholder="Completed problem sets, coding projects, or study blocks..."
                      rows={3}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground block font-orbitron">What Was Difficult?</label>
                    <textarea
                      value={jDifficulties}
                      onChange={e => setJDifficulties(e.target.value)}
                      placeholder="Tricky topics or distractions..."
                      rows={2}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground block font-orbitron">What Am I Proud Of?</label>
                    <textarea
                      value={jProudOf}
                      onChange={e => setJProudOf(e.target.value)}
                      placeholder="Personal wins or focus achievements..."
                      rows={2}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground block font-orbitron">Tomorrow's Focus Plan</label>
                    <textarea
                      value={jTomorrow}
                      onChange={e => setJTomorrow(e.target.value)}
                      placeholder="Top 2 priorities for tomorrow..."
                      rows={2}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 hover:opacity-90"
                  >
                    Save Reflection Entry
                  </button>
                </div>
              </form>

              {/* Saved Journal History */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-xs font-semibold font-orbitron uppercase text-foreground">Saved Reflections</h3>
                {journals.length === 0 ? (
                  <p className="text-xs text-muted-foreground font-poppins">No journal entries saved yet. Fill out the form above to record your first growth reflection!</p>
                ) : (
                  <div className="space-y-3">
                    {journals.map(j => (
                      <div key={j.id} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 relative group">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-foreground">{j.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-cyan-400">{j.date}</span>
                            <button
                              onClick={() => deleteJournalEntry(j.id)}
                              className="text-muted-foreground hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                          {j.learnedToday && (
                            <div>
                              <strong className="text-cyan-400 block text-[10px] font-mono uppercase">Learned:</strong>
                              <p>{j.learnedToday}</p>
                            </div>
                          )}
                          {j.accomplished && (
                            <div>
                              <strong className="text-emerald-400 block text-[10px] font-mono uppercase">Accomplished:</strong>
                              <p>{j.accomplished}</p>
                            </div>
                          )}
                          {j.proudOf && (
                            <div>
                              <strong className="text-amber-400 block text-[10px] font-mono uppercase">Proud Of:</strong>
                              <p>{j.proudOf}</p>
                            </div>
                          )}
                          {j.tomorrowPlan && (
                            <div>
                              <strong className="text-purple-400 block text-[10px] font-mono uppercase">Tomorrow's Plan:</strong>
                              <p>{j.tomorrowPlan}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI WELLBEING COACH TAB */}
        {activeTab === 'coach' && (
          <div className="space-y-6 animate-fade-in">
            <div className={`rounded-2xl p-6 ${themeContainerStyle} flex flex-col h-[600px]`}>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <MessageSquare className={`h-6 w-6 ${themeAccentColor}`} />
                  <div>
                    <h2 className="font-orbitron text-lg font-bold text-foreground">AI Wellbeing & Study Coach</h2>
                    <p className="text-xs text-muted-foreground font-poppins">
                      Supportive guidance for study routines, focus, habit building, and balance.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  ● NON-MEDICAL ADVISOR
                </span>
              </div>

              {/* Chat Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 my-2">
                {coachMessages.map(m => (
                  <div
                    key={m.id}
                    className={`flex gap-3 text-xs ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.sender === 'coach' && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3.5 rounded-2xl ${
                        m.sender === 'user'
                          ? 'bg-primary text-primary-foreground font-poppins rounded-br-none shadow-md'
                          : 'bg-black/50 border border-white/10 text-slate-200 font-poppins rounded-bl-none shadow-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                      <span className="text-[9px] opacity-60 mt-1 block text-right font-mono">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {isCoachLoading && (
                  <div className="flex gap-2 items-center text-xs text-muted-foreground font-mono animate-pulse">
                    <Sparkles className="h-4 w-4 text-primary" /> AI Coach is generating suggestions...
                  </div>
                )}
                <div ref={coachChatEndRef} />
              </div>

              {/* Quick Prompts */}
              <div className="flex gap-2 overflow-x-auto py-2 scrollbar-none border-t border-white/10">
                {[
                  'How can I maintain focus during long study blocks?',
                  'Tips for building a consistent morning routine?',
                  'How to prevent study burnout before exams?',
                  'Suggest 3 quick 5-minute eye rest breaks.',
                ].map(p => (
                  <button
                    key={p}
                    onClick={() => handleSendCoachMsg(p)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[11px] text-slate-300 whitespace-nowrap transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={coachInput}
                  onChange={e => setCoachInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendCoachMsg()}
                  placeholder="Ask your AI coach about study habits, focus tips, or routines..."
                  className="flex-1 p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-poppins"
                />
                <button
                  onClick={() => handleSendCoachMsg()}
                  disabled={isCoachLoading}
                  className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOCUS TAB */}
        {activeTab === 'focus' && (
          <div className="space-y-6 animate-fade-in">
            <div className={`rounded-2xl p-8 ${themeContainerStyle} flex flex-col items-center text-center`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${settings.focusMode ? 'bg-primary/20 border border-primary/50 animate-pulse' : 'bg-white/5'}`}>
                <Brain className={`h-10 w-10 ${settings.focusMode ? themeAccentColor : 'text-muted-foreground'}`} />
              </div>
              <h2 className="font-orbitron text-2xl font-bold text-foreground mb-1">Study Focus Session Timer</h2>
              <p className="text-xs text-muted-foreground font-poppins mb-6 max-w-md">
                Background focus timer persists seamlessly across app navigation and tab switches.
              </p>

              <div className="font-orbitron text-5xl font-extrabold tracking-widest text-primary mb-6">
                {formatTime(focusDisplay)}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (settings.focusMode) {
                      stopFocus();
                      addTelemetryLog('⏸ Focus session ended', 'focus');
                    } else {
                      startFocus();
                      addTelemetryLog('▶ Focus session started', 'focus');
                    }
                  }}
                  className={`px-6 py-3 rounded-xl font-poppins text-xs font-bold transition-all ${
                    settings.focusMode
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  }`}
                >
                  {settings.focusMode ? 'Stop Focus' : 'Start Focus Session'}
                </button>
                {settings.focusMode && (
                  <button
                    onClick={() => { if (isFocusPaused) resumeFocus(); else pauseFocus(); }}
                    className="px-4 py-3 rounded-xl bg-white/10 text-foreground hover:bg-white/20 transition-all"
                  >
                    {isFocusPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CHALLENGES TAB */}
        {activeTab === 'challenges' && (
          <div className="space-y-6 animate-fade-in">
            <div className={`rounded-2xl p-6 ${themeContainerStyle} space-y-4`}>
              <div>
                <h2 className="font-orbitron text-xl font-bold text-foreground flex items-center gap-2">
                  <Award className={`h-6 w-6 ${themeAccentColor}`} /> Self-Improvement Challenges
                </h2>
                <p className="text-xs text-muted-foreground font-poppins mt-1">
                  Complete wellness and learning milestones to earn XP and unlock digital badges.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {challenges.map(c => (
                  <div key={c.id} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {c.period} • +{c.xpReward} XP
                        </span>
                        <h3 className="font-bold text-sm text-foreground mt-2">{c.title}</h3>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                      </div>
                      <span className="text-xl">{c.badge.split(' ')[0]}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-amber-400 font-bold">{c.progress} / {c.target}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${Math.min(100, (c.progress / c.target) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                      <span className="text-xs font-mono text-amber-300">{c.badge}</span>
                      <button
                        disabled={c.completed || c.progress < c.target}
                        onClick={() => {
                          completeChallenge(c.id);
                          toast.success(`Challenge completed! Earned +${c.xpReward} XP!`);
                        }}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                          c.completed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : c.progress >= c.target
                            ? 'bg-amber-500 text-black shadow-md'
                            : 'bg-white/5 text-muted-foreground'
                        }`}
                      >
                        {c.completed ? '✓ Unlocked' : c.progress >= c.target ? 'Claim Reward' : 'In Progress'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS / ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="space-y-6 animate-fade-in">
            <div className={`rounded-2xl p-6 ${themeContainerStyle} space-y-6`}>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="font-orbitron text-base font-bold text-foreground flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" /> Wellbeing Controls & Bedtime Protection
                </h3>
                <Switch checked={settings.sleepMode} onCheckedChange={v => updateSettings({ sleepMode: v })} />
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Eye Strain 20-20-20 Break Alerts', key: 'breaks' },
                  { label: 'Daily Goal Progress Notifications', key: 'goals' },
                  { label: 'Habit Streak Encouragements', key: 'streaks' },
                  { label: 'Weekly Learning Balance Summary', key: 'weekly' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-xs font-poppins text-foreground">{n.label}</span>
                    <Switch
                      checked={settings.notifications[n.key] !== false}
                      onCheckedChange={v => updateSettings({
                        notifications: { ...settings.notifications, [n.key]: v }
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CHECK-IN MODAL */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-orbitron font-bold text-base text-cyan-400">Daily Wellbeing Check-In</h3>
              <button onClick={() => setShowCheckInModal(false)} className="text-muted-foreground hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-orbitron font-semibold">Mood Selection</label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'great', label: 'Great', emoji: '😄' },
                  { id: 'good', label: 'Good', emoji: '🙂' },
                  { id: 'okay', label: 'Okay', emoji: '😐' },
                  { id: 'tired', label: 'Tired', emoji: '😔' },
                  { id: 'stressed', label: 'Stressed', emoji: '😖' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setCiMood(m.id as any)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                      ciMood === m.id ? 'bg-cyan-500/20 border-cyan-400' : 'bg-black/30 border-white/10'
                    }`}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-[9px]">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Energy: {ciEnergy}/5</span>
                </div>
                <input type="range" min="1" max="5" value={ciEnergy} onChange={e => setCiEnergy(Number(e.target.value))} className="w-full accent-cyan-400" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Motivation: {ciMotivation}/5</span>
                </div>
                <input type="range" min="1" max="5" value={ciMotivation} onChange={e => setCiMotivation(Number(e.target.value))} className="w-full accent-cyan-400" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button onClick={() => setShowCheckInModal(false)} className="px-4 py-2 rounded-xl bg-white/5 text-xs">Cancel</button>
              <button onClick={handleSaveCheckIn} className="px-5 py-2 rounded-xl bg-cyan-500 font-bold text-xs text-black">Save Check-In</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateGoal} className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-orbitron font-bold text-base text-emerald-400">Add Personal Goal</h3>
              <button type="button" onClick={() => setShowGoalModal(false)} className="text-muted-foreground hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={e => setNewGoalTitle(e.target.value)}
                  placeholder="e.g., Study Physics 4 Hours This Week"
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <input
                  type="text"
                  value={newGoalDesc}
                  onChange={e => setNewGoalDesc(e.target.value)}
                  placeholder="Why this goal matters..."
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Target Value</label>
                  <input
                    type="number"
                    min="1"
                    value={newGoalTarget}
                    onChange={e => setNewGoalTarget(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Unit</label>
                  <input
                    type="text"
                    value={newGoalUnit}
                    onChange={e => setNewGoalUnit(e.target.value)}
                    placeholder="e.g., mins, days, books"
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button type="button" onClick={() => setShowGoalModal(false)} className="px-4 py-2 rounded-xl bg-white/5 text-xs">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-500 font-bold text-xs text-black">Create Goal</button>
            </div>
          </form>
        </div>
      )}

      {/* ADD HABIT MODAL */}
      {showHabitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateHabit} className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-orbitron font-bold text-base text-purple-400">Add Daily Habit</h3>
              <button type="button" onClick={() => setShowHabitModal(false)} className="text-muted-foreground hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Habit Title</label>
                <input
                  type="text"
                  required
                  value={newHabitTitle}
                  onChange={e => setNewHabitTitle(e.target.value)}
                  placeholder="e.g., Review flashcards for 15 mins"
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Category</label>
                <select
                  value={newHabitCategory}
                  onChange={e => setNewHabitCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-foreground"
                >
                  <option value="study">Study</option>
                  <option value="mindfulness">Mindfulness</option>
                  <option value="health">Health</option>
                  <option value="routine">Routine</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button type="button" onClick={() => setShowHabitModal(false)} className="px-4 py-2 rounded-xl bg-white/5 text-xs">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-purple-500 font-bold text-xs text-white">Add Habit</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Wellbeing;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import GalaxyBackground from '@/components/GalaxyBackground';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Trophy, Clock, Shield, Plus, ArrowLeft, Star, CheckCircle2, XCircle, Users, Swords } from 'lucide-react';
import { toast } from 'sonner';

interface Battle {
  id: string; subject: string; grade: number; status: string;
  host_id: string; host_name: string; host_score: number;
  challenger_id: string | null; challenger_name: string | null; challenger_score: number;
  winner_id: string | null; questions: Question[]; current_question: number;
  started_at: string | null;
}
interface Question { question: string; options: string[]; correct: number; }

const BATTLE_QUESTIONS: Record<string, Question[]> = {
  Mathematics: [
    { question: 'What is the derivative of x²?', options: ['x', '2x', '2', 'x²'], correct: 1 },
    { question: 'Solve: 2x + 5 = 13', options: ['x=3', 'x=4', 'x=5', 'x=6'], correct: 1 },
    { question: 'What is √144?', options: ['11', '12', '13', '14'], correct: 1 },
    { question: 'Area of circle with r=7 (π≈3.14)?', options: ['153.86', '143.86', '163.86', '133.86'], correct: 0 },
    { question: 'What is 15% of 200?', options: ['25', '30', '35', '40'], correct: 1 },
  ],
  Physics: [
    { question: 'Speed of light in m/s?', options: ['2×10⁸', '3×10⁸', '4×10⁸', '5×10⁸'], correct: 1 },
    { question: "Newton's 2nd Law?", options: ['F=mv', 'F=ma', 'F=mg', 'F=mc²'], correct: 1 },
    { question: 'Unit of electric current?', options: ['Volt', 'Watt', 'Ampere', 'Ohm'], correct: 2 },
    { question: 'What is gravitational acceleration on Earth?', options: ['8.9 m/s²', '9.8 m/s²', '10.8 m/s²', '7.9 m/s²'], correct: 1 },
    { question: 'What does E=mc² represent?', options: ['Force equation', 'Mass-energy equivalence', 'Wave equation', 'Power formula'], correct: 1 },
  ],
  General: [
    { question: 'Capital of Ethiopia?', options: ['Nairobi', 'Addis Ababa', 'Cairo', 'Khartoum'], correct: 1 },
    { question: 'Chemical symbol for water?', options: ['CO2', 'H2O', 'NaCl', 'O2'], correct: 1 },
    { question: 'How many bones in adult human body?', options: ['186', '206', '226', '246'], correct: 1 },
    { question: 'Who wrote Romeo and Juliet?', options: ['Dickens', 'Shakespeare', 'Austen', 'Chaucer'], correct: 1 },
    { question: 'Largest planet in solar system?', options: ['Saturn', 'Neptune', 'Jupiter', 'Uranus'], correct: 2 },
  ],
};

const SUBJECTS = ['General', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
const QUESTION_TIME = 15; // seconds per question

const QuizBattles = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [creating, setCreating] = useState(false);
  const [newSubject, setNewSubject] = useState('General');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [myScore, setMyScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [spectating, setSpectating] = useState(false);

  // ── Fetch active battles ──────────────────────────────────
  const { data: battles = [] } = useQuery<Battle[]>({
    queryKey: ['quiz_battles'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('quiz_battles').select('*')
        .in('status', ['waiting', 'active']).order('created_at', { ascending: false }).limit(20);
      return (data || []).map((b: any) => ({ ...b, questions: typeof b.questions === 'string' ? JSON.parse(b.questions) : b.questions || [] }));
    },
    refetchInterval: 4000,
  });

  // ── Poll active battle ────────────────────────────────────
  const { data: liveBattle } = useQuery<Battle | null>({
    queryKey: ['live_battle', activeBattle?.id],
    enabled: !!activeBattle?.id && !finished,
    queryFn: async () => {
      const { data } = await (supabase as any).from('quiz_battles').select('*').eq('id', activeBattle!.id).single();
      if (!data) return null;
      return { ...data, questions: typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions || [] };
    },
    refetchInterval: 2000,
  });

  useEffect(() => { if (liveBattle) setActiveBattle(liveBattle); }, [liveBattle]);

  const nextQuestionRef = useRef<() => void>(() => {});
  const handleTimeout = useCallback(() => {
    if (answered) return;
    setAnswered(true);
    nextQuestionRef.current();
  }, [answered]);

  // ── Timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (!activeBattle || activeBattle.status !== 'active' || answered || finished || spectating) return;
    if (timeLeft <= 0) { handleTimeout(); return; }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, answered, activeBattle?.status, finished, spectating, handleTimeout]);

  const questions: Question[] = activeBattle?.questions?.length
    ? activeBattle.questions
    : BATTLE_QUESTIONS[activeBattle?.subject || 'General'] || BATTLE_QUESTIONS.General;

  const q = questions[currentQ];

  const handleAnswer = async (idx: number) => {
    if (answered || !activeBattle || !user) return;
    setSelected(idx); setAnswered(true);
    const correct = idx === q?.correct;
    const newScore = correct ? myScore + 1 : myScore;
    if (correct) setMyScore(newScore);

    const isHost = activeBattle.host_id === user.id;
    const update = isHost ? { host_score: newScore } : { challenger_score: newScore };
    await (supabase as any).from('quiz_battles').update(update).eq('id', activeBattle.id);

    setTimeout(nextQuestion, 1200);
  };

  const finishBattleRef = useRef<(() => Promise<void>) | null>(null);

  const nextQuestion = useCallback(() => {
    const next = currentQ + 1;
    if (next >= questions.length) {
      finishBattleRef.current?.();
    } else {
      setCurrentQ(next); setSelected(null); setAnswered(false); setTimeLeft(QUESTION_TIME);
    }
  }, [currentQ, questions.length]);

  useEffect(() => { nextQuestionRef.current = nextQuestion; }, [nextQuestion]);

  const finishBattle = useCallback(async () => {
    if (!activeBattle || !user) return;
    setFinished(true);
    const isHost = activeBattle.host_id === user.id;
    const myFinalScore = myScore;
    const opponentScore = isHost ? activeBattle.challenger_score : activeBattle.host_score;
    const winnerId = myFinalScore > opponentScore ? user.id : (isHost ? activeBattle.challenger_id : activeBattle.host_id);
    await (supabase as any).from('quiz_battles').update({ status: 'finished', winner_id: winnerId, finished_at: new Date().toISOString() }).eq('id', activeBattle.id);
    qc.invalidateQueries({ queryKey: ['quiz_battles'] });
  }, [activeBattle, user, myScore, qc]);

  // Keep ref in sync
  useEffect(() => { finishBattleRef.current = finishBattle; }, [finishBattle]);

  const createBattle = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const qs = BATTLE_QUESTIONS[newSubject] || BATTLE_QUESTIONS.General;
      const { data, error } = await (supabase as any).from('quiz_battles').insert({
        subject: newSubject, host_id: user.id,
        host_name: (profile as any)?.name || 'Challenger',
        questions: JSON.stringify(qs),
        status: 'waiting',
      }).select().single();
      if (error) throw error;
      return { ...data, questions: qs };
    },
    onSuccess: (data) => {
      setActiveBattle(data); setCreating(false);
      setCurrentQ(0); setMyScore(0); setFinished(false);
      toast.success('⚔️ Battle arena created! Waiting for challenger...');
    },
    onError: () => toast.error('Failed to create battle'),
  });

  const joinBattle = useMutation({
    mutationFn: async (battle: Battle) => {
      if (!user?.id) throw new Error();
      const { data, error } = await (supabase as any).from('quiz_battles').update({
        challenger_id: user.id,
        challenger_name: (profile as any)?.name || 'Challenger',
        status: 'active', started_at: new Date().toISOString(),
      }).eq('id', battle.id).select().single();
      if (error) throw error;
      return { ...data, questions: battle.questions };
    },
    onSuccess: (data) => {
      setActiveBattle(data); setCurrentQ(0); setMyScore(0); setFinished(false); setTimeLeft(QUESTION_TIME);
      toast.success('⚔️ Battle joined! Fight!');
    },
    onError: () => toast.error('Could not join battle'),
  });

  const isHost = activeBattle?.host_id === user?.id;

  // ── FINISHED SCREEN ────────────────────────────────────────
  if (finished && activeBattle) {
    const won = activeBattle.winner_id === user?.id;
    const opponentScore = isHost ? activeBattle.challenger_score : activeBattle.host_score;
    return (
      <div className="min-h-screen relative pt-20 px-4 flex items-center justify-center">
        <GalaxyBackground />
        <div className="relative z-10 glass-strong rounded-2xl p-8 max-w-sm w-full text-center animate-slide-up neon-glow">
          <div className="text-6xl mb-4">{won ? '🏆' : '💪'}</div>
          <h2 className="font-orbitron text-2xl font-bold text-foreground mb-2">{won ? 'Victory!' : 'Defeated!'}</h2>
          <p className="text-muted-foreground font-poppins mb-5">{won ? 'Outstanding performance, cadet!' : 'Train harder and return stronger.'}</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="glass rounded-xl p-3 text-center">
              <div className="font-orbitron text-2xl font-bold text-primary">{myScore}</div>
              <div className="text-[10px] text-muted-foreground font-poppins">Your Score</div>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <div className="font-orbitron text-2xl font-bold text-secondary">{opponentScore}</div>
              <div className="text-[10px] text-muted-foreground font-poppins">Opponent</div>
            </div>
          </div>
          {won && <div className="flex items-center justify-center gap-1 text-yellow-400 font-orbitron text-sm mb-4"><Star className="h-4 w-4" /> +{myScore * 50} XP earned</div>}
          <button onClick={() => { setActiveBattle(null); setFinished(false); setCurrentQ(0); setMyScore(0); setSelected(null); setAnswered(false); }}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-orbitron text-sm neon-glow hover:scale-[1.02] transition-all">
            Back to Arena
          </button>
        </div>
      </div>
    );
  }

  // ── ACTIVE BATTLE ──────────────────────────────────────────
  if (activeBattle && (activeBattle.status === 'active' || activeBattle.status === 'waiting') && !finished) {
    if (activeBattle.status === 'waiting') {
      return (
        <div className="min-h-screen relative pt-20 px-4 flex items-center justify-center">
          <GalaxyBackground />
          <div className="relative z-10 glass-strong rounded-2xl p-8 max-w-sm w-full text-center neon-glow animate-slide-up">
            <div className="text-5xl mb-4 animate-pulse">⚔️</div>
            <h2 className="font-orbitron text-xl font-bold text-foreground mb-2">Waiting for Challenger</h2>
            <p className="text-muted-foreground font-poppins text-sm mb-5">Battle arena is open. Share this challenge!</p>
            <div className="glass rounded-xl p-3 mb-5">
              <p className="text-xs text-muted-foreground font-poppins">Subject: <span className="text-primary font-semibold">{activeBattle.subject}</span></p>
              <p className="text-xs text-muted-foreground font-poppins">Questions: <span className="text-foreground">{questions.length}</span></p>
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div>
            <button onClick={() => setActiveBattle(null)} className="w-full py-2.5 rounded-xl bg-muted text-muted-foreground font-orbitron text-xs">Cancel Battle</button>
          </div>
        </div>
      );
    }

    // Active battle question
    const opponentScore = isHost ? activeBattle.challenger_score : activeBattle.host_score;
    const opponentName = isHost ? activeBattle.challenger_name : activeBattle.host_name;

    return (
      <div className="min-h-screen relative pt-20 pb-10 px-4">
        <GalaxyBackground />
        <div className="max-w-2xl mx-auto relative z-10 animate-fade-in">
          {/* Scoreboard */}
          <div className="glass-strong rounded-2xl p-4 mb-4 flex items-center justify-between">
            <div className="text-center">
              <div className="font-orbitron text-2xl font-bold text-primary">{myScore}</div>
              <div className="text-[10px] text-muted-foreground font-poppins">You</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Swords className="h-5 w-5 text-primary" />
              <div className={`font-orbitron text-lg font-bold ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-foreground'}`}>{timeLeft}s</div>
              <div className="text-[9px] text-muted-foreground font-poppins">Q {currentQ + 1}/{questions.length}</div>
            </div>
            <div className="text-center">
              <div className="font-orbitron text-2xl font-bold text-secondary">{opponentScore}</div>
              <div className="text-[10px] text-muted-foreground font-poppins">{opponentName || 'Opponent'}</div>
            </div>
          </div>

          {/* Time bar */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-4">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000"
              style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }} />
          </div>

          {/* Question */}
          <div className="glass-strong rounded-2xl p-5 mb-4">
            <p className="text-xs text-muted-foreground font-poppins mb-2">{activeBattle.subject} · Battle Mode</p>
            <h3 className="font-poppins text-lg font-semibold text-foreground">{q?.question}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {q?.options.map((opt, i) => {
              let cls = 'glass border border-border hover:border-primary/50 hover:scale-[1.02]';
              if (answered) {
                if (i === q.correct) cls = 'glass border-2 border-green-500 bg-green-500/10';
                else if (i === selected) cls = 'glass border-2 border-red-500 bg-red-500/10';
              }
              return (
                <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
                  className={`p-4 rounded-xl text-left transition-all duration-200 ${cls}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-orbitron text-xs font-bold shrink-0 ${answered && i === q.correct ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="font-poppins text-sm text-foreground">{opt}</span>
                    {answered && i === q.correct && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                    {answered && i === selected && i !== q.correct && <XCircle className="h-4 w-4 text-red-500 ml-auto" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── BATTLE LIST ────────────────────────────────────────────
  return (
    <div className="min-h-screen relative pt-20 pb-10 px-4">
      <GalaxyBackground />
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="font-orbitron text-3xl font-bold text-primary neon-text flex items-center gap-3">
              <Swords className="h-8 w-8" /> Quiz Battles
            </h1>
            <p className="text-muted-foreground font-poppins text-sm mt-1">Challenge others. Prove your knowledge. Earn XP.</p>
          </div>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs neon-glow hover:scale-105 transition-all">
            <Plus className="h-4 w-4" /> Create Battle
          </button>
        </div>

        {/* Waiting battles */}
        <div className="space-y-3">
          <p className="text-[10px] text-muted-foreground font-poppins uppercase tracking-widest">Open Battles ({battles.filter(b => b.status === 'waiting').length})</p>
          {battles.filter(b => b.status === 'waiting' && b.host_id !== user?.id).map(battle => (
            <div key={battle.id} className="glass-strong rounded-2xl p-4 flex items-center justify-between border border-primary/20 hover:border-primary/40 transition-all animate-slide-up">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Swords className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-orbitron text-sm font-bold text-foreground">{battle.host_name} challenges you!</p>
                  <div className="flex gap-2 text-[10px] text-muted-foreground font-poppins">
                    <span>{battle.subject}</span>
                    <span>·</span>
                    <span>{battle.questions?.length || 5} questions</span>
                  </div>
                </div>
              </div>
              <button onClick={() => joinBattle.mutate(battle)} disabled={joinBattle.isPending}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs neon-glow hover:scale-105 transition-all disabled:opacity-50">
                ⚔️ Fight!
              </button>
            </div>
          ))}
          {battles.filter(b => b.status === 'waiting' && b.host_id !== user?.id).length === 0 && (
            <div className="glass rounded-2xl p-6 text-center">
              <Swords className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-poppins">No open battles right now.</p>
              <p className="text-xs text-muted-foreground/60 font-poppins mt-1">Create one and wait for a challenger!</p>
            </div>
          )}
        </div>

        {/* Create battle modal */}
        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
            <div className="glass-strong rounded-2xl p-6 max-w-xs w-full neon-glow animate-slide-up">
              <h3 className="font-orbitron text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Swords className="h-5 w-5 text-primary" /> Create Battle
              </h3>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs text-muted-foreground font-poppins">Subject</label>
                  <select value={newSubject} onChange={e => setNewSubject(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-poppins text-foreground focus:border-primary outline-none">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="glass rounded-xl p-3 text-xs text-muted-foreground font-poppins">
                  <p>📋 {(BATTLE_QUESTIONS[newSubject] || BATTLE_QUESTIONS.General).length} questions · ⏱ {QUESTION_TIME}s each</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCreating(false)} className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-orbitron text-xs">Cancel</button>
                <button onClick={() => createBattle.mutate()} disabled={createBattle.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs neon-glow disabled:opacity-50">
                  {createBattle.isPending ? 'Creating...' : 'Launch Battle'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizBattles;

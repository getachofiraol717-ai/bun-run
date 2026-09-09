import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import GalaxyBackground from '@/components/GalaxyBackground';
import SEO from '@/components/SEO';
import {
  Zap, Clock, CheckCircle2, XCircle, Trophy, RotateCcw, Star, Lock,
  ChevronRight, Flame, Shield, Sword, BookOpen, ArrowLeft, Rocket,
  Globe, Atom, Brain, FlaskConical, ChevronUp, ChevronDown, Sparkles, Medal,
  HelpCircle, Lightbulb, Target, BookMarked, Layers, FileText, AlertTriangle
} from 'lucide-react';
import {
  loadQuestionsFromSupabase,
  getQuestionsBySubjectAndGrade,
  getStoredQuestions,
  getCanonicalQuizzes,
  getCanonicalQuizById,
  recordQuizAttempt,
} from '@/lib/quizStore';
import {
  generateQuestionVariant,
  validateCanonicalQuestion,
} from '@/lib/quizGenerator';
import {
  classifyError,
  determineRetryAction,
  updateConceptMastery,
  getStoredConceptMasteries,
} from '@/lib/adaptiveMasteryEngine';
import {
  CanonicalQuiz,
  CanonicalQuestion,
  QuizAttemptRecord,
  QuestionAttempt,
  ConceptMasteryRecord,
  RetryDecision,
} from '@/types/canonicalQuiz';
import { trackEvent } from '@/hooks/useAdminData';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Question {
  id: number | string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  hint?: string;
  learningObjective?: string;
  familyId?: string;
}

type QuizMode = 'select-mode' | 'subject-select' | 'general-levels' | 'ai-quizzes' | 'playing' | 'finished';
type PlaySource = 'general' | 'subject' | 'ai_generated';

const MAX_LEVEL = 100000;

const defaultQuestionBank: Question[] = [
  { id: 1, question: 'What is the value of π (pi) to two decimal places?', options: ['3.12', '3.14', '3.16', '3.18'], correct: 1, explanation: 'π ≈ 3.14159... The value to two decimal places is 3.14.' },
  { id: 2, question: "What is Newton's Second Law of Motion?", options: ['F = mv', 'F = ma', 'F = mg', 'F = mc²'], correct: 1, explanation: "Newton's Second Law states F = ma (Force = mass × acceleration)." },
  { id: 3, question: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'NaCl', 'O2'], correct: 0, explanation: 'Water is H₂O — two hydrogen atoms bonded to one oxygen atom.' },
  { id: 4, question: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'], correct: 2, explanation: "Mitochondria generate most of the cell's ATP energy supply." },
  { id: 5, question: 'What is the capital of Ethiopia?', options: ['Nairobi', 'Addis Ababa', 'Cairo', 'Khartoum'], correct: 1, explanation: 'Addis Ababa is the capital and largest city of Ethiopia.' },
];

const getLevelQuestions = (level: number, count: number): Question[] => {
  const seed = level * 7;
  const shuffled = [...defaultQuestionBank].sort((a, b) => {
    const numA = typeof a.id === 'number' ? a.id : parseInt(a.id as string) || 0;
    const numB = typeof b.id === 'number' ? b.id : parseInt(b.id as string) || 0;
    return (((numA + seed) * 2654435761) % 2147483647) - (((numB + seed) * 2654435761) % 2147483647);
  });
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

const getLevelConfig = (level: number) => {
  const questionsCount = Math.min(3 + Math.floor(level / 5), 10);
  const timePerQuestion = Math.max(30 - Math.floor(level / 10), 10);
  const totalTime = questionsCount * timePerQuestion;
  const passThreshold = level <= 5 ? 0.5 : level <= 20 ? 0.6 : level <= 50 ? 0.7 : 0.8;
  const xpReward = level * 10 + Math.floor(level / 10) * 50;
  let difficulty = 'Easy', diffColor = 'text-green-400';
  if (level > 50) { difficulty = 'Legendary'; diffColor = 'text-red-400'; }
  else if (level > 20) { difficulty = 'Hard'; diffColor = 'text-orange-400'; }
  else if (level > 10) { difficulty = 'Medium'; diffColor = 'text-yellow-400'; }
  return { questionsCount, totalTime, passThreshold, xpReward, difficulty, diffColor };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CANONICAL QUIZ PAGE
// ─────────────────────────────────────────────────────────────────────────────
export const Quiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<QuizMode>('select-mode');
  const [playSource, setPlaySource] = useState<PlaySource>('general');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(0);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  // AI Generated Canonical Quiz active state
  const [activeCanonicalQuiz, setActiveCanonicalQuiz] = useState<CanonicalQuiz | null>(null);
  const [canonicalQuestions, setCanonicalQuestions] = useState<CanonicalQuestion[]>([]);
  const [canonicalAttempts, setCanonicalAttempts] = useState<QuestionAttempt[]>([]);
  const [currentRetryDecision, setCurrentRetryDecision] = useState<RetryDecision | null>(null);
  const [consecutiveFailuresMap, setConsecutiveFailuresMap] = useState<Record<string, number>>({});
  const [conceptMasteries, setConceptMasteries] = useState<Record<string, ConceptMasteryRecord>>({});

  // General quiz progress - strictly scoped per user
  const levelStorageKey = user?.id ? `ku_quiz_level_${user.id}` : 'ku_quiz_level_guest';
  const xpStorageKey = user?.id ? `ku_quiz_xp_${user.id}` : 'ku_quiz_xp_guest';

  const [currentLevel, setCurrentLevel] = useState(() => parseInt(localStorage.getItem(levelStorageKey) ?? '1'));
  const [totalXP, setTotalXP] = useState(() => parseInt(localStorage.getItem(xpStorageKey) ?? '0'));

  // Sync state when user logs in/out or switches account
  useEffect(() => {
    const keyL = user?.id ? `ku_quiz_level_${user.id}` : 'ku_quiz_level_guest';
    const keyX = user?.id ? `ku_quiz_xp_${user.id}` : 'ku_quiz_xp_guest';
    setCurrentLevel(parseInt(localStorage.getItem(keyL) ?? '1'));
    setTotalXP(parseInt(localStorage.getItem(keyX) ?? '0'));
    setConceptMasteries(getStoredConceptMasteries(user?.id));
  }, [user?.id]);

  // Playing state
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [passed, setPassed] = useState(false);
  const [playingLevel, setPlayingLevel] = useState(1);
  const [levelPage, setLevelPage] = useState(0);
  const [subjectQuestions, setSubjectQuestions] = useState<Question[]>([]);
  const [showHintInline, setShowHintInline] = useState(false);

  // Earn XP animation
  const [xpPopup, setXpPopup] = useState<number | null>(null);
  const [newBadge, setNewBadge] = useState<string | null>(null);

  useEffect(() => {
    loadQuestionsFromSupabase().then(() => setQuestionsLoaded(true));
  }, []);

  // Check URL parameters for direct Quiz launch (e.g., ?quizId=quiz_xxx)
  useEffect(() => {
    const quizId = searchParams.get('quizId');
    const playMode = searchParams.get('mode');
    if (quizId) {
      const found = getCanonicalQuizById(quizId);
      if (found) {
        startCanonicalQuizSession(found, playMode === 'playing');
      }
    }
  }, [searchParams]);

  // Build questions for current play session
  const levelConfig = useMemo(() => getLevelConfig(playingLevel), [playingLevel]);

  const questions = useMemo((): Question[] => {
    if (playSource === 'ai_generated' && canonicalQuestions.length > 0) {
      return canonicalQuestions.map((cq) => ({
        id: cq.id,
        question: cq.question,
        options: cq.options,
        correct: cq.correct,
        explanation: cq.explanation,
        hint: cq.hint,
        learningObjective: cq.learningObjective,
        familyId: cq.familyId,
      }));
    }
    if (playSource === 'subject' && subjectQuestions.length > 0) return subjectQuestions;
    return getLevelQuestions(playingLevel, levelConfig.questionsCount);
  }, [playSource, canonicalQuestions, subjectQuestions, playingLevel, levelConfig.questionsCount]);

  const currentPassThreshold = useMemo(() => {
    if (playSource === 'ai_generated') return 0.6;
    return levelConfig.passThreshold;
  }, [playSource, levelConfig.passThreshold]);

  // Start Canonical AI Quiz Session
  const startCanonicalQuizSession = (quiz: CanonicalQuiz, autoPlay = true) => {
    setActiveCanonicalQuiz(quiz);
    setCanonicalQuestions(quiz.questions);
    setPlaySource('ai_generated');
    setStarted(autoPlay);
    setFinished(false);
    setMode(autoPlay ? 'playing' : 'ai-quizzes');
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setCanonicalAttempts([]);
    setCurrentRetryDecision(null);
    setTimeLeft(Math.max(60, quiz.questions.length * 45));
    setPassed(false);
  };

  // Finish quiz execution
  const finishQuiz = useCallback(() => {
    setFinished(true);
    setStarted(false);
    setMode('finished');
    const pct = score / questions.length;
    const didPass = pct >= currentPassThreshold;
    setPassed(didPass);

    if (playSource === 'ai_generated' && activeCanonicalQuiz) {
      const attemptRecord: QuizAttemptRecord = {
        attemptId: `att_${Date.now()}`,
        quizId: activeCanonicalQuiz.quizId,
        studentId: user?.id || 'guest',
        attemptedAt: new Date().toISOString(),
        scorePercentage: Math.round(pct * 100),
        passed: didPass,
        attempts: canonicalAttempts,
        consecutiveFailures: consecutiveFailuresMap,
      };
      recordQuizAttempt(attemptRecord, user?.id);
    }

    if (isAuthenticated) {
      trackEvent('quiz_attempt', 'Quiz', {
        score, total: questions.length,
        level: playingLevel, source: playSource,
        subject: selectedSubject || 'general', passed: didPass,
      });
    }

    if (playSource === 'general') {
      if (didPass && playingLevel === currentLevel) {
        const newLevel = currentLevel + 1;
        const newXP = totalXP + levelConfig.xpReward;
        setCurrentLevel(newLevel);
        setTotalXP(newXP);
        const keyL = user?.id ? `ku_quiz_level_${user.id}` : 'ku_quiz_level_guest';
        const keyX = user?.id ? `ku_quiz_xp_${user.id}` : 'ku_quiz_xp_guest';
        localStorage.setItem(keyL, String(newLevel));
        localStorage.setItem(keyX, String(newXP));
      }
    }
  }, [score, questions.length, currentPassThreshold, playSource, activeCanonicalQuiz, canonicalAttempts, consecutiveFailuresMap, playingLevel, currentLevel, totalXP, levelConfig, selectedSubject, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!started || finished) return;
    if (timeLeft <= 0) { finishQuiz(); return; }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [started, finished, timeLeft, finishQuiz]);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);

    const currentQuestion = canonicalQuestions[currentQ] || {
      id: questions[currentQ]?.id || currentQ,
      question: questions[currentQ]?.question || '',
      options: questions[currentQ]?.options || [],
      correct: questions[currentQ]?.correct || 0,
      explanation: questions[currentQ]?.explanation || '',
      subject: activeCanonicalQuiz?.subject || 'General',
      topic: activeCanonicalQuiz?.topic || 'General',
      learningObjective: questions[currentQ]?.learningObjective || 'Core Concept',
      variantId: `${questions[currentQ]?.id || currentQ}_v1`,
    };

    const isCorrect = idx === currentQuestion.correct;
    if (isCorrect) setScore(s => s + 1);

    // Update Adaptive Mastery & Classification
    const key = currentQuestion.id.toString();
    const prevFailures = consecutiveFailuresMap[key] || 0;
    const newFailures = isCorrect ? 0 : prevFailures + 1;

    setConsecutiveFailuresMap(prev => ({ ...prev, [key]: newFailures }));

    // Record question attempt
    const selectedText = currentQuestion.options[idx] || '';
    const correctText = currentQuestion.options[currentQuestion.correct] || '';
    const errorType = isCorrect ? undefined : classifyError(selectedText, correctText, currentQuestion as CanonicalQuestion);

    const attemptItem: QuestionAttempt = {
      questionId: currentQuestion.id.toString(),
      variantId: currentQuestion.variantId || `${currentQuestion.id}_v1`,
      selectedOption: idx,
      isCorrect,
      timeSpentSeconds: 15,
      errorClassification: errorType,
    };

    setCanonicalAttempts(prev => [...prev, attemptItem]);

    // Update concept mastery record
    const updatedMastery = updateConceptMastery(
      currentQuestion.subject || 'General',
      currentQuestion.topic || 'General',
      currentQuestion.learningObjective || 'Core Concept',
      isCorrect,
      user?.id
    );

    setConceptMasteries(getStoredConceptMasteries(user?.id));

    // Determine Retry Decision
    const decision = determineRetryAction(attemptItem, currentQuestion as CanonicalQuestion, newFailures);
    setCurrentRetryDecision(decision);
  };

  const handleApplyVariant = () => {
    if (!currentRetryDecision?.nextVariant) return;
    const variant = currentRetryDecision.nextVariant;

    // Replace current question in canonicalQuestions array with the new variant!
    const updatedQs = [...canonicalQuestions];
    updatedQs[currentQ] = variant;

    // Validate variant before presentation
    const val = validateCanonicalQuestion(variant);
    if (!val.valid) {
      console.warn('Variant validation failed:', val.reason);
    }

    setCanonicalQuestions(updatedQs);
    setSelected(null);
    setAnswered(false);
    setShowHintInline(false);
    setCurrentRetryDecision(null);
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setAnswered(false);
      setShowHintInline(false);
      setCurrentRetryDecision(null);
    } else {
      finishQuiz();
    }
  };

  const backToMain = () => {
    setMode('select-mode');
    setStarted(false);
    setFinished(false);
    setSelectedSubject('');
    setSelectedGrade(0);
    setSubjectQuestions([]);
    setActiveCanonicalQuiz(null);
    setCanonicalQuestions([]);
    setPlaySource('general');
  };

  const q = questions[currentQ];
  const progress = ((currentQ + (answered ? 1 : 0)) / questions.length) * 100;
  const canonicalQuizzes = getCanonicalQuizzes();

  if (!questionsLoaded) {
    return (
      <div className="min-h-screen relative pt-20 pb-10 px-4">
        <GalaxyBackground />
        <div className="max-w-2xl mx-auto relative z-10 text-center py-20">
          <Rocket className="h-12 w-12 text-primary mx-auto mb-4 animate-bounce" />
          <p className="text-muted-foreground font-poppins">Launching canonical quiz engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-20 pb-10 px-4">
      <SEO
        title="Interactive Quizzes & Mastery Challenges | Knowledge Universe"
        description="Test your curriculum knowledge across all subjects, earn XP, and level up with adaptive quizzes."
        path="/quiz"
      />
      <GalaxyBackground />

      {/* XP Popup */}
      {xpPopup && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-none">
          <div className="glass-strong rounded-2xl px-6 py-3 border border-yellow-400/40 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            <span className="font-orbitron text-lg font-bold text-yellow-400">+{xpPopup} XP</span>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto relative z-10">

        {/* ══════════════════════════════════════════════════════════════════
            MODE SELECT
        ══════════════════════════════════════════════════════════════════ */}
        {mode === 'select-mode' && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sword className="h-8 w-8 text-primary" />
                <h1 className="font-orbitron text-2xl sm:text-3xl font-bold text-foreground">Quiz Arena</h1>
              </div>
              <p className="text-muted-foreground font-poppins text-sm">Canonical Adaptive Mastery System</p>
            </div>

            {/* XP Bar & Stats */}
            <div className="glass rounded-2xl p-4 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-orbitron text-sm text-foreground">Lv {currentLevel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="font-orbitron text-sm text-primary">{totalXP.toLocaleString()} XP</span>
              </div>
            </div>

            <div className="grid gap-4">
              {/* AI Generated Quizzes — CANONICAL AI QUIZ STORE */}
              <button
                onClick={() => setMode('ai-quizzes')}
                className="glass-strong rounded-2xl p-6 text-left hover:neon-glow transition-all hover:scale-[1.02] border-2 border-amber-500/40 relative overflow-hidden"
              >
                <div className="absolute top-2 right-3 text-[10px] uppercase font-orbitron text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                  ⚡ AI Generated & Adaptive
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-lg font-bold text-foreground">AI Tutor Generated Quizzes</h3>
                    <p className="text-xs text-muted-foreground font-poppins">PDF Quizzes • MargeOS • Adaptive Mastery ({canonicalQuizzes.length} Available)</p>
                  </div>
                </div>
                {canonicalQuizzes.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {canonicalQuizzes.slice(0, 3).map((cq) => (
                      <span key={cq.quizId} className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-poppins">
                        {cq.title}
                      </span>
                    ))}
                  </div>
                )}
              </button>

              {/* General Quiz */}
              <button onClick={() => setMode('general-levels')}
                className="glass-strong rounded-2xl p-6 text-left hover:neon-glow transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-lg font-bold text-foreground">General Quiz</h3>
                    <p className="text-xs text-muted-foreground font-poppins">100,000 levels • Mixed subjects</p>
                  </div>
                </div>
              </button>

              {/* Subject Quiz */}
              <button onClick={() => setMode('subject-select')}
                className="glass-strong rounded-2xl p-6 text-left hover:neon-glow transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-lg font-bold text-foreground">Subject Quiz Tracks</h3>
                    <p className="text-xs text-muted-foreground font-poppins">By subject & grade (9-12)</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            AI GENERATED CANONICAL QUIZZES VIEW
        ══════════════════════════════════════════════════════════════════ */}
        {mode === 'ai-quizzes' && (
          <div className="animate-fade-in space-y-4">
            <button onClick={backToMain} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-poppins mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to Quiz Arena
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-orbitron text-xl font-bold text-foreground flex items-center gap-2">
                  <Brain className="h-6 w-6 text-amber-400" /> AI Generated Quizzes
                </h1>
                <p className="text-xs text-muted-foreground font-poppins">Quizzes generated by Main AI Tutor, Library PDF AI, or MargeOS Engine</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                {canonicalQuizzes.length} Quizzes Stored
              </span>
            </div>

            {canonicalQuizzes.length === 0 ? (
              <div className="glass-strong rounded-2xl p-8 text-center space-y-3">
                <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="font-orbitron text-base text-foreground">No Generated Quizzes Yet</h3>
                <p className="text-xs text-muted-foreground font-poppins max-w-md mx-auto">
                  Ask AI Tutor in chat or open Library → PDF AI Tutor and click "Practice Quiz" to generate adaptive quizzes that appear right here!
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {canonicalQuizzes.map((quiz) => (
                  <div key={quiz.quizId} className="glass-strong rounded-2xl p-4 border border-amber-500/30 hover:border-amber-500/60 transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {quiz.sourceType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                            {quiz.difficulty}
                          </span>
                        </div>
                        <h3 className="font-orbitron text-base font-bold text-foreground">{quiz.title}</h3>
                        <p className="text-xs text-muted-foreground font-poppins">
                          {quiz.subject} • {quiz.topic} {quiz.sourceDocumentId ? `(${quiz.sourceDocumentId})` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startCanonicalQuizSession(quiz, true)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-orbitron font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Zap className="h-4 w-4 fill-black" /> Play Quiz
                        </button>
                      </div>
                    </div>

                    {/* Learning Objectives List */}
                    {quiz.learningObjectives && quiz.learningObjectives.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1 font-semibold text-amber-400 text-[11px]">
                          <Target className="h-3.5 w-3.5" /> Learning Objectives:
                        </div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {quiz.learningObjectives.slice(0, 3).map((obj, i) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SUBJECT SELECT VIEW
        ══════════════════════════════════════════════════════════════════ */}
        {mode === 'subject-select' && (
          <div className="animate-fade-in">
            <button onClick={backToMain} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-poppins mb-4">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="font-orbitron text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-secondary" /> Subject Quiz Tracks
            </h2>
            <div className="space-y-3">
              {['Mathematics', 'Physics', 'Chemistry', 'Biology'].map((sub) => (
                <div key={sub} className="glass-strong rounded-2xl p-4">
                  <h3 className="font-orbitron text-sm font-bold text-foreground mb-2">{sub}</h3>
                  <div className="flex gap-2">
                    {[9, 10, 11, 12].map((gr) => (
                      <button
                        key={gr}
                        onClick={() => {
                          const stored = getQuestionsBySubjectAndGrade(sub, gr);
                          setSubjectQuestions(stored.map((sq, i) => ({
                            id: sq.id || i, question: sq.question, options: sq.options, correct: sq.correct, explanation: sq.explanation
                          })));
                          setSelectedSubject(sub);
                          setSelectedGrade(gr);
                          setPlaySource('subject');
                          setStarted(true);
                          setMode('playing');
                          setCurrentQ(0);
                          setScore(0);
                          setTimeLeft(120);
                        }}
                        className="px-3 py-1.5 rounded-xl glass border border-border hover:border-primary text-xs font-orbitron"
                      >
                        Grade {gr}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            GENERAL LEVELS VIEW
        ══════════════════════════════════════════════════════════════════ */}
        {mode === 'general-levels' && (
          <div className="animate-fade-in">
            <button onClick={backToMain} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-poppins mb-4">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="text-center mb-6">
              <h1 className="font-orbitron text-2xl font-bold text-foreground">General Quiz</h1>
              <p className="text-muted-foreground font-poppins text-sm">Conquer levels, earn XP</p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-4">
              {Array.from({ length: 20 }, (_, i) => levelPage * 20 + i + 1).map((level) => {
                const unlocked = level <= currentLevel;
                return (
                  <button
                    key={level}
                    onClick={() => {
                      if (unlocked) {
                        setPlayingLevel(level);
                        setPlaySource('general');
                        setStarted(true);
                        setMode('playing');
                        setCurrentQ(0);
                        setScore(0);
                        setTimeLeft(getLevelConfig(level).totalTime);
                      }
                    }}
                    disabled={!unlocked}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center font-orbitron text-xs font-bold border ${
                      level === currentLevel ? 'glass-strong border-primary text-primary neon-glow' : 'glass border-border text-foreground'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PLAYING MODE — ADAPTIVE MASTERY ENGINE INTEGRATED
        ══════════════════════════════════════════════════════════════════ */}
        {mode === 'playing' && q && (
          <div className="animate-fade-in space-y-4">
            <div className="glass rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-orbitron text-xs text-foreground">
                  {playSource === 'ai_generated' ? activeCanonicalQuiz?.title : `Level ${playingLevel}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${timeLeft <= 10 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
                <span className={`font-orbitron text-sm ${timeLeft <= 10 ? 'text-destructive' : 'text-foreground'}`}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-primary" />
                <span className="font-orbitron text-xs text-primary">{score}/{questions.length}</span>
              </div>
            </div>

            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            {/* Question Card */}
            <div className="glass-strong rounded-2xl p-6 space-y-3 border border-border/50">
              {q.learningObjective && (
                <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" /> {q.learningObjective}
                </div>
              )}
              <p className="text-xs text-muted-foreground font-poppins">Question {currentQ + 1} of {questions.length}</p>
              <h2 className="font-poppins text-lg font-semibold text-foreground leading-relaxed">{q.question}</h2>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {q.options.map((opt, i) => {
                let cls = 'glass border border-border hover:border-amber-500/50';
                if (answered) {
                  if (i === q.correct) cls = 'glass border-2 border-emerald-500 bg-emerald-500/10 text-emerald-300';
                  else if (i === selected && i !== q.correct) cls = 'glass border-2 border-destructive bg-destructive/10 text-red-300';
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={answered}
                    className={`w-full p-3.5 rounded-xl text-left transition-all duration-300 ${cls}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center font-orbitron text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="font-poppins text-sm text-foreground flex-1">{opt}</span>
                      {answered && i === q.correct && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
                      {answered && i === selected && i !== q.correct && <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Adaptive Remediation & Retry Decision Card */}
            {answered && currentRetryDecision && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 text-xs space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5 text-sm">
                    <Lightbulb className="h-4 w-4" /> Adaptive Feedback
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                    {currentRetryDecision.action}
                  </span>
                </div>

                <p className="text-muted-foreground">{currentRetryDecision.message}</p>

                {currentRetryDecision.remediationExplanation && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1">
                    <div className="font-semibold text-amber-300">Worked Explanation:</div>
                    <pre className="whitespace-pre-wrap font-sans text-xs">{currentRetryDecision.remediationExplanation}</pre>
                  </div>
                )}

                {/* Parameterized Variant Action */}
                {currentRetryDecision.nextVariant && (
                  <div className="pt-1">
                    <button
                      onClick={handleApplyVariant}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="h-4 w-4" /> Practice New Parameter Variant
                    </button>
                  </div>
                )}
              </div>
            )}

            {answered && (
              <button
                onClick={nextQuestion}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-orbitron font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {currentQ < questions.length - 1 ? <>Next Question <ChevronRight className="h-4 w-4" /></> : <>Finish Quiz <Trophy className="h-4 w-4" /></>}
              </button>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            FINISHED VIEW
        ══════════════════════════════════════════════════════════════════ */}
        {mode === 'finished' && (
          <div className="animate-fade-in text-center space-y-4">
            <div className="glass-strong rounded-2xl p-8 space-y-3">
              <div className="text-6xl">{passed ? '🏆' : '💪'}</div>
              <h2 className="font-orbitron text-2xl font-bold text-foreground">
                {passed ? 'Quiz Mastered!' : 'Keep Practicing!'}
              </h2>
              <p className="text-muted-foreground font-poppins text-sm">
                Final Score: {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)
              </p>
              <p className="text-xs text-muted-foreground font-poppins">
                Pass Threshold: {Math.round(currentPassThreshold * 100)}%
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={backToMain}
                className="py-3 rounded-xl glass text-foreground font-orbitron text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Menu
              </button>
              <button
                onClick={() => setMode('ai-quizzes')}
                className="py-3 rounded-xl bg-amber-500 text-black font-orbitron font-bold text-sm shadow-md hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Brain className="h-4 w-4" /> View AI Quizzes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;

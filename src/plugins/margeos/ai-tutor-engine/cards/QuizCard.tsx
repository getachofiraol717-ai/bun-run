import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, HelpCircle, Award, Play, ExternalLink, RotateCcw, Bookmark, Clock, BookOpen, Target } from "lucide-react";
import { createCanonicalQuizFromAI } from "@/lib/quizGenerator";
import { saveCanonicalQuiz, getCanonicalQuizById } from "@/lib/quizStore";
import { CanonicalQuiz, QuizSourceType } from "@/types/canonicalQuiz";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer?: number;
  correct?: number;
  explanation?: string;
  hint?: string;
  learningObjective?: string;
}

export interface QuizCardData {
  quizId?: string;
  title?: string;
  subject?: string;
  topic?: string;
  chapter?: string;
  sourceType?: QuizSourceType;
  sourceDocumentId?: string;
  sourcePage?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Advanced';
  estimatedMinutes?: number;
  learningObjectives?: string[];
  questions: QuizQuestion[];
}

export const QuizCard: React.FC<{ data: QuizCardData }> = ({ data }) => {
  const navigate = useNavigate();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});
  const [canonicalQuiz, setCanonicalQuiz] = useState<CanonicalQuiz | null>(null);
  const [saved, setSaved] = useState(false);
  const [inlineMode, setInlineMode] = useState<'overview' | 'interactive'>('overview');

  useEffect(() => {
    // If data already represents or maps to a canonical quiz, create or retrieve it
    if (data.questions && data.questions.length > 0) {
      const formattedQuestions = data.questions.map((q) => ({
        question: q.question,
        options: q.options || [],
        correct: typeof q.correctAnswer === 'number' ? q.correctAnswer : (typeof q.correct === 'number' ? q.correct : 0),
        explanation: q.explanation || '',
        learningObjective: q.learningObjective,
      }));

      const quiz = createCanonicalQuizFromAI({
        title: data.title || "Concept Mastery Quiz",
        subject: data.subject || "General",
        topic: data.topic || data.title || "Topic Review",
        chapter: data.chapter,
        sourceType: data.sourceType || "AI_TUTOR",
        sourceDocumentId: data.sourceDocumentId,
        sourcePage: data.sourcePage,
        difficulty: data.difficulty || "Medium",
        questions: formattedQuestions,
      });

      // Save to canonical quiz store automatically
      const savedQuiz = saveCanonicalQuiz(quiz);
      setCanonicalQuiz(savedQuiz);
      setSaved(true);
    }
  }, [data]);

  const handleStartQuiz = () => {
    if (canonicalQuiz) {
      navigate(`/quiz?quizId=${canonicalQuiz.quizId}&mode=playing`);
    } else {
      setInlineMode('interactive');
    }
  };

  const handleViewInQuiz = () => {
    if (canonicalQuiz) {
      navigate(`/quiz?quizId=${canonicalQuiz.quizId}`);
    } else {
      navigate('/quiz');
    }
  };

  const handleRetryAdaptive = () => {
    if (canonicalQuiz) {
      navigate(`/quiz?quizId=${canonicalQuiz.quizId}&retry=adaptive`);
    } else {
      setInlineMode('interactive');
      setSelectedAnswers({});
    }
  };

  const handleSelect = (qIdx: number, optIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const totalQ = data.questions?.length || 0;
  const estimatedTime = data.estimatedMinutes || Math.max(2, Math.ceil(totalQ * 1.5));
  const objectives = data.learningObjectives || (canonicalQuiz?.learningObjectives) || [data.topic || "Core Subject Mastery"];
  const sourceLabel = data.sourceType ? data.sourceType.replace(/_/g, " ") : "AI GENERATED";

  return (
    <Card className="bg-card/95 backdrop-blur border-amber-500/30 shadow-xl rounded-2xl overflow-hidden my-3">
      {/* Header */}
      <CardHeader className="bg-amber-500/10 pb-3.5 border-b border-amber-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {sourceLabel}
              </span>
              {data.difficulty && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  {data.difficulty}
                </span>
              )}
            </div>
            <CardTitle className="text-base font-poppins font-bold flex items-center gap-2 text-foreground">
              <Award className="h-5 w-5 text-amber-400 shrink-0" />
              <span>{data.title || canonicalQuiz?.title || "Adaptive Mastery Quiz"}</span>
            </CardTitle>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-amber-400" /> {totalQ} Qs</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-amber-400" /> ~{estimatedTime}m</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 text-sm">
        {/* Learning Objectives & Origin Context */}
        {inlineMode === 'overview' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                <Target className="h-4 w-4" /> Learning Objectives
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {objectives.slice(0, 3).map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>

            {/* Actions Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                onClick={handleStartQuiz}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-all shadow-md"
              >
                <Play className="h-3.5 w-3.5 fill-black" /> Start Quiz
              </button>

              <button
                onClick={handleViewInQuiz}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-medium text-xs transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View in Quiz
              </button>

              <button
                onClick={handleRetryAdaptive}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border/60 font-medium text-xs transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5 text-amber-400" /> Retry Variant
              </button>

              <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium">
                <Bookmark className="h-3.5 w-3.5" /> {saved ? "Saved to Quiz" : "Saving..."}
              </div>
            </div>

            {/* Toggle Inline Quick Preview */}
            <button
              onClick={() => setInlineMode('interactive')}
              className="text-xs text-muted-foreground hover:text-amber-400 transition-colors w-full text-center underline pt-1"
            >
              Preview questions inline
            </button>
          </div>
        )}

        {/* Interactive Questions View */}
        {inlineMode === 'interactive' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-xs font-semibold text-amber-400">Inline Quick Practice</span>
              <button
                onClick={() => setInlineMode('overview')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Back to Overview
              </button>
            </div>

            {data.questions.map((q, qIdx) => {
              const userAns = selectedAnswers[qIdx];
              const isAnswered = userAns !== undefined;
              const correctIdx = typeof q.correctAnswer === 'number' ? q.correctAnswer : (typeof q.correct === 'number' ? q.correct : 0);
              const isCorrect = userAns === correctIdx;

              return (
                <div key={qIdx} className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-2.5">
                  <p className="font-medium text-foreground text-xs sm:text-sm">
                    {qIdx + 1}. {q.question}
                  </p>

                  <div className="space-y-1.5">
                    {q.options.map((opt, optIdx) => {
                      let btnStyle = "bg-background/80 hover:bg-muted border-border/60 text-foreground";
                      if (isAnswered) {
                        if (optIdx === correctIdx) {
                          btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold";
                        } else if (optIdx === userAns) {
                          btnStyle = "bg-red-500/20 border-red-500 text-red-200";
                        } else {
                          btnStyle = "opacity-50 border-border/30";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={isAnswered}
                          onClick={() => handleSelect(qIdx, optIdx)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && optIdx === correctIdx && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                          {isAnswered && optIdx === userAns && !isCorrect && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && q.explanation && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-border/50 text-xs text-muted-foreground animate-fade-in">
                      <p className="font-semibold text-amber-400 mb-0.5">Explanation:</p>
                      <p>{q.explanation}</p>
                    </div>
                  )}

                  {!isAnswered && q.hint && (
                    <div>
                      <button
                        onClick={() => setShowHints((prev) => ({ ...prev, [qIdx]: !prev[qIdx] }))}
                        className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <HelpCircle className="h-3 w-3" /> {showHints[qIdx] ? "Hide Hint" : "Need a Hint?"}
                      </button>
                      {showHints[qIdx] && (
                        <p className="text-xs text-amber-300/80 bg-amber-500/10 p-2 rounded-md mt-1 border border-amber-500/20">
                          💡 {q.hint}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={handleViewInQuiz}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs"
              >
                Open Full Quiz Mode <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizCard;

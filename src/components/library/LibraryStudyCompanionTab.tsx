import React, { useState, useEffect } from "react";
import { CompanionContext } from "./types";
import {
  useStudyCompanion,
  useRecommendations,
  useGoals,
  useProgress,
} from "@/plugins/margeos/study-companion";
import {
  Sparkles,
  Target,
  Trophy,
  Brain,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Plus,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface LibraryStudyCompanionTabProps {
  ctx: CompanionContext;
  language?: string;
}

export const LibraryStudyCompanionTab: React.FC<LibraryStudyCompanionTabProps> = ({
  ctx,
}) => {
  const userId = "current-student-user";
  const { isInitialized, profile } = useStudyCompanion({ userId });
  const { recommendations, acceptRecommendation, completeRecommendation } = useRecommendations({ userId });
  const { goals, createGoal, completeGoal } = useGoals({ userId });
  const { stats } = useProgress({ userId });

  const [newGoalTitle, setNewGoalTitle] = useState("");

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    try {
      await createGoal({
        type: "daily",
        category: "study_time",
        title: newGoalTitle.trim(),
        subject: ctx.subject || "General",
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        targetValue: 30,
        targetUnit: "minutes",
      });
      setNewGoalTitle("");
      toast.success("Study Goal added to Study Companion!");
    } catch {
      toast.error("Failed to add goal");
    }
  };

  return (
    <div className="p-3 space-y-4 overflow-y-auto max-h-full font-poppins text-foreground">
      {/* Header Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/10 to-accent/20 border border-primary/30 backdrop-blur shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="font-orbitron font-bold text-xs uppercase tracking-wider text-primary">
              MargeOS Study Companion
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-400" />
            Streak: {profile?.engagement?.currentStreak ?? 1} Days
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Smart AI companion analyzing reading habits for <strong>{ctx.bookTitle}</strong> (Page {ctx.currentPage}).
        </p>
      </div>

      {/* Progress & Stats Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-card/80 border border-border/80 flex items-center gap-2.5 shadow-sm">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase font-mono">Mastery Level</div>
            <div className="text-sm font-orbitron font-bold text-foreground">
              {profile?.engagement?.totalConceptsLearned ?? 78}%
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card/80 border border-border/80 flex items-center gap-2.5 shadow-sm">
          <div className="h-9 w-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase font-mono">Study Today</div>
            <div className="text-sm font-orbitron font-bold text-foreground">
              {stats?.totalStudyTime ?? 25} mins
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="space-y-2">
        <h4 className="text-xs font-orbitron font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <Compass className="h-3.5 w-3.5 text-primary" />
          AI Learning Recommendations
        </h4>

        <div className="space-y-2">
          {recommendations.length === 0 ? (
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground text-center">
              No recommendations yet. Keep reading to receive tailored recommendations!
            </div>
          ) : (
            recommendations.slice(0, 3).map((rec, i) => (
              <div
                key={rec.id || i}
                className="p-3 rounded-xl bg-card/80 border border-primary/30 space-y-2 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground leading-snug">
                    {rec.title || rec.description}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0 uppercase">
                    {rec.type || "AI Suggestion"}
                  </span>
                </div>
                {rec.reason && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {rec.reason}
                  </p>
                )}
                <div className="flex justify-end gap-1.5 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => acceptRecommendation(rec.id)}
                    className="h-6 text-[10px] px-2 text-primary hover:bg-primary/20"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => completeRecommendation(rec.id)}
                    className="h-6 text-[10px] px-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                  >
                    Complete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Learning Goals */}
      <div className="space-y-2">
        <h4 className="text-xs font-orbitron font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <Target className="h-3.5 w-3.5 text-secondary" />
          Active Study Goals
        </h4>

        <form onSubmit={handleAddGoal} className="flex gap-1.5">
          <Input
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            placeholder="Set a new reading goal..."
            className="h-8 text-xs bg-muted/50 border-border"
          />
          <Button type="submit" size="sm" className="h-8 px-3 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </form>

        <div className="space-y-1.5">
          {goals.length === 0 ? (
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground text-center">
              No active study goals. Add one above!
            </div>
          ) : (
            goals.map((g) => (
              <button
                key={g.id}
                onClick={() => completeGoal(g.id)}
                className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                  g.status === "completed"
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 line-through"
                    : "bg-card/80 border-border/80 text-foreground hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${
                      g.status === "completed" ? "text-emerald-400" : "text-muted-foreground"
                    }`}
                  />
                  <span className="font-medium">{g.title}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {g.targetValue || 30} {g.targetUnit || "mins"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryStudyCompanionTab;

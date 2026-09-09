import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Trophy } from "lucide-react";
import type { ProgressCardData } from "../types/Lesson";

export interface ProgressCardProps {
  c: ProgressCardData;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ c }) => {
  const percent = Math.max(0, Math.min(100, c.percent));

  return (
    <Card className="bg-emerald-950/20 border-emerald-500/30 backdrop-blur shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-poppins flex items-center justify-between text-emerald-400">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>{c.title || "Lesson Mastery Progress"}</span>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-300">{percent}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-2">
        <div className="h-2.5 bg-muted rounded-full overflow-hidden p-0.5 border border-emerald-500/20">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${percent}%` }}
          />
        </div>
        {c.note && (
          <p className="text-xs text-muted-foreground font-poppins flex items-center gap-1.5 pt-1">
            <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>{c.note}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressCard;

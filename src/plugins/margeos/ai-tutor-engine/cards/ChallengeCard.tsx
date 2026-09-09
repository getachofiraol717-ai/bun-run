import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Zap } from "lucide-react";
import type { ChallengeCardData } from "../types/Lesson";

export interface ChallengeCardProps {
  c: ChallengeCardData;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ c }) => {
  return (
    <Card className="bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-background border-indigo-500/30 backdrop-blur shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-orbitron font-bold flex items-center gap-2 text-indigo-300">
          <Target className="h-4 w-4 text-neon-cyan animate-pulse" />
          <span>{c.title || "Brain Challenge"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 text-sm text-foreground space-y-3 font-poppins">
        <p className="leading-relaxed">{c.prompt}</p>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg w-fit border border-indigo-500/20">
          <Zap className="h-3 w-3 text-amber-400" />
          <span>Bonus XP Challenge</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChallengeCard;

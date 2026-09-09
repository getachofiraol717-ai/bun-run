import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Lightbulb, Eye, EyeOff } from "lucide-react";
import type { PracticeCardData } from "../types/Lesson";

export interface PracticeCardProps {
  c: PracticeCardData;
}

export const PracticeCard: React.FC<PracticeCardProps> = ({ c }) => {
  const [reveal, setReveal] = useState(false);

  return (
    <Card className="bg-card/80 backdrop-blur border-secondary/50 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-poppins flex items-center gap-2 text-foreground">
          <Target className="h-4 w-4 text-secondary" />
          <span>{c.title || "Practice Problem"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 text-sm text-foreground/90 space-y-3 font-poppins">
        <p className="leading-relaxed font-medium">{c.prompt}</p>

        {c.hint && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground italic bg-muted/40 p-2.5 rounded-xl border border-border/50">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>Hint: {c.hint}</span>
          </div>
        )}

        {c.answer && (
          <div className="space-y-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReveal((r) => !r)}
              className="text-xs font-poppins gap-1.5 rounded-xl border-border/80"
            >
              {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{reveal ? "Hide Solution" : "Reveal Solution"}</span>
            </Button>

            {reveal && (
              <div className="p-3 rounded-xl bg-muted/60 text-xs sm:text-sm border border-border/70 leading-relaxed animate-fade-in">
                <strong className="text-primary block mb-1">Answer & Explanation:</strong>
                {c.answer}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PracticeCard;

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Sparkles, Brain } from "lucide-react";

export interface FlashcardCardData {
  question: string;
  answer: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  memoryHint?: string;
  subject?: string;
}

export const FlashcardCard: React.FC<{ data: FlashcardCardData }> = ({ data }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <Card className="bg-card/90 backdrop-blur border-cyan-500/30 shadow-lg rounded-2xl overflow-hidden my-2">
      <CardHeader className="bg-cyan-500/10 pb-3 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-poppins font-bold flex items-center gap-2 text-foreground">
            <Brain className="h-5 w-5 text-cyan-400" />
            <span>Interactive Flashcard</span>
          </CardTitle>
          {data.difficulty && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300">
              {data.difficulty}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-sm">
        <div
          onClick={() => setFlipped(!flipped)}
          className="cursor-pointer min-h-[120px] p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 flex flex-col justify-center items-center text-center transition-all hover:border-cyan-400 hover:shadow-cyan-500/10 shadow-lg"
        >
          {!flipped ? (
            <div className="space-y-2">
              <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">Question</p>
              <p className="text-sm sm:text-base font-medium text-foreground">{data.question}</p>
              <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-2">
                <RefreshCw className="h-3 w-3" /> Click to reveal answer
              </p>
            </div>
          ) : (
            <div className="space-y-2 animate-fade-in">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Answer</p>
              <p className="text-sm sm:text-base font-medium text-emerald-200">{data.answer}</p>
              {data.memoryHint && (
                <p className="text-xs text-amber-300/90 italic flex items-center justify-center gap-1 mt-2 bg-amber-500/10 p-2 rounded-lg">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" /> Hint: {data.memoryHint}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FlashcardCard;

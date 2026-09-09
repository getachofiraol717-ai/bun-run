import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Lightbulb, Target, Sparkles } from "lucide-react";

export interface ConceptCardData {
  title: string;
  definition: string;
  importance?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  realWorldExamples?: string[];
  prerequisites?: string[];
  relatedConcepts?: string[];
  learningTips?: string[];
}

export const ConceptCard: React.FC<{ data: ConceptCardData }> = ({ data }) => {
  return (
    <Card className="bg-card/90 backdrop-blur border-primary/20 shadow-lg rounded-2xl overflow-hidden my-2">
      <CardHeader className="bg-primary/5 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-poppins font-bold flex items-center gap-2 text-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>{data.title}</span>
          </CardTitle>
          {data.difficulty && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-primary/10 text-primary border border-primary/20">
              {data.difficulty}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-sm">
        <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
          <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">Definition</p>
          <p className="text-foreground/90 leading-relaxed text-xs sm:text-sm">{data.definition}</p>
        </div>

        {data.importance && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Target className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Why it matters: </span>
              {data.importance}
            </div>
          </div>
        )}

        {data.realWorldExamples && data.realWorldExamples.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5 text-yellow-400" /> Real-World Examples
            </p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 pl-1">
              {data.realWorldExamples.map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          </div>
        )}

        {data.learningTips && data.learningTips.length > 0 && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <p className="font-semibold text-amber-400 flex items-center gap-1 mb-1">
              <Sparkles className="h-3.5 w-3.5" /> Learning Tips
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {data.learningTips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConceptCard;

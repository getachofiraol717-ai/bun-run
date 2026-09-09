import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Check, Bookmark, Key } from "lucide-react";

export interface SummaryCardData {
  title: string;
  keyIdeas: string[];
  importantFacts?: string[];
  revisionNotes?: string[];
  takeaways?: string[];
}

export const SummaryCard: React.FC<{ data: SummaryCardData }> = ({ data }) => {
  return (
    <Card className="bg-card/90 backdrop-blur border-purple-500/30 shadow-lg rounded-2xl overflow-hidden my-2">
      <CardHeader className="bg-purple-500/10 pb-3 border-b border-purple-500/20">
        <CardTitle className="text-base font-poppins font-bold flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-purple-400" />
          <span>{data.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-sm">
        {data.keyIdeas && data.keyIdeas.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Key className="h-3.5 w-3.5 text-purple-400" /> Key Ideas
            </p>
            <ul className="space-y-1">
              {data.keyIdeas.map((idea, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/90 p-2 rounded-lg bg-muted/30">
                  <Check className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.importantFacts && data.importantFacts.length > 0 && (
          <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/20 text-xs space-y-1">
            <p className="font-semibold text-purple-300">Important Facts for Exams:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {data.importantFacts.map((fact, idx) => (
                <li key={idx}>{fact}</li>
              ))}
            </ul>
          </div>
        )}

        {data.takeaways && data.takeaways.length > 0 && (
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
            <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
              <Bookmark className="h-3.5 w-3.5 text-purple-400" /> Core Takeaways
            </p>
            <p className="text-muted-foreground">{data.takeaways.join(" • ")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;

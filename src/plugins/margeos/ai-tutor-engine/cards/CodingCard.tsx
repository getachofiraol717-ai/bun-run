import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Copy, Check, Terminal, Zap } from "lucide-react";

export interface CodingCardData {
  language: string;
  code: string;
  title?: string;
  explanation: string;
  lineByLine?: { line: number; description: string }[];
  executionFlow?: string;
  bestPractices?: string[];
  commonMistakes?: string[];
  optimizationIdeas?: string[];
  securityTips?: string[];
}

export const CodingCard: React.FC<{ data: CodingCardData }> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-card/90 backdrop-blur border-teal-500/30 shadow-lg rounded-2xl overflow-hidden my-2">
      <CardHeader className="bg-teal-500/10 pb-3 border-b border-teal-500/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-poppins font-bold flex items-center gap-2 text-foreground">
            <Code className="h-5 w-5 text-teal-400" />
            <span>{data.title || `${data.language.toUpperCase()} Coding Mentor`}</span>
          </CardTitle>
          <button
            onClick={handleCopy}
            className="text-xs px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-sm">
        <div className="bg-slate-950 rounded-xl p-3 border border-teal-500/30 font-mono text-xs overflow-x-auto text-teal-200">
          <pre>{data.code}</pre>
        </div>

        <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
          <p className="font-semibold text-primary mb-1">Code Concept & Architecture:</p>
          <p className="text-foreground/90 leading-relaxed">{data.explanation}</p>
        </div>

        {data.executionFlow && (
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs">
            <p className="font-semibold text-teal-300 flex items-center gap-1 mb-1">
              <Terminal className="h-3.5 w-3.5" /> Execution Flow
            </p>
            <p className="text-muted-foreground">{data.executionFlow}</p>
          </div>
        )}

        {data.bestPractices && data.bestPractices.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-yellow-400" /> Best Practices & Security
            </p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
              {data.bestPractices.map((bp, i) => (
                <li key={i}>{bp}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CodingCard;

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { CodeCardData } from "../types/Lesson";

export interface CodeCardProps {
  c: CodeCardData;
}

export const CodeCard: React.FC<CodeCardProps> = ({ c }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(c.code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border/80 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-poppins flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-cyan-400" />
            <span className="font-semibold">{c.title || `Code snippet (${c.language})`}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
            {c.language}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 text-sm text-foreground/90 space-y-2">
        <div className="relative group">
          <pre className="bg-slate-950 text-slate-100 rounded-xl p-3.5 overflow-x-auto text-xs font-mono border border-slate-800 leading-relaxed">
            <code>{c.code}</code>
          </pre>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 h-7 w-7 p-0 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-lg"
            aria-label="Copy code"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
        {c.explanation && (
          <p className="text-xs text-muted-foreground font-poppins leading-relaxed mt-2 pt-1 border-t border-border/40">
            {c.explanation}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CodeCard;

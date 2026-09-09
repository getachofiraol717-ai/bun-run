import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sigma, AlertTriangle, CheckCircle } from "lucide-react";

export interface FormulaCardData {
  title: string;
  formula: string;
  variables?: { name: string; symbol: string; unit?: string; description?: string }[];
  explanation?: string;
  workedExample?: { problem: string; solutionSteps: string[]; result: string };
  commonMistakes?: string[];
  practiceExercises?: string[];
}

export const FormulaCard: React.FC<{ data: FormulaCardData }> = ({ data }) => {
  return (
    <Card className="bg-card/90 backdrop-blur border-emerald-500/30 shadow-lg rounded-2xl overflow-hidden my-2">
      <CardHeader className="bg-emerald-500/10 pb-3 border-b border-emerald-500/20">
        <CardTitle className="text-base font-poppins font-bold flex items-center gap-2 text-foreground">
          <Sigma className="h-5 w-5 text-emerald-400" />
          <span>{data.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-sm">
        <div className="bg-slate-950 text-emerald-300 rounded-xl p-4 font-mono text-center text-base sm:text-xl border border-emerald-500/30 shadow-inner">
          {data.formula}
        </div>

        {data.explanation && (
          <p className="text-xs text-muted-foreground leading-relaxed">{data.explanation}</p>
        )}

        {data.variables && data.variables.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">Variables & Units:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {data.variables.map((v, i) => (
                <div key={i} className="p-2 rounded-lg bg-muted/30 border border-border/40 text-xs flex items-center justify-between">
                  <span className="font-mono text-emerald-400 font-bold">{v.symbol}</span>
                  <span className="text-muted-foreground truncate px-1">{v.name}</span>
                  {v.unit && <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 rounded">[{v.unit}]</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.workedExample && (
          <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-xs space-y-2">
            <p className="font-semibold text-foreground flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Worked Example
            </p>
            <p className="italic text-muted-foreground">{data.workedExample.problem}</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-1">
              {data.workedExample.solutionSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
            <div className="pt-1 text-emerald-400 font-semibold font-mono">
              Final Result: {data.workedExample.result}
            </div>
          </div>
        )}

        {data.commonMistakes && data.commonMistakes.length > 0 && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
            <p className="font-semibold text-red-400 flex items-center gap-1 mb-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Common Mistakes to Avoid
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {data.commonMistakes.map((mistake, i) => (
                <li key={i}>{mistake}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FormulaCard;

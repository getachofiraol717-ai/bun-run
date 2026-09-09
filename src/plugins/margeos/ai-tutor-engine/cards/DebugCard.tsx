import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, CheckCircle, AlertOctagon, Wrench } from "lucide-react";

export interface DebugCardData {
  errorMessage: string;
  rootCause: string;
  fixExplanation: string;
  correctedCode: string;
  preventionTips?: string[];
}

export const DebugCard: React.FC<{ data: DebugCardData }> = ({ data }) => {
  return (
    <Card className="bg-card/90 backdrop-blur border-rose-500/30 shadow-lg rounded-2xl overflow-hidden my-2">
      <CardHeader className="bg-rose-500/10 pb-3 border-b border-rose-500/20">
        <CardTitle className="text-base font-poppins font-bold flex items-center gap-2 text-foreground">
          <Bug className="h-5 w-5 text-rose-400" />
          <span>AI Code Debugger & Fix</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-sm">
        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/30 text-xs">
          <p className="font-semibold text-red-400 flex items-center gap-1 mb-1">
            <AlertOctagon className="h-3.5 w-3.5" /> Detected Error / Exception
          </p>
          <p className="font-mono text-red-200">{data.errorMessage}</p>
        </div>

        <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-xs space-y-1">
          <p className="font-semibold text-primary flex items-center gap-1">
            <Wrench className="h-3.5 w-3.5 text-rose-400" /> Root Cause Analysis
          </p>
          <p className="text-foreground/90">{data.rootCause}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> Corrected Implementation
          </p>
          <div className="bg-slate-950 rounded-xl p-3 border border-emerald-500/30 font-mono text-xs text-emerald-300 overflow-x-auto">
            <pre>{data.correctedCode}</pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugCard;

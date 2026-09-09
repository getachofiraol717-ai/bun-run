import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, Eye, Mic, Captions } from "lucide-react";

export interface AccessibilityCardData {
  audioModeAvailable?: boolean;
  liveCaptions?: boolean;
  voiceCommandsSupported?: boolean;
  brailleReadyText?: string;
  signLanguageCompatibilityNote?: string;
}

export const AccessibilityCard: React.FC<{ data: AccessibilityCardData }> = ({ data }) => {
  return (
    <Card className="bg-card/90 backdrop-blur border-emerald-500/30 shadow-lg rounded-2xl overflow-hidden my-2">
      <CardHeader className="bg-emerald-500/10 pb-3 border-b border-emerald-500/20">
        <CardTitle className="text-base font-poppins font-bold flex items-center gap-2 text-foreground">
          <Eye className="h-5 w-5 text-emerald-400" />
          <span>Inclusive Learning & Accessibility Support</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Audio Mode Active</span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs flex items-center gap-2">
            <Captions className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Live Captions</span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs flex items-center gap-2">
            <Mic className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Voice Commands</span>
          </div>
        </div>

        {data.brailleReadyText && (
          <div className="p-3 bg-slate-950 rounded-xl border border-border/50 text-xs font-mono text-emerald-300">
            <p className="font-sans text-[10px] text-muted-foreground uppercase mb-1">Braille-Formatted Output:</p>
            <p>{data.brailleReadyText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessibilityCard;

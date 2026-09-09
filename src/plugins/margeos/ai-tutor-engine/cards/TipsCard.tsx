import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Check } from "lucide-react";
import type { TipsCardData } from "../types/Lesson";

export interface TipsCardProps {
  c: TipsCardData;
}

export const TipsCard: React.FC<TipsCardProps> = ({ c }) => {
  return (
    <Card className="bg-emerald-950/20 border-emerald-500/30 backdrop-blur shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-poppins font-bold flex items-center gap-2 text-emerald-400">
          <Lightbulb className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>{c.title || "Pro Learning Tips & Hacks"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 text-sm text-foreground/90 font-poppins">
        <ul className="space-y-2">
          {c.items.map((x, i) => (
            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
              <span className="h-4 w-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                <Check className="h-3 w-3" />
              </span>
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default TipsCard;

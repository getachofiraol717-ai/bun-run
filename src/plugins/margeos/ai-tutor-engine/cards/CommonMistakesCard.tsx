import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, AlertCircle } from "lucide-react";
import type { MistakesCardData } from "../types/Lesson";

export interface CommonMistakesCardProps {
  c: MistakesCardData;
}

export const CommonMistakesCard: React.FC<CommonMistakesCardProps> = ({ c }) => {
  return (
    <Card className="bg-amber-950/20 border-amber-500/40 backdrop-blur shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-poppins font-bold flex items-center gap-2 text-amber-400">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span>{c.title || "Common Pitfalls & Mistakes"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 text-sm text-foreground/90">
        <ul className="space-y-2">
          {c.items.map((x, i) => (
            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm font-poppins">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default CommonMistakesCard;

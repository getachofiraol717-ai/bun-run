import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, Clock } from "lucide-react";
import type { TimelineCardData } from "../types/Lesson";

export interface TimelineCardProps {
  c: TimelineCardData;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({ c }) => {
  return (
    <Card className="bg-card/80 backdrop-blur border-border/80 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-poppins flex items-center gap-2 text-foreground">
          <Timer className="h-4 w-4 text-amber-400" />
          <span>{c.title || "Chronological Timeline"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 text-sm text-foreground/90 font-poppins">
        <ol className="relative border-l border-border/80 ml-2 pl-4 space-y-3">
          {c.events.map((e, i) => (
            <li key={i} className="relative group">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
              <div className="text-xs font-mono font-bold text-primary mb-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3 inline text-amber-400" />
                <span>{e.when}</span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-normal">{e.what}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
};

export default TimelineCard;

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { NextCardData } from "../types/Lesson";

export interface NextLessonCardProps {
  c: NextCardData;
}

export const NextLessonCard: React.FC<NextLessonCardProps> = ({ c }) => {
  return (
    <Card className="bg-card/80 backdrop-blur border-border/80 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-poppins flex items-center gap-2 text-foreground">
          <ArrowRight className="h-4 w-4 text-primary" />
          <span>{c.title || "Recommended Next Topics"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-wrap gap-2">
          {c.topics.map((t, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="cursor-pointer text-xs font-poppins px-3 py-1.5 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-1 shadow-sm"
            >
              <ChevronRight className="h-3 w-3 text-primary group-hover:text-primary-foreground" />
              <span>{t}</span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NextLessonCard;

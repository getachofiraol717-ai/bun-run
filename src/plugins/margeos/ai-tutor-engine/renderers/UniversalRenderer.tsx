import React from "react";
import { Badge } from "@/components/ui/badge";
import { CardRenderer } from "../cards/CardRenderer";
import { SUBJECT_LABELS } from "../types/SubjectType";
import type { Lesson } from "../types/Lesson";

export const UniversalRenderer: React.FC<{ lesson: Lesson }> = ({ lesson }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-base font-semibold text-foreground font-poppins">{lesson.title}</h3>
        <Badge variant="secondary">{SUBJECT_LABELS[lesson.subject]}</Badge>
        <Badge variant="outline">{lesson.difficulty}</Badge>
      </div>
      <div className="grid gap-3">
        {lesson.cards.map((c) => <CardRenderer key={c.id} card={c} />)}
      </div>
    </div>
  );
};

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ExplanationCardData } from "../types/Lesson";

export interface ExplanationCardProps {
  c: ExplanationCardData;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({ c }) => {
  return (
    <Card className="bg-card/80 backdrop-blur border-border/80 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-poppins flex items-center gap-2 text-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          <span>{c.title || "Core Explanation"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 text-sm text-foreground/90">
        <div className="prose prose-sm dark:prose-invert max-w-none font-poppins leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.body}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExplanationCard;

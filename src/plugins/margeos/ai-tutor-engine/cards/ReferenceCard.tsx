import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookMarked, ExternalLink, Bookmark } from "lucide-react";

export interface ReferenceBook {
  title: string;
  author: string;
  chapter?: string;
  summary?: string;
}

export interface ReferenceCardData {
  title?: string;
  referenceBooks: ReferenceBook[];
  teacherNotes?: string[];
  researchSources?: string[];
}

export const ReferenceCard: React.FC<{ data?: ReferenceCardData; c?: any }> = ({ data, c }) => {
  const books = data?.referenceBooks || c?.items || [];
  const title = data?.title || c?.title || "Recommended Reference Books";

  return (
    <Card className="bg-card/90 backdrop-blur border-indigo-500/30 shadow-lg rounded-2xl overflow-hidden my-2">
      <CardHeader className="bg-indigo-500/10 pb-3 border-b border-indigo-500/20">
        <CardTitle className="text-base font-poppins font-bold flex items-center gap-2 text-foreground">
          <BookMarked className="h-5 w-5 text-indigo-400" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-sm">
        <div className="space-y-2">
          {books.map((b: any, idx: number) => (
            <div key={idx} className="p-3 bg-muted/30 rounded-xl border border-border/50 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-indigo-300 text-sm">{b.title}</p>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Author: {b.author || b.source}</p>
              {b.chapter && <p className="text-indigo-400 font-mono text-[11px]">{b.chapter}</p>}
              {b.summary && <p className="text-foreground/80 pt-1 leading-relaxed">{b.summary}</p>}
            </div>
          ))}
        </div>

        {data?.teacherNotes && data.teacherNotes.length > 0 && (
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
            <p className="font-semibold text-indigo-300 flex items-center gap-1 mb-1">
              <Bookmark className="h-3.5 w-3.5" /> Teacher's Reading Guidance
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {data.teacherNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferenceCard;

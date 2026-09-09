import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, Layers } from "lucide-react";

export interface DiagramCardData {
  title: string;
  explanation: string;
  labels?: { key: string; description: string }[];
  relationships?: string[];
  purpose?: string;
  svgContent?: string;
  imageUrl?: string;
}

export const DiagramCard: React.FC<{ data: DiagramCardData }> = ({ data }) => {
  return (
    <Card className="bg-card/90 backdrop-blur border-blue-500/30 shadow-lg rounded-2xl overflow-hidden my-2">
      <CardHeader className="bg-blue-500/10 pb-3 border-b border-blue-500/20">
        <CardTitle className="text-base font-poppins font-bold flex items-center gap-2 text-foreground">
          <Image className="h-5 w-5 text-blue-400" />
          <span>{data.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-sm">
        {data.svgContent ? (
          <div className="p-4 bg-slate-950 rounded-xl overflow-x-auto flex justify-center border border-blue-500/20" dangerouslySetInnerHTML={{ __html: data.svgContent }} />
        ) : data.imageUrl ? (
          <div className="rounded-xl overflow-hidden border border-border/50">
            <img src={data.imageUrl} alt={data.title} className="w-full h-auto object-cover" />
          </div>
        ) : null}

        <p className="text-xs text-foreground/90 leading-relaxed">{data.explanation}</p>

        {data.purpose && (
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-xs text-blue-300 border border-blue-500/20">
            <span className="font-semibold text-blue-400">Purpose: </span>
            {data.purpose}
          </div>
        )}

        {data.labels && data.labels.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-blue-400" /> Key Labels & Components
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {data.labels.map((lbl, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-muted/40 border border-border/40 text-xs">
                  <span className="font-semibold text-primary">{lbl.key}: </span>
                  <span className="text-muted-foreground">{lbl.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiagramCard;

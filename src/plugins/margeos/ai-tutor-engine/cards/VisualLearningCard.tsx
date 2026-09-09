import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, GitBranch } from "lucide-react";

export interface VisualNode {
  id: string;
  label: string;
  category?: string;
  children?: string[];
}

export interface VisualLearningCardData {
  title: string;
  type: "mindmap" | "flowchart" | "conceptmap" | "learningtree" | "architecture";
  nodes: VisualNode[];
  summary?: string;
}

export const VisualLearningCard: React.FC<{ data: VisualLearningCardData }> = ({ data }) => {
  return (
    <Card className="bg-card/90 backdrop-blur border-pink-500/30 shadow-lg rounded-2xl overflow-hidden my-2">
      <CardHeader className="bg-pink-500/10 pb-3 border-b border-pink-500/20">
        <CardTitle className="text-base font-poppins font-bold flex items-center gap-2 text-foreground">
          <Network className="h-5 w-5 text-pink-400" />
          <span>{data.title}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-pink-500/20 text-pink-300 ml-auto uppercase">
            {data.type}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-sm">
        {data.summary && <p className="text-xs text-muted-foreground">{data.summary}</p>}

        <div className="p-4 bg-slate-950 rounded-2xl border border-pink-500/20 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {data.nodes.map((node) => (
              <div key={node.id} className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-xs text-foreground">
                <div className="font-semibold text-pink-300 flex items-center gap-1.5 mb-1">
                  <GitBranch className="h-3.5 w-3.5 shrink-0" />
                  <span>{node.label}</span>
                </div>
                {node.children && node.children.length > 0 && (
                  <div className="text-[10px] text-muted-foreground pt-1 border-t border-pink-500/20 mt-1">
                    Connects to: {node.children.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualLearningCard;

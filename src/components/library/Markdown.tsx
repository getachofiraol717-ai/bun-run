import React from 'react';

/** Inline bold + code renderer */
function Inline({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let rest = text, k = 0;
  while (rest.length > 0) {
    const bold = rest.match(/\*\*(.+?)\*\*/);
    const code = rest.match(/`(.+?)`/);
    const candidates = [bold, code].filter(Boolean) as RegExpMatchArray[];
    if (!candidates.length) { parts.push(<span key={k++}>{rest}</span>); break; }
    const first = candidates.reduce((a, b) => (a.index! < b.index! ? a : b));
    if (first.index! > 0) parts.push(<span key={k++}>{rest.slice(0, first.index!)}</span>);
    if (first === bold) parts.push(<strong key={k++} className="text-foreground font-semibold">{bold![1]}</strong>);
    else parts.push(<code key={k++} className="bg-primary/15 text-primary px-1 py-0.5 rounded text-[11px] font-mono">{code![1]}</code>);
    rest = rest.slice(first.index! + first[0].length);
  }
  return <>{parts}</>;
}

/** Compact markdown renderer: headings, bullets, numbered lists, code fences, inline bold/code. */
export function Markdown({ text }: { text: string }) {
  if (!text) return null;
  const segments: { type: 'text' | 'code'; content: string }[] = [];
  const codeRe = /```[\w-]*\n?([\s\S]*?)```/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = codeRe.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: 'text', content: text.slice(last, m.index) });
    segments.push({ type: 'code', content: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ type: 'text', content: text.slice(last) });

  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {segments.map((seg, si) => {
        if (seg.type === 'code') {
          return <pre key={si} className="bg-background/60 border border-border/50 rounded-lg p-2 text-[11px] font-mono overflow-x-auto whitespace-pre">{seg.content}</pre>;
        }
        return seg.content.split('\n').map((line, li) => {
          const key = `${si}-${li}`;
          if (/^### /.test(line)) return <h4 key={key} className="text-primary font-semibold mt-2">{line.slice(4)}</h4>;
          if (/^## /.test(line)) return <h3 key={key} className="text-primary font-bold mt-2">{line.slice(3)}</h3>;
          if (/^# /.test(line)) return <h2 key={key} className="text-primary font-bold mt-2 text-base">{line.slice(2)}</h2>;
          if (/^[-*] /.test(line)) return <div key={key} className="pl-4 relative"><span className="absolute left-0 text-primary">•</span><Inline text={line.slice(2)} /></div>;
          if (/^\d+\. /.test(line)) {
            const num = line.match(/^(\d+)\./)?.[1];
            return <div key={key} className="pl-5 relative"><span className="absolute left-0 text-primary font-bold">{num}.</span><Inline text={line.replace(/^\d+\. /, '')} /></div>;
          }
          if (!line.trim()) return <div key={key} className="h-1.5" />;
          return <div key={key}><Inline text={line} /></div>;
        });
      })}
    </div>
  );
}

export function getCardThemeColor(cardType: string): string {
  switch (cardType) {
    case "concept": return "text-primary border-primary/30";
    case "formula": return "text-emerald-400 border-emerald-500/30";
    case "diagram": return "text-blue-400 border-blue-500/30";
    case "summary": return "text-purple-400 border-purple-500/30";
    case "flashcard": return "text-cyan-400 border-cyan-500/30";
    case "quiz": return "text-amber-400 border-amber-500/30";
    case "coding": return "text-teal-400 border-teal-500/30";
    case "debug": return "text-rose-400 border-rose-500/30";
    case "reference": return "text-indigo-400 border-indigo-500/30";
    case "visual": return "text-pink-400 border-pink-500/30";
    default: return "text-foreground border-border";
  }
}

// AI Tutor Engine — analogyUtils (Feature 8 — Analogy Mode)

/** A tiny built-in seed bank for a few extremely common concepts — used only
 * as an instant opener line while the real AI-generated analogy streams in,
 * never as a replacement for it. */
const SEED_ANALOGIES: Record<string, string> = {
  "f = ma": "Think of pushing a shopping cart: an empty cart (small mass) speeds up easily with a light push, but a cart full of groceries (large mass) needs a much harder push for the same speedup.",
  "newton's second law": "Think of pushing a shopping cart: an empty cart speeds up easily with a light push, but a full cart needs a much harder push for the same speedup.",
  "photosynthesis": "Think of a plant as a tiny solar-powered kitchen: sunlight is the electricity, water and carbon dioxide are the raw ingredients, and glucose is the meal it cooks for itself.",
  "gravity": "Think of space-time as a stretched trampoline: a heavy ball (a planet) creates a dip, and anything nearby rolls toward it — that rolling is what we feel as gravity.",
};

export function seedAnalogyFor(conceptLabel: string): string | null {
  return SEED_ANALOGIES[conceptLabel.trim().toLowerCase()] ?? null;
}

export function analogyPromptHint(usedAnalogyHints: string[] = []): string {
  const avoid = usedAnalogyHints.length ? ` Do not reuse these analogies already given: ${usedAnalogyHints.join("; ")}.` : "";
  return `Explain this primarily through ONE clear analogy to something from everyday life, then briefly connect the analogy back to the real concept.${avoid}`;
}

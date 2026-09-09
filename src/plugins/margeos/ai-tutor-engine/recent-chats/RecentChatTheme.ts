/**
 * Knowledge Universe — 7-Color RGB System for Recent Chats
 * Canonical definition of the Knowledge22vv 7-color palette and theme utilities.
 */

export interface KUColorSpec {
  id: string;
  name: string;
  hex: string;
  hsl: string; // e.g., "199 100% 50%"
  rgb: string; // e.g., "0, 242, 254"
  borderGlow: string;
  textGlow: string;
}

export const KU_SEVEN_COLORS: KUColorSpec[] = [
  {
    id: 'cyan',
    name: 'Oracle Cyan',
    hex: '#00f2fe',
    hsl: '199 100% 50%',
    rgb: '0, 242, 254',
    borderGlow: 'rgba(0, 242, 254, 0.4)',
    textGlow: 'rgba(0, 242, 254, 0.8)',
  },
  {
    id: 'purple',
    name: 'Galactic Violet',
    hex: '#a855f7',
    hsl: '270 80% 60%',
    rgb: '168, 85, 247',
    borderGlow: 'rgba(168, 85, 247, 0.4)',
    textGlow: 'rgba(168, 85, 247, 0.8)',
  },
  {
    id: 'emerald',
    name: 'Quantum Emerald',
    hex: '#10b981',
    hsl: '160 80% 45%',
    rgb: '16, 185, 129',
    borderGlow: 'rgba(16, 185, 129, 0.4)',
    textGlow: 'rgba(16, 185, 129, 0.8)',
  },
  {
    id: 'rose',
    name: 'Supernova Rose',
    hex: '#f43f5e',
    hsl: '340 85% 58%',
    rgb: '244, 63, 94',
    borderGlow: 'rgba(244, 63, 94, 0.4)',
    textGlow: 'rgba(244, 63, 94, 0.8)',
  },
  {
    id: 'amber',
    name: 'Cosmic Amber',
    hex: '#f59e0b',
    hsl: '38 95% 55%',
    rgb: '245, 158, 11',
    borderGlow: 'rgba(245, 158, 11, 0.4)',
    textGlow: 'rgba(245, 158, 11, 0.8)',
  },
  {
    id: 'indigo',
    name: 'Nebula Indigo',
    hex: '#6366f1',
    hsl: '230 85% 62%',
    rgb: '99, 102, 241',
    borderGlow: 'rgba(99, 102, 241, 0.4)',
    textGlow: 'rgba(99, 102, 241, 0.8)',
  },
  {
    id: 'coral',
    name: 'Stellar Coral',
    hex: '#f97316',
    hsl: '20 90% 55%',
    rgb: '249, 115, 22',
    borderGlow: 'rgba(249, 115, 22, 0.4)',
    textGlow: 'rgba(249, 115, 22, 0.8)',
  },
];

/**
 * Gets a color sequence starting at a deterministic base index.
 */
export function getSevenColorSequence(baseIndex: number): KUColorSpec[] {
  const normalizedIndex = Math.abs(baseIndex) % KU_SEVEN_COLORS.length;
  return [
    ...KU_SEVEN_COLORS.slice(normalizedIndex),
    ...KU_SEVEN_COLORS.slice(0, normalizedIndex),
  ];
}

/**
 * Generates CSS linear-gradient string moving LEFT -> RIGHT
 */
export function createLeftToRightGradient(colors: KUColorSpec[], opacity = 0.85): string {
  const colorStops = colors.map((c, idx) => {
    const pct = Math.round((idx / (colors.length - 1)) * 100);
    return `rgba(${c.rgb}, ${opacity}) ${pct}%`;
  });
  return `linear-gradient(90deg, ${colorStops.join(', ')})`;
}

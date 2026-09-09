import { Civilization } from '../models/Civilization';

export const EPOCHS: Civilization['epoch'][] = [
  'Stone Age',
  'Classical Era',
  'Scientific Revolution',
  'Industrial Age',
  'Atomic Age',
  'Information Age',
  'Space Age',
  'Galactic Civilization'
];

export function calculateRequiredXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function determineEpoch(level: number): Civilization['epoch'] {
  if (level >= 50) return 'Galactic Civilization';
  if (level >= 40) return 'Space Age';
  if (level >= 30) return 'Information Age';
  if (level >= 22) return 'Atomic Age';
  if (level >= 15) return 'Industrial Age';
  if (level >= 9) return 'Scientific Revolution';
  if (level >= 4) return 'Classical Era';
  return 'Stone Age';
}

export function calculateKnowledgeIndex(unlockedPlanets: number, questsCompleted: number, masteryAvg: number): number {
  const score = (unlockedPlanets * 25) + (questsCompleted * 10) + (masteryAvg * 0.5);
  return Math.min(100, Math.round(score));
}

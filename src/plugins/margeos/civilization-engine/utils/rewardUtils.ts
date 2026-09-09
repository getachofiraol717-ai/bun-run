import { Reward, QuestDifficulty } from '../models/Civilization';

export function calculateQuestXpReward(difficulty: QuestDifficulty): number {
  switch (difficulty) {
    case 'easy': return 50;
    case 'medium': return 120;
    case 'hard': return 250;
    case 'legendary': return 600;
    default: return 50;
  }
}

export function generateRewardId(): string {
  return `reward_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function createXpReward(amount: number, reason: string): Reward {
  return {
    id: generateRewardId(),
    type: 'xp',
    name: `${amount} Knowledge XP`,
    description: reason,
    value: amount,
    claimed: false
  };
}

import { Quest, QuestType, QuestDifficulty } from '../models/Civilization';
import { calculateQuestXpReward } from './rewardUtils';

export function createQuest(
  title: string,
  description: string,
  type: QuestType,
  difficulty: QuestDifficulty,
  targetCount: number = 1,
  subject?: string
): Quest {
  const xpReward = calculateQuestXpReward(difficulty);
  const reputationReward = Math.round(xpReward * 0.2);

  return {
    id: `quest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    description,
    type,
    difficulty,
    subject,
    targetCount,
    currentCount: 0,
    completed: false,
    xpReward,
    reputationReward,
    createdAt: Date.now()
  };
}

export function getDefaultQuests(): Quest[] {
  return [
    createQuest('Calculus Explorer', 'Solve 3 derivative or integration practice formulas', 'formula', 'easy', 3, 'Mathematics'),
    createQuest('Quantum Inquirer', 'Read 5 pages of Quantum Mechanics in the Smart PDF reader', 'study', 'medium', 5, 'Physics'),
    createQuest('Python Algorithmic Quest', 'Execute 2 algorithms in the Terminal Sandbox', 'code', 'easy', 2, 'Computer Science'),
    createQuest('Classroom Sage', 'Share or answer 1 study question in Classroom Hub', 'collaboration', 'medium', 1, 'General')
  ];
}

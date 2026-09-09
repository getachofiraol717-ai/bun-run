import { Achievement } from '../models/Civilization';

export function getDefaultAchievements(): Achievement[] {
  return [
    {
      id: 'ach_first_pdf',
      title: 'First Knowledge Ingestion',
      description: 'Analyze your first textbook in Smart PDF Engine',
      category: 'exploration',
      icon: 'BookOpen',
      unlocked: true,
      unlockedAt: Date.now() - 86400000,
      progress: 1,
      maxProgress: 1,
      xpReward: 100
    },
    {
      id: 'ach_formula_master',
      title: 'Equation Whisperer',
      description: 'Solve 10 formulas in the Formula Engine',
      category: 'mastery',
      icon: 'Binary',
      unlocked: false,
      progress: 4,
      maxProgress: 10,
      xpReward: 250
    },
    {
      id: 'ach_galaxy_explorer',
      title: 'Cosmic Navigator',
      description: 'Discover and navigate 5 clusters in Knowledge Galaxy',
      category: 'exploration',
      icon: 'Orbit',
      unlocked: false,
      progress: 2,
      maxProgress: 5,
      xpReward: 200
    },
    {
      id: 'ach_coder_pro',
      title: 'Polyglot Developer',
      description: 'Execute scripts in Python and Node within the Sandbox',
      category: 'coding',
      icon: 'Code2',
      unlocked: true,
      unlockedAt: Date.now() - 3600000,
      progress: 2,
      maxProgress: 2,
      xpReward: 150
    },
    {
      id: 'ach_streak_7',
      title: 'Dedicated Thinker',
      description: 'Maintain a 7-day active study streak in Companion',
      category: 'streak',
      icon: 'Flame',
      unlocked: false,
      progress: 3,
      maxProgress: 7,
      xpReward: 300
    }
  ];
}

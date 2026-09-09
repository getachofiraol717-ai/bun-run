export interface Civilization {
  id: string;
  name: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  epoch: 'Stone Age' | 'Classical Era' | 'Scientific Revolution' | 'Industrial Age' | 'Atomic Age' | 'Information Age' | 'Space Age' | 'Galactic Civilization';
  population: number;
  knowledgeIndex: number;
  unlockedPlanetsCount: number;
  completedQuestsCount: number;
  totalAchievements: number;
  reputationScore: number;
  activeBuffs: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Planet {
  id: string;
  name: string;
  theme: 'mathematics' | 'physics' | 'chemistry' | 'biology' | 'computer_science' | 'literature' | 'history' | 'cosmology';
  description: string;
  unlocked: boolean;
  masteryPercentage: number;
  biome: string;
  structuresBuilt: number;
  maxStructures: number;
  coordinates: { x: number; y: number; z: number };
  associatedSubjects: string[];
  unlockedAt?: number;
}

export type QuestType = 'study' | 'quiz' | 'exam' | 'code' | 'formula' | 'collaboration' | 'exploration';
export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  subject?: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  xpReward: number;
  reputationReward: number;
  badgeReward?: string;
  expiresAt?: number;
  createdAt: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'mastery' | 'streak' | 'coding' | 'collaboration' | 'exploration' | 'dedication';
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  xpReward: number;
}

export interface Reputation {
  score: number;
  rank: 'Novice Scholar' | 'Apprentice Thinker' | 'Journeyman Academic' | 'Master Sage' | 'Galactic Luminary';
  helpfulVotes: number;
  sharedResourcesCount: number;
  peerAssists: number;
  endorsements: string[];
}

export interface Reward {
  id: string;
  type: 'xp' | 'badge' | 'title' | 'cosmetic' | 'planet_unlock';
  name: string;
  description: string;
  value: number | string;
  claimed: boolean;
  claimedAt?: number;
}

export interface CivilizationEvent {
  id: string;
  type: 'quest_completed' | 'planet_discovered' | 'epoch_advanced' | 'achievement_unlocked' | 'reputation_gained' | 'study_milestone';
  title: string;
  description: string;
  timestamp: number;
  impactXp?: number;
}

export interface CivilizationState {
  civilization: Civilization;
  planets: Planet[];
  quests: Quest[];
  achievements: Achievement[];
  reputation: Reputation;
  recentEvents: CivilizationEvent[];
  pendingRewards: Reward[];
  isLoading: boolean;
}

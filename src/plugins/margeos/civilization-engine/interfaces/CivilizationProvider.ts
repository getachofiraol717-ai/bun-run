import { Civilization, Planet, Quest, Achievement, Reputation, Reward, CivilizationEvent } from '../models/Civilization';

export interface CivilizationProvider {
  getCivilization(): Promise<Civilization>;
  gainXp(amount: number, reason: string): Promise<{ newLevel: number; leveledUp: boolean }>;
  advanceEpoch(): Promise<string>;
}

export interface QuestProvider {
  getActiveQuests(): Promise<Quest[]>;
  generatePersonalizedQuests(studentProfileId?: string): Promise<Quest[]>;
  updateQuestProgress(questId: string, increment: number): Promise<Quest | null>;
  claimQuestReward(questId: string): Promise<Reward | null>;
}

export interface ProgressionProvider {
  getPlanets(): Promise<Planet[]>;
  unlockPlanet(planetId: string): Promise<boolean>;
  getAchievements(): Promise<Achievement[]>;
  checkAndAwardAchievements(): Promise<Achievement[]>;
  getReputation(): Promise<Reputation>;
}

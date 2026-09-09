import { useCivilizationStore } from '../store/civilizationStore';

export class ProgressService {
  static getProgressOverview() {
    const s = useCivilizationStore.getState();
    return {
      level: s.civilization.level,
      xp: s.civilization.xp,
      nextLevelXp: s.civilization.nextLevelXp,
      epoch: s.civilization.epoch,
      knowledgeIndex: s.civilization.knowledgeIndex,
      unlockedPlanets: s.planets.filter(p => p.unlocked).length,
      totalQuestsCompleted: s.quests.filter(q => q.completed).length,
      achievementsUnlocked: s.achievements.filter(a => a.unlocked).length
    };
  }
}

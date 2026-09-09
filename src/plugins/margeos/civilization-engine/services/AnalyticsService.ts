import { useCivilizationStore } from '../store/civilizationStore';

export class AnalyticsService {
  static getCivilizationMetrics() {
    const s = useCivilizationStore.getState();
    return {
      level: s.civilization.level,
      epoch: s.civilization.epoch,
      knowledgeIndex: s.civilization.knowledgeIndex,
      population: s.civilization.population,
      reputationScore: s.reputation.score,
      reputationRank: s.reputation.rank,
      unlockedPlanetsCount: s.planets.filter(p => p.unlocked).length,
      questsCompletedCount: s.quests.filter(q => q.completed).length,
      achievementsUnlockedCount: s.achievements.filter(a => a.unlocked).length
    };
  }
}

import { useCivilizationStore } from '../store/civilizationStore';
import { Achievement } from '../models/Civilization';

export class AchievementService {
  static checkProgress(achievementId: string, increment: number = 1): Achievement | null {
    const state = useCivilizationStore.getState();
    let updatedAchievement: Achievement | null = null;

    const newAch = state.achievements.map(a => {
      if (a.id === achievementId && !a.unlocked) {
        const nextP = Math.min(a.maxProgress, a.progress + increment);
        const unlocked = nextP >= a.maxProgress;
        if (unlocked) {
          useCivilizationStore.getState().gainXp(a.xpReward, `Unlocked Achievement: ${a.title}`);
          useCivilizationStore.getState().recordEvent({
            type: 'achievement_unlocked',
            title: `Achievement: ${a.title}`,
            description: a.description,
            impactXp: a.xpReward
          });
        }
        updatedAchievement = {
          ...a,
          progress: nextP,
          unlocked,
          unlockedAt: unlocked ? Date.now() : undefined
        };
        return updatedAchievement;
      }
      return a;
    });

    useCivilizationStore.setState({ achievements: newAch });
    return updatedAchievement;
  }
}

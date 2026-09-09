import { useCivilizationStore } from '../store/civilizationStore';
import { AchievementService } from '../services/AchievementService';

export class AchievementEngine {
  static getAchievements() {
    return useCivilizationStore.getState().achievements;
  }

  static triggerAchievementProgress(id: string, count: number = 1) {
    return AchievementService.checkProgress(id, count);
  }
}

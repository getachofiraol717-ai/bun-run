import { useCivilizationStore } from '../store/civilizationStore';
import { EventBridge } from './EventBridge';

export class CivilizationProgression {
  static checkProgression() {
    const s = useCivilizationStore.getState();
    const readyForNext = s.civilization.xp >= s.civilization.nextLevelXp;
    return {
      canLevelUp: readyForNext,
      currentLevel: s.civilization.level,
      epoch: s.civilization.epoch
    };
  }

  static addKnowledgeXp(amount: number, reason: string) {
    return useCivilizationStore.getState().gainXp(amount, reason);
  }
}

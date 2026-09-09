import { useCivilizationStore } from '../store/civilizationStore';
import { EventBridge } from './EventBridge';
import { QuestEngine } from './QuestEngine';
import { AchievementEngine } from './AchievementEngine';
import { WorldEvolutionEngine } from './WorldEvolutionEngine';

export class CivilizationEngine {
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;
    this.initialized = true;

    // Hook cross-engine listening if needed
    EventBridge.subscribe((ev) => {
      // Check quest triggers based on event types
      if (ev.type === 'study_milestone') {
        const activeQuests = QuestEngine.getQuests().filter(q => !q.completed);
        activeQuests.forEach(q => {
          if (q.type === 'study' || q.type === 'formula') {
            QuestEngine.progress(q.id, 1);
          }
        });
      }
    });
  }

  static getState() {
    return useCivilizationStore.getState();
  }

  static gainXp(amount: number, reason: string) {
    return useCivilizationStore.getState().gainXp(amount, reason);
  }

  static unlockPlanet(planetId: string) {
    useCivilizationStore.getState().unlockPlanet(planetId);
  }
}

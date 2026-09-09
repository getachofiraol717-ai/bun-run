import { useCivilizationStore } from '../store/civilizationStore';
import { Quest, QuestType, QuestDifficulty } from '../models/Civilization';
import { createQuest } from '../utils/questUtils';

export class QuestService {
  static getActiveQuests(): Quest[] {
    return useCivilizationStore.getState().quests.filter(q => !q.completed);
  }

  static addPersonalizedQuest(title: string, desc: string, type: QuestType, diff: QuestDifficulty, count: number, subject?: string): Quest {
    const q = createQuest(title, desc, type, diff, count, subject);
    useCivilizationStore.setState(state => ({
      quests: [q, ...state.quests]
    }));
    return q;
  }
}

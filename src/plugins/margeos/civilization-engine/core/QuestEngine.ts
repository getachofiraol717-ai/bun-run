import { useCivilizationStore } from '../store/civilizationStore';
import { Quest, QuestType, QuestDifficulty } from '../models/Civilization';
import { QuestService } from '../services/QuestService';

export class QuestEngine {
  static getQuests(): Quest[] {
    return useCivilizationStore.getState().quests;
  }

  static progress(questId: string, increment: number = 1) {
    useCivilizationStore.getState().advanceQuestProgress(questId, increment);
  }

  static createAdaptiveQuest(subject: string, topic: string): Quest {
    return QuestService.addPersonalizedQuest(
      `Mastery: ${topic}`,
      `Complete detailed review and solve related problems for ${topic} in ${subject}`,
      'study',
      'medium',
      3,
      subject
    );
  }
}

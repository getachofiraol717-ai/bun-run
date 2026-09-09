import { CivilizationEngine } from './CivilizationEngine';
import { EventBridge } from './EventBridge';
import { QuestEngine } from './QuestEngine';
import { AchievementEngine } from './AchievementEngine';
import { WorldEvolutionEngine } from './WorldEvolutionEngine';
import { ReputationEngine } from './ReputationEngine';
import { RewardEngine } from './RewardEngine';
import { CollaborationEngine } from './CollaborationEngine';
import { CivilizationProgression } from './CivilizationProgression';

export class CivilizationController {
  static getEngine() {
    CivilizationEngine.initialize();
    return CivilizationEngine;
  }

  static getOverview() {
    CivilizationEngine.initialize();
    return {
      civilization: CivilizationEngine.getState().civilization,
      planets: CivilizationEngine.getState().planets,
      quests: QuestEngine.getQuests(),
      achievements: AchievementEngine.getAchievements(),
      reputation: ReputationEngine.getReputation(),
      events: CivilizationEngine.getState().recentEvents
    };
  }

  static onStudyProgress(activityName: string, xpGained: number = 50) {
    EventBridge.emit({
      type: 'study_milestone',
      title: 'Study Progress Recorded',
      description: `Completed activity: ${activityName}`,
      impactXp: xpGained
    });
    return CivilizationEngine.gainXp(xpGained, activityName);
  }
}

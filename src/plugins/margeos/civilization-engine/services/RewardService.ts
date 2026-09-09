import { useCivilizationStore } from '../store/civilizationStore';
import { Reward } from '../models/Civilization';
import { createXpReward } from '../utils/rewardUtils';

export class RewardService {
  static grantXpReward(amount: number, reason: string): Reward {
    const r = createXpReward(amount, reason);
    useCivilizationStore.setState(state => ({
      pendingRewards: [r, ...state.pendingRewards]
    }));
    return r;
  }
}

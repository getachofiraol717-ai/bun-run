import { useCivilizationStore } from '../store/civilizationStore';
import { RewardService } from '../services/RewardService';

export class RewardEngine {
  static grantReward(amount: number, reason: string) {
    return RewardService.grantXpReward(amount, reason);
  }

  static claim(rewardId: string) {
    useCivilizationStore.getState().claimReward(rewardId);
  }
}

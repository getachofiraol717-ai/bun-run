import { useCivilizationStore } from '../store/civilizationStore';

export class ReputationEngine {
  static getReputation() {
    return useCivilizationStore.getState().reputation;
  }

  static endorseScholar(tag: string) {
    const { reputation } = useCivilizationStore.getState();
    useCivilizationStore.setState({
      reputation: {
        ...reputation,
        endorsements: Array.from(new Set([...reputation.endorsements, tag]))
      }
    });
  }
}

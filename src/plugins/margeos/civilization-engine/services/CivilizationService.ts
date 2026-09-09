import { useCivilizationStore } from '../store/civilizationStore';
import { Civilization } from '../models/Civilization';

export class CivilizationService {
  static getCivilization(): Civilization {
    return useCivilizationStore.getState().civilization;
  }

  static gainXp(amount: number, reason: string) {
    return useCivilizationStore.getState().gainXp(amount, reason);
  }
}

import { useCivilizationStore } from '../store/civilizationStore';

export class WorldEvolutionEngine {
  static getEvolutionState() {
    const { civilization, planets } = useCivilizationStore.getState();
    const unlocked = planets.filter(p => p.unlocked);
    return {
      epoch: civilization.epoch,
      activeWorlds: unlocked.length,
      planetaryCapacity: planets.length,
      globalKnowledgeScore: civilization.knowledgeIndex
    };
  }

  static evolveWorld(planetId: string) {
    const { planets } = useCivilizationStore.getState();
    const target = planets.find(p => p.id === planetId);
    if (!target) return false;

    useCivilizationStore.setState({
      planets: planets.map(p =>
        p.id === planetId
          ? { ...p, structuresBuilt: Math.min(p.maxStructures, p.structuresBuilt + 1), masteryPercentage: Math.min(100, p.masteryPercentage + 10) }
          : p
      )
    });
    return true;
  }
}

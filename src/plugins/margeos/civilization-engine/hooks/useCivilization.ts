import { useCivilizationStore } from '../store/civilizationStore';

export function useCivilization() {
  const civilization = useCivilizationStore(s => s.civilization);
  const gainXp = useCivilizationStore(s => s.gainXp);
  const resetState = useCivilizationStore(s => s.resetState);

  return {
    civilization,
    gainXp,
    resetState
  };
}

export function useQuests() {
  const quests = useCivilizationStore(s => s.quests);
  const advanceQuestProgress = useCivilizationStore(s => s.advanceQuestProgress);

  return {
    quests,
    activeQuests: quests.filter(q => !q.completed),
    completedQuests: quests.filter(q => q.completed),
    advanceQuestProgress
  };
}

export function useAchievements() {
  const achievements = useCivilizationStore(s => s.achievements);

  return {
    achievements,
    unlockedAchievements: achievements.filter(a => a.unlocked),
    lockedAchievements: achievements.filter(a => !a.unlocked)
  };
}

export function usePlanets() {
  const planets = useCivilizationStore(s => s.planets);
  const unlockPlanet = useCivilizationStore(s => s.unlockPlanet);

  return {
    planets,
    unlockedPlanets: planets.filter(p => p.unlocked),
    lockedPlanets: planets.filter(p => !p.unlocked),
    unlockPlanet
  };
}

export function useCivilizationEvents() {
  const recentEvents = useCivilizationStore(s => s.recentEvents);
  const recordEvent = useCivilizationStore(s => s.recordEvent);

  return {
    recentEvents,
    recordEvent
  };
}

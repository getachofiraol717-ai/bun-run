import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Civilization, Planet, Quest, Achievement, Reputation, Reward, CivilizationEvent } from '../models/Civilization';
import { calculateRequiredXpForLevel, determineEpoch, calculateKnowledgeIndex } from '../utils/progressionUtils';
import { getDefaultQuests } from '../utils/questUtils';
import { getDefaultAchievements } from '../utils/achievementUtils';
import { getDefaultReputation, calculateReputationRank } from '../utils/collaborationUtils';

interface CivilizationStoreState {
  civilization: Civilization;
  planets: Planet[];
  quests: Quest[];
  achievements: Achievement[];
  reputation: Reputation;
  recentEvents: CivilizationEvent[];
  pendingRewards: Reward[];

  // Actions
  gainXp: (amount: number, reason: string) => { newLevel: number; leveledUp: boolean };
  advanceQuestProgress: (questId: string, increment?: number) => void;
  claimReward: (rewardId: string) => void;
  unlockPlanet: (planetId: string) => void;
  incrementReputation: (amount: number, reason?: string) => void;
  recordEvent: (event: Omit<CivilizationEvent, 'id' | 'timestamp'>) => void;
  resetState: () => void;
}

const initialPlanets: Planet[] = [
  {
    id: 'planet_math',
    name: 'Calculus Prime',
    theme: 'mathematics',
    description: 'A glowing geometrical world governed by derivatives, integrals, and celestial matrices.',
    unlocked: true,
    masteryPercentage: 68,
    biome: 'Crystalline Geometric Planes',
    structuresBuilt: 5,
    maxStructures: 10,
    coordinates: { x: 10, y: 15, z: 0 },
    associatedSubjects: ['Mathematics', 'Calculus', 'Linear Algebra']
  },
  {
    id: 'planet_physics',
    name: 'Quantum Terra',
    theme: 'physics',
    description: 'An ethereal planet oscillating with wave-particle duality and magnetic flux ribbons.',
    unlocked: true,
    masteryPercentage: 45,
    biome: 'Superconducting Aurora Valley',
    structuresBuilt: 3,
    maxStructures: 10,
    coordinates: { x: -20, y: 30, z: 12 },
    associatedSubjects: ['Physics', 'Quantum Mechanics', 'Thermodynamics']
  },
  {
    id: 'planet_cs',
    name: 'Cyber Matrix 9',
    theme: 'computer_science',
    description: 'An advanced technological ringworld powered by algorithms, neural networks, and runtimes.',
    unlocked: true,
    masteryPercentage: 82,
    biome: 'Neon Circuitry Megacity',
    structuresBuilt: 7,
    maxStructures: 10,
    coordinates: { x: 35, y: -10, z: -5 },
    associatedSubjects: ['Computer Science', 'Python', 'Algorithms', 'AI']
  },
  {
    id: 'planet_bio',
    name: 'Helios Biosphere',
    theme: 'biology',
    description: 'A dense, lush orbital arboretum hosting genomic structures and cellular metabolism loops.',
    unlocked: false,
    masteryPercentage: 15,
    biome: 'Bioluminescent Canopy',
    structuresBuilt: 0,
    maxStructures: 10,
    coordinates: { x: -40, y: -25, z: 20 },
    associatedSubjects: ['Biology', 'Genetics', 'Organic Chemistry']
  }
];

const initialCivilization: Civilization = {
  id: 'civ_main',
  name: 'Aethelgard Academic Dominion',
  level: 8,
  xp: 450,
  nextLevelXp: calculateRequiredXpForLevel(9),
  epoch: 'Classical Era',
  population: 14200,
  knowledgeIndex: 58,
  unlockedPlanetsCount: 3,
  completedQuestsCount: 14,
  totalAchievements: 5,
  reputationScore: 340,
  activeBuffs: ['Deep Focus +15% XP', 'Socratic Flow +10% Mastery'],
  createdAt: Date.now() - 604800000,
  updatedAt: Date.now()
};

export const useCivilizationStore = create<CivilizationStoreState>()(
  persist(
    (set, get) => ({
      civilization: initialCivilization,
      planets: initialPlanets,
      quests: getDefaultQuests(),
      achievements: getDefaultAchievements(),
      reputation: getDefaultReputation(),
      recentEvents: [
        {
          id: 'ev_init_1',
          type: 'study_milestone',
          title: 'Quantum Terra Discovered',
          description: 'Completed Physics Chapter 4 analysis in Smart PDF engine',
          timestamp: Date.now() - 3600000,
          impactXp: 150
        }
      ],
      pendingRewards: [],

      gainXp: (amount, reason) => {
        const state = get();
        let newXp = state.civilization.xp + amount;
        let level = state.civilization.level;
        let nextReq = calculateRequiredXpForLevel(level + 1);
        let leveledUp = false;

        while (newXp >= nextReq) {
          newXp -= nextReq;
          level += 1;
          nextReq = calculateRequiredXpForLevel(level + 1);
          leveledUp = true;
        }

        const newEpoch = determineEpoch(level);

        set({
          civilization: {
            ...state.civilization,
            level,
            xp: newXp,
            nextLevelXp: nextReq,
            epoch: newEpoch,
            population: state.civilization.population + (amount * 5),
            updatedAt: Date.now()
          }
        });

        get().recordEvent({
          type: leveledUp ? 'epoch_advanced' : 'study_milestone',
          title: leveledUp ? `Level ${level} Achieved!` : `+${amount} Knowledge XP`,
          description: reason,
          impactXp: amount
        });

        return { newLevel: level, leveledUp };
      },

      advanceQuestProgress: (questId, increment = 1) => {
        const state = get();
        const updatedQuests = state.quests.map(q => {
          if (q.id === questId && !q.completed) {
            const nextCount = Math.min(q.targetCount, q.currentCount + increment);
            const isDone = nextCount >= q.targetCount;
            if (isDone) {
              get().gainXp(q.xpReward, `Completed Quest: ${q.title}`);
              get().incrementReputation(q.reputationReward, `Quest Completion: ${q.title}`);
              get().recordEvent({
                type: 'quest_completed',
                title: `Quest Complete: ${q.title}`,
                description: `Earned ${q.xpReward} XP and ${q.reputationReward} Reputation!`,
                impactXp: q.xpReward
              });
            }
            return {
              ...q,
              currentCount: nextCount,
              completed: isDone
            };
          }
          return q;
        });

        set({ quests: updatedQuests });
      },

      claimReward: (rewardId) => {
        const state = get();
        set({
          pendingRewards: state.pendingRewards.map(r =>
            r.id === rewardId ? { ...r, claimed: true, claimedAt: Date.now() } : r
          )
        });
      },

      unlockPlanet: (planetId) => {
        const state = get();
        set({
          planets: state.planets.map(p =>
            p.id === planetId ? { ...p, unlocked: true, unlockedAt: Date.now() } : p
          )
        });
        get().recordEvent({
          type: 'planet_discovered',
          title: 'New Celestial Knowledge Planet Discovered!',
          description: `Constructed exploration outpost for ${planetId}`,
          impactXp: 200
        });
      },

      incrementReputation: (amount, reason) => {
        const state = get();
        const newScore = state.reputation.score + amount;
        const newRank = calculateReputationRank(newScore);
        set({
          reputation: {
            ...state.reputation,
            score: newScore,
            rank: newRank
          }
        });
        if (reason) {
          get().recordEvent({
            type: 'reputation_gained',
            title: `+${amount} Scholar Reputation`,
            description: reason
          });
        }
      },

      recordEvent: (event) => {
        const newEv: CivilizationEvent = {
          ...event,
          id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now()
        };
        set(state => ({
          recentEvents: [newEv, ...state.recentEvents].slice(0, 20)
        }));
      },

      resetState: () => {
        set({
          civilization: initialCivilization,
          planets: initialPlanets,
          quests: getDefaultQuests(),
          achievements: getDefaultAchievements(),
          reputation: getDefaultReputation(),
          recentEvents: [],
          pendingRewards: []
        });
      }
    }),
    {
      name: 'margeos-civilization-storage'
    }
  )
);

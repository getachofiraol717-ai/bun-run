import { Reputation } from '../models/Civilization';

export function calculateReputationRank(score: number): Reputation['rank'] {
  if (score >= 2000) return 'Galactic Luminary';
  if (score >= 1000) return 'Master Sage';
  if (score >= 500) return 'Journeyman Academic';
  if (score >= 200) return 'Apprentice Thinker';
  return 'Novice Scholar';
}

export function getDefaultReputation(): Reputation {
  return {
    score: 340,
    rank: 'Apprentice Thinker',
    helpfulVotes: 12,
    sharedResourcesCount: 4,
    peerAssists: 8,
    endorsements: ['Clear Explanations', 'Helpful Peer', 'Fast Problem Solver']
  };
}

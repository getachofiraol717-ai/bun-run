import { useCivilizationStore } from '../store/civilizationStore';

export class CollaborationService {
  static awardPeerHelp(peerName: string, subject: string) {
    const store = useCivilizationStore.getState();
    store.incrementReputation(25, `Assisted ${peerName} with ${subject}`);
    store.gainXp(40, `Peer Collaboration in ${subject}`);
  }
}

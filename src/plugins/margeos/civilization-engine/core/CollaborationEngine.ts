import { CollaborationService } from '../services/CollaborationService';

export class CollaborationEngine {
  static reportPeerAssistance(peerName: string, subject: string) {
    CollaborationService.awardPeerHelp(peerName, subject);
  }
}

import { MessageService } from '../services/MessageService';

export class MultiplayerCommunicationAdapter {
  static async sendBattleMessage(battleId: string, userId: string, userName: string, text: string) {
    return MessageService.sendMessage({
      conversationId: `room_battle_${battleId}`,
      senderId: userId,
      senderName: userName,
      content: text,
      messageType: 'text',
    });
  }
}

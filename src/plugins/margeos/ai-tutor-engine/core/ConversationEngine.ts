import { ConversationService, ChatMessage } from "../services/ConversationService";

export class ConversationEngine {
  private static service = new ConversationService();

  static add(msg: ChatMessage) {
    this.service.addMessage(msg);
  }

  static getAll(): ChatMessage[] {
    return this.service.getMessages();
  }

  static clear() {
    this.service.clear();
  }
}

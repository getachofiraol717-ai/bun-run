export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  cardType?: string;
  cardData?: any;
}

export class ConversationService {
  private messages: ChatMessage[] = [];

  addMessage(msg: ChatMessage) {
    this.messages.push(msg);
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  clear() {
    this.messages = [];
  }
}

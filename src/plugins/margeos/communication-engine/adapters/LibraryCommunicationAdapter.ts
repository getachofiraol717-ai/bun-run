import { MessageService } from '../services/MessageService';

export class LibraryCommunicationAdapter {
  static async shareBookNoteToGroup(groupId: string, userId: string, userName: string, bookTitle: string, noteContent: string, pdfUrl?: string) {
    return MessageService.sendMessage({
      conversationId: groupId,
      senderId: userId,
      senderName: userName,
      content: `📚 Shared Note from "${bookTitle}":\n> ${noteContent}`,
      attachments: pdfUrl
        ? [
            {
              id: 'att_' + Date.now(),
              name: `${bookTitle}.pdf`,
              url: pdfUrl,
              file_type: 'document',
              file_size: 1024 * 1024,
              mime_type: 'application/pdf',
            },
          ]
        : [],
    });
  }
}

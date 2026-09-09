import { MessageService } from '../services/MessageService';
import { Conversation } from '../types';

export class ClassroomCommunicationAdapter {
  static async syncClassroomChannel(classroomId: string, title: string, subject: string): Promise<Conversation> {
    return {
      id: `room_class_${classroomId}`,
      type: 'channel',
      title: `🏫 ${title}`,
      subject,
      description: 'Official Live Classroom Chat Channel',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_private: false,
    };
  }

  static async broadcastClassroomAnnouncement(classroomId: string, announcement: string, senderName: string) {
    return MessageService.sendMessage({
      conversationId: `room_class_${classroomId}`,
      senderId: 'teacher_system',
      senderName,
      content: `📢 ANNOUNCEMENT: ${announcement}`,
      messageType: 'system',
    });
  }
}

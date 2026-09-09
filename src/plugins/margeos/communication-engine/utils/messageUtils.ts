import { Message, MessageType } from '../types';

export function formatMessageTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

export function detectMessageContent(text: string): {
  hasAIMention: boolean;
  cleanText: string;
  codeBlocks: string[];
} {
  const hasAIMention = text.toLowerCase().includes('@ai');
  const cleanText = text.replace(/@ai/gi, '').trim();

  const codeRegex = /```[\s\S]*?```/g;
  const codeBlocks = text.match(codeRegex) || [];

  return {
    hasAIMention,
    cleanText,
    codeBlocks,
  };
}

export function truncateMessage(text: string, maxLength = 60): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function isSystemMessage(msg: Message): boolean {
  return msg.message_type === 'system';
}

export function isAIMessage(msg: Message): boolean {
  return msg.message_type === 'ai' || msg.sender_id === 'ai-tutor' || msg.sender_id === 'ku-ai';
}

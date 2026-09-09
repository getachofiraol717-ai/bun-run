/**
 * Knowledge Universe — AI Chat Service
 * Enables @AI mentions and in-conversation AI responses using Gemini.
 */

import { aiStream } from '@/pages/creator/aiClient';
import { Message } from '../types';

export class AIChatService {
  /**
   * Process a message and stream an AI response into the conversation
   */
  static async processAIMention(params: {
    prompt: string;
    conversationTitle: string;
    conversationSubject?: string;
    recentMessages: Message[];
    documentContext?: { title: string; content?: string };
    onChunk: (chunk: string) => void;
    onComplete: (fullText: string) => void;
    onError: (err: Error) => void;
  }): Promise<void> {
    const {
      prompt,
      conversationTitle,
      conversationSubject = 'General Knowledge',
      recentMessages,
      documentContext,
      onChunk,
      onComplete,
      onError,
    } = params;

    // Build context prompt
    const safeMessages = Array.isArray(recentMessages) ? recentMessages : [];
    const historyText = safeMessages
      .slice(-6)
      .map((m) => `${m.sender_name || 'User'} (${m.message_type || 'text'}): ${m.content || ''}`)
      .join('\n');

    const systemPrompt = `You are the Knowledge Universe AI Tutor inside a communication hub conversation.
Conversation Title: "${conversationTitle}"
Subject: "${conversationSubject}"
${documentContext ? `Shared Document Context: "${documentContext.title}"\n${documentContext.content || ''}\n` : ''}

Recent Conversation History:
${historyText}

Student Query: "${prompt}"

Provide a clear, encouraging, educational, and concise response formatted in Markdown.
If formulas or code are relevant, render them cleanly.`;

    try {
      let accumulated = '';
      await aiStream({
        messages: [{ role: 'user', content: systemPrompt }],
        mode: 'instant',
        onToken: (chunk) => {
          accumulated += chunk;
          onChunk(chunk);
        },
      });
      onComplete(accumulated);
    } catch (e: any) {
      onError(e instanceof Error ? e : new Error('AI processing failed'));
    }
  }
}

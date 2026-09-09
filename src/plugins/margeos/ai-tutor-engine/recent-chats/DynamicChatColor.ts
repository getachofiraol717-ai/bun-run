/**
 * Knowledge Universe — Dynamic Color Assignment & State Engine
 * Deterministically maps stable conversation data to visual identities.
 */

import { KUColorSpec, KU_SEVEN_COLORS, getSevenColorSequence } from './RecentChatTheme';

export type ResponseVisualState = 'generating' | 'completed' | 'failed' | 'idle';

export interface ChatVisualIdentity {
  baseColor: KUColorSpec;
  secondaryColor: KUColorSpec;
  sequence: KUColorSpec[];
  baseIndex: number;
  responseState: ResponseVisualState;
  hasUnreadCompletion: boolean;
}

/**
 * Deterministically hashes a string (conversation ID) to an integer index in 0..6.
 * Guarantees identical output across reloads, sessions, and devices.
 */
export function getDeterministicColorIndex(chatId: string, createdAt?: number): number {
  if (!chatId) return 0;
  
  let hash = 0;
  for (let i = 0; i < chatId.length; i++) {
    const char = chatId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  
  if (createdAt) {
    hash = hash ^ (createdAt % 1000003);
  }

  const positiveHash = Math.abs(hash);
  return positiveHash % KU_SEVEN_COLORS.length;
}

/**
 * Determines response completion state from a chat's message history.
 */
export function resolveResponseVisualState(
  messages: Array<{ role: string; content: string; retryText?: string | null }>,
  isCurrentlyStreaming: boolean,
  isActiveChat: boolean
): ResponseVisualState {
  if (isCurrentlyStreaming && isActiveChat) {
    return 'generating';
  }

  if (!messages || messages.length === 0) {
    return 'idle';
  }

  const lastMsg = messages[messages.length - 1];
  if (!lastMsg) return 'idle';

  if (lastMsg.role === 'assistant') {
    if (lastMsg.retryText || lastMsg.content.startsWith('⚠️')) {
      return 'failed';
    }
    if (lastMsg.content.trim().length > 0) {
      return 'completed';
    }
  }

  return 'idle';
}

/**
 * Resolves full visual identity for a given chat item.
 */
export function getChatVisualIdentity(
  chatId: string,
  createdAt: number,
  messages: Array<{ role: string; content: string; retryText?: string | null }>,
  isCurrentlyStreaming: boolean,
  isActiveChat: boolean
): ChatVisualIdentity {
  const baseIndex = getDeterministicColorIndex(chatId, createdAt);
  const sequence = getSevenColorSequence(baseIndex);
  const baseColor = sequence[0];
  const secondaryColor = sequence[1];
  const responseState = resolveResponseVisualState(messages, isCurrentlyStreaming, isActiveChat);

  return {
    baseColor,
    secondaryColor,
    sequence,
    baseIndex,
    responseState,
    hasUnreadCompletion: responseState === 'completed' && !isActiveChat,
  };
}

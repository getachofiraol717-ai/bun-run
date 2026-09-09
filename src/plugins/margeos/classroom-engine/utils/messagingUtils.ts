/**
 * messagingUtils.ts
 *
 * Utility functions for messaging operations.
 */

/**
 * Format message time for display
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format message date for grouping
 */
export function formatMessageDate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDay.getTime() === today.getTime()) return 'Today';
  if (messageDay.getTime() === yesterday.getTime()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Check if messages are from the same sender (for grouping)
 */
export function isSameSender(messages: any[], currentIndex: number): boolean {
  if (currentIndex === 0) return false;

  const current = messages[currentIndex];
  const previous = messages[currentIndex - 1];

  if (current.channelId !== previous.channelId) return false;
  if (current.senderId !== previous.senderId) return false;

  const currentTime = new Date(current.createdAt).getTime();
  const previousTime = new Date(previous.createdAt).getTime();
  const diff = currentTime - previousTime;

  // Group if within 5 minutes
  return diff < 5 * 60 * 1000;
}

/**
 * Extract mentions from message content
 */
export function extractMentions(content: string): string[] {
  const mentionPattern = /@(\w+)/g;
  const matches = content.match(mentionPattern);
  return matches ? matches.map(m => m.slice(1)) : [];
}

/**
 * Highlight mentions in message content
 */
export function highlightMentions(content: string, currentUserId?: string): string {
  return content.replace(
    /@(\w+)/g,
    (match, username) => {
      const isCurrentUser = username.toLowerCase() === currentUserId?.toLowerCase();
      return `<span class="mention ${isCurrentUser ? 'mention--me' : ''}">@${username}</span>`;
    }
  );
}

/**
 * Truncate message content for preview
 */
export function truncateMessage(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + '...';
}

/**
 * Check if content contains code blocks
 */
export function containsCodeBlocks(content: string): boolean {
  return content.includes('```') || content.includes('`');
}

/**
 * Extract code blocks from content
 */
export function extractCodeBlocks(content: string): Array<{ language: string; code: string }> {
  const codeBlockPattern = /```(\w*)\n?([\s\S]*?)```/g;
  const inlineCodePattern = /`([^`]+)`/g;
  const blocks: Array<{ language: string; code: string }> = [];

  let match;
  while ((match = codeBlockPattern.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    });
  }

  return blocks;
}

/**
 * Parse markdown-like formatting
 */
export function parseFormatting(content: string): string {
  return content
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

/**
 * Generate unique message ID
 */
export function generateMessageId(): string {
  return `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Get message delivery status
 */
export function getDeliveryStatusText(status: string): string {
  switch (status) {
    case 'pending': return 'Sending...';
    case 'sent': return 'Sent';
    case 'delivered': return 'Delivered';
    case 'read': return 'Read';
    case 'failed': return 'Failed';
    default: return '';
  }
}

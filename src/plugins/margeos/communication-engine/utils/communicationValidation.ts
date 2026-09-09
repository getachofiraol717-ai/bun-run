export function validateMessageContent(content: string): { valid: boolean; error?: string } {
  if (!content || !content.trim()) {
    return { valid: false, error: 'Message cannot be empty.' };
  }
  if (content.length > 5000) {
    return { valid: false, error: 'Message exceeds maximum limit of 5,000 characters.' };
  }
  return { valid: true };
}

export function sanitizeText(text: string): string {
  return text.trim();
}

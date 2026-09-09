import { UserRole } from '../types';

export function canManageConversation(role?: UserRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canPinMessage(role?: UserRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'moderator';
}

export function canDeleteMessage(messageSenderId: string, currentUserId: string, userRole?: UserRole): boolean {
  if (messageSenderId === currentUserId) return true;
  return userRole === 'owner' || userRole === 'admin' || userRole === 'moderator';
}

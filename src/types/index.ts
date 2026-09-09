// Canonical Root Types Barrel Exports
export * from './canonicalQuiz';

export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  role?: 'student' | 'teacher' | 'admin' | 'creator';
  grade?: number;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
}

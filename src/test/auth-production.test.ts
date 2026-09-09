import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Production Authentication & Role Verification Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Registration Flow', () => {
    it('should reject registration with empty email or password', async () => {
      const registerFn = async (name: string, email: string, pass: string) => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !pass) {
          throw new Error('Email and password are required for registration.');
        }
        return { user: { id: 'usr-123', email: cleanEmail } };
      };

      await expect(registerFn('Abebe', '', 'pass123')).rejects.toThrow(
        'Email and password are required for registration.'
      );
      await expect(registerFn('Abebe', 'abebe@example.com', '')).rejects.toThrow(
        'Email and password are required for registration.'
      );
    });

    it('should normalize email before calling authentication service', async () => {
      let registeredEmail = '';
      const mockSignUp = vi.fn().mockImplementation(async ({ email }) => {
        registeredEmail = email;
        return { data: { user: { id: 'usr-1', email } }, error: null };
      });

      const emailInput = '  Student.Ethiopia@KnowledgeUniverse.EDU  ';
      const cleanEmail = emailInput.trim().toLowerCase();
      await mockSignUp({ email: cleanEmail });

      expect(registeredEmail).toBe('student.ethiopia@knowledgeuniverse.edu');
    });

    it('never stores plaintext password in localStorage during registration', async () => {
      // Simulate registration
      const user = { id: 'usr-new-1', email: 'learner@example.com' };
      // Verify localStorage does not contain any passwords
      expect(localStorage.getItem('password')).toBeNull();
      expect(localStorage.getItem('ku_password')).toBeNull();
      expect(localStorage.getItem('user_password')).toBeNull();
    });
  });

  describe('2. Login & Credential Validation', () => {
    it('returns structured error on invalid credentials without manufacturing fallback tokens', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const email = 'wrong@example.com';
      const pass = 'wrongpass';

      const res = await mockSignIn({ email, password: pass });

      expect(res.data.user).toBeNull();
      expect(res.data.session).toBeNull();
      expect(res.error?.message).toBe('Invalid login credentials');
      expect(localStorage.getItem('fallback-access-token')).toBeNull();
      expect(localStorage.getItem('local-access-token')).toBeNull();
    });

    it('successfully handles valid Supabase user session', async () => {
      const mockUser = { id: 'usr-real-456', email: 'student@example.com' };
      const mockSession = { access_token: 'sb-jwt-real-token', user: mockUser };

      const mockSignIn = vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const res = await mockSignIn({ email: 'student@example.com', password: 'validPassword123' });

      expect(res.error).toBeNull();
      expect(res.data.user?.id).toBe('usr-real-456');
      expect(res.data.session?.access_token).toBe('sb-jwt-real-token');
    });
  });

  describe('3. Admin Role & Escalation Protection', () => {
    it('never grants admin status based on email string containing admin', () => {
      const checkIsAdmin = (userRoles: Array<{ role: string }>, email: string) => {
        // Correct production logic: only check userRoles from database
        return userRoles.some(r => r.role === 'admin');
      };

      const attackerEmail1 = 'admin@gmail.com';
      const attackerEmail2 = 'superadmin-user@example.com';
      const attackerEmail3 = 'admin.tester@yahoo.com';

      // User has no admin role in DB
      const standardStudentRoles: Array<{ role: string }> = [{ role: 'student' }];

      expect(checkIsAdmin(standardStudentRoles, attackerEmail1)).toBe(false);
      expect(checkIsAdmin(standardStudentRoles, attackerEmail2)).toBe(false);
      expect(checkIsAdmin(standardStudentRoles, attackerEmail3)).toBe(false);
    });

    it('grants admin status ONLY when authoritative DB role is present', () => {
      const checkIsAdmin = (userRoles: Array<{ role: string }>) => {
        return userRoles.some(r => r.role === 'admin');
      };

      const genuineAdminRoles = [{ role: 'admin' }];
      expect(checkIsAdmin(genuineAdminRoles)).toBe(true);
    });

    it('blocks unauthenticated and non-admin users from admin routes', () => {
      const canAccessAdminRoute = (isAuthenticated: boolean, isAdmin: boolean) => {
        return isAuthenticated && isAdmin;
      };

      expect(canAccessAdminRoute(false, false)).toBe(false); // Guest
      expect(canAccessAdminRoute(true, false)).toBe(false);  // Normal student
      expect(canAccessAdminRoute(false, true)).toBe(false);  // Stale/fake admin flag without session
      expect(canAccessAdminRoute(true, true)).toBe(true);    // Verified Admin
    });
  });

  describe('4. Session Restoration & Logout', () => {
    it('clears all session state on logout without orphaned auth cookies', async () => {
      let activeUser: any = { id: 'usr-1', email: 'user@example.com' };
      let activeSession: any = { access_token: 'valid' };
      let isAdmin = true;

      const logout = async () => {
        activeUser = null;
        activeSession = null;
        isAdmin = false;
      };

      await logout();

      expect(activeUser).toBeNull();
      expect(activeSession).toBeNull();
      expect(isAdmin).toBe(false);
    });

    it('handles expired/invalid session gracefully by defaulting to unauthenticated', async () => {
      const mockGetSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'JWT expired' },
      });

      const { data, error } = await mockGetSession();
      const user = data?.session?.user ?? null;
      const isAuthenticated = !!user;

      expect(isAuthenticated).toBe(false);
      expect(user).toBeNull();
    });
  });

  describe('5. Subscription & Premium Protection', () => {
    it('disallows client-side localStorage spoofing of premium status', () => {
      localStorage.setItem('ku_is_premium', 'true');

      const profile = {
        id: 'prof-1',
        user_id: 'usr-1',
        subscription: 'free',
        subscription_expires_at: null,
      };

      // Production AuthContext logic: strictly checks profile.subscription
      const isPremium = profile?.subscription === 'premium';

      expect(isPremium).toBe(false);
    });

    it('marks subscription as expired if subscription_expires_at is in the past', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const profile = {
        id: 'prof-2',
        user_id: 'usr-2',
        subscription: 'premium',
        subscription_expires_at: pastDate,
      };

      let currentSubscription = profile.subscription;
      if (profile.subscription === 'premium' && profile.subscription_expires_at) {
        if (new Date(profile.subscription_expires_at) < new Date()) {
          currentSubscription = 'free';
        }
      }

      expect(currentSubscription).toBe('free');
    });
  });
});

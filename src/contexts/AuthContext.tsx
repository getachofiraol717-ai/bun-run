import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import type { User, Session } from '@supabase/supabase-js';
import { usePresenceHeartbeat } from '@/hooks/usePresence';
import { isDesignatedAdminEmail, ensureAdminRoleInDatabase } from '@/lib/adminAuth';

export type UserRole = 'student' | 'teacher' | 'school' | 'admin';
export type SubscriptionTier = 'free' | 'premium';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  subscription: string;
  avatar_url: string | null;
  study_plan: string | null;
  grade?: number | null;
  role?: UserRole;
  language?: string | null;
  phone?: string | null;
  phone_country_code?: string | null;
  signup_source?: string | null;
  subscription_expires_at?: string | null;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    roleOrPhone?: UserRole | string,
    phone?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    if (!userId) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }

    try {
      // 1. Authoritative check for current user identity
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || session?.user?.email || user?.email || '';
      const isOwner = isDesignatedAdminEmail(userEmail);

      // 2. Authoritative profile fetch (selecting columns that exist on profiles)
      let { data } = await supabase
        .from('profiles')
        .select('id, user_id, name, email, phone, phone_country_code, language, subscription, subscription_expires_at, study_plan, avatar_url, created_at, updated_at, last_login_at, signup_source')
        .eq('user_id', userId)
        .maybeSingle();

      // If user profile is missing in public.profiles, self-heal immediately
      if (!data && currentUser && currentUser.id === userId) {
        const selfHealProfile = {
          id: userId,
          user_id: userId,
          name: currentUser.user_metadata?.name || userEmail.split('@')[0] || 'Learner',
          email: userEmail,
          phone: currentUser.user_metadata?.phone || null,
          subscription: isOwner ? 'premium' : 'free',
          signup_source: currentUser.app_metadata?.provider || 'web',
          language: 'en',
          last_login_at: new Date().toISOString(),
        };

        const { data: createdProf } = await supabase
          .from('profiles')
          .upsert(selfHealProfile, { onConflict: 'user_id' })
          .select()
          .maybeSingle();

        if (createdProf) {
          data = createdProf;
        }

        try {
          await supabase.from('user_roles').upsert({
            user_id: userId,
            role: isOwner ? 'admin' : 'student',
          }, { onConflict: 'user_id,role' });
        } catch { /* non-blocking */ }
      }

      // 3. Authoritative role check from user_roles
      let userRole: UserRole = isOwner ? 'admin' : 'student';
      let adminRoleFound = isOwner;

      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (roleData && roleData.length > 0) {
          if (roleData.some(r => r.role === 'admin')) {
            adminRoleFound = true;
            userRole = 'admin';
          } else if (roleData.some(r => r.role === 'school')) {
            userRole = 'school';
          } else if (roleData.some(r => r.role === 'teacher')) {
            userRole = 'teacher';
          }
        }
      } catch {
        if ((currentUser?.app_metadata?.role === 'admin') || (currentUser?.user_metadata?.role === 'admin')) {
          adminRoleFound = true;
          userRole = 'admin';
        }
      }

      // If designated owner, guarantee admin authority & self-heal in database
      if (isOwner) {
        adminRoleFound = true;
        userRole = 'admin';
        ensureAdminRoleInDatabase(supabase, userId).catch(() => {});
      }

      if (data) {
        let userGrade: number | null = null;
        if (data.study_plan) {
          const match = data.study_plan.match(/grade\s*(\d+)/i);
          if (match) {
            userGrade = parseInt(match[1], 10);
          }
        }

        const prof: Profile = {
          id: data.id,
          user_id: data.user_id,
          name: data.name || userEmail.split('@')[0] || 'Learner',
          email: data.email || userEmail,
          phone: data.phone,
          phone_country_code: data.phone_country_code,
          language: data.language,
          subscription: data.subscription || 'free',
          subscription_expires_at: data.subscription_expires_at,
          study_plan: data.study_plan,
          avatar_url: data.avatar_url,
          created_at: data.created_at,
          updated_at: data.updated_at,
          last_login_at: data.last_login_at,
          signup_source: data.signup_source,
          role: userRole,
          grade: userGrade,
        };

        if (prof.subscription === 'premium' && prof.subscription_expires_at) {
          if (new Date(prof.subscription_expires_at) < new Date()) {
            prof.subscription = 'free';
          }
        }
        setProfile(prof);
      } else {
        setProfile(null);
      }

      setIsAdmin(adminRoleFound);
    } catch (err) {
      console.warn('fetchProfile caught error:', err);
      const userEmail = session?.user?.email || user?.email || '';
      if (isDesignatedAdminEmail(userEmail)) {
        setIsAdmin(true);
      }
    }
  };

  const recordLogin = async (userId: string, method: string, success: boolean) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return;

    try {
      await supabase.from('login_history').insert({
        user_id: userId,
        login_method: method,
        success,
      });

      if (success) {
        await supabase.from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('user_id', userId);

        await supabase.from('analytics_events').insert({
          user_id: userId,
          event_type: 'user_login',
          page: window.location.pathname,
          event_data: { method, timestamp: new Date().toISOString() },
        });
      }
    } catch { /* non-critical */ }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if (sess?.user) {
        setSession(sess);
        setUser(sess.user);
        await fetchProfile(sess.user.id);
        if (event === 'SIGNED_IN') {
          recordLogin(sess.user.id, sess.user.app_metadata?.provider || 'session', true);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      if (sess?.user) {
        setSession(sess);
        setUser(sess.user);
        await fetchProfile(sess.user.id);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    }).catch(() => {
      setProfile(null);
      setIsAdmin(false);
      setUser(null);
      setSession(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return { success: false, error: 'Please provide both email and password.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id);
        await recordLogin(data.user.id, 'email', true);
        return { success: true };
      }

      return { success: false, error: 'Authentication failed. Please check your credentials.' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during authentication.';
      return { success: false, error: message };
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
        extraParams: { access_type: 'offline', prompt: 'select_account' },
      });
      if (result?.error) {
        // Try direct Supabase OAuth if Lovable client returned an error
        const { error: sbError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (sbError) throw sbError;
      }
      if (result?.redirected) return;
    } catch (err) {
      // Direct Supabase OAuth fallback
      const { error: sbError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (sbError) throw sbError;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    roleOrPhone?: UserRole | string,
    phone?: string
  ): Promise<void> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      throw new Error('Email and password are required for registration.');
    }

    // Role-free register: all standard registrations default to 'student'
    let assignedRole: UserRole = 'student';
    let userPhone: string | undefined = phone;

    if (roleOrPhone) {
      if (['student', 'teacher', 'school', 'admin'].includes(roleOrPhone)) {
        assignedRole = roleOrPhone as UserRole;
      } else if (!phone) {
        userPhone = roleOrPhone;
      }
    }

    const isOwner = cleanEmail === 'getachofiraol717@gmail.com';
    const effectiveRole = isOwner ? 'admin' : assignedRole;

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name,
          phone: userPhone ?? '',
          role: effectiveRole,
          signup_source: 'email',
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      // Direct insertion into public.profiles using columns that exist
      try {
        const profilePayload = {
          id: data.user.id,
          user_id: data.user.id,
          name: name.trim() || cleanEmail.split('@')[0] || 'Learner',
          email: cleanEmail,
          phone: userPhone?.trim() || null,
          subscription: (isOwner ? 'premium' : 'free') as 'free' | 'premium',
          signup_source: 'email',
          language: 'en',
          last_login_at: new Date().toISOString(),
        };

        const { error: profErr } = await supabase
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'user_id' });

        if (profErr) {
          console.warn('Profile upsert warning:', profErr.message);
          const safePayload = {
            id: data.user.id,
            user_id: data.user.id,
            name: name.trim() || cleanEmail.split('@')[0],
            email: cleanEmail,
            subscription: (isOwner ? 'premium' : 'free') as 'free' | 'premium',
          };
          await supabase.from('profiles').upsert(safePayload, { onConflict: 'user_id' });
        }

        // Ensure user_roles row exists
        await supabase.from('user_roles').upsert({
          user_id: data.user.id,
          role: effectiveRole,
        }, { onConflict: 'user_id,role' });

        // Record signup in login_history and analytics
        await supabase.from('login_history').insert({
          user_id: data.user.id,
          login_method: 'email_signup',
          success: true,
        });

        await supabase.from('analytics_events').insert({
          user_id: data.user.id,
          event_type: 'user_registered',
          event_data: { email: cleanEmail, name, role: effectiveRole, timestamp: new Date().toISOString() },
        });
      } catch (err) {
        console.warn('Direct profile creation error caught:', err);
      }

      if (data.session) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id);
      }
    }
  };

  const logout = async (): Promise<void> => {
    // Clear all state immediately
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);

    try {
      await supabase.auth.signOut();
    } catch { /* ignore non-blocking error on network drop */ }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return false;
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return !error;
  };

  // ── Presence heartbeat (marks user online every 30s) ──────────────
  usePresenceHeartbeat(user?.id ?? null);

  // Check subscription validity periodically (every 5 minutes)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      if (profile?.subscription === 'premium' && profile?.subscription_expires_at) {
        if (new Date(profile.subscription_expires_at) < new Date()) {
          await fetchProfile(user.id);
        }
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, profile]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      login,
      loginWithGoogle,
      register,
      logout,
      sendPasswordReset,
      isAuthenticated: !!user,
      isPremium: profile?.subscription === 'premium',
      isAdmin,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

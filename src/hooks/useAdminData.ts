import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { isDesignatedAdminEmail } from '@/lib/adminAuth';
import type { Database } from '@/integrations/supabase/types';

type ContentInsert = Database['public']['Tables']['content_items']['Insert'];
type ContentUpdate = Database['public']['Tables']['content_items']['Update'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// ---- Content Items ----
export function useContentItems(contentType?: string) {
  return useQuery({
    queryKey: ['content_items', contentType],
    queryFn: async () => {
      let q = supabase.from('content_items').select('*').order('created_at', { ascending: false });
      if (contentType) q = q.eq('content_type', contentType);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: ContentInsert) => {
      const { data, error } = await supabase.from('content_items').insert([item]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content_items'] }); toast({ title: '✅ Content uploaded!' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ContentUpdate }) => {
      const { error } = await supabase.from('content_items').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content_items'] }); toast({ title: '✅ Content updated!' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('content_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content_items'] }); toast({ title: 'Content deleted' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// ---- Quiz Questions ----
export function useQuizQuestions(subject?: string, grade?: number) {
  return useQuery({
    queryKey: ['quiz_questions', subject, grade],
    queryFn: async () => {
      let q = (supabase as any).from('quiz_questions').select('*').order('created_at', { ascending: false });
      if (subject) q = q.eq('subject', subject);
      if (grade && grade > 0) q = q.eq('grade', grade);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { question: string; options: string[]; correct_answer?: number; subject?: string; grade?: number; difficulty?: string; explanation?: string }) => {
      const { data, error } = await (supabase as any).from('quiz_questions').insert([item]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quiz_questions'] }); toast({ title: '✅ Question saved!' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('quiz_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quiz_questions'] }); toast({ title: 'Question deleted' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// ---- Profiles & User Management (Production Grade) ----
export interface AdminUser {
  id: string; // profile id
  user_id: string; // auth uuid
  name: string;
  email: string;
  phone: string | null;
  phone_country_code: string | null;
  language: string | null;
  grade: number | null;
  study_plan: string | null;
  subscription: string;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  signup_source: string | null;
  role: 'student' | 'teacher' | 'school' | 'admin';
  roles: string[];
  is_online?: boolean;
  status: 'active' | 'suspended' | 'expired' | 'unverified';
  total_payments_amount?: number;
  payments_count?: number;
  login_count?: number;
  last_login_method?: string | null;
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUsersDirectory() {
  return useQuery({
    queryKey: ['users_directory'],
    queryFn: async (): Promise<AdminUser[]> => {
      let profilesRes = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      
      // Resilient fallback if full select encounters schema or column cache lag
      if (profilesRes.error) {
        console.warn('Full profiles select error, attempting safe column select:', profilesRes.error);
        const safeRes = await supabase
          .from('profiles')
          .select('id, user_id, name, email, subscription, phone, study_plan, language, created_at, updated_at, last_login_at, signup_source')
          .order('created_at', { ascending: false });
        if (safeRes.data) {
          profilesRes = safeRes as any;
        }
      }

      const [rolesRes, loginsRes, paymentsRes] = await Promise.all([
        supabase.from('user_roles').select('*'),
        supabase.from('login_history').select('user_id, created_at, login_method, success').order('created_at', { ascending: false }).limit(1000),
        supabase.from('payments').select('user_id, amount, payment_status'),
      ]);

      const profiles = profilesRes.data || [];
      const rolesData = rolesRes.data || [];
      const loginsData = loginsRes.data || [];
      const paymentsData = paymentsRes.data || [];

      // Build quick lookup maps
      const rolesMap = new Map<string, string[]>();
      rolesData.forEach((r: any) => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      // Aggregate login history per user
      const loginsSummary = new Map<string, { count: number; latestAt: string | null; method: string | null }>();
      loginsData.forEach((l: any) => {
        if (!l.user_id) return;
        const current = loginsSummary.get(l.user_id) || { count: 0, latestAt: null, method: null };
        current.count += 1;
        if (!current.latestAt || l.created_at > current.latestAt) {
          current.latestAt = l.created_at;
          current.method = l.login_method;
        }
        loginsSummary.set(l.user_id, current);
      });

      // Payments map
      const paymentsSummary = new Map<string, { total: number; count: number }>();
      paymentsData.forEach((p: any) => {
        if (p.user_id) {
          const current = paymentsSummary.get(p.user_id) || { total: 0, count: 0 };
          current.count += 1;
          if (p.payment_status === 'verified' || p.payment_status === 'completed') {
            current.total += Number(p.amount) || 0;
          }
          paymentsSummary.set(p.user_id, current);
        }
      });

      const now = new Date();
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

      return profiles.map((p): AdminUser => {
        const userRoles = rolesMap.get(p.user_id) || [];
        const isOwner = isDesignatedAdminEmail(p.email);

        // Primary role hierarchy: admin > school > teacher > student
        let primaryRole: 'student' | 'teacher' | 'school' | 'admin' = 'student';
        if (isOwner || userRoles.includes('admin')) {
          primaryRole = 'admin';
        } else if (userRoles.includes('school')) {
          primaryRole = 'school';
        } else if (userRoles.includes('teacher')) {
          primaryRole = 'teacher';
        }

        const loginInfo = loginsSummary.get(p.user_id) || { count: 0, latestAt: null, method: null };
        const effectiveLastLogin = p.last_login_at || loginInfo.latestAt || null;
        const isOnline = Boolean(effectiveLastLogin && effectiveLastLogin >= fifteenMinsAgo);
        const paymentInfo = paymentsSummary.get(p.user_id) || { total: 0, count: 0 };

        // Determine subscription expiration & status
        let status: 'active' | 'suspended' | 'expired' | 'unverified' = 'active';
        if (p.subscription === 'premium' && p.subscription_expires_at) {
          const expiresDate = new Date(p.subscription_expires_at);
          if (expiresDate < now) {
            status = 'expired';
          }
        }

        // Extract grade safely from profile column or fallback to study_plan note
        let userGrade: number | null = (p as any).grade !== undefined && (p as any).grade !== null 
          ? Number((p as any).grade) 
          : null;
        if (userGrade === null && p.study_plan) {
          const m = p.study_plan.match(/grade\s*(\d+)/i);
          if (m) {
            const parsed = parseInt(m[1], 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
              userGrade = parsed;
            }
          }
        }

        return {
          id: p.id,
          user_id: p.user_id,
          name: p.name || 'Unnamed User',
          email: p.email || '',
          phone: p.phone,
          phone_country_code: p.phone_country_code,
          language: p.language,
          grade: userGrade,
          study_plan: p.study_plan,
          subscription: p.subscription || 'free',
          subscription_expires_at: p.subscription_expires_at,
          created_at: p.created_at,
          updated_at: p.updated_at,
          last_login_at: effectiveLastLogin,
          signup_source: p.signup_source,
          role: primaryRole,
          roles: userRoles.length > 0 ? userRoles : [primaryRole],
          is_online: isOnline,
          status,
          total_payments_amount: paymentInfo.total,
          payments_count: paymentInfo.count,
          login_count: loginInfo.count,
          last_login_method: loginInfo.method,
        };
      });
    },
    refetchInterval: 15000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProfileUpdate }) => {
      let { error } = await supabase.from('profiles').update(updates).eq('id', id);
      if (error && (
        error.message?.toLowerCase().includes('grade') ||
        error.details?.toLowerCase().includes('grade') ||
        error.code === 'PGRST204'
      )) {
        console.warn("Retrying profile update without 'grade' column (schema cache fallback):", error.message);
        const safeUpdates = { ...(updates as any) };
        delete safeUpdates.grade;
        const retryRes = await supabase.from('profiles').update(safeUpdates).eq('id', id);
        error = retryRes.error;
      }
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['users_directory'] });
      toast({ title: '✅ User updated!' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role, profileId }: { userId: string; role: 'student' | 'teacher' | 'school' | 'admin'; profileId?: string }) => {
      // 1. Upsert / update user_roles authoritative row
      const { data: existingRoles, error: checkErr } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId);

      if (checkErr) console.warn('Error checking user_roles:', checkErr);

      if (existingRoles && existingRoles.length > 0) {
        const { error: updateErr } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role }]);
        if (insertErr) throw insertErr;
      }

      // 2. Also sync profile table if profileId is available
      if (profileId) {
        try {
          const { error: profileRoleErr } = await supabase.from('profiles').update({ role } as any).eq('id', profileId);
          if (profileRoleErr) {
            console.warn('Profile role sync skipped (authoritative user_roles updated):', profileRoleErr.message);
          }
        } catch (err) {
          console.warn('Profile role sync caught:', err);
        }
      }

      // 3. Log audit event safely without failing mutation
      try {
        const currentUser = (await supabase.auth.getUser()).data.user;
        if (currentUser) {
          await supabase.from('analytics_events').insert([{
            user_id: currentUser.id,
            event_type: 'admin_role_updated',
            event_data: { target_user_id: userId, role, timestamp: new Date().toISOString() },
          }]);
        }
      } catch (err) {
        console.warn('Role update audit log caught (non-blocking):', err);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users_directory'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
      toast({ title: '✅ User role updated successfully' });
    },
    onError: (e: Error) => toast({ title: 'Role update failed', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateUserSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      profileId,
      userId,
      subscription,
      expiresAt,
      reason,
    }: {
      profileId: string;
      userId: string;
      subscription: 'free' | 'premium';
      expiresAt?: string | null;
      reason?: string;
    }) => {
      let { error } = await supabase
        .from('profiles')
        .update({
          subscription,
          subscription_expires_at: expiresAt ?? null,
        })
        .eq('id', profileId);

      // Fallback matching by user_id if id did not match
      if (error && userId) {
        const fallbackRes = await supabase
          .from('profiles')
          .update({
            subscription,
            subscription_expires_at: expiresAt ?? null,
          })
          .eq('user_id', userId);
        if (!fallbackRes.error) {
          error = null;
        }
      }

      if (error) throw error;

      // Log subscription audit event safely without failing mutation
      try {
        const currentUser = (await supabase.auth.getUser()).data.user;
        if (currentUser) {
          await supabase.from('analytics_events').insert([{
            user_id: currentUser.id,
            event_type: 'admin_subscription_updated',
            event_data: {
              target_user_id: userId,
              subscription,
              expires_at: expiresAt ?? 'lifetime/none',
              reason: reason || 'Manual Admin Action',
              timestamp: new Date().toISOString(),
            },
          }]);
        }
      } catch (err) {
        console.warn('Subscription audit log caught (non-blocking):', err);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users_directory'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['analytics_stats'] });
      toast({ title: '✅ Subscription updated successfully' });
    },
    onError: (e: Error) => toast({ title: 'Subscription update failed', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateUserProfileDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      email,
      phone,
      grade,
      study_plan,
      language,
    }: {
      id: string;
      name?: string;
      email?: string;
      phone?: string | null;
      grade?: number | null;
      study_plan?: string | null;
      language?: string | null;
    }) => {
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email;
      if (phone !== undefined) updates.phone = phone;
      if (grade !== undefined) updates.grade = grade;
      if (study_plan !== undefined) updates.study_plan = study_plan;
      if (language !== undefined) updates.language = language;

      let { error } = await supabase.from('profiles').update(updates).eq('id', id);

      // Fallback matching by user_id if id did not match
      if (error) {
        const fallbackRes = await supabase.from('profiles').update(updates).eq('user_id', id);
        if (!fallbackRes.error) {
          error = null;
        }
      }

      // Gracefully handle PostgREST schema cache missing 'grade' column
      if (error && (
        error.message?.toLowerCase().includes('grade') ||
        error.details?.toLowerCase().includes('grade') ||
        error.code === 'PGRST204'
      )) {
        console.warn("PostgREST schema cache missing 'grade' column on profiles, retrying without 'grade':", error.message);
        const safeUpdates = { ...updates };
        delete safeUpdates.grade;

        // If grade was provided, embed it into study_plan if not already present
        if (grade && (!safeUpdates.study_plan || !safeUpdates.study_plan.toLowerCase().includes('grade'))) {
          safeUpdates.study_plan = safeUpdates.study_plan
            ? `${safeUpdates.study_plan} (Grade ${grade})`
            : `Grade ${grade}`;
        }

        const retryRes = await supabase.from('profiles').update(safeUpdates).eq('id', id);
        error = retryRes.error;
        if (error) {
          const retryFallback = await supabase.from('profiles').update(safeUpdates).eq('user_id', id);
          if (!retryFallback.error) error = null;
        }
      }

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users_directory'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
      toast({ title: '✅ Profile details saved' });
    },
    onError: (e: Error) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      email,
      password,
      role = 'student',
      grade,
      phone,
      subscription = 'free',
    }: {
      name: string;
      email: string;
      password?: string;
      role?: 'student' | 'teacher' | 'school' | 'admin';
      grade?: number | null;
      phone?: string | null;
      subscription?: 'free' | 'premium';
    }) => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) throw new Error('Email address is required.');

      const userPassword = password && password.length >= 6 ? password : `KU_${Math.random().toString(36).slice(2, 10)}!`;

      // 1. Isolated client to sign up user via Supabase Auth without disrupting admin's current session
      const tempClient = createClient(
        (import.meta as any).env.VITE_SUPABASE_URL || 'https://rhkctgaweqtgidvagssm.supabase.co',
        (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_sJjHC1Ow_n2uWs0celQPNQ_Z-viBcJI',
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      let newUserId = crypto.randomUUID();

      try {
        const { data: authData, error: authError } = await tempClient.auth.signUp({
          email: cleanEmail,
          password: userPassword,
          options: {
            data: {
              name: name.trim() || cleanEmail.split('@')[0],
              role,
              phone: phone || '',
              grade: grade || null,
            },
          },
        });
        if (!authError && authData?.user?.id) {
          newUserId = authData.user.id;
        }
      } catch (authErr) {
        console.warn('Isolated signup caught (falling back to generated UUID):', authErr);
      }

      // 2. Direct upsert into public.profiles with valid columns only
      const profileRecord: any = {
        id: newUserId,
        user_id: newUserId,
        name: name.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: phone?.trim() || null,
        study_plan: grade ? `Grade ${grade}` : null,
        subscription,
        signup_source: 'admin_created',
        language: 'en',
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileRecord, { onConflict: 'user_id' });

      if (profileError) {
        console.warn('Primary profile upsert failed, retrying minimal record:', profileError.message);
        const minimalRecord = {
          id: newUserId,
          user_id: newUserId,
          name: name.trim() || cleanEmail.split('@')[0],
          email: cleanEmail,
          subscription,
        };
        const retry = await supabase.from('profiles').upsert(minimalRecord, { onConflict: 'user_id' });
        if (retry.error) throw retry.error;
      }

      // 3. Authoritative role in user_roles
      await supabase.from('user_roles').upsert({
        user_id: newUserId,
        role: role as any,
      }, { onConflict: 'user_id,role' });

      // 4. Record initial event in login_history and analytics
      try {
        await supabase.from('login_history').insert({
          user_id: newUserId,
          login_method: 'admin_provisioned',
          success: true,
        });

        await supabase.from('analytics_events').insert({
          user_id: newUserId,
          event_type: 'user_created_by_admin',
          event_data: {
            email: cleanEmail,
            role,
            grade,
            subscription,
            timestamp: new Date().toISOString(),
          },
        });
      } catch { /* non-blocking */ }

      return { userId: newUserId, email: cleanEmail, password: userPassword };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users_directory'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['analytics_stats'] });
      qc.invalidateQueries({ queryKey: ['active_users'] });
      toast({ title: '✅ User saved to admin panel successfully' });
    },
    onError: (e: Error) => toast({ title: 'Failed to save user', description: e.message, variant: 'destructive' }),
  });
}

export function useSendPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
    onSuccess: () => toast({ title: '📧 Password reset email dispatched!' }),
    onError: (e: Error) => toast({ title: 'Password reset failed', description: e.message, variant: 'destructive' }),
  });
}

export function useUserDetailActivity(userId: string | null) {
  return useQuery({
    queryKey: ['user_detail_activity', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const [eventsRes, readingRes, paymentsRes, sessionRes] = await Promise.all([
        supabase.from('analytics_events').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('reading_progress').select('*').eq('user_id', userId).order('last_read_at', { ascending: false }).limit(10),
        (supabase as any).from('payments').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
        (supabase as any).from('user_sessions').select('*').eq('user_id', userId).order('started_at', { ascending: false }).limit(10),
      ]);

      return {
        events: eventsRes.data || [],
        readingProgress: readingRes.data || [],
        payments: paymentsRes.data || [],
        sessions: sessionRes.data || [],
      };
    },
  });
}

export function useBulkUpdateUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userIds,
      profileIds,
      action,
      subscription,
      expiresAt,
      role,
    }: {
      userIds: string[];
      profileIds: string[];
      action: 'set_subscription' | 'set_role' | 'delete';
      subscription?: 'free' | 'premium';
      expiresAt?: string | null;
      role?: 'student' | 'teacher' | 'school' | 'admin';
    }) => {
      if (action === 'set_subscription' && subscription) {
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription,
            subscription_expires_at: expiresAt ?? null,
          })
          .in('id', profileIds);
        if (error) throw error;
      } else if (action === 'set_role' && role) {
        for (const uid of userIds) {
          await supabase.from('user_roles').upsert([{ user_id: uid, role }]);
        }
      } else if (action === 'delete') {
        const { error } = await supabase.from('profiles').delete().in('id', profileIds);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users_directory'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
      toast({ title: '✅ Bulk action applied successfully' });
    },
    onError: (e: Error) => toast({ title: 'Bulk action failed', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['users_directory'] });
      toast({ title: 'User removed' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// ---- Analytics ----
export function useAnalyticsStats() {
  return useQuery({
    queryKey: ['analytics_stats'],
    queryFn: async () => {
      const [profilesRes, eventsRes, quizRes, paymentsRes] = await Promise.all([
        supabase.from('profiles').select('id, subscription', { count: 'exact' }),
        supabase.from('analytics_events').select('id, event_type, created_at', { count: 'exact' }),
        (supabase as any).from('quiz_questions').select('id', { count: 'exact' }),
        (supabase as any).from('payments').select('id, payment_status, amount', { count: 'exact' }),
      ]);

      const profiles = profilesRes.data || [];
      const totalUsers = profilesRes.count || 0;
      const premiumUsers = profiles.filter(p => p.subscription === 'premium').length;
      const freeUsers = totalUsers - premiumUsers;

      const events = eventsRes.data || [];
      const quizAttempts = events.filter(e => e.event_type === 'quiz_attempt').length;
      const booksRead = events.filter(e => e.event_type === 'book_read').length;
      const aiQuestions = events.filter(e => e.event_type === 'ai_question').length;

      const today = new Date().toISOString().split('T')[0];
      const activeTodayRes = await (supabase as any).from('user_sessions')
        .select('user_id').gte('started_at', today);
      const activeToday = new Set((activeTodayRes.data || []).map((s: { user_id: string }) => s.user_id)).size;

      const totalPayments = paymentsRes.count || 0;
      const successfulPayments = (paymentsRes.data || []).filter((p: { payment_status: string }) => p.payment_status === 'verified' || p.payment_status === 'completed').length;

      return { totalUsers, activeToday, quizAttempts, booksRead, premiumUsers, freeUsers, aiQuestions, totalQuizQuestions: quizRes.count || 0, totalPayments, successfulPayments };
    },
  });
}

// ---- Payments (Production Verified) ----
export function usePayments(filter?: 'all' | 'pending' | 'verified' | 'failed' | 'suspicious') {
  return useQuery({
    queryKey: ['payments', filter ?? 'all'],
    queryFn: async () => {
      let q: any = (supabase as any).from('payments').select('*').order('created_at', { ascending: false });
      if (filter === 'pending') q = q.in('payment_status', ['pending', 'processing']);
      else if (filter === 'verified') q = q.eq('payment_status', 'verified');
      else if (filter === 'failed') q = q.eq('payment_status', 'failed');
      else if (filter === 'suspicious') q = q.eq('verification_status', 'suspicious');
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 15000,
  });
}

export function usePaymentStats() {
  return useQuery({
    queryKey: ['payment_stats'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('payments').select('payment_status, verification_status, amount, currency, created_at');
      if (error) throw error;
      const all: any[] = data ?? [];
      const verified = all.filter(p => p.payment_status === 'verified');
      const pending = all.filter(p => ['pending', 'processing'].includes(p.payment_status));
      const failed = all.filter(p => p.payment_status === 'failed');
      const suspicious = all.filter(p => p.verification_status === 'suspicious');
      const revenue = verified.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const monthly: Record<string, number> = {};
      verified.forEach(p => {
        const month = p.created_at ? p.created_at.slice(0, 7) : 'Unknown';
        monthly[month] = (monthly[month] ?? 0) + Number(p.amount);
      });
      return { total: all.length, verified: verified.length, pending: pending.length, failed: failed.length, suspicious: suspicious.length, revenue, monthly };
    },
    refetchInterval: 15000,
  });
}

export function useWebhookEvents() {
  return useQuery({
    queryKey: ['webhook_events'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('webhook_events').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data as Array<{ id: string; provider: string; event_type: string; tx_ref: string | null; signature_valid: boolean | null; processed: boolean; error: string | null; created_at: string }>;
    },
  });
}

export function useAdminApprovePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, note }: { paymentId: string; note?: string }) => {
      const { data, error } = await supabase.rpc('admin_approve_manual_payment' as any, {
        _payment_id: paymentId,
        _admin_note: note ?? '',
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result?.success) throw new Error(result?.error ?? 'Approval failed');
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['payment_stats'] });
      toast({ title: '✅ Payment approved — premium activated' });
    },
    onError: (e: Error) => toast({ title: 'Approval failed', description: e.message, variant: 'destructive' }),
  });
}

export function useAdminRejectPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('admin_reject_payment' as any, {
        _payment_id: paymentId,
        _reason: reason ?? '',
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['payment_stats'] });
      toast({ title: '❌ Payment rejected' });
    },
    onError: (e: Error) => toast({ title: 'Rejection failed', description: e.message, variant: 'destructive' }),
  });
}

export function useAdminFlagPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const { data, error } = await supabase.rpc('flag_suspicious_payment' as any, {
        _payment_id: paymentId,
        _reason: reason,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: '🚩 Payment flagged as suspicious' });
    },
    onError: (e: Error) => toast({ title: 'Flag failed', description: e.message, variant: 'destructive' }),
  });
}

// ---- Real Audit / Analytics Events ----
export async function trackEvent(eventType: string, page?: string, eventData?: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from('analytics_events').insert([{
    event_type: eventType,
    page,
    user_id: user?.id,
    event_data: eventData as Database['public']['Tables']['analytics_events']['Insert']['event_data'],
  }]);
}

// ---- Active Users / Presence ----
export interface UserPresence {
  user_id: string;
  name: string | null;
  email: string | null;
  subscription: string | null;
  is_online: boolean;
  last_seen_at: string | null;
  signup_source: string | null;
  login_count: number | null;
}

export function useActiveUsers() {
  return useQuery({
    queryKey: ['active_users'],
    queryFn: async (): Promise<UserPresence[]> => {
      try {
        const { data, error } = await (supabase as any).rpc('get_active_users', { _limit: 200 });
        if (!error && Array.isArray(data) && data.length > 0) {
          return data as UserPresence[];
        }
      } catch { /* fallback to direct schema query */ }

      // Direct fallback querying profiles and login_history
      const [profilesRes, loginsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, user_id, name, email, subscription, last_login_at, signup_source')
          .order('last_login_at', { ascending: false, nullsFirst: false })
          .limit(200),
        supabase
          .from('login_history')
          .select('user_id, created_at')
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

      const loginsCount = new Map<string, number>();
      const loginsLatest = new Map<string, string>();
      (loginsRes.data || []).forEach((l: any) => {
        if (!l.user_id) return;
        loginsCount.set(l.user_id, (loginsCount.get(l.user_id) || 0) + 1);
        if (!loginsLatest.has(l.user_id) || l.created_at > (loginsLatest.get(l.user_id) || '')) {
          loginsLatest.set(l.user_id, l.created_at);
        }
      });

      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

      return (profilesRes.data || []).map((p: any): UserPresence => {
        const latestTime = p.last_login_at || loginsLatest.get(p.user_id) || null;
        const isOnline = Boolean(latestTime && latestTime >= fifteenMinsAgo);

        return {
          user_id: p.user_id,
          name: p.name || (p.email ? p.email.split('@')[0] : 'User'),
          email: p.email,
          subscription: p.subscription,
          is_online: isOnline,
          last_seen_at: latestTime,
          signup_source: p.signup_source,
          login_count: loginsCount.get(p.user_id) || (p.last_login_at ? 1 : 0),
        };
      });
    },
    refetchInterval: 15_000,
  });
}

export function useLoginHistoryLog(limit: number = 50) {
  return useQuery({
    queryKey: ['login_history_log', limit],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('login_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('login_history fetch warning:', error);
        return [];
      }

      // Fetch profile metadata for users in logs
      const userIds = Array.from(new Set((logs || []).map((l: any) => l.user_id).filter(Boolean)));
      if (userIds.length === 0) return logs || [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      const profileMap = new Map<string, { name: string; email: string }>();
      (profiles || []).forEach((p: any) => {
        profileMap.set(p.user_id, { name: p.name, email: p.email });
      });

      return (logs || []).map((log: any) => ({
        ...log,
        user_name: profileMap.get(log.user_id)?.name || 'Unknown User',
        user_email: profileMap.get(log.user_id)?.email || 'No email',
      }));
    },
    refetchInterval: 15_000,
  });
}

// ---- AI Usage & Chat Audit ----
export function useAIUsageAudit(days: number = 7, search: string = '', page: number = 0, pageSize: number = 25) {
  return useQuery({
    queryKey: ['ai_usage_audit', days, search, page, pageSize],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data: usage, error } = await (supabase as any)
        .from('ai_usage')
        .select('id, user_id, kind, provider, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.code === '42P01')) {
        return { rows: [], allRows: [], totalRows: 0, recent: [], totals: { messages: 0, images: 0, gemini: 0, chatgpt: 0, users: 0 } };
      }
      if (error) throw error;

      const byUser: Record<string, { user_id: string; messages: number; images: number; gemini: number; chatgpt: number; last: string }> = {};
      for (const r of usage || []) {
        const u = (byUser[r.user_id] ||= { user_id: r.user_id, messages: 0, images: 0, gemini: 0, chatgpt: 0, last: r.created_at });
        if (r.kind === 'message') u.messages++; else u.images++;
        if (r.provider === 'gemini') u.gemini++;
        if (r.provider === 'chatgpt') u.chatgpt++;
        if (r.created_at > u.last) u.last = r.created_at;
      }
      const userIds = Object.keys(byUser);
      const profiles: Record<string, { name: string; email: string; subscription: string }> = {};
      if (userIds.length) {
        const { data: profs } = await supabase
          .from('profiles').select('user_id, name, email, subscription')
          .in('user_id', userIds);
        for (const p of profs || []) profiles[p.user_id] = { name: p.name, email: p.email, subscription: p.subscription };
      }
      let rows = Object.values(byUser).map(u => ({ ...u, ...(profiles[u.user_id] || { name: 'Unknown', email: '—', subscription: 'free' }) }))
        .sort((a, b) => (b.messages + b.images) - (a.messages + a.images));

      if (search.trim()) {
        const q = search.toLowerCase();
        rows = rows.filter(r => r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q));
      }
      const totalRows = rows.length;
      const paged = rows.slice(page * pageSize, page * pageSize + pageSize);

      const recent = (usage || []).slice(0, 100).map((r: any) => ({
        ...r,
        name: profiles[r.user_id]?.name || '—',
        email: profiles[r.user_id]?.email || '—',
      }));

      const totals = {
        messages: (usage || []).filter((r: any) => r.kind === 'message').length,
        images: (usage || []).filter((r: any) => r.kind === 'image').length,
        gemini: (usage || []).filter((r: any) => r.provider === 'gemini').length,
        chatgpt: (usage || []).filter((r: any) => r.provider === 'chatgpt').length,
        users: userIds.length,
      };
      return { rows: paged, allRows: rows, totalRows, recent, totals };
    },
  });
}

export function useAIChatsAudit() {
  return useQuery({
    queryKey: ['ai_chats_audit'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ai_chats')
        .select('id, user_id, title, provider, subject, updated_at')
        .order('updated_at', { ascending: false })
        .limit(100);
      if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.code === '42P01')) {
        return [];
      }
      if (error) throw error;
      return data;
    },
  });
}

// ---- AI Settings ----
export type AISettings = { id: number; free_msg_limit: number; free_img_limit: number; free_msg_limit_per_provider: number; window_hours: number; enabled: boolean };

export function useAISettings() {
  return useQuery({
    queryKey: ['ai_settings'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('ai_settings').select('*').eq('id', 1).maybeSingle();
      if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.code === '42P01')) {
        return { id: 1, free_msg_limit: 100, free_img_limit: 20, free_msg_limit_per_provider: 100, window_hours: 24, enabled: true };
      }
      if (error) throw error;
      return data as AISettings | null;
    },
  });
}

export function useUpdateAISettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<AISettings>) => {
      const { error } = await (supabase as any).from('ai_settings').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ai_settings'] }); toast({ title: '✅ AI settings saved' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// ---- Reading Progress (User-Scoped Client Engine) ----
export interface LocalReadingProgressItem {
  id?: string;
  user_id?: string;
  content_item_id: string;
  current_page: number;
  total_pages: number;
  progress_percent: number;
  last_read_at: string;
  title?: string;
}

function getReadingProgressStorageKey(userId?: string | null): string {
  return userId ? `ku_reading_progress_${userId}` : 'ku_reading_progress_guest';
}

export function getLocalReadingProgress(userId?: string | null): LocalReadingProgressItem[] {
  try {
    const key = getReadingProgressStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch (e) {
    console.warn('[ReadingProgress] Error reading local storage:', e);
    return [];
  }
}

export function saveLocalReadingProgress(params: {
  content_item_id: string;
  current_page: number;
  total_pages: number;
  title?: string;
  userId?: string | null;
}): LocalReadingProgressItem {
  const userId = params.userId ?? null;
  const list = getLocalReadingProgress(userId);
  const safeTotal = Math.max(1, params.total_pages || 1);
  const safeCurrent = Math.max(1, Math.min(params.current_page, safeTotal));
  const progress_percent = Math.min(100, Math.max(0, Math.round((safeCurrent / safeTotal) * 100)));
  const now = new Date().toISOString();

  const idx = list.findIndex((r) => r.content_item_id === params.content_item_id);
  const updatedItem: LocalReadingProgressItem = {
    id: idx >= 0 ? list[idx].id : `local_${params.content_item_id}`,
    user_id: userId || undefined,
    content_item_id: params.content_item_id,
    current_page: safeCurrent,
    total_pages: safeTotal,
    progress_percent,
    last_read_at: now,
    title: params.title || (idx >= 0 ? list[idx].title : undefined),
  };

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...updatedItem };
  } else {
    list.unshift(updatedItem);
  }

  try {
    const key = getReadingProgressStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('ku_reading_progress_changed', { detail: { ...updatedItem, userId } }));
  } catch (e) {
    console.warn('[ReadingProgress] Error saving to local storage:', e);
  }

  return updatedItem;
}

function mergeReadingProgressList(dbData: any[] = [], localData: LocalReadingProgressItem[] = []): LocalReadingProgressItem[] {
  const map = new Map<string, LocalReadingProgressItem>();

  for (const item of dbData) {
    if (item && item.content_item_id) {
      map.set(item.content_item_id, {
        id: item.id,
        user_id: item.user_id,
        content_item_id: item.content_item_id,
        current_page: Number(item.current_page || 1),
        total_pages: Number(item.total_pages || 1),
        progress_percent: Number(item.progress_percent || 0),
        last_read_at: item.last_read_at || new Date().toISOString(),
        title: item.title,
      });
    }
  }

  for (const item of localData) {
    if (item && item.content_item_id) {
      const existing = map.get(item.content_item_id);
      if (!existing) {
        map.set(item.content_item_id, item);
      } else {
        const localTime = new Date(item.last_read_at).getTime();
        const existingTime = new Date(existing.last_read_at).getTime();
        if (localTime >= existingTime || item.progress_percent > existing.progress_percent) {
          map.set(item.content_item_id, { ...existing, ...item });
        }
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.last_read_at).getTime() - new Date(a.last_read_at).getTime()
  );
}

export function useReadingProgress() {
  return useQuery({
    queryKey: ['reading_progress'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return getLocalReadingProgress(null);
        }

        const localData = getLocalReadingProgress(user.id);
        const { data, error } = await supabase
          .from('reading_progress')
          .select('*')
          .eq('user_id', user.id)
          .order('last_read_at', { ascending: false });

        if (error || !data) {
          return localData;
        }

        return mergeReadingProgressList(data, localData);
      } catch (err) {
        console.warn('[ReadingProgress] Supabase query error, fallback to local storage:', err);
        return [];
      }
    },
    staleTime: 2000,
  });
}

export function useUpsertReadingProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      content_item_id: string;
      current_page: number;
      total_pages: number;
      title?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      const savedLocal = saveLocalReadingProgress({ ...params, userId });

      if (user) {
        try {
          const { error } = await supabase.from('reading_progress').upsert({
            user_id: user.id,
            content_item_id: params.content_item_id,
            current_page: savedLocal.current_page,
            total_pages: savedLocal.total_pages,
            progress_percent: savedLocal.progress_percent,
            last_read_at: savedLocal.last_read_at,
          }, { onConflict: 'user_id,content_item_id' });

          if (error) {
            console.warn('[ReadingProgress] Supabase upsert error:', error);
          }
        } catch (err) {
          console.warn('[ReadingProgress] Supabase error:', err);
        }
      }

      return savedLocal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reading_progress'] });
      qc.invalidateQueries({ queryKey: ['user_stats'] });
    },
  });
}

// ---- User Stats (Computed from real events & isolated per user) ----
export function useUserStats() {
  return useQuery({
    queryKey: ['user_stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { xp: 0, booksRead: 0, studyMinutes: 0, quizScore: 0, streak: 0, quizLevel: 1 };

      const [eventsRes, quizAttemptsRes, streakRes, sessionsRes, readingRes] = await Promise.all([
        supabase.from('analytics_events').select('*').eq('user_id', user.id),
        supabase.from('quiz_attempts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle(),
        (supabase as any).from('user_sessions').select('duration_minutes, started_at').eq('user_id', user.id),
        supabase.from('reading_progress').select('*').eq('user_id', user.id),
      ]);

      const events = eventsRes.data || [];
      const dbQuizAttempts = quizAttemptsRes.data || [];
      const userStreakData = streakRes.data as any;
      const sessions = sessionsRes.data || [];
      const readingData = readingRes.data || [];

      // Combine DB quiz attempts and analytics event quiz attempts
      const eventQuizAttempts = events.filter(e => e.event_type === 'quiz_attempt');
      const bookEvents = events.filter(e => e.event_type === 'book_read');
      const aiQuestions = events.filter(e => e.event_type === 'ai_question').length;

      let totalCorrect = 0;
      let totalQuestions = 0;

      if (dbQuizAttempts.length > 0) {
        dbQuizAttempts.forEach((q: any) => {
          totalCorrect += Number(q.score) || 0;
          totalQuestions += Number(q.total_questions) || 0;
        });
      } else {
        eventQuizAttempts.forEach(e => {
          const d = e.event_data as Record<string, number> | null;
          if (d) {
            totalCorrect += d.score || 0;
            totalQuestions += d.total || 0;
          }
        });
      }

      const quizScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      const studyMinutes = Math.round(sessions.reduce((a: number, s: { duration_minutes: number }) => a + Number(s.duration_minutes || 0), 0));

      const localProgress = getLocalReadingProgress(user.id);
      const mergedProgress = mergeReadingProgressList(readingData, localProgress);
      const completedBooks = mergedProgress.filter(p => Number(p.progress_percent) >= 100).length;
      const booksStarted = mergedProgress.length;

      const totalQuizCount = Math.max(dbQuizAttempts.length, eventQuizAttempts.length);
      const xp = (totalQuizCount * 50) + (bookEvents.length * 30) + (aiQuestions * 5) + (completedBooks * 100) + Math.floor(studyMinutes / 10);

      let streak = userStreakData?.current_streak || 0;
      if (!streak && sessions.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days = new Set(sessions.map((s: { started_at: string }) => {
          const d = new Date(s.started_at);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }));

        let checkDate = new Date(today);
        while (days.has(checkDate.getTime())) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      return {
        xp,
        booksRead: Math.max(booksStarted, completedBooks),
        studyMinutes,
        quizScore,
        streak,
        quizLevel: userStreakData?.current_level || Math.max(1, totalQuizCount + 1),
      };
    },
  });
}

// ---- File Upload Utility ----
export async function uploadContentFile(file: File, path: string) {
  const { data, error } = await supabase.storage.from('content-files').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('content-files').getPublicUrl(data.path);
  return urlData.publicUrl;
}

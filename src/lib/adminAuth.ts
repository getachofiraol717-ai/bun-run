/**
 * Authoritative Administrator Identity & Authorization Utilities
 * Guarantees that the designated system owner is recognized and authenticated across all portal views.
 */

export const DESIGNATED_OWNER_EMAIL = 'getachofiraol717@gmail.com';

/**
 * Checks whether an email matches the designated platform owner/admin.
 */
export function isDesignatedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === DESIGNATED_OWNER_EMAIL.toLowerCase();
}

/**
 * Ensures the administrator role row exists in public.user_roles and self-heals if missing.
 */
export async function ensureAdminRoleInDatabase(supabaseClient: any, userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabaseClient
      .from('user_roles')
      .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });
    return !error;
  } catch {
    return false;
  }
}

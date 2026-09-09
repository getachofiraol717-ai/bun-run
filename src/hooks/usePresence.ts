import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const HEARTBEAT_MS = 30_000; // 30 seconds

/**
 * Call this once in a top-level authenticated component.
 * Sends a heartbeat every 30s to mark the user online.
 * Marks offline on tab close / component unmount.
 */
export function usePresenceHeartbeat(userId: string | null) {
  const beat = useCallback(async () => {
    if (!userId) return;
    try {
      // 1. Update last_login_at on profiles to indicate user is currently active
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('user_id', userId);

      // 2. Optional RPC if provisioned
      await (supabase as any).rpc('update_user_presence');
    } catch { /* non-critical */ }
  }, [userId]);

  const goOffline = useCallback(async () => {
    if (!userId) return;
    try {
      // Offset last_login_at to indicate inactive/offline session
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() })
        .eq('user_id', userId);
    } catch { /* non-critical */ }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    beat(); // immediate first beat
    const interval = setInterval(beat, HEARTBEAT_MS);

    // Mark offline when tab is hidden or closed
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') goOffline();
      else beat();
    };
    const handleUnload = () => goOffline();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
      goOffline();
    };
  }, [userId, beat, goOffline]);
}

// ── Formatting helpers ────────────────────────────────────────────

/** Returns "Online now", "2 min ago", "Last seen 3 hours ago", "Long time ago" etc. */
export function formatLastSeen(lastSeenAt: string | null | undefined, isOnline: boolean): string {
  if (isOnline) return 'Online now';
  if (!lastSeenAt) return 'Never seen';

  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const sec  = Math.floor(diff / 1000);
  const min  = Math.floor(diff / 60_000);
  const hr   = Math.floor(diff / 3_600_000);
  const day  = Math.floor(diff / 86_400_000);
  const week = Math.floor(diff / 604_800_000);

  if (sec < 90)         return 'Just now';
  if (min < 60)         return `${min} min ago`;
  if (hr < 24)          return `${hr} hour${hr !== 1 ? 's' : ''} ago`;
  if (day < 7)          return `${day} day${day !== 1 ? 's' : ''} ago`;
  if (week < 5)         return `${week} week${week !== 1 ? 's' : ''} ago`;
  return 'Long time ago';
}

/** Returns colour class for the presence dot */
export function presenceColor(isOnline: boolean, lastSeenAt: string | null | undefined): string {
  if (isOnline) return 'bg-green-400';
  if (!lastSeenAt) return 'bg-muted-foreground/30';
  const hr = (Date.now() - new Date(lastSeenAt).getTime()) / 3_600_000;
  if (hr < 1)   return 'bg-yellow-400';   // was online < 1h ago
  if (hr < 24)  return 'bg-orange-400';   // today
  return 'bg-muted-foreground/40';         // long time ago
}

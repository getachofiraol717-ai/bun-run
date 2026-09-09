import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Tracks user study sessions in the background.
 * - Creates a session row on mount (or app focus)
 * - Updates duration every 60s
 * - Pauses when tab is hidden, resumes when visible
 */
export function useSessionTracker() {
  const { user } = useAuth();
  const sessionId = useRef<string | null>(null);
  const startedAt = useRef<number>(0);
  const accumulated = useRef<number>(0); // seconds accumulated before last pause

  useEffect(() => {
    if (!user) return;

    const createSession = async () => {
      const { data } = await (supabase as any).from('user_sessions').insert({
        user_id: user.id,
        started_at: new Date().toISOString(),
        duration_minutes: 0,
        pages_visited: [window.location.pathname],
      }).select('id').single();
      if (data) sessionId.current = data.id;
      startedAt.current = Date.now();
      accumulated.current = 0;
    };

    const updateSession = async () => {
      if (!sessionId.current) return;
      const totalSeconds = accumulated.current + Math.floor((Date.now() - startedAt.current) / 1000);
      const minutes = Math.round(totalSeconds / 60 * 10) / 10; // 1 decimal
      await (supabase as any).from('user_sessions')
        .update({ duration_minutes: minutes, ended_at: new Date().toISOString() })
        .eq('id', sessionId.current);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause: accumulate time
        accumulated.current += Math.floor((Date.now() - startedAt.current) / 1000);
        updateSession();
      } else {
        // Resume
        startedAt.current = Date.now();
      }
    };

    createSession();
    const interval = setInterval(updateSession, 60_000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      updateSession(); // final update on unmount
    };
  }, [user]);
}

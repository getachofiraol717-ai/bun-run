import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Bidirectionally syncs the user's language preference with their profile row.
 * - On login / profile load: applies saved language to the app
 * - On language change while logged in: writes to profiles.language
 */
const LanguageSync = () => {
  const { profile, user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const appliedFromProfile = useRef(false);
  const lastWritten = useRef<string | null>(null);

  // Profile → context (once per profile load)
  useEffect(() => {
    if (!profile) { appliedFromProfile.current = false; return; }
    const pl = (profile as any).language as Language | undefined;
    if (pl && pl !== language) {
      setLanguage(pl);
      lastWritten.current = pl;
    }
    appliedFromProfile.current = true;
  }, [profile?.id]);

  // Context → profile (only after we've applied profile, and only on real changes)
  useEffect(() => {
    if (!user || !appliedFromProfile.current) return;
    if (lastWritten.current === language) return;
    lastWritten.current = language;
    supabase.from('profiles').update({ language }).eq('user_id', user.id);
  }, [language, user]);

  return null;
};

export default LanguageSync;

-- ============================================================
-- MIGRATION: World Builder System
-- Educational world creation, management, and analytics
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. EDUCATIONAL WORLDS
--    Core worlds created by admins
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.educational_worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  published BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  
  -- World statistics
  planet_count INTEGER DEFAULT 0,
  mission_count INTEGER DEFAULT 0,
  learner_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_worlds_subject ON public.educational_worlds(subject);
CREATE INDEX IF NOT EXISTS idx_worlds_published ON public.educational_worlds(published);
CREATE INDEX IF NOT EXISTS idx_worlds_difficulty ON public.educational_worlds(difficulty);

ALTER TABLE public.educational_worlds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage worlds" ON public.educational_worlds
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 2. PLANETS
--    Learning destinations within worlds
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.planets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.educational_worlds(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('learning', 'challenge', 'boss', 'discovery', 'research')),
  
  -- Progression
  difficulty INTEGER DEFAULT 5,  -- 1-10 scale
  xp_reward INTEGER DEFAULT 100,
  unlock_requirements TEXT,
  
  -- Visual
  color TEXT DEFAULT '#8b5cf6',
  icon TEXT DEFAULT '🪐',
  
  -- Spatial positioning
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_planets_world ON public.planets(world_id);
CREATE INDEX IF NOT EXISTS idx_planets_type ON public.planets(type);

ALTER TABLE public.planets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage planets" ON public.planets
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  OR SELECT TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 3. MISSIONS
--    Educational quests on planets
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planet_id UUID NOT NULL REFERENCES public.planets(id) ON DELETE CASCADE,
  
  -- Mission details
  title TEXT NOT NULL,
  description TEXT,
  story TEXT,
  type TEXT CHECK (type IN ('exploration', 'investigation', 'rescue', 'puzzle', 'research', 'challenge')),
  
  -- Content
  objectives TEXT[] DEFAULT '{}',
  lessons TEXT[] DEFAULT '{}',
  quiz_ids UUID[] DEFAULT '{}',
  
  -- Rewards
  xp_reward INTEGER DEFAULT 250,
  companion_dialogue TEXT DEFAULT 'Good luck, learner!',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_missions_planet ON public.missions(planet_id);
CREATE INDEX IF NOT EXISTS idx_missions_type ON public.missions(type);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage missions" ON public.missions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  OR SELECT TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 4. CONSTELLATIONS
--    Learning paths through planets
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.constellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.educational_worlds(id) ON DELETE CASCADE,
  
  -- Constellation info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Graph structure
  planets UUID[] DEFAULT '{}',  -- planet IDs in order
  prerequisites UUID[] DEFAULT '{}',  -- planets that must be completed first
  
  -- Access control
  is_hidden BOOLEAN DEFAULT FALSE,
  unlock_condition TEXT DEFAULT 'none',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_constellations_world ON public.constellations(world_id);
CREATE INDEX IF NOT EXISTS idx_constellations_hidden ON public.constellations(is_hidden);

ALTER TABLE public.constellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage constellations" ON public.constellations
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  OR SELECT TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 5. WORLD LORE
--    Story, history, characters, civilizations
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.world_lore (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.educational_worlds(id) ON DELETE CASCADE,
  
  -- Lore classification
  type TEXT CHECK (type IN ('history', 'character', 'civilization', 'discovery', 'event')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- References
  references_planets UUID[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lore_world ON public.world_lore(world_id);
CREATE INDEX IF NOT EXISTS idx_lore_type ON public.world_lore(type);

ALTER TABLE public.world_lore ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lore" ON public.world_lore
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  OR SELECT TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 6. HIDDEN DISCOVERIES
--    Secret content unlocked by learners
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hidden_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.educational_worlds(id) ON DELETE CASCADE,
  
  -- Discovery info
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('lesson', 'planet', 'artifact', 'mission', 'research')),
  
  -- Unlock conditions
  unlock_xp INTEGER DEFAULT 1000,
  unlock_streak INTEGER DEFAULT 0,  -- days of consecutive play
  unlock_achievement TEXT,
  
  is_hidden BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discoveries_world ON public.hidden_discoveries(world_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_hidden ON public.hidden_discoveries(is_hidden);

ALTER TABLE public.hidden_discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage discoveries" ON public.hidden_discoveries
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  OR SELECT TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 7. WORLD PATHWAYS
--    Adaptive learning routes
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.world_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.educational_worlds(id) ON DELETE CASCADE,
  
  -- Pathway info
  name TEXT NOT NULL,
  description TEXT,
  difficulty_target TEXT,  -- beginner, explorer, scholar, researcher, master
  
  -- Planet sequence
  planets_in_order UUID[] NOT NULL,
  
  -- Recommendation logic
  recommended_for TEXT[],  -- performance levels, learning styles
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pathways_world ON public.world_pathways(world_id);

ALTER TABLE public.world_pathways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pathways" ON public.world_pathways
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  OR SELECT TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 8. REWARD TIERS
--    Achievement system
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reward_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.educational_worlds(id) ON DELETE CASCADE,
  
  -- Tier info
  name TEXT NOT NULL,
  description TEXT,
  level INTEGER,
  
  -- Requirements
  xp_required INTEGER,
  missions_required INTEGER,
  subjects_mastered INTEGER,
  
  -- Rewards
  badge_emoji TEXT,
  title_awarded TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tiers_world ON public.reward_tiers(world_id);

ALTER TABLE public.reward_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tiers" ON public.reward_tiers
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  OR SELECT TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 9. WORLD ANALYTICS
--    Track world engagement
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.world_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.educational_worlds(id) ON DELETE CASCADE,
  
  -- Engagement metrics
  total_learners INTEGER DEFAULT 0,
  active_learners_today INTEGER DEFAULT 0,
  avg_completion_rate REAL DEFAULT 0.0,
  avg_time_spent_minutes INTEGER DEFAULT 0,
  
  -- Planet analytics
  planet_visit_counts JSONB,  -- {planet_id: count}
  mission_completion_rates JSONB,  -- {mission_id: rate}
  
  -- Daily snapshot
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_world ON public.world_analytics(world_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.world_analytics(snapshot_date DESC);

ALTER TABLE public.world_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view analytics" ON public.world_analytics
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  OR SELECT TO authenticated WHERE snapshot_date = CURRENT_DATE;

-- ────────────────────────────────────────────────────────────
-- 10. TRIGGER: Update world statistics
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_world_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'planets' THEN
    UPDATE public.educational_worlds 
    SET planet_count = (SELECT COUNT(*) FROM public.planets WHERE world_id = NEW.world_id)
    WHERE id = NEW.world_id;
  ELSIF TG_TABLE_NAME = 'missions' THEN
    UPDATE public.educational_worlds 
    SET mission_count = (
      SELECT COUNT(*) FROM public.missions 
      WHERE planet_id IN (SELECT id FROM public.planets WHERE world_id = NEW.world_id)
    )
    WHERE id = (SELECT world_id FROM public.planets WHERE id = NEW.planet_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_world_stats_planets ON public.planets;
CREATE TRIGGER trg_update_world_stats_planets
  AFTER INSERT OR DELETE ON public.planets
  FOR EACH ROW EXECUTE FUNCTION update_world_stats();

DROP TRIGGER IF EXISTS trg_update_world_stats_missions ON public.missions;
CREATE TRIGGER trg_update_world_stats_missions
  AFTER INSERT OR DELETE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION update_world_stats();

-- ────────────────────────────────────────────────────────────
-- 11. HELPER FUNCTIONS
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_world_summary(world_id UUID)
RETURNS TABLE (
  name TEXT,
  subject TEXT,
  published BOOLEAN,
  planet_count INTEGER,
  mission_count INTEGER,
  learner_count INTEGER,
  total_xp_available INTEGER
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    w.name,
    w.subject,
    w.published,
    w.planet_count,
    w.mission_count,
    w.learner_count,
    COALESCE((SELECT SUM(p.xp_reward) FROM public.planets p WHERE p.world_id = w.id), 0)::INTEGER
  FROM public.educational_worlds w
  WHERE w.id = get_world_summary.world_id;
$$;

GRANT EXECUTE ON FUNCTION get_world_summary(UUID) TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 12. SAMPLE DATA (Optional - for testing)
-- ────────────────────────────────────────────────────────────

-- Commented out - uncomment to seed test data
-- INSERT INTO public.educational_worlds (name, description, subject, difficulty, published) VALUES
-- ('Physics Universe', 'Master the laws of motion and energy', 'Physics', 'intermediate', FALSE),
-- ('Biology Realm', 'Explore the secrets of life', 'Biology', 'beginner', FALSE),
-- ('Math Galaxy', 'Conquer equations and shapes', 'Mathematics', 'advanced', FALSE);

COMMENT ON TABLE public.educational_worlds IS 'Educational worlds created by admins - main container for planets, missions, and lore';
COMMENT ON TABLE public.planets IS 'Learning destinations within educational worlds';
COMMENT ON TABLE public.missions IS 'Educational quests and challenges on planets';
COMMENT ON TABLE public.constellations IS 'Learning pathways and skill trees connecting planets';
COMMENT ON TABLE public.world_lore IS 'Story, history, characters, and world-building content';
COMMENT ON TABLE public.hidden_discoveries IS 'Secret content unlocked by learner progression';
COMMENT ON TABLE public.world_pathways IS 'Adaptive learning routes based on learner profile';
COMMENT ON TABLE public.reward_tiers IS 'Achievement and progression system for worlds';
COMMENT ON TABLE public.world_analytics IS 'Engagement and performance metrics for worlds';

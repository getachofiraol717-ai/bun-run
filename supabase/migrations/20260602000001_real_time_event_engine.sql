-- ============================================================
-- MIGRATION: Real-Time Event Engine
-- Complete database schema for galaxy-wide educational events
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. GAME EVENTS
--    Core event storage
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('galaxy_wide', 'world_specific', 'guild_event', 'classroom_event', 'community_quest', 'seasonal', 'competition')),
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived')),
  
  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  scheduled_duration_minutes INTEGER,
  
  -- Story & narrative
  story_narrative TEXT,
  event_objectives TEXT[] DEFAULT '{}',
  has_story_arc BOOLEAN DEFAULT FALSE,
  ai_characters TEXT[] DEFAULT '{}',
  lore_updates TEXT[] DEFAULT '{}',
  
  -- Rewards
  xp_multiplier REAL DEFAULT 1.0,
  bonus_xp_amount INTEGER,
  rare_badges TEXT[] DEFAULT '{}',
  companion_cosmetics TEXT[] DEFAULT '{}',
  world_unlocks TEXT[] DEFAULT '{}',
  seasonal_collectibles TEXT[] DEFAULT '{}',
  
  -- Scoping
  target_scope TEXT[] DEFAULT '{}',
  world_ids UUID[] DEFAULT '{}',
  guild_ids UUID[] DEFAULT '{}',
  classroom_ids UUID[] DEFAULT '{}',
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,  -- 'weekly', 'monthly', 'yearly', 'holiday'
  
  -- Analytics (cached)
  participants_count INTEGER DEFAULT 0,
  completion_rate REAL DEFAULT 0,
  retention_impact REAL DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  engagement_score REAL DEFAULT 0,
  
  -- Media
  featured_image_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_events_status ON public.game_events(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_dates ON public.game_events(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.game_events(status) WHERE status = 'active';

ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage events" ON public.game_events
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view active/scheduled events" ON public.game_events
  FOR SELECT TO authenticated USING (status IN ('active', 'scheduled', 'completed'));

-- ────────────────────────────────────────────────────────────
-- 2. LIVE EVENT UPDATES
--    Real-time event metrics
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.live_event_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.game_events(id) ON DELETE CASCADE,
  
  -- Live metrics
  current_participants INTEGER DEFAULT 0,
  completion_percentage REAL DEFAULT 0,
  estimated_participants_at_end INTEGER DEFAULT 0,
  trending_status TEXT DEFAULT 'normal',  -- 'hot', 'normal', 'slow'
  
  -- Alerts
  alert TEXT,
  
  -- Snapshot
  snapshot_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_updates_event ON public.live_event_updates(event_id);
CREATE INDEX IF NOT EXISTS idx_live_updates_timestamp ON public.live_event_updates(snapshot_timestamp DESC);

ALTER TABLE public.live_event_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view live updates" ON public.live_event_updates
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view active event updates" ON public.live_event_updates
  FOR SELECT TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 3. EVENT REWARDS
--    Specific rewards for events
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.event_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.game_events(id) ON DELETE CASCADE,
  
  -- Reward info
  title TEXT NOT NULL,
  description TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')),
  reward_type TEXT CHECK (reward_type IN ('xp', 'badge', 'cosmetic', 'world_unlock', 'title', 'artifact')),
  
  -- Value
  reward_value TEXT,
  quantity INTEGER DEFAULT 1,
  
  -- Requirements
  participation_threshold REAL,  -- percentage required to earn
  completion_required BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rewards_event ON public.event_rewards(event_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON public.event_rewards(reward_type);

ALTER TABLE public.event_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage rewards" ON public.event_rewards
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 4. EVENT PARTICIPATION
--    Track who participates in events
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.game_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Participation data
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Performance
  objectives_completed INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  score REAL DEFAULT 0,
  rank INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_participants_event ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_active ON public.event_participants(is_active);

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view participants" ON public.event_participants
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own participation" ON public.event_participants
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 5. COMMUNITY QUESTS
--    Server-wide collaborative goals
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.game_events(id) ON DELETE CASCADE,
  
  -- Quest info
  title TEXT NOT NULL,
  description TEXT,
  narrative TEXT,
  
  -- Goals
  goal_type TEXT,  -- 'questions_completed', 'planets_explored', 'xp_earned', etc
  goal_target BIGINT,
  current_progress BIGINT DEFAULT 0,
  
  -- Rewards
  milestone_rewards JSONB,  -- {25: reward, 50: reward, 75: reward, 100: reward}
  final_reward TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  completion_percentage REAL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_quests_event ON public.community_quests(event_id);
CREATE INDEX IF NOT EXISTS idx_community_quests_active ON public.community_quests(is_active);

ALTER TABLE public.community_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage quests" ON public.community_quests
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view active quests" ON public.community_quests
  FOR SELECT TO authenticated USING (is_active = TRUE);

-- ────────────────────────────────────────────────────────────
-- 6. LIVE MISSIONS
--    Time-limited missions
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.live_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.game_events(id) ON DELETE CASCADE,
  
  -- Mission info
  title TEXT NOT NULL,
  description TEXT,
  story_narrative TEXT,
  
  -- Type
  mission_type TEXT CHECK (mission_type IN ('save_system', 'decode_archive', 'stabilize_reactor', 'explore_constellation')),
  
  -- Time-limited
  available_from TIMESTAMPTZ NOT NULL,
  available_until TIMESTAMPTZ NOT NULL,
  
  -- Objectives
  objectives TEXT[] DEFAULT '{}',
  requirements JSONB,
  
  -- Rewards
  xp_reward INTEGER,
  unique_rewards TEXT[],
  
  -- AI
  ai_narration TEXT,
  ai_character_name TEXT,
  
  -- Collaborative
  is_collaborative BOOLEAN DEFAULT FALSE,
  min_participants INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_missions_event ON public.live_missions(event_id);
CREATE INDEX IF NOT EXISTS idx_missions_active ON public.live_missions(available_from, available_until);

ALTER TABLE public.live_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage missions" ON public.live_missions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view active missions" ON public.live_missions
  FOR SELECT TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 7. COMPETITIONS
--    AI-powered competitions
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.event_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.game_events(id) ON DELETE CASCADE,
  
  -- Competition info
  title TEXT NOT NULL,
  description TEXT,
  
  -- Type
  competition_type TEXT CHECK (competition_type IN ('research', 'debate', 'coding', 'science', 'knowledge')),
  
  -- Rules
  scoring_criteria JSONB,
  judging_rules JSONB,
  
  -- Leaderboard
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  
  -- Rewards
  first_place_reward TEXT,
  second_place_reward TEXT,
  third_place_reward TEXT,
  
  -- Status
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitions_event ON public.event_competitions(event_id);
CREATE INDEX IF NOT EXISTS idx_competitions_type ON public.event_competitions(competition_type);

ALTER TABLE public.event_competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage competitions" ON public.event_competitions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 8. SEASONAL CONSTELLATIONS
--    Limited-time constellation systems
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.seasonal_constellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.game_events(id) ON DELETE CASCADE,
  
  -- Season info
  season_name TEXT NOT NULL,
  theme TEXT,
  
  -- Exclusive content
  exclusive_planets UUID[] DEFAULT '{}',
  rare_missions UUID[] DEFAULT '{}',
  hidden_lore TEXT[] DEFAULT '{}',
  
  -- Unlocks
  companion_cosmetics TEXT[] DEFAULT '{}',
  achievement_badges TEXT[] DEFAULT '{}',
  
  -- Timeline
  season_start TIMESTAMPTZ,
  season_end TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_constellations_event ON public.seasonal_constellations(event_id);

ALTER TABLE public.seasonal_constellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage seasons" ON public.seasonal_constellations
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 9. EVENT ANALYTICS
--    Comprehensive event tracking
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.event_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.game_events(id) ON DELETE CASCADE,
  
  -- Engagement
  total_participants INTEGER DEFAULT 0,
  completion_rate REAL DEFAULT 0,
  engagement_score REAL DEFAULT 0,
  
  -- Performance
  avg_xp_earned REAL DEFAULT 0,
  total_xp_earned BIGINT DEFAULT 0,
  
  -- Retention
  player_retention_rate REAL DEFAULT 0,
  repeat_participation_rate REAL DEFAULT 0,
  
  -- Satisfaction
  avg_satisfaction_rating REAL,
  feedback_count INTEGER DEFAULT 0,
  
  -- Guild activity
  guilds_participated INTEGER DEFAULT 0,
  avg_guild_size REAL DEFAULT 0,
  
  -- Classroom activity
  classrooms_participated INTEGER DEFAULT 0,
  avg_class_engagement REAL DEFAULT 0,
  
  -- AI interactions
  ai_interaction_volume INTEGER DEFAULT 0,
  
  -- Snapshot date
  snapshot_date DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event ON public.event_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.event_analytics(snapshot_date DESC);

ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view analytics" ON public.event_analytics
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 10. HELPER FUNCTIONS
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_active_events()
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  participants INTEGER,
  ends_in_minutes INTEGER
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    ge.id,
    ge.name,
    ge.event_type,
    ge.participants_count,
    EXTRACT(EPOCH FROM (ge.ends_at - now())) / 60
  FROM public.game_events ge
  WHERE ge.status = 'active'
  ORDER BY ge.ends_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_active_events() TO authenticated;

CREATE OR REPLACE FUNCTION update_event_statistics(event_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.game_events
  SET 
    participants_count = (SELECT COUNT(*) FROM public.event_participants WHERE event_id = $1),
    completion_rate = (SELECT AVG(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) FROM public.event_participants WHERE event_id = $1),
    total_xp_earned = (SELECT COALESCE(SUM(xp_earned), 0) FROM public.event_participants WHERE event_id = $1)
  WHERE id = $1;
END;
$$;

GRANT EXECUTE ON FUNCTION update_event_statistics(UUID) TO authenticated;

-- ────────────────────────────────────────────────────────────
-- COMMENTS
-- ────────────────────────────────────────────────────────────

COMMENT ON TABLE public.game_events IS 'Core event storage for galaxy-wide educational events';
COMMENT ON TABLE public.live_event_updates IS 'Real-time event metrics and status updates';
COMMENT ON TABLE public.event_rewards IS 'Event-specific reward definitions';
COMMENT ON TABLE public.event_participants IS 'Participation tracking for users in events';
COMMENT ON TABLE public.community_quests IS 'Server-wide collaborative goals';
COMMENT ON TABLE public.live_missions IS 'Time-limited missions within events';
COMMENT ON TABLE public.event_competitions IS 'AI-powered competitions';
COMMENT ON TABLE public.seasonal_constellations IS 'Limited-time constellation systems';
COMMENT ON TABLE public.event_analytics IS 'Comprehensive event analytics';

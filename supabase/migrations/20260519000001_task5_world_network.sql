-- ============================================================
-- MIGRATION: Task 5 — World + Network Systems
-- Guilds, Study Rooms, Quiz Battles, Missions, Worlds
-- ============================================================

-- ── GUILDS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '⭐',
  color TEXT DEFAULT '#8b5cf6',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count INTEGER DEFAULT 0,
  total_xp BIGINT DEFAULT 0,
  weekly_xp INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader','officer','member')),
  xp_contributed BIGINT DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.guild_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON public.guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_user  ON public.guild_members(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_messages_guild ON public.guild_messages(guild_id, created_at DESC);

ALTER TABLE public.guilds         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views public guilds"   ON public.guilds FOR SELECT USING (is_public OR created_by = auth.uid());
CREATE POLICY "Auth users create guilds"      ON public.guilds FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Leaders update guilds"         ON public.guilds FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Anyone views guild members"    ON public.guild_members FOR SELECT USING (true);
CREATE POLICY "Auth users join guilds"        ON public.guild_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members leave guilds"          ON public.guild_members FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Guild members view messages"   ON public.guild_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.guild_members gm WHERE gm.guild_id = guild_id AND gm.user_id = auth.uid()));
CREATE POLICY "Guild members send messages"   ON public.guild_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.guild_members gm WHERE gm.guild_id = guild_id AND gm.user_id = auth.uid()));

-- ── STUDY ROOMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL,
  participant_count INTEGER DEFAULT 1,
  max_participants INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  mode TEXT DEFAULT 'open' CHECK (mode IN ('open','guild','private')),
  guild_id UUID REFERENCES public.guilds(id) ON DELETE SET NULL,
  current_topic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.study_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat','ai','system','quiz')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_rooms_active ON public.study_rooms(is_active, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_room_msgs ON public.study_room_messages(room_id, created_at DESC);

ALTER TABLE public.study_rooms              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_participants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_messages      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active rooms"        ON public.study_rooms FOR SELECT USING (is_active);
CREATE POLICY "Auth users create rooms"           ON public.study_rooms FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "Hosts update rooms"                ON public.study_rooms FOR UPDATE TO authenticated USING (host_id = auth.uid());
CREATE POLICY "Anyone views participants"         ON public.study_room_participants FOR SELECT USING (true);
CREATE POLICY "Auth users join rooms"             ON public.study_room_participants FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Participants leave rooms"          ON public.study_room_participants FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Participants view messages"        ON public.study_room_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.study_room_participants p WHERE p.room_id = room_id AND p.user_id = auth.uid() AND p.is_active));
CREATE POLICY "Participants send messages"        ON public.study_room_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ── QUIZ BATTLES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  grade INTEGER DEFAULT 9,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','active','finished')),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL,
  host_score INTEGER DEFAULT 0,
  challenger_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  challenger_name TEXT,
  challenger_score INTEGER DEFAULT 0,
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  questions JSONB DEFAULT '[]',
  current_question INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_battles_status ON public.quiz_battles(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_battles_host ON public.quiz_battles(host_id);

ALTER TABLE public.quiz_battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views battles" ON public.quiz_battles FOR SELECT USING (true);
CREATE POLICY "Auth users create battles" ON public.quiz_battles FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "Participants update battles" ON public.quiz_battles FOR UPDATE TO authenticated USING (host_id = auth.uid() OR challenger_id = auth.uid());

-- ── LEARNING WORLDS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '🌍',
  color TEXT DEFAULT '#8b5cf6',
  zones JSONB DEFAULT '[]',         -- array of zone objects
  is_active BOOLEAN DEFAULT true,
  unlock_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_world_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  world_id UUID NOT NULL REFERENCES public.learning_worlds(id) ON DELETE CASCADE,
  zones_completed INTEGER DEFAULT 0,
  missions_completed INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  last_zone_id TEXT,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, world_id)
);

-- ── MISSIONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID REFERENCES public.learning_worlds(id) ON DELETE CASCADE,
  zone_id TEXT,
  title TEXT NOT NULL,
  narrative TEXT NOT NULL,
  subject TEXT NOT NULL,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  xp_reward INTEGER DEFAULT 100,
  quiz_questions JSONB DEFAULT '[]',
  unlock_requires UUID,             -- another mission id
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked','available','in_progress','completed')),
  score INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, mission_id)
);

ALTER TABLE public.learning_worlds    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_world_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views worlds"          ON public.learning_worlds FOR SELECT USING (is_active);
CREATE POLICY "Users view own world progress" ON public.user_world_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own progress"    ON public.user_world_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anyone views active missions" ON public.missions FOR SELECT USING (is_active);
CREATE POLICY "Users manage own missions"    ON public.user_missions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── GALAXY PATHWAYS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  emoji TEXT DEFAULT '🛸',
  color TEXT DEFAULT '#8b5cf6',
  target_audience TEXT,           -- 'beginner'|'fast_learner'|'exam_survival'|'research'|'mastery'
  subject_sequence JSONB DEFAULT '[]',  -- ordered list of subjects
  estimated_weeks INTEGER DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.learning_pathways (name, description, emoji, color, target_audience, subject_sequence, estimated_weeks) VALUES
  ('Beginner Launch', 'Start from zero and build strong fundamentals', '🚀', '#10b981', 'beginner', '["Arithmetic","Algebra","English","Biology","Geography"]', 8),
  ('Fast Learner Track', 'Accelerated path for motivated students', '⚡', '#f59e0b', 'fast_learner', '["Mathematics","Physics","Chemistry","Computer Science","AI"]', 4),
  ('Exam Survival Route', 'Focused preparation for national exams', '🎯', '#ef4444', 'exam_survival', '["Mathematics","Physics","Chemistry","Biology","English"]', 3),
  ('Research Path', 'Deep academic exploration and critical thinking', '🔭', '#3b82f6', 'research', '["Philosophy","History","Geography","Economics","Literature"]', 12),
  ('Mastery Route', 'Complete domain mastery from foundations to expert', '👑', '#8b5cf6', 'mastery', '["Arithmetic","Algebra","Calculus","Physics","Quantum Mechanics","AI"]', 16)
ON CONFLICT DO NOTHING;

ALTER TABLE public.learning_pathways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views pathways" ON public.learning_pathways FOR SELECT USING (is_active);

-- ── CLASSROOM MODE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  grade INTEGER DEFAULT 9,
  join_code TEXT NOT NULL UNIQUE DEFAULT upper(substring(md5(random()::text) from 1 for 6)),
  is_active BOOLEAN DEFAULT true,
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classroom_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.classroom_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  mission_id UUID REFERENCES public.missions(id),
  quiz_subject TEXT,
  max_xp INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classrooms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_students     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_assignments  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage classrooms"       ON public.classrooms FOR ALL TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Students view joined classrooms"  ON public.classrooms FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.classroom_students cs WHERE cs.classroom_id = id AND cs.user_id = auth.uid()));
CREATE POLICY "Students join classrooms"         ON public.classroom_students FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Teachers view students"           ON public.classroom_students FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.classrooms c WHERE c.id = classroom_id AND c.teacher_id = auth.uid()));
CREATE POLICY "Students view own enrolments"     ON public.classroom_students FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Teachers manage assignments"      ON public.classroom_assignments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.classrooms c WHERE c.id = classroom_id AND c.teacher_id = auth.uid()));
CREATE POLICY "Students view assignments"        ON public.classroom_assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.classroom_students cs WHERE cs.classroom_id = classroom_id AND cs.user_id = auth.uid()));

-- ── SEED: default learning worlds ────────────────────────────
INSERT INTO public.learning_worlds (subject, name, theme, description, emoji, color, zones, unlock_xp) VALUES
  ('Biology', 'Biosphere Nexus', 'organic', 'A living world of cells, organisms, and ecosystems', '🧬', '#10b981',
   '[{"id":"z1","name":"DNA Temple","description":"Explore the double helix structure of life","icon":"🏛️","missions":3},{"id":"z2","name":"Immune Fortress","description":"Defend against invaders in the immune system citadel","icon":"🏰","missions":4},{"id":"z3","name":"Protein Ocean","description":"Navigate the seas of molecular machinery","icon":"🌊","missions":3},{"id":"z4","name":"Mutation Caverns","description":"Discover the secrets of genetic variation","icon":"🕳️","missions":2}]', 0),
  ('Mathematics', 'Equation Realm', 'geometric', 'A world built from the language of the universe', '∑', '#6366f1',
   '[{"id":"z1","name":"Arithmetic Plains","description":"Master the foundations of numbers","icon":"🔢","missions":4},{"id":"z2","name":"Algebra Citadel","description":"Solve for the unknown in towering equations","icon":"🏗️","missions":5},{"id":"z3","name":"Calculus Rift","description":"Traverse the infinite slopes of change","icon":"📉","missions":4},{"id":"z4","name":"Theorem Gates","description":"Prove your worth at the gates of mathematical truth","icon":"🚪","missions":3}]', 0),
  ('Physics', 'Quantum Nexus', 'energy', 'Where matter, energy, and spacetime collide', '⚛️', '#3b82f6',
   '[{"id":"z1","name":"Mechanics Hub","description":"Master the laws of motion and forces","icon":"⚙️","missions":4},{"id":"z2","name":"Photon Fields","description":"Ride waves of light through the electromagnetic spectrum","icon":"💡","missions":3},{"id":"z3","name":"Gravity Core","description":"Explore the curvature of spacetime itself","icon":"🌀","missions":4},{"id":"z4","name":"Quantum Nebula","description":"Enter the probabilistic realm of quantum mechanics","icon":"🌌","missions":3}]', 200),
  ('Chemistry', 'Molecular Forge', 'elemental', 'Transmute knowledge into mastery at the atomic level', '⚗️', '#f97316',
   '[{"id":"z1","name":"Periodic Plains","description":"Survey the elements that make up all matter","icon":"📋","missions":3},{"id":"z2","name":"Bond Bridges","description":"Connect atoms across the chemical bond archipelago","icon":"🌉","missions":4},{"id":"z3","name":"Reaction Crucible","description":"Control the fiery art of chemical reactions","icon":"🔥","missions":5},{"id":"z4","name":"Organic Labyrinth","description":"Navigate the complexity of carbon chemistry","icon":"🧪","missions":4}]', 100),
  ('Computer Science', 'Digital Cosmos', 'cyber', 'An infinite universe of logic, code, and intelligence', '💻', '#f59e0b',
   '[{"id":"z1","name":"Algorithm Nexus","description":"Master the art of problem-solving through algorithms","icon":"🧩","missions":4},{"id":"z2","name":"Data Structure Maze","description":"Navigate arrays, trees, and graphs","icon":"🌲","missions":4},{"id":"z3","name":"AI Singularity","description":"Reach the frontier of machine intelligence","icon":"🤖","missions":5},{"id":"z4","name":"Network Void","description":"Explore the invisible architecture of the internet","icon":"🕸️","missions":3}]', 300)
ON CONFLICT (subject) DO NOTHING;

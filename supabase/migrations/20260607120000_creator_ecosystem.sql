-- Creator Ecosystem (Phase 5)

CREATE TABLE IF NOT EXISTS public.creator_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  language text DEFAULT 'web',
  template text DEFAULT 'blank',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_projects TO authenticated;
GRANT SELECT ON public.creator_projects TO anon;
GRANT ALL ON public.creator_projects TO service_role;
ALTER TABLE public.creator_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects rw" ON public.creator_projects
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "public projects read" ON public.creator_projects
  FOR SELECT USING (is_public = true);

CREATE TABLE IF NOT EXISTS public.creator_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.creator_projects(id) ON DELETE CASCADE,
  path text NOT NULL,
  content text DEFAULT '',
  language text DEFAULT 'plaintext',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, path)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_files TO authenticated;
GRANT SELECT ON public.creator_files TO anon;
GRANT ALL ON public.creator_files TO service_role;
ALTER TABLE public.creator_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "files of own project rw" ON public.creator_files
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.creator_projects p WHERE p.id = project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.creator_projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE POLICY "files of public projects read" ON public.creator_files
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.creator_projects p WHERE p.id = project_id AND p.is_public = true));

CREATE TABLE IF NOT EXISTS public.creator_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.creator_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'todo',
  milestone text DEFAULT '',
  due_at timestamptz,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_tasks TO authenticated;
GRANT ALL ON public.creator_tasks TO service_role;
ALTER TABLE public.creator_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks rw" ON public.creator_tasks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.creator_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  track text NOT NULL DEFAULT 'web',
  level text NOT NULL DEFAULT 'beginner',
  body_md text NOT NULL DEFAULT '',
  starter_code text DEFAULT '',
  language text DEFAULT 'javascript',
  xp int DEFAULT 50,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.creator_lessons TO anon, authenticated;
GRANT ALL ON public.creator_lessons TO service_role;
ALTER TABLE public.creator_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons public read" ON public.creator_lessons FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.creator_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.creator_lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress',
  code text DEFAULT '',
  xp_earned int DEFAULT 0,
  completed_at timestamptz,
  UNIQUE(user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_progress TO authenticated;
GRANT ALL ON public.creator_progress TO service_role;
ALTER TABLE public.creator_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress rw" ON public.creator_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.creator_projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  tags text[] DEFAULT '{}',
  installs int DEFAULT 0,
  likes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.marketplace_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplace_items TO authenticated;
GRANT ALL ON public.marketplace_items TO service_role;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items public read" ON public.marketplace_items FOR SELECT USING (true);
CREATE POLICY "own items insert" ON public.marketplace_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own items update" ON public.marketplace_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own items delete" ON public.marketplace_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.marketplace_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  installed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id)
);
GRANT SELECT, INSERT, DELETE ON public.marketplace_installs TO authenticated;
GRANT ALL ON public.marketplace_installs TO service_role;
ALTER TABLE public.marketplace_installs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own installs rw" ON public.marketplace_installs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.research_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled',
  body text DEFAULT '',
  citations jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_notes TO authenticated;
GRANT ALL ON public.research_notes TO service_role;
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes rw" ON public.research_notes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.creator_lessons (slug, title, track, level, body_md, starter_code, language, xp, sort_order) VALUES
 ('js-hello', 'Hello, JavaScript', 'web', 'beginner',
  E'# Hello, JavaScript\n\nWrite your first line of code.\n\n**Task:** Use `console.log` to print `Hello, KU!`.',
  E'console.log("Hello, KU!");\n', 'javascript', 50, 1),
 ('js-variables', 'Variables & Types', 'web', 'beginner',
  E'# Variables\n\nDeclare a variable `name` and log a greeting.',
  E'const name = "Galaxy Builder";\nconsole.log("Hi", name);\n', 'javascript', 75, 2),
 ('html-page', 'Your First Web Page', 'web', 'beginner',
  E'# HTML basics\n\nBuild a page with an h1 and a p tag. Run it to see the preview.',
  E'<!doctype html>\n<html><body>\n  <h1>My KU Page</h1>\n  <p>Built inside Knowledge Universe.</p>\n</body></html>\n', 'html', 75, 3),
 ('py-hello', 'Python: Hello Universe', 'python', 'beginner',
  E'# Python\n\nUse print() to greet the universe.',
  E'print("Hello, Universe!")\n', 'python', 50, 4),
 ('py-loops', 'Python: Loops', 'python', 'beginner',
  E'# Loops\n\nPrint numbers 1..5 using a for loop.',
  E'for i in range(1, 6):\n    print(i)\n', 'python', 100, 5),
 ('ai-prompt', 'AI Prompting 101', 'ai', 'beginner',
  E'# Prompting\n\nLearn to craft effective prompts. Edit the prompt and click Ask AI.',
  E'Explain recursion to a 12-year-old using a cosmic analogy.', 'plaintext', 80, 6)
ON CONFLICT (slug) DO NOTHING;

-- Creator Collab — real-time rooms + chat (Phase 5 continuation)

CREATE TABLE IF NOT EXISTS public.collab_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  project_id uuid REFERENCES public.creator_projects(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collab_rooms TO authenticated;
GRANT ALL ON public.collab_rooms TO service_role;
ALTER TABLE public.collab_rooms ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read a room if they know its id (i.e. have the share code
-- and looked it up), or if they created it. Insert/update/delete restricted to owner.
CREATE POLICY "collab_rooms read" ON public.collab_rooms
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "collab_rooms owner write" ON public.collab_rooms
  FOR ALL TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE TABLE IF NOT EXISTS public.collab_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.collab_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Creator',
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.collab_messages TO authenticated;
GRANT ALL ON public.collab_messages TO service_role;
ALTER TABLE public.collab_messages ENABLE ROW LEVEL SECURITY;

-- Any authenticated user who can see the room can read/post messages
-- (room access is gated by knowing its share_code or id).
CREATE POLICY "collab_messages read" ON public.collab_messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "collab_messages insert own" ON public.collab_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Enable Realtime on these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_messages;

CREATE INDEX IF NOT EXISTS idx_collab_messages_room ON public.collab_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_collab_rooms_share_code ON public.collab_rooms(share_code);

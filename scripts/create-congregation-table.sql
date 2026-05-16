-- ═══════════════════════════════════════════════════════════════════════════
-- KBV2 – Add `congregation` table for cross-device profile sync
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.congregation (
  id          TEXT PRIMARY KEY DEFAULT 'default',
  name        TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL DEFAULT '',
  day         TEXT NOT NULL DEFAULT 'Dimanche',
  time        TEXT NOT NULL DEFAULT '11:30',
  responsable_name   TEXT NOT NULL DEFAULT '',
  responsable_phone  TEXT NOT NULL DEFAULT '',
  responsable_photo  TEXT,
  kingdom_hall_address TEXT NOT NULL DEFAULT '',
  whatsapp_group      TEXT NOT NULL DEFAULT '',
  whatsapp_invite_id  TEXT NOT NULL DEFAULT '',
  google_sheet_url    TEXT DEFAULT '',
  last_sync_at        TEXT DEFAULT '',
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row-Level Security (important for multi-user safety)
ALTER TABLE public.congregation ENABLE ROW LEVEL SECURITY;

-- 3. Allow all authenticated users to read/write the congregation row
CREATE POLICY "authenticated_full_access"
  ON public.congregation
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Allow anonymous (public) users to read the congregation row
CREATE POLICY "anon_read"
  ON public.congregation
  FOR SELECT
  TO anon
  USING (true);

-- 5. Insert a default row (only if not already present)
INSERT INTO public.congregation (id, name, city, day, time)
VALUES ('default', '', '', 'Dimanche', '11:30')
ON CONFLICT (id) DO NOTHING;
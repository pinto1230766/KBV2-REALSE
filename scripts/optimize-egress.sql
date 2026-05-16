-- ════════════════════════════════════════════════════════════════════════════
-- KBV2 – Optimisation egress Supabase : triggers updated_at + tombstones
-- ════════════════════════════════════════════════════════════════════════════
-- Exécuter DANS L'ORDRE dans le SQL Editor Supabase
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Fonction trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Triggers sur chaque table (garantit que updated_at est toujours à jour)
DO $$ BEGIN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON visits
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON speakers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON hosts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Table tombstones pour les suppressions cross-appareils
CREATE TABLE IF NOT EXISTS public.tombstones (
  id          TEXT PRIMARY KEY,
  table_name  TEXT NOT NULL,
  deleted_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tombstones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON public.tombstones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_read" ON public.tombstones
  FOR SELECT TO anon USING (true);

-- 4. Index pour les requêtes incrémentales (PERFORMANCE CRITIQUE)
CREATE INDEX IF NOT EXISTS idx_visits_updated_at ON visits(updated_at);
CREATE INDEX IF NOT EXISTS idx_speakers_updated_at ON speakers(updated_at);
CREATE INDEX IF NOT EXISTS idx_hosts_updated_at ON hosts(updated_at);
CREATE INDEX IF NOT EXISTS idx_tombstones_deleted_at ON tombstones(deleted_at);
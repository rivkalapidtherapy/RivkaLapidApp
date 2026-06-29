-- =============================================
-- FIX RLS POLICIES - Run this in Supabase SQL Editor
-- =============================================
-- This script enables Row Level Security on all tables
-- and adds policies allowing the anon role full access.
-- (Suitable for apps that don't use Supabase Auth)

-- ---- SERVICES ----
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public full access to services" ON services;
CREATE POLICY "Allow public full access to services"
ON services FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ---- APPOINTMENTS ----
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public full access to appointments" ON appointments;
CREATE POLICY "Allow public full access to appointments"
ON appointments FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ---- GALLERY ----
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public full access to gallery" ON gallery;
CREATE POLICY "Allow public full access to gallery"
ON gallery FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ---- WORKING HOURS ----
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public full access to working_hours" ON working_hours;
CREATE POLICY "Allow public full access to working_hours"
ON working_hours FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ---- MESSAGE TEMPLATES ----
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public full access to message_templates" ON message_templates;
CREATE POLICY "Allow public full access to message_templates"
ON message_templates FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ---- JOURNEY NOTES ----
ALTER TABLE journey_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public full access to journey_notes" ON journey_notes;
CREATE POLICY "Allow public full access to journey_notes"
ON journey_notes FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ---- CONTENT HUB ----
ALTER TABLE content_hub ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to content_hub" ON content_hub;
DROP POLICY IF EXISTS "Allow authenticated modifications to content_hub" ON content_hub;
DROP POLICY IF EXISTS "Allow public full access to content_hub" ON content_hub;
CREATE POLICY "Allow public full access to content_hub"
ON content_hub FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ---- NUMEROLOGY INSIGHTS (if exists) ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'numerology_insights') THEN
    ALTER TABLE numerology_insights ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "Allow public full access to numerology_insights" ON numerology_insights';
    EXECUTE 'CREATE POLICY "Allow public full access to numerology_insights" ON numerology_insights FOR ALL TO public USING (true) WITH CHECK (true)';
  END IF;
END $$;


-- ---- SITE CONTENT ----
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public full access to site_content" ON site_content;
CREATE POLICY "Allow public full access to site_content"
ON site_content FOR ALL
TO public
USING (true)
WITH CHECK (true);


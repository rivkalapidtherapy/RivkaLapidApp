-- =========================================================================
-- SUPABASE UPGRADE MIGRATION - RUN THIS IN YOUR SUPABASE SQL EDITOR
-- =========================================================================

-- 1. Create is_admin() Helper Function
-- Replace the emails inside the array with Rivka's email and your developer email.
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' IN (
      'rivka.lapid.therapy@gmail.com', 
      'admin@example.com', 
      'yishay.shavlev@gmail.com' -- Replace/Add additional administrator emails here
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add Calendar columns to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- 3. Add Security / Authentication columns to journey_notes
ALTER TABLE journey_notes ADD COLUMN IF NOT EXISTS client_email TEXT;

-- 4. Google Credentials Table (For Rivka's Google Calendar Tokens)
CREATE TABLE IF NOT EXISTS google_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Google Credentials
ALTER TABLE google_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admins full access to google_credentials" ON google_credentials;
CREATE POLICY "Allow admins full access to google_credentials"
ON google_credentials FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());


-- 5. Numerology Profiles Table (Feature 1)
CREATE TABLE IF NOT EXISTS numerology_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_email TEXT UNIQUE NOT NULL,
  birth_date TEXT NOT NULL,
  destiny_number INTEGER,
  day_number INTEGER,
  personal_year INTEGER,
  reading_content TEXT, -- Markdown description of the reading
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Numerology Profiles
ALTER TABLE numerology_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow clients to read their own numerology profile" ON numerology_profiles;
CREATE POLICY "Allow clients to read their own numerology profile"
ON numerology_profiles FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = client_email OR is_admin());

DROP POLICY IF EXISTS "Allow admins full access to numerology profiles" ON numerology_profiles;
CREATE POLICY "Allow admins full access to numerology profiles"
ON numerology_profiles FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());


-- 6. Client Reflections / Journal Table (Feature 2)
CREATE TABLE IF NOT EXISTS client_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_email TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  share_with_therapist BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Client Reflections
ALTER TABLE client_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow clients to manage their own reflections" ON client_reflections;
CREATE POLICY "Allow clients to manage their own reflections"
ON client_reflections FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = client_email)
WITH CHECK (auth.jwt() ->> 'email' = client_email);

DROP POLICY IF EXISTS "Allow admins to read shared reflections" ON client_reflections;
CREATE POLICY "Allow admins to read shared reflections"
ON client_reflections FOR SELECT
TO authenticated
USING (is_admin() AND share_with_therapist = TRUE);


-- 7. Client Tasks / Homework Table (Feature 4)
CREATE TABLE IF NOT EXISTS client_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Client Tasks
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow clients to view/update their own tasks" ON client_tasks;
CREATE POLICY "Allow clients to view/update their own tasks"
ON client_tasks FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = client_email)
WITH CHECK (auth.jwt() ->> 'email' = client_email);

DROP POLICY IF EXISTS "Allow admins full access to client tasks" ON client_tasks;
CREATE POLICY "Allow admins full access to client tasks"
ON client_tasks FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());


-- 8. Client Saved Content / Favorites Table (Feature 5 - Saved Content)
CREATE TABLE IF NOT EXISTS client_saved_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_email TEXT NOT NULL,
  content_id UUID REFERENCES content_hub(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_email, content_id)
);

-- Enable RLS for Saved Content
ALTER TABLE client_saved_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow clients to manage their own saved content" ON client_saved_content;
CREATE POLICY "Allow clients to manage their own saved content"
ON client_saved_content FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = client_email)
WITH CHECK (auth.jwt() ->> 'email' = client_email);


-- 9. Client Recommended Content Table (Feature 5 - Recommended Content)
CREATE TABLE IF NOT EXISTS client_recommended_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_email TEXT NOT NULL,
  content_id UUID REFERENCES content_hub(id) ON DELETE CASCADE,
  recommendation_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_email, content_id)
);

-- Enable RLS for Recommended Content
ALTER TABLE client_recommended_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow clients to view their own recommended content" ON client_recommended_content;
CREATE POLICY "Allow clients to view their own recommended content"
ON client_recommended_content FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = client_email OR is_admin());

DROP POLICY IF EXISTS "Allow admins full access to recommended content" ON client_recommended_content;
CREATE POLICY "Allow admins full access to recommended content"
ON client_recommended_content FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());


-- 10. Adjust existing Appointments RLS policies for client portal
DROP POLICY IF EXISTS "Allow public full access to appointments" ON appointments;

-- Clients can select their own appointments
CREATE POLICY "Allow clients to view their own appointments"
ON appointments FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = client_email OR is_admin());

-- Clients can update status (e.g. reschedule or cancel)
CREATE POLICY "Allow clients to update their own appointments"
ON appointments FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = client_email)
WITH CHECK (auth.jwt() ->> 'email' = client_email);

-- Allow public bookings (Booking flow inserts new appointments)
CREATE POLICY "Allow public inserts to appointments"
ON appointments FOR INSERT
TO public
WITH CHECK (true);

-- Allow admins full control over appointments
CREATE POLICY "Allow admins full access to appointments"
ON appointments FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());


-- 11. Adjust existing Journey Notes RLS policies
DROP POLICY IF EXISTS "Allow public full access to journey_notes" ON journey_notes;

CREATE POLICY "Allow clients to view their own journey notes"
ON journey_notes FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = client_email OR is_admin());

CREATE POLICY "Allow admins full access to journey notes"
ON journey_notes FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());


-- 12. Site Content Table (For Homepage Customization)
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access to site_content" ON site_content;
CREATE POLICY "Allow public full access to site_content"
ON site_content FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Update working hours default slots to include half hours
INSERT INTO working_hours (day_of_week, hours) VALUES
(0, '["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"]'),
(1, '["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"]'),
(2, '["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"]'),
(3, '["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"]'),
(4, '["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"]'),
(5, '[]'),
(6, '[]')
ON CONFLICT (day_of_week) DO UPDATE SET hours = EXCLUDED.hours;


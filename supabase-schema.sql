-- Run this in the Supabase SQL Editor to create your database tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables safely (only if they don't exist) to preserve existing data

-- 1. Services Table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  duration TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT
);

-- Ensure image_url column exists if the table was created previously without it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='services' AND column_name='image_url') THEN
        ALTER TABLE services ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- 2. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  spiritual_insight TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL
);

-- 4. Working Hours Table
CREATE TABLE IF NOT EXISTS working_hours (
  day_of_week INTEGER PRIMARY KEY,
  hours JSONB NOT NULL
);

-- 5. Message Templates Table
CREATE TABLE IF NOT EXISTS message_templates (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default working hours
INSERT INTO working_hours (day_of_week, hours) VALUES
(0, '["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]'),
(1, '["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]'),
(2, '["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]'),
(3, '["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]'),
(4, '["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]'),
(5, '[]'),
(6, '[]')
ON CONFLICT (day_of_week) DO NOTHING;

-- Insert default message templates
INSERT INTO message_templates (key, value) VALUES
('confirmation', 'שלום {clientName} היקרה 💕
איזה כיף! נקבע לנו מפגש של {serviceName}.

🗓️ מתי? {date}
⏰ באיזו שעה? {time}

מסר קטן עבורך לקראת המפגש:
"{spiritualInsight}"

מחכה לראותך ולצאת לדרך משותפת! ✨
רבקה לפיד.'),
('cancellation', 'שלום {clientName},
רציתי לעדכן שהמפגש שלנו ל-{serviceName} בתאריך {date} בשעה {time} בוטל לצערי.

במידה ותרצי, ניתן ליצור קשר או לתאם מועד חדש דרך האתר.
יום מלא באור ושקט 🌿
רבקה.'),
('reminder', 'היי {clientName} האהובה 🌸
מזכירה לך באהבה שמחר ({date}) בשעה {time} אנחנו נפגשות. 

מחכה לראות אותך!
רבקה לפיד 🤍'),
('pending', 'שלום {clientName},
קיבלתי את בקשתך באהבה למפגש {serviceName} בתאריך {date} בשעה {time}. 

התור כרגע ממתין לאישור סופי ביומן שלי, ואעדכן אותך ממש בקרוב! ✨
רבקה.')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- STORAGE SETUP (For Images)
-- ==========================================

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up Security Policies for the 'gallery' bucket
-- Drop existing policies first to make this script safely re-runnable
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;

-- Allow public read access to all images
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery');

-- Allow anyone to upload images (since we don't have auth yet, this is open for now)
CREATE POLICY "Public Upload Access"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'gallery');

-- Allow anyone to update their images
CREATE POLICY "Public Update Access"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'gallery');

-- Allow anyone to delete their images
CREATE POLICY "Public Delete Access"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'gallery');

-- Run this in the Supabase SQL Editor to create your database tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Services Table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  duration TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL
);

-- 2. Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  spiritual_insight TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Gallery Table
CREATE TABLE gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL
);

-- 4. Working Hours Table
CREATE TABLE working_hours (
  day_of_week INTEGER PRIMARY KEY,
  hours JSONB NOT NULL
);

-- 5. Message Templates Table
CREATE TABLE message_templates (
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
(6, '[]');

-- Insert default message templates
INSERT INTO message_templates (key, value) VALUES
('confirmation', 'שלום {clientName}, איזה כיף! 🌿 נקבע לנו מפגש של {serviceName} בקליניקה של רבקה לפיד. תאריך: {date} שעה: {time}. כוונה רוחנית עבורך: "{spiritualInsight}". מחכה לראותך! ✨'),
('cancellation', 'שלום {clientName}, המפגש שלנו ל-{serviceName} בתאריך {date} בשעה {time} בוטל. ניתן ליצור קשר לתיאום מועד חדש. יום שקט, רבקה.'),
('reminder', 'היי {clientName}, מזכירה לך באהבה על המפגש שלנו מחר ({date}) בשעה {time}. מחכה לראות אותך! 🌿'),
('pending', 'שלום {clientName}, קיבלתי את בקשתך למפגש {serviceName} בתאריך {date} בשעה {time}. התור ממתין לאישור סופי שלי, אעדכן אותך בהקדם! ✨');

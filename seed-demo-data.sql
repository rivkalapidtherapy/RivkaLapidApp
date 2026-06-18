-- =============================================
-- SEED DEMO DATA - Run this in Supabase SQL Editor
-- =============================================
-- This script inserts realistic Hebrew demo data
-- Run this AFTER running fix-rls-policies.sql

-- 1. Seed a default service if empty
INSERT INTO services (type, duration, price, description, category, image_url)
SELECT 'מפגש נומרולוגי רגשי', '60', 350,
       'מפגש אבחון וטיפול רגשי המשלב קריאת מפה נומרולוגית ועבודה תת-מודע.',
       'general',
       'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=800'
WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);

INSERT INTO services (type, duration, price, description, category, image_url)
SELECT 'סדנת זוגיות ותקשורת', '90', 450,
       'סדנה מעשית לזוגות המבקשים לחזק את הקשר הרגשי ולשפר את דרכי התקשורת ביניהם.',
       'workshop',
       'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE type = 'סדנת זוגיות ותקשורת');

INSERT INTO services (type, duration, price, description, category, image_url)
SELECT 'טיפול בטראומה ושחרור רגשי', '75', 400,
       'מפגש מעמיק לטיפול בטראומה רגשית באמצעות כלים תת-הכרתיים ושילוב טכניקות גוף-נפש.',
       'trauma',
       'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE type = 'טיפול בטראומה ושחרור רגשי');

-- 2. Seed Content Hub
INSERT INTO content_hub (title, type, description, summary, publication_date)
SELECT 'איך למצוא את הייעוד שלך דרך נומרולוגיה', 'article',
       'במדריך זה נלמד כיצד מספר יום הלידה שלך משפיע על הבחירות המקצועיות והאישיות שלך, ואיך לקרוא את מפת החיים שלך בצורה מדויקת ומחברת.',
       '5 דקות קריאה • מאמר', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM content_hub LIMIT 1);

INSERT INTO content_hub (title, type, media_url, embed_code, description, summary, publication_date)
SELECT 'פודקאסט: להתחבר מחדש לילדה הפנימית', 'podcast',
       'https://open.spotify.com/episode/7fK282r529wQdKx5Q24a35',
       '<iframe src="https://open.spotify.com/embed/episode/7fK282r529wQdKx5Q24a35" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>',
       'שיחה עמוקה ומרגשת על השילוב שבין טיפול רגשי לעבודה עם תת-המודע לשחרור דפוסים וחסמים ישנים שמנהלים אותנו.',
       'פרק 5 • פודקאסט', CURRENT_DATE - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM content_hub WHERE type = 'podcast');

INSERT INTO content_hub (title, type, description, summary, publication_date)
SELECT 'מערכת יחסים בריאה מול תלות רגשית', 'post',
       'פוסט הסבר מעמיק המפרט את ההבדלים הדקים שבין אהבה בריאה ומעצימה לבין תלות רגשית המעכבת את ההתפתחות האישית והזוגית שלך.',
       '3 דקות קריאה • פוסט', CURRENT_DATE - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM content_hub WHERE type = 'post');

INSERT INTO content_hub (title, type, media_url, embed_code, description, summary, publication_date)
SELECT 'מדיטציה מונחית לשחרור לחצים ואיזון צ׳אקרות', 'video',
       'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
       '<iframe width="100%" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
       'תרגול יומי קצר של 10 דקות להרגעה, חיבור לגוף ומציאת שקט פנימי בתוך שגרת היומיום העמוסה.',
       '10 דקות תרגול • וידאו', CURRENT_DATE - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM content_hub WHERE type = 'video');

-- 3. Seed Appointments (using the first available service)
DO $$
DECLARE
  svc_id UUID;
BEGIN
  SELECT id INTO svc_id FROM services LIMIT 1;
  IF svc_id IS NULL THEN
    RAISE NOTICE 'No services found, skipping appointment seeding';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM appointments LIMIT 1) THEN
    INSERT INTO appointments (service_id, client_name, client_email, client_phone, date, time, status, spiritual_insight, session_notes)
    VALUES
      (svc_id, 'מיכל ישראלי', 'michal@example.com', '0541234567',
       TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), '10:00', 'confirmed',
       'הלב שלך מוכן לשלב הבא של הריפוי וההתפתחות.',
       'היה מפגש מעולה. דיברנו על שחרור חסמים ודפוסים שחוזרים על עצמם במשפחה.'),

      (svc_id, 'דנה לוי', 'dana@example.com', '0529876543',
       TO_CHAR(CURRENT_DATE + INTERVAL '1 day', 'YYYY-MM-DD'), '12:00', 'pending',
       'התשובות שאת מחפשת נמצאות בתוכך. המספרים שלך מעידים על כוח רב.',
       ''),

      (svc_id, 'רונית כהן', 'ronit@example.com', '0501112223',
       TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD'), '16:00', 'paid',
       'השינוי מתחיל בצעד קטן של אמונה בעצמך.',
       'שילמה בביט והופקה קבלה אוטומטית. דיברנו על החיבור לעולם הנומרולוגיה והמספרים במפה שלה.'),

      (svc_id, 'שירה אלון', 'shira@example.com', '0535556667',
       TO_CHAR(CURRENT_DATE + INTERVAL '7 days', 'YYYY-MM-DD'), '09:00', 'confirmed',
       'השנה האישית שלך מייצגת התחלה של מחזור אנרגטי חדש ומעצים.',
       '');
  END IF;
END $$;

-- 4. Seed Journey Notes
INSERT INTO journey_notes (client_phone, client_name, content)
SELECT '0541234567', 'מיכל ישראלי',
       'מטופלת מדווחת על שיפור משמעותי בתחושת הביטחון העצמי מאז המפגש הראשון. עובדים על שחרור חסמים רגשיים.'
WHERE NOT EXISTS (SELECT 1 FROM journey_notes LIMIT 1);

INSERT INTO journey_notes (client_phone, client_name, content)
SELECT '0501112223', 'רונית כהן',
       'התחלנו תהליך של נומרולוגיה רגשית. המטרה היא להבין את השנה האישית ולמנף את ההחלטות העסקיות שלה.'
WHERE NOT EXISTS (SELECT 1 FROM journey_notes WHERE client_phone = '0501112223');

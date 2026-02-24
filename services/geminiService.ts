
import { GoogleGenAI } from "@google/genai";
import { ServiceType, Appointment, Service } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const getSpiritualInsight = async (serviceType: ServiceType, clientName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `צור אישור תור קצר ולעניין עבור ${clientName} לשירות ${serviceType}. משפט אחד בעברית שמשדר מקצועיות נעימה עם נגיעה קלה של משמעות ויחס אישי (למשל: נרשם בהצלחה, מתרגשת לפגוש אותך וכו'). עד 10 מילים.`,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    return response.text?.trim().split('\n')[0] || "המסע שלך לריפוי מתחיל בצעד אחד קטן. בטחי בתהליך.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "הדרך לריפוי היא מסע מקודש של גילוי עצמי.";
  }
};

export const getDailyGreeting = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `צור משפט אחד קצר, אלגנטי ומינימליסטי שישמש ככותרת משנה לאתר של רבקה לפיד, מטפלת רגשית ונומרולוגית. 
      החזר אך ורק את המשפט עצמו בעברית. אל תציע אפשרויות, אל תכתוב הקדמות, אל תשתמש במרכאות ואל תוסיף הסברים.`,
      config: {
        temperature: 0.5,
      }
    });

    // Clean up the response to ensure we only get a clean string
    let text = response.text?.trim() || "ברוכה הבאה למרחב של בהירות וצמיחה רגשית.";

    // In case the AI still provides options despite instructions, take the first line that doesn't look like a header
    const lines = text.split('\n').filter(l => l.trim().length > 0 && !l.includes(':'));
    return lines[0] || text;
  } catch (error) {
    return "מחברים בין הנשמה לייעוד.";
  }
};

export const getWeeklyJournal = async (appointments: Appointment[], services: Service[]): Promise<string> => {
  const fallbackJournal = "השבוע האחרון התאפיין בחיפוש משמעותי אחר 'קרקוע'. המטופלות העלו נושאים הקשורים בביטחון עצמי ובאיזון בית-עבודה. מבחינה נומרולוגית, אנחנו נכנסים לחודש של '5' - תנועה ושינוי.";

  try {
    // Filter appointments from the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentAppointments = appointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate >= oneWeekAgo && appDate <= new Date() && app.status === 'confirmed';
    });

    if (recentAppointments.length === 0) {
      return "שבוע של שקט והתבוננות פנימית. זמן מצוין להיערכות אנרגטית לקראת התקופה הקרובה.";
    }

    const appDetails = recentAppointments.map(app => {
      const service = services.find(s => s.id === app.serviceId);
      return `- מטופלת: ${app.clientName}, סוג טיפול: ${service?.type || 'כללי'}`;
    }).join('\n');

    const prompt = `אתה עוזר וירטואלי של מטפלת רגשית ונומרולוגית בשם רבקה לפיד. 
כתוב סיכום "יומן קליניקה" (עד 3-4 משפטים בעברית) המנתח את האנרגיה והדינמיקה הכללית של הקליניקה בשבוע החולף על סמך התורים שהיו.
שלב נימה רוחנית/רגשית עדינה. השתמש בנתונים הבאים כהשראה:
${appDetails}

החזר רק את התוכן של הסיכום בצורה של פסקה קצרה שרבקה יכולה להסתכל עליה כדי לקבל תובנות על "המאפיין של השבוע". ללא כותרות וללא תווים מיותרים.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.6,
      }
    });

    return response.text?.trim() || fallbackJournal;
  } catch (error) {
    console.error("Gemini Journal Error:", error);
    return fallbackJournal;
  }
};

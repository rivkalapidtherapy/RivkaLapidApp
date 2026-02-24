
import { GoogleGenAI } from "@google/genai";
import { ServiceType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSpiritualInsight = async (serviceType: ServiceType, clientName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `צור "כוונה רוחנית" אחת, קצרה מאוד, מרגיעה ומקרקעת עבור ${clientName} שקבעה כרגע מפגש מסוג ${serviceType} אצל רבקה לפיד. 
      החזר אך ורק משפט אחד או שניים בעברית. ללא הקדמות, ללא מרכאות וללא מספרים.`,
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

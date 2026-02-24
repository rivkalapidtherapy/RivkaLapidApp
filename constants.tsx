
import { Service, ServiceType } from './types';

export const COLORS = {
  cream: '#f5f2ed', // Warm organic background
  ink: '#2d2a26',   // Deep stone text
  sage: '#7d7463',  // Earthy muted olive (matching the document's green-brown tone)
  tan: '#b5a48b',   // Warm tan accent
  white: '#ffffff'
};

export const SERVICES: Service[] = [
  {
    id: '1',
    type: ServiceType.DIAGNOSIS,
    duration: 60,
    price: 538,
    description: 'פגישת עומק למיפוי: דפוסים מעכבים, חסמים רגשיים חוזרים, חוזקות נשמתיות, ייעוד ושפע. הכוונה מדויקת לפי המטרה.',
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1515516089376-88db1e26e9c0?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '2',
    type: ServiceType.FOCUSED,
    duration: 60,
    price: 1738,
    description: 'תהליך ממוקד הכולל אבחון נומרולוגי מעמיק + 3 פגישות ליווי רגשיות לשינוי פנימי.',
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '3',
    type: ServiceType.DEEP,
    duration: 60,
    price: 2438,
    description: 'תהליך עומק לשינוי משמעותי: אבחון נומרולוגי + 5 פגישות ליווי רגשיות לעבודה פנימית מדויקת.',
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '4',
    type: ServiceType.PREMIUM,
    duration: 60,
    price: 3438,
    description: 'המסלול המקיף ביותר: אבחון נומרולוגי + 8 פגישות ליווי + ליווי אישי בין המפגשים למקסימום תוצאות.',
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=1000'
  }
];

export const WORK_HOURS = [
  '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'
];

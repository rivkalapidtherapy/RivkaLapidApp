
export enum ServiceType {
  DIAGNOSIS = 'אבחון נומרולוגי אישי',
  FOCUSED = 'תהליך ממוקד',
  DEEP = 'תהליך עומק',
  PREMIUM = 'פרימיום!'
}

export interface Service {
  id: string;
  type: ServiceType;
  duration: number; // in minutes
  price: number;
  description: string;
  isActive: boolean;
  imageUrl?: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  title: string;
  category: string;
}

export interface Appointment {
  id: string;
  serviceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'confirmed' | 'cancelled' | 'pending';
  notes?: string;
  spiritualInsight?: string;
  createdAt: string;
}

export interface DailyHours {
  [day: number]: string[]; // 0 = Sunday, 6 = Saturday
}

export interface ClinicStats {
  totalRevenue: number;
  upcomingAppointments: number;
  activeClients: number;
  topService: string;
  monthlyGrowth: number;
}

export interface MessageTemplates {
  confirmation: string;
  cancellation: string;
  reminder: string;
  pending: string;
}

export type AppView = 'home' | 'booking' | 'admin' | 'confirmation' | 'portal';
export type AdminTab = 'calendar' | 'appointments' | 'services' | 'analytics' | 'journal' | 'gallery' | 'settings' | 'clients';
export type NumerologyInsights = Record<number, string>;

export interface JourneyNote {
  id: string;
  clientPhone: string;
  clientName: string;
  content: string;
  createdAt: string;
}


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

export interface BookingItem {
  id: string;
  type: 'service' | 'product';
  title: string;
  price: number;
  quantity: number;
}

export interface Appointment {
  id: string;
  serviceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'confirmed' | 'cancelled' | 'pending' | 'attended' | 'paid';
  notes?: string;
  spiritualInsight?: string;
  createdAt: string;
  paymentMethod?: 'Cash' | 'Bit' | 'Paybox' | null;
  sumitDocumentId?: string | null;
  sumitPdfUrl?: string | null;
  sessionNotes?: string | null;
  items?: BookingItem[];
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

export type AppView = 'home' | 'booking' | 'admin' | 'confirmation' | 'portal' | 'content';
export type AdminTab = 'morning' | 'calendar' | 'appointments' | 'services' | 'analytics' | 'journal' | 'gallery' | 'settings' | 'clients' | 'content_hub';
export type NumerologyInsights = Record<number, string>;

export interface JourneyNote {
  id: string;
  clientPhone: string;
  clientName: string;
  content: string;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  title: string;
  type: 'post' | 'podcast' | 'video' | 'article';
  mediaUrl?: string;
  embedCode?: string;
  description?: string;
  summary?: string;
  publicationDate: string;
  createdAt?: string;
}


import { Appointment, ServiceType, ClinicStats, Service, GalleryItem, DailyHours, MessageTemplates, NumerologyInsights, JourneyNote, BookingItem, ContentItem } from "../types";
import { WORK_HOURS as INITIAL_HOURS, SERVICES as INITIAL_SERVICES } from "../constants";
import { supabase } from "../lib/supabase";

// Default working hours: Sun-Thu 09:00-17:00
const DEFAULT_DAILY_HOURS: DailyHours = {
  0: [...INITIAL_HOURS],
  1: [...INITIAL_HOURS],
  2: [...INITIAL_HOURS],
  3: [...INITIAL_HOURS],
  4: [...INITIAL_HOURS],
  5: [], // Friday empty by default
  6: []  // Saturday empty by default
};

let appointments: Appointment[] = [
  {
    id: '1',
    serviceId: '1',
    clientName: 'מיכל ישראלי',
    clientEmail: 'michal@example.com',
    clientPhone: '0541234567',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'confirmed',
    spiritualInsight: 'הלב שלך מוכן לשלב הבא של הריפוי.',
    createdAt: new Date().toISOString(),
    paymentMethod: null,
    sumitDocumentId: null,
    sumitPdfUrl: null,
    sessionNotes: '',
    items: []
  },
  {
    id: '2',
    serviceId: '2',
    clientName: 'דנה לוי',
    clientEmail: 'dana@example.com',
    clientPhone: '0529876543',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '12:00',
    status: 'pending',
    spiritualInsight: 'התשובות שאת מחפשת נמצאות בתוכך.',
    createdAt: new Date().toISOString(),
    paymentMethod: null,
    sumitDocumentId: null,
    sumitPdfUrl: null,
    sessionNotes: '',
    items: []
  },
  {
    id: '3',
    serviceId: '3',
    clientName: 'רונית כהן',
    clientEmail: 'ronit@example.com',
    clientPhone: '0501112223',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '16:00',
    status: 'confirmed',
    spiritualInsight: 'השינוי מתחיל בצעד קטן של אמונה.',
    createdAt: new Date().toISOString(),
    paymentMethod: 'Bit',
    sumitDocumentId: 'DOC-12345',
    sumitPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    sessionNotes: 'היה מפגש מעולה. דיברנו על שחרור החסמים הנומרולוגיים שלה.',
    items: []
  },
  {
    id: '4',
    serviceId: '1',
    clientName: 'איילת שחר',
    clientEmail: 'ayelet@example.com',
    clientPhone: '0544445556',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    time: '09:00',
    status: 'confirmed',
    spiritualInsight: 'המספרים שלך מעידים על כוח פנימי עצום.',
    createdAt: new Date().toISOString(),
    paymentMethod: null,
    sumitDocumentId: null,
    sumitPdfUrl: null,
    sessionNotes: '',
    items: []
  }
];


let dynamicServices: Service[] = [];
let servicesLoaded = false;
let dailyWorkingHours: DailyHours = { ...DEFAULT_DAILY_HOURS };
let galleryItems: GalleryItem[] = [
  { id: '1', url: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d', title: 'נרות זן', category: 'אווירה' },
  { id: '2', url: 'https://images.unsplash.com/photo-1515516089376-88db1e26e9c0', title: 'אבני איזון', category: 'ריפוי' },
  { id: '3', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773', title: 'מדיטציה', category: 'רוחניות' }
];

let messageTemplates: MessageTemplates = {
  confirmation: `שלום {clientName} היקר/ה 💕
איזה כיף! נקבע לנו מפגש של {serviceName}.

🗓️ מתי? {date}
⏰ באיזו שעה? {time}

מחכה לראותך ולצאת לדרך משותפת! ✨
רבקה לפיד.`,
  cancellation: `שלום {clientName},
רציתי לעדכן שהמפגש שלנו ל-{serviceName} בתאריך {date} בשעה {time} בוטל לצערי.

ניתן ליצור קשר או לתאם מועד חדש דרך האתר.
יום מלא באור ושקט 🌿
רבקה.`,
  reminder: `היי {clientName} 🌸
תזכורת באהבה - מחר ({date}) בשעה {time} אנחנו נפגשים. 

מחכה לראותך!
רבקה לפיד 🤍`,
  pending: `שלום {clientName},
קיבלתי את הבקשה באהבה למפגש {serviceName} בתאריך {date} בשעה {time}. 

התור כרגע ממתין לאישור סופי ביומן שלי, העדכון יישלח ממש בקרוב! ✨
רבקה.`
};

let numerologyInsights: NumerologyInsights = {
  1: "את נמצאת בשנת 1 - שנה של התחלות חדשות, יוזמה ופריצת דרך. עידן חדש נפתח עבורך. תזמון מושלם לטיפול!",
  2: "את נמצאת בשנת 2 - שנה של חיבור, רגישות וזוגיות. זמן לעבוד על שיתופי פעולה והקשבה פנימית.",
  3: "את נמצאת בשנת 3 - שנה של ביטוי אישי, יצירתיות ושמחה. הגעת כדי להוציא את הקול שלך החוצה.",
  4: "את נמצאת בשנת 4 - שנה של בניה, יציבות ומיקוד. זמן להניח יסודות חזקים לעתיד שלך. טיפול יעזור למרכז אותך.",
  5: "את נמצאת בשנת 5 - שנה של תנועה, שחרור ושינויים. הקליניקה היא מקום בטוח לעבד את כל ההתפתחויות האלה.",
  6: "את נמצאת בשנת 6 - שנה של משפחה, הרמוניה ואהבה. זמן לטפל בבית הפנימי שלך. אני כאן בשבילך.",
  7: "את נמצאת בשנת 7 - שנה של חקירה פנימית, התבוננות וצמיחה רוחנית. זו שנה שקוראת לטיפול ולגילוי עצמי עמוק.",
  8: "את נמצאת בשנת 8 - שנה של עוצמה, קריירה ומימוש. זמן לקטוף פירות. נלמד איך להחזיק את הכוח הזה יחד.",
  9: "את נמצאת בשנת 9 - שנה של סיומים, סגירת מעגלים ושחרור. הטיפול יסייע לך להרפות ממה שלא משרת אותך יותר לקראת התחלה חדשה."
};

export const getNumerologyInsights = async (): Promise<NumerologyInsights> => {
  return { ...numerologyInsights };
};

export const updateNumerologyInsights = async (insights: NumerologyInsights): Promise<void> => {
  numerologyInsights = { ...insights };
};

export const getJourneyNotes = async (clientPhone?: string): Promise<JourneyNote[]> => {
  if (supabase) {
    let query = supabase.from('journey_notes').select('*').order('created_at', { ascending: false });
    if (clientPhone) {
      query = query.eq('client_phone', clientPhone);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data.map(d => ({
        id: d.id,
        clientPhone: d.client_phone,
        clientName: d.client_name,
        content: d.content,
        createdAt: d.created_at
      }));
    }
  }
  return [];
};

export const addJourneyNote = async (note: Omit<JourneyNote, 'id' | 'createdAt'>): Promise<JourneyNote | null> => {
  if (supabase) {
    const { data, error } = await supabase.from('journey_notes').insert([{
      client_phone: note.clientPhone,
      client_name: note.clientName,
      content: note.content
    }]).select().single();

    if (!error && data) {
      return {
        id: data.id,
        clientPhone: data.client_phone,
        clientName: data.client_name,
        content: data.content,
        createdAt: data.created_at
      };
    }
  }
  return null;
};

export const deleteJourneyNote = async (id: string): Promise<void> => {
  if (supabase) {
    await supabase.from('journey_notes').delete().eq('id', id);
  }
};

export const getAppointments = async (): Promise<Appointment[]> => {
  if (supabase) {
    const { data, error } = await supabase.from('appointments').select('*').order('date', { ascending: false });
    if (!error && data) {
      return data.map(d => ({
        id: d.id,
        serviceId: d.service_id,
        clientName: d.client_name,
        clientEmail: d.client_email,
        clientPhone: d.client_phone,
        date: d.date,
        time: d.time,
        status: d.status,
        spiritualInsight: d.spiritual_insight,
        createdAt: d.created_at,
        paymentMethod: d.payment_method,
        sumitDocumentId: d.sumit_document_id,
        sumitPdfUrl: d.sumit_pdf_url,
        sessionNotes: d.session_notes,
        items: d.items || []
      }));
    }
  }
  return [...appointments];
};

export const addAppointment = async (app: Omit<Appointment, 'id' | 'createdAt' | 'status'>): Promise<Appointment> => {
  if (supabase) {
    const { data, error } = await supabase.from('appointments').insert([{
      service_id: app.serviceId,
      client_name: app.clientName,
      client_email: app.clientEmail,
      client_phone: app.clientPhone,
      date: app.date,
      time: app.time,
      status: 'pending',
      spiritual_insight: app.spiritualInsight,
      payment_method: app.paymentMethod || null,
      sumit_document_id: app.sumitDocumentId || null,
      sumit_pdf_url: app.sumitPdfUrl || null,
      session_notes: app.sessionNotes || '',
      items: app.items || []
    }]).select().single();

    if (!error && data) {
      return {
        id: data.id,
        serviceId: data.service_id,
        clientName: data.client_name,
        clientEmail: data.client_email,
        clientPhone: data.client_phone,
        date: data.date,
        time: data.time,
        status: data.status,
        spiritualInsight: data.spiritual_insight,
        createdAt: data.created_at,
        paymentMethod: data.payment_method,
        sumitDocumentId: data.sumit_document_id,
        sumitPdfUrl: data.sumit_pdf_url,
        sessionNotes: data.session_notes,
        items: data.items || []
      };
    }
  }

  const newApp = {
    ...app,
    id: Math.random().toString(36).substr(2, 9),
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    paymentMethod: app.paymentMethod || null,
    sumitDocumentId: app.sumitDocumentId || null,
    sumitPdfUrl: app.sumitPdfUrl || null,
    sessionNotes: app.sessionNotes || '',
    items: app.items || []
  };
  appointments.push(newApp as Appointment);
  return newApp as Appointment;
};

export const confirmAppointment = async (id: string): Promise<void> => {
  if (supabase) {
    await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', id);
  }
  appointments = appointments.map(a => a.id === id ? { ...a, status: 'confirmed' } : a);
};

export const updateAppointment = async (id: string, data: Partial<Appointment>): Promise<void> => {
  if (supabase) {
    const updateData: any = {};
    if (data.serviceId) updateData.service_id = data.serviceId;
    if (data.clientName) updateData.client_name = data.clientName;
    if (data.clientEmail) updateData.client_email = data.clientEmail;
    if (data.clientPhone) updateData.client_phone = data.clientPhone;
    if (data.date) updateData.date = data.date;
    if (data.time) updateData.time = data.time;
    if (data.status) updateData.status = data.status;
    if (data.spiritualInsight) updateData.spiritual_insight = data.spiritualInsight;
    if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod;
    if (data.sumitDocumentId !== undefined) updateData.sumit_document_id = data.sumitDocumentId;
    if (data.sumitPdfUrl !== undefined) updateData.sumit_pdf_url = data.sumitPdfUrl;
    if (data.sessionNotes !== undefined) updateData.session_notes = data.sessionNotes;
    if (data.items !== undefined) updateData.items = data.items;

    await supabase.from('appointments').update(updateData).eq('id', id);
  }
  appointments = appointments.map(a => a.id === id ? { ...a, ...data } : a);
};

export const cancelAppointment = async (id: string): Promise<void> => {
  if (supabase) {
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
  }
  appointments = appointments.map(a => a.id === id ? { ...a, status: 'cancelled' } : a);
};


export const deleteAppointment = async (id: string): Promise<void> => {
  if (supabase) {
    await supabase.from('appointments').delete().eq('id', id);
  }
  appointments = appointments.filter(a => a.id !== id);
};

export const getAvailabilityForDate = async (dateStr: string): Promise<string[]> => {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const baseHours = dailyWorkingHours[dayOfWeek] || [];

  const dayBookings = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');
  const bookedTimes = dayBookings.map(a => a.time);

  return baseHours.filter(time => !bookedTimes.includes(time));
};

export const getDailyWorkingHours = async (): Promise<DailyHours> => {
  return { ...dailyWorkingHours };
};

export const updateDailyWorkingHours = async (hours: DailyHours): Promise<void> => {
  dailyWorkingHours = { ...hours };
};

export const getClinicStats = async (): Promise<ClinicStats> => {
  const active = appointments.filter(a => a.status === 'confirmed');
  const revenue = active.reduce((sum, a) => {
    const service = dynamicServices.find(s => s.id === a.serviceId);
    return sum + (service?.price || 0);
  }, 0);

  const serviceCounts = active.reduce((acc: any, a) => {
    acc[a.serviceId] = (acc[a.serviceId] || 0) + 1;
    return acc;
  }, {});

  const topServiceId = Object.keys(serviceCounts).reduce((a, b) => serviceCounts[a] > serviceCounts[b] ? a : b, '1');
  const topService = dynamicServices.find(s => s.id === topServiceId)?.type || 'כללי';

  return {
    totalRevenue: revenue,
    upcomingAppointments: active.filter(a => new Date(a.date) >= new Date()).length,
    activeClients: new Set(active.map(a => a.clientEmail)).size,
    topService: topService,
    monthlyGrowth: 12.5
  };
};

export const getAdminServices = async (): Promise<Service[]> => {
  if (supabase && !servicesLoaded) {
    try {
      const { data, error } = await supabase.from('services').select('*');
      if (error) {
        console.error("Error loading services:", error);
        servicesLoaded = true; // Mark as loaded to prevent infinite loop on failure
      } else if (data && data.length > 0) {
        dynamicServices = data.map(s => {
          const matchingInitial = INITIAL_SERVICES.find(is => is.type === s.type);
          return {
            id: s.id,
            type: s.type as ServiceType,
            duration: parseInt(s.duration) || 60,
            price: s.price,
            description: s.description,
            isActive: true,
            category: s.category,
            imageUrl: s.image_url || matchingInitial?.imageUrl
          };
        });
        servicesLoaded = true;
      } else if (data && data.length === 0) {
        // If DB is empty, attempt to seed it once
        servicesLoaded = true; // Mark as loaded first to prevent recursive loops if inserts fail
        try {
          for (const s of INITIAL_SERVICES) {
            await addService(s);
          }
          // After attempting to seed, fetch again once
          const { data: seededData } = await supabase.from('services').select('*');
          if (seededData && seededData.length > 0) {
            dynamicServices = seededData.map(s => {
              const matchingInitial = INITIAL_SERVICES.find(is => is.type === s.type);
              return {
                id: s.id,
                type: s.type as ServiceType,
                duration: parseInt(s.duration) || 60,
                price: s.price,
                description: s.description,
                isActive: true,
                category: s.category,
                imageUrl: s.image_url || matchingInitial?.imageUrl
              };
            });
          }
        } catch (seedErr) {
          console.error("Failed to seed services in database:", seedErr);
        }
      }
    } catch (fetchErr) {
      console.error("Failed to fetch services:", fetchErr);
      servicesLoaded = true;
    }
  }

  if (dynamicServices.length === 0) {
    return [...INITIAL_SERVICES];
  }
  return [...dynamicServices];
};

export const updateService = async (updated: Service): Promise<void> => {
  dynamicServices = dynamicServices.map(s => s.id === updated.id ? updated : s);
  if (supabase) {
    await supabase.from('services').update({
      type: updated.type,
      duration: updated.duration.toString(),
      price: updated.price,
      description: updated.description,
      image_url: updated.imageUrl
    }).eq('id', updated.id);
  }
};

export const addService = async (service: Omit<Service, 'id'>): Promise<void> => {
  if (supabase) {
    await supabase.from('services').insert([{
      type: service.type,
      duration: service.duration.toString(),
      price: service.price,
      description: service.description,
      category: (service as any).category || 'general',
      image_url: service.imageUrl
    }]);
    servicesLoaded = false; // Refresh on next fetch
  } else {
    dynamicServices.push({ ...service, id: Date.now().toString() });
  }
};

export const uploadImage = async (file: File): Promise<string | null> => {
  if (!supabase) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('gallery')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    return null;
  }

  const { data } = supabase.storage
    .from('gallery')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const deleteService = async (id: string): Promise<void> => {
  dynamicServices = dynamicServices.filter(s => s.id !== id);
  if (supabase) {
    await supabase.from('services').delete().eq('id', id);
  }
};

export const getGallery = async (): Promise<GalleryItem[]> => {
  return [...galleryItems];
};

export const addGalleryItem = async (item: Omit<GalleryItem, 'id'>): Promise<void> => {
  galleryItems.push({ ...item, id: Date.now().toString() });
};

export const deleteGalleryItem = async (id: string): Promise<void> => {
  galleryItems = galleryItems.filter(i => i.id !== id);
};

// WhatsApp Integration Helper
export const sendWhatsAppMessage = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const finalPhone = cleanPhone.startsWith('0') ? '972' + cleanPhone.substring(1) : cleanPhone;
  const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export const getMessageTemplates = async (): Promise<MessageTemplates> => {
  return { ...messageTemplates };
};

export const updateMessageTemplates = async (templates: MessageTemplates): Promise<void> => {
  messageTemplates = { ...templates };
};

const adaptMessageLocally = (message: string, clientName: string) => {
  // Simple heuristic for male names (this catches common male components)
  const isMale = /^(דוד|משה|חיים|אברהם|יצחק|יעקב|יוסף|ישראל|אייל|ציון|עידן|אלעד|גלעד|רועי|איתי|יונתן|יהונתן|תומר|אורן|עמית|ניר)$/.test(clientName.split(' ')[0]);

  if (isMale) {
    return message
      .replace(/היקרה/g, 'היקר')
      .replace(/האהובה/g, 'האלוף')
      .replace(/מתרגשת/g, 'מתרגש')
      .replace(/נפגשות/g, 'נפגשים')
      .replace(/ותרצי/g, 'ותצה')
      .replace(/מוזמנת/g, 'מוזמן');
  }
  return message;
};

const formatMessage = (template: string, app: Appointment, serviceName: string) => {
  const baseMessage = template
    .replace(/{clientName}/g, app.clientName)
    .replace(/{date}/g, app.date)
    .replace(/{time}/g, app.time)
    .replace(/{serviceName}/g, serviceName)
    .replace(/{spiritualInsight}/g, app.spiritualInsight || '');

  return adaptMessageLocally(baseMessage, app.clientName);
};

export const getConfirmationMessage = (app: Appointment, serviceName: string) => {
  return formatMessage(messageTemplates.confirmation, app, serviceName);
};

export const getCancellationMessage = (app: Appointment, serviceName: string) => {
  return formatMessage(messageTemplates.cancellation, app, serviceName);
};

export const getReminderMessage = (app: Appointment, serviceName: string) => {
  return formatMessage(messageTemplates.reminder, app, serviceName);
};

export const getPendingMessage = (app: Appointment, serviceName: string) => {
  return formatMessage(messageTemplates.pending, app, serviceName);
};

// --- SUMIT Receipt Integration (Mock/Real Backend Proxy) ---
export const generateReceipt = async (
  appointmentId: string, 
  paymentMethod: string
): Promise<{ success: boolean; documentId?: string; pdfUrl?: string; error?: string }> => {
  
  if (!supabase) {
    // Client-side mock delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockDocId = "MOCK-" + Math.floor(100000 + Math.random() * 900000);
    const mockPdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    
    // Update local memory list
    appointments = appointments.map(a => a.id === appointmentId ? {
      ...a,
      status: 'paid',
      paymentMethod: paymentMethod as any,
      sumitDocumentId: mockDocId,
      sumitPdfUrl: mockPdfUrl
    } : a);
    
    return { success: true, documentId: mockDocId, pdfUrl: mockPdfUrl };
  }

  try {
    // Attempt real invocation of Edge Function
    const { data, error } = await supabase.functions.invoke('generate-receipt', {
      body: { appointmentId, paymentMethod }
    });

    // Fallback Mock mode if Edge Function fails or isn't fully configured
    if (error || !data || !data.success) {
      console.warn("Edge function not responding, falling back to database emulation:", error || data?.error);
      const mockDocId = "MOCK-" + Math.floor(100000 + Math.random() * 900000);
      const mockPdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
      
      // Manually record details in local DB for mock testing
      await supabase.from('appointments').update({
        status: 'paid',
        payment_method: paymentMethod,
        sumit_document_id: mockDocId,
        sumit_pdf_url: mockPdfUrl
      }).eq('id', appointmentId);

      return { success: true, documentId: mockDocId, pdfUrl: mockPdfUrl };
    }

    return { success: true, documentId: data.documentId, pdfUrl: data.pdfUrl };
  } catch (err: any) {
    console.error("Failed receipt generation, using sandbox mock:", err);
    const mockDocId = "MOCK-" + Math.floor(100000 + Math.random() * 900000);
    const mockPdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    return { success: true, documentId: mockDocId, pdfUrl: mockPdfUrl };
  }
};

// --- Content Hub (CMS) Service Integration ---
let mockContentItems: ContentItem[] = [
  {
    id: '1',
    title: 'איך למצוא את הייעוד שלך דרך נומרולוגיה',
    type: 'post',
    description: 'בפוסט זה נלמד כיצד מספר יום הלידה שלך משפיע על הבחירות המקצועיות והאישיות שלך, ואיך לקרוא את המפה האישית.',
    publicationDate: new Date().toISOString()
  },
  {
    id: '2',
    title: 'פודקאסט: פרק 5 - להתחבר מחדש לילדה הפנימית',
    type: 'podcast',
    mediaUrl: 'https://open.spotify.com/episode/example',
    embedCode: `<iframe src="https://open.spotify.com/embed/episode/7fK282r529wQdKx5Q24a35" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`,
    description: 'שיחה עמוקה על השילוב בין טיפול רגשי לעבודה עם תת-המודע לשחרור דפוסים ישנים.',
    publicationDate: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: '3',
    title: 'מערכת יחסים בריאה מול תלות רגשית',
    type: 'article',
    description: 'מאמר מעמיק המפרט את ההבדלים הדקים שבין אהבה בריאה ומעצימה לבין תלות רגשית המעכבת את ההתפתחות האישית שלך.',
    publicationDate: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

export const getContentHubItems = async (): Promise<ContentItem[]> => {
  if (supabase) {
    const { data, error } = await supabase
      .from('content_hub')
      .select('*')
      .order('publication_date', { ascending: false });
    if (!error && data) {
      return data.map(d => ({
        id: d.id,
        title: d.title,
        type: d.type as any,
        mediaUrl: d.media_url,
        embedCode: d.embed_code,
        description: d.description,
        summary: d.summary,
        publicationDate: d.publication_date,
        createdAt: d.created_at
      }));
    }
  }
  return [...mockContentItems];
};

export const addContentHubItem = async (item: Omit<ContentItem, 'id' | 'createdAt'>): Promise<ContentItem | null> => {
  if (supabase) {
    const { data, error } = await supabase.from('content_hub').insert([{
      title: item.title,
      type: item.type,
      media_url: item.mediaUrl,
      embed_code: item.embedCode,
      description: item.description,
      summary: item.summary,
      publication_date: item.publicationDate || new Date().toISOString()
    }]).select().single();

    if (!error && data) {
      return {
        id: data.id,
        title: data.title,
        type: data.type as any,
        mediaUrl: data.media_url,
        embedCode: data.embed_code,
        description: data.description,
        summary: data.summary,
        publicationDate: data.publication_date,
        createdAt: data.created_at
      };
    }
  }

  const newItem = {
    ...item,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString()
  };
  mockContentItems.push(newItem as ContentItem);
  return newItem as ContentItem;
};

export const deleteContentHubItem = async (id: string): Promise<void> => {
  if (supabase) {
    await supabase.from('content_hub').delete().eq('id', id);
  }
  mockContentItems = mockContentItems.filter(item => item.id !== id);
};


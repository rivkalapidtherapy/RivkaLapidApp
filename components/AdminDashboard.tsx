
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageCircle, Edit2, XCircle, Trash2, CheckCircle2, Clock, Calendar as CalendarIcon, User, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Check, Mail, RefreshCw } from 'lucide-react';
import { Appointment, ClinicStats, Service, AdminTab, GalleryItem, DailyHours, ServiceType, MessageTemplates, NumerologyInsights } from '../types';
import {
  getAppointments, cancelAppointment, deleteAppointment, getClinicStats, getAdminServices,
  updateService, updateAppointment, getDailyWorkingHours, updateDailyWorkingHours,
  getGallery, addGalleryItem, deleteGalleryItem, sendWhatsAppMessage, getConfirmationMessage, getCancellationMessage,
  addService, deleteService, confirmAppointment, getMessageTemplates, updateMessageTemplates, getReminderMessage, getPendingMessage,
  uploadImage, getNumerologyInsights, updateNumerologyInsights
} from '../services/bookingService';
import { getWeeklyJournal } from '../services/geminiService';
import { Card, Button, Input } from './UI';
import { AdminClientsTab } from './AdminClientsTab';

const DAYS_HEBREW = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HOURS_POOL = Array.from({ length: 15 }, (_, i) => `${i + 8 < 10 ? '0' : ''}${i + 8}:00`);

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [dailyHours, setDailyHours] = useState<DailyHours | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [journal, setJournal] = useState<string>('');

  const [editingApp, setEditingApp] = useState<Appointment | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [confirmAction, setConfirmAction] = useState<{ type: 'cancel' | 'delete' | 'confirm', app: Appointment } | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [calendarFilterDate, setCalendarFilterDate] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MessageTemplates | null>(null);
  const [numerologyInsights, setNumerologyInsights] = useState<NumerologyInsights | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const [apps, st, svcs, hours, gal, tmpls, numInsights] = await Promise.all([
      getAppointments(),
      getClinicStats(),
      getAdminServices(),
      getDailyWorkingHours(),
      getGallery(),
      getMessageTemplates(),
      getNumerologyInsights()
    ]);
    setAppointments(apps.sort((a, b) => b.date.localeCompare(a.date)));
    setStats(st);
    setServices(svcs);
    setDailyHours(hours);
    setGallery(gal);
    setTemplates(tmpls);
    setNumerologyInsights(numInsights);

    if (activeTab === 'journal') {
      const summary = await getWeeklyJournal(apps, svcs);
      setJournal(summary);
    }

    setLoading(false);
  };

  const handleConfirm = async (app: Appointment) => {
    await confirmAppointment(app.id);
    const service = services.find(s => s.id === app.serviceId);
    sendWhatsAppMessage(app.clientPhone, getConfirmationMessage(app, service?.type || 'מפגש'));
    setNotification({ message: 'המפגש אושר והודעה נשלחה למטופלת', type: 'success' });
    setConfirmAction(null);
    fetchData();
  };

  const handleCancelAndNotify = async (app: Appointment) => {
    await cancelAppointment(app.id);
    const service = services.find(s => s.id === app.serviceId);
    sendWhatsAppMessage(app.clientPhone, getCancellationMessage(app, service?.type || 'מפגש'));
    setNotification({ message: 'המפגש בוטל והודעה נשלחה למטופלת', type: 'success' });
    setConfirmAction(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await deleteAppointment(id);
    setNotification({ message: 'המפגש נמחק לצמיתות מהיומן', type: 'success' });
    setConfirmAction(null);
    fetchData();
  };

  const handleUpdateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    await updateAppointment(editingApp.id, editingApp);
    setEditingApp(null);
    fetchData();
  };

  const toggleHourForDay = (day: number, hour: string) => {
    if (!dailyHours) return;
    const current = dailyHours[day] || [];
    const updated = current.includes(hour)
      ? current.filter(h => h !== hour)
      : [...current, hour].sort();

    const newDaily = { ...dailyHours, [day]: updated };
    setDailyHours(newDaily);
    updateDailyWorkingHours(newDaily);
  };

  const addNewGalleryItem = async () => {
    const url = prompt("הזן כתובת תמונה (URL):");
    const title = prompt("הזן תיאור תמונה:");
    if (url && title) {
      await addGalleryItem({ url, title, category: 'General' });
      fetchData();
    }
  };

  const addNewService = async () => {
    const type = prompt("שם השירות:");
    const price = prompt("מחיר:");
    const duration = prompt("משך (דקות):");
    const description = prompt("תיאור:");
    if (type && price && duration && description) {
      await addService({
        type: type as ServiceType,
        price: parseInt(price),
        duration: parseInt(duration),
        description,
        isActive: true,
        imageUrl: 'https://picsum.photos/seed/service/800/1200'
      });
      fetchData();
    }
  };

  const handleRemoveService = async (id: string) => {
    if (confirm("האם למחוק את השירות?")) {
      await deleteService(id);
      fetchData();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, service: Service) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setLoading(true);
    const file = e.target.files[0];
    const publicUrl = await uploadImage(file);

    if (publicUrl) {
      await updateService({ ...service, imageUrl: publicUrl });
      fetchData();
    } else {
      alert("שגיאה בהעלאת התמונה");
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(app =>
    app.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.clientPhone.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 text-right" dir="rtl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-light text-stone-800 tracking-tight">מרכז ניהול</h1>
          <p className="text-stone-400 mt-1">שליטה מלאה בקליניקה ובזמינות שלך.</p>
        </div>

        <div className="flex flex-wrap bg-stone-100/50 p-1.5 rounded-xl border border-stone-200/50 gap-1">
          {(['appointments', 'calendar', 'clients', 'services', 'gallery', 'analytics', 'journal', 'settings'] as AdminTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 uppercase tracking-widest ${activeTab === tab
                ? 'bg-white text-stone-800 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-800'
                }`}
            >
              {tab === 'calendar' && 'יומן'}
              {tab === 'appointments' && 'מפגשים'}
              {tab === 'clients' && 'מטופלות'}
              {tab === 'services' && 'שירותים'}
              {tab === 'gallery' && 'גלריה'}
              {tab === 'analytics' && 'תובנות'}
              {tab === 'journal' && 'סיכום'}
              {tab === 'settings' && 'הגדרות'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-6">
          <div className="w-10 h-10 border-2 border-stone-200 border-t-[#7d7463] rounded-full animate-spin"></div>
          <p className="text-stone-400 font-light tracking-widest text-sm uppercase">טוען נתונים...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {activeTab === 'calendar' && (
            <div className="space-y-12">
              <Calendar
                appointments={appointments}
                selectedDate={selectedCalendarDate}
                onMonthChange={setSelectedCalendarDate}
                onDateClick={(date) => {
                  setCalendarFilterDate(date);
                  document.getElementById('daily-appointments')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />

              <div id="daily-appointments" className="space-y-6 pt-8 border-t border-stone-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-light">
                    {calendarFilterDate ? `מפגשים ליום ${calendarFilterDate}` : 'כל המפגשים הקרובים'}
                  </h3>
                  {calendarFilterDate && (
                    <button onClick={() => setCalendarFilterDate(null)} className="text-xs text-[#7d7463] font-bold uppercase tracking-widest hover:underline">הצג הכל</button>
                  )}
                </div>

                <div className="grid gap-4">
                  {(calendarFilterDate
                    ? appointments.filter(a => a.date === calendarFilterDate)
                    : appointments.filter(a => new Date(a.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                  ).map(app => (
                    <AppointmentCard
                      key={app.id}
                      app={app}
                      services={services}
                      onEdit={setEditingApp}
                      onCancel={(app) => setConfirmAction({ type: 'cancel', app })}
                      onDelete={(id) => setConfirmAction({ type: 'delete', app: appointments.find(a => a.id === id)! })}
                      onConfirm={(app) => setConfirmAction({ type: 'confirm', app })}
                    />
                  ))}
                  {calendarFilterDate && appointments.filter(a => a.date === calendarFilterDate).length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-stone-200 text-stone-400 italic">אין מפגשים ביום זה.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <AdminClientsTab appointments={appointments} />
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                <div className="w-full md:w-96 relative">
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם או טלפון..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2.5 px-10 focus:outline-none focus:ring-2 focus:ring-[#7d7463]/20 transition-all text-sm text-right"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 w-5 h-5" />
                </div>
              </div>

              <div className="grid gap-4">
                {filteredAppointments.length > 0 ? filteredAppointments.map(app => (
                  <AppointmentCard
                    key={app.id}
                    app={app}
                    services={services}
                    onEdit={setEditingApp}
                    onCancel={(app) => setConfirmAction({ type: 'cancel', app })}
                    onDelete={(id) => setConfirmAction({ type: 'delete', app: appointments.find(a => a.id === id)! })}
                    onConfirm={(app) => setConfirmAction({ type: 'confirm', app })}
                  />
                )) : (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-stone-200 text-stone-400 italic">לא נמצאו תורים תואמים.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && dailyHours && templates && (
            <div className="space-y-12">
              <Card className="max-w-4xl mx-auto space-y-12 !p-12">
                <div className="border-b border-stone-100 pb-8 text-center">
                  <h3 className="text-3xl font-light mb-2">ניהול שעות פעילות שבועיות</h3>
                  <p className="text-stone-400 text-sm italic">לחצי על יום כדי לעדכן את השעות שלו. שעות מסומנות הן השעות בהן ניתן לקבוע תור.</p>
                </div>

                <div className="flex justify-center gap-2 flex-wrap mb-8">
                  {DAYS_HEBREW.map((name, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(i)}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${selectedDay === i
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'bg-stone-50 text-stone-400 border-stone-100 hover:border-stone-200'
                        }`}
                    >
                      יום {name}
                    </button>
                  ))}
                </div>

                <div className="bg-stone-50/50 p-8 rounded-2xl border border-stone-100">
                  <h4 className="text-lg font-medium text-stone-800 mb-6 flex items-center justify-between">
                    שעות פעילות ליום {DAYS_HEBREW[selectedDay]}
                    <span className="text-xs text-stone-400 font-normal">{(dailyHours[selectedDay] || []).length} שעות פעילות</span>
                  </h4>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {HOURS_POOL.map(hour => (
                      <button
                        key={hour}
                        onClick={() => toggleHourForDay(selectedDay, hour)}
                        className={`py-3 text-sm font-medium rounded-xl border transition-all ${(dailyHours[selectedDay] || []).includes(hour)
                          ? 'bg-[#7d7463] text-white border-[#7d7463] shadow-md scale-105'
                          : 'bg-white text-stone-400 border-stone-100 hover:border-stone-300'
                          }`}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#7d7463]/5 p-6 rounded-xl text-stone-600 text-sm flex gap-4 items-center">
                  <span className="text-2xl">💡</span>
                  <p>טיפ: כדי להגדיר הפסקת צהריים, פשוט אל תסמני את השעות של ההפסקה (למשל סמני 09:00-12:00 ו-16:00-19:00).</p>
                </div>
              </Card>

              <TemplateSettings
                templates={templates}
                onUpdate={(updated) => {
                  setTemplates(updated);
                  updateMessageTemplates(updated);
                  setNotification({ message: 'תבניות ההודעות עודכנו בהצלחה', type: 'success' });
                }}
              />

              {numerologyInsights && (
                <NumerologySettings
                  insights={numerologyInsights}
                  onUpdate={(updated) => {
                    setNumerologyInsights(updated);
                    updateNumerologyInsights(updated);
                    setNotification({ message: 'מסרי הנומרולוגיה עודכנו בהצלחה', type: 'success' });
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-light text-stone-600">ניהול שירותים</h3>
                <Button onClick={addNewService}>+ הוספת שירות</Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map(service => (
                  <Card key={service.id} className="space-y-6 flex flex-col border-stone-100 group relative">
                    <button
                      onClick={() => handleRemoveService(service.id)}
                      className="absolute top-4 left-4 text-red-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      🗑️
                    </button>
                    <h3 className="text-2xl font-light text-stone-800">{service.type}</h3>
                    <textarea
                      className="text-stone-500 text-sm leading-relaxed bg-stone-50/50 p-4 rounded-lg focus:ring-1 focus:ring-[#7d7463] outline-none resize-none h-32 text-right"
                      defaultValue={service.description}
                      onBlur={(e) => updateService({ ...service, description: e.target.value })}
                    />
                    <div className="flex justify-between items-end gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] text-stone-400 font-bold mb-1 uppercase tracking-widest">מחיר (₪)</label>
                        <input type="number" defaultValue={service.price} onBlur={(e) => updateService({ ...service, price: parseInt(e.target.value) })} className="w-full bg-stone-50 border-b border-stone-200 py-1 outline-none focus:border-[#7d7463] font-medium text-right" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-stone-400 font-bold mb-1 uppercase tracking-widest text-left">משך (דק')</label>
                        <input type="number" defaultValue={service.duration} onBlur={(e) => updateService({ ...service, duration: parseInt(e.target.value) })} className="w-full bg-transparent text-left py-1 outline-none border-b border-stone-200 focus:border-[#7d7463]" />
                      </div>
                    </div>
                    <div className="flex justify-between items-end gap-4 mt-2">
                      <div className="flex-1">
                        <label className="block text-[10px] text-stone-400 font-bold mb-1 uppercase tracking-widest text-right">העלאת תמונת רקע חדשה</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, service)}
                          className="w-full bg-stone-50 border-b border-stone-200 py-1 outline-none text-left text-xs"
                        />
                      </div>
                    </div>
                    {service.imageUrl && (
                      <div className="mt-2 h-20 w-full rounded-md overflow-hidden bg-stone-100 flex items-center justify-center relative">
                        <img src={service.imageUrl} alt="תמונה נוכחית" className="object-cover w-full h-full opacity-50" />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white uppercase drop-shadow-md">מונה נוכחית</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-light text-stone-600">ניהול ויזואלי</h3>
                <Button onClick={addNewGalleryItem}>+ הוספת תמונה</Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {gallery.map(item => (
                  <div key={item.id} className="group relative aspect-square bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <p className="text-white text-[10px] font-bold uppercase mb-2">{item.title}</p>
                      <button onClick={() => { if (confirm("למחוק תמונה?")) deleteGalleryItem(item.id).then(fetchData); }} className="text-red-400 text-xs hover:text-red-200 text-right">מחיקה</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="מחזור הכנסות" value={`₪${stats.totalRevenue}`} icon="💰" trend={`+${stats.monthlyGrowth}%`} />
              <StatCard title="מפגשים" value={stats.upcomingAppointments.toString()} icon="🗓️" />
              <StatCard title="מטופלות" value={stats.activeClients.toString()} icon="👥" />
              <StatCard title="שירות חזק" value={stats.topService} icon="🌟" />
            </div>
          )}

          {activeTab === 'journal' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <Card className="bg-stone-900 text-white border-none shadow-2xl p-12 relative overflow-hidden rounded-3xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#7d7463]/10 rounded-full blur-[100px]"></div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🌙</span>
                    <h2 className="text-2xl font-light tracking-wide">סיכום אנרגטי שבועי</h2>
                  </div>
                  <div className="h-[1px] w-full bg-white/10"></div>
                  <p className="text-xl text-stone-300 font-light leading-relaxed italic whitespace-pre-wrap">
                    {journal || "טוען סיכום..."}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      )}

      {/* Modals & Notifications moved to end to avoid transform issues */}
      <AnimatePresence>
        {editingApp && (
          <div className="fixed inset-0 z-[100] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
            <Card className="max-w-md w-full my-auto !p-10 space-y-6">
              <h3 className="text-2xl font-light text-stone-800">עריכת מפגש</h3>
              <form onSubmit={handleUpdateApp} className="space-y-4">
                <Input label="שם מטופלת" value={editingApp.clientName} onChange={e => setEditingApp({ ...editingApp, clientName: e.target.value })} />
                <Input label="טלפון" value={editingApp.clientPhone} onChange={e => setEditingApp({ ...editingApp, clientPhone: e.target.value })} />
                <div className="grid grid-cols-2 gap-4 text-right">
                  <Input label="תאריך" type="date" value={editingApp.date} onChange={e => setEditingApp({ ...editingApp, date: e.target.value })} />
                  <Input label="שעה" value={editingApp.time} onChange={e => setEditingApp({ ...editingApp, time: e.target.value })} />
                </div>
                <div className="pt-6 flex gap-4 flex-row-reverse">
                  <Button type="submit">שמור שינויים</Button>
                  <Button variant="outline" onClick={() => setEditingApp(null)}>ביטול</Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[110] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-sm w-full bg-white rounded-3xl p-10 shadow-2xl text-center space-y-8"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${confirmAction.type === 'delete' ? 'bg-red-50 text-red-500' :
                confirmAction.type === 'confirm' ? 'bg-green-50 text-green-500' :
                  'bg-orange-50 text-orange-500'
                }`}>
                {confirmAction.type === 'confirm' ? <CheckCircle2 className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-medium text-stone-800">
                  {confirmAction.type === 'delete' ? 'מחיקת מפגש' :
                    confirmAction.type === 'confirm' ? 'אישור מפגש' :
                      'ביטול מפגש'}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                  {confirmAction.type === 'delete'
                    ? `האם את בטוחה שברצונך למחוק לצמיתות את המפגש של ${confirmAction.app.clientName}? פעולה זו אינה ניתנת לביטול.`
                    : confirmAction.type === 'confirm'
                      ? `האם לאשר את המפגש של ${confirmAction.app.clientName}? הודעת אישור תישלח אליה בוואטסאפ.`
                      : `האם לבטל את המפגש של ${confirmAction.app.clientName}? הודעת ביטול תישלח אליה בוואטסאפ.`}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  variant={confirmAction.type === 'delete' ? 'outline' : 'default'}
                  className={confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700 text-white border-none' : ''}
                  onClick={() => {
                    if (confirmAction.type === 'delete') handleDelete(confirmAction.app.id);
                    else if (confirmAction.type === 'confirm') handleConfirm(confirmAction.app);
                    else handleCancelAndNotify(confirmAction.app);
                  }}
                >
                  {confirmAction.type === 'delete' ? 'כן, מחק לצמיתות' :
                    confirmAction.type === 'confirm' ? 'כן, אשר ושלח הודעה' :
                      'כן, בטל ושלח הודעה'}
                </Button>
                <Button variant="outline" onClick={() => setConfirmAction(null)}>חזרה</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[120] px-8 py-4 bg-stone-900 text-white rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]"
          >
            {notification.type === 'success' ? <CheckCircle className="text-green-400 w-5 h-5" /> : <AlertTriangle className="text-red-400 w-5 h-5" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AppointmentCard: React.FC<{
  app: Appointment;
  services: Service[];
  onEdit: (app: Appointment) => void;
  onCancel: (app: Appointment) => void;
  onDelete: (id: string) => void;
  onConfirm: (app: Appointment) => void;
}> = ({ app, services, onEdit, onCancel, onDelete, onConfirm }) => {
  const service = services.find(s => s.id === app.serviceId);

  const handleWhatsApp = () => {
    let message = '';
    if (app.status === 'confirmed') {
      message = getReminderMessage(app, service?.type || 'מפגש');
    } else if (app.status === 'pending') {
      message = getPendingMessage(app, service?.type || 'מפגש');
    } else {
      message = getCancellationMessage(app, service?.type || 'מפגש');
    }
    sendWhatsAppMessage(app.clientPhone, message);
  };

  return (
    <Card className={`!p-0 overflow-hidden hover:shadow-lg transition-all duration-500 border-stone-100 ${app.status === 'cancelled' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      <div className="flex flex-col md:flex-row items-stretch">
        <div className={`w-2 h-auto ${app.status === 'confirmed' ? 'bg-[#7d7463]' : app.status === 'cancelled' ? 'bg-red-400' : 'bg-amber-400'}`}></div>
        <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center shadow-inner border border-stone-100 text-[#7d7463]">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-medium text-stone-800">{app.clientName}</h3>
                {app.status === 'cancelled' && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-red-100">מבוטל</span>
                )}
                {app.status === 'pending' && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-100">ממתין</span>
                )}
                {app.status === 'confirmed' && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-green-100">מאושר</span>
                )}
              </div>
              <p className="text-xs text-stone-400 flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {app.clientPhone}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-10 text-sm">
            <div className="text-right flex items-center gap-3">
              <div className="flex flex-col items-end">
                <p className="text-stone-400 text-[9px] uppercase font-bold tracking-widest">מועד</p>
                <p className="font-medium flex items-center gap-2">
                  <CalendarIcon className="w-3 h-3 text-stone-400" />
                  {app.date}
                  <Clock className="w-3 h-3 text-stone-400 mr-1" />
                  {app.time}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {app.status === 'pending' && (
                <button
                  onClick={() => onConfirm(app)}
                  title="אשר תור"
                  className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-all duration-300 hover:scale-110 shadow-lg shadow-green-200"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleWhatsApp}
                title={app.status === 'confirmed' ? "שלח תזכורת" : "שלח הודעת סטאטוס"}
                className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center hover:bg-green-100 transition-all duration-300 hover:scale-110"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => onEdit(app)}
                title="ערוך פרטים"
                className="w-10 h-10 bg-stone-50 text-stone-600 rounded-full flex items-center justify-center hover:bg-stone-100 transition-all duration-300 hover:scale-110"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              {app.status === 'cancelled' ? (
                <button
                  onClick={() => onConfirm(app)}
                  title="שחזר מפגש"
                  className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100 transition-all duration-300 hover:scale-110"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => onCancel(app)}
                  title="בטל מפגש"
                  className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center hover:bg-red-100 transition-all duration-300 hover:scale-110"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => onDelete(app.id)}
                title="מחק לצמיתות"
                className="w-10 h-10 bg-stone-50 text-stone-300 rounded-full flex items-center justify-center hover:text-red-400 transition-all duration-300 hover:scale-110"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const Calendar: React.FC<{
  appointments: Appointment[];
  onDateClick: (date: string) => void;
  selectedDate: Date;
  onMonthChange: (date: Date) => void;
}> = ({ appointments, onDateClick, selectedDate, onMonthChange }) => {
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthName = selectedDate.toLocaleString('he-IL', { month: 'long' });
  const year = selectedDate.getFullYear();

  const getDayStatus = (day: number) => {
    const dateStr = `${year}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayApps = appointments.filter(a => a.date === dateStr);
    if (dayApps.length === 0) return null;

    if (dayApps.some(a => a.status === 'pending')) return 'pending';
    if (dayApps.some(a => a.status === 'confirmed')) return 'confirmed';
    return 'cancelled';
  };

  return (
    <Card className="!p-8">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => onMonthChange(new Date(year, selectedDate.getMonth() - 1, 1))} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
        <h3 className="text-2xl font-light">{monthName} {year}</h3>
        <button onClick={() => onMonthChange(new Date(year, selectedDate.getMonth() + 1, 1))} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest py-2">{d}</div>
        ))}
        {blanks.map(b => <div key={`b-${b}`} />)}
        {days.map(d => {
          const status = getDayStatus(d);
          const dateStr = `${year}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          return (
            <button
              key={d}
              onClick={() => onDateClick(dateStr)}
              className={`relative h-14 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group
                ${isToday ? 'border-[#7d7463] bg-[#7d7463]/5' : 'border-stone-50 hover:border-stone-200 hover:bg-stone-50'}
              `}
            >
              <span className={`text-sm ${isToday ? 'font-bold text-[#7d7463]' : 'text-stone-600'}`}>{d}</span>
              {status && (
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'confirmed' ? 'bg-[#7d7463]' : status === 'pending' ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
};

const TemplateSettings: React.FC<{ templates: MessageTemplates; onUpdate: (t: MessageTemplates) => void }> = ({ templates, onUpdate }) => {
  const [localTemplates, setLocalTemplates] = useState(templates);

  const handleChange = (key: keyof MessageTemplates, value: string) => {
    const updated = { ...localTemplates, [key]: value };
    setLocalTemplates(updated);
  };

  return (
    <Card className="space-y-10 !p-12">
      <div className="border-b border-stone-100 pb-6">
        <h3 className="text-2xl font-light">ניהול תבניות הודעות וואטסאפ</h3>
        <p className="text-stone-400 text-sm mt-2">השתמשי בתגיות הבאות: {"{clientName}, {date}, {time}, {serviceName}, {spiritualInsight}"}</p>
      </div>

      <div className="space-y-8">
        {(Object.keys(localTemplates) as Array<keyof MessageTemplates>).map(key => (
          <div key={key} className="space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400">
              {key === 'confirmation' && 'הודעת אישור תור'}
              {key === 'cancellation' && 'הודעת ביטול תור'}
              {key === 'reminder' && 'הודעת תזכורת'}
              {key === 'pending' && 'הודעת המתנה לאישור'}
            </label>
            <textarea
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm text-stone-600 focus:ring-1 focus:ring-[#7d7463] outline-none min-h-[120px] resize-none"
              value={localTemplates[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              onBlur={() => onUpdate(localTemplates)}
            />
          </div>
        ))}
      </div>
    </Card>
  );
};

const NumerologySettings: React.FC<{ insights: NumerologyInsights; onUpdate: (t: NumerologyInsights) => void }> = ({ insights, onUpdate }) => {
  const [localInsights, setLocalInsights] = useState(insights);

  const handleChange = (key: number, value: string) => {
    const updated = { ...localInsights, [key]: value };
    setLocalInsights(updated);
  };

  return (
    <Card className="space-y-10 !p-12 mt-8">
      <div className="border-b border-stone-100 pb-6">
        <h3 className="text-2xl font-light">ניהול חוויה נומרולוגית (מספר 1-9)</h3>
        <p className="text-stone-400 text-sm mt-2">ההודעות שיוצגו ללקוחה בעת הזנת תאריך הלידה בעמוד קביעת התור.</p>
      </div>

      <div className="space-y-8">
        {([1, 2, 3, 4, 5, 6, 7, 8, 9]).map(num => (
          <div key={num} className="space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400">
              שנה אישית מס' {num}
            </label>
            <textarea
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm text-stone-600 focus:ring-1 focus:ring-[#7d7463] outline-none min-h-[100px] resize-none"
              value={localInsights[num] || ''}
              onChange={(e) => handleChange(num, e.target.value)}
              onBlur={() => onUpdate(localInsights)}
            />
          </div>
        ))}
      </div>
    </Card>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: string; trend?: string }> = ({ title, value, icon, trend }) => (
  <Card className="!p-6 flex flex-col items-center text-center space-y-3 border-stone-100/60 hover:shadow-lg transition-all duration-300 rounded-2xl">
    <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-stone-100">
      {icon}
    </div>
    <div className="space-y-1">
      <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">{title}</span>
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl font-medium text-stone-800">{value}</span>
        {trend && <span className="text-[10px] text-green-500 font-bold">{trend}</span>}
      </div>
    </div>
  </Card>
);

export default AdminDashboard;


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SERVICES as INITIAL_SERVICES } from '../constants';
import { Service, Appointment } from '../types';
import { Button, Card, Input } from './UI';
import { getAvailabilityForDate, addAppointment, sendWhatsAppMessage, getConfirmationMessage, getAdminServices } from '../services/bookingService';

interface BookingFlowProps {
  onComplete: (appointment: Appointment) => void;
  onCancel: () => void;
  initialServiceId?: string | null;
}

const BookingFlow: React.FC<BookingFlowProps> = ({ onComplete, onCancel, initialServiceId }) => {
  const [step, setStep] = useState(initialServiceId ? 2 : 1);
  const [selectedService, setSelectedService] = useState<Service | null>(
    initialServiceId ? INITIAL_SERVICES.find(s => s.id === initialServiceId) || null : null
  );
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);

  useEffect(() => {
    const fetchServices = async () => {
      const data = await getAdminServices();
      if (data && data.length > 0) {
        setServices(data);
        if (initialServiceId) {
          const found = data.find(s => s.id === initialServiceId);
          if (found) setSelectedService(found);
        }
      }
    };
    fetchServices();
  }, []);

  // גלילה לראש הדף בכל שינוי שלב
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    if (step === 2) {
      loadAvailability();
    }
  }, [selectedDate, step]);

  const loadAvailability = async () => {
    setLoading(true);
    const times = await getAvailabilityForDate(selectedDate);
    setAvailableTimes(times);
    setLoading(false);
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedTime) return;

    setLoading(true);
    try {
      const newApp: Omit<Appointment, 'id' | 'createdAt' | 'status'> = {
        serviceId: selectedService.id,
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        clientPhone: clientInfo.phone,
        date: selectedDate,
        time: selectedTime,
        spiritualInsight: ""
      };

      const result = await addAppointment(newApp);

      onComplete(result);
    } catch (err) {
      alert("ההרשמה נכשלה. אנא נסי שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-12 text-center">
        <span className="text-xs uppercase tracking-[0.3em] text-[#7d7463] font-bold">שלב {step} מתוך 3</span>
        <h2 className="text-3xl mt-2 text-stone-800 font-light">
          {step === 1 && "ברכות! הצעד הראשון לשינוי שלך כבר התחיל! כעת נותר לך רק לקבוע מועד.."}
          {step === 2 && "בחירת זמן ומרחב"}
          {step === 3 && "פרטים אחרונים"}
        </h2>
      </div>

      <Card className="rounded-3xl !p-10 shadow-xl border-stone-100">
        {step === 1 && (
          <div className="space-y-4">
            {services.map(service => (
              <div
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer text-right group ${selectedService?.id === service.id
                  ? 'border-[#7d7463] bg-[#7d7463]/5 shadow-sm'
                  : 'border-stone-100 hover:border-stone-200 bg-white'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-medium group-hover:text-[#7d7463] transition-colors">{service.type}</h3>
                  <span className="text-[#7d7463] font-bold text-lg">₪{service.price}</span>
                </div>
                <p className="text-sm text-stone-500 mb-4 leading-relaxed">{service.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-200"></span>
                  {service.duration} דקות של נוכחות
                </div>
              </div>
            ))}
            <div className="pt-8 flex justify-between flex-row-reverse relative z-40 bg-white">
              <Button onClick={handleNext} disabled={!selectedService} className="w-32 rounded-xl">המשך</Button>
              <Button variant="outline" onClick={onCancel} className="w-32 rounded-xl">ביטול</Button>
            </div>

            <AnimatePresence>
              {selectedService && (
                <motion.div
                  initial={{ opacity: 0, y: 50, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: 50, x: '-50%' }}
                  className="fixed bottom-6 left-1/2 z-50 w-full max-w-[90%] md:hidden"
                >
                  <Button onClick={handleNext} className="w-full rounded-2xl shadow-2xl shadow-[#7d7463]/40 py-4 text-lg bg-[#7d7463] hover:bg-[#635a4a] text-white">
                    לשלב הבא
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="text-right">
              <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-3 block">1. באיזה יום?</label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border-stone-200 border rounded-xl p-4 focus:outline-none focus:border-[#7d7463] text-right bg-stone-50/50"
              />
            </div>

            <div className="text-right">
              <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-3 block">2. באיזו שעה?</label>
              {loading ? (
                <div className="flex flex-wrap gap-2 flex-row-reverse py-4 animate-pulse">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-12 w-24 bg-stone-100 rounded-xl"></div>)}
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {availableTimes.length > 0 ? (
                    availableTimes.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-3 text-sm font-medium rounded-xl border transition-all ${selectedTime === time
                          ? 'bg-stone-800 text-white border-stone-800 shadow-lg scale-105'
                          : 'bg-white border-stone-100 text-stone-600 hover:border-stone-400'
                          }`}
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-4 p-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
                      <p className="text-sm text-stone-400 italic">ביום זה הקליניקה סגורה או שאין תורים פנויים.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 flex justify-between flex-row-reverse">
              <Button onClick={handleNext} disabled={!selectedTime} className="w-32 rounded-xl">המשך</Button>
              <Button variant="outline" onClick={handleBack} className="w-32 rounded-xl">חזור</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="שם מלא"
                required
                placeholder="הכניסי את שמך..."
                value={clientInfo.name}
                onChange={e => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                label="מספר טלפון"
                type="tel"
                required
                placeholder="05..."
                value={clientInfo.phone}
                onChange={e => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <Input
              label="כתובת אימייל (אופציונלי)"
              type="email"
              placeholder="name@example.com"
              value={clientInfo.email}
              onChange={e => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
            />

            <div className="bg-stone-50 p-8 rounded-2xl border border-stone-100 mt-8">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold mb-4">סיכום המפגש המתוכנן</h4>
              <div className="space-y-3 text-sm text-stone-600">
                <div className="flex justify-between items-center">
                  <span className="opacity-60">סוג המפגש:</span>
                  <span className="font-bold text-stone-800">{selectedService?.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-60">מועד:</span>
                  <span className="font-bold text-stone-800">{selectedDate} ב-{selectedTime}</span>
                </div>
                <div className="pt-3 border-t border-stone-200 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#7d7463]">סה"כ לתשלום</span>
                  <span className="text-2xl font-light text-stone-800">₪{selectedService?.price}</span>
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-between flex-row-reverse">
              <Button type="submit" isLoading={loading} disabled={loading} className="px-10 rounded-xl">אישור והזמנה</Button>
              <Button variant="outline" onClick={handleBack} disabled={loading} className="w-32 rounded-xl">חזור</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default BookingFlow;

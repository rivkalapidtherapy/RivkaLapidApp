import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { JourneyNote, Appointment, Service } from '../types';
import { getJourneyNotes, getAppointments, getAdminServices } from '../services/bookingService';
import { Card, Button } from './UI';
import { Calendar, MessageSquare, ArrowRight } from 'lucide-react';

interface ClientPortalProps {
    clientPhone: string;
    onClose: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ clientPhone, onClose }) => {
    const [notes, setNotes] = useState<JourneyNote[]>([]);
    const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [clientName, setClientName] = useState<string>('');

    useEffect(() => {
        const fetchPortalData = async () => {
            setLoading(true);
            const [fetchedNotes, allApps, allServices] = await Promise.all([
                getJourneyNotes(clientPhone),
                getAppointments(),
                getAdminServices()
            ]);

            const clientApps = allApps.filter(a => a.clientPhone === clientPhone).sort((a, b) => b.date.localeCompare(a.date));
            if (clientApps.length > 0) {
                setClientName(clientApps[0].clientName);
            } else if (fetchedNotes.length > 0) {
                setClientName(fetchedNotes[0].clientName);
            }

            setPastAppointments(clientApps);
            setNotes(fetchedNotes);
            setServices(allServices);
            setLoading(false);
        };

        fetchPortalData();
    }, [clientPhone]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed] text-[#7d7463]">טוען את המרחב האישי שלך...</div>;
    }

    return (
        <div className="min-h-screen bg-[#f5f2ed] text-stone-800 p-6 md:p-12" dir="rtl">
            <div className="max-w-3xl mx-auto space-y-12">
                <header className="flex justify-between items-center pb-8 border-b border-stone-200">
                    <div>
                        <h1 className="text-3xl font-light mb-2">שלום {clientName || 'אהובה'},</h1>
                        <p className="text-stone-500 font-light">ברוכה הבאה ליומן המסע האישי שלך.</p>
                    </div>
                    <Button variant="outline" onClick={onClose} className="rounded-full flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" /> חזרה
                    </Button>
                </header>

                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <MessageSquare className="w-6 h-6 text-[#7d7463]" />
                        <h2 className="text-2xl font-light">מסרים אישיים מרבקה</h2>
                    </div>

                    {notes.length === 0 ? (
                        <div className="text-center py-12 bg-white/50 rounded-3xl border border-stone-100 text-stone-400 italic font-light shadow-inner">
                            <p>עוד אין כאן סיכומי טיפול.</p>
                            <p className="mt-2 opacity-70">הם יופיעו כאן בהמשך המסע שלנו.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {notes.map(note => (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={note.id}>
                                    <Card className="!p-8 relative overflow-hidden bg-white hover:shadow-xl transition-all duration-500 rounded-3xl border border-stone-100/50">
                                        <div className="absolute top-0 right-0 w-1 h-full bg-[#7d7463]/40" />
                                        <div className="mb-6 text-[10px] font-bold text-stone-300 uppercase tracking-widest bg-stone-50 px-3 py-1.5 rounded-full inline-block">
                                            {new Date(note.createdAt).toLocaleDateString('he-IL')}
                                        </div>
                                        <p className="text-stone-600 leading-relaxed whitespace-pre-wrap font-medium text-[15px]">{note.content}</p>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="space-y-6 pt-10 border-t border-stone-100">
                    <div className="flex items-center gap-3 mb-6">
                        <Calendar className="w-6 h-6 text-[#7d7463]" />
                        <h2 className="text-2xl font-light">היסטוריית הטיפולים שלך</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {pastAppointments.length === 0 ? (
                            <div className="col-span-2 text-stone-400 italic text-sm text-center py-10 bg-white/20 rounded-2xl">אין טיפולים להצגה עדיין.</div>
                        ) : (
                            pastAppointments.map(app => {
                                const service = services.find(s => s.id === app.serviceId);
                                return (
                                    <div key={app.id} className="bg-white p-6 rounded-2xl border border-stone-50 shadow-sm flex justify-between items-center text-sm transition-transform hover:scale-[1.01]">
                                        <div>
                                            <h4 className="font-semibold text-stone-700">{service?.type || 'מפגש שנקבע'}</h4>
                                            <p className="text-stone-400 mt-1">{app.date} בשעה {app.time}</p>
                                        </div>
                                        <div className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${app.status === 'confirmed' ? 'bg-[#7d7463]/10 text-[#7d7463]' :
                                                app.status === 'pending' ? 'bg-amber-100/50 text-amber-700' :
                                                    'bg-red-50 text-red-500'
                                            }`}>
                                            {app.status === 'confirmed' ? 'אושר' : app.status === 'pending' ? 'ממתין' : 'בוטל'}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ClientPortal;

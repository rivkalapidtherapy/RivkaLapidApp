import React, { useState, useEffect } from 'react';
import { Appointment, JourneyNote } from '../types';
import { getJourneyNotes, addJourneyNote, sendWhatsAppMessage } from '../services/bookingService';
import { Card, Button, Input } from './UI';
import { User, MessageSquare, Copy, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminClientsTabProps {
    appointments: Appointment[];
}

export const AdminClientsTab: React.FC<AdminClientsTabProps> = ({ appointments }) => {
    const [selectedClientPhone, setSelectedClientPhone] = useState<string | null>(null);
    const [notes, setNotes] = useState<JourneyNote[]>([]);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    // Derive unique clients from appointments
    const uniqueClientsMap = new Map<string, { name: string, email: string, phone: string, totalApps: number, lastApp: string }>();

    appointments.forEach(app => {
        if (!uniqueClientsMap.has(app.clientPhone)) {
            uniqueClientsMap.set(app.clientPhone, {
                name: app.clientName,
                email: app.clientEmail,
                phone: app.clientPhone,
                totalApps: 1,
                lastApp: app.date
            });
        } else {
            const existing = uniqueClientsMap.get(app.clientPhone)!;
            existing.totalApps += 1;
            if (app.date > existing.lastApp) {
                existing.lastApp = app.date;
            }
        }
    });

    const clients = Array.from(uniqueClientsMap.values()).sort((a, b) => b.lastApp.localeCompare(a.lastApp));
    const selectedClient = clients.find(c => c.phone === selectedClientPhone);

    useEffect(() => {
        if (selectedClientPhone) {
            loadNotes(selectedClientPhone);
        }
    }, [selectedClientPhone]);

    const loadNotes = async (phone: string) => {
        setLoadingNotes(true);
        const fetchedNotes = await getJourneyNotes(phone);
        setNotes(fetchedNotes);
        setLoadingNotes(false);
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientPhone || !newNoteContent.trim() || !selectedClient) return;

        const newNote = await addJourneyNote({
            clientPhone: selectedClientPhone,
            clientName: selectedClient.name,
            content: newNoteContent
        });

        if (newNote) {
            setNotes([newNote, ...notes]);
            setNewNoteContent('');
        }
    };

    const copyMagicLink = () => {
        if (!selectedClientPhone) return;
        const link = `${window.location.origin}/?portal=${selectedClientPhone}`;
        navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* Sidebar: Client List */}
            <div className="lg:col-span-1 space-y-4">
                <h3 className="text-xl font-light text-stone-800 mb-6">לקוחות אחרונים</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {clients.map(client => (
                        <button
                            key={client.phone}
                            onClick={() => setSelectedClientPhone(client.phone)}
                            className={`w-full text-right p-4 rounded-2xl border transition-all ${selectedClientPhone === client.phone
                                ? 'bg-[#7d7463] text-white border-[#7d7463] shadow-lg scale-105'
                                : 'bg-white text-stone-600 border-stone-100 hover:border-stone-200'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedClientPhone === client.phone ? 'bg-white/20' : 'bg-stone-50'}`}>
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">{client.name}</h4>
                                    <p className={`text-[10px] uppercase tracking-wider ${selectedClientPhone === client.phone ? 'text-white/70' : 'text-stone-400'}`}>
                                        {client.totalApps} טיפולים • אחרון ב-{client.lastApp}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                    {clients.length === 0 && (
                        <div className="text-center py-10 text-stone-400 italic text-sm">לא נמצאו לקוחות במערכת.</div>
                    )}
                </div>
            </div>

            {/* Main Content: Notes and Portal mgmt */}
            <div className="lg:col-span-2">
                {selectedClient ? (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <Card className="!p-8 border-stone-100 flex justify-between items-center bg-white shadow-sm">
                            <div>
                                <h2 className="text-3xl font-light text-stone-800 mb-1">{selectedClient.name}</h2>
                                <p className="text-stone-400 font-mono text-sm">{selectedClient.phone}</p>
                            </div>
                            <div className="text-left">
                                <p className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2">קישור לאזור האישי</p>
                                <div className="flex items-center gap-2 justify-end">
                                    <Button variant="outline" onClick={() => {
                                        const link = `${window.location.origin}/?portal=${selectedClientPhone}`;
                                        const message = `שלום ${selectedClient.name} 💕\nמצורף הקישור ליומן המסע האישי שלך:\n${link}`;
                                        sendWhatsAppMessage(selectedClient.phone, message);
                                    }} className="rounded-xl flex items-center gap-2 bg-green-50 text-green-600 border-green-200 hover:bg-green-100 shadow-sm hover:scale-105 transition-all">
                                        שליחה בוואטסאפ
                                    </Button>
                                    <Button variant="outline" onClick={copyMagicLink} className={`rounded-xl flex items-center gap-2 shadow-sm hover:scale-105 transition-all ${copiedLink ? 'bg-green-50 text-green-600 border-green-200' : ''}`}>
                                        {copiedLink ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copiedLink ? 'הקישור הועתק' : 'העתקת קישור'}
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <Card className="!p-8 border-stone-100">
                            <h3 className="text-xl font-light text-stone-800 mb-6 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-[#7d7463]" />
                                סיכומי פגישה / יומן מסע
                            </h3>

                            <form onSubmit={handleAddNote} className="mb-8 space-y-4">
                                <textarea
                                    placeholder="כתיבת סיכום לאזור האישי..."
                                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 min-h-[120px] focus:ring-1 focus:ring-[#7d7463] outline-none text-right resize-none"
                                    value={newNoteContent}
                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={!newNoteContent.trim()}>הוסיפי סיכום</Button>
                                </div>
                            </form>

                            <div className="space-y-4 pt-6 border-t border-stone-100">
                                {loadingNotes ? (
                                    <div className="flex justify-center p-6"><div className="w-6 h-6 border-2 border-stone-200 border-t-[#7d7463] rounded-full animate-spin" /></div>
                                ) : notes.length === 0 ? (
                                    <p className="text-stone-400 text-sm italic text-center py-6">טרם נכתבו סיכומים עבור לקוח/ה זה/ו.</p>
                                ) : (
                                    notes.map(note => (
                                        <div key={note.id} className="bg-stone-50/50 p-6 rounded-2xl border border-stone-100">
                                            <div className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-3">
                                                {new Date(note.createdAt).toLocaleString('he-IL')}
                                            </div>
                                            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </motion.div>
                ) : (
                    <div className="h-full bg-white/50 border border-dashed border-stone-200 rounded-3xl flex items-center justify-center p-12 text-center text-stone-400 italic">
                        יש לבחור לקוח/ה מהרשימה כדי לצפות ולערוך את יומן המסע
                    </div>
                )}
            </div>
        </div>
    );
};

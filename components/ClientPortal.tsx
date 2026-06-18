import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JourneyNote, Appointment, Service, NumerologyProfile, ClientReflection, ClientTask, ContentItem } from '../types';
import { 
  getJourneyNotes, getAppointments, getAdminServices,
  getNumerologyProfile,
  getClientReflections, addClientReflection, deleteClientReflection,
  getClientTasks, updateClientTaskStatus,
  getClientSavedContent, unsaveContentForClient, saveContentForClient,
  getClientRecommendedContent,
  cancelAppointment
} from '../services/bookingService';
import { Card, Button, Input } from './UI';
import { 
  Calendar, MessageSquare, ArrowRight, Award, CheckSquare, 
  BookOpen, Heart, FileText, Plus, LogOut, Check, X, Sparkles, AlertCircle 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ClientPortalProps {
    clientPhone?: string | null;
    onClose: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ clientPhone, onClose }) => {
    // Authentication State
    const [user, setUser] = useState<any>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [clientEmail, setClientEmail] = useState<string | null>(null);

    // Navigation and tabs
    const [activeTab, setActiveTab] = useState<'journey' | 'numerology' | 'journal' | 'tasks' | 'inspiration' | 'appointments' | 'billing'>('journey');

    // UI Data States
    const [notes, setNotes] = useState<JourneyNote[]>([]);
    const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [numProfile, setNumProfile] = useState<NumerologyProfile | null>(null);
    const [journalPages, setJournalPages] = useState<ClientReflection[]>([]);
    const [tasksList, setTasksList] = useState<ClientTask[]>([]);
    const [savedContent, setSavedContent] = useState<ContentItem[]>([]);
    const [recommendedContent, setRecommendedContent] = useState<{ content: ContentItem, note?: string }[]>([]);
    
    const [loadingData, setLoadingData] = useState(true);
    const [clientName, setClientName] = useState<string>('');

    // Journal Entry Form State
    const [journalTitle, setJournalTitle] = useState('');
    const [journalContent, setJournalContent] = useState('');
    const [shareWithTherapist, setShareWithTherapist] = useState(false);
    const [isAddingJournal, setIsAddingJournal] = useState(false);

    // Listen to Supabase Auth changes
    useEffect(() => {
        if (!supabase) {
            setLoadingAuth(false);
            return;
        }

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                setClientEmail(session.user.email || null);
            }
            setLoadingAuth(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                setClientEmail(session.user.email || null);
            } else {
                setUser(null);
                setClientEmail(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load data based on authenticated email or phone number magic link
    useEffect(() => {
        const fetchPortalData = async () => {
            setLoadingData(true);
            try {
                const [allApps, allServices] = await Promise.all([
                    getAppointments(),
                    getAdminServices()
                ]);
                setServices(allServices);

                let matchingApps: Appointment[] = [];
                let emailToQuery = clientEmail;

                // 1. If logged in with Google, match by email
                if (emailToQuery) {
                    matchingApps = allApps.filter(a => a.clientEmail?.toLowerCase() === emailToQuery?.toLowerCase());
                    
                    // Fetch personalized features
                    const [fetchedNum, fetchedJournal, fetchedTasks, fetchedSaved, fetchedRecs, fetchedNotes] = await Promise.all([
                        getNumerologyProfile(emailToQuery),
                        getClientReflections(emailToQuery),
                        getClientTasks(emailToQuery),
                        getClientSavedContent(emailToQuery),
                        getClientRecommendedContent(emailToQuery),
                        matchingApps.length > 0 ? getJourneyNotes(matchingApps[0].clientPhone) : Promise.resolve([])
                    ]);

                    setNumProfile(fetchedNum);
                    setJournalPages(fetchedJournal);
                    setTasksList(fetchedTasks);
                    setSavedContent(fetchedSaved);
                    setRecommendedContent(fetchedRecs);
                    setNotes(fetchedNotes);

                    if (matchingApps.length > 0) {
                        setClientName(matchingApps[0].clientName);
                    } else if (fetchedNum?.clientEmail) {
                        setClientName(emailToQuery.split('@')[0]);
                    }
                } 
                // 2. If magic link (phone number), match by phone
                else if (clientPhone) {
                    matchingApps = allApps.filter(a => a.clientPhone === clientPhone);
                    const fetchedNotes = await getJourneyNotes(clientPhone);
                    setNotes(fetchedNotes);
                    
                    if (matchingApps.length > 0) {
                        setClientName(matchingApps[0].clientName);
                    } else if (fetchedNotes.length > 0) {
                        setClientName(fetchedNotes[0].clientName);
                    }
                }

                setAppointmentsList(matchingApps.sort((a, b) => b.date.localeCompare(a.date)));
            } catch (err) {
                console.error("Error loading portal data:", err);
            } finally {
                setLoadingData(false);
            }
        };

        if (clientEmail || clientPhone) {
            fetchPortalData();
        }
    }, [clientEmail, clientPhone]);

    const handleGoogleLogin = async () => {
        if (!supabase) return;
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/?view=portal'
            }
        });
    };

    const handleLogout = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        onClose();
    };

    const handleAddJournalPage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientEmail || !journalTitle.trim() || !journalContent.trim()) return;

        const newPage = await addClientReflection({
            clientEmail: clientEmail,
            title: journalTitle,
            content: journalContent,
            shareWithTherapist
        });

        if (newPage) {
            setJournalPages([newPage, ...journalPages]);
            setJournalTitle('');
            setJournalContent('');
            setShareWithTherapist(false);
            setIsAddingJournal(false);
        }
    };

    const handleDeleteJournalPage = async (id: string) => {
        if (!confirm("האם למחוק דף התבוננות זה מהיומן שלך?")) return;
        await deleteClientReflection(id);
        setJournalPages(journalPages.filter(p => p.id !== id));
    };

    const handleToggleTask = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        await updateClientTaskStatus(id, newStatus);
        setTasksList(tasksList.map(t => t.id === id ? { ...t, isCompleted: newStatus, completedAt: newStatus ? new Date().toISOString() : null } : t));
    };

    const handleUnsaveContent = async (contentId: string) => {
        if (!clientEmail) return;
        await unsaveContentForClient(clientEmail, contentId);
        setSavedContent(savedContent.filter(c => c.id !== contentId));
    };

    const handleCancelApp = async (app: Appointment) => {
        if (!confirm(`האם את בטוחה שברצונך לבטל את המפגש ב-${app.date} בשעה ${app.time}?`)) return;
        await cancelAppointment(app.id);
        setAppointmentsList(appointmentsList.map(a => a.id === app.id ? { ...a, status: 'cancelled' } : a));
    };

    // Loading State
    if (loadingAuth || (loadingData && (clientEmail || clientPhone))) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed] text-[#7d7463]">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-[#7d7463] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="font-light text-sm tracking-widest">טוען את המרחב האישי שלך...</p>
                </div>
            </div>
        );
    }

    // Login Screen if not authenticated and no phone magic link is provided
    if (!user && !clientPhone) {
        return (
            <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center p-6 text-stone-800" dir="rtl">
                <Card className="max-w-md w-full !p-12 text-center bg-white shadow-2xl rounded-3xl border border-stone-100/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-2 bg-[#7d7463]/40"></div>
                    <div className="mb-8">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-[#7d7463] font-bold block mb-3">רבקה לפיד • מרחב אישי</span>
                        <h2 className="text-3xl font-light text-stone-800 leading-tight">חיבור ליומן המסע שלך</h2>
                        <p className="text-stone-400 text-sm font-light mt-3 leading-relaxed">
                            היכנסי למרחב האישי כדי לצפות במפה הנומרולוגית שלך, לנהל משימות לבית, לכתוב ביומן ההתבוננות ולראות תכנים מומלצים במיוחד עבורך.
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <Button 
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 py-4 shadow-md bg-stone-800 hover:bg-stone-900 text-white rounded-xl transition-all"
                        >
                            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.187 4.114-3.326 0-6.04-2.714-6.04-6.04s2.714-6.04 6.04-6.04c1.524 0 2.923.56 4.004 1.486l3.12-3.12C18.91 2.378 15.82 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.746-.075-1.425-.214-2.21H12.24z"/>
                            </svg>
                            התחברי באמצעות Google
                        </Button>
                        
                        <Button variant="outline" onClick={onClose} className="w-full rounded-xl py-3 border-stone-200 text-stone-500 hover:bg-stone-50">
                            חזרה לאתר
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f2ed] text-stone-800 p-6 md:p-12 pt-32 md:pt-40 text-right" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-stone-200 gap-4">
                    <div>
                        <h1 className="text-3xl font-light mb-2">שלום {clientName || 'לך'},</h1>
                        <p className="text-stone-500 font-light text-sm">
                            {user ? 'ברוכים הבאים למרחב הטיפולי המאובטח שלך.' : 'ברוכים הבאים ליומן המסע האישי שלך (קישור מהיר).'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        {user && (
                            <Button variant="outline" onClick={handleLogout} className="rounded-full flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 text-xs py-2 px-4">
                                <LogOut className="w-3.5 h-3.5" /> התנתקות
                            </Button>
                        )}
                        <Button variant="outline" onClick={onClose} className="rounded-full flex items-center gap-2 text-xs py-2 px-4 bg-white">
                            <ArrowRight className="w-3.5 h-3.5" /> חזרה לאתר
                        </Button>
                    </div>
                </header>

                {/* Info Alert if using magic link (read-only preview mode) */}
                {!user && clientPhone && (
                    <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-4 text-amber-800 text-sm">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h5 className="font-bold">צפייה מוגבלת (Preview)</h5>
                            <p className="leading-relaxed">
                                נכנסת דרך קישור מהיר. כדי לכתוב ביומן ההתבוננות, לראות משימות לבית ולקבל פרשנות נומרולוגית אישית מלאה מרבקה, התחברי בצורה מאובטחת עם חשבון הגוגל שלך.
                            </p>
                            <button 
                                onClick={handleGoogleLogin}
                                className="mt-2.5 font-bold text-[#7d7463] hover:underline flex items-center gap-1"
                            >
                                התחברי כעת עם Google ←
                            </button>
                        </div>
                    </div>
                )}

                {/* Dashboard Tabs for Authenticated Clients */}
                {user ? (
                    <div className="flex gap-1.5 bg-stone-200/50 p-1 rounded-2xl overflow-x-auto">
                        {[
                            { id: 'journey', label: 'המסע שלי', icon: Sparkles },
                            { id: 'numerology', label: 'מפה נומרולוגית', icon: Award },
                            { id: 'journal', label: 'יומן התבוננות', icon: BookOpen },
                            { id: 'tasks', label: 'משימות לבית', icon: CheckSquare },
                            { id: 'inspiration', label: 'ספריית השראה', icon: Heart },
                            { id: 'appointments', label: 'המפגשים שלי', icon: Calendar },
                            { id: 'billing', label: 'תשלומים ומסמכים', icon: FileText }
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center justify-center gap-2 flex-1 min-w-[120px] py-3 rounded-xl text-xs font-semibold transition-all ${activeTab === tab.id
                                        ? 'bg-white text-stone-800 shadow-sm font-bold scale-100'
                                        : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                ) : null}

                {/* TAB RENDERING */}
                <div className="pt-2">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-8"
                        >
                            {/* TAB: JOURNEY (Default & Magic Link view) */}
                            {activeTab === 'journey' && (
                                <div className="space-y-8">
                                    {/* Notifications/Messages from Rivka */}
                                    <section className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <MessageSquare className="w-5 h-5 text-[#7d7463]" />
                                            <h2 className="text-xl font-light text-stone-800">מסרים אישיים מרבקה</h2>
                                        </div>

                                        {notes.length === 0 ? (
                                            <div className="text-center py-12 bg-white rounded-3xl border border-stone-100 text-stone-400 italic font-light shadow-sm">
                                                עוד אין כאן סיכומי טיפול ומסרים אישיים.
                                                <p className="mt-2 text-xs opacity-70">הם יופיעו כאן בהמשך המסע המשותף שלנו.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {notes.map(note => (
                                                    <Card key={note.id} className="!p-6 relative overflow-hidden bg-white rounded-2xl border border-stone-100/50 shadow-sm">
                                                        <div className="absolute right-0 top-0 w-1.5 h-full bg-[#7d7463]/30" />
                                                        <div className="mb-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-50 px-2.5 py-1 rounded-full inline-block">
                                                            {new Date(note.createdAt).toLocaleDateString('he-IL')}
                                                        </div>
                                                        <p className="text-stone-600 leading-relaxed whitespace-pre-wrap text-[14px]">{note.content}</p>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    {/* Quick Active Tasks Preview */}
                                    {user && tasksList.filter(t => !t.isCompleted).length > 0 && (
                                        <section className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
                                            <h3 className="font-semibold text-stone-700 text-base flex items-center gap-2">
                                                <CheckSquare className="w-4 h-4 text-[#7d7463]" />
                                                משימות פעילות לבית
                                            </h3>
                                            <div className="space-y-2">
                                                {tasksList.filter(t => !t.isCompleted).slice(0, 3).map(task => (
                                                    <div 
                                                        key={task.id}
                                                        onClick={() => handleToggleTask(task.id, task.isCompleted)}
                                                        className="flex items-center justify-between p-3 bg-stone-50 rounded-xl hover:bg-stone-100/70 cursor-pointer transition-all border border-stone-100"
                                                    >
                                                        <span className="w-5 h-5 rounded border border-stone-300 flex items-center justify-center text-white bg-white hover:border-[#7d7463]">
                                                            {task.isCompleted && <Check className="w-3.5 h-3.5 text-[#7d7463]" />}
                                                        </span>
                                                        <div className="text-right">
                                                            <span className="text-xs font-semibold text-stone-800">{task.title}</span>
                                                            {task.dueDate && <span className="text-[10px] text-stone-400 block mt-0.5">יעד: {task.dueDate}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Appointments History Preview for magic link users */}
                                    {!user && (
                                        <section className="space-y-6 pt-6 border-t border-stone-200">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-5 h-5 text-[#7d7463]" />
                                                <h2 className="text-xl font-light text-stone-800">היסטוריית הטיפולים שלך</h2>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                {appointmentsList.length === 0 ? (
                                                    <div className="col-span-2 text-stone-400 italic text-sm text-center py-10 bg-white/50 border border-stone-100 rounded-2xl">אין טיפולים להצגה עדיין.</div>
                                                ) : (
                                                    appointmentsList.map(app => {
                                                        const service = services.find(s => s.id === app.serviceId);
                                                        return (
                                                            <div key={app.id} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex justify-between items-center text-sm">
                                                                <div className="text-right">
                                                                    <h4 className="font-semibold text-stone-700">{service?.type || 'מפגש שנקבע'}</h4>
                                                                    <p className="text-stone-400 text-xs mt-1">{app.date} בשעה {app.time}</p>
                                                                </div>
                                                                <div className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                                                                    app.status === 'confirmed' || app.status === 'paid' || app.status === 'attended'
                                                                        ? 'bg-emerald-50 text-emerald-600'
                                                                        : app.status === 'pending'
                                                                            ? 'bg-amber-50 text-amber-700'
                                                                            : 'bg-red-50 text-red-500'
                                                                }`}>
                                                                    {app.status === 'confirmed' ? 'אושר' : app.status === 'pending' ? 'ממתין' : app.status === 'cancelled' ? 'בוטל' : 'הושלם'}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            )}

                            {/* TAB: NUMEROLOGY */}
                            {activeTab === 'numerology' && (
                                <Card className="!p-8 border-stone-100 space-y-8">
                                    <div className="border-b border-stone-100 pb-4 text-right">
                                        <h3 className="text-2xl font-light text-stone-800 mb-1 flex items-center gap-2">
                                            המפה הנומרולוגית שלך
                                            <Award className="w-5 h-5 text-[#7d7463]" />
                                        </h3>
                                        <p className="text-stone-400 text-xs font-light">המספרים שמלווים אותך במסע החיים הנוכחי.</p>
                                    </div>

                                    {numProfile ? (
                                        <div className="space-y-8">
                                            {/* Numbers Display Grid */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-stone-50 p-6 rounded-2xl text-center border border-stone-100 shadow-sm">
                                                    <span className="text-xs text-stone-400 font-bold block mb-2">מספר גורל</span>
                                                    <span className="text-4xl font-light text-[#7d7463] serif italic">{numProfile.destinyNumber || '-'}</span>
                                                </div>
                                                <div className="bg-stone-50 p-6 rounded-2xl text-center border border-stone-100 shadow-sm">
                                                    <span className="text-xs text-stone-400 font-bold block mb-2">יום לידה</span>
                                                    <span className="text-4xl font-light text-[#7d7463] serif italic">{numProfile.dayNumber || '-'}</span>
                                                </div>
                                                <div className="bg-stone-50 p-6 rounded-2xl text-center border border-stone-100 shadow-sm">
                                                    <span className="text-xs text-stone-400 font-bold block mb-2">שנה אישית</span>
                                                    <span className="text-4xl font-light text-[#7d7463] serif italic">{numProfile.personalYear || '-'}</span>
                                                </div>
                                            </div>

                                            {/* Reading Content Interpretation */}
                                            {numProfile.readingContent ? (
                                                <div className="bg-white p-8 rounded-2xl border border-stone-100 text-right leading-relaxed space-y-4">
                                                    <h4 className="font-semibold text-stone-800 text-base mb-2">הכוונה ופרשנות המפה:</h4>
                                                    <p className="text-stone-600 text-sm whitespace-pre-wrap font-light text-[15px]">{numProfile.readingContent}</p>
                                                </div>
                                            ) : (
                                                <p className="text-stone-400 text-sm italic text-center py-6 bg-stone-50/20 rounded-xl">המפה עודכנה, רבקה תזין פירוש מפורט בקרוב. ✨</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 text-stone-400 italic font-light">
                                            המפה הנומרולוגית שלך עדיין לא הוגדרה במערכת.
                                            <p className="mt-2 text-xs opacity-70">רבקה תעדכן את הפרטים בפגישה הבאה שלכם.</p>
                                        </div>
                                    )}
                                </Card>
                            )}

                            {/* TAB: JOURNAL */}
                            {activeTab === 'journal' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
                                        <Button 
                                            onClick={() => setIsAddingJournal(!isAddingJournal)} 
                                            className="rounded-xl flex items-center gap-1.5 text-xs py-2"
                                        >
                                            {isAddingJournal ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            {isAddingJournal ? 'סגירה' : 'דף יומן חדש'}
                                        </Button>
                                        <div className="text-right">
                                            <h3 className="text-xl font-light text-stone-800 flex items-center gap-2 justify-end">
                                                יומן מסע והתבוננות אישי
                                                <BookOpen className="w-5 h-5 text-[#7d7463]" />
                                            </h3>
                                            <p className="text-stone-400 text-xs font-light">מרחב בטוח לכתיבת תחושות, תהליכים ומשימות בעבודה עצמית.</p>
                                        </div>
                                    </div>

                                    {/* Add New Page Form */}
                                    {isAddingJournal && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                            <Card className="!p-6 border-stone-100 text-right space-y-4">
                                                <h4 className="text-sm font-semibold text-stone-700">מה שלומך היום? כתבי ביומן...</h4>
                                                <form onSubmit={handleAddJournalPage} className="space-y-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-stone-500 font-bold">כותרת הדף</label>
                                                        <Input 
                                                            type="text" 
                                                            placeholder="למשל: תובנות מהמפגש השני / הרגשה שבועית" 
                                                            value={journalTitle}
                                                            onChange={(e) => setJournalTitle(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-stone-500 font-bold">תוכן הכתיבה</label>
                                                        <textarea
                                                            placeholder="כתבי כאן את תחושותייך, תובנותייך, מכתבים או כל מחשבה שעולה..."
                                                            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 min-h-[160px] focus:ring-1 focus:ring-[#7d7463] outline-none text-right resize-none text-sm leading-relaxed"
                                                            value={journalContent}
                                                            onChange={(e) => setJournalContent(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    
                                                    {/* Share Checkbox */}
                                                    <div className="flex items-center gap-2 justify-end py-2 select-none">
                                                        <label htmlFor="share" className="text-xs text-stone-600 font-medium cursor-pointer">
                                                            שתפי דף יומן זה עם רבקה (היא תוכל לראות זאת בלוח הניהול שלה)
                                                        </label>
                                                        <input 
                                                            type="checkbox" 
                                                            id="share"
                                                            checked={shareWithTherapist}
                                                            onChange={(e) => setShareWithTherapist(e.target.checked)}
                                                            className="w-4 h-4 rounded border-stone-300 text-[#7d7463] focus:ring-[#7d7463] cursor-pointer"
                                                        />
                                                    </div>

                                                    <div className="flex justify-end pt-2">
                                                        <Button type="submit">שמירה ביומן</Button>
                                                    </div>
                                                </form>
                                            </Card>
                                        </motion.div>
                                    )}

                                    {/* Journal Pages List */}
                                    <div className="space-y-4">
                                        {journalPages.length === 0 ? (
                                            <div className="text-center py-16 bg-white border border-stone-100 rounded-3xl text-stone-400 italic font-light shadow-sm">
                                                היומן שלך עדיין ריק. 
                                                <p className="mt-2 text-xs opacity-70">לחצי על "דף יומן חדש" למעלה כדי להתחיל לכתוב.</p>
                                            </div>
                                        ) : (
                                            journalPages.map(page => (
                                                <Card key={page.id} className="!p-6 border-stone-100/50 bg-white shadow-sm text-right space-y-4 relative">
                                                    <div className="flex justify-between items-center border-b border-stone-50 pb-3">
                                                        <button 
                                                            onClick={() => handleDeleteJournalPage(page.id)}
                                                            className="text-stone-300 hover:text-red-500 text-xs p-1 rounded hover:bg-stone-50 transition-colors"
                                                        >
                                                            מחיקה
                                                        </button>
                                                        <div className="text-right">
                                                            <h4 className="font-semibold text-stone-800 text-base">{page.title}</h4>
                                                            <div className="flex items-center gap-2 justify-end mt-1 text-[10px] text-stone-400">
                                                                <span>{new Date(page.createdAt).toLocaleDateString('he-IL')}</span>
                                                                <span>•</span>
                                                                <span className={page.shareWithTherapist ? 'text-emerald-600 font-bold' : 'text-stone-400'}>
                                                                    {page.shareWithTherapist ? 'משותף עם רבקה' : 'פרטי בלבד'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap font-light">{page.content}</p>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB: TASKS */}
                            {activeTab === 'tasks' && (
                                <Card className="!p-8 border-stone-100 text-right space-y-6">
                                    <div className="border-b border-stone-100 pb-4">
                                        <h3 className="text-2xl font-light text-stone-800 flex items-center gap-2 justify-end">
                                            משימות ותרגילים לבית
                                            <CheckSquare className="w-5 h-5 text-[#7d7463]" />
                                        </h3>
                                        <p className="text-stone-400 text-xs font-light">משימות ותרגילים שרבקה הקציבה עבורך לעבודה עצמית בבית.</p>
                                    </div>

                                    <div className="space-y-4">
                                        {tasksList.length === 0 ? (
                                            <div className="text-center py-16 text-stone-400 italic font-light bg-stone-50/20 rounded-2xl border border-stone-100">
                                                אין לך משימות פעילות כרגע.
                                                <p className="mt-1 text-xs opacity-70">רבקה תעדכן משימות במידת הצורך במפגשים הבאים.</p>
                                            </div>
                                        ) : (
                                            tasksList.map(task => (
                                                <div 
                                                    key={task.id} 
                                                    onClick={() => handleToggleTask(task.id, task.isCompleted)}
                                                    className="bg-stone-50/50 p-5 rounded-2xl border border-stone-100 hover:border-stone-200 transition-all flex items-center justify-between cursor-pointer select-none"
                                                >
                                                    {/* Checkbox */}
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                                                            task.isCompleted 
                                                                ? 'bg-[#7d7463] border-[#7d7463] text-white shadow-sm' 
                                                                : 'border-stone-300 bg-white hover:border-[#7d7463]'
                                                        }`}>
                                                            {task.isCompleted && <Check className="w-4 h-4" />}
                                                        </span>
                                                        <span className="text-[10px] text-stone-400">לחצי לסימון ביצוע</span>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="text-right">
                                                        <h4 className={`font-semibold text-stone-800 text-sm ${task.isCompleted ? 'line-through text-stone-400' : ''}`}>
                                                            {task.title}
                                                        </h4>
                                                        {task.description && <p className="text-xs text-stone-500 mt-1 max-w-xl">{task.description}</p>}
                                                        {task.dueDate && (
                                                            <div className="flex items-center gap-1 justify-end text-[10px] text-stone-400 mt-2">
                                                                <span>יעד: {task.dueDate}</span>
                                                                <Calendar className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Card>
                            )}

                            {/* TAB: INSPIRATION */}
                            {activeTab === 'inspiration' && (
                                <div className="space-y-8 text-right">
                                    {/* Rivka's Recommendations */}
                                    <section className="space-y-4">
                                        <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2 justify-end">
                                            המלצות אישיות מרבקה
                                            <Sparkles className="w-4 h-4 text-[#7d7463]" />
                                        </h3>

                                        {recommendedContent.length === 0 ? (
                                            <p className="text-stone-400 text-sm italic text-center py-8 bg-white rounded-2xl border border-stone-100">אין עדיין תכנים מומלצים במיוחד בשבילך.</p>
                                        ) : (
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {recommendedContent.map(rec => (
                                                    <Card key={rec.content.id} className="!p-6 bg-white border border-stone-100 flex flex-col justify-between h-full relative">
                                                        <div className="space-y-4">
                                                            <span className="text-[10px] uppercase font-bold text-[#7d7463] tracking-wider bg-[#7d7463]/5 px-2.5 py-1 rounded-full inline-block">
                                                                {rec.content.type === 'post' && '📝 פוסט'}
                                                                {rec.content.type === 'podcast' && '🎙️ פודקאסט'}
                                                                {rec.content.type === 'video' && '🎥 סרטון'}
                                                                {rec.content.type === 'article' && '📰 מאמר'}
                                                            </span>
                                                            <h4 className="font-bold text-stone-800 text-base">{rec.content.title}</h4>
                                                            <p className="text-stone-500 text-xs line-clamp-3 font-light leading-relaxed">{rec.content.description}</p>
                                                            
                                                            {rec.note && (
                                                                <div className="bg-[#7d7463]/5 p-3 rounded-xl text-stone-700 text-xs leading-relaxed border-r-2 border-[#7d7463]/40">
                                                                    <strong>הערת רבקה:</strong> {rec.note}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex justify-between items-center pt-4 border-t border-stone-50 mt-4">
                                                            {rec.content.mediaUrl && (
                                                                <a href={rec.content.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#7d7463] font-bold hover:underline">
                                                                    לצפייה / האזנה ←
                                                                </a>
                                                            )}
                                                            <span className="text-[10px] text-stone-400">{new Date(rec.content.publicationDate).toLocaleDateString('he-IL')}</span>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    {/* Saved Content Favorites */}
                                    <section className="space-y-4 pt-6 border-t border-stone-200">
                                        <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2 justify-end">
                                            התכנים השמורים שלי
                                            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                                        </h3>

                                        {savedContent.length === 0 ? (
                                            <p className="text-stone-400 text-sm italic text-center py-8 bg-white rounded-2xl border border-stone-100">עדיין לא שמרת תכנים מועדפים מהאתר.</p>
                                        ) : (
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {savedContent.map(item => (
                                                    <Card key={item.id} className="!p-6 bg-white border border-stone-100 flex flex-col justify-between h-full">
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center">
                                                                <button 
                                                                    onClick={() => handleUnsaveContent(item.id)}
                                                                    className="text-stone-300 hover:text-red-500 transition-colors p-1"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                                <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">
                                                                    {item.type === 'post' && '📝 פוסט'}
                                                                    {item.type === 'podcast' && '🎙️ פודקאסט'}
                                                                    {item.type === 'video' && '🎥 סרטון'}
                                                                    {item.type === 'article' && '📰 מאמר'}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-bold text-stone-800 text-sm">{item.title}</h4>
                                                            <p className="text-stone-500 text-xs line-clamp-3 leading-relaxed">{item.description}</p>
                                                        </div>

                                                        <div className="flex justify-between items-center pt-4 border-t border-stone-50 mt-4">
                                                            {item.mediaUrl && (
                                                                <a href={item.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#7d7463] font-bold hover:underline">
                                                                    פתחי תוכן ←
                                                                </a>
                                                            )}
                                                            <span className="text-[9px] text-stone-400">{new Date(item.publicationDate).toLocaleDateString('he-IL')}</span>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                </div>
                            )}

                            {/* TAB: APPOINTMENTS */}
                            {activeTab === 'appointments' && (
                                <Card className="!p-8 border-stone-100 text-right space-y-6">
                                    <div className="border-b border-stone-100 pb-4">
                                        <h3 className="text-2xl font-light text-stone-800 flex items-center gap-2 justify-end">
                                            המפגשים והפגישות שלך
                                            <Calendar className="w-5 h-5 text-[#7d7463]" />
                                        </h3>
                                        <p className="text-stone-400 text-xs font-light">ריכוז כל הפגישות העתידיות וההיסטוריות שלך בקליניקה.</p>
                                    </div>

                                    <div className="space-y-4">
                                        {appointmentsList.length === 0 ? (
                                            <p className="text-stone-400 text-sm italic text-center py-10 bg-stone-50/20 border border-stone-100 rounded-2xl">אין פגישות רשומות במערכת.</p>
                                        ) : (
                                            appointmentsList.map(app => {
                                                const service = services.find(s => s.id === app.serviceId);
                                                const appDate = new Date(app.date);
                                                const isUpcoming = appDate >= new Date(new Date().setHours(0,0,0,0)) && app.status !== 'cancelled';
                                                
                                                return (
                                                    <div key={app.id} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                        <div className="flex items-center gap-3">
                                                            {isUpcoming && app.status === 'confirmed' && (
                                                                <Button 
                                                                    variant="outline" 
                                                                    onClick={() => handleCancelApp(app)}
                                                                    className="border-red-100 text-red-500 hover:bg-red-50 text-xs py-1.5 px-3 rounded-lg"
                                                                >
                                                                    ביטול מפגש
                                                                </Button>
                                                            )}
                                                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                                                                app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                                                                app.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                                                app.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-stone-100 text-stone-600'
                                                            }`}>
                                                                {app.status === 'confirmed' ? 'אושר' : 
                                                                 app.status === 'pending' ? 'ממתין לאישור' : 
                                                                 app.status === 'cancelled' ? 'בוטל' : 
                                                                 app.status === 'paid' ? 'שולם' : 'הושלם'}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <h4 className="font-semibold text-stone-800 text-sm">{service?.type || 'מפגש טיפולי'}</h4>
                                                            <p className="text-stone-500 text-xs mt-1">
                                                                🗓️ {app.date} בשעה ⏰ {app.time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </Card>
                            )}

                            {/* TAB: BILLING */}
                            {activeTab === 'billing' && (
                                <Card className="!p-8 border-stone-100 text-right space-y-6">
                                    <div className="border-b border-stone-100 pb-4">
                                        <h3 className="text-2xl font-light text-stone-800 flex items-center gap-2 justify-end">
                                            תשלומים, קבלות ומסמכים
                                            <FileText className="w-5 h-5 text-[#7d7463]" />
                                        </h3>
                                        <p className="text-stone-400 text-xs font-light">ריכוז קבלות ומסמכי תשלום שהופקו עבורך בעקבות הטיפולים.</p>
                                    </div>

                                    <div className="space-y-4">
                                        {appointmentsList.filter(a => a.status === 'paid' || a.sumitDocumentId).length === 0 ? (
                                            <p className="text-stone-400 text-sm italic text-center py-10 bg-stone-50/20 border border-stone-100 rounded-2xl">אין מסמכי תשלום זמינים.</p>
                                        ) : (
                                            appointmentsList.filter(a => a.status === 'paid' || a.sumitDocumentId).map(app => {
                                                const service = services.find(s => s.id === app.serviceId);
                                                return (
                                                    <div key={app.id} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-right">
                                                        <div>
                                                            {app.sumitPdfUrl ? (
                                                                <a 
                                                                    href={app.sumitPdfUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="text-xs text-[#7d7463] font-bold hover:underline flex items-center gap-1 bg-[#7d7463]/5 px-3 py-1.5 rounded-lg border border-[#7d7463]/10"
                                                                >
                                                                    הורדת קבלה (PDF) ←
                                                                </a>
                                                            ) : (
                                                                <span className="text-stone-400 text-xs italic">עיבוד קבלה...</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-stone-800 text-sm">{service?.type || 'מפגש טיפולי'}</h4>
                                                            <p className="text-stone-500 text-xs mt-1">
                                                                מזהה קבלה: {app.sumitDocumentId || 'לא מוגדר'} • אמצעי תשלום: {app.paymentMethod === 'Cash' ? 'מזומן' : app.paymentMethod || 'אחר'}
                                                            </p>
                                                            <p className="text-[10px] text-stone-400 mt-1">שולם בתאריך: {app.date}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </Card>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ClientPortal;

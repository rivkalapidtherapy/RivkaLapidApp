import React, { useState, useEffect } from 'react';
import { Appointment, JourneyNote, NumerologyProfile, ClientReflection, ClientTask, ContentItem } from '../types';
import { 
  getJourneyNotes, addJourneyNote, sendWhatsAppMessage,
  getNumerologyProfile, saveNumerologyProfile,
  getClientTasks, addClientTask, deleteClientTask,
  getSharedReflectionsForAdmin,
  getClientRecommendedContent, recommendContentForClient, removeRecommendationForClient,
  getContentHubItems
} from '../services/bookingService';
import { Card, Button, Input } from './UI';
import { User, MessageSquare, Copy, CheckCircle, Award, CheckSquare, BookOpen, Heart, Trash2, Calendar, PlusCircle } from 'lucide-react';
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

    // Client Sub-Tab navigation
    const [clientSubTab, setClientSubTab] = useState<'notes' | 'numerology' | 'tasks' | 'journal' | 'recommendations'>('notes');

    // Data for personal area features
    const [numProfile, setNumProfile] = useState<NumerologyProfile | null>(null);
    const [tasks, setTasks] = useState<ClientTask[]>([]);
    const [sharedReflections, setSharedReflections] = useState<ClientReflection[]>([]);
    const [recommendations, setRecommendations] = useState<{ content: ContentItem, note?: string }[]>([]);
    const [allContentItems, setAllContentItems] = useState<ContentItem[]>([]);
    
    // Numerology form states
    const [birthDate, setBirthDate] = useState('');
    const [destinyNumber, setDestinyNumber] = useState<number | ''>('');
    const [dayNumber, setDayNumber] = useState<number | ''>('');
    const [personalYear, setPersonalYear] = useState<number | ''>('');
    const [readingContent, setReadingContent] = useState('');
    
    // Task form states
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskDueDate, setTaskDueDate] = useState('');
    
    // Recommendation form states
    const [selectedContentId, setSelectedContentId] = useState('');
    const [recommendationNote, setRecommendationNote] = useState('');

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
        if (selectedClient) {
            loadClientData(selectedClient.email, selectedClient.phone);
        }
    }, [selectedClientPhone]);

    const loadClientData = async (email: string, phone: string) => {
        setLoadingNotes(true);
        try {
            const [fetchedNotes, fetchedNum, fetchedTasks, fetchedReflections, fetchedRecs, fetchedCatalog] = await Promise.all([
                getJourneyNotes(phone),
                getNumerologyProfile(email),
                getClientTasks(email),
                getSharedReflectionsForAdmin(email),
                getClientRecommendedContent(email),
                getContentHubItems()
            ]);
            setNotes(fetchedNotes);
            setNumProfile(fetchedNum);
            setTasks(fetchedTasks);
            setSharedReflections(fetchedReflections);
            setRecommendations(fetchedRecs);
            setAllContentItems(fetchedCatalog);
            
            // Populate numerology form
            if (fetchedNum) {
                setBirthDate(fetchedNum.birthDate || '');
                setDestinyNumber(fetchedNum.destinyNumber || '');
                setDayNumber(fetchedNum.dayNumber || '');
                setPersonalYear(fetchedNum.personalYear || '');
                setReadingContent(fetchedNum.readingContent || '');
            } else {
                setBirthDate('');
                setDestinyNumber('');
                setDayNumber('');
                setPersonalYear('');
                setReadingContent('');
            }
        } catch (err) {
            console.error("Error loading client details:", err);
        } finally {
            setLoadingNotes(false);
        }
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

    const handleSaveNumerology = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;
        
        try {
            await saveNumerologyProfile({
                clientEmail: selectedClient.email,
                birthDate,
                destinyNumber: destinyNumber === '' ? undefined : Number(destinyNumber),
                dayNumber: dayNumber === '' ? undefined : Number(dayNumber),
                personalYear: personalYear === '' ? undefined : Number(personalYear),
                readingContent
            });
            alert("המפה הנומרולוגית נשמרה ועודכנה באזור האישי של הלקוח/ה!");
            loadClientData(selectedClient.email, selectedClient.phone);
        } catch (err) {
            console.error(err);
            alert("שגיאה בשמירת המפה");
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !taskTitle.trim()) return;
        
        const task = await addClientTask({
            clientEmail: selectedClient.email,
            title: taskTitle,
            description: taskDesc,
            dueDate: taskDueDate
        });
        
        if (task) {
            setTasks([task, ...tasks]);
            setTaskTitle('');
            setTaskDesc('');
            setTaskDueDate('');
        }
    };

    const handleDeleteTask = async (id: string) => {
        await deleteClientTask(id);
        setTasks(tasks.filter(t => t.id !== id));
    };

    const handleRecommendContent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !selectedContentId) return;
        
        await recommendContentForClient(selectedClient.email, selectedContentId, recommendationNote);
        
        // Reload recommendations
        const fetchedRecs = await getClientRecommendedContent(selectedClient.email);
        setRecommendations(fetchedRecs);
        setSelectedContentId('');
        setRecommendationNote('');
    };

    const handleRemoveRecommendation = async (contentId: string) => {
        if (!selectedClient) return;
        await removeRecommendationForClient(selectedClient.email, contentId);
        setRecommendations(recommendations.filter(r => r.content.id !== contentId));
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
                                <div className="text-right">
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

            {/* Main Content */}
            <div className="lg:col-span-2">
                {selectedClient ? (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        {/* Client Info Card */}
                        <Card className="!p-6 border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white shadow-sm">
                            <div className="text-right">
                                <h2 className="text-2xl font-light text-stone-800 mb-1">{selectedClient.name}</h2>
                                <p className="text-stone-400 text-xs font-mono">{selectedClient.email} • {selectedClient.phone}</p>
                            </div>
                            <div className="text-left w-full md:w-auto">
                                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">גישה מהירה לאזור האישי</p>
                                <div className="flex items-center gap-2 justify-end">
                                    <Button variant="outline" onClick={() => {
                                        const link = `${window.location.origin}/?portal=${selectedClientPhone}`;
                                        const message = `שלום ${selectedClient.name} 💕\nמצורף הקישור ליומן המסע האישי שלך:\n${link}`;
                                        sendWhatsAppMessage(selectedClient.phone, message);
                                    }} className="rounded-xl flex items-center gap-2 bg-green-50 text-green-600 border-green-200 hover:bg-green-100 text-xs py-2 px-4 shadow-sm hover:scale-105 transition-all">
                                        שליחה בוואטסאפ
                                    </Button>
                                    <Button variant="outline" onClick={copyMagicLink} className={`rounded-xl flex items-center gap-2 text-xs py-2 px-4 shadow-sm hover:scale-105 transition-all ${copiedLink ? 'bg-green-50 text-green-600 border-green-200' : ''}`}>
                                        {copiedLink ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedLink ? 'הועתק' : 'העתק קישור'}
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Client Sub-Tabs Navigation */}
                        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl overflow-x-auto">
                            {[
                                { id: 'notes', label: 'סיכומי טיפול', icon: MessageSquare },
                                { id: 'numerology', label: 'מפה נומרולוגית', icon: Award },
                                { id: 'tasks', label: 'משימות לבית', icon: CheckSquare },
                                { id: 'journal', label: 'יומן שיתופי', icon: BookOpen },
                                { id: 'recommendations', label: 'המלצת תכנים', icon: Heart }
                            ].map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setClientSubTab(tab.id as any)}
                                        className={`flex items-center justify-center gap-2 flex-1 min-w-[110px] py-2.5 rounded-lg text-xs font-medium transition-all ${clientSubTab === tab.id
                                            ? 'bg-white text-stone-800 shadow-sm font-semibold'
                                            : 'text-stone-500 hover:text-stone-800'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab Content Rendering */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={clientSubTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* TAB: NOTES */}
                                {clientSubTab === 'notes' && (
                                    <Card className="!p-8 border-stone-100">
                                        <h3 className="text-lg font-light text-stone-800 mb-6 flex items-center gap-2">
                                            <MessageSquare className="w-5 h-5 text-[#7d7463]" />
                                            סיכומי פגישה / יומן מסע (יופיעו באזור האישי)
                                        </h3>

                                        <form onSubmit={handleAddNote} className="mb-8 space-y-4">
                                            <textarea
                                                placeholder="כתיבת סיכום או מסר לאזור האישי..."
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
                                                    <div key={note.id} className="bg-stone-50/50 p-6 rounded-2xl border border-stone-100 text-right">
                                                        <div className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-3">
                                                            {new Date(note.createdAt).toLocaleString('he-IL')}
                                                        </div>
                                                        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </Card>
                                )}

                                {/* TAB: NUMEROLOGY */}
                                {clientSubTab === 'numerology' && (
                                    <Card className="!p-8 border-stone-100">
                                        <h3 className="text-lg font-light text-stone-800 mb-6 flex items-center gap-2">
                                            <Award className="w-5 h-5 text-[#7d7463]" />
                                            עריכת מפה נומרולוגית אישית
                                        </h3>

                                        <form onSubmit={handleSaveNumerology} className="space-y-6">
                                            <div className="grid md:grid-cols-4 gap-4">
                                                <div className="space-y-2 text-right">
                                                    <label className="text-xs font-bold text-stone-500">תאריך לידה</label>
                                                    <Input 
                                                        type="text" 
                                                        placeholder="DD.MM.YYYY" 
                                                        value={birthDate}
                                                        onChange={(e) => setBirthDate(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2 text-right">
                                                    <label className="text-xs font-bold text-stone-500">מספר גורל</label>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="למשל 7" 
                                                        value={destinyNumber}
                                                        onChange={(e) => setDestinyNumber(e.target.value !== '' ? Number(e.target.value) : '')}
                                                    />
                                                </div>
                                                <div className="space-y-2 text-right">
                                                    <label className="text-xs font-bold text-stone-500">מספר יום לידה</label>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="למשל 2" 
                                                        value={dayNumber}
                                                        onChange={(e) => setDayNumber(e.target.value !== '' ? Number(e.target.value) : '')}
                                                    />
                                                </div>
                                                <div className="space-y-2 text-right">
                                                    <label className="text-xs font-bold text-stone-500">שנה אישית</label>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="למשל 9" 
                                                        value={personalYear}
                                                        onChange={(e) => setPersonalYear(e.target.value !== '' ? Number(e.target.value) : '')}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-right">
                                                <label className="text-xs font-bold text-stone-500">פירוש המפה הנומרולוגית</label>
                                                <textarea
                                                    placeholder="פרשנות אישית של המפה הנומרולוגית עבור המטופל/ת. תוכלי להשתמש בסיכומי המפגש והכוונות לדרך..."
                                                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 min-h-[200px] focus:ring-1 focus:ring-[#7d7463] outline-none text-right resize-none"
                                                    value={readingContent}
                                                    onChange={(e) => setReadingContent(e.target.value)}
                                                />
                                            </div>

                                            <div className="flex justify-end pt-4">
                                                <Button type="submit">שמירת מפה ופרשנות</Button>
                                            </div>
                                        </form>
                                    </Card>
                                )}

                                {/* TAB: TASKS / HOMEWORK */}
                                {clientSubTab === 'tasks' && (
                                    <Card className="!p-8 border-stone-100">
                                        <h3 className="text-lg font-light text-stone-800 mb-6 flex items-center gap-2">
                                            <CheckSquare className="w-5 h-5 text-[#7d7463]" />
                                            משימות ותרגילים לבית
                                        </h3>

                                        {/* Add Task Form */}
                                        <form onSubmit={handleAddTask} className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-4 mb-8 text-right">
                                            <h4 className="text-sm font-semibold text-stone-700 mb-2">הקצאת משימה חדשה</h4>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs text-stone-500">כותרת המשימה</label>
                                                    <Input 
                                                        type="text" 
                                                        placeholder="למשל: תרגול נשימות בוקר 5 דקות" 
                                                        value={taskTitle}
                                                        onChange={(e) => setTaskTitle(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs text-stone-500">תאריך יעד (דדליין)</label>
                                                    <Input 
                                                        type="date" 
                                                        value={taskDueDate}
                                                        onChange={(e) => setTaskDueDate(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-stone-500">פירוט והוראות ביצוע</label>
                                                <textarea
                                                    placeholder="הוראות מפורטות לביצוע המשימה בבית..."
                                                    className="w-full bg-white border border-stone-200 rounded-xl p-3 min-h-[80px] focus:ring-1 focus:ring-[#7d7463] outline-none text-right resize-none text-sm"
                                                    value={taskDesc}
                                                    onChange={(e) => setTaskDesc(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <Button type="submit" className="text-xs py-2">הקצי משימה ללקוח</Button>
                                            </div>
                                        </form>

                                        {/* Task list */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-stone-500 text-right mb-4">משימות שהוקצו</h4>
                                            {tasks.length === 0 ? (
                                                <p className="text-stone-400 text-sm italic text-center py-6 bg-stone-50/30 rounded-xl border border-dashed border-stone-200">לא הוקצו משימות ללקוח זה.</p>
                                            ) : (
                                                tasks.map(task => (
                                                    <div key={task.id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex justify-between items-center text-right">
                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                onClick={() => handleDeleteTask(task.id)}
                                                                className="text-stone-300 hover:text-red-500 p-1.5 transition-colors rounded-lg hover:bg-stone-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${task.isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                {task.isCompleted ? 'בוצע' : 'טרם בוצע'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h5 className={`font-semibold text-sm ${task.isCompleted ? 'line-through text-stone-400' : 'text-stone-800'}`}>{task.title}</h5>
                                                            {task.description && <p className="text-xs text-stone-500 mt-1">{task.description}</p>}
                                                            {task.dueDate && (
                                                                <p className="text-[10px] text-stone-400 mt-1.5 flex items-center gap-1 justify-end">
                                                                    {task.dueDate} <Calendar className="w-3 h-3" />
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </Card>
                                )}

                                {/* TAB: SHARED JOURNAL */}
                                {clientSubTab === 'journal' && (
                                    <Card className="!p-8 border-stone-100 text-right">
                                        <h3 className="text-lg font-light text-stone-800 mb-6 flex items-center gap-2 justify-end">
                                            יומן מסע והתבוננות שיתופי
                                            <BookOpen className="w-5 h-5 text-[#7d7463]" />
                                        </h3>
                                        <p className="text-xs text-stone-500 mb-6">כאן מופיעים דפי יומן והתבוננות שהלקוח/ה כתב/ה באזור האישי שלו/ה ובחר/ה במפורש לשתף איתך לקראת הטיפול.</p>

                                        <div className="space-y-4">
                                            {sharedReflections.length === 0 ? (
                                                <p className="text-stone-400 text-sm italic text-center py-10 bg-stone-50/50 rounded-2xl">
                                                    הלקוח/ה טרם שיתפ/ה דפי יומן איתך.
                                                </p>
                                            ) : (
                                                sharedReflections.map(ref => (
                                                    <div key={ref.id} className="bg-stone-50/50 p-6 rounded-2xl border border-stone-100 space-y-3">
                                                        <div className="flex justify-between items-center text-xs text-stone-400">
                                                            <span>{new Date(ref.createdAt).toLocaleDateString('he-IL')}</span>
                                                            <h5 className="font-semibold text-stone-700 text-base">{ref.title}</h5>
                                                        </div>
                                                        <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap pt-2 border-t border-stone-100/50">{ref.content}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </Card>
                                )}

                                {/* TAB: RECOMMEND CONTENT */}
                                {clientSubTab === 'recommendations' && (
                                    <Card className="!p-8 border-stone-100 text-right">
                                        <h3 className="text-lg font-light text-stone-800 mb-6 flex items-center gap-2 justify-end">
                                            המלצת תכנים מתוך ה-Content Hub
                                            <Heart className="w-5 h-5 text-[#7d7463]" />
                                        </h3>

                                        {/* Recommend Content Form */}
                                        <form onSubmit={handleRecommendContent} className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-4 mb-8">
                                            <h4 className="text-sm font-semibold text-stone-700 mb-2">המלצה על תוכן חדש</h4>
                                            <div className="space-y-2">
                                                <label className="text-xs text-stone-500">בחרי תוכן להמלצה</label>
                                                <select
                                                    className="w-full bg-white border border-stone-200 rounded-xl p-3 focus:ring-1 focus:ring-[#7d7463] outline-none text-right text-sm"
                                                    value={selectedContentId}
                                                    onChange={(e) => setSelectedContentId(e.target.value)}
                                                    required
                                                >
                                                    <option value="">-- בחרי פוסט/פודקאסט/סרטון --</option>
                                                    {allContentItems.map(item => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.type === 'post' && '📝'}
                                                            {item.type === 'podcast' && '🎙️'}
                                                            {item.type === 'video' && '🎥'}
                                                            {item.type === 'article' && '📰'}
                                                            {' '}{item.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-stone-500">הערה / למה כדאי לה לקרוא את זה? (יופיע לה באזור האישי)</label>
                                                <textarea
                                                    placeholder="למשל: רונית, דיברנו על הנושא הזה במפגש האחרון, המאמר הזה יעזור לך להבין לעומק..."
                                                    className="w-full bg-white border border-stone-200 rounded-xl p-3 min-h-[85px] focus:ring-1 focus:ring-[#7d7463] outline-none text-right resize-none text-sm"
                                                    value={recommendationNote}
                                                    onChange={(e) => setRecommendationNote(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <Button type="submit" disabled={!selectedContentId} className="text-xs py-2">המלץ על תוכן זה</Button>
                                            </div>
                                        </form>

                                        {/* Current recommendations */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-stone-500 mb-4">תכנים מומלצים כעת</h4>
                                            {recommendations.length === 0 ? (
                                                <p className="text-stone-400 text-sm italic text-center py-6 bg-stone-50/30 rounded-xl border border-dashed border-stone-200">אין תכנים מומלצים כרגע.</p>
                                            ) : (
                                                recommendations.map(rec => (
                                                    <div key={rec.content.id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex justify-between items-center">
                                                        <button 
                                                            onClick={() => handleRemoveRecommendation(rec.content.id)}
                                                            className="text-stone-300 hover:text-red-500 p-1.5 transition-colors rounded-lg hover:bg-stone-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <div className="text-right">
                                                            <h5 className="font-semibold text-sm text-stone-800">
                                                                {rec.content.type === 'post' && '📝 [פוסט] '}
                                                                {rec.content.type === 'podcast' && '🎙️ [פודקאסט] '}
                                                                {rec.content.type === 'video' && '🎥 [סרטון] '}
                                                                {rec.content.type === 'article' && '📰 [מאמר] '}
                                                                {rec.content.title}
                                                            </h5>
                                                            {rec.note && <p className="text-xs text-[#7d7463] mt-1.5 bg-[#7d7463]/5 p-2 rounded-lg leading-relaxed inline-block">הערת רבקה: {rec.note}</p>}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </Card>
                                )}
                            </motion.div>
                        </AnimatePresence>
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

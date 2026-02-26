import React, { useState, useEffect } from 'react';
import { Appointment, Service } from '../types';
import { Card, Button } from './UI';
import { Sun, Heart, Coffee, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminMorningZenTabProps {
    appointments: Appointment[];
    services: Service[];
}

export const AdminMorningZenTab: React.FC<AdminMorningZenTabProps> = ({ appointments, services }) => {
    const [quote, setQuote] = useState("");

    const todayStr = new Date().toISOString().split('T')[0];
    const todayApps = appointments
        .filter(a => a.date === todayStr && a.status !== 'cancelled')
        .sort((a, b) => a.time.localeCompare(b.time));

    useEffect(() => {
        const quotes = [
            "האור שאת מקרינה מאיר את דרכם של אחרים. יום נפלא, רבקה.",
            "כל מפגש היום הוא הזדמנות לריפוי ולצמיחה. סמכי על הדרך שלך.",
            "שחררי את מה שהיה, פתחי את הלב למה שהווה. היום זה יום חדש.",
            "האנרגיה שאת מביאה איתך היא התרופה הטובה מכולן. בוקר קסום.",
            "קחי רגע לנשום עמוק לפני שאת מתחילה. את מוחזקת ואהובה.",
            "כח הריפוי זורם דרכך אל כל מי שיפגוש בך היום. בהצלחה!"
        ];
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, []);

    return (
        <div className="space-y-12 max-w-4xl mx-auto">
            {/* Hero Zen Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#f5f2ed] to-white border border-stone-100 p-10 md:p-16 text-center shadow-lg shadow-[#7d7463]/5"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#7d7463]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7d7463]/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />

                <div className="relative z-10 space-y-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#7d7463]/10 rounded-full flex items-center justify-center text-[#7d7463]">
                        <Sun className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-4xl md:text-5xl font-light text-stone-800 tracking-tight leading-tight">
                            בוקר טוב, רבקה.
                        </h2>
                        <p className="mt-4 text-xl text-stone-500 font-light italic serif">"{quote}"</p>
                    </div>
                </div>
            </motion.div>

            {/* Today's Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
            >
                <div className="flex items-center gap-3 px-2">
                    <Sparkles className="w-6 h-6 text-[#7d7463]" />
                    <h3 className="text-2xl font-light text-stone-800">הלו"ז שלך להיום</h3>
                    <span className="bg-[#7d7463]/10 text-[#7d7463] px-3 py-1 rounded-full text-xs font-bold leading-none flex items-center h-7">
                        {todayApps.length} טיפולים
                    </span>
                </div>

                {todayApps.length === 0 ? (
                    <Card className="!p-12 text-center bg-white/50 border-dashed">
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mx-auto mb-4">
                            <Coffee className="w-8 h-8" />
                        </div>
                        <p className="text-lg text-stone-500 font-light">אין לך פגישות מתוכננות להיום.</p>
                        <p className="text-sm text-stone-400 mt-2">זמן מצוין להתמקד בעצמך, לשתות קפה בשקט או לנוח.</p>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {todayApps.map((app, idx) => {
                            const service = services.find(s => s.id === app.serviceId);
                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + (idx * 0.1) }}
                                    key={app.id}
                                >
                                    <Card className="!p-6 border-l-4 border-l-[#7d7463] hover:shadow-md transition-shadow cursor-default bg-white group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-stone-400 group-hover:text-[#7d7463] transition-colors" />
                                                <span className="font-bold text-stone-700 text-lg tracking-wider">{app.time}</span>
                                            </div>
                                            <div className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${app.status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                {app.status === 'confirmed' ? 'מאושר' : 'ממתין לאישור'}
                                            </div>
                                        </div>

                                        <h4 className="text-xl font-semibold text-stone-800 mb-1">{app.clientName}</h4>
                                        <p className="text-sm text-stone-500 flex items-center gap-2">
                                            <Heart className="w-3 h-3 text-[#7d7463]/50" />
                                            {service?.type || 'מפגש שנקבע'}
                                        </p>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

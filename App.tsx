
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppView, Appointment } from './types';
import BookingFlow from './components/BookingFlow';
import AdminDashboard from './components/AdminDashboard';
import ClientPortal from './components/ClientPortal';
import { getDailyGreeting } from './services/geminiService';
import { Button } from './components/UI';
import { SERVICES as INITIAL_SERVICES, COLORS } from './constants';
import { getAdminServices } from './services/bookingService';
import { Service } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [lastAppointment, setLastAppointment] = useState<Appointment | null>(null);
  const [greeting, setGreeting] = useState("אם הגעת לכאן, כנראה שמשהו בתוכך מבקש שינוי - אולי זה חסמים רגשיים, חוסר ביטחון עצמי, קושי למציאת זוגיות, תקיעות במערכות יחסים או שהנך נמצא/ת בצומת דרכים בחיים והנך מחפש/ת כיוון.");
  const [scrolled, setScrolled] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [portalPhone, setPortalPhone] = useState<string | null>(null);

  // גלילה לראש הדף בכל החלפת תצוגה
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Fetch real services from DB
    getAdminServices().then(data => {
      if (data && data.length > 0) {
        setServices(data);
      }
    });

    const urlParams = new URL(window.location.href);
    const portalPhoneParam = urlParams.searchParams.get('portal');
    if (portalPhoneParam) {
      setPortalPhone(portalPhoneParam);
      setView('portal');
      // Clean up URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookingComplete = (app: Appointment) => {
    setLastAppointment(app);
    setView('confirmation');
  };

  const renderContent = () => {
    switch (view) {
      case 'home':
        return (
          <div className="relative">
            {/* Editorial Hero Section */}
            <section className="relative min-h-screen flex flex-col md:flex-row items-stretch overflow-hidden bg-[#f5f2ed]">
              {/* Left Content Side */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col justify-center px-8 md:px-20 py-32 relative z-10"
              >
                {/* Mobile background image */}
                <div className="md:hidden absolute inset-0 z-[-1] overflow-hidden">
                  <img
                    src="/rivka.png"
                    alt=""
                    className="w-[120%] h-auto object-cover opacity-25 absolute -right-10 top-10"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#f5f2ed]"></div>
                </div>

                <div className="max-w-xl space-y-12">
                  <div className="space-y-6">
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-[11px] md:text-xs uppercase tracking-[0.6em] text-[#7d7463] font-bold block"
                    >
                      רבקה לפיד
                    </motion.span>
                    <h1 className="text-6xl md:text-8xl font-light text-[#2d2a26] leading-[0.9] tracking-tighter">
                      תהליך ליווי <br />
                      <span className="serif italic font-normal text-[#7d7463]">נומרולוגי רגשי</span> <br />
                      אישי
                    </h1>
                    <p className="text-[#2d2a26]/60 text-sm md:text-base uppercase tracking-[0.3em] font-medium">
                      מטפלת רגשית, נומרולוגית ומנחת סדנאות
                    </p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/40 backdrop-blur-sm border-y border-[#2d2a26]/10 py-16 px-10 -mx-10 shadow-sm"
                  >
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1, duration: 1 }}
                      className="text-[#2d2a26] text-2xl md:text-4xl font-light leading-tight serif italic text-center md:text-right"
                    >
                      {greeting}
                    </motion.p>
                  </motion.div>

                  <div className="pt-8 flex flex-col sm:flex-row items-center gap-8">
                    <Button
                      onClick={() => setView('booking')}
                      className="w-full sm:w-auto min-w-[260px] text-lg py-5 shadow-2xl shadow-[#7d7463]/20"
                    >
                      לקביעת מפגש אישי
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Right Image Side */}
              <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                className="hidden md:flex flex-1 relative items-center justify-center bg-[#f5f2ed]"
              >
                <div className="relative w-[80%] max-w-lg">
                  <div className="absolute inset-0 bg-[#7d7463]/10 rounded-[50%_/_40%] blur-3xl animate-pulse"></div>
                  <img
                    src="/rivka.png"
                    alt="רבקה לפיד"
                    className="relative z-10 w-full h-auto object-contain drop-shadow-2xl"
                  />
                </div>
              </motion.div>
            </section>

            {/* Visual Service Grid */}
            <section className="py-32 px-8 bg-white">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24 space-y-6">
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-xs uppercase tracking-[0.5em] text-[#7d7463] font-bold"
                  >
                    3 מסלולי ליווי
                  </motion.span>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-7xl font-light text-[#2d2a26]"
                  >
                    בחרי את התהליך המדויק עבורך
                  </motion.h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {services.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -10 }}
                      className="group relative h-[650px] overflow-hidden rounded-sm cursor-pointer bg-[#f5f2ed]"
                      onClick={() => {
                        setSelectedServiceId(service.id);
                        setView('booking');
                      }}
                    >
                      {/* Background Image */}
                      <motion.div
                        initial={{ filter: "grayscale(100%)", opacity: 0.7 }}
                        whileInView={{ filter: "grayscale(0%)", opacity: 1 }}
                        viewport={{ amount: 0.9 }}
                        transition={{ duration: 1.2 }}
                        className="absolute inset-0 transition-transform duration-[2s] group-hover:scale-110"
                      >
                        <img
                          src={service.imageUrl}
                          alt={service.type}
                          className="w-full h-full object-cover"
                        />
                        {/* Darker Overlay for Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2d2a26] via-[#2d2a26]/60 to-transparent opacity-90"></div>
                      </motion.div>

                      {/* Content Overlay */}
                      <div className="absolute inset-0 p-10 flex flex-col justify-end text-white text-right">
                        <span className="text-xs uppercase tracking-[0.4em] mb-6 opacity-60">0{index + 1}.</span>
                        <h3 className="text-3xl font-light mb-4 tracking-tight leading-tight">{service.type}</h3>
                        <div className="text-5xl font-bold mb-8 text-[#7d7463] serif italic tracking-tighter">₪{service.price}</div>

                        <p className="text-white/95 text-base font-light leading-relaxed mb-10">
                          {service.description}
                        </p>

                        <div className="pt-8 border-t border-white/20 flex justify-between items-center">
                          <span className="text-[10px] tracking-[0.3em] uppercase font-bold">תיאום עכשיו</span>
                          <motion.span
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-xl"
                          >
                            ←
                          </motion.span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Welcome Section from Document */}
            <section className="py-24 px-8 bg-[#f5f2ed] border-y border-[#2d2a26]/5">
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <motion.h2
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="text-3xl md:text-4xl font-light text-[#2d2a26] serif italic"
                >
                  ברוכים הבאים לתהליך הליווי שלי!
                </motion.h2>
                <p className="text-[#2d2a26]/70 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
                  תהליך עומק שמייצר תנועה פנימית באמצעות כלים פרקטיים שעובדים באמת, שבסופו של דבר, מקבלים ביטוי במציאות.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                  {[
                    { title: "אבחון נומרולוגי מדויק", icon: "🔢" },
                    { title: "עבודה רגשית ממוקדת", icon: "🧘" },
                    { title: "כלים תודעתיים ורוחניים", icon: "✨" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-8 bg-white/50 rounded-sm border border-[#2d2a26]/5"
                    >
                      <div className="text-3xl mb-4">{item.icon}</div>
                      <h4 className="text-sm uppercase tracking-widest font-bold text-[#2d2a26]">{item.title}</h4>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Quote Section */}
            <section className="py-48 px-8 bg-[#f5f2ed]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="max-w-4xl mx-auto text-center space-y-12"
              >
                <div className="w-20 h-20 bg-[#7d7463]/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-[#7d7463] text-3xl">✨</span>
                </div>
                <blockquote className="text-4xl md:text-6xl font-light text-[#2d2a26] leading-tight italic serif">
                  "הקשבה אמיתית אינה רק לאוזניים, היא נוכחות של הלב במרחב שבין המספרים למילים."
                </blockquote>
                <div className="h-[1px] w-24 bg-[#2d2a26]/10 mx-auto"></div>
              </motion.div>
            </section>
          </div>
        );
      case 'booking':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-28 md:pt-32"
          >
            <BookingFlow
              initialServiceId={selectedServiceId}
              onComplete={handleBookingComplete}
              onCancel={() => { setView('home'); setSelectedServiceId(null); }}
            />
          </motion.div>
        );
      case 'admin':
        if (!isAdminAuthenticated) {
          return (
            <div className="max-w-md mx-auto py-40 px-6 text-center space-y-8 animate-fade-in">
              <h2 className="text-3xl font-light text-[#2d2a26]">כניסת מנהלת</h2>
              <div className="space-y-4">
                <input
                  type="password"
                  autoFocus
                  placeholder="סיסמה..."
                  className="w-full border-b border-[#2d2a26]/10 py-3 focus:border-[#7d7463] outline-none transition-all duration-500 bg-transparent text-center"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && adminPassword === "1989") {
                      setIsAdminAuthenticated(true);
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    if (adminPassword === "1989") {
                      setIsAdminAuthenticated(true);
                    } else {
                      alert("סיסמה שגויה");
                    }
                  }}
                  className="w-full"
                >
                  כניסה
                </Button>
                <button onClick={() => setView('home')} className="text-xs text-stone-400 uppercase tracking-widest hover:text-stone-800 transition-colors">ביטול</button>
              </div>
            </div>
          );
        }
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 pt-20"
          >
            <AdminDashboard />
          </motion.div>
        );
      case 'confirmation':
        return (
          <div className="max-w-2xl mx-auto py-40 px-6 text-center space-y-12 animate-fade-in relative">
            <div className="w-24 h-24 bg-[#7d7463] rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#7d7463]/30">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl text-stone-800 font-light">בקשת הטיפול התקבלה</h2>
              <p className="text-stone-500 text-lg md:text-xl font-light leading-relaxed max-w-md mx-auto">
                תודה {lastAppointment?.clientName}, הבקשה למפגש שלך ב-{lastAppointment?.date} בשעה {lastAppointment?.time} נשמרה במערכת וממתינה לאישור סופי של רבקה.
              </p>
            </div>
            <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-4">
              <Button onClick={() => {
                if (lastAppointment) {
                  const service = services.find(s => s.id === lastAppointment.serviceId);
                  const cleanPhone = "0547394577"; // מספר הקליניקה המעודכן
                  const message = `שלום רבקה! קבעתי במערכת בקשה למפגש ל${service?.type} ב-${lastAppointment.date} בשעה ${lastAppointment.time}. אשמח לאישור סופי עבור התור! ✨`;
                  window.open(`https://wa.me/972${cleanPhone.substring(1)}?text=${encodeURIComponent(message)}`, '_blank');
                }
              }} className="min-w-[220px] bg-green-600 hover:bg-green-700 border-none">
                שליחת הודעת וואטסאפ לאישור התור
              </Button>
              <Button variant="outline" onClick={() => setView('home')} className="min-w-[220px]">חזרה לראשי</Button>
            </div>
          </div>
        );

      case 'portal':
        if (!portalPhone) return null;
        return <ClientPortal clientPhone={portalPhone} onClose={() => setView('home')} />;
    }
  };

  return (
    <div className="min-h-screen selection:bg-[#7d7463] selection:text-white bg-[#f5f2ed] relative text-right overflow-x-hidden" dir="rtl">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 px-8 ${scrolled || isMobileMenuOpen ? 'bg-white shadow-lg h-20' : 'bg-[#f5f2ed]/80 backdrop-blur-md h-24 border-b border-[#2d2a26]/5'} flex items-center`}>
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center flex-row-reverse">
          <div className="cursor-pointer group flex items-center gap-6" onClick={() => setView('home')}>
            {/* Logo Placeholder */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border border-[#2d2a26]/20 rounded-full flex items-center justify-center group-hover:border-[#7d7463] transition-colors duration-500">
                <div className="w-8 h-8 bg-[#2d2a26]/5 rounded-full flex items-center justify-center text-[10px] text-[#2d2a26]/40 font-bold group-hover:bg-[#7d7463]/10 group-hover:text-[#7d7463]">
                  RL
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl tracking-tighter font-semibold group-hover:text-[#7d7463] transition-colors duration-500 uppercase leading-none text-[#2d2a26]">
                  RIVKA<span className="font-light text-[#2d2a26]/40 ml-1 italic serif lowercase">lapid</span>
                </span>
                <span className="text-[8px] uppercase tracking-[0.4em] text-[#2d2a26]/60 group-hover:text-[#7d7463]/80 transition-colors">Therapy & Numerology</span>
              </div>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-12 space-x-reverse text-[11px] uppercase tracking-[0.3em] font-bold text-[#2d2a26]">
            <button onClick={() => setView('home')} className={`hover:text-[#7d7463] transition-colors duration-300 ${view === 'home' ? 'text-[#7d7463]' : ''}`}>בית</button>
            <button onClick={() => setView('booking')} className={`hover:text-[#7d7463] transition-colors duration-300 ${view === 'booking' ? 'text-[#7d7463]' : ''}`}>מפגשים</button>
            <button onClick={() => setView('admin')} className={`hover:text-[#7d7463] transition-colors duration-300 ${view === 'admin' ? 'text-[#7d7463]' : ''}`}>ניהול</button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-[#2d2a26] p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`h-0.5 w-full bg-current transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`h-0.5 w-full bg-current transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`h-0.5 w-full bg-current transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 bg-white border-t border-stone-100 shadow-xl p-8 flex flex-col gap-6 text-center md:hidden"
            >
              <button
                onClick={() => { setView('home'); setIsMobileMenuOpen(false); }}
                className={`text-sm uppercase tracking-widest font-bold ${view === 'home' ? 'text-[#7d7463]' : 'text-[#2d2a26]'}`}
              >
                בית
              </button>
              <button
                onClick={() => { setView('booking'); setIsMobileMenuOpen(false); }}
                className={`text-sm uppercase tracking-widest font-bold ${view === 'booking' ? 'text-[#7d7463]' : 'text-[#2d2a26]'}`}
              >
                מפגשים
              </button>
              <button
                onClick={() => { setView('admin'); setIsMobileMenuOpen(false); }}
                className={`text-sm uppercase tracking-widest font-bold ${view === 'admin' ? 'text-[#7d7463]' : 'text-[#2d2a26]'}`}
              >
                ניהול
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="relative z-10 min-h-screen">
        {renderContent()}
      </main>

      <footer className="relative z-10 py-32 px-8 border-t border-[#2d2a26]/5 text-center bg-white">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-2xl md:text-3xl serif italic text-[#2d2a26]/20 font-light">"הדרך אל האמת עוברת בלב שקט"</div>
          <div className="h-[1px] w-16 bg-[#2d2a26]/5 mx-auto"></div>
          <div className="flex justify-center gap-16 text-[10px] uppercase tracking-[0.4em] text-[#2d2a26]/40 font-bold">
            <a href="#" className="hover:text-[#7d7463] transition-colors">Instagram</a>
            <a href="#" className="hover:text-[#7d7463] transition-colors">Facebook</a>
            <a href="#" className="hover:text-[#7d7463] transition-colors">WhatsApp</a>
          </div>
          <p className="text-[9px] uppercase tracking-[0.5em] text-[#2d2a26]/20">
            &copy; {new Date().getFullYear()} רבקה לפיד - קליניקה לריפוי רגשי ונומרולוגיה
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;

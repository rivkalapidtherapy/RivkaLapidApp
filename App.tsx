
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppView, Appointment } from './types';
import BookingFlow from './components/BookingFlow';
import AdminDashboard from './components/AdminDashboard';
import ClientPortal from './components/ClientPortal';
import ContentHub from './components/ContentHub';
import { getDailyGreeting } from './services/geminiService';
import { Button } from './components/UI';
import { SERVICES as INITIAL_SERVICES, COLORS } from './constants';
import { getAdminServices } from './services/bookingService';
import { Service } from './types';
import { Instagram, Facebook } from 'lucide-react';


const WhatsAppIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    <path d="M17 14c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1-.2.2-.7.7-.8.9-.1.2-.3.2-.5.1A6.9 6.9 0 0 1 10 11.3c-.3-.6-.1-.9-.1-1.1.1-.1.2-.3.3-.4.1-.1.1-.2.2-.3.1-.1.1-.2.0-.4-.1-.2-.5-1.2-.7-1.7-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3a2.7 2.7 0 0 0-.9 2c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8.6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.2-.5 1.4-1 .2-.5.2-.9.1-1z" />
  </svg>
);


const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [lastAppointment, setLastAppointment] = useState<Appointment | null>(null);
  const [greeting, setGreeting] = useState("אם הגעת לכאן, כנראה שמשהו בתוכך מבקש שינוי - אולי זה חסמים רגשיים, חוסר ביטחון עצמי, קושי למציאת זוגיות, תקיעות במערכות יחסים או שהנך נמצא/ת בצומת דרכים בחיים והנך מחפש/ת כיוון.");
  const [scrolled, setScrolled] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAdminAuthenticated') === 'true';
  });
  
  useEffect(() => {
    sessionStorage.setItem('isAdminAuthenticated', isAdminAuthenticated ? 'true' : 'false');
  }, [isAdminAuthenticated]);

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
            <section className="relative min-h-screen flex flex-col lg:flex-row items-stretch overflow-hidden bg-[#f5f2ed]">
              {/* Left Content Side */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-32 relative z-10"
              >
                {/* Mobile background image */}
                <div className="lg:hidden absolute inset-0 z-[-1] overflow-hidden">
                  <img
                    src="/rivka.png"
                    alt=""
                    className="w-[120%] h-auto object-cover opacity-20 absolute -right-10 top-10"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#f5f2ed]"></div>
                </div>

                <div className="max-w-xl space-y-10">
                  <div className="space-y-4">
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs uppercase tracking-[0.5em] text-[#7d7463] font-bold block"
                    >
                      רבקה לפיד
                    </motion.span>
                    <h1 className="text-5xl md:text-7xl font-light text-[#2d2a26] leading-[1.05] tracking-tight">
                      תהליך ליווי <br />
                      <span className="serif italic font-normal text-[#7d7463]">נומרולוגי רגשי</span> <br />
                      אישי ומעצים
                    </h1>
                    <p className="text-[#2d2a26]/60 text-xs md:text-sm uppercase tracking-[0.3em] font-medium pt-2">
                      מטפלת רגשית, נומרולוגית ומנחת סדנאות
                    </p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/40 backdrop-blur-sm border-y border-[#2d2a26]/10 py-10 px-8 shadow-sm rounded-sm"
                  >
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1, duration: 1 }}
                      className="text-[#2d2a26] text-xl md:text-2xl font-light leading-relaxed serif italic text-right"
                    >
                      "הקשבה אמיתית אינה רק לאוזניים, היא נוכחות של הלב במרחב שבין המספרים למילים."
                    </motion.p>
                  </motion.div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center gap-6">
                    <Button
                      onClick={() => setView('booking')}
                      className="w-full sm:w-auto min-w-[260px] text-lg py-5 shadow-2xl shadow-[#7d7463]/20"
                    >
                      לקביעת שיחת היכרות
                    </Button>
                    <a
                      href="https://wa.me/972547394577?text=שלום רבקה, אשמח לקבל פרטים לגבי שיחת היכרות ומפגש איתך"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#7d7463] hover:text-[#2d2a26] font-bold text-sm tracking-widest hover:underline transition-all"
                    >
                      פנייה מהירה בוואטסאפ ←
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Right Media Side - DESKTOP (Promotional Video Placeholder) */}
              <motion.div
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                className="hidden lg:flex flex-1 relative items-center justify-center bg-[#f5f2ed] border-r border-[#2d2a26]/5 px-12"
              >
                <div className="relative w-full max-w-xl aspect-video rounded-sm overflow-hidden shadow-2xl group cursor-pointer bg-stone-900">
                  <img
                    src="https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=800"
                    alt="סרטון תדמית רבקה לפיד"
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-[2s]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
                    <div className="w-16 h-16 bg-white/20 hover:bg-white/35 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 border border-white/40 scale-100 group-hover:scale-110 shadow-lg shadow-black/20">
                      <span className="text-2xl mr-1">▶</span>
                    </div>
                    <span className="text-xs uppercase tracking-[0.4em] font-bold opacity-80 group-hover:opacity-100 transition-opacity">סרטון תדמית - רבקה לפיד</span>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* MOBILE Promotional Video Section - visible only on small screens */}
            <section className="lg:hidden bg-[#f5f2ed] pb-12 px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-lg mx-auto"
              >
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-xl group cursor-pointer bg-stone-900">
                  <img
                    src="https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=800"
                    alt="סרטון תדמית רבקה לפיד"
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-[2s]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-3">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40 shadow-lg shadow-black/20">
                      <span className="text-xl mr-0.5">▶</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-80">סרטון תדמית - רבקה לפיד</span>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* Pain Points Section */}
            <section className="py-28 px-6 md:px-16 bg-white border-b border-[#2d2a26]/5 text-right" dir="rtl">
              <div className="max-w-4xl mx-auto space-y-16">
                <div className="space-y-4 text-center md:text-right">
                  <span className="text-xs uppercase tracking-[0.4em] text-[#7d7463] font-bold block">עצור לרגע להקשיב</span>
                  <h2 className="text-4xl md:text-5xl font-light text-[#2d2a26] leading-tight">
                    אם הגעת לכאן, יכול להיות שאת מרגישה ש...
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    "את נותנת לכולם, אבל שכחת את עצמך בדרך.",
                    "את יודעת שיש בך הרבה יותר, אבל משהו עוצר אותך.",
                    "את מרגישה תקיעות שחוזרת שוב ושוב בתחומים שונים בחייך.",
                    "את מחפשת זוגיות, שפע, ביטחון עצמי או כיוון, אבל לא מצליחה לפרוץ את המעגלים שחוזרים על עצמם.",
                    "את פשוט רוצה לחזור להרגיש שמחה, מחוברת ונינוחה בתוך החיים שלך."
                  ].map((point, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.8 }}
                      className="p-6 rounded-sm bg-[#f5f2ed]/40 border border-[#2d2a26]/5 flex items-start gap-4 hover:bg-[#f5f2ed]/80 transition-all duration-300"
                    >
                      <span className="text-xl text-[#7d7463] shrink-0">🌸</span>
                      <p className="text-stone-700 text-sm md:text-base font-light leading-relaxed">{point}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="text-center pt-8 border-t border-stone-100"
                >
                  <p className="text-xl text-[#2d2a26]/80 font-light italic serif">
                    "אם הזדהית אפילו עם אחד מהדברים האלו, את במקום הנכון."
                  </p>
                </motion.div>
              </div>
            </section>

            {/* About & Method Section */}
            <section className="py-32 px-6 md:px-16 bg-[#f5f2ed] text-right" dir="rtl">
              <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
                {/* Text Side */}
                <div className="flex-1 space-y-8">
                  <div className="space-y-4">
                    <span className="text-xs uppercase tracking-[0.4em] text-[#7d7463] font-bold block">הגישה הטיפולית</span>
                    <h2 className="text-4xl md:text-5xl font-light text-[#2d2a26] leading-tight serif italic">
                      כאן מתחיל השינוי
                    </h2>
                  </div>

                  <div className="space-y-6 text-[#2d2a26]/80 text-base md:text-lg font-light leading-relaxed">
                    <p>
                      אני לא מאמינה בטיפול שמתמקד רק במה שרואים על פני השטח. ביחד, נגיע לשורש החסמים שמנהלים אותך, נבין מה מעכב אותך וניצור תנועה חדשה, מדויקת ומיטיבה יותר עבורך.
                    </p>
                    <p className="font-medium text-[#7d7463]">
                      התהליך שאני מלווה בו משלב בין טיפול רגשי, עבודה עם תת המודע ונומרולוגיה – שילוב שמאפשר להבין את התמונה הרחבה ולהוביל לשינוי עמוק, מחובר ומעשי.
                    </p>
                    
                    {/* Highlighted UVP */}
                    <div className="border-r-2 border-[#7d7463] pr-6 my-8 py-2 bg-white/40 rounded-sm">
                      <p className="font-normal text-stone-800 italic">
                        "מעבר לכלים הטיפוליים, אני מביאה איתי דרך הסתכלות ייחודית שפיתחתי לאורך למעלה מעשור כעורכת דין בכירה בתחום הנדל"ן, במסגרתו ליוויתי עסקאות מהגדולות והמובילות בצמרת המשק הישראלי."
                      </p>
                    </div>

                    <p>
                      השנים הללו לימדו אותי מיומנויות שהפכו היום לחלק בלתי נפרד מהעשייה שלי: יכולת אבחון גבוהה, זיהוי דפוסים, הקשבה עמוקה, דיוק בפרטים, ניהול משא ומתן ויכולת לראות את התמונה הרחבה לצד הפרטים הקטנים.
                    </p>
                    <p>
                      היום, אני משתמשת בכל אותן יכולות כדי לעזור לנשים לנהל את המשא ומתן החשוב ביותר בחייהן – זה שהן מנהלות מול עצמן.
                    </p>
                    <p>
                      המטרה שלי היא שתצאי עם הרבה יותר מפתרון נקודתי, אלא עם בהירות, ביטחון וכלים פרקטים שעובדים באמת ושילוו אותך לאורך המסע שלך כאן בחיים.
                    </p>
                  </div>
                </div>

                {/* Visual Side */}
                <div className="w-full lg:w-96 shrink-0 relative flex justify-center">
                  <div className="absolute inset-0 bg-[#7d7463]/5 rounded-sm blur-2xl transform rotate-6"></div>
                  <div className="relative border border-[#2d2a26]/10 p-4 bg-white rounded-sm shadow-xl max-w-sm">
                    <img
                      src="/rivka.png"
                      alt="רבקה לפיד"
                      className="w-full h-auto object-cover rounded-sm grayscale hover:grayscale-0 transition-all duration-[1.5s]"
                    />
                    <div className="pt-4 text-center">
                      <span className="text-[10px] uppercase tracking-[0.3em] text-[#7d7463] font-bold block mb-1">רבקה לפיד</span>
                      <span className="text-xs text-stone-400 font-light">מטפלת רגשית ונומרולוגית</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Visual Service Grid */}
            <section className="py-32 px-6 bg-white">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24 space-y-6">
                  <span className="text-xs uppercase tracking-[0.5em] text-[#7d7463] font-bold block">3 מסלולי ליווי</span>
                  <h2 className="text-4xl md:text-6xl font-light text-[#2d2a26]">
                    בחרי את התהליך המדויק עבורך
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {services.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -10 }}
                      className="group relative h-[420px] md:h-[550px] lg:h-[650px] overflow-hidden rounded-xl md:rounded-sm cursor-pointer bg-[#f5f2ed]"
                      onClick={() => {
                        setSelectedServiceId(service.id);
                        setView('booking');
                      }}
                    >
                      {/* Background Image */}
                      <div
                        className="absolute inset-0 transition-transform duration-[2s] group-hover:scale-110"
                      >
                        <img
                          src={service.imageUrl}
                          alt={service.type}
                          className="w-full h-full object-cover"
                        />
                        {/* Darker Overlay for Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2d2a26] via-[#2d2a26]/60 to-transparent opacity-90"></div>
                      </div>

                      {/* Content Overlay */}
                      <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end text-white text-right">
                        <span className="text-xs uppercase tracking-[0.4em] mb-3 md:mb-6 opacity-60">0{index + 1}.</span>
                        <h3 className="text-2xl md:text-3xl font-light mb-3 md:mb-4 tracking-tight leading-tight">{service.type}</h3>
                        <div className="text-4xl md:text-5xl font-bold mb-4 md:mb-8 text-[#7d7463] serif italic tracking-tighter">₪{service.price}</div>

                        <p className="text-white/95 text-sm md:text-base font-light leading-relaxed mb-6 md:mb-10 line-clamp-3 md:line-clamp-none">
                          {service.description}
                        </p>

                        <div className="pt-4 md:pt-8 border-t border-white/20 flex justify-between items-center">
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

      case 'content':
        return <ContentHub />;

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
            <button onClick={() => setView('content')} className={`hover:text-[#7d7463] transition-colors duration-300 ${view === 'content' ? 'text-[#7d7463]' : ''}`}>תוכן והשראה</button>
            <button onClick={() => setView('portal')} className={`hover:text-[#7d7463] transition-colors duration-300 ${view === 'portal' ? 'text-[#7d7463]' : ''}`}>אזור אישי</button>
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
                onClick={() => { setView('content'); setIsMobileMenuOpen(false); }}
                className={`text-sm uppercase tracking-widest font-bold ${view === 'content' ? 'text-[#7d7463]' : 'text-[#2d2a26]'}`}
              >
                תוכן והשראה
              </button>
              <button
                onClick={() => { setView('portal'); setIsMobileMenuOpen(false); }}
                className={`text-sm uppercase tracking-widest font-bold ${view === 'portal' ? 'text-[#7d7463]' : 'text-[#2d2a26]'}`}
              >
                אזור אישי
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
          <div className="flex justify-center gap-8 text-[#2d2a26]/60">
            <a
              href="https://www.instagram.com/lapidrebecca/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#7d7463] hover:shadow-md transition-all duration-300 hover:-translate-y-1 p-3.5 bg-[#f5f2ed] hover:bg-[#7d7463]/10 rounded-full flex items-center justify-center"
              aria-label="Instagram"
            >
              <Instagram size={22} strokeWidth={1.5} />
            </a>
            <a
              href="https://www.facebook.com/rickey.cohen.9"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#7d7463] hover:shadow-md transition-all duration-300 hover:-translate-y-1 p-3.5 bg-[#f5f2ed] hover:bg-[#7d7463]/10 rounded-full flex items-center justify-center"
              aria-label="Facebook"
            >
              <Facebook size={22} strokeWidth={1.5} />
            </a>
            <a
              href="https://wa.me/972547394577"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#7d7463] hover:shadow-md transition-all duration-300 hover:-translate-y-1 p-3.5 bg-[#f5f2ed] hover:bg-[#7d7463]/10 rounded-full flex items-center justify-center"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon className="w-[22px] h-[22px]" strokeWidth={1.5} />
            </a>
          </div>
          <p className="text-xs tracking-wide text-[#2d2a26]/50">
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

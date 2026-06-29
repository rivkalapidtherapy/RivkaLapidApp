import React, { useState, useEffect } from 'react';
import { HomepageContent } from '../types';
import { Card, Button } from './UI';
import { getHomepageContent, saveHomepageContent, uploadImage } from '../services/bookingService';
import { Save, Image, Sparkles, Upload, FileText, LayoutGrid, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminHomepageTab: React.FC = () => {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'logo' | 'hero' | 'pain' | 'about'>('logo');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Image upload states
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string>('');
  const [aboutFile, setAboutFile] = useState<File | null>(null);
  const [aboutPreview, setAboutPreview] = useState<string>('');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    const data = await getHomepageContent();
    setContent(data);
    if (data.heroImageUrl) setHeroPreview(data.heroImageUrl);
    if (data.aboutImageUrl) setAboutPreview(data.aboutImageUrl);
    setLoading(false);
  };

  const handleTextChange = (field: keyof HomepageContent, value: string) => {
    if (!content) return;
    setContent({
      ...content,
      [field]: value
    });
  };

  const handlePainPointChange = (index: number, value: string) => {
    if (!content) return;
    const fieldName = `painPoint${index + 1}` as keyof HomepageContent;
    setContent({
      ...content,
      [fieldName]: value
    });
  };

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    setNotification(null);

    try {
      let updatedContent = { ...content };

      // 1. Upload Hero Image if changed
      if (heroFile) {
        const url = await uploadImage(heroFile);
        if (url) {
          updatedContent.heroImageUrl = url;
        } else {
          throw new Error('העלאת תמונת כותרת נכשלה');
        }
      }

      // 2. Upload About Image if changed
      if (aboutFile) {
        const url = await uploadImage(aboutFile);
        if (url) {
          updatedContent.aboutImageUrl = url;
        } else {
          throw new Error('העלאת תמונת הגישה הטיפולית נכשלה');
        }
      }

      // 3. Save to DB
      await saveHomepageContent(updatedContent);
      setContent(updatedContent);
      setHeroFile(null);
      setAboutFile(null);
      setNotification({ message: 'תוכן דף הבית עודכן בהצלחה!', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setNotification({ message: err.message || 'שמירת הנתונים נכשלה', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <div className="w-10 h-10 border-2 border-stone-200 border-t-[#7d7463] rounded-full animate-spin"></div>
        <p className="text-stone-400 font-light tracking-widest text-sm uppercase">טוען תוכן דף הבית...</p>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-right" dir="rtl">
      {/* Alert/Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-xl border flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
              : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}
        >
          {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{notification.message}</p>
        </motion.div>
      )}

      {/* Editor Layout: Sidebar Tabs + Content Area */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col bg-white border border-stone-100 p-2 rounded-2xl gap-1 overflow-x-auto lg:overflow-visible">
          <button
            type="button"
            onClick={() => setActiveSection('logo')}
            className={`flex-1 lg:flex-initial py-3.5 px-5 rounded-xl text-sm font-bold flex items-center justify-center lg:justify-start gap-3 transition-all duration-300 ${
              activeSection === 'logo'
                ? 'bg-[#7d7463] text-white shadow-md'
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>לוגו וניווט</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('hero')}
            className={`flex-1 lg:flex-initial py-3.5 px-5 rounded-xl text-sm font-bold flex items-center justify-center lg:justify-start gap-3 transition-all duration-300 ${
              activeSection === 'hero'
                ? 'bg-[#7d7463] text-white shadow-md'
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>כותרת Hero</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('pain')}
            className={`flex-1 lg:flex-initial py-3.5 px-5 rounded-xl text-sm font-bold flex items-center justify-center lg:justify-start gap-3 transition-all duration-300 ${
              activeSection === 'pain'
                ? 'bg-[#7d7463] text-white shadow-md'
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>עצור לרגע להקשיב</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('about')}
            className={`flex-1 lg:flex-initial py-3.5 px-5 rounded-xl text-sm font-bold flex items-center justify-center lg:justify-start gap-3 transition-all duration-300 ${
              activeSection === 'about'
                ? 'bg-[#7d7463] text-white shadow-md'
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>הגישה הטיפולית</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="flex-1 bg-white border border-stone-100 rounded-2xl p-8 shadow-sm">
          <div className="space-y-8">
            
            {/* Section 1: Logo & Nav */}
            {activeSection === 'logo' && (
              <div className="space-y-6">
                <div className="border-b border-stone-100 pb-4">
                  <h3 className="text-xl font-light text-stone-800">עריכת לוגו וסרגל הניווט</h3>
                  <p className="text-xs text-stone-400 mt-1">שילוב הטקסטים שיופיעו בפינה השמאלית העליונה של האתר.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-stone-500">ראשי תיבות (בתוך העיגול)</label>
                    <input
                      type="text"
                      className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm text-right"
                      value={content.logoInitials}
                      onChange={(e) => handleTextChange('logoInitials', e.target.value)}
                      placeholder="למשל RL"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-stone-500">טקסט לוגו ראשי (מודגש)</label>
                    <input
                      type="text"
                      className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm text-right"
                      value={content.logoText1}
                      onChange={(e) => handleTextChange('logoText1', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-stone-500">טקסט לוגו משני (נטוי וקטן)</label>
                    <input
                      type="text"
                      className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm text-right"
                      value={content.logoText2}
                      onChange={(e) => handleTextChange('logoText2', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-stone-500">שורת מיצוב / סלוגן (מתחת ללוגו)</label>
                    <input
                      type="text"
                      className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm text-right"
                      value={content.logoTagline}
                      onChange={(e) => handleTextChange('logoTagline', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Hero Section */}
            {activeSection === 'hero' && (
              <div className="space-y-6">
                <div className="border-b border-stone-100 pb-4">
                  <h3 className="text-xl font-light text-stone-800">עריכת מסך הפתיחה (Hero)</h3>
                  <p className="text-xs text-stone-400 mt-1">הרושם הראשוני של המבקרים באתר.</p>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-bold text-stone-500">כותרת ראשית (תומך בירידות שורה ידניות)</label>
                  <textarea
                    rows={3}
                    className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm leading-relaxed text-right"
                    value={content.heroTitle}
                    onChange={(e) => handleTextChange('heroTitle', e.target.value)}
                    placeholder="הקלידי את הכותרת הראשית של האתר..."
                  />
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-bold text-stone-500">כותרת משנה</label>
                  <input
                    type="text"
                    className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm text-right"
                    value={content.heroSubtitle}
                    onChange={(e) => handleTextChange('heroSubtitle', e.target.value)}
                  />
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-bold text-stone-500">ציטוט מעוצב במרכז מסך הפתיחה</label>
                  <textarea
                    rows={2}
                    className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm leading-relaxed italic text-right"
                    value={content.heroQuote}
                    onChange={(e) => handleTextChange('heroQuote', e.target.value)}
                  />
                </div>

                {/* Hero Image Upload */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-stone-500 block">תמונת כותרת ראשית / תדמית</label>
                  <div className="flex flex-col md:flex-row items-center gap-6 bg-stone-50 p-4 rounded-xl border border-stone-100">
                    {heroPreview && (
                      <img
                        src={heroPreview}
                        alt="תצוגה מקדימה"
                        className="w-40 h-24 object-cover rounded-lg border border-stone-200 shadow-sm"
                      />
                    )}
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[#7d7463] text-[#7d7463] hover:bg-[#7d7463] hover:text-white rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer shadow-sm w-fit">
                        <Upload className="w-3.5 h-3.5" />
                        <span>בחירת תמונה חדשה</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setHeroFile(file);
                              setHeroPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                      <p className="text-[10px] text-stone-400">תמונות יישמרו ישירות בשרת. מומלץ להעלות קובץ ברוחב 800px לפחות.</p>
                      {heroFile && <p className="text-xs text-emerald-600 font-bold">תמונה נבחרה: {heroFile.name}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Pain Points */}
            {activeSection === 'pain' && (
              <div className="space-y-6">
                <div className="border-b border-stone-100 pb-4">
                  <h3 className="text-xl font-light text-stone-800">עריכת מדור "עצור לרגע להקשיב"</h3>
                  <p className="text-xs text-stone-400 mt-1">מדור נקודות הכאב וההזדהות של המטופלות.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-stone-500">תווית עליונה (Badge)</label>
                    <input
                      type="text"
                      className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm text-right"
                      value={content.painPointsBadge}
                      onChange={(e) => handleTextChange('painPointsBadge', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-stone-500">כותרת ראשית של המדור</label>
                    <input
                      type="text"
                      className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm text-right"
                      value={content.painPointsTitle}
                      onChange={(e) => handleTextChange('painPointsTitle', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <label className="text-xs font-bold text-stone-500 block">5 נקודות הזדהות / כאב:</label>
                  {[0, 1, 2, 3, 4].map((idx) => {
                    const pointVal = (content as any)[`painPoint${idx + 1}`] || '';
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-stone-400 text-sm font-bold w-6 text-left">0{idx + 1}.</span>
                        <input
                          type="text"
                          className="flex-1 border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm text-right"
                          value={pointVal}
                          onChange={(e) => handlePainPointChange(idx, e.target.value)}
                          placeholder={`הקלידי נקודת כאב מספר ${idx + 1}...`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col space-y-2 pt-4 border-t border-stone-100">
                  <label className="text-xs font-bold text-stone-500">שורת סיכום / הרגעה תחתונה</label>
                  <textarea
                    rows={2}
                    className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm leading-relaxed italic text-right"
                    value={content.painPointsFooter}
                    onChange={(e) => handleTextChange('painPointsFooter', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Section 4: About / Approach */}
            {activeSection === 'about' && (
              <div className="space-y-6">
                <div className="border-b border-stone-100 pb-4">
                  <h3 className="text-xl font-light text-stone-800">עריכת מדור "הגישה הטיפולית"</h3>
                  <p className="text-xs text-stone-400 mt-1">תיאור הרקע, הפילוסופיה וההיסטוריה הטיפולית שלך.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-stone-500">תווית עליונה (Badge)</label>
                    <input
                      type="text"
                      className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm text-right"
                      value={content.aboutBadge}
                      onChange={(e) => handleTextChange('aboutBadge', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-stone-500">כותרת ראשית של המדור</label>
                    <input
                      type="text"
                      className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm text-right"
                      value={content.aboutTitle}
                      onChange={(e) => handleTextChange('aboutTitle', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-stone-500">פסקה 1 (פסקה פותחת)</label>
                    <textarea
                      rows={3}
                      className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm leading-relaxed text-right"
                      value={content.aboutParagraph1}
                      onChange={(e) => handleTextChange('aboutParagraph1', e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-[#7d7463]">פסקה 2 (פסקה מודגשת בצבע ירוק-זית)</label>
                    <textarea
                      rows={3}
                      className="border border-[#7d7463]/30 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm leading-relaxed font-medium bg-[#7d7463]/5 text-stone-800 text-right"
                      value={content.aboutParagraph2}
                      onChange={(e) => handleTextChange('aboutParagraph2', e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-stone-500">ציטוט מוביל (במסגרת ימנית - ייחודיות כעו"ד נדל"ן)</label>
                    <textarea
                      rows={3}
                      className="border border-r-4 border-r-[#7d7463] border-stone-200 rounded-l-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm leading-relaxed italic bg-white text-right"
                      value={content.aboutUvp}
                      onChange={(e) => handleTextChange('aboutUvp', e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-stone-500">פסקה 3 (כישורים והקשבה)</label>
                    <textarea
                      rows={3}
                      className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm leading-relaxed text-right"
                      value={content.aboutParagraph3}
                      onChange={(e) => handleTextChange('aboutParagraph3', e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-stone-500">פסקה 4 (משא ומתן מול עצמן)</label>
                    <textarea
                      rows={3}
                      className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm leading-relaxed text-right"
                      value={content.aboutParagraph4}
                      onChange={(e) => handleTextChange('aboutParagraph4', e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-stone-500">פסקה 5 (פסקה מסכמת ומטרת התהליך)</label>
                    <textarea
                      rows={3}
                      className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm leading-relaxed text-right"
                      value={content.aboutParagraph5}
                      onChange={(e) => handleTextChange('aboutParagraph5', e.target.value)}
                    />
                  </div>
                </div>

                {/* About Image Upload */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <label className="text-xs font-bold text-stone-500 block">תמונת המטפלת</label>
                  <div className="flex flex-col md:flex-row items-center gap-6 bg-stone-50 p-4 rounded-xl border border-stone-100">
                    {aboutPreview && (
                      <img
                        src={aboutPreview}
                        alt="תצוגה מקדימה"
                        className="w-24 h-32 object-cover rounded-lg border border-stone-200 shadow-sm"
                      />
                    )}
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[#7d7463] text-[#7d7463] hover:bg-[#7d7463] hover:text-white rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer shadow-sm w-fit">
                        <Upload className="w-3.5 h-3.5" />
                        <span>בחירת תמונה חדשה</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAboutFile(file);
                              setAboutPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                      <p className="text-[10px] text-stone-400">תמונות יישמרו ישירות בשרת. מומלץ להעלות תמונת פורטרט איכותית.</p>
                      {aboutFile && <p className="text-xs text-emerald-600 font-bold">תמונה נבחרה: {aboutFile.name}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-bold text-stone-500">שם המטפלת (מופיע תחת התמונה)</label>
                      <input
                        type="text"
                        className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm text-right"
                        value={content.aboutImageLabel}
                        onChange={(e) => handleTextChange('aboutImageLabel', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-bold text-stone-500">תיאור מקצועי (מופיע תחת שם המטפלת)</label>
                      <input
                        type="text"
                        className="border border-stone-200 rounded-xl p-3 focus:border-[#7d7463] focus:ring-1 focus:ring-[#7d7463] outline-none text-sm text-right"
                        value={content.aboutImageSublabel}
                        onChange={(e) => handleTextChange('aboutImageSublabel', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-stone-100 flex items-center justify-end gap-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="min-w-[180px] shadow-lg flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>שומר שינויים...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>שמור שינויים</span>
                  </>
                )}
              </Button>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getContentHubItems } from '../services/bookingService';
import { ContentItem } from '../types';
import { FileText, PlayCircle, Radio, Calendar, Search } from 'lucide-react';

export const ContentHub: React.FC = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await getContentHubItems();
        setItems(data);
      } catch (err) {
        console.error('Failed to load content hub:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const filteredItems = items
    .filter(item => activeFilter === 'all' || item.type === activeFilter)
    .filter(item => {
      if (!searchQuery) return true;
      const term = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.summary && item.summary.toLowerCase().includes(term))
      );
    });

  const getIcon = (type: string) => {
    switch (type) {
      case 'podcast':
        return <Radio className="w-5 h-5 text-[#7d7463]" />;
      case 'video':
        return <PlayCircle className="w-5 h-5 text-[#7d7463]" />;
      case 'article':
      case 'post':
      default:
        return <FileText className="w-5 h-5 text-[#7d7463]" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'post':
        return 'פוסט';
      case 'podcast':
        return 'פודקאסט';
      case 'video':
        return 'סרטון השראה';
      case 'article':
        return 'מאמר';
      default:
        return 'תוכן';
    }
  };

  return (
    <section className="py-24 px-6 md:px-16 bg-[#f5f2ed] min-h-screen text-right" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs uppercase tracking-[0.5em] text-[#7d7463] font-bold block"
          >
            מרכז השראה וידע
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-light text-[#2d2a26] leading-tight serif italic"
          >
            השראה, כלים ומחשבות
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[#2d2a26]/60 max-w-xl mx-auto font-light text-base md:text-lg leading-relaxed"
          >
            כאן תוכלי למצוא את המאמרים שלי, פרקי הפודקאסט, סרטונים וכלים פרקטיים שילוו אותך בתהליך הריפוי והגילוי העצמי.
          </motion.p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center border-b border-[#2d2a26]/10 pb-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {[
              { id: 'all', label: 'הכל' },
              { id: 'post', label: 'פוסטים' },
              { id: 'podcast', label: 'פודקאסטים' },
              { id: 'video', label: 'סרטונים' },
              { id: 'article', label: 'מאמרים' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
                  activeFilter === filter.id 
                    ? 'bg-[#7d7463] text-white shadow-md' 
                    : 'bg-white/50 text-[#2d2a26]/70 hover:bg-white hover:text-[#2d2a26]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="חיפוש תכנים..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/70 backdrop-blur-sm border border-[#2d2a26]/10 rounded-full py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:border-[#7d7463] focus:bg-white transition-all text-right"
            />
            <Search className="w-4 h-4 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-2 border-[#7d7463]/20 border-t-[#7d7463] rounded-full animate-spin"></div>
            <p className="text-[#2d2a26]/50 text-sm font-light">טוען תכנים יפים בשבילך...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-32 bg-white/40 rounded-sm border border-[#2d2a26]/5">
            <p className="text-stone-400 text-lg font-light">לא נמצאו תכנים התואמים את החיפוש או הסינון שלך.</p>
          </div>
        ) : (
          <motion.div 
            layout 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-sm shadow-sm hover:shadow-md border border-[#2d2a26]/5 overflow-hidden flex flex-col justify-between transition-shadow duration-300"
                >
                  <div className="p-8 space-y-6">
                    {/* Badge & Date */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-2 font-bold text-[#7d7463]">
                        {getIcon(item.type)}
                        {getTypeName(item.type)}
                      </span>
                      <span className="flex items-center gap-1 text-stone-400 font-light">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.publicationDate).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-3">
                      <h3 className="text-2xl font-light text-[#2d2a26] leading-snug tracking-tight hover:text-[#7d7463] transition-colors cursor-pointer">
                        {item.title}
                      </h3>
                      <p className="text-stone-500 text-sm font-light leading-relaxed line-clamp-4">
                        {item.description}
                      </p>
                    </div>

                    {/* Media Embed Code */}
                    {item.embedCode && (
                      <div 
                        className="w-full rounded overflow-hidden shadow-inner border border-stone-100 mt-4 bg-stone-50"
                        dangerouslySetInnerHTML={{ __html: item.embedCode }}
                      />
                    )}
                  </div>

                  {/* Footer Card */}
                  <div className="px-8 pb-8 pt-4 border-t border-[#2d2a26]/5 flex justify-between items-center bg-stone-50/50">
                    <span className="text-xs text-stone-400 font-light">
                      {item.summary || 'קריאה של 2 דקות'}
                    </span>
                    {item.mediaUrl && (
                      <a
                        href={item.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#7d7463] hover:underline font-bold flex items-center gap-1"
                      >
                        מעבר למקור ←
                      </a>
                    )}
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ContentHub;

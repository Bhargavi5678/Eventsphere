import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Settings, 
  Eye, 
  Layout, 
  Sparkles, 
  RefreshCw, 
  ExternalLink 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface EventData {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  theme: string;
  website_slug: string;
  website_config: any;
}

interface EventWebsiteGenProps {
  eventId: number;
  activeEvent: EventData | null;
  refreshEvent: () => void;
  triggerNotification: (message: string) => void;
}

export const EventWebsiteGen: React.FC<EventWebsiteGenProps> = ({ eventId, activeEvent, refreshEvent, triggerNotification }) => {
  const { t } = useLanguage();

  // Config states
  const [slug, setSlug] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [themeMode, setThemeMode] = useState('dark');
  const [showSchedule, setShowSchedule] = useState(true);
  const [showSponsors, setShowSponsors] = useState(true);
  const [saving, setSaving] = useState(false);

  // Preview data
  const [schedule, setSchedule] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);

  useEffect(() => {
    if (activeEvent) {
      setSlug(activeEvent.website_slug || '');
      const cfg = activeEvent.website_config || {};
      setBannerTitle(cfg.banner_title || activeEvent.title);
      setBannerSubtitle(cfg.banner_subtitle || activeEvent.description || '');
      setPrimaryColor(cfg.primary_color || '#6366f1');
      setThemeMode(cfg.background_theme || 'dark');
      setShowSchedule(cfg.show_schedule !== false);
      setShowSponsors(cfg.show_sponsors !== false);
    }
  }, [activeEvent]);

  // Load preview info
  const loadPreviewData = async () => {
    try {
      const sRes = await fetch(`${API_BASE_URL}/events/${eventId}/schedule`);
      const sData = await sRes.json();
      setSchedule(sData);

      const spRes = await fetch(`${API_BASE_URL}/events/${eventId}/sponsors`);
      const spData = await spRes.json();
      setSponsors(spData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPreviewData();
  }, [eventId]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_slug: slug,
          website_config: {
            banner_title: bannerTitle,
            banner_subtitle: bannerSubtitle,
            primary_color: primaryColor,
            background_theme: themeMode,
            show_schedule: showSchedule,
            show_sponsors: showSponsors
          }
        })
      });
      if (res.ok) {
        triggerNotification("Event Website Config published & saved!");
        refreshEvent();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('websiteGen')}</h1>
        <p className="text-gray-400 text-sm mt-1">Configure your public-facing landing page, customize banner styling, and toggle modular information blocks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* WYSIWYG Config Editor Panel (Left) */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-5 space-y-6">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              Microsite Settings Console
            </h3>
            <span className="text-[9px] text-gray-500 font-bold uppercase">Editor</span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            {/* Slug */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Custom URL Slug</label>
              <div className="flex">
                <span className="bg-slate-900 border border-r-0 border-white/10 rounded-l-xl px-2.5 py-2 flex items-center text-gray-500 font-semibold select-none">
                  eventsphere.com/rsvp/
                </span>
                <input 
                  type="text" 
                  value={slug}
                  onChange={e => setSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                  required
                  className="flex-1 glass-input rounded-r-xl px-3 py-2 bg-slate-950 font-bold text-indigo-300" 
                />
              </div>
            </div>

            {/* Banner Title */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Banner Headline Title</label>
              <input 
                type="text" 
                value={bannerTitle}
                onChange={e => setBannerTitle(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2" 
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Description Subtitle</label>
              <textarea 
                value={bannerSubtitle}
                onChange={e => setBannerSubtitle(e.target.value)}
                rows={3}
                className="w-full glass-input rounded-xl px-3 py-2 leading-relaxed" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Primary Color */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Brand Primary Accent</label>
                <select
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 bg-slate-900 font-semibold"
                >
                  <option value="#6366f1">Indigo Glow</option>
                  <option value="#a855f7">Purple Neon</option>
                  <option value="#10b981">Emerald Fresh</option>
                  <option value="#f43f5e">Rose Vibrant</option>
                </select>
              </div>

              {/* Theme Mode */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Background Theme</label>
                <select
                  value={themeMode}
                  onChange={e => setThemeMode(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 bg-slate-900 font-semibold"
                >
                  <option value="dark">Deep Space Dark</option>
                  <option value="light">Frosted Glass Light</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2.5 bg-slate-950/40 p-4 rounded-2xl border border-white/5 font-semibold text-gray-300">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block pb-1">Enabled Component blocks</span>
              <div className="flex items-center justify-between">
                <span>Display Session schedule timetable</span>
                <input 
                  type="checkbox" 
                  checked={showSchedule}
                  onChange={e => setShowSchedule(e.target.checked)}
                  className="accent-indigo-500 w-4 h-4 cursor-pointer" 
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Display Sponsors board</span>
                <input 
                  type="checkbox" 
                  checked={showSponsors}
                  onChange={e => setShowSponsors(e.target.checked)}
                  className="accent-indigo-500 w-4 h-4 cursor-pointer" 
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 glow-primary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Publishing changes...' : 'Save & Publish Website'}
            </button>
          </form>
        </div>

        {/* Viewport Live Preview Panel (Right) */}
        <div className="glass-panel rounded-2xl lg:col-span-7 overflow-hidden flex flex-col h-[520px]">
          <div className="px-6 py-3.5 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Eye className="w-4.5 h-4.5 text-purple-400" />
              Live Viewport Preview
            </span>
            {slug && (
              <a 
                href={`#website-preview-modal`} 
                className="text-[10px] text-indigo-400 font-bold hover:underline flex items-center gap-1"
                onClick={() => triggerNotification("To view public site, deploy application. Rendering sandbox preview.")}
              >
                <span>View Public Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Sandbox Rendered Page */}
          <div 
            className={`flex-1 overflow-y-auto p-8 transition-colors duration-500 ${
              themeMode === 'light' ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#090d16] text-[#f3f4f6]'
            }`}
          >
            {/* Header / Hero */}
            <div className="text-center py-8 space-y-4">
              <div 
                className="inline-block px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border"
                style={{ 
                  borderColor: primaryColor + '40', 
                  color: primaryColor,
                  backgroundColor: primaryColor + '10' 
                }}
              >
                Online Registration Active
              </div>
              <h2 className="text-2xl font-black tracking-tight">{bannerTitle || "Event Name Placeholder"}</h2>
              <p className="text-xs max-w-md mx-auto leading-relaxed text-gray-400">
                {bannerSubtitle || "Configure a banner description in the Settings Console to populate this header summary."}
              </p>
              
              <div className="flex justify-center gap-4 text-[10px] font-bold text-gray-500 pt-2 border-b border-dashed border-white/5 pb-4">
                <span>📅 {activeEvent?.date || "Date TBA"}</span>
                <span>📍 {activeEvent?.location || "Location TBA"}</span>
              </div>
            </div>

            {/* Timetable Section */}
            {showSchedule && (
              <div className="space-y-4 mt-6">
                <h4 className="text-xs font-extrabold tracking-wider uppercase text-center border-b pb-1.5" style={{ borderColor: primaryColor + '30', color: primaryColor }}>
                  Timetable Schedule
                </h4>
                <div className="space-y-2.5">
                  {schedule.length === 0 ? (
                    <p className="text-[10px] text-gray-500 text-center py-4">Timetable details will be displayed here.</p>
                  ) : (
                    schedule.map(slot => (
                      <div 
                        key={slot.id} 
                        className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${
                          themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-indigo-400 shrink-0">{slot.start_time} - {slot.end_time}</span>
                          <div>
                            <h5 className="text-[11px] font-bold leading-none">{slot.title}</h5>
                            <span className="text-[9px] text-gray-500 mt-1 block">Speaker: {slot.speaker || "Guest speaker"}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase">
                          {slot.location}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Sponsors Section */}
            {showSponsors && (
              <div className="space-y-4 mt-8">
                <h4 className="text-xs font-extrabold tracking-wider uppercase text-center border-b pb-1.5" style={{ borderColor: primaryColor + '30', color: primaryColor }}>
                  Official Partners
                </h4>
                <div className="flex flex-wrap justify-center items-center gap-6 py-2">
                  {sponsors.length === 0 ? (
                    <p className="text-[10px] text-gray-500 text-center">Sponsor banners will show here.</p>
                  ) : (
                    sponsors.map(sponsor => (
                      <div key={sponsor.id} className="flex flex-col items-center">
                        {sponsor.logo_url ? (
                          <img 
                            src={sponsor.logo_url} 
                            alt={sponsor.name} 
                            className="h-8 object-contain filter grayscale opacity-75 hover:opacity-100 hover:grayscale-0 transition-all rounded" 
                          />
                        ) : (
                          <span className="text-[11px] font-bold text-gray-400">{sponsor.name}</span>
                        )}
                        <span className="text-[7px] font-bold text-amber-500 uppercase mt-1">{sponsor.level} Partner</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-[9px] text-gray-500 mt-10 pt-4 border-t border-white/5">
              Powered by EventSphere © 2026. All rights reserved.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Bell, Calendar, MapPin, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
}

interface NavbarProps {
  activeEvent: EventData | null;
  notificationCount: number;
  clearNotifications: () => void;
  notifications: string[];
}

export const Navbar: React.FC<NavbarProps> = ({ activeEvent, notificationCount, clearNotifications, notifications }) => {
  const { language, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-20 w-[calc(100%-18rem)] fixed right-0 top-0 glass-panel border-b border-white/5 px-8 flex items-center justify-between z-10">
      {/* Event Details */}
      <div className="flex items-center gap-6">
        {activeEvent ? (
          <div>
            <h2 className="text-white font-bold text-base tracking-wide truncate max-w-sm">
              {activeEvent.title}
            </h2>
            <div className="flex items-center gap-4 mt-1 text-[11px] text-gray-400 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                {activeEvent.date}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 text-purple-400" />
                {activeEvent.location}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Loading Active Event...</span>
        )}
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-4">
        {/* Language Picker */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowLangMenu(!showLangMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-xs font-semibold text-gray-300 hover:text-white transition-all duration-300"
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>{language}</span>
          </button>
          
          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-32 rounded-xl bg-slate-900 border border-white/10 p-1.5 shadow-2xl z-30">
              {(['EN', 'ES', 'FR'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    language === lang 
                      ? 'bg-indigo-600/50 text-white' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {lang === 'EN' ? 'English' : lang === 'ES' ? 'Español' : 'Français'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowLangMenu(false);
              clearNotifications();
            }}
            className="relative p-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition-all duration-300"
          >
            <Bell className="w-4.5 h-4.5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 border border-slate-950 text-[9px] font-black text-white flex items-center justify-center animate-bounce glow-primary">
                {notificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-white/10 p-4 shadow-2xl z-30">
              <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-2">
                <h4 className="text-xs font-bold text-white tracking-wide">Notifications log</h4>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] text-indigo-400 font-semibold hover:underline"
                >
                  Close
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2.5">
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No new alerts.</p>
                ) : (
                  notifications.map((note, idx) => (
                    <div key={idx} className="p-2 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-[11px] text-gray-300 leading-relaxed font-medium">{note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

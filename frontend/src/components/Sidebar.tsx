import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  BadgeDollarSign, 
  BrainCircuit, 
  Globe, 
  MessageSquareDiff, 
  Award, 
  ShieldCheck, 
  Image as ImageIcon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'guests', label: t('guests'), icon: Users },
    { id: 'seating', label: t('seating'), icon: MapPin },
    { id: 'budget', label: t('budget'), icon: BadgeDollarSign },
    { id: 'aiPlanner', label: t('aiPlanner'), icon: BrainCircuit },
    { id: 'websiteGen', label: t('websiteGen'), icon: Globe },
    { id: 'engagement', label: t('engagement'), icon: MessageSquareDiff },
    { id: 'certificates', label: t('certificates'), icon: Award },
    { id: 'sponsorsStaff', label: t('sponsorsStaff'), icon: ShieldCheck },
    { id: 'gallery', label: t('gallery'), icon: ImageIcon }
  ];

  return (
    <aside className="w-72 h-screen fixed left-0 top-0 glass-panel flex flex-col z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center glow-primary">
          <span className="font-extrabold text-xl text-white tracking-wider">E</span>
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white tracking-wide">EventSphere</h1>
          <p className="text-[10px] text-indigo-400 font-semibold tracking-widest uppercase">Admin Portal</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white glow-primary border-l-4 border-indigo-400' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-300' : 'text-gray-400 group-hover:text-white'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-white/5 bg-slate-950/20 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-800 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
          AL
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">Agent Lukky</p>
          <p className="text-[9px] text-gray-500 truncate">lukky@eventsphere.com</p>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse glow-primary"></span>
      </div>
    </aside>
  );
};

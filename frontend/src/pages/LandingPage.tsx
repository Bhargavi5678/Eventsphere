import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Search, 
  Calendar, 
  Ticket, 
  Users, 
  Briefcase,
  Sparkles,
  MapPin,
  Clock,
  ChevronRight
} from 'lucide-react';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  theme: string;
  status: string;
}

interface LandingPageProps {
  onLoginClick: (role?: string) => void;
  isLoggedIn: boolean;
  currentUser: any;
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onLoginClick, 
  isLoggedIn, 
  currentUser,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats definition
  const stats = [
    { name: 'Events Hosted', value: '1,250+', icon: Calendar, color: 'text-indigo-400' },
    { name: 'Tickets Sold', value: '520K+', icon: Ticket, color: 'text-purple-400' },
    { name: 'Active Users', value: '28K+', icon: Users, color: 'text-emerald-400' },
    { name: 'Vendors', value: '4,800+', icon: Briefcase, color: 'text-amber-400' },
  ];

  // Fetch events from backend with realistic fallback
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/events/');
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        } else {
          throw new Error('Failed to fetch');
        }
      } catch (err) {
        // Fallback mock events
        setEvents([
          {
            id: 1,
            title: "TechSphere Global Summit 2026",
            description: "The premier event for AI, cloud computing, and advanced agentic architectures. Bringing together global innovators and developers.",
            date: "2026-10-15",
            location: "Silicon Convention Center, California",
            theme: "glassmorphism-dark",
            status: "Published"
          },
          {
            id: 2,
            title: "Coachella Harmony Festival 2026",
            description: "A three-day outdoor festival combining live concert vibes, modern art installations, and local catering vendors.",
            date: "2026-11-22",
            location: "Empire Polo Club, Indio, California",
            theme: "sunset-gradient",
            status: "Published"
          },
          {
            id: 3,
            title: "Paris Culinary & Pastry Expo",
            description: "Taste creations from world-class Michelin star chefs and book catering services for your next premium event.",
            date: "2026-12-05",
            location: "Paris Expo Porte de Versailles, France",
            theme: "minimal-light",
            status: "Published"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateEventClick = () => {
    if (isLoggedIn) {
      if (currentUser?.role === 'Admin' || currentUser?.role === 'Event Organizer') {
        onNavigate('dashboard');
      } else {
        alert("You must be an Event Organizer or Admin to create events. Please register a new organizer account.");
        onLoginClick('Event Organizer');
      }
    } else {
      onLoginClick('Event Organizer');
    }
  };

  const handleBookTicketsClick = () => {
    if (isLoggedIn) {
      if (currentUser?.role === 'Guest') {
        onNavigate('ticketing');
      } else {
        onNavigate('dashboard');
      }
    } else {
      onLoginClick('Guest');
    }
  };

  return (
    <div className="bg-[#05070c] text-white min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 overflow-hidden font-sans relative">
      
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-6xl mx-auto z-10">
        
        {/* --- HEADER NAVBAR --- */}
        <header className="w-full flex items-center justify-between py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center glow-primary">
              <span className="font-extrabold text-xl text-white tracking-wider">E</span>
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white tracking-wide">EventSphere</h1>
              <p className="text-[9px] text-indigo-400 font-bold tracking-widest uppercase">The Event Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400 hidden sm:inline">Welcome back, <strong className="text-white">{currentUser?.name}</strong> ({currentUser?.role})</span>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs transition-all border border-indigo-500/30 cursor-pointer flex items-center gap-1.5"
                >
                  Go to Dashboard
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onLoginClick()}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs transition-all border border-white/10 cursor-pointer"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => onLoginClick('Event Organizer')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all cursor-pointer glow-primary border border-indigo-500/20"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </header>
        
        {/* --- HERO SECTION --- */}
        <div className="grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
          {/* Text Content */}
          <div className="text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>THE ALL-IN-ONE EVENT SOLUTION</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
              Craft, Manage, &amp; Book Unforgettable Experiences
            </h1>
            <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Experience the future of events with EventSphere. From interactive seating canvases and AI budgeting prediction tools to custom landing pages and live Q&amp;A engagement, we have it all.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button 
                onClick={handleCreateEventClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold tracking-wide transition-all cursor-pointer glow-primary border border-indigo-500/50"
              >
                Create an Event
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={handleBookTicketsClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold tracking-wide transition-all cursor-pointer border border-white/10"
              >
                Book Tickets
              </button>
            </div>
          </div>

          {/* Event Illustration */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative group max-w-md w-full">
              {/* Decorative background cards */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl blur-2xl opacity-35 group-hover:opacity-45 transition-opacity pointer-events-none"></div>
              <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl opacity-20 pointer-events-none"></div>
              
              <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-950 p-3 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1770&auto=format&fit=crop" 
                  alt="Vibrant event crowd"
                  className="rounded-2xl object-cover w-full h-[320px] sm:h-[380px] group-hover:scale-102 transition-transform duration-700"
                />
                
                {/* Float Card Info */}
                <div className="absolute bottom-6 left-6 right-6 glass-panel border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">Upcoming Highlight</span>
                    <h4 className="text-sm font-extrabold text-white">TechSphere Global Summit</h4>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-400" /> Silicon Valley, CA
                    </p>
                  </div>
                  <button 
                    onClick={() => onLoginClick('Guest')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-colors"
                  >
                    Get Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- STATS SECTION --- */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 mt-8 mb-16">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            
            {/* Search Bar Widget */}
            <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-8">
              <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                Find Upcoming Events
              </h3>
              <div className="relative">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, venue, or details..."
                  className="w-full glass-input rounded-xl px-4 py-3 text-xs pr-10 bg-slate-900/60 border border-white/5 focus:border-indigo-500/50"
                />
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>

            {/* Statistics Counters */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {stats.map((stat) => (
                <div key={stat.name} className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-xl sm:text-2xl font-black text-white">{stat.value}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mt-1.5 tracking-wider">{stat.name}</p>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* --- SEARCH RESULTS SECTION --- */}
        {searchQuery.trim() !== '' && (
          <div className="space-y-6 mb-16 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-white">Search Results ({filteredEvents.length})</h3>
              <button onClick={() => setSearchQuery('')} className="text-xs text-gray-400 hover:text-white font-semibold">Clear Search</button>
            </div>
            {filteredEvents.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-2xl border border-white/5">
                <p className="text-sm text-gray-500">No events matched your search query. Try typing another term!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {filteredEvents.map(e => (
                  <div key={e.id} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-extrabold text-white truncate max-w-[200px]">{e.title}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-bold text-indigo-400 uppercase">
                          {e.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                        {e.description}
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{e.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <MapPin className="w-3.5 h-3.5 text-purple-400" />
                        <span className="truncate">{e.location}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleBookTicketsClick()}
                      className="w-full py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs tracking-wide transition-colors"
                    >
                      Book Tickets
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <footer className="w-full max-w-6xl mx-auto text-center py-8 mt-12 border-t border-white/5">
        <p className="text-xs text-gray-600 font-semibold">
          EventSphere © 2026. Premium Event Planning, Ticketing &amp; Engagement Platform. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
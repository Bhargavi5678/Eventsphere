import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Tag,
  Briefcase,
  Users,
  Video,
  Bell
} from 'lucide-react';

interface CalendarItem {
  id: string | number;
  title: string;
  type: 'event' | 'meeting' | 'deadline' | 'booking';
  time?: string;
  location?: string;
  dateStr: string; // YYYY-MM-DD
}

interface CalendarPageProps {
  eventId: number;
  triggerNotification: (message: string) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ eventId, triggerNotification }) => {
  // Calendar items state
  const [items, setItems] = useState<CalendarItem[]>([]);
  
  // Date states - Defaulting to October 2026 since the default seed event is Oct 15, 2026
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 15)); // Month is 0-indexed (9 = October)
  const [selectedDayItems, setSelectedDayItems] = useState<CalendarItem[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-10-15');

  const fetchCalendarItems = async () => {
    try {
      const itemsList: CalendarItem[] = [];

      // 1. Fetch Event date itself
      const eventRes = await fetch(`${API_BASE_URL}/events/${eventId}`);
      let eventDateStr = "2026-10-15";
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        eventDateStr = eventData.date;
        itemsList.push({
          id: `evt-${eventData.id}`,
          title: eventData.title,
          type: 'event',
          time: 'All Day',
          location: eventData.location,
          dateStr: eventData.date
        });
      }

      // 2. Fetch Schedule Sessions (sessions, meetings, deadlines)
      const sessionRes = await fetch(`${API_BASE_URL}/events/${eventId}/sessions`);
      if (sessionRes.ok) {
        const sessionsData = await sessionRes.json();
        sessionsData.forEach((s: any) => {
          // Convert session_type column to CalendarItem type
          let itType: 'event' | 'meeting' | 'deadline' | 'booking' = 'meeting';
          if (s.session_type === 'deadline') itType = 'deadline';
          else if (s.session_type === 'session') itType = 'meeting'; // Render session as meeting/agenda item
          else if (s.session_type === 'meeting') itType = 'meeting';
          
          itemsList.push({
            id: `sess-${s.id}`,
            title: s.title,
            type: itType,
            time: `${s.start_time} - ${s.end_time}`,
            location: s.location || 'N/A',
            dateStr: eventDateStr // sessions belong to the event day
          });
        });
      }

      // 3. Fetch Vendor Bookings
      const bookingRes = await fetch(`${API_BASE_URL}/events/${eventId}/bookings`);
      if (bookingRes.ok) {
        const bookingData = await bookingRes.json();
        bookingData.forEach((b: any) => {
          itemsList.push({
            id: `bk-${b.id}`,
            title: `Vendor: ${b.vendor?.name || 'Service Booking'}`,
            type: 'booking',
            time: 'Booking Confirmed',
            location: b.vendor?.contact || 'N/A',
            dateStr: b.booking_date || eventDateStr
          });
        });
      }

      setItems(itemsList);
    } catch (err) {
      console.error("Error fetching calendar items", err);
      // Fallback
      setItems([
        { id: 1, title: "TechSphere Global Summit 2026", type: "event", time: "All Day", location: "Silicon Convention Center", dateStr: "2026-10-15" },
        { id: 2, title: "Event Prep & Setup Deadline", type: "deadline", time: "08:00 - 09:00", location: "Main Auditorium", dateStr: "2026-10-15" },
        { id: 3, title: "Vendor Setup Meeting", type: "meeting", time: "09:00 - 10:00", location: "Catering Booth", dateStr: "2026-10-15" },
        { id: 4, title: "Agentic Coding: The Next Era", type: "meeting", time: "10:00 - 11:30", location: "Main Auditorium", dateStr: "2026-10-15" },
        { id: 5, title: "Booking: Epicurean Catering", type: "booking", time: "Confirmed", location: "catering@epicurean.com", dateStr: "2026-10-15" },
        { id: 6, title: "Coachella Music Festival", type: "event", time: "All Day", location: "Indio, CA", dateStr: "2026-11-22" }
      ]);
    }
  };

  useEffect(() => {
    fetchCalendarItems();
  }, [eventId]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get month name
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Days in month logic
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week index for day 1

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 15));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 15));
  };

  // Sync selected day detail panel when items or date changes
  useEffect(() => {
    const selected = items.filter(item => item.dateStr === selectedDateStr);
    setSelectedDayItems(selected);
  }, [selectedDateStr, items]);

  const handleDayClick = (dayNum: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setSelectedDateStr(dateStr);
  };

  const calendarGrid = [];
  // Empty slots for previous month offset
  for (let i = 0; i < firstDayIndex; i++) {
    calendarGrid.push(null);
  }
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarGrid.push(i);
  }

  // Type-to-Color converters
  const getItemColor = (type: string) => {
    switch (type) {
      case 'event': return 'bg-indigo-600 border-indigo-500 text-white';
      case 'meeting': return 'bg-purple-500/10 border-purple-500/30 text-purple-300';
      case 'deadline': return 'bg-rose-500/10 border-rose-500/30 text-rose-300';
      case 'booking': return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      default: return 'bg-slate-700 text-gray-300';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Interactive Calendar</h1>
        <p className="text-gray-400 text-sm mt-1">Unified view of event schedules, deadlines, meetings, and vendor bookings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* MONTH GRID CARD */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 lg:col-span-2 space-y-6">
          
          {/* Header toolbar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-black text-white">{monthNames[month]} {year}</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/5"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/5"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-7 gap-2.5 text-center text-xs font-semibold text-gray-500">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2.5 aspect-square sm:aspect-auto">
            {calendarGrid.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="bg-transparent rounded-2xl h-14 sm:h-20"></div>;
              }

              const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDateStr === formattedDate;
              
              // Count matching items
              const dayItems = items.filter(item => item.dateStr === formattedDate);
              
              return (
                <button
                  key={`day-${day}`}
                  onClick={() => handleDayClick(day)}
                  className={`relative rounded-2xl border text-left p-2.5 h-14 sm:h-20 transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg glow-primary' 
                      : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <span className="text-xs font-black">{day}</span>
                  
                  {/* Indicators / Pills */}
                  <div className="flex flex-col gap-1 w-full overflow-hidden mt-1">
                    {/* Small dot indicators for mobile, tiny badges for desktop */}
                    <div className="flex sm:hidden gap-1 justify-center mt-1">
                      {dayItems.slice(0, 3).map((item, iIndex) => {
                        let dotBg = "bg-indigo-400";
                        if (item.type === 'deadline') dotBg = "bg-rose-400";
                        if (item.type === 'booking') dotBg = "bg-amber-400";
                        if (item.type === 'meeting') dotBg = "bg-purple-400";
                        return <span key={iIndex} className={`w-1.5 h-1.5 rounded-full ${dotBg}`} />
                      })}
                    </div>
                    
                    <div className="hidden sm:flex flex-col gap-0.5 w-full">
                      {dayItems.slice(0, 2).map((item, iIndex) => (
                        <span 
                          key={iIndex} 
                          className="px-1.5 py-0.5 rounded text-[8px] font-black truncate border bg-slate-900/50 block"
                          style={{
                            borderColor: item.type === 'event' ? '#6366f1' : item.type === 'deadline' ? '#f43f5e' : item.type === 'booking' ? '#f59e0b' : '#c084fc',
                            color: item.type === 'event' ? '#c7d2fe' : item.type === 'deadline' ? '#fecdd3' : item.type === 'booking' ? '#fef3c7' : '#f3e8ff'
                          }}
                        >
                          {item.title}
                        </span>
                      ))}
                      {dayItems.length > 2 && (
                        <span className="text-[7px] text-gray-500 font-extrabold text-right block pr-1">+{dayItems.length - 2} more</span>
                      )}
                    </div>
                  </div>

                  {/* Highlighting special date (Event Day) */}
                  {dayItems.some(item => item.type === 'event') && !isSelected && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* DAY DETAILS CARD */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Schedule details</h3>
            <p className="text-xs text-indigo-400 font-black mt-1">{selectedDateStr}</p>
          </div>

          {selectedDayItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500 space-y-2">
              <Clock className="w-8 h-8 text-gray-700 mx-auto" />
              <p className="text-xs font-semibold">No Scheduled Events</p>
              <p className="text-[10px] text-gray-600">Enjoy your free day! Click on dates containing markers to display schedules.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {selectedDayItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border flex flex-col gap-2.5 ${getItemColor(item.type)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-950/40 border border-white/5">
                      {item.type}
                    </span>
                    <span className="text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 opacity-70" />
                      {item.time}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-white leading-snug">{item.title}</h4>

                  {item.location && (
                    <div className="flex items-center gap-1.5 text-[9px] opacity-80 font-semibold mt-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Stats Panel */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2.5">
            <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Month Summary</span>
            <div className="grid grid-cols-2 gap-4 text-xs font-bold">
              <div className="flex flex-col bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-rose-400">Deadlines</span>
                <span className="text-white text-lg mt-1 font-black">{items.filter(item => item.type === 'deadline').length}</span>
              </div>
              <div className="flex flex-col bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-amber-400">Vendor bookings</span>
                <span className="text-white text-lg mt-1 font-black">{items.filter(item => item.type === 'booking').length}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

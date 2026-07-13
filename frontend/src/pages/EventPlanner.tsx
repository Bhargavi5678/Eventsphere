import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Calendar, 
  Clock, 
  CheckSquare, 
  Briefcase, 
  CalendarCheck,
  Plus, 
  Trash2, 
  FileText,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ScheduleSession {
  id: number;
  title: string;
  speaker: string;
  start_time: string;
  end_time: string;
  location: string;
}

interface EventPlannerProps {
  eventId: number;
  triggerNotification: (message: string) => void;
}

export const EventPlanner: React.FC<EventPlannerProps> = ({ eventId, triggerNotification }) => {
  const { t } = useLanguage();

  // Smart Scheduler states
  const [schedule, setSchedule] = useState<ScheduleSession[]>([]);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionSpeaker, setSessionSpeaker] = useState('');
  const [sessionStart, setSessionStart] = useState('');
  const [sessionEnd, setSessionEnd] = useState('');
  const [sessionLocation, setSessionLocation] = useState('Main Auditorium');

  // AI Planner states
  const [aiTheme, setAiTheme] = useState('Retro Cyberpunk');
  const [aiBudget, setAiBudget] = useState(25000);
  const [aiGuests, setAiGuests] = useState(150);
  const [aiType, setAiType] = useState('Conference');
  const [aiPlan, setAiPlan] = useState<any>(null);
  const [planning, setPlanning] = useState(false);

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/schedule`);
      const data = await res.json();
      setSchedule(data);
    } catch (err) {
      console.error("Error loading schedule", err);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [eventId]);

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle || !sessionStart || !sessionEnd) return;

    // Local overlap warning check
    const hasConflict = schedule.some(s => 
      s.location === sessionLocation && 
      ((sessionStart < s.end_time) && (sessionEnd > s.start_time))
    );

    if (hasConflict) {
      if (!window.confirm("WARNING: There is an overlapping schedule session in the same location. Proceed anyway?")) return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sessionTitle,
          speaker: sessionSpeaker || null,
          start_time: sessionStart,
          end_time: sessionEnd,
          location: sessionLocation
        })
      });
      if (res.ok) {
        setSessionTitle('');
        setSessionSpeaker('');
        setSessionStart('');
        setSessionEnd('');
        triggerNotification("Schedule session added to timetable!");
        fetchSchedule();
      }
    } catch (err) {
      console.error("Error adding session", err);
    }
  };

  const handleDeleteSession = async (sessId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule/${sessId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerNotification("Schedule session removed.");
        fetchSchedule();
      }
    } catch (err) {
      console.error("Error deleting session", err);
    }
  };

  const handleRunAIPlanner = async () => {
    setPlanning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: aiTheme,
          budget: aiBudget,
          guest_count: aiGuests,
          event_type: aiType
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAiPlan(data);
        triggerNotification("AI Plan generated successfully!");
      }
    } catch (err) {
      console.error("Error generating plan", err);
    } finally {
      setPlanning(false);
    }
  };

  const handleSyncAIToSchedule = async (item: any) => {
    try {
      const timeParts = item.time.split(' '); // e.g. "09:00 AM" or "10:00 AM"
      let formattedTime = timeParts[0];
      const ampm = timeParts[1];
      if (ampm === 'PM' && formattedTime.substring(0, 2) !== '12') {
        const hour = parseInt(formattedTime.substring(0, 2)) + 12;
        formattedTime = hour + formattedTime.substring(2);
      }
      // Set end time to 1 hour later
      const hr = parseInt(formattedTime.substring(0, 2));
      const endHr = hr + 1;
      const formattedEndTime = (endHr < 10 ? '0' : '') + endHr + formattedTime.substring(2);

      const res = await fetch(`${API_BASE_URL}/events/${eventId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.activity,
          speaker: "AI Suggested",
          start_time: formattedTime,
          end_time: formattedEndTime,
          location: "Main Hall"
        })
      });
      if (res.ok) {
        triggerNotification("Suggested activity synced to schedule!");
        fetchSchedule();
      }
    } catch (err) {
      console.error("Error syncing session", err);
    }
  };

  const handleDownloadICS = () => {
    window.open(`${API_BASE_URL}/events/${eventId}/ics`);
    triggerNotification("Downloading Calendar sync .ics file.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('aiPlanner')}</h1>
        <p className="text-gray-400 text-sm mt-1">Harness AI to model checklists, plan itineraries, book category providers, and manage your master schedule.</p>
      </div>

      {/* Grid: AI Planner console & master schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* AI Planner Config Form */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <BrainCircuit className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
              AI Event Architect Copilot
            </h3>
            <span className="text-[9px] text-gray-500 font-bold uppercase">Dynamic Builder</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Event Type</label>
                <select
                  value={aiType}
                  onChange={e => setAiType(e.target.value)}
                  className="w-full glass-input rounded-xl px-2.5 py-1.5 bg-slate-900"
                >
                  <option value="Conference">Tech Conference</option>
                  <option value="Wedding">Wedding Ceremony</option>
                  <option value="Concert">Music Festival</option>
                  <option value="Gala">Corporate Dinner Gala</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Aesthetic Theme</label>
                <input 
                  type="text" 
                  value={aiTheme}
                  onChange={e => setAiTheme(e.target.value)}
                  placeholder="e.g. Glassmorphism Cyberpunk"
                  className="w-full glass-input rounded-xl px-2.5 py-1.5" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Allocated Budget ($)</label>
                <input 
                  type="number" 
                  value={aiBudget}
                  onChange={e => setAiBudget(parseInt(e.target.value))}
                  placeholder="30000"
                  className="w-full glass-input rounded-xl px-2.5 py-1.5" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Target Guest Count</label>
                <input 
                  type="number" 
                  value={aiGuests}
                  onChange={e => setAiGuests(parseInt(e.target.value))}
                  placeholder="200"
                  className="w-full glass-input rounded-xl px-2.5 py-1.5" 
                />
              </div>

              <button
                onClick={handleRunAIPlanner}
                disabled={planning}
                className="w-full py-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 glow-primary border border-white/10"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {planning ? 'Analyzing structure...' : 'Generate Plan'}
              </button>
            </div>

            {/* AI Note and quick checklist */}
            <div className="bg-[#0b0f19]/80 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[220px]">
              {aiPlan ? (
                <div className="w-full space-y-3.5 text-left text-[10px] animate-in fade-in duration-300">
                  <div>
                    <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest block">AI Copilot assessment</span>
                    <p className="text-gray-300 italic leading-normal mt-1">"{aiPlan.ai_note}"</p>
                  </div>

                  <div className="border-t border-white/5 pt-3.5 space-y-2">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wide block">Priority Tasks generated</span>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 font-semibold text-gray-400">
                      {aiPlan.suggested_checklist.map((task: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <CheckSquare className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate">{task.task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <BrainCircuit className="w-8 h-8 text-indigo-500/30 mx-auto animate-pulse" />
                  <p className="text-[10px] text-gray-500 leading-normal px-4">Provide specifications and execute the AI event architect to map timelines, tasks, and recommended vendors.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timetable Smart Scheduler */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-purple-400" />
              Smart Timetable Scheduler
            </h3>
            
            {/* Sync actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDownloadICS}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
              >
                <FileText className="w-3 h-3 text-indigo-400" />
                Export ICS
              </button>
            </div>
          </div>

          {/* Master Schedule timeline */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-56">
            {schedule.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-12">No schedule sessions logged yet. Create slots below.</p>
            ) : (
              schedule.map(slot => {
                // simple comparison check for warnings
                const overlaps = schedule.filter(s => s.id !== slot.id && s.location === slot.location && ((slot.start_time < s.end_time) && (slot.end_time > s.start_time)));
                return (
                  <div key={slot.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">{slot.title}</h4>
                        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-semibold mt-1">
                          <span>{slot.start_time} - {slot.end_time}</span>
                          <span>|</span>
                          <span className="text-indigo-300">{slot.location}</span>
                          {slot.speaker && (
                            <>
                              <span>|</span>
                              <span className="text-purple-400">Host: {slot.speaker}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {overlaps.length > 0 && (
                        <span title="Timing conflict detected!" className="p-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteSession(slot.id)}
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-white/5 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Session Form */}
          <form onSubmit={handleAddSession} className="grid grid-cols-1 md:grid-cols-5 gap-2 border-t border-white/5 pt-4 items-end text-xs">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Session Title</label>
              <input 
                type="text" 
                value={sessionTitle}
                onChange={e => setSessionTitle(e.target.value)}
                placeholder="React Server Components"
                required
                className="w-full glass-input rounded-xl px-2.5 py-1.5" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Host/Speaker</label>
              <input 
                type="text" 
                value={sessionSpeaker}
                onChange={e => setSessionSpeaker(e.target.value)}
                placeholder="Dr. Vance"
                className="w-full glass-input rounded-xl px-2.5 py-1.5" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Timing (Start/End)</label>
              <div className="grid grid-cols-2 gap-1 font-semibold">
                <input type="text" placeholder="10:00" value={sessionStart} onChange={e => setSessionStart(e.target.value)} required className="w-full glass-input rounded-xl px-1.5 py-1.5 text-center text-[10px]" />
                <input type="text" placeholder="11:30" value={sessionEnd} onChange={e => setSessionEnd(e.target.value)} required className="w-full glass-input rounded-xl px-1.5 py-1.5 text-center text-[10px]" />
              </div>
            </div>
            <div>
              <button 
                type="submit" 
                className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer glow-primary"
              >
                Add Slot
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Render AI Suggested Itinerary & Vendor Recommendations */}
      {aiPlan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
          {/* Timeline Itinerary */}
          <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <CalendarCheck className="w-4.5 h-4.5 text-indigo-400" />
              AI Generated Timeline Itinerary
            </h3>
            
            <div className="space-y-4 border-l-2 border-indigo-500/25 ml-4 pl-6 relative">
              {aiPlan.suggested_itinerary.map((item: any, idx: number) => (
                <div key={idx} className="relative space-y-1.5">
                  {/* Timeline dot */}
                  <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-slate-950 absolute -left-[31px] top-1 flex items-center justify-center glow-primary"></span>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {item.time}
                    </span>
                    <button
                      onClick={() => handleSyncAIToSchedule(item)}
                      className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded hover:bg-indigo-500/20 border border-indigo-500/20 cursor-pointer"
                    >
                      Sync to Schedule
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-white">{item.activity}</h4>
                  <p className="text-[10px] text-gray-400 leading-normal">{item.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor recommendations */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <Briefcase className="w-4.5 h-4.5 text-purple-400" />
                AI Vendor Allocation Suggestions
              </h3>
              
              <div className="space-y-3.5">
                {aiPlan.recommended_vendors.map((vendor: any, idx: number) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] leading-normal space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">{vendor.category}: {vendor.recommendation}</span>
                      <span className="text-emerald-400">${vendor.estimated_cost.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 italic">"{vendor.justification}"</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[9px] text-gray-500 font-bold border-t border-white/5 pt-4">
              *Allocations calculated utilizing theme-weighted starting price coefficients. Compare quotes in the Budget Marketplace.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

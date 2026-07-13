import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  MessageSquare, 
  HelpCircle, 
  ThumbsUp,
  Award,
  Calendar,
  AlertTriangle,
  Play,
  Copy,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  CheckSquare,
  Plus,
  Briefcase,
  Star,
  QrCode,
  Download,
  Clock,
  MapPin,
  Trash2,
  X
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

interface DashboardProps {
  eventId: number;
  triggerNotification: (message: string) => void;
  userRole?: string;
  userEmail?: string;
  userId?: number;
  onNavigate?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  eventId, 
  triggerNotification,
  userRole = 'Admin',
  userEmail = 'admin@eventsphere.com',
  userId,
  onNavigate
}) => {
  const { t } = useLanguage();
  
  // COMMON DATA STATE
  const [stats, setStats] = useState({
    totalGuests: 0,
    attendingGuests: 0,
    pendingGuests: 0,
    totalRevenue: 0.0,
    checkedInCount: 0
  });
  const [events, setEvents] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newQuestionUser, setNewQuestionUser] = useState('');

  // Create Event states
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventGuestLimit, setNewEventGuestLimit] = useState(100);
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventTheme, setNewEventTheme] = useState('glassmorphism-dark');
  const [newEventStatus, setNewEventStatus] = useState('Published');

  // ORGANIZER SPECIFIC STATE
  const [sessions, setSessions] = useState<any[]>([]);
  const [budgetTotal, setBudgetTotal] = useState(30000); // Default total budget
  const [budgetRemaining, setBudgetRemaining] = useState(30000);
  const [tasks, setTasks] = useState([
    { id: 1, text: "Verify AV sound system check", done: true },
    { id: 2, text: "Confirm catering layout options", done: false },
    { id: 3, text: "Double-check speaker presentation badges", done: false },
    { id: 4, text: "Sync schedule calendar with staff members", done: true }
  ]);
  const [newTaskText, setNewTaskText] = useState('');

  // VENDOR SPECIFIC STATE
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [vendorBookings, setVendorBookings] = useState<any[]>([]);
  const [vAvailability, setVAvailability] = useState(true);
  const [vPrice, setVPrice] = useState(120.0);
  const [vCategory, setVCategory] = useState('Catering');

  // GUEST SPECIFIC STATE
  const [guestProfile, setGuestProfile] = useState<any>(null);
  const [guestTicket, setGuestTicket] = useState<any>(null);
  const [guestRsvp, setGuestRsvp] = useState('Pending');

  // Fetch all initial data
  const loadDashboard = async () => {
    try {
      // 1. Fetch Events
      const eventRes = await fetch(`${API_BASE_URL}/events/`);
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvents(eventData);
      }

      // 2. Fetch Guests for Event 1
      const guestRes = await fetch(`${API_BASE_URL}/events/${eventId}/guests`);
      const guestData = await guestRes.json();
      
      // 3. Fetch Tickets
      const ticketRes = await fetch(`${API_BASE_URL}/events/${eventId}/tickets`);
      const ticketData = await ticketRes.json();
      
      // Calculate general stats
      const total = guestData.length;
      const attending = guestData.filter((g: any) => g.status === 'Attending').length;
      const pending = guestData.filter((g: any) => g.status === 'Pending').length;
      const rev = ticketData.reduce((acc: number, t: any) => acc + (t.price || 0), 0);
      const checkedIn = ticketData.filter((t: any) => t.checked_in).length;

      setStats({
        totalGuests: total,
        attendingGuests: attending,
        pendingGuests: pending,
        totalRevenue: rev,
        checkedInCount: checkedIn
      });

      // 4. Fetch Polls & Q&A
      const pollRes = await fetch(`${API_BASE_URL}/events/${eventId}/polls`);
      if (pollRes.ok) setPolls(await pollRes.json());

      const qRes = await fetch(`${API_BASE_URL}/events/${eventId}/questions`);
      if (qRes.ok) setQuestions(await qRes.json());

      // 5. Fetch Schedule sessions for Organizer schedule widget
      const sessRes = await fetch(`${API_BASE_URL}/events/${eventId}/sessions`);
      if (sessRes.ok) setSessions(await sessRes.json());

      // 6. Fetch Budget details to calculate remaining budget
      const budgetRes = await fetch(`${API_BASE_URL}/events/${eventId}/budget`);
      if (budgetRes.ok) {
        const budgetData = await budgetRes.json();
        const totalActualExpense = budgetData.reduce((acc: number, b: any) => acc + b.actual_amount, 0);
        setBudgetRemaining(budgetTotal - totalActualExpense);
      }

      // 7. ROLE SPECIFIC DATA FETCH
      if (userRole === 'Vendor') {
        const vendorListRes = await fetch(`${API_BASE_URL}/vendors`);
        if (vendorListRes.ok) {
          const vendors = await vendorListRes.json();
          // Seed maps vendor@eventsphere.com to Epicurean Catering (id=1)
          const myProfile = vendors.find((v: any) => v.id === 1);
          if (myProfile) {
            setVendorProfile(myProfile);
            setVAvailability(myProfile.availability);
            setVPrice(myProfile.starting_price);
            setVCategory(myProfile.category);
            
            // Fetch bookings
            const bookingsRes = await fetch(`${API_BASE_URL}/events/${eventId}/bookings`);
            if (bookingsRes.ok) {
              const bData = await bookingsRes.json();
              setVendorBookings(bData.filter((b: any) => b.vendor_id === myProfile.id));
            }
          }
        }
      } else if (userRole === 'Guest') {
        // Find guest listing that matches user email (guest@eventsphere.com)
        const myGuest = guestData.find((g: any) => g.email === userEmail);
        if (myGuest) {
          setGuestProfile(myGuest);
          setGuestRsvp(myGuest.status);
          
          // Find matching ticket
          const myTicket = ticketData.find((t: any) => t.guest_id === myGuest.id);
          if (myTicket) {
            setGuestTicket(myTicket);
          }
        }
      }

    } catch (err) {
      console.error("Error fetching dashboard aggregated data", err);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 8000);
    return () => clearInterval(interval);
  }, [eventId, userRole, userEmail]);

  // VOTE POLL
  const handleVote = async (pollId: number, optionIndex: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_index: optionIndex })
      });
      if (res.ok) {
        triggerNotification("Vote cast successfully!");
        loadDashboard();
      }
    } catch (err) {
      console.error("Error voting", err);
    }
  };

  // ASK LIVE Q&A QUESTION
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: newQuestionUser.trim() || "Anonymous",
          question_text: newQuestion.trim()
        })
      });
      if (res.ok) {
        setNewQuestion('');
        setNewQuestionUser('');
        triggerNotification("Question submitted to live board!");
        loadDashboard();
      }
    } catch (err) {
      console.error("Error submitting question", err);
    }
  };

  const handleUpvoteQuestion = async (qId: number) => {
    try {
      await fetch(`${API_BASE_URL}/questions/${qId}/upvote`, { method: 'POST' });
      loadDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswerQuestion = async (qId: number) => {
    try {
      await fetch(`${API_BASE_URL}/questions/${qId}/answer`, { method: 'POST' });
      triggerNotification("Question marked as answered.");
      loadDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  // EVENT DUPLICATION, PUBLISH, CANCEL, DELETE
  const handleDuplicateEvent = async (eId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eId}/duplicate`, { method: 'POST' });
      if (res.ok) {
        triggerNotification("Event duplicated successfully! Saved as Draft.");
        loadDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishEvent = async (eId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eId}/publish`, { method: 'POST' });
      if (res.ok) {
        triggerNotification("Event published successfully!");
        loadDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelEvent = async (eId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eId}/cancel`, { method: 'POST' });
      if (res.ok) {
        triggerNotification("Event status updated to Cancelled.");
        loadDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (eId: number) => {
    if (!window.confirm("Are you sure you want to delete this event? This will remove all guests and ticketing data.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eId}`, { method: 'DELETE' });
      if (res.ok) {
        triggerNotification("Event deleted successfully.");
        loadDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/events/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEventTitle,
          description: newEventDescription,
          date: newEventDate,
          location: newEventLocation,
          theme: newEventTheme,
          status: newEventStatus,
          guest_limit: newEventGuestLimit,
          organizer_id: userId
        })
      });
      if (res.ok) {
        triggerNotification("Event created successfully!");
        setShowCreateEventModal(false);
        setNewEventTitle('');
        setNewEventDate('');
        setNewEventLocation('');
        setNewEventGuestLimit(100);
        setNewEventDescription('');
        setNewEventTheme('glassmorphism-dark');
        setNewEventStatus('Published');
        loadDashboard();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create event");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting server");
    }
  };

  // VENDOR PROFILE UPDATES
  const handleToggleAvailability = async () => {
    try {
      setVAvailability(!vAvailability);
      triggerNotification("Availability updated.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePrice = (e: React.FormEvent) => {
    e.preventDefault();
    triggerNotification("Vendor catalog rates updated successfully!");
  };

  // GUEST RSVP CHANGE (Accept, Decline, Maybe)
  const handleGuestRsvp = async (newStatus: string) => {
    if (!guestProfile) return;
    try {
      const res = await fetch(`${API_BASE_URL}/guests/${guestProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setGuestRsvp(updated.status);
        triggerNotification(`RSVP logged as: ${updated.status}`);
        loadDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // SIMULATE DOWNLOAD PDF TICKET
  const handleDownloadTicketPDF = () => {
    window.print();
    triggerNotification("Downloading Ticket PDF Simulator... Saved to Downloads.");
  };

  // ORGANIZER TASKS
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks([
      ...tasks,
      { id: Date.now(), text: newTaskText.trim(), done: false }
    ]);
    setNewTaskText('');
    triggerNotification("Task added to event checklist.");
  };

  const toggleTask = (taskId: number) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
  };

  // Recharts calculations
  const rsvpData = [
    { name: 'Attending', value: stats.attendingGuests },
    { name: 'Pending', value: stats.pendingGuests },
    { name: 'Declined', value: stats.totalGuests - stats.attendingGuests - stats.pendingGuests }
  ].filter(item => item.value > 0);

  const COLORS = ['#818cf8', '#c084fc', '#f87171'];

  const salesHistory = [
    { name: 'July 1', sales: Math.round(stats.totalRevenue * 0.1) },
    { name: 'July 3', sales: Math.round(stats.totalRevenue * 0.3) },
    { name: 'July 5', sales: Math.round(stats.totalRevenue * 0.45) },
    { name: 'July 7', sales: Math.round(stats.totalRevenue * 0.75) },
    { name: 'July 9', sales: stats.totalRevenue }
  ];

  // ==========================================
  // 1. ADMIN DASHBOARD VIEW
  // ==========================================
  const renderAdminDashboard = () => (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System Admin Console</h1>
        <p className="text-gray-400 text-sm mt-1">Platform aggregated event analytics, statistics, and system logs.</p>
      </div>

      {/* Stats HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-white/5">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Platform Events</p>
            <h3 className="text-3xl font-black text-white mt-1.5">{events.length}</h3>
            <span className="text-[9px] text-indigo-400 font-bold tracking-wider">{events.filter(e => e.status === 'Published').length} Published</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/15">
            <Calendar className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-white/5">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Guests</p>
            <h3 className="text-3xl font-black text-white mt-1.5">{stats.totalGuests}</h3>
            <span className="text-[9px] text-purple-400 font-bold tracking-wider">{stats.attendingGuests} RSVP Attending</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/15">
            <Users className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-white/5">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Revenue</p>
            <h3 className="text-3xl font-black text-white mt-1.5">${stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
            <span className="text-[9px] text-emerald-400 font-bold tracking-wider">Simulated tickets</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/15">
            <DollarSign className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-white/5">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Checked In Rate</p>
            <h3 className="text-3xl font-black text-white mt-1.5">
              {stats.totalGuests > 0 ? Math.round((stats.checkedInCount / stats.totalGuests) * 100) : 0}%
            </h3>
            <span className="text-[9px] text-amber-400 font-bold tracking-wider">{stats.checkedInCount} check-ins</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/15">
            <CheckCircle className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 border border-white/5">
          <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-4">Ticket Sales Performance</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesHistory}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.05)', color: '#fff' }} />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-white/5">
          <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-2">RSVP Breakdown</h3>
          <div className="h-44 w-full flex justify-center items-center">
            {rsvpData.length === 0 ? (
              <p className="text-[10px] text-gray-500">No RSVP data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rsvpData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {rsvpData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.05)', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-around text-[10px] font-bold text-gray-400">
            {rsvpData.map((d, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                <span>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Interactive Polls */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 border border-white/5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Live interactive poll
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400 animate-pulse uppercase">Active</span>
          </div>

          {polls.map((poll) => {
            const totalVotes = poll.votes.reduce((a: number, b: number) => a + b, 0);
            return (
              <div key={poll.id} className="space-y-3">
                <h4 className="text-xs font-bold text-gray-200">{poll.question}</h4>
                <div className="space-y-2">
                  {poll.options.map((option: string, optIdx: number) => {
                    const voteCount = poll.votes[optIdx] || 0;
                    const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleVote(poll.id, optIdx)}
                        className="w-full text-left relative overflow-hidden rounded-xl bg-white/5 border border-white/5 p-3 hover:bg-white/10 hover:border-indigo-500/25 transition-all group cursor-pointer"
                      >
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-indigo-500/10 transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        ></div>
                        <div className="relative flex justify-between text-xs font-bold z-10">
                          <span className="text-gray-300 group-hover:text-white transition-colors">{option}</span>
                          <span className="text-indigo-400">{percent}% ({voteCount})</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Q&A board */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[320px] border border-white/5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              Live Q&amp;A board
            </h3>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Moderation Mode</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-2">
            {questions.length === 0 ? (
              <p className="text-[10px] text-gray-500 text-center py-8">No guest questions posted yet.</p>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-purple-400">{q.guest_name}</span>
                      {q.is_answered && <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 px-1 rounded text-emerald-400 font-bold uppercase">Answered</span>}
                    </div>
                    <p className="text-[11px] text-gray-300 mt-1 font-semibold">{q.question_text}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleUpvoteQuestion(q.id)} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-indigo-400">
                      <ThumbsUp className="w-3 h-3" /> {q.upvotes}
                    </button>
                    {!q.is_answered && (
                      <button onClick={() => handleAnswerQuestion(q.id)} className="text-[8px] font-black bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-purple-400 uppercase">
                        Answer
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // 2. EVENT ORGANIZER DASHBOARD VIEW
  // ==========================================
  const renderOrganizerDashboard = () => (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Event Host Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Manage event creation, duplicating, publishing statuses, budgets, and tasks.</p>
      </div>

      {/* KPI HUD Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-white/5">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Guests</p>
            <h3 className="text-3xl font-black text-white mt-1.5">{stats.totalGuests}</h3>
            <span className="text-[9px] text-indigo-400 font-bold tracking-wider">{stats.attendingGuests} RSVP Attending</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/15">
            <Users className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-white/5">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Revenue Generated</p>
            <h3 className="text-3xl font-black text-white mt-1.5">${stats.totalRevenue.toLocaleString()}</h3>
            <span className="text-[9px] text-purple-400 font-bold tracking-wider">Ticket sales log</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/15">
            <DollarSign className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-white/5">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Budget Remaining</p>
            <h3 className="text-3xl font-black text-white mt-1.5">${budgetRemaining.toLocaleString()}</h3>
            <span className="text-[9px] text-emerald-400 font-bold tracking-wider">Out of ${budgetTotal.toLocaleString()}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/15">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-white/5">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pending RSVPs</p>
            <h3 className="text-3xl font-black text-white mt-1.5">{stats.pendingGuests}</h3>
            <span className="text-[9px] text-amber-400 font-bold tracking-wider">Guests awaiting response</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/15">
            <AlertTriangle className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Grid: Upcoming Events & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upcoming Events (Create, Edit, Delete, Duplicate, Publish, Cancel) */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 border border-white/5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Upcoming Events Management
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateEventModal(true)}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Book New Event
              </button>
              <span className="text-[9px] text-gray-400 font-bold">Total: {events.length}</span>
            </div>
          </div>

          <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
            {events.map((e) => (
              <div 
                key={e.id} 
                className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-white text-sm">{e.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border uppercase tracking-wider ${
                      e.status === 'Published' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : e.status === 'Cancelled'
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                    }`}>
                      {e.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {e.location} | <Clock className="w-3.5 h-3.5 text-purple-400" /> {e.date}
                  </p>
                  <span className="text-[9px] text-gray-500 font-semibold block">Guest Limit: {e.guest_limit} guests</span>
                </div>

                {/* Operations buttons */}
                <div className="flex items-center flex-wrap gap-1.5">
                  <button 
                    onClick={() => handleDuplicateEvent(e.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/5 cursor-pointer flex items-center gap-1 text-[9px] font-bold"
                    title="Duplicate Event"
                  >
                    <Copy className="w-3 h-3" /> Duplicate
                  </button>

                  {e.status !== 'Published' && (
                    <button 
                      onClick={() => handlePublishEvent(e.id)}
                      className="p-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white transition-colors border border-emerald-500/30 cursor-pointer flex items-center gap-1 text-[9px] font-bold"
                    >
                      <Play className="w-3 h-3" /> Publish
                    </button>
                  )}

                  {e.status !== 'Cancelled' && (
                    <button 
                      onClick={() => handleCancelEvent(e.id)}
                      className="p-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 transition-colors border border-amber-500/20 cursor-pointer text-[9px] font-bold"
                    >
                      Cancel
                    </button>
                  )}

                  <button 
                    onClick={() => handleDeleteEvent(e.id)}
                    className="p-2 rounded-xl bg-red-950/20 hover:bg-red-900/30 text-red-400 transition-colors border border-red-500/10 cursor-pointer text-[9px] font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Checklist widget */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-400" />
              Event Tasks checklist
            </h3>
            <span className="text-[10px] text-gray-400 font-bold">{tasks.filter(t => t.done).length}/{tasks.length} Done</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
            {tasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer text-xs font-semibold text-gray-300"
              >
                <input 
                  type="checkbox" 
                  checked={task.done} 
                  readOnly 
                  className="rounded border-white/10 text-indigo-600 focus:ring-0 bg-slate-900 pointer-events-none"
                />
                <span className={task.done ? 'line-through text-gray-600' : ''}>{task.text}</span>
              </div>
            ))}
          </div>

          {/* Add task form */}
          <form onSubmit={handleAddTask} className="flex gap-2 pt-3 border-t border-white/5">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add new task..."
              required
              className="flex-1 glass-input rounded-xl px-3 py-2 text-xs"
            />
            <button 
              type="submit" 
              className="w-9 h-9 bg-purple-600 hover:bg-purple-500 rounded-xl flex items-center justify-center text-white cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* Today's Schedule timeline */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">Today's Agenda Schedule</h3>
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {sessions.map((s, idx) => (
            <div key={s.id || idx} className="flex gap-4 items-start">
              <div className="w-20 text-[10px] font-extrabold text-indigo-400 mt-1 text-right">{s.start_time} - {s.end_time}</div>
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-2 relative">
                <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-30"></span>
              </div>
              <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white">{s.title}</h4>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">{s.speaker || 'No Speaker'} | {s.location || 'Silicon Valley'}</span>
                </div>
                <span className="text-[9px] border border-white/10 px-2 py-0.5 rounded bg-slate-900/50 text-gray-400 font-bold uppercase tracking-wider">{s.session_type || 'session'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ==========================================
  // 3. VENDOR DASHBOARD VIEW
  // ==========================================
  const renderVendorDashboard = () => (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Vendor Management Panel</h1>
        <p className="text-gray-400 text-sm mt-1">Manage bookings, service rates, check availability, and read organizer reviews.</p>
      </div>

      {/* Vendor Profile & Settings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Availability & Price Updates */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Service Profile</h3>
            <p className="text-xs text-gray-500 mt-1">{vendorProfile?.name || 'Loading Catalog details...'}</p>
          </div>

          {/* Toggle Availability */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-gray-300 block">Accepting Bookings</span>
              <span className="text-[10px] text-gray-500">Enable/disable vendor visibility on marketplace</span>
            </div>
            <button 
              onClick={handleToggleAvailability}
              className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              {vAvailability ? (
                <ToggleRight className="w-12 h-12 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-gray-600" />
              )}
            </button>
          </div>

          {/* Catalog updates */}
          <form onSubmit={handleUpdatePrice} className="space-y-4 pt-3 border-t border-white/5">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Marketplace Category</label>
              <select
                value={vCategory}
                onChange={(e) => setVCategory(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-slate-900/60"
              >
                <option value="Catering">Catering</option>
                <option value="Photography">Photography</option>
                <option value="Decoration">Decoration</option>
                <option value="DJ">DJ</option>
                <option value="Makeup">Makeup</option>
                <option value="Venue">Venue</option>
                <option value="Security">Security</option>
                <option value="Transportation">Transportation</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Starting Price ($)</label>
              <input
                type="number"
                value={vPrice}
                onChange={(e) => setVPrice(Number(e.target.value))}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-slate-900/60 text-white"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Update Catalog details
            </button>
          </form>

        </div>

        {/* Bookings log */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 lg:col-span-2 space-y-4">
          <div className="border-b border-white/5 pb-3 flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              Service Bookings log
            </h3>
            <span className="text-[10px] text-gray-400 font-bold">Total: {vendorBookings.length}</span>
          </div>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {vendorBookings.length === 0 ? (
              <p className="text-[10px] text-gray-500 text-center py-12 italic">No event bookings received yet.</p>
            ) : (
              vendorBookings.map((b) => (
                <div key={b.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-white text-xs">Event ID: #{b.event_id}</h4>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-purple-400" /> Date: {b.booking_date || 'N/A'}</p>
                    <span className="text-[10px] font-black text-emerald-400 block">Logged Rate: ${b.cost.toLocaleString()}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase">{b.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Reviews log */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          Client Reviews &amp; Ratings
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {vendorProfile?.reviews?.map((r: any, idx: number) => (
            <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <strong className="text-indigo-300 font-bold">{r.author}</strong>
                <span className="text-gray-500">{r.date}</span>
              </div>
              <div className="flex text-amber-400 gap-0.5">
                {Array.from({ length: 5 }).map((_, sI) => (
                  <Star key={sI} className={`w-3.5 h-3.5 ${sI < r.rating ? 'fill-amber-400' : 'text-gray-700'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-400 italic">"{r.comment}"</p>
            </div>
          ))}
          {!vendorProfile?.reviews || vendorProfile.reviews.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No feedback submissions received yet.</p>
          ) : null}
        </div>
      </div>

    </div>
  );

  // ==========================================
  // 4. GUEST DASHBOARD VIEW
  // ==========================================
  const renderGuestDashboard = () => (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Guest Portal</h1>
        <p className="text-gray-400 text-sm mt-1">Review event RSVPs, view boarding-pass QR tickets, and check schedules.</p>
      </div>

      {/* Waitlist Alerts */}
      {guestRsvp === 'Waitlist' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 text-amber-300 text-xs font-semibold animate-pulse">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong className="block text-white font-bold">You are on the event Waitlist</strong>
            The guest capacity limit has been exceeded. If a spot opens up, your status will automatically transition.
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* RSVP Toggles & Details */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">RSVP Status Confirmation</h3>
            <p className="text-xs text-gray-500 mt-1">Update your attending status instantly</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/40 border border-white/5 p-3 rounded-2xl justify-between">
            <span className="text-xs font-bold text-gray-400">Current Status</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
              guestRsvp === 'Attending' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : guestRsvp === 'Waitlist'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : guestRsvp === 'Declined'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
            }`}>
              {guestRsvp}
            </span>
          </div>

          {/* Selection buttons */}
          <div className="space-y-2 pt-2">
            <button 
              onClick={() => handleGuestRsvp('Attending')}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer glow-primary border border-indigo-500/30"
            >
              Accept RSVP (Attend)
            </button>
            
            <button 
              onClick={() => handleGuestRsvp('Declined')}
              className="w-full py-2.5 rounded-xl bg-red-950/20 hover:bg-red-900/30 text-red-400 font-bold text-xs transition-colors border border-red-500/15 cursor-pointer"
            >
              Decline RSVP
            </button>

            <button 
              onClick={() => handleGuestRsvp('Maybe')}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-colors border border-white/5 cursor-pointer"
            >
              Mark as "Maybe"
            </button>
          </div>

          <p className="text-[10px] text-gray-500 leading-normal italic text-center">RSVP changes are synced instantly. Check-in is handled at entrance via ticket verification.</p>
        </div>

        {/* Boarding-Pass Ticket QR */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 lg:col-span-2 space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Digital boarding pass</h3>
            <p className="text-xs text-gray-500 mt-1">Download and present ticket code at entry</p>
          </div>

          {guestTicket ? (
            <div className="bg-gradient-to-br from-[#0c1221] to-[#151b2c] border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-6">
              
              {/* Left Details */}
              <div className="space-y-4 flex-1">
                <div>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block">Entry Badge</span>
                  <h4 className="text-lg font-black text-white">{guestProfile?.name}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">{guestProfile?.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[8px] font-extrabold text-gray-500 uppercase block">Ticket Tier</span>
                    <span className="text-white text-xs font-bold">{guestTicket.tier}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-extrabold text-gray-500 uppercase block">Price Paid</span>
                    <span className="text-emerald-400 text-xs font-black">${guestTicket.price}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[8px] font-extrabold text-gray-500 uppercase block">Unique Code</span>
                  <span className="text-indigo-300 text-[10px] font-mono select-all font-bold">{guestTicket.ticket_code}</span>
                </div>
              </div>

              {/* QR and Download button */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="w-28 h-28 bg-white rounded-xl p-2 flex items-center justify-center shadow-lg shadow-indigo-900/10">
                  {/* Fake QR Graphic */}
                  <QrCode className="w-full h-full text-[#080B11]" />
                </div>

                <button 
                  onClick={handleDownloadTicketPDF}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/5 cursor-pointer text-[10px] font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF Ticket
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 italic text-xs">
              No digital ticket code exists. Ensure your RSVP status is confirmed to generate tickets.
            </div>
          )}

        </div>

      </div>

      {/* Attending schedule details */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">Event itinerary sessions</h3>
        <div className="space-y-3.5">
          {sessions.map((s, idx) => (
            <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center gap-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-white text-xs">{s.title}</h4>
                <p className="text-[10px] text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-purple-400" /> Time: {s.start_time} - {s.end_time} | Speaker: {s.speaker}</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-900/60 text-gray-400 border border-white/5 text-[9px] font-bold uppercase">{s.session_type || 'session'}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );

  // Switch layouts based on user role
  const getDashboardContent = () => {
    switch (userRole) {
      case 'Admin':
        return renderAdminDashboard();
      case 'Event Organizer':
        return renderOrganizerDashboard();
      case 'Vendor':
        return renderVendorDashboard();
      case 'Guest':
        return renderGuestDashboard();
      default:
        return renderAdminDashboard();
    }
  };

  return (
    <>
      {getDashboardContent()}

      {/* --- CREATE NEW EVENT MODAL --- */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-[#04060a]/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="glass-panel max-w-lg w-full border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-300 shadow-2xl bg-[#090d16] max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="font-black text-white text-lg">Book / Create New Event</h3>
                <p className="text-xs text-gray-500 mt-0.5">Initialize a new event in the database</p>
              </div>
              <button 
                onClick={() => setShowCreateEventModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Event Form */}
            <form onSubmit={handleCreateEventSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Event Title</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Annual Tech Symposium"
                  required
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Date</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    required
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Guest Limit</label>
                  <input
                    type="number"
                    value={newEventGuestLimit}
                    onChange={(e) => setNewEventGuestLimit(parseInt(e.target.value) || 100)}
                    min="1"
                    required
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Location</label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  required
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Description</label>
                <textarea
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="Brief summary of the event..."
                  rows={3}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Status</label>
                  <select
                    value={newEventStatus}
                    onChange={(e) => setNewEventStatus(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white bg-[#090d16] border border-white/10"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Theme Style</label>
                  <select
                    value={newEventTheme}
                    onChange={(e) => setNewEventTheme(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white bg-[#090d16] border border-white/10"
                  >
                    <option value="glassmorphism-dark">Glassmorphism Dark</option>
                    <option value="minimal-light">Minimal Light</option>
                    <option value="sunset-gradient">Sunset Gradient</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-all cursor-pointer glow-primary border border-indigo-500/50"
              >
                Create Event
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  MessageSquare, 
  HelpCircle, 
  ThumbsUp,
  Award
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

interface DashboardProps {
  eventId: number;
  triggerNotification: (message: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ eventId, triggerNotification }) => {
  const { t } = useLanguage();
  
  // Dashboard states
  const [stats, setStats] = useState({
    totalGuests: 0,
    attendingGuests: 0,
    pendingGuests: 0,
    totalRevenue: 0.0,
    checkedInCount: 0
  });

  const [polls, setPolls] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newQuestionUser, setNewQuestionUser] = useState('');

  // Fetch stats from backend
  const fetchDashboardData = async () => {
    try {
      // Fetch Guests
      const guestRes = await fetch(`http://127.0.0.1:8000/events/${eventId}/guests`);
      const guestData = await guestRes.json();
      
      // Fetch Tickets
      const ticketRes = await fetch(`http://127.0.0.1:8000/events/${eventId}/tickets`);
      const ticketData = await ticketRes.json();
      
      // Calculate Stats
      const total = guestData.length;
      const attending = guestData.filter((g: any) => g.status.toLowerCase() === 'attending').length;
      const pending = guestData.filter((g: any) => g.status.toLowerCase() === 'pending').length;
      
      const rev = ticketData.reduce((acc: number, t: any) => acc + (t.price || 0), 0);
      const checkedIn = ticketData.filter((t: any) => t.checked_in).length;

      setStats({
        totalGuests: total,
        attendingGuests: attending,
        pendingGuests: pending,
        totalRevenue: rev,
        checkedInCount: checkedIn
      });

      // Fetch Polls
      const pollRes = await fetch(`http://127.0.0.1:8000/events/${eventId}/polls`);
      const pollData = await pollRes.json();
      setPolls(pollData);

      // Fetch Q&A Questions
      const qRes = await fetch(`http://127.0.0.1:8000/events/${eventId}/questions`);
      const qData = await qRes.json();
      setQuestions(qData);
    } catch (err) {
      console.error("Error loading dashboard data", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Setup short-polling for real-time live dashboard sync (every 6 seconds)
    const interval = setInterval(fetchDashboardData, 6000);
    return () => clearInterval(interval);
  }, [eventId]);

  const handleVote = async (pollId: number, optionIndex: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_index: optionIndex })
      });
      if (res.ok) {
        triggerNotification("Vote cast successfully!");
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Error voting", err);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/events/${eventId}/questions`, {
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
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Error submitting question", err);
    }
  };

  const handleUpvoteQuestion = async (qId: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/questions/${qId}/upvote`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Error upvoting", err);
    }
  };

  const handleAnswerQuestion = async (qId: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/questions/${qId}/answer`, {
        method: 'POST'
      });
      if (res.ok) {
        triggerNotification("Question marked as answered.");
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Error answering question", err);
    }
  };

  // Recharts configurations
  const rsvpData = [
    { name: 'Attending', value: stats.attendingGuests },
    { name: 'Pending', value: stats.pendingGuests },
    { name: 'Declined', value: stats.totalGuests - stats.attendingGuests - stats.pendingGuests }
  ].filter(item => item.value > 0);

  const COLORS = ['#818cf8', '#c084fc', '#f87171'];

  // Dummy area chart timeline for ticket sales
  const salesHistory = [
    { name: 'July 1', sales: Math.round(stats.totalRevenue * 0.1) },
    { name: 'July 3', sales: Math.round(stats.totalRevenue * 0.3) },
    { name: 'July 5', sales: Math.round(stats.totalRevenue * 0.45) },
    { name: 'July 7', sales: Math.round(stats.totalRevenue * 0.75) },
    { name: 'July 9', sales: stats.totalRevenue }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('liveDashboard')}</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time summaries, ticket volumes, and live audience interaction logs.</p>
      </div>

      {/* KPI HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-all duration-300">
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Invited Guests</p>
            <h3 className="text-3xl font-black text-white mt-2">{stats.totalGuests}</h3>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-wider">{stats.attendingGuests} Attending</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between hover:border-purple-500/30 transition-all duration-300">
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Revenue Log</p>
            <h3 className="text-3xl font-black text-white mt-2">${stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
            <span className="text-[10px] text-purple-400 font-semibold tracking-wider">Ticket sales</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between hover:border-emerald-500/30 transition-all duration-300">
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Checked In</p>
            <h3 className="text-3xl font-black text-white mt-2">
              {stats.checkedInCount} <span className="text-sm font-medium text-gray-400">/ {stats.totalGuests}</span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider">
              {stats.totalGuests > 0 ? Math.round((stats.checkedInCount / stats.totalGuests) * 100) : 0}% Attendance Rate
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between hover:border-amber-500/30 transition-all duration-300">
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">RSVP Rate</p>
            <h3 className="text-3xl font-black text-white mt-2">
              {stats.totalGuests > 0 ? Math.round((stats.attendingGuests / stats.totalGuests) * 100) : 0}%
            </h3>
            <span className="text-[10px] text-amber-400 font-semibold tracking-wider">{stats.pendingGuests} awaiting response</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Revenue Overtime */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-sm font-bold text-white tracking-wide mb-4">Ticket Sales Over Time</h3>
          <div className="h-64 w-full">
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
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151b2c', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RSVP Status Split */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white tracking-wide mb-2">RSVP Status Breakdown</h3>
          <div className="h-52 w-full flex justify-center items-center">
            {rsvpData.length === 0 ? (
              <p className="text-xs text-gray-500">No RSVP data to display.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rsvpData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {rsvpData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#151b2c', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-around text-xs font-semibold text-gray-400">
            {rsvpData.map((d, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                <span>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement features: Polls & Live Q&A */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Polls */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Live Interactive Poll
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 animate-pulse uppercase tracking-wider">
              Active
            </span>
          </div>

          {polls.map((poll) => {
            const totalVotes = poll.votes.reduce((a: number, b: number) => a + b, 0);
            return (
              <div key={poll.id} className="space-y-4">
                <h4 className="text-xs font-semibold text-gray-200">{poll.question}</h4>
                <div className="space-y-3">
                  {poll.options.map((option: string, optIdx: number) => {
                    const voteCount = poll.votes[optIdx] || 0;
                    const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleVote(poll.id, optIdx)}
                        className="w-full text-left relative overflow-hidden rounded-xl bg-white/5 border border-white/5 p-3 hover:bg-white/10 hover:border-indigo-500/20 transition-all group duration-300"
                      >
                        {/* Vote Percent Bar background */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 transition-all duration-1000"
                          style={{ width: `${percent}%` }}
                        ></div>
                        <div className="relative flex justify-between text-xs font-semibold z-10">
                          <span className="text-gray-300 group-hover:text-white transition-colors">{option}</span>
                          <span className="text-indigo-400">{percent}% ({voteCount})</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-500 font-semibold">{totalVotes} votes cast. Click options to vote in simulation.</p>
              </div>
            );
          })}
        </div>

        {/* Live Q&A */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[380px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              Live Q&amp;A Board
            </h3>
            <span className="text-[10px] text-gray-400 font-semibold">Moderation Mode</span>
          </div>

          {/* Q&A list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
            {questions.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">No guest questions asked yet. Be the first!</p>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-purple-400">{q.guest_name}</span>
                      {q.is_answered && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400 uppercase">
                          Answered
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-200 mt-1 font-medium leading-relaxed">{q.question_text}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => handleUpvoteQuestion(q.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-indigo-400 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{q.upvotes}</span>
                    </button>
                    {!q.is_answered && (
                      <button 
                        onClick={() => handleAnswerQuestion(q.id)}
                        className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded hover:bg-purple-500/20 transition-colors"
                      >
                        Answer
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Question Form */}
          <form onSubmit={handleAskQuestion} className="space-y-2 border-t border-white/5 pt-3">
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={newQuestionUser}
                onChange={(e) => setNewQuestionUser(e.target.value)}
                placeholder="Guest Name (optional)"
                className="col-span-1 glass-input rounded-xl px-3 py-1.5 text-xs"
              />
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Type question here..."
                required
                className="col-span-2 glass-input rounded-xl px-3 py-1.5 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer"
            >
              Post Question to Board
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

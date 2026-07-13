import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  HelpCircle, 
  ThumbsUp, 
  Plus, 
  Trash2, 
  Check, 
  Send,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PollsQAProps {
  eventId: number;
  triggerNotification: (message: string) => void;
  userRole?: string;
}

export const PollsQA: React.FC<PollsQAProps> = ({ 
  eventId, 
  triggerNotification, 
  userRole = 'Admin' 
}) => {
  const { t } = useLanguage();
  const [polls, setPolls] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  
  // New question form
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionUser, setNewQuestionUser] = useState('');

  // New poll form (Admin / Organizer only)
  const [showPollModal, setShowPollModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '']);

  const isModerator = userRole === 'Admin' || userRole === 'Event Organizer';

  const loadData = async () => {
    try {
      const pollRes = await fetch(`${API_BASE_URL}/events/${eventId}/polls`);
      if (pollRes.ok) {
        setPolls(await pollRes.json());
      }

      const qRes = await fetch(`${API_BASE_URL}/events/${eventId}/questions`);
      if (qRes.ok) {
        const qData = await qRes.json();
        // Sort questions: unanswered first, then sorted by upvotes descending
        const sorted = [...qData].sort((a, b) => {
          if (a.is_answered !== b.is_answered) {
            return a.is_answered ? 1 : -1;
          }
          return b.upvotes - a.upvotes;
        });
        setQuestions(sorted);
      }
    } catch (err) {
      console.error("Error loading engagement board data", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [eventId]);

  const handleVote = async (pollId: number, optionIndex: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_index: optionIndex })
      });
      if (res.ok) {
        triggerNotification("Vote logged successfully!");
        loadData();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to submit vote");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAskQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: newQuestionUser.trim() || "Anonymous Guest",
          question_text: newQuestionText.trim()
        })
      });
      if (res.ok) {
        triggerNotification("Your question has been posted to the Q&A board!");
        setNewQuestionText('');
        setNewQuestionUser('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpvote = async (qId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/questions/${qId}/upvote`, {
        method: 'POST'
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswerQuestion = async (qId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/questions/${qId}/answer`, {
        method: 'POST'
      });
      if (res.ok) {
        triggerNotification("Question marked as answered.");
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOptionField = () => {
    if (newOptions.length < 6) {
      setNewOptions([...newOptions, '']);
    }
  };

  const handleRemoveOptionField = (idx: number) => {
    if (newOptions.length > 2) {
      setNewOptions(newOptions.filter((_, i) => i !== idx));
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...newOptions];
    updated[idx] = val;
    setNewOptions(updated);
  };

  const handleCreatePollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    const filteredOptions = newOptions.filter(opt => opt.trim() !== '');
    if (filteredOptions.length < 2) {
      alert("Please provide at least 2 options for the poll.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion.trim(),
          options: filteredOptions,
          is_active: true
        })
      });
      if (res.ok) {
        triggerNotification("New live interactive poll created!");
        setShowPollModal(false);
        setNewQuestion('');
        setNewOptions(['', '']);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Live Polls & Q&A</h1>
          <p className="text-gray-400 text-sm mt-1">Interact with attendees in real-time. Moderator actions are highlighted for system coordinators.</p>
        </div>

        {isModerator && (
          <button
            onClick={() => setShowPollModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all cursor-pointer glow-primary border border-indigo-500/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create New Poll
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: LIVE INTERACTIVE POLLS */}
        {/* ========================================== */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-white border-b border-white/5 pb-3">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold">Active Live Polls</h2>
          </div>

          {polls.length === 0 ? (
            <div className="glass-panel p-8 text-center rounded-2xl border border-white/5">
              <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium">No live polls have been launched yet.</p>
              {isModerator && (
                <button
                  onClick={() => setShowPollModal(true)}
                  className="mt-4 px-3 py-1.5 rounded-lg bg-indigo-600/50 hover:bg-indigo-600 text-white text-[11px] font-bold transition-all border border-indigo-500/20"
                >
                  Create first poll
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {polls.map((poll) => {
                const totalVotes = poll.votes.reduce((a: number, b: number) => a + b, 0);
                return (
                  <div key={poll.id} className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-full text-indigo-400 font-extrabold tracking-wider uppercase">Poll #{poll.id}</span>
                      <span className="text-[10px] text-gray-500 font-semibold">{totalVotes} Votes total</span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-relaxed">{poll.question}</h3>
                    
                    <div className="space-y-3">
                      {poll.options.map((option: string, oIdx: number) => {
                        const voteCount = poll.votes[oIdx] || 0;
                        const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleVote(poll.id, oIdx)}
                            className="w-full text-left relative overflow-hidden rounded-xl bg-white/5 border border-white/5 p-3.5 hover:bg-white/10 hover:border-indigo-500/25 transition-all group cursor-pointer"
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
          )}
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: LIVE Q&A BOARD */}
        {/* ========================================== */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-white border-b border-white/5 pb-3">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold">Attendee Q&A Board</h2>
          </div>

          {/* Submit Question Form */}
          <form onSubmit={handleAskQuestionSubmit} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Ask a live question</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Anonymous"
                  value={newQuestionUser}
                  onChange={(e) => setNewQuestionUser(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Your Query</label>
                <input
                  type="text"
                  placeholder="Type your question..."
                  required
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Submit Question
            </button>
          </form>

          {/* Questions List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {questions.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-12 italic">No attendee questions have been submitted yet.</p>
            ) : (
              questions.map((q) => (
                <div 
                  key={q.id} 
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    q.is_answered 
                      ? 'bg-slate-950/20 border-white/5 opacity-60' 
                      : 'bg-white/5 border-white/10 hover:border-purple-500/20 shadow-lg'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-purple-400">{q.guest_name}</span>
                      {q.is_answered ? (
                        <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400 font-bold uppercase flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Answered
                        </span>
                      ) : (
                        <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-amber-400 font-bold uppercase">Pending</span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white leading-relaxed mt-1">{q.question_text}</p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button 
                      onClick={() => handleUpvote(q.id)} 
                      disabled={q.is_answered}
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                        q.is_answered 
                          ? 'border-transparent text-gray-600'
                          : 'border-white/5 bg-white/5 hover:border-indigo-500/30 text-gray-400 hover:text-white'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3 text-indigo-400" /> {q.upvotes}
                    </button>

                    {isModerator && !q.is_answered && (
                      <button 
                        onClick={() => handleAnswerQuestion(q.id)}
                        className="text-[9px] font-black bg-purple-500/10 border border-purple-500/25 px-2.5 py-1 rounded-lg text-purple-400 hover:bg-purple-600 hover:text-white transition-all uppercase"
                      >
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

      {/* --- CREATE NEW POLL MODAL DIALOG (Admin/Organizer) --- */}
      {showPollModal && (
        <div className="fixed inset-0 bg-[#04060a]/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="glass-panel max-w-lg w-full border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-300 shadow-2xl bg-[#090d16] max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="font-black text-white text-lg">Create Live Interactive Poll</h3>
                <p className="text-xs text-gray-500 mt-0.5">Define poll query and selectable voting options</p>
              </div>
              <button 
                onClick={() => setShowPollModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            {/* Poll Form */}
            <form onSubmit={handleCreatePollSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Poll Question</label>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g. What session did you like the most?"
                  required
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              {/* Options list */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Selectable Options</label>
                  {newOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOptionField}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add option
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {newOptions.map((option, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        required
                        className="flex-1 glass-input rounded-xl px-4 py-2 text-xs text-white"
                      />
                      {newOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(idx)}
                          className="w-8 h-8 rounded-xl bg-red-950/20 border border-red-500/10 hover:bg-red-900/30 flex items-center justify-center text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-all cursor-pointer glow-primary border border-indigo-500/50"
              >
                Create and Launch Poll
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

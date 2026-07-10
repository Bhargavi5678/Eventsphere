import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, CornerDownLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface AIAssistantWidgetProps {
  eventId: number;
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({ eventId }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: "Hello! I'm your EventSphere AI Copilot. Ask me about event guests, ticket check-ins, budget expenses, or sponsors!" }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`http://127.0.0.1:8000/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, event_id: eventId })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: "Error connecting to AI backend. Please verify that the FastAPI server is running." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Tell me about RSVPs",
    "Show budget summary",
    "How many checked in?",
    "Staff roles assigned?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 glow-primary cursor-pointer border border-white/10"
        >
          <Bot className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="w-96 h-[500px] rounded-3xl glass-panel border border-white/10 flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  EventSphere AI Copilot
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h3>
                <span className="text-[9px] text-indigo-300 font-semibold tracking-widest uppercase">Connected Database</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0c101b]/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line border ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600/80 text-white border-indigo-500/30 rounded-tr-none'
                      : 'bg-white/5 text-gray-200 border-white/5 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 text-gray-400 border border-white/5 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Queries */}
          <div className="px-4 py-2 border-t border-white/5 bg-slate-950/40 overflow-x-auto flex gap-2 no-scrollbar">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sug)}
                className="whitespace-nowrap px-2.5 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-medium text-indigo-300 hover:text-white hover:bg-indigo-600/20 hover:border-indigo-500/30 transition-all duration-300 cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Panel */}
          <div className="p-3 border-t border-white/5 bg-slate-950/60 flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(message)}
              placeholder="Ask anything about the event..."
              className="flex-1 glass-input rounded-xl px-3 py-2 text-xs"
            />
            <button
              onClick={() => handleSend(message)}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

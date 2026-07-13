import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Maximize2, 
  Tag, 
  MessageSquare, 
  Star, 
  TrendingUp,
  X 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

interface PhotoItem {
  id: number;
  title: string;
  url: string;
  tag: string;
}

interface FeedbackItem {
  id: number;
  rating: number;
  comments: string;
  sentiment: string;
  created_at: string;
}

interface MediaGalleryProps {
  eventId: number;
  triggerNotification: (message: string) => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ eventId, triggerNotification }) => {
  const { t } = useLanguage();

  // Photo gallery states
  const [photos, setPhotos] = useState<PhotoItem[]>([
    { id: 1, title: "Opening Keynote Stage", url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&auto=format&fit=crop&q=60", tag: "Keynote" },
    { id: 2, title: "Exhibition Hall networking", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=60", tag: "Exhibition" },
    { id: 3, title: "Interactive Q&A Session", url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=60", tag: "Panel" },
    { id: 4, title: "Evening Networking Lounge", url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=60", tag: "Social" },
    { id: 5, title: "VIP Dinner Toast", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&auto=format&fit=crop&q=60", tag: "Social" },
    { id: 6, title: "Speaker Panels discussion", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=60", tag: "Panel" }
  ]);
  const [galleryFilter, setGalleryFilter] = useState('All');
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);

  // Upload simulation states
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTag, setNewPhotoTag] = useState('Keynote');
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Feedback states
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  const fetchFeedback = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/feedback`);
      const data = await res.json();
      setFeedbacks(data.reverse()); // Show newest feedback first
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [eventId]);

  const handleUploadPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoTitle) return;

    const fallbackUrl = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&auto=format&fit=crop&q=60";
    const newPhoto: PhotoItem = {
      id: photos.length + 1,
      title: newPhotoTitle,
      url: newPhotoUrl.trim() || fallbackUrl,
      tag: newPhotoTag
    };

    setPhotos(prev => [newPhoto, ...prev]);
    setNewPhotoTitle('');
    setNewPhotoUrl('');
    setShowUploadForm(false);
    triggerNotification("Photo uploaded to public gallery album!");
  };

  const handlePostFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: newRating,
          comments: newComment.trim()
        })
      });
      if (res.ok) {
        setNewComment('');
        setNewRating(5);
        triggerNotification("Feedback submitted. Sentiment categorized!");
        fetchFeedback();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filters photo gallery items
  const filteredPhotos = photos.filter(p => galleryFilter === 'All' || p.tag === galleryFilter);

  // Sentiment analytics calculations
  const totalFeedbackCount = feedbacks.length;
  const positiveSentiment = feedbacks.filter(f => f.sentiment === 'Positive').length;
  const negativeSentiment = feedbacks.filter(f => f.sentiment === 'Negative').length;
  const neutralSentiment = feedbacks.filter(f => f.sentiment === 'Neutral').length;

  const averageRating = totalFeedbackCount > 0 
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalFeedbackCount).toFixed(1)
    : "0.0";

  // Recharts ratings chart data
  const ratingCounts = [1, 2, 3, 4, 5].map(r => ({
    stars: `${r} Stars`,
    count: feedbacks.filter(f => f.rating === r).length
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('gallery')} &amp; Reviews</h1>
          <p className="text-gray-400 text-sm mt-1">Host post-event photo archives and analyze attendee feedback with integrated sentiment classification.</p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all duration-300 glow-primary cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Photo
        </button>
      </div>

      {/* Add Photo Form (Expandable) */}
      {showUploadForm && (
        <form onSubmit={handleUploadPhoto} className="glass-panel p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-1.5 text-xs">
            <label className="text-[9px] font-bold text-indigo-400 uppercase">Image Title</label>
            <input 
              type="text" 
              value={newPhotoTitle}
              onChange={e => setNewPhotoTitle(e.target.value)}
              placeholder="Networking Panel" 
              required
              className="w-full glass-input rounded-xl px-3 py-2" 
            />
          </div>
          <div className="space-y-1.5 text-xs">
            <label className="text-[9px] font-bold text-indigo-400 uppercase">Image URL (Unsplash/Web)</label>
            <input 
              type="text" 
              value={newPhotoUrl}
              onChange={e => setNewPhotoUrl(e.target.value)}
              placeholder="http://url.com" 
              className="w-full glass-input rounded-xl px-3 py-2" 
            />
          </div>
          <div className="space-y-1.5 text-xs">
            <label className="text-[9px] font-bold text-indigo-400 uppercase">Gallery Tag</label>
            <select
              value={newPhotoTag}
              onChange={e => setNewPhotoTag(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 bg-slate-900"
            >
              <option value="Keynote">Keynote</option>
              <option value="Exhibition">Exhibition</option>
              <option value="Panel">Panel</option>
              <option value="Social">Social</option>
            </select>
          </div>
          <div>
            <button 
              type="submit" 
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer"
            >
              Publish to Gallery
            </button>
          </div>
        </form>
      )}

      {/* Grid: Photo Gallery & Feedback board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Photo Gallery Masonry Grid (Left) */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              Event Photo Gallery
            </h3>
            
            {/* Gallery tags filters */}
            <div className="flex gap-2 text-[9px] font-bold">
              {['All', 'Keynote', 'Exhibition', 'Panel', 'Social'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setGalleryFilter(tag)}
                  className={`px-2 py-1 rounded-md transition-all ${
                    galleryFilter === tag 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Masonry Columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[380px] overflow-y-auto pr-1">
            {filteredPhotos.map(photo => (
              <div 
                key={photo.id} 
                onClick={() => setLightboxPhoto(photo)}
                className="group relative rounded-xl overflow-hidden border border-white/5 bg-slate-900/60 cursor-pointer hover:border-indigo-500/30 transition-all duration-300"
              >
                <img 
                  src={photo.url} 
                  alt={photo.title} 
                  className="w-full h-32 object-cover filter brightness-90 group-hover:brightness-105 group-hover:scale-105 transition-all duration-500" 
                />
                
                {/* Overlay details */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2.5 flex flex-col justify-end">
                  <span className="text-[8px] font-bold text-indigo-400 flex items-center gap-0.5">
                    <Tag className="w-2.5 h-2.5" />
                    {photo.tag}
                  </span>
                  <h4 className="text-[10px] font-bold text-white truncate">{photo.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback system & Sentiment summary (Right) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Sentiment KPI HUD */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-purple-400" />
              Sentiment Analysis Summary
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl">
                <span className="text-[9px] text-gray-500 font-bold block uppercase">Positive</span>
                <span className="text-lg font-black text-emerald-400">{positiveSentiment}</span>
              </div>
              <div className="bg-slate-500/5 border border-slate-500/10 p-2.5 rounded-xl">
                <span className="text-[9px] text-gray-500 font-bold block uppercase">Neutral</span>
                <span className="text-lg font-black text-gray-300">{neutralSentiment}</span>
              </div>
              <div className="bg-red-500/5 border border-red-500/10 p-2.5 rounded-xl">
                <span className="text-[9px] text-gray-500 font-bold block uppercase">Negative</span>
                <span className="text-lg font-black text-red-400">{negativeSentiment}</span>
              </div>
            </div>

            {/* Overall Rating & graph */}
            <div className="flex items-center gap-6 bg-[#0b0f19]/80 border border-white/5 p-4 rounded-xl">
              <div className="text-center shrink-0">
                <span className="text-[9px] text-gray-500 font-bold block">Avg Rating</span>
                <h3 className="text-3xl font-black text-indigo-400">{averageRating}</h3>
                <span className="text-[8px] text-gray-400 font-bold">out of 5.0</span>
              </div>
              
              <div className="flex-1 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingCounts} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <XAxis dataKey="stars" fontSize={8} stroke="#9ca3af" tickLine={false} />
                    <YAxis fontSize={8} stroke="#9ca3af" width={15} tickLine={false} />
                    <Bar dataKey="count" fill="#818cf8" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Feedback Form and logs list */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col h-[280px]">
            <h4 className="text-xs font-bold text-white tracking-wide border-b border-white/5 pb-2.5 mb-2.5">
              Attendee Feedback Board
            </h4>

            {/* Feedback items log list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 mb-4 pr-1 text-[10px] leading-normal font-semibold">
              {feedbacks.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No surveys submitted yet.</p>
              ) : (
                feedbacks.map(f => (
                  <div key={f.id} className="p-2.5 bg-white/5 border border-white/5 rounded-lg space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex text-amber-400">
                        {Array.from({ length: f.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        f.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-400' :
                        f.sentiment === 'Negative' ? 'bg-red-500/10 text-red-400' :
                        'bg-slate-500/10 text-gray-400'
                      }`}>{f.sentiment}</span>
                    </div>
                    <p className="text-gray-300 italic font-medium">"{f.comments}"</p>
                  </div>
                ))
              )}
            </div>

            {/* Post Feedback Form */}
            <form onSubmit={handlePostFeedback} className="grid grid-cols-4 gap-2 border-t border-white/5 pt-3 items-end">
              <div className="space-y-1 col-span-1">
                <label className="text-[9px] text-gray-400 uppercase">Rating</label>
                <select
                  value={newRating}
                  onChange={e => setNewRating(parseInt(e.target.value))}
                  className="w-full glass-input rounded-xl px-2 py-1.5 bg-slate-900 text-xs font-bold text-amber-400"
                >
                  <option value="5">★★★★★</option>
                  <option value="4">★★★★</option>
                  <option value="3">★★★</option>
                  <option value="2">★★</option>
                  <option value="1">★</option>
                </select>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[9px] text-gray-400 uppercase">Comments</label>
                <input 
                  type="text" 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Review comments..." 
                  required
                  className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs" 
                />
              </div>
              <div>
                <button 
                  type="submit" 
                  className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer glow-primary animate-pulse"
                >
                  Post
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-8 z-50 animate-in fade-in duration-300">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-white/10 rounded-2xl overflow-hidden p-4 shadow-2xl space-y-4 animate-in zoom-in-95">
            <button 
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950/50 hover:bg-slate-950 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={lightboxPhoto.url} alt={lightboxPhoto.title} className="w-full max-h-[400px] object-contain rounded-lg bg-black" />
            <div className="flex justify-between items-center px-2">
              <h4 className="text-sm font-bold text-white">{lightboxPhoto.title}</h4>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-400 uppercase">
                {lightboxPhoto.tag}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

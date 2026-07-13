import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Star, 
  MapPin, 
  Phone, 
  Check, 
  X, 
  MessageSquare,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface Review {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

interface Vendor {
  id: number;
  name: string;
  category: string;
  rating: number;
  starting_price: number;
  contact: string;
  image_url: string;
  description: string;
  availability: boolean;
  reviews: Review[];
}

interface VendorMarketProps {
  eventId: number;
  triggerNotification: (message: string) => void;
  userRole?: string;
}

export const VendorMarket: React.FC<VendorMarketProps> = ({ 
  eventId, 
  triggerNotification,
  userRole = 'Guest'
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bookings, setBookings] = useState<any[]>([]);
  
  // Reviews toggle state (maps vendorId to Boolean)
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});

  // Booking Modal State
  const [bookingVendor, setBookingVendor] = useState<Vendor | null>(null);
  const [bookingDate, setBookingDate] = useState('2026-10-15');
  const [bookingCost, setBookingCost] = useState(0);

  const categories = [
    'All',
    'Catering',
    'Photography',
    'Decoration',
    'DJ',
    'Makeup',
    'Venue',
    'Security',
    'Transportation'
  ];

  const fetchVendorData = async () => {
    try {
      const vendorRes = await fetch(`http://127.0.0.1:8000/vendors`);
      const vendorData = await vendorRes.json();
      setVendors(vendorData);

      const bookingRes = await fetch(`http://127.0.0.1:8000/events/${eventId}/bookings`);
      if (bookingRes.ok) {
        const bookingData = await bookingRes.json();
        setBookings(bookingData);
      }
    } catch (err) {
      console.error("Error loading vendor marketplace data", err);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, [eventId]);

  const toggleReviews = (vendorId: number) => {
    setExpandedReviews(prev => ({
      ...prev,
      [vendorId]: !prev[vendorId]
    }));
  };

  const handleOpenBooking = (vendor: Vendor) => {
    setBookingVendor(vendor);
    setBookingCost(vendor.starting_price);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingVendor) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/events/${eventId}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: bookingVendor.id,
          cost: bookingCost,
          booking_date: bookingDate
        })
      });

      if (res.ok) {
        triggerNotification(`Booked ${bookingVendor.name} successfully! Cost logged to budget ledger.`);
        setBookingVendor(null);
        fetchVendorData();
      } else {
        const errData = await res.json();
        alert(errData.detail || "Booking failed.");
      }
    } catch (err) {
      console.error("Error booking vendor", err);
    }
  };

  // Filter vendors
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || v.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Vendor Marketplace</h1>
          <p className="text-gray-400 text-sm mt-1">Book elite verified service providers across all categories for your events.</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 border border-white/5">
        
        {/* Category Pill Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white glow-primary' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendors..."
            className="w-full glass-input rounded-xl px-4 py-2 text-xs pr-10 bg-slate-900/40"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Vendors Grid */}
      {filteredVendors.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/5">
          <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-white font-bold text-sm">No Vendors Found</h3>
          <p className="text-xs text-gray-500 mt-1">Try resetting the category filter or searching for another term.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => {
            const isBooked = bookings.some(b => b.vendor_id === vendor.id);
            const showReviews = expandedReviews[vendor.id] || false;
            
            return (
              <div 
                key={vendor.id} 
                className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300 group"
              >
                
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-slate-950">
                  <img 
                    src={vendor.image_url || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&auto=format&fit=crop&q=60"}
                    alt={vendor.name}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080B11] via-transparent to-transparent opacity-80"></div>
                  
                  {/* Category & Availability Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-2 py-1 rounded-lg bg-slate-950/70 border border-white/10 text-[9px] font-extrabold text-indigo-300 uppercase tracking-wider">
                      {vendor.category}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                      vendor.availability 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {vendor.availability ? 'Available' : 'Fully Booked'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-white text-base group-hover:text-indigo-400 transition-colors truncate max-w-[180px]">
                        {vendor.name}
                      </h3>
                      <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{vendor.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                      {vendor.description}
                    </p>
                  </div>

                  {/* Pricing / Contact */}
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-400 border-t border-white/5 pt-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Starting From</span>
                      <span className="text-emerald-400 font-black text-sm mt-0.5">${vendor.starting_price.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Contact Phone</span>
                      <span className="text-white text-[10px] mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-indigo-400" /> {vendor.contact}
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => toggleReviews(vendor.id)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-[10px] transition-colors border border-white/5 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Reviews ({vendor.reviews?.length || 0})
                    </button>

                    {(userRole === 'Admin' || userRole === 'Event Organizer') ? (
                      <button
                        onClick={() => handleOpenBooking(vendor)}
                        disabled={isBooked || !vendor.availability}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                          isBooked 
                            ? 'bg-emerald-600/20 border-emerald-500/20 text-emerald-400 cursor-default'
                            : !vendor.availability
                            ? 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500/50 text-white glow-primary'
                        }`}
                      >
                        {isBooked ? 'Booked ✓' : 'Book Vendor'}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center text-[10px] text-gray-500 font-semibold border border-white/5 rounded-xl bg-slate-950/20">
                        View Mode
                      </div>
                    )}
                  </div>

                  {/* Expanded Reviews Drawer */}
                  {showReviews && (
                    <div className="space-y-3 bg-slate-950/30 border border-white/5 rounded-xl p-3 text-[11px] animate-in slide-in-from-top-2 duration-300">
                      <h4 className="font-bold text-white uppercase text-[9px] tracking-wider border-b border-white/5 pb-1">Guest &amp; Host Reviews</h4>
                      {!vendor.reviews || vendor.reviews.length === 0 ? (
                        <p className="text-gray-500 italic text-center py-2">No reviews left yet.</p>
                      ) : (
                        <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                          {vendor.reviews.map((rev, rIdx) => (
                            <div key={rIdx} className="space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-indigo-300">{rev.author}</span>
                                <span className="text-gray-500">{rev.date}</span>
                              </div>
                              <div className="flex text-amber-400 gap-0.5 items-center scale-90 origin-left">
                                {Array.from({ length: 5 }).map((_, sI) => (
                                  <Star 
                                    key={sI} 
                                    className={`w-2.5 h-2.5 ${sI < rev.rating ? 'fill-amber-400' : 'text-gray-700'}`} 
                                  />
                                ))}
                              </div>
                              <p className="text-gray-400 italic font-medium leading-relaxed">"{rev.comment}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOOKING DIALOG MODAL */}
      {bookingVendor && (
        <div className="fixed inset-0 bg-[#04060a]/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="glass-panel max-w-md w-full border border-white/10 rounded-3xl p-6 space-y-6 animate-in zoom-in-95 duration-300 shadow-2xl bg-[#090d16]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="font-black text-white text-lg">Book Service Provider</h3>
                <p className="text-xs text-gray-500 mt-0.5">{bookingVendor.name} - {bookingVendor.category}</p>
              </div>
              <button 
                onClick={() => setBookingVendor(null)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Target Booking Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                  <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Agreed cost ($)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={bookingCost}
                    onChange={(e) => setBookingCost(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                  <DollarSign className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
                <p className="text-[10px] text-gray-500 font-medium">Default base price is pre-populated. Adjust as required.</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setBookingVendor(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs transition-colors border border-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer glow-primary border border-indigo-500/50 flex items-center justify-center gap-1.5"
                >
                  Confirm Booking
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

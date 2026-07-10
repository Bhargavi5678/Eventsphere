import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Store, 
  Brain, 
  Calculator, 
  HelpCircle, 
  CheckCircle,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

interface BudgetItem {
  id: number;
  category: string;
  item_name: string;
  allocated_amount: number;
  actual_amount: number;
  notes: string;
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
}

interface Booking {
  id: number;
  vendor_id: number;
  cost: number;
  booking_date: string;
  status: string;
  vendor: Vendor;
}

interface BudgetManagerProps {
  eventId: number;
  triggerNotification: (message: string) => void;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({ eventId, triggerNotification }) => {
  const { t } = useLanguage();

  // Ledger states
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [newCategory, setNewCategory] = useState('Venue');
  const [newItemName, setNewItemName] = useState('');
  const [newAllocated, setNewAllocated] = useState('');
  const [newActual, setNewActual] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Marketplace states
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // AI Predictor states
  const [aiEventType, setAiEventType] = useState('Conference');
  const [aiGuestCount, setAiGuestCount] = useState(100);
  const [aiLocationType, setAiLocationType] = useState('Standard');
  const [prediction, setPrediction] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);

  const fetchBudgetData = async () => {
    try {
      const budgetRes = await fetch(`http://127.0.0.1:8000/events/${eventId}/budget`);
      const budgetData = await budgetRes.json();
      setBudgetItems(budgetData);

      const vendorRes = await fetch(`http://127.0.0.1:8000/vendors`);
      const vendorData = await vendorRes.json();
      setVendors(vendorData);

      const bookingRes = await fetch(`http://127.0.0.1:8000/events/${eventId}/bookings`);
      const bookingData = await bookingRes.json();
      setBookings(bookingData);
    } catch (err) {
      console.error("Error loading budget data", err);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [eventId]);

  const handleAddBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newAllocated) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/events/${eventId}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          item_name: newItemName,
          allocated_amount: parseFloat(newAllocated),
          actual_amount: parseFloat(newActual || '0.0'),
          notes: newNotes || null
        })
      });
      if (res.ok) {
        setNewItemName('');
        setNewAllocated('');
        setNewActual('');
        setNewNotes('');
        triggerNotification("Budget ledger item added.");
        fetchBudgetData();
      }
    } catch (err) {
      console.error("Error adding budget item", err);
    }
  };

  const handleDeleteBudgetItem = async (itemId: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/budget/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerNotification("Budget ledger item deleted.");
        fetchBudgetData();
      }
    } catch (err) {
      console.error("Error deleting item", err);
    }
  };

  const handleBookVendor = async (vendorId: number, price: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/events/${eventId}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          cost: price,
          booking_date: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        triggerNotification("Vendor booked successfully! Cost logged to budget ledger.");
        fetchBudgetData();
      }
    } catch (err) {
      console.error("Error booking vendor", err);
    }
  };

  const handleGetAIPrediction = async () => {
    setPredicting(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/ai/predict-budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: aiEventType,
          guest_count: aiGuestCount,
          location_type: aiLocationType
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPrediction(data);
      }
    } catch (err) {
      console.error("Error fetching AI prediction", err);
    } finally {
      setPredicting(false);
    }
  };

  // Recharts configurations
  const barChartData = budgetItems.map(item => ({
    name: item.item_name.substring(0, 12) + (item.item_name.length > 12 ? '..' : ''),
    Allocated: item.allocated_amount,
    Actual: item.actual_amount
  }));

  const totalAllocated = budgetItems.reduce((acc, item) => acc + item.allocated_amount, 0);
  const totalActual = budgetItems.reduce((acc, item) => acc + item.actual_amount, 0);

  // Prediction pie chart formatting
  const predictionPieData = prediction 
    ? Object.keys(prediction.suggested_breakdown).map(key => ({
        name: key,
        value: prediction.suggested_breakdown[key]
      }))
    : [];

  const AI_COLORS = ['#6366f1', '#a855f7', '#3b82f6', '#f59e0b', '#ec4899', '#10b981'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('budget')}</h1>
        <p className="text-gray-400 text-sm mt-1">Track actual costs against allocations, book vendor marketplace items, and run AI forecasting models.</p>
      </div>

      {/* Grid: Ledger Charts & Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Budget ledger ledger table */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <h3 className="text-sm font-bold text-white tracking-wide">Expense Ledger Ledger</h3>
            <div className="text-[11px] font-bold space-x-4 text-gray-400">
              <span>Allocated: <strong className="text-indigo-400">${totalAllocated.toLocaleString()}</strong></span>
              <span>Actual spent: <strong className="text-purple-400">${totalActual.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-white/5 max-h-72">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-white/5 text-gray-400 border-b border-white/5">
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Item Name</th>
                  <th className="p-3.5">Allocated</th>
                  <th className="p-3.5">Actual Spent</th>
                  <th className="p-3.5">Notes</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-200">
                {budgetItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">No expense items logged. Add items below.</td>
                  </tr>
                ) : (
                  budgetItems.map(item => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-gray-400 font-bold border border-white/5 uppercase">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-white">{item.item_name}</td>
                      <td className="p-3.5 text-indigo-400 font-black">${item.allocated_amount.toLocaleString()}</td>
                      <td className="p-3.5 text-purple-400 font-black">${item.actual_amount.toLocaleString()}</td>
                      <td className="p-3.5 text-gray-400 max-w-[120px] truncate">{item.notes || '-'}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteBudgetItem(item.id)}
                          className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Ledger Item Form */}
          <form onSubmit={handleAddBudgetItem} className="grid grid-cols-1 md:grid-cols-5 gap-3 border-t border-white/5 pt-5 items-end">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Category</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs bg-slate-900"
              >
                <option value="Venue">Venue</option>
                <option value="Catering">Catering</option>
                <option value="Audio/Visual">Audio/Visual</option>
                <option value="Decor">Decorations</option>
                <option value="Marketing">Marketing</option>
                <option value="Staffing">Staffing</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Item Name</label>
              <input 
                type="text" 
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="Hall booking" 
                required
                className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Allocated ($)</label>
              <input 
                type="number" 
                value={newAllocated}
                onChange={e => setNewAllocated(e.target.value)}
                placeholder="5000" 
                required
                className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Actual spent ($)</label>
              <input 
                type="number" 
                value={newActual}
                onChange={e => setNewActual(e.target.value)}
                placeholder="4800" 
                className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs" 
              />
            </div>
            <div>
              <button 
                type="submit" 
                className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer glow-primary"
              >
                Log Cost
              </button>
            </div>
          </form>
        </div>

        {/* Recharts Allocation comparison */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white tracking-wide mb-4">Allocated vs Actual spent</h3>
          <div className="h-64 w-full">
            {barChartData.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-16">No charting data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#151b2c', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Allocated" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Actual" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Grid: Vendor Marketplace & AI Budget Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Vendor Marketplace */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Store className="w-4 h-4 text-purple-400" />
              Vendor Marketplace
            </h3>
            <span className="text-[10px] text-indigo-400 font-bold">Local catalog</span>
          </div>

          {/* Vendors grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
            {vendors.map(vendor => {
              const isBooked = bookings.some(b => b.vendor_id === vendor.id);
              return (
                <div key={vendor.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {vendor.image_url && (
                      <img 
                        src={vendor.image_url} 
                        alt={vendor.name} 
                        className="w-full h-24 object-cover rounded-lg border border-white/5" 
                      />
                    )}
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{vendor.name}</h4>
                        <span className="text-[8px] font-black text-indigo-300 bg-indigo-500/10 px-1 py-0.5 rounded border border-indigo-500/20">
                          ★ {vendor.rating}
                        </span>
                      </div>
                      <span className="text-[9px] text-gray-400 block pt-0.5">{vendor.category}</span>
                      <p className="text-[10px] text-gray-500 mt-1.5 leading-normal italic line-clamp-2">"{vendor.description}"</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-2">
                    <div>
                      <span className="text-[9px] text-gray-500 font-bold block">starting price</span>
                      <span className="text-xs font-bold text-emerald-400">${vendor.starting_price.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => handleBookVendor(vendor.id, vendor.starting_price)}
                      disabled={isBooked}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        isBooked 
                          ? 'bg-slate-800 text-gray-500 border border-white/5' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white glow-primary'
                      }`}
                    >
                      {isBooked ? 'Booked ✓' : 'Book Vendor'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Budget Prediction forecasting */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
              AI Budget Prediction
            </h3>
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-bold text-indigo-400 uppercase tracking-widest">
              Predictive Model
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Form selectors */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Event Type</label>
                <select
                  value={aiEventType}
                  onChange={e => setAiEventType(e.target.value)}
                  className="w-full glass-input rounded-xl px-2.5 py-1.5 bg-slate-900"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Conference">Conference / Summit</option>
                  <option value="Concert">Concert / Fest</option>
                  <option value="Corporate">Corporate Gala</option>
                  <option value="Birthday">Birthday Party</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Location Standard</label>
                <select
                  value={aiLocationType}
                  onChange={e => setAiLocationType(e.target.value)}
                  className="w-full glass-input rounded-xl px-2.5 py-1.5 bg-slate-900"
                >
                  <option value="Premium">Premium Luxury Venue</option>
                  <option value="Standard">Standard Business Hotel</option>
                  <option value="Budget">Budget Community Hall</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase">
                  <span>Guest Count</span>
                  <span className="text-indigo-400 font-black">{aiGuestCount}</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="1000" 
                  step="10"
                  value={aiGuestCount}
                  onChange={e => setAiGuestCount(parseInt(e.target.value))}
                  className="w-full accent-indigo-500" 
                />
              </div>

              <button
                onClick={handleGetAIPrediction}
                disabled={predicting}
                className="w-full py-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 glow-primary border border-white/10"
              >
                <Calculator className="w-3.5 h-3.5" />
                {predicting ? 'Computing forecast...' : 'Run Cost Prediction'}
              </button>
            </div>

            {/* Results breakdown */}
            <div className="bg-[#0b0f19]/80 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[220px]">
              {prediction ? (
                <div className="w-full space-y-3.5 animate-in fade-in duration-300">
                  <div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Estimated Total Budget</span>
                    <h3 className="text-2xl font-black text-emerald-400">${prediction.predicted_total.toLocaleString()}</h3>
                    <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded mt-1 inline-block uppercase">
                      Confidence: {Math.round(prediction.confidence_score * 100)}%
                    </span>
                  </div>
                  
                  {/* Category allocations progress list */}
                  <div className="text-left text-[9px] space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {Object.keys(prediction.suggested_breakdown).map((cat, i) => {
                      const cost = prediction.suggested_breakdown[cat];
                      const pct = Math.round((cost / prediction.predicted_total) * 100);
                      return (
                        <div key={i} className="space-y-0.5">
                          <div className="flex justify-between font-bold text-gray-300">
                            <span>{cat}</span>
                            <span className="text-gray-400">${cost.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: AI_COLORS[i % AI_COLORS.length] }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Sliders className="w-8 h-8 text-indigo-500/30 mx-auto animate-pulse" />
                  <p className="text-[10px] text-gray-500 leading-normal px-4">Set parameters and trigger the model to generate projected costs and dynamic breakdown allocations.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

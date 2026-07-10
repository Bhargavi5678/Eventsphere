import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  ShieldCheck, 
  DollarSign, 
  Calendar, 
  Phone, 
  Briefcase, 
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Sponsor {
  id: number;
  name: string;
  level: string;
  amount_funded: number;
  logo_url: string;
  website: string;
}

interface StaffMember {
  id: number;
  name: string;
  role: string;
  shift_start: string;
  shift_end: string;
  contact: string;
}

interface SponsorsStaffProps {
  eventId: number;
  triggerNotification: (message: string) => void;
}

export const SponsorsStaff: React.FC<SponsorsStaffProps> = ({ eventId, triggerNotification }) => {
  const { t } = useLanguage();

  // Sponsors states
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorLevel, setNewSponsorLevel] = useState('Gold');
  const [newSponsorAmount, setNewSponsorAmount] = useState('');
  const [newSponsorWebsite, setNewSponsorWebsite] = useState('');
  const [newSponsorLogo, setNewSponsorLogo] = useState('');

  // Staff states
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Coordinator');
  const [newStaffStart, setNewStaffStart] = useState('09:00');
  const [newStaffEnd, setNewStaffEnd] = useState('17:00');
  const [newStaffContact, setNewStaffContact] = useState('');

  const fetchData = async () => {
    try {
      const spRes = await fetch(`http://127.0.0.1:8000/events/${eventId}/sponsors`);
      const spData = await spRes.json();
      setSponsors(spData);

      const stRes = await fetch(`http://127.0.0.1:8000/events/${eventId}/staff`);
      const stData = await stRes.json();
      setStaff(stData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsorName || !newSponsorAmount) return;

    const fallbackLogo = newSponsorLevel === 'Gold' 
      ? "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=60"
      : "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=100&auto=format&fit=crop&q=60";

    try {
      const res = await fetch(`http://127.0.0.1:8000/events/${eventId}/sponsors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSponsorName,
          level: newSponsorLevel,
          amount_funded: parseFloat(newSponsorAmount),
          website: newSponsorWebsite || null,
          logo_url: newSponsorLogo || fallbackLogo
        })
      });
      if (res.ok) {
        setNewSponsorName('');
        setNewSponsorAmount('');
        setNewSponsorWebsite('');
        setNewSponsorLogo('');
        triggerNotification("Sponsor partner registered!");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSponsor = async (spId: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/sponsors/${spId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerNotification("Sponsor deleted.");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffContact) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/events/${eventId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaffName,
          role: newStaffRole,
          shift_start: newStaffStart,
          shift_end: newStaffEnd,
          contact: newStaffContact
        })
      });
      if (res.ok) {
        setNewStaffName('');
        setNewStaffContact('');
        triggerNotification("Staff shift scheduled!");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStaff = async (stId: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/staff/${stId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerNotification("Staff member removed from shift.");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalSponsorFunds = sponsors.reduce((acc, sp) => acc + sp.amount_funded, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('sponsorsStaff')}</h1>
        <p className="text-gray-400 text-sm mt-1">Coordinate event sponsorships funding levels and manage the operational staff schedule shifts database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SPONSORSHIP SECTION */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
                Sponsorship Directory
              </h3>
              <span className="text-[11px] font-bold text-emerald-400">
                Total Funds: ${totalSponsorFunds.toLocaleString()}
              </span>
            </div>

            {/* List of sponsors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
              {sponsors.length === 0 ? (
                <p className="text-xs text-gray-500 col-span-2 text-center py-8">No sponsors registered yet.</p>
              ) : (
                sponsors.map(sp => (
                  <div key={sp.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {sp.logo_url && (
                        <img src={sp.logo_url} alt={sp.name} className="w-10 h-10 object-cover rounded-lg border border-white/5 shrink-0 bg-white/10" />
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[110px]">{sp.name}</h4>
                        <div className="flex items-center gap-2 text-[9px] font-semibold text-gray-400 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            sp.level === 'Gold' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                            sp.level === 'Silver' ? 'bg-slate-400/10 border border-slate-400/20 text-slate-300' :
                            'bg-amber-700/10 border border-amber-700/20 text-amber-600'
                          }`}>{sp.level}</span>
                          <span>${sp.amount_funded.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sp.website && (
                        <a href={sp.website} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteSponsor(sp.id)}
                        className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Sponsor Form */}
            <form onSubmit={handleAddSponsor} className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t border-white/5 pt-4 items-end text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 uppercase">Sponsor Name</label>
                <input 
                  type="text" 
                  value={newSponsorName}
                  onChange={e => setNewSponsorName(e.target.value)}
                  placeholder="Acme Corp" 
                  required
                  className="w-full glass-input rounded-xl px-2 py-1.5 text-xs" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 uppercase">Funding ($)</label>
                <input 
                  type="number" 
                  value={newSponsorAmount}
                  onChange={e => setNewSponsorAmount(e.target.value)}
                  placeholder="5000" 
                  required
                  className="w-full glass-input rounded-xl px-2 py-1.5 text-xs" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 uppercase">Partner Tier</label>
                <select
                  value={newSponsorLevel}
                  onChange={e => setNewSponsorLevel(e.target.value)}
                  className="w-full glass-input rounded-xl px-2 py-1.5 bg-slate-900 text-xs"
                >
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Bronze">Bronze</option>
                </select>
              </div>
              <div>
                <button 
                  type="submit" 
                  className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer glow-primary"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* STAFF SECTION */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-purple-400" />
                Staff Shifts Coordinator
              </h3>
              <span className="text-[11px] font-bold text-indigo-400">
                Active Staff: {staff.length}
              </span>
            </div>

            {/* List of staff shifts */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {staff.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No staff members scheduled.</p>
              ) : (
                staff.map(st => (
                  <div key={st.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{st.name}</h4>
                        <div className="flex items-center gap-3 text-[9px] text-gray-400 font-semibold mt-1">
                          <span className="text-indigo-300 uppercase tracking-wider">{st.role}</span>
                          <span>|</span>
                          <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3 text-purple-400" /> {st.shift_start} - {st.shift_end}</span>
                          <span>|</span>
                          <span className="flex items-center gap-0.5"><Phone className="w-3 h-3 text-emerald-400" /> {st.contact}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteStaff(st.id)}
                      className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Staff shift Form */}
            <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-5 gap-2 border-t border-white/5 pt-4 items-end text-xs font-semibold">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[9px] text-gray-400 uppercase">Staff Name</label>
                <input 
                  type="text" 
                  value={newStaffName}
                  onChange={e => setNewStaffName(e.target.value)}
                  placeholder="Jordan Cross" 
                  required
                  className="w-full glass-input rounded-xl px-2 py-1.5 text-xs" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 uppercase">Contact Phone</label>
                <input 
                  type="text" 
                  value={newStaffContact}
                  onChange={e => setNewStaffContact(e.target.value)}
                  placeholder="+1555" 
                  required
                  className="w-full glass-input rounded-xl px-2 py-1.5 text-xs" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 uppercase">Role Duty</label>
                <select
                  value={newStaffRole}
                  onChange={e => setNewStaffRole(e.target.value)}
                  className="w-full glass-input rounded-xl px-2 py-1.5 bg-slate-900 text-xs"
                >
                  <option value="Admin">Admin</option>
                  <option value="Coordinator">Coordinator</option>
                  <option value="Security">Security</option>
                  <option value="Support">Support</option>
                </select>
              </div>
              <div>
                <button 
                  type="submit" 
                  className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer glow-primary"
                >
                  Assign Shift
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  QrCode, 
  BadgeCheck, 
  ScanLine, 
  Download, 
  Printer, 
  UserCheck, 
  Clock,
  Sparkles,
  Camera
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TicketData {
  id: number;
  guest_id: number;
  ticket_code: string;
  tier: string;
  price: number;
  checked_in: boolean;
  checked_in_at: string;
  guest?: any;
}

interface GuestData {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface TicketingProps {
  eventId: number;
  triggerNotification: (message: string) => void;
}

export const Ticketing: React.FC<TicketingProps> = ({ eventId, triggerNotification }) => {
  const { t } = useLanguage();

  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [guests, setGuests] = useState<GuestData[]>([]);
  
  // Registration checkout simulation
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [ticketTier, setTicketTier] = useState('General');
  const [ticketPrice, setTicketPrice] = useState(199.00);

  // Check-In scanner simulation
  const [scanCode, setScanCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Badge Builder states
  const [selectedBadgeGuestId, setSelectedBadgeGuestId] = useState('');
  const [badgeSvg, setBadgeSvg] = useState<string | null>(null);
  const [badgeLoading, setBadgeLoading] = useState(false);

  const fetchTicketsAndGuests = async () => {
    try {
      const ticketRes = await fetch(`http://127.0.0.1:8000/events/${eventId}/tickets`);
      const ticketData = await ticketRes.json();
      
      const guestRes = await fetch(`http://127.0.0.1:8000/events/${eventId}/guests`);
      const guestData = await guestRes.json();
      setGuests(guestData);

      // Attach guest profiles to ticket list
      const mappedTickets = ticketData.map((t: any) => {
        const guestObj = guestData.find((g: any) => g.id === t.guest_id);
        return { ...t, guest: guestObj };
      });
      setTickets(mappedTickets);

      if (guestData.length > 0 && !selectedGuestId) {
        setSelectedGuestId(guestData[0].id.toString());
      }
      
      // Filter checked-in guests for badges
      const checkedInGuests = guestData.filter((g: any) => 
        ticketData.some((t: any) => t.guest_id === g.id && t.checked_in)
      );
      if (checkedInGuests.length > 0 && !selectedBadgeGuestId) {
        setSelectedBadgeGuestId(checkedInGuests[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTicketsAndGuests();
  }, [eventId]);

  // Sync price selection based on tier
  useEffect(() => {
    if (ticketTier === 'VIP') setTicketPrice(499.00);
    else if (ticketTier === 'Early Bird') setTicketPrice(149.00);
    else setTicketPrice(199.00);
  }, [ticketTier]);

  // Load badge svg when selected badge guest changes
  const fetchBadgeSvg = async () => {
    if (!selectedBadgeGuestId) {
      setBadgeSvg(null);
      return;
    }
    setBadgeLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/guests/${selectedBadgeGuestId}/badge`);
      const svgText = await res.text();
      setBadgeSvg(svgText);
    } catch (err) {
      console.error(err);
    } finally {
      setBadgeLoading(false);
    }
  };

  useEffect(() => {
    fetchBadgeSvg();
  }, [selectedBadgeGuestId, eventId]);

  const handleIssueTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuestId) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/events/${eventId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: parseInt(selectedGuestId),
          tier: ticketTier,
          price: ticketPrice
        })
      });
      if (res.ok) {
        triggerNotification(`Ticket issued successfully for tier ${ticketTier}!`);
        fetchTicketsAndGuests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQRCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    setScanning(true);
    setScanResult(null);

    // Simulate scanning delay
    setTimeout(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/tickets/check-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket_code: scanCode.trim() })
        });
        const data = await res.json();
        if (res.ok) {
          // Find matching guest name
          const guestName = guests.find(g => g.id === data.guest_id)?.name || "Attendee";
          setScanResult({ success: true, name: guestName, code: data.ticket_code, tier: data.tier });
          triggerNotification(`${guestName} checked in successfully!`);
          setScanCode('');
          fetchTicketsAndGuests();
        } else {
          setScanResult({ success: false, message: data.detail || "Invalid scan code" });
        }
      } catch (err) {
        setScanResult({ success: false, message: "Server connection failed" });
      } finally {
        setScanning(false);
      }
    }, 1200);
  };

  const handleDownloadBadge = () => {
    if (!badgeSvg || !selectedBadgeGuestId) return;
    const guestName = guests.find(g => g.id === parseInt(selectedBadgeGuestId))?.name || "badge";
    const blob = new Blob([badgeSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `badge-${guestName.replace(/\s+/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerNotification("Vector entry badge downloaded!");
  };

  const handlePrintBadge = () => {
    if (!badgeSvg) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<html><body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#000;">${badgeSvg}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  // Filter attending guests for selection dropdown
  const checkedInGuests = guests.filter(g => 
    tickets.some(t => t.guest_id === g.id && t.checked_in)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('ticketing')}</h1>
        <p className="text-gray-400 text-sm mt-1">Issue ticket purchases, scan entry check-in codes, and print attendee badges.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ticketing Purchases Ledger */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-[450px]">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2 border-b border-white/5 pb-2.5">
              <CreditCard className="w-4.5 h-4.5 text-indigo-400" />
              Ticket Sales Registry
            </h3>

            {/* List of active tickets */}
            <div className="space-y-2.5 overflow-y-auto max-h-52 pr-1">
              {tickets.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No tickets registered.</p>
              ) : (
                tickets.map(t => (
                  <div key={t.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between text-[11px] leading-normal font-semibold">
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{t.guest?.name || "Unassigned"}</h4>
                      <div className="flex items-center gap-2.5 text-[9px] text-gray-500 mt-1 font-bold">
                        <span className="text-indigo-400 font-black">{t.tier}</span>
                        <span>•</span>
                        <span>Code: {t.ticket_code.substring(0, 14)}...</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-emerald-400 font-black text-xs">${t.price}</div>
                      <span className={`text-[8px] font-bold uppercase mt-1 inline-block ${
                        t.checked_in ? 'text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/25' : 'text-gray-500 bg-white/5 px-1 py-0.5 rounded border border-white/5'
                      }`}>
                        {t.checked_in ? 'Checked In ✓' : 'Awaiting'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checkout Purchase Simulation */}
          <form onSubmit={handleIssueTicket} className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4 text-xs font-semibold">
            <div className="space-y-1">
              <label className="text-[9px] text-gray-400 uppercase">Guest</label>
              <select
                value={selectedGuestId}
                onChange={e => setSelectedGuestId(e.target.value)}
                className="w-full glass-input rounded-xl px-2.5 py-1.5 bg-slate-900 text-xs"
              >
                {guests.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-400 uppercase">Tier Tier</label>
              <select
                value={ticketTier}
                onChange={e => setTicketTier(e.target.value)}
                className="w-full glass-input rounded-xl px-2.5 py-1.5 bg-slate-900 text-xs font-bold text-indigo-400"
              >
                <option value="General">General ($199)</option>
                <option value="VIP">VIP ($499)</option>
                <option value="Early Bird">Early Bird ($149)</option>
              </select>
            </div>
            <div>
              <button 
                type="submit" 
                className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer glow-primary"
              >
                Issue Ticket
              </button>
            </div>
          </form>
        </div>

        {/* QR Check-In Scanner Simulation */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-[450px]">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2 border-b border-white/5 pb-2.5">
              <QrCode className="w-4.5 h-4.5 text-purple-400" />
              QR Entry Check-In
            </h3>

            {/* simulated Camera Scan Viewport */}
            <div className="w-full h-44 bg-[#05070c] border border-white/10 rounded-2xl relative flex flex-col justify-center items-center overflow-hidden shadow-inner group">
              {/* Scan box grids animation overlay */}
              <div className="absolute w-36 h-36 border border-indigo-500/40 rounded-xl flex items-center justify-center">
                <ScanLine className="w-full text-indigo-400/80 animate-[bounce_2s_infinite]" />
              </div>
              <Camera className="w-8 h-8 text-gray-500/20 group-hover:text-indigo-400/20 transition-colors" />
              <span className="text-[8px] font-black text-gray-500 mt-2 uppercase tracking-widest z-10">Simulated Camera Active</span>
            </div>
          </div>

          {/* Results display */}
          <div className="text-[10px] leading-normal font-semibold">
            {scanResult ? (
              scanResult.success ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl space-y-0.5 animate-in fade-in duration-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>CHECKED IN SUCCESSFULLY</span>
                  </div>
                  <p className="text-gray-300 pt-0.5">Attendee: <strong className="text-white">{scanResult.name}</strong> ({scanResult.tier})</p>
                  <span className="text-[8px] text-gray-500 font-bold block pt-1">Code: {scanResult.code}</span>
                </div>
              ) : (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold animate-in fade-in duration-300">
                  ⚠️ SCAN ERROR: {scanResult.message}
                </div>
              )
            ) : scanning ? (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Reading ticket data structures...</span>
              </div>
            ) : (
              <p className="text-gray-500 text-center italic py-4">Enter a code below to simulate check-in scanning.</p>
            )}
          </div>

          {/* Scan code Input form */}
          <form onSubmit={handleQRCheckIn} className="space-y-2 border-t border-white/5 pt-4">
            <input 
              type="text" 
              value={scanCode}
              onChange={e => setScanCode(e.target.value)}
              placeholder="Paste ticket code here (e.g. ES-1-1-SPEAKER-VANCE)" 
              required
              className="w-full glass-input rounded-xl px-3 py-2 text-xs text-center uppercase tracking-wide font-semibold" 
            />
            <button 
              type="submit" 
              disabled={scanning}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer glow-secondary"
            >
              Simulate QR Scan Check-In
            </button>
          </form>
        </div>

        {/* Digital Badge Designer */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-[450px]">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2 border-b border-white/5 pb-2.5">
              <BadgeCheck className="w-4.5 h-4.5 text-indigo-400" />
              Digital Badge Generator
            </h3>

            {/* Checked-in dropdown */}
            <div className="space-y-1 text-xs">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Checked-In Attendee</label>
              <select
                value={selectedBadgeGuestId}
                onChange={e => setSelectedBadgeGuestId(e.target.value)}
                className="w-full glass-input rounded-xl px-2.5 py-1.5 bg-slate-900 text-xs font-bold text-indigo-300"
              >
                {checkedInGuests.length === 0 ? (
                  <option value="">No checked-in guests found</option>
                ) : (
                  checkedInGuests.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.role})</option>
                  ))
                )}
              </select>
            </div>

            {/* Badge display */}
            <div className="w-full flex justify-center bg-black/40 border border-white/5 rounded-2xl p-2 max-h-52 overflow-y-auto">
              {badgeLoading ? (
                <div className="text-[10px] text-indigo-400 font-bold py-16">Creating badge SVG...</div>
              ) : badgeSvg ? (
                <div 
                  className="w-44 shadow-2xl rounded-xl overflow-hidden animate-in zoom-in-95"
                  dangerouslySetInnerHTML={{ __html: badgeSvg }}
                />
              ) : (
                <div className="text-center py-16 text-xs text-gray-500">
                  Select a checked-in guest to design their digital badge.
                </div>
              )}
            </div>
          </div>

          {/* Action triggers */}
          <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
            <button
              onClick={handleDownloadBadge}
              disabled={!badgeSvg}
              className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 glow-primary"
            >
              <Download className="w-4 h-4" />
              Save Vector
            </button>
            <button
              onClick={handlePrintBadge}
              disabled={!badgeSvg}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold text-xs border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

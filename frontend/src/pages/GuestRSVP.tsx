import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Send, 
  Trash2, 
  RefreshCw, 
  MessageSquare,
  Users
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface GuestData {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  badge_printed: boolean;
}

interface CampaignLog {
  id: number;
  recipient_name: string;
  recipient_address: string;
  channel: string;
  template_type: string;
  body: string;
  status: string;
  timestamp: string;
}

interface GuestRSVPProps {
  eventId: number;
  triggerNotification: (message: string) => void;
}

export const GuestRSVP: React.FC<GuestRSVPProps> = ({ eventId, triggerNotification }) => {
  const { t } = useLanguage();

  const [guests, setGuests] = useState<GuestData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  // Form states
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestRole, setNewGuestRole] = useState('Attendee');
  const [showAddForm, setShowAddForm] = useState(false);

  // Campaign configurations
  const [campaignChannel, setCampaignChannel] = useState('Email');
  const [campaignTemplate, setCampaignTemplate] = useState('RSVP Reminder');
  const [campaignRecipient, setCampaignRecipient] = useState('All');
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([]);
  const [launching, setLaunching] = useState(false);

  const fetchGuests = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/events/${eventId}/guests`);
      const data = await res.json();
      setGuests(data);
    } catch (err) {
      console.error("Error loading guests", err);
    }
  };

  const fetchCampaignLogs = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/events/${eventId}/notifications/logs`);
      const data = await res.json();
      setCampaignLogs(data.reverse()); // Show newest logs first
    } catch (err) {
      console.error("Error loading campaign logs", err);
    }
  };

  useEffect(() => {
    fetchGuests();
    fetchCampaignLogs();
  }, [eventId]);

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName || !newGuestEmail) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/events/${eventId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGuestName,
          email: newGuestEmail,
          phone: newGuestPhone || null,
          role: newGuestRole,
          status: 'Pending'
        })
      });
      if (res.ok) {
        setNewGuestName('');
        setNewGuestEmail('');
        setNewGuestPhone('');
        setShowAddForm(false);
        triggerNotification("Guest successfully added & ticket registered!");
        fetchGuests();
        fetchCampaignLogs(); // Added welcome email
      }
    } catch (err) {
      console.error("Error adding guest", err);
    }
  };

  const handleToggleStatus = async (guestId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'Pending' ? 'Attending' : currentStatus === 'Attending' ? 'Declined' : 'Pending';
    try {
      const res = await fetch(`http://127.0.0.1:8000/guests/${guestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchGuests();
        triggerNotification(`Guest status updated to ${nextStatus}.`);
      }
    } catch (err) {
      console.error("Error toggling status", err);
    }
  };

  const handleDeleteGuest = async (guestId: number) => {
    if (!window.confirm("Remove this guest and cancel their ticket registration?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/guests/${guestId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerNotification("Guest registration deleted.");
        fetchGuests();
      }
    } catch (err) {
      console.error("Error deleting guest", err);
    }
  };

  const handleLaunchCampaign = async () => {
    setLaunching(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/events/${eventId}/notifications/campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: campaignChannel,
          template_type: campaignTemplate,
          recipient_role: campaignRecipient
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotification(`Campaign fired! Sent ${data.sent_messages_count} messages.`);
        fetchCampaignLogs();
      }
    } catch (err) {
      console.error("Error firing campaign", err);
    } finally {
      setLaunching(false);
    }
  };

  // Filters logic
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          guest.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || guest.status === statusFilter;
    const matchesRole = roleFilter === 'All' || guest.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('guests')}</h1>
          <p className="text-gray-400 text-sm mt-1">Manage event registrations, track RSVPs, and distribute automated alerts.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all duration-300 glow-primary cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Guest
        </button>
      </div>

      {/* Add Guest Form (Expandable) */}
      {showAddForm && (
        <form onSubmit={handleAddGuest} className="glass-panel p-6 rounded-2xl grid grid-cols-1 md:grid-cols-5 gap-4 items-end animate-in slide-in-from-top-4 duration-300">
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[10px] font-bold text-indigo-400 uppercase">Guest Name</label>
            <input 
              type="text" 
              required
              value={newGuestName} 
              onChange={e => setNewGuestName(e.target.value)} 
              placeholder="Alice Johnson"
              className="w-full glass-input rounded-xl px-3 py-2 text-xs" 
            />
          </div>
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[10px] font-bold text-indigo-400 uppercase">Email Address</label>
            <input 
              type="email" 
              required
              value={newGuestEmail} 
              onChange={e => setNewGuestEmail(e.target.value)} 
              placeholder="alice@domain.com"
              className="w-full glass-input rounded-xl px-3 py-2 text-xs" 
            />
          </div>
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[10px] font-bold text-indigo-400 uppercase">Phone Number</label>
            <input 
              type="text" 
              value={newGuestPhone} 
              onChange={e => setNewGuestPhone(e.target.value)} 
              placeholder="+15550000 (Optional)"
              className="w-full glass-input rounded-xl px-3 py-2 text-xs" 
            />
          </div>
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[10px] font-bold text-indigo-400 uppercase">Role Type</label>
            <select
              value={newGuestRole}
              onChange={e => setNewGuestRole(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-slate-900"
            >
              <option value="Attendee">Attendee</option>
              <option value="Speaker">Speaker</option>
              <option value="VIP">VIP</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <button 
              type="submit" 
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer"
            >
              Save Registration
            </button>
          </div>
        </form>
      )}

      {/* Grid: Guest table & Campaign dispatch panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Guest Management Table */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Invited Registrants ({filteredGuests.length})</h3>
            
            {/* Table Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                <input 
                  type="text"
                  placeholder="Search guests..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="glass-input rounded-xl pl-9 pr-3 py-1.5 text-xs w-40 md:w-48"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="glass-input rounded-xl px-3 py-1.5 text-xs bg-slate-900 w-28"
              >
                <option value="All">All Statuses</option>
                <option value="Attending">Attending</option>
                <option value="Pending">Pending</option>
                <option value="Declined">Declined</option>
              </select>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="glass-input rounded-xl px-3 py-1.5 text-xs bg-slate-900 w-28"
              >
                <option value="All">All Roles</option>
                <option value="Attendee">Attendee</option>
                <option value="Speaker">Speaker</option>
                <option value="VIP">VIP</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-white/5 text-gray-400 border-b border-white/5">
                  <th className="p-3.5 font-bold tracking-wider uppercase">Name</th>
                  <th className="p-3.5 font-bold tracking-wider uppercase">Contact</th>
                  <th className="p-3.5 font-bold tracking-wider uppercase">Role</th>
                  <th className="p-3.5 font-bold tracking-wider uppercase">RSVP Status</th>
                  <th className="p-3.5 font-bold tracking-wider uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-200">
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">No matching guests found.</td>
                  </tr>
                ) : (
                  filteredGuests.map(guest => (
                    <tr key={guest.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{guest.name}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">ID: #{guest.id}</div>
                      </td>
                      <td className="p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Mail className="w-3 h-3 text-indigo-400" />
                          <span className="truncate max-w-[120px]">{guest.email}</span>
                        </div>
                        {guest.phone && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Phone className="w-3 h-3 text-purple-400" />
                            <span>{guest.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          guest.role === 'VIP' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                          guest.role === 'Speaker' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' :
                          guest.role === 'Staff' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                          'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                        }`}>
                          {guest.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleStatus(guest.id, guest.status)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-left hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                            guest.status === 'Attending' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                            guest.status === 'Declined' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                            'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {guest.status}
                        </button>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteGuest(guest.id)}
                          className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer"
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
        </div>

        {/* Automation & Notification Campaign Console */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-400" />
              Launch Automation Campaign
            </h3>
            
            <div className="space-y-3.5">
              {/* Channel Selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Dispatch Channel</label>
                <select
                  value={campaignChannel}
                  onChange={e => setCampaignChannel(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-slate-900"
                >
                  <option value="Email">Email Marketing</option>
                  <option value="SMS">SMS Cellular</option>
                  <option value="Push">Push Notification</option>
                </select>
              </div>

              {/* Template Selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Message Content Template</label>
                <select
                  value={campaignTemplate}
                  onChange={e => setCampaignTemplate(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-slate-900"
                >
                  <option value="RSVP Reminder">RSVP Reminder (Pending Guests only)</option>
                  <option value="Ticket Details">Issue Ticket Code Details</option>
                  <option value="Venue Update">Important Venue Update</option>
                  <option value="Post-Event Survey">Post-Event Thank You &amp; Survey</option>
                </select>
              </div>

              {/* Recipient Roles */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Target Audience Filter</label>
                <select
                  value={campaignRecipient}
                  onChange={e => setCampaignRecipient(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-slate-900"
                >
                  <option value="All">All Registrants</option>
                  <option value="Attendee">General Attendees only</option>
                  <option value="Speaker">Guest Speakers only</option>
                  <option value="VIP">VIP Ticket Holders only</option>
                </select>
              </div>

              {/* Launch Trigger */}
              <button
                onClick={handleLaunchCampaign}
                disabled={launching}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2 glow-primary"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${launching ? 'animate-spin' : ''}`} />
                {launching ? 'Broadcasting campaign...' : 'Launch Automation Campaign'}
              </button>
            </div>
          </div>

          {/* Campaign Dispatch Simulation Log */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col h-[280px]">
            <h4 className="text-xs font-bold text-white tracking-wide border-b border-white/5 pb-2.5 mb-2.5">
              Simulated Dispatch Log
            </h4>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-[10px]">
              {campaignLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No campaigns launched yet. Firing campaigns seeds dispatch logs.</p>
              ) : (
                campaignLogs.map(log => (
                  <div key={log.id} className="p-2.5 bg-white/5 rounded-xl border border-white/5 space-y-1 leading-normal">
                    <div className="flex justify-between font-bold">
                      <span className="text-indigo-300">{log.recipient_name} ({log.channel})</span>
                      <span className="text-emerald-400">{log.status}</span>
                    </div>
                    <p className="text-gray-400 font-semibold">{log.template_type}</p>
                    <p className="text-gray-300 mt-1 italic">"{log.body}"</p>
                    <span className="text-[8px] text-gray-500 font-bold block pt-1">Timestamp: {log.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

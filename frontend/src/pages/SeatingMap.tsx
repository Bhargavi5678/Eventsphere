import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MapPin, 
  UserCheck, 
  UserPlus, 
  UserMinus, 
  Move,
  Settings,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SeatData {
  id: number;
  table_name: string;
  table_shape: string;
  x_coordinate: number;
  y_coordinate: number;
  capacity: number;
  guest_ids: number[];
}

interface GuestData {
  id: number;
  name: string;
  role: string;
  table_id: number | null;
}

interface SeatingMapProps {
  eventId: number;
  triggerNotification: (message: string) => void;
}

export const SeatingMap: React.FC<SeatingMapProps> = ({ eventId, triggerNotification }) => {
  const { t } = useLanguage();

  const [tables, setTables] = useState<SeatData[]>([]);
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [activeTable, setActiveTable] = useState<SeatData | null>(null);

  // Form states
  const [tableName, setTableName] = useState('');
  const [tableShape, setTableShape] = useState('round');
  const [tableCapacity, setTableCapacity] = useState(8);

  // Drag and drop states
  const [draggingTable, setDraggingTable] = useState<{
    id: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const fetchData = async () => {
    try {
      const seatRes = await fetch(`${API_BASE_URL}/events/${eventId}/seating`);
      const seatData = await seatRes.json();
      setTables(seatData);

      const guestRes = await fetch(`${API_BASE_URL}/events/${eventId}/guests`);
      const guestData = await guestRes.json();
      setGuests(guestData);
    } catch (err) {
      console.error("Error loading seating data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName) return;
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/seating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: tableName,
          table_shape: tableShape,
          capacity: tableCapacity,
          x_coordinate: Math.round(150 + Math.random() * 100), // random offset near center
          y_coordinate: Math.round(150 + Math.random() * 100),
          guest_ids: []
        })
      });
      if (res.ok) {
        setTableName('');
        setTableShape('round');
        setTableCapacity(8);
        triggerNotification(`Table "${tableName}" added to venue map.`);
        fetchData();
      }
    } catch (err) {
      console.error("Error adding table", err);
      triggerNotification("Failed to add table. Check backend connection.");
    }
  };

  const handleRemoveTable = async (tableId: number) => {
    if (!window.confirm("Remove this table and clear all seat assignments?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/seating/${tableId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerNotification("Table removed.");
        setActiveTable(null);
        fetchData();
      }
    } catch (err) {
      console.error("Error deleting table", err);
    }
  };

  // Update table position after drag
  const handleUpdateTablePosition = async (tableId: number, newX: number, newY: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    try {
      const res = await fetch(`${API_BASE_URL}/seating/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: newX, y: newY,
          guest_ids: table.guest_ids
        })
      });
      if (res.ok) {
        fetchData();
        // Update active table selection coordinates as well
        if (activeTable && activeTable.id === tableId) {
          setActiveTable(prev => prev ? { ...prev, x_coordinate: newX, y_coordinate: newY } : null);
        }
      }
    } catch (err) {
      console.error("Error moving table", err);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, tableId: number) => {
    e.preventDefault();
    const tableElement = e.currentTarget as HTMLDivElement;
    const rect = tableElement.getBoundingClientRect();
    const parentRect = tableElement.parentElement!.getBoundingClientRect();

    setDraggingTable({
      id: tableId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setTables(prevTables =>
        prevTables.map(t => {
          if (t.id === tableId) {
            const newX = moveEvent.clientX - parentRect.left - (e.clientX - rect.left);
            const newY = moveEvent.clientY - parentRect.top - (e.clientY - rect.top);
            
            // Boundary checks for visual feedback
            const boundedX = Math.max(38, Math.min(parentRect.width - 38, newX));
            const boundedY = Math.max(38, Math.min(parentRect.height - 38, newY));

            return { ...t, x_coordinate: boundedX, y_coordinate: boundedY };
          }
          return t;
        })
      );
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const newX = upEvent.clientX - parentRect.left - (e.clientX - rect.left);
      const newY = upEvent.clientY - parentRect.top - (e.clientY - rect.top);
      
      const boundedX = Math.max(38, Math.min(parentRect.width - 38, newX));
      const boundedY = Math.max(38, Math.min(parentRect.height - 38, newY));

      const finalX = Math.round(boundedX);
      const finalY = Math.round(boundedY);

      handleUpdateTablePosition(tableId, finalX, finalY);
      
      setDraggingTable(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Seat a guest at active table
  const handleAssignSeat = async (guestId: number) => {
    if (!activeTable) return;
    if (activeTable.guest_ids.length >= activeTable.capacity) {
      triggerNotification("Table is already at full capacity!");
      return;
    }
    const updatedGuestIds = [...activeTable.guest_ids, guestId];
    try {
      const res = await fetch(`${API_BASE_URL}/seating/${activeTable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: activeTable.x_coordinate,
          y: activeTable.y_coordinate,
          guest_ids: updatedGuestIds
        })
      });
      if (res.ok) {
        const updatedTable = await res.json();
        setActiveTable(updatedTable);
        fetchData();
        triggerNotification("Guest seated at table.");
      }
    } catch (err) {
      console.error("Error seating guest", err);
    }
  };

  // Unseat a guest
  const handleRemoveSeat = async (guestId: number) => {
    if (!activeTable) return;
    const updatedGuestIds = activeTable.guest_ids.filter(id => id !== guestId);
    try {
      const res = await fetch(`${API_BASE_URL}/seating/${activeTable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: activeTable.x_coordinate,
          y: activeTable.y_coordinate,
          guest_ids: updatedGuestIds
        })
      });
      if (res.ok) {
        const updatedTable = await res.json();
        setActiveTable(updatedTable);
        // Also clear guest table reference in guests state local view
        setGuests(prev => prev.map(g => g.id === guestId ? { ...g, table_id: null } : g));
        fetchData();
        triggerNotification("Guest removed from table.");
      }
    } catch (err) {
      console.error("Error removing guest from seat", err);
    }
  };

  // Unseated guests filtering
  const unseatedGuests = guests.filter(g => g.table_id === null && g.role !== 'Staff');
  const seatedGuestsAtActiveTable = guests.filter(g => activeTable?.guest_ids.includes(g.id));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('seating')}</h1>
        <p className="text-gray-400 text-sm mt-1">Design table layouts, arrange coordinates, and allocate guests on the interactive floor plan.</p>
      </div>

      {/* Grid: Canvas venue map & Sidebar configs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Visual Seating Floor Plan Map */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-3 flex flex-col space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Interactive Venue Map Floor Plan
            </h3>
            <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/20 border border-indigo-400"></span>
                Round Table
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-4 bg-indigo-500/20 border border-indigo-400"></span>
                Rectangular
              </span>
            </div>
          </div>

          {/* Map Grid Area */}
          <div className="relative w-full h-[450px] bg-[#0c101b]/80 border border-white/5 rounded-2xl grid-bg-overlay overflow-hidden shadow-inner">
            
            {/* STATIC STAGE OBJ */}
            <div className="absolute top-2 left-[calc(50%-100px)] w-[200px] h-10 bg-indigo-900/30 border border-indigo-500/40 rounded-b-xl flex items-center justify-center shadow-lg">
              <span className="text-[10px] font-black text-indigo-300 tracking-widest uppercase">MAIN PERFORMANCE STAGE</span>
            </div>

            {/* STATIC BAR / CATERING */}
            <div className="absolute bottom-2 left-4 w-[120px] h-16 bg-purple-900/20 border border-purple-500/30 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-[9px] font-bold text-purple-400 tracking-wider text-center px-2">CATERING &amp; BAR</span>
            </div>

            {/* STATIC ENTRANCE */}
            <div className="absolute bottom-2 right-4 w-[100px] h-10 bg-slate-900/80 border border-slate-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-[9px] font-bold text-gray-400 tracking-wider">ENTRANCE</span>
            </div>

            {/* Render tables dynamically */}
            {tables.map(table => {
              const isSelected = activeTable?.id === table.id;
              const isRound = table.table_shape === 'round';
              const seatPercentage = Math.round((table.guest_ids.length / table.capacity) * 100);

              return (
                <div
                  key={table.id}
                  onMouseDown={(e) => handleMouseDown(e, table.id)}
                  onClick={() => !draggingTable && setActiveTable(table)}
                  style={{ left: `${table.x_coordinate}px`, top: `${table.y_coordinate}px` }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab flex flex-col items-center justify-center z-10 ${
                    isSelected ? 'scale-115' : 'hover:scale-105' 
                  }`}
                >
                  {/* Table Shape Graphic */}
                  <div 
                    className={`flex items-center justify-center text-center font-bold text-[10px] shadow-2xl transition-all ${
                      isRound ? 'rounded-full' : 'rounded-xl'
                    } ${
                      isSelected 
                        ? 'bg-indigo-600 border-2 border-indigo-400 text-white glow-primary' 
                        : 'bg-slate-800/80 border border-white/10 text-gray-300 hover:border-indigo-400/40'
                    }`}
                    style={{ 
                      width: isRound ? '75px' : '95px', 
                      height: '75px' 
                    }}
                  >
                    <div className="px-1.5 leading-tight">
                      <div className="truncate font-black">{table.table_name}</div>
                      <div className="text-[9px] text-indigo-300 font-semibold mt-0.5">{table.guest_ids.length} / {table.capacity}</div>
                    </div>
                  </div>

                  {/* Seat percentage badge */}
                  <span className="mt-1.5 px-1.5 py-0.5 rounded bg-slate-950/90 text-[8px] text-gray-400 border border-white/5 font-bold">
                    {seatPercentage}% full
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar panels: Add Table form & table seating settings */}
        <div className="space-y-6">
          
          {/* Add Table Layout Card */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Add Venue Table
            </h3>

            <form onSubmit={handleAddTable} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Table Label</label>
                <input 
                  type="text" 
                  value={tableName}
                  onChange={e => setTableName(e.target.value)}
                  placeholder="Table 4 / VIP Round"
                  required
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Shape</label>
                <select
                  value={tableShape}
                  onChange={e => setTableShape(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-slate-900"
                >
                  <option value="round">Round Table</option>
                  <option value="rectangular">Rectangular Banquet</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Capacity (Seats)</label>
                <select
                  value={tableCapacity}
                  onChange={e => setTableCapacity(parseInt(e.target.value))}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-slate-900"
                >
                  <option value="4">4 Seats</option>
                  <option value="6">6 Seats</option>
                  <option value="8">8 Seats</option>
                  <option value="10">10 Seats</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer glow-primary"
              >
                Place Table on Floor
              </button>
            </form>
          </div>

          {/* Active Seating / Drag position Panel */}
          {activeTable ? (
            <div className="glass-panel p-6 rounded-2xl space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                <h4 className="text-xs font-bold text-white tracking-wide truncate max-w-[120px]">
                  {activeTable.table_name}
                </h4>
                <button
                  onClick={() => handleRemoveTable(activeTable.id)}
                  className="p-1 rounded hover:bg-red-500/10 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Drag Position Control Simulation */}
              <div className="space-y-2 opacity-50">
                <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-indigo-400" />
                  Reposition by dragging on map
                </span>
              </div>

              {/* Seating Assignment */}
              <div className="space-y-3 pt-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Seated Guests ({activeTable.guest_ids.length} / {activeTable.capacity})
                </span>

                {/* Seated Guests List */}
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {seatedGuestsAtActiveTable.length === 0 ? (
                    <p className="text-[10px] text-gray-500 italic">No guests seated yet.</p>
                  ) : (
                    seatedGuestsAtActiveTable.map(g => (
                      <div key={g.id} className="flex justify-between items-center bg-white/5 p-1.5 rounded-lg border border-white/5 text-[11px]">
                        <span className="font-semibold text-gray-300 truncate max-w-[120px]">{g.name}</span>
                        <button
                          onClick={() => handleRemoveSeat(g.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Unseated Guests Dropdown */}
                {activeTable.guest_ids.length < activeTable.capacity && (
                  <div className="space-y-1.5 border-t border-white/5 pt-3">
                    <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                      Seat unassigned Guest
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {unseatedGuests.length === 0 ? (
                        <p className="text-[10px] text-gray-500 italic">All registered guests seated.</p>
                      ) : (
                        unseatedGuests.map(g => (
                          <button
                            key={g.id}
                            onClick={() => handleAssignSeat(g.id)}
                            className="w-full text-left flex justify-between items-center bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 p-1.5 rounded-lg text-[11px] font-semibold text-indigo-300 hover:text-white cursor-pointer"
                          >
                            <span className="truncate max-w-[120px]">{g.name}</span>
                            <span className="text-[8px] font-bold uppercase text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">{g.role}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl text-center text-gray-500 text-xs py-12">
              Select a table on the floor plan map grid to customize seating assignments and arrange positions.
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Download, 
  FileCheck, 
  Printer, 
  User, 
  Settings 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface GuestData {
  id: number;
  name: string;
  role: string;
  status: string;
}

interface CertificatesProps {
  eventId: number;
  triggerNotification: (message: string) => void;
}

export const Certificates: React.FC<CertificatesProps> = ({ eventId, triggerNotification }) => {
  const { t } = useLanguage();

  const [guests, setGuests] = useState<GuestData[]>([]);
  const [selectedGuestName, setSelectedGuestName] = useState('');
  const [certificateTemplate, setCertificateTemplate] = useState('Classic Gold');
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGuests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/guests`);
      const data = await res.json();
      // Filter attending/present guests for certificates
      const attending = data.filter((g: any) => g.status.toLowerCase() === 'attending');
      setGuests(attending);
      if (attending.length > 0) {
        setSelectedGuestName(attending[0].name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [eventId]);

  const fetchCertificate = async () => {
    if (!selectedGuestName) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/certificates/generate?guest_name=${encodeURIComponent(selectedGuestName)}`);
      const svgText = await res.text();
      setSvgContent(svgText);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificate();
  }, [selectedGuestName, certificateTemplate, eventId]);

  const handleDownload = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificate-${selectedGuestName.replace(/\s+/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerNotification("Vector certificate downloaded successfully!");
  };

  const handlePrint = () => {
    if (!svgContent) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<html><body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh;">${svgContent}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('certificates')}</h1>
        <p className="text-gray-400 text-sm mt-1">Generate elegant attendance and host appreciation credentials for confirmed attendees.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Certificate Designer Panel (Left) */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-4 space-y-6">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              Certificate Designer Console
            </h3>
            <span className="text-[9px] text-gray-500 font-bold uppercase">Template</span>
          </div>

          <div className="space-y-4 text-xs font-semibold text-gray-300">
            {/* Guest Dropdown */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Select Recipient Guest</label>
              <select
                value={selectedGuestName}
                onChange={e => setSelectedGuestName(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 bg-slate-900 font-bold text-indigo-300"
              >
                {guests.length === 0 ? (
                  <option value="">No checked-in guests found</option>
                ) : (
                  guests.map(g => (
                    <option key={g.id} value={g.name}>{g.name} ({g.role})</option>
                  ))
                )}
              </select>
            </div>

            {/* Template Styles */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Certificate border layout</label>
              <select
                value={certificateTemplate}
                onChange={e => setCertificateTemplate(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 bg-slate-900"
              >
                <option value="Classic Gold">Imperial Classic Gold</option>
                <option value="Neon Modern">Neon Modern Gradient</option>
                <option value="Silver Executive">Executive Silver Border</option>
              </select>
            </div>

            {/* Verification details */}
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 space-y-2.5 text-[11px] leading-normal font-medium text-gray-400">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Automatically signs authorized Host seals.</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Applies standard ISO high-resolution vector text.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
              <button
                onClick={handleDownload}
                disabled={!svgContent}
                className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 glow-primary"
              >
                <Download className="w-4 h-4" />
                Download SVG
              </button>
              <button
                onClick={handlePrint}
                disabled={!svgContent}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print/PDF
              </button>
            </div>
          </div>
        </div>

        {/* Certificate Display Area (Right) */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-8 flex flex-col justify-center items-center overflow-hidden min-h-[420px] bg-slate-950/20">
          {loading ? (
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
              Drafting Certificate XML...
            </div>
          ) : svgContent ? (
            <div 
              className="w-full flex justify-center shadow-2xl rounded-xl overflow-hidden border border-white/5 animate-in zoom-in-95 duration-300"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="text-center space-y-2">
              <Award className="w-12 h-12 text-indigo-500/20 mx-auto" />
              <p className="text-xs text-gray-500">Ensure registered guests are marked as "Attending" to enable certificate drafting.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

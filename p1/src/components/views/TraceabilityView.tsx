'use client';

import { useState, useEffect } from 'react';
import { Search, Shield } from 'lucide-react';
import { List } from 'react-window';
import QRCode from 'qrcode';

interface Batch {
  batch_id: string;
  farm_name?: string;
  crop_type: string;
  quantity_kg: number;
  harvest_date: string;
  status: string;
  traceability_hash_chain: string;
}

interface TraceabilityViewProps {
  batches: Batch[];
}

export default function TraceabilityView({ batches }: TraceabilityViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Localized Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleQRTrigger = async (batchId: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(`https://agriguard.io/trace/${batchId}`);
      setQrCodeUrl(qrDataUrl);
      setQrModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBatches = batches.filter(
    (b) =>
      b.batch_id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      b.traceability_hash_chain.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  // virtualized row renderer for react-window v2
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const batch = filteredBatches[index];
    if (!batch) return null;

    return (
      <div 
        style={style} 
        className="flex items-center text-xs text-slate-200 border-b border-slate-800/40 hover:bg-slate-900/20 transition-colors px-4"
      >
        <div className="w-[18%] font-mono-data font-semibold text-[#00D2FF] truncate pr-2">{batch.batch_id}</div>
        <div className="w-[20%] font-semibold text-white truncate pr-2">{batch.farm_name || 'Green Valley Farm'}</div>
        <div className="w-[12%] truncate pr-2">{batch.crop_type}</div>
        <div className="w-[10%] font-mono-data truncate pr-2">{batch.quantity_kg} kg</div>
        <div className="w-[13%] font-mono-data truncate pr-2">{batch.harvest_date}</div>
        <div className="w-[10%] pr-2">
          <span className="bg-emerald-500/10 text-[#00E676] px-2 py-0.5 rounded text-[9px] uppercase font-bold border border-[#00E676]/20">
            {batch.status}
          </span>
        </div>
        <div className="w-[17%] font-mono-data text-slate-500 truncate pr-2">{batch.traceability_hash_chain}</div>
        <div className="w-[10%] text-center">
          <button 
            onClick={() => handleQRTrigger(batch.batch_id)}
            className="bg-slate-900 border border-slate-800 hover:border-[#00D2FF] hover:text-[#00D2FF] px-3 py-1 rounded text-[10px] font-bold uppercase transition"
          >
            Scan
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Info */}
      <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-xl flex flex-col gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00D2FF]" />
          Blockchain Batch Traceability
        </h3>
        <p className="text-xs text-slate-400">
          Tamper-proof provenance chain powered by Hyperledger Fabric. Search harvest batches or generate QR traceability codes to view public quality specifications.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search batch IDs or hashes..." 
            className="bg-slate-900/40 border border-slate-800 rounded-lg pl-10 pr-4 py-2 w-full text-sm focus:outline-none focus:border-[#00D2FF]"
          />
        </div>
      </div>

      {/* Batch Table Container */}
      <div className="glass-panel border border-slate-800/80 rounded-xl overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="flex items-center text-xs border-b border-slate-800 text-slate-400 bg-slate-950/20 font-mono-data uppercase py-3.5 px-4 font-semibold">
          <div className="w-[18%]">Batch ID</div>
          <div className="w-[20%]">Farm</div>
          <div className="w-[12%]">Crop</div>
          <div className="w-[10%]">Qty</div>
          <div className="w-[13%]">Harvest Date</div>
          <div className="w-[10%]">Status</div>
          <div className="w-[17%]">Hash Chain</div>
          <div className="w-[10%] text-center">Action</div>
        </div>

        {/* Virtualized List Container */}
        {filteredBatches.length > 0 ? (
          <List<any>
            style={{ height: '400px', width: '100%' }}
            rowCount={filteredBatches.length}
            rowHeight={50}
            rowComponent={Row}
            rowProps={{}}
          />
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No matching batches found in the ledger.
          </div>
        )}
      </div>

      {/* ===== QR CODE DETAILED MODAL OVERLAY ===== */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-[#0B101E] border border-slate-800 rounded-2xl p-6 w-full max-w-sm flex flex-col items-center gap-5 shadow-2xl relative">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white self-start">Traceability QR Code</h3>
            
            {qrCodeUrl && (
              <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-200">
                <img src={qrCodeUrl} alt="Traceability QR Link" className="w-48 h-48" />
              </div>
            )}

            <p className="text-xs text-slate-400 text-center">
              Scan this QR code with any mobile device camera to view cryptographic provenance audits, crop grades, and soil parameters.
            </p>

            <button 
              onClick={() => {
                setQrModalOpen(false);
                setQrCodeUrl(null);
              }}
              className="w-full bg-[#00D2FF] hover:bg-[#2A8BF2] text-slate-950 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition"
            >
              Close Overlay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

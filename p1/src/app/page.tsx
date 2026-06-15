'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  BarChart3, Compass, ShieldAlert, Cpu, Database, Globe, Layers, 
  LogOut, RefreshCw
} from 'lucide-react';
import { FARM_NODES } from '@/lib/data';

// Dynamically import views for code splitting
const DashboardView = dynamic(() => import('@/components/views/DashboardView'), {
  ssr: false,
  loading: () => (
    <div className="w-full py-20 flex flex-col items-center justify-center text-slate-400">
      <RefreshCw className="w-6 h-6 animate-spin mb-3 text-[#00D2FF]" />
      <span>Loading Dashboard View...</span>
    </div>
  )
});

const MapView = dynamic(() => import('@/components/views/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full py-20 flex flex-col items-center justify-center text-slate-400">
      <RefreshCw className="w-6 h-6 animate-spin mb-3 text-[#00D2FF]" />
      <span>Loading GIS Map View...</span>
    </div>
  )
});

const EdgeAIView = dynamic(() => import('@/components/views/EdgeAIView'), {
  ssr: false,
  loading: () => (
    <div className="w-full py-20 flex flex-col items-center justify-center text-slate-400">
      <RefreshCw className="w-6 h-6 animate-spin mb-3 text-[#00D2FF]" />
      <span>Loading Edge AI Monitor...</span>
    </div>
  )
});

const TraceabilityView = dynamic(() => import('@/components/views/TraceabilityView'), {
  ssr: false,
  loading: () => (
    <div className="w-full py-20 flex flex-col items-center justify-center text-slate-400">
      <RefreshCw className="w-6 h-6 animate-spin mb-3 text-[#00D2FF]" />
      <span>Loading Traceability Ledger...</span>
    </div>
  )
});

const BenchmarkView = dynamic(() => import('@/components/views/BenchmarkView'), {
  ssr: false,
  loading: () => (
    <div className="w-full py-20 flex flex-col items-center justify-center text-slate-400">
      <RefreshCw className="w-6 h-6 animate-spin mb-3 text-[#00D2FF]" />
      <span>Loading Global Benchmarks...</span>
    </div>
  )
});

const AlertsView = dynamic(() => import('@/components/views/AlertsView'), {
  ssr: false,
  loading: () => (
    <div className="w-full py-20 flex flex-col items-center justify-center text-slate-400">
      <RefreshCw className="w-6 h-6 animate-spin mb-3 text-[#00D2FF]" />
      <span>Loading Alerts & Control...</span>
    </div>
  )
});

const ArchitectureView = dynamic(() => import('@/components/views/ArchitectureView'), {
  ssr: false,
  loading: () => (
    <div className="w-full py-20 flex flex-col items-center justify-center text-slate-400">
      <RefreshCw className="w-6 h-6 animate-spin mb-3 text-[#00D2FF]" />
      <span>Loading Platform Architecture...</span>
    </div>
  )
});

const AuthPage = dynamic(() => import('@/components/AuthPage'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B101E] text-slate-400">
      <RefreshCw className="w-8 h-8 animate-spin mb-4 text-[#00E676]" />
      <span>Establishing Secure Connection...</span>
    </div>
  )
});

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [nodesOnline] = useState('7/8');
  const [avgLatency] = useState('187ms');
  const [batches, setBatches] = useState<any[]>([]);
  const [activeFarmNodes] = useState(FARM_NODES);

  // Fetch batches only when entering the traceability view
  useEffect(() => {
    if (activeView !== 'traceability') return;

    fetch('/api/v1/batches')
      .then(res => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          setBatches(data);
        } else {
          throw new Error("Empty batches");
        }
      })
      .catch(() => {
        // Fallback static batches matching baseline
        setBatches([
          { batch_id: "BTCH-2594831", farm_name: "Green Valley Organic Farm", crop_type: "Tomato", grade_mix: { A_pct: 82.5, B_pct: 12.0 }, quantity_kg: 45.4, harvest_date: "2026-06-13", traceability_hash_chain: "0x89ab7cd12345e678f9012345abcdef12345678901234567890abcdef123456", status: "RECORDED" },
          { batch_id: "BTCH-2594832", farm_name: "Sunrise Spice Plantation", crop_type: "Chilli", grade_mix: { A_pct: 90.0, B_pct: 8.5 }, quantity_kg: 43.5, harvest_date: "2026-06-12", traceability_hash_chain: "0x91bc8de23456f789a0123456bcdef2345678901234567890abcdef234567", status: "RECORDED" },
          { batch_id: "BTCH-2594833", farm_name: "Golden Harvest Paddy Field", crop_type: "Rice", grade_mix: { A_pct: 64.0, B_pct: 22.0 }, quantity_kg: 317.0, harvest_date: "2026-06-11", traceability_hash_chain: "0xc560dfa3456789a01234567bcdef345678901234567890abcdef3456789", status: "RECORDED" }
        ]);
      });
  }, [activeView]);

  if (!isLoggedIn) {
    return <AuthPage onAuthSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen flex text-slate-100 font-sans z-10 relative">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 bg-slate-950/75 border-r border-slate-800/80 p-5 flex flex-col justify-between backdrop-blur-md z-30">
        <div>
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-xl shadow-glowGreen/10">🌿</div>
            <div>
              <h1 className="text-md font-bold tracking-wide text-white uppercase">AgriGuard</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono-data">AIoT Health</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Overview</span>
            
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all font-semibold ${
                activeView === 'dashboard' 
                  ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 text-[#00D2FF] border-l-2 border-[#00D2FF]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Live Dashboard
            </button>

            <button 
              onClick={() => setActiveView('map')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all font-semibold ${
                activeView === 'map' 
                  ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 text-[#00D2FF] border-l-2 border-[#00D2FF]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <Compass className="w-4 h-4" />
              GIS Map View
            </button>

            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold my-2">Intelligence</span>

            <button 
              onClick={() => setActiveView('edge-ai')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all font-semibold ${
                activeView === 'edge-ai' 
                  ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 text-[#00D2FF] border-l-2 border-[#00D2FF]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Edge AI Monitor
            </button>

            <button 
              onClick={() => setActiveView('traceability')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all font-semibold ${
                activeView === 'traceability' 
                  ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 text-[#00D2FF] border-l-2 border-[#00D2FF]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <Database className="w-4 h-4" />
              Batch Traceability
            </button>

            <button 
              onClick={() => setActiveView('benchmark')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all font-semibold ${
                activeView === 'benchmark' 
                  ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 text-[#00D2FF] border-l-2 border-[#00D2FF]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <Globe className="w-4 h-4" />
              Global Benchmarks
            </button>

            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold my-2">Operations</span>

            <button 
              onClick={() => setActiveView('alerts')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all font-semibold ${
                activeView === 'alerts' 
                  ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 text-[#00D2FF] border-l-2 border-[#00D2FF]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Alerts & Control
            </button>

            <button 
              onClick={() => setActiveView('architecture')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all font-semibold ${
                activeView === 'architecture' 
                  ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 text-[#00D2FF] border-l-2 border-[#00D2FF]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <Layers className="w-4 h-4" />
              Architecture
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00E676] shadow-glowGreen animate-pulse"></div>
            <span>Connected to Cloud</span>
          </div>

          <button 
            onClick={() => setIsLoggedIn(false)}
            className="flex items-center gap-3 text-slate-400 hover:text-red-400 text-sm font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            Logout Profile
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="flex-grow flex flex-col min-h-screen">
        {/* ===== TOP HEADER ===== */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/50 backdrop-blur px-8 flex items-center justify-between z-20">
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">
              {activeView === 'dashboard' && 'Live Dashboard'}
              {activeView === 'map' && 'GIS Map View'}
              {activeView === 'edge-ai' && 'Edge AI Monitor'}
              {activeView === 'traceability' && 'Batch Traceability'}
              {activeView === 'benchmark' && 'Global Benchmarks'}
              {activeView === 'alerts' && 'Alerts & Control'}
              {activeView === 'architecture' && 'Platform Architecture'}
            </h2>
          </div>

          {/* Quick status badges */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
              <span className="text-emerald-400">🟢</span>
              <span className="text-slate-200">{nodesOnline} Nodes Online</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
              <span className="text-amber-400">⚡</span>
              <span className="text-slate-200">Avg Latency: {avgLatency}</span>
            </div>
          </div>
        </header>

        {/* ===== VIEW CONTAINER ===== */}
        <main className="flex-grow p-8 overflow-y-auto z-10">
          {activeView === 'dashboard' && (
            <DashboardView 
              nodesOnline={nodesOnline} 
              avgLatency={avgLatency} 
              activeFarmNodes={activeFarmNodes} 
            />
          )}

          {activeView === 'map' && (
            <MapView activeFarmNodes={activeFarmNodes} />
          )}

          {activeView === 'edge-ai' && (
            <EdgeAIView />
          )}

          {activeView === 'traceability' && (
            <TraceabilityView batches={batches} />
          )}

          {activeView === 'benchmark' && (
            <BenchmarkView />
          )}

          {activeView === 'alerts' && (
            <AlertsView />
          )}

          {activeView === 'architecture' && (
            <ArchitectureView />
          )}
        </main>
      </div>
    </div>
  );
}

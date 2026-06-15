'use client';

import { RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapWidget = dynamic(() => import('@/components/MapWidget'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400">
      <RefreshCw className="w-6 h-6 animate-spin mr-3 text-[#00D2FF]" />
      <span>Loading GIS Map View...</span>
    </div>
  )
});

interface FarmNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  soil: string;
  coast: number;
}

interface MapViewProps {
  activeFarmNodes: FarmNode[];
}

export default function MapView({ activeFarmNodes }: MapViewProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Map Stats Overlays */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel border border-slate-800/80 p-5 rounded-xl">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block">Active Nodes</span>
          <span className="text-3xl font-bold font-mono-data text-white mt-1">2<span className="text-lg font-light text-slate-400">/2</span></span>
        </div>
        <div className="glass-panel border border-slate-800/80 p-5 rounded-xl">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block">High Risk Zones</span>
          <span className="text-3xl font-bold font-mono-data text-[#FF1744] mt-1">0</span>
        </div>
        <div className="glass-panel border border-slate-800/80 p-5 rounded-xl">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block">Avg Coast Distance</span>
          <span className="text-3xl font-bold font-mono-data text-[#00D2FF] mt-1">10.9 <span className="text-lg font-light text-slate-400">km</span></span>
        </div>
      </div>

      {/* GIS Leaflet Map */}
      <div className="glass-panel border border-slate-800/80 p-6 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Farm Network Map</h3>
          <div className="flex gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#00E676]"></span>Low Risk</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF9100]"></span>Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF1744]"></span>High Risk</span>
          </div>
        </div>
        
        <MapWidget 
          farms={activeFarmNodes.slice(0, 2).map(f => ({
            id: f.id,
            name: f.name,
            lat: f.lat,
            lng: f.lng,
            crop: f.soil === 'Sandy' ? 'Coconut' : 'Tomato',
            status: 'online',
            riskLevel: f.soil === 'Sandy' ? 'low' : 'medium'
          }))}
        />
      </div>
    </div>
  );
}

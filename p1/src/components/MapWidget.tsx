'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapWidgetProps {
  farms: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    crop: string;
    status: string;
    riskLevel: string;
  }>;
}

export default function MapWidget({ farms }: MapWidgetProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: [17.38, 73.95],
      zoom: 10,
      zoomControl: true,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Dark basemap layer from CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // Custom Icon for Leaflet
    const greenIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="relative w-4 h-4">
               <div class="absolute w-4 h-4 rounded-full bg-[#00E676] border-2 border-slate-900 animate-ping opacity-75"></div>
               <div class="absolute w-3.5 h-3.5 rounded-full bg-[#00E676] border-2 border-white top-0.5 left-0.5"></div>
             </div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    farms.forEach((farm) => {
      const marker = L.marker([farm.lat, farm.lng], { icon: greenIcon }).addTo(map);
      marker.bindPopup(`
        <div class="text-slate-900 p-1 font-sans">
          <strong class="text-sm block font-bold">${farm.name}</strong>
          <span class="text-xs text-slate-600 block">ID: ${farm.id} | Crop: ${farm.crop}</span>
          <span class="text-xs font-semibold uppercase ${
            farm.riskLevel === 'high' ? 'text-red-600' : farm.riskLevel === 'medium' ? 'text-orange-500' : 'text-green-600'
          }">Risk: ${farm.riskLevel}</span>
        </div>
      `);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [farms]);

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-slate-800/80 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur border border-slate-800 text-[10px] text-slate-400 py-1 px-2.5 rounded font-mono z-[1000] pointer-events-none">
        CartoDB Dark Matter | Leaflet v1.9.4
      </div>
    </div>
  );
}

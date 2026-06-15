'use client';

import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const benchmarkData = [
  { country: 'USA', adoption: 92, yield: 8.4 },
  { country: 'Netherlands', adoption: 95, yield: 9.1 },
  { country: 'Spain', adoption: 78, yield: 7.2 },
  { country: 'Germany', adoption: 85, yield: 7.8 },
  { country: 'Australia', adoption: 88, yield: 6.9 },
  { country: 'India', adoption: 62, yield: 5.4 },
];

export default function BenchmarkView() {
  const [benchmarkConfig, setBenchmarkConfig] = useState({
    crop: 'Tomato',
    region: 'Coastal MH'
  });
  const [recommendationCode, setRecommendationCode] = useState('');

  // Update recommendation based on dropdown selection
  useEffect(() => {
    if (benchmarkConfig.crop === 'Tomato' && benchmarkConfig.region === 'Coastal MH') {
      setRecommendationCode(`// Setpoint scaling offset for Coastal Monsoon tomatoes
FSM_Setpoints setpoints = {
    .temp_cooling_trigger_c = 26.5, // High ambient hum triggers cooling early
    .rh_setpoint_target_pct = 75.0,  // Scale target down to prevent molds
    .co2_setpoint_target_ppm = 450,
    .moisture_irrigation_pct = 40.0
};
PID_ScaleCoefficients(COASTAL_MONSOON_MODE);`);
    } else {
      setRecommendationCode(`// Setpoint scaling offset for Standard crop
FSM_Setpoints setpoints = {
    .temp_cooling_trigger_c = 28.0,
    .rh_setpoint_target_pct = 85.0,
    .co2_setpoint_target_ppm = 500,
    .moisture_irrigation_pct = 35.0
};
PID_ScaleCoefficients(DEFAULT_MODE);`);
    }
  }, [benchmarkConfig]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tech adoption index chart */}
        <div className="lg:col-span-2 glass-panel border border-slate-800/80 rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-6">Global Precision Tech Adoption Index</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarkData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="country" stroke="#475569" style={{ fontSize: '10px' }} />
                <YAxis stroke="#475569" style={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ background: '#0B101E', borderColor: 'rgba(255,255,255,0.1)' }} />
                <Bar dataKey="adoption" fill="#00D2FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="yield" fill="#00E676" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#00D2FF]"></span>Adoption Score %</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#00E676]"></span>Yield Factor (x10)</span>
          </div>
        </div>

        {/* Target adaptation code rules tool */}
        <div className="glass-panel border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Target Adaptation Code Tool</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Select Crop</label>
                <select 
                  value={benchmarkConfig.crop}
                  onChange={e => setBenchmarkConfig({...benchmarkConfig, crop: e.target.value})}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option>Tomato</option>
                  <option>Chilli</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Target Climate Zone</label>
                <select 
                  value={benchmarkConfig.region}
                  onChange={e => setBenchmarkConfig({...benchmarkConfig, region: e.target.value})}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="Coastal MH">Coastal Monsoon</option>
                  <option value="Inland Dry">Inland Dry</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">Generated firmware offsets:</span>
            <pre className="bg-slate-950 border border-slate-800/60 rounded p-3 text-[9px] font-mono-data text-[#00E676] overflow-x-auto leading-relaxed">
              {recommendationCode}
            </pre>
          </div>
        </div>
      </div>

      {/* Adoption comparative matrix grid */}
      <div className="glass-panel border border-slate-800/80 rounded-xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Comparative Country Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-lg">
            <span className="text-[10px] text-[#00D2FF] font-mono-data uppercase block font-bold">Netherlands</span>
            <span className="text-sm font-bold text-white block mt-1">High-Tech Greenhouse Robotics</span>
            <p className="text-xs text-slate-400 mt-2">Features autonomous sorting chutes, seed breeding and Arrhenius thermodynamics setpoint offsets.</p>
          </div>
          <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-lg">
            <span className="text-[10px] text-[#00D2FF] font-mono-data uppercase block font-bold">United States</span>
            <span className="text-sm font-bold text-white block mt-1">Satellite Remote Sensing</span>
            <p className="text-xs text-slate-400 mt-2">Features high-resolution NDVI vegetation indices and carbon credit tracing integrations.</p>
          </div>
          <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-lg">
            <span className="text-[10px] text-[#00D2FF] font-mono-data uppercase block font-bold">India</span>
            <span className="text-sm font-bold text-white block mt-1">Smart B2B Supply Logistics</span>
            <p className="text-xs text-slate-400 mt-2">Features smallholder micro-financing linked directly to visual edge crop-grading yields.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

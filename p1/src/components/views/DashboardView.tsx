'use client';

import { useState } from 'react';
import { Thermometer, Droplets, Activity, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import dynamic from 'next/dynamic';

const CircularGauge = dynamic(() => import('@/components/CircularGauge'), { ssr: false });

const sparklineTemp = [{ v: 22 }, { v: 22.5 }, { v: 22.2 }, { v: 23 }, { v: 22.8 }, { v: 23.4 }, { v: 23 }];
const sparklineHumid = [{ v: 62 }, { v: 63 }, { v: 64 }, { v: 64.5 }, { v: 63.8 }, { v: 64.2 }, { v: 64.5 }];
const sparklineCo2 = [{ v: 420 }, { v: 435 }, { v: 440 }, { v: 448 }, { v: 442 }, { v: 445 }, { v: 444 }];

const timeSeriesData = [
  { time: '00:00', Temp: 22.1, Humid: 61.2 },
  { time: '02:00', Temp: 22.5, Humid: 62.5 },
  { time: '04:00', Temp: 22.8, Humid: 63.8 },
  { time: '06:00', Temp: 23.2, Humid: 64.1 },
  { time: '08:00', Temp: 23.0, Humid: 64.5 },
  { time: '10:00', Temp: 23.4, Humid: 64.8 },
  { time: '12:00', Temp: 23.1, Humid: 64.5 },
];

interface FarmNode {
  id: string;
  name: string;
  dev: string;
}

interface DashboardViewProps {
  nodesOnline: string;
  avgLatency: string;
  activeFarmNodes: FarmNode[];
}

export default function DashboardView({ nodesOnline, avgLatency, activeFarmNodes }: DashboardViewProps) {
  // Localized Actuator States
  const [actuators, setActuators] = useState({
    humidifier: true,
    cooling: false,
    ventilation: true,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Sub-Status Info bar */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900/30 border border-slate-800 rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-500/10 text-[#00E676] px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider font-mono-data border border-[#00E676]/20">STABLE</span>
          <span className="text-xs text-slate-400 font-semibold">PID Controller Active</span>
        </div>
        <div className="flex gap-6 text-xs text-slate-400 font-mono-data">
          <span>PID Output: <strong className="text-white">3.6%</strong></span>
          <span>Setpoint RH: <strong className="text-white">88%</strong></span>
        </div>
      </div>

      {/* Sparklines Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Temperature card */}
        <div className="glass-panel border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between h-[130px] glass-panel-hover">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Temperature</span>
            <Thermometer className="w-5 h-5 text-[#FF9100]" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-4xl font-bold font-mono-data text-white">23<span className="text-2xl font-light text-slate-400">°C</span></span>
            <div className="w-20 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineTemp}>
                  <Line type="monotone" dataKey="v" stroke="#FF9100" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Humidity card */}
        <div className="glass-panel border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between h-[130px] glass-panel-hover">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Humidity (RH)</span>
            <Droplets className="w-5 h-5 text-[#00D2FF]" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-4xl font-bold font-mono-data text-white">64.5<span className="text-2xl font-light text-slate-400">%</span></span>
            <div className="w-20 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineHumid}>
                  <Line type="monotone" dataKey="v" stroke="#00D2FF" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CO2 Level card */}
        <div className="glass-panel border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between h-[130px] glass-panel-hover">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">CO2 Level</span>
            <Activity className="w-5 h-5 text-[#FF1744]" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-4xl font-bold font-mono-data text-white">444<span className="text-lg font-light text-slate-400">ppm</span></span>
            <div className="w-20 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineCo2}>
                  <Line type="monotone" dataKey="v" stroke="#FF1744" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Grade card */}
        <div className="glass-panel border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between h-[130px] glass-panel-hover">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">AI Grade</span>
            <CheckCircle className="w-5 h-5 text-[#00E676]" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-4xl font-bold font-mono-data text-white text-[#00E676]">A</span>
            <div className="text-[9px] font-mono-data text-slate-400 text-right">
              <div>A:31 | B:30</div>
              <div>C:12 | R:4</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main charts and controller layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Telemetry Chart */}
        <div className="lg:col-span-2 glass-panel border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Sensor Time Series Telemetry</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#FF9100]"></span>Temp</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#00D2FF]"></span>Humidity</span>
            </div>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9100" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FF9100" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHumid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D2FF" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00D2FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#475569" style={{ fontSize: '10px' }} />
                <YAxis stroke="#475569" style={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ background: '#0B101E', borderColor: 'rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="Temp" stroke="#FF9100" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={2} />
                <Area type="monotone" dataKey="Humid" stroke="#00D2FF" fillOpacity={1} fill="url(#colorHumid)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PID gauges & Actuators states */}
        <div className="flex flex-col gap-6">
          {/* PID Output circle */}
          <div className="glass-panel border border-slate-800/80 rounded-xl p-6 flex flex-col items-center justify-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 self-start">PID Controller Output</h3>
            <CircularGauge 
              value={4} 
              max={100} 
              label="PID Output" 
              subLabel="Current RH: 64%" 
              color="#00E676"
            />
            <div className="flex justify-between w-full mt-4 text-[10px] font-mono-data text-slate-400">
              <span>I-Term: <strong className="text-white">2.0</strong></span>
              <span>D-Term: <strong className="text-red-400">-0.65</strong></span>
            </div>
          </div>

          {/* Actuators toggles */}
          <div className="glass-panel border border-slate-800/80 rounded-xl p-6 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Actuator States</h3>
            
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div>
                <span className="text-sm font-semibold text-white block">Humidifier</span>
                <span className="text-[10px] text-slate-500 font-mono-data">45% power output</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={actuators.humidifier}
                  onChange={() => setActuators({...actuators, humidifier: !actuators.humidifier})}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00E676]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div>
                <span className="text-sm font-semibold text-white block">Cooling System</span>
                <span className="text-[10px] text-slate-500 font-mono-data">Chamber air fans</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={actuators.cooling}
                  onChange={() => setActuators({...actuators, cooling: !actuators.cooling})}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00E676]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white block">Ventilation Flaps</span>
                <span className="text-[10px] text-slate-500 font-mono-data">Solenoid gate valve</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={actuators.ventilation}
                  onChange={() => setActuators({...actuators, ventilation: !actuators.ventilation})}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00E676]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Farm Nodes status list bottom panel */}
      <div className="glass-panel border border-slate-800/80 rounded-xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Farm Nodes status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeFarmNodes.slice(0, 4).map((farm) => (
            <div key={farm.id} className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-lg flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white block truncate w-40">{farm.name}</span>
                <span className="text-[10px] text-slate-500 font-mono-data">{farm.id} • {farm.dev}</span>
              </div>
              <span className="bg-emerald-500/10 text-[#00E676] px-2 py-0.5 rounded text-[9px] uppercase font-bold border border-[#00E676]/20">ONLINE</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

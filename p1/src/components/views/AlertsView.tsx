'use client';

import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AlertsView() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Logs Timeline */}
        <div className="lg:col-span-2 glass-panel border border-slate-800/80 rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-6">Real-Time Event Logs</h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-start border-l-2 border-[#FF1744] pl-4 py-1">
              <ShieldAlert className="w-5 h-5 text-[#FF1744] shrink-0 mt-0.5" />
              <div className="flex-grow">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white uppercase">Critical Spoilage Alert</span>
                  <span className="text-slate-500 font-mono-data">02:14:05</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Chamber 2 (Chilli batch) sensor logs show RH spikes above 90% setpoint threshold.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start border-l-2 border-[#FF9100] pl-4 py-1">
              <AlertTriangle className="w-5 h-5 text-[#FF9100] shrink-0 mt-0.5" />
              <div className="flex-grow">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white uppercase">Actuator Setpoint Warn</span>
                  <span className="text-slate-500 font-mono-data">01:58:12</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Solenoid gate valve PID response offset exceeds default tolerance limits.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start border-l-2 border-[#00E676] pl-4 py-1">
              <CheckCircle className="w-5 h-5 text-[#00E676] shrink-0 mt-0.5" />
              <div className="flex-grow">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white uppercase">Blockchain Trace Commit</span>
                  <span className="text-slate-500 font-mono-data">01:26:40</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Batch BTCH-2594831 committed to ledger with hash 0x89ab... chain successfully verified.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actuators overrides */}
        <div className="glass-panel border border-slate-800/80 rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">PID Actuator Override</h3>
          
          <div className="flex flex-col gap-4">
            <button className="bg-slate-900 border border-slate-800 hover:border-[#FF1744] hover:text-[#FF1744] py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 transition duration-300">
              Emergency Ventilation Cutoff
            </button>
            <button className="bg-slate-900 border border-slate-800 hover:border-[#00D2FF] hover:text-[#00D2FF] py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 transition duration-300">
              Force Solenoid Calibration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

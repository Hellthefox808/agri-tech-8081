'use client';

import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import dynamic from 'next/dynamic';

const ConveyorBelt = dynamic(() => import('@/components/ConveyorBelt'), { ssr: false });

const gradeDistribution = [
  { name: 'Grade A', value: 50, color: '#00E676' },
  { name: 'Grade B', value: 43, color: '#FF9100' },
  { name: 'Grade C', value: 21, color: '#2A8BF2' },
  { name: 'Reject', value: 6, color: '#FF1744' },
];

export default function EdgeAIView() {
  return (
    <div className="flex flex-col gap-6">
      {/* Edge stats indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel border border-slate-800/80 p-5 rounded-xl">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block">Avg Latency</span>
          <span className="text-3xl font-bold font-mono-data text-white mt-1">187<span className="text-lg font-light text-slate-400">ms</span></span>
        </div>
        <div className="glass-panel border border-slate-800/80 p-5 rounded-xl">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block">Accuracy</span>
          <span className="text-3xl font-bold font-mono-data text-[#00E676] mt-1">94.2<span className="text-lg font-light text-slate-400">%</span></span>
        </div>
        <div className="glass-panel border border-slate-800/80 p-5 rounded-xl">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block">F1 Score</span>
          <span className="text-3xl font-bold font-mono-data text-[#00D2FF] mt-1">0.93</span>
        </div>
        <div className="glass-panel border border-slate-800/80 p-5 rounded-xl">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block">Inferences Today</span>
          <span className="text-3xl font-bold font-mono-data text-white mt-1">1,247</span>
        </div>
      </div>

      {/* Conveyor sorter and Grade distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conveyor Belt simulation visual */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ConveyorBelt />

          {/* Model Specs Table */}
          <div className="glass-panel border border-slate-800/80 rounded-xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Model Specifications</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono-data">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400">
                    <th className="py-2.5 font-semibold">Parameter</th>
                    <th className="py-2.5 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-200">
                  <tr>
                    <td className="py-2.5 text-slate-400 font-semibold">Model</td>
                    <td className="py-2.5">MobileNetV2-OB</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-400 font-semibold">Version</td>
                    <td className="py-2.5">2.4.0</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-400 font-semibold">Framework</td>
                    <td className="py-2.5">TensorFlow Lite Micro</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-400 font-semibold">Input Size</td>
                    <td className="py-2.5">224x224 RGB</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-400 font-semibold">Quantization</td>
                    <td className="py-2.5">INT8 Full Integer</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-400 font-semibold">FPS Latency</td>
                    <td className="py-2.5">215ms</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Grade Distribution donut chart */}
        <div className="glass-panel border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Grade Distribution</h3>
            <div className="w-full h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    innerRadius={65}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legends */}
          <div className="flex flex-col gap-2 mt-4">
            {gradeDistribution.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-mono-data font-semibold text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

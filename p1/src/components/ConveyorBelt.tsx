'use client';

import { useEffect, useState } from 'react';

interface ConveyorItem {
  id: number;
  type: string;
  grade: 'A' | 'B' | 'C' | 'R';
  color: string;
}

export default function ConveyorBelt() {
  const [items, setItems] = useState<ConveyorItem[]>([]);
  const [counter, setCounter] = useState(0);

  // Periodic generation of new items sliding in
  useEffect(() => {
    // Initial batch
    const initialItems: ConveyorItem[] = [
      { id: 1, type: 'Tomato', grade: 'A', color: 'bg-red-500' },
      { id: 2, type: 'Tomato', grade: 'B', color: 'bg-orange-500' },
      { id: 3, type: 'Tomato', grade: 'A', color: 'bg-red-500' },
      { id: 4, type: 'Tomato', grade: 'C', color: 'bg-yellow-600' },
      { id: 5, type: 'Tomato', grade: 'R', color: 'bg-red-700' },
    ];
    setItems(initialItems);
    setCounter(6);

    const interval = setInterval(() => {
      setItems((prev) => {
        // Shift left
        const next = [...prev];
        if (next.length > 8) {
          next.shift();
        }
        
        // Add new item
        const grades: Array<'A' | 'B' | 'C' | 'R'> = ['A', 'A', 'B', 'A', 'C', 'R'];
        const randomGrade = grades[Math.floor(Math.random() * grades.length)];
        
        let color = 'bg-red-500';
        if (randomGrade === 'B') color = 'bg-orange-500';
        else if (randomGrade === 'C') color = 'bg-yellow-600';
        else if (randomGrade === 'R') color = 'bg-red-700';

        next.push({
          id: counter + Math.random(),
          type: 'Tomato',
          grade: randomGrade,
          color,
        });
        return next;
      });
      setCounter((c) => c + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, [counter]);

  return (
    <div className="w-full bg-slate-950/40 border border-slate-800 rounded-xl p-6 relative overflow-hidden h-[220px] flex flex-col justify-between">
      <div>
        <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Conveyor Sorter Node - Chute FN-001</h4>
        <div className="text-[10px] text-emerald-400 font-mono-data">● RUNNING INFERENCE TASK ON CORE 1 — 60 FPS</div>
      </div>

      {/* Belt Layout */}
      <div className="relative w-full h-24 bg-slate-900 border-y border-slate-800 flex items-center overflow-hidden">
        {/* Conveyor grid lines animating */}
        <div className="absolute inset-0 flex space-x-12 opacity-15 pointer-events-none animate-conveyor">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-[1px] h-full bg-slate-400" />
          ))}
        </div>

        {/* Sliding items */}
        <div className="absolute inset-y-0 left-0 w-full flex items-center justify-around">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-col items-center justify-center transition-all duration-1000 ease-out"
              style={{
                transform: `translateX(-${(1 - index / items.length) * 10}px)`,
              }}
            >
              {/* Crop Node */}
              <div className={`w-12 h-12 rounded-full relative flex items-center justify-center ${item.color} shadow-lg border border-slate-900/40 transform hover:scale-110 transition-transform cursor-pointer`}>
                {/* Leaf icon decorator */}
                <div className="absolute -top-1 right-2 w-3.5 h-2.5 bg-green-600 rounded-tr-full rounded-bl-full transform rotate-12 border border-slate-900/20" />
                <span className="text-[10px] font-bold text-white font-mono-data">{item.grade}</span>
              </div>
              <span className="text-[9px] font-mono-data text-slate-500 mt-1 uppercase">
                {item.grade === 'R' ? 'REJECT' : `GRADE ${item.grade}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actuator Gates Info */}
      <div className="flex justify-between text-[9px] font-mono-data text-slate-500">
        <span>GATE 1 (GRADE A): OPEN</span>
        <span>GATE 2 (GRADE B): CLOSED</span>
        <span>GATE 3 (GRADE C): CLOSED</span>
        <span>GATE 4 (REJECT): SOLENOID ACTIVE</span>
      </div>
    </div>
  );
}

'use client';

interface CircularGaugeProps {
  value: number;
  max: number;
  label: string;
  subLabel?: string;
  color?: string;
  size?: number;
}

export default function CircularGauge({
  value,
  max,
  label,
  subLabel,
  color = '#00D2FF',
  size = 180,
}: CircularGaugeProps) {
  const radius = size * 0.4;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s ease-in-out',
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold font-mono-data text-white">{value}%</span>
          <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{label}</span>
          {subLabel && <span className="text-[10px] text-slate-500 font-mono-data mt-0.5">{subLabel}</span>}
        </div>
      </div>
    </div>
  );
}

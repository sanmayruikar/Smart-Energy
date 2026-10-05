import React from 'react';

const GaugeCard = ({ title, value, unit, min = 0, max = 100, color = '#6366f1', status }) => {
  const numValue = Number(value) || 0;
  const percentage = Math.min(100, Math.max(0, ((numValue - min) / (max - min)) * 100));

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {status && (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        )}
      </div>

      <div className="my-4 flex items-baseline justify-center space-x-1.5">
        <span className="text-3xl font-bold font-mono text-slate-100">{numValue.toFixed(1)}</span>
        <span className="text-sm font-semibold text-slate-400">{unit}</span>
      </div>

      {/* Linear gauge indicator */}
      <div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}80`,
            }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default GaugeCard;

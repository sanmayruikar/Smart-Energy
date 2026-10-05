import React from 'react';

const colorStyles = {
  indigo: {
    bg: 'from-indigo-500/10 to-indigo-500/5',
    border: 'border-indigo-500/30',
    iconBg: 'bg-indigo-500/20 text-indigo-400',
    valueColor: 'text-indigo-200',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    valueColor: 'text-emerald-200',
  },
  amber: {
    bg: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/20 text-amber-400',
    valueColor: 'text-amber-200',
  },
  rose: {
    bg: 'from-rose-500/10 to-rose-500/5',
    border: 'border-rose-500/30',
    iconBg: 'bg-rose-500/20 text-rose-400',
    valueColor: 'text-rose-200',
  },
  cyan: {
    bg: 'from-cyan-500/10 to-cyan-500/5',
    border: 'border-cyan-500/30',
    iconBg: 'bg-cyan-500/20 text-cyan-400',
    valueColor: 'text-cyan-200',
  },
};

const StatCard = ({
  title,
  value,
  unit,
  icon: Icon,
  subtitle,
  color = 'indigo',
  badge,
}) => {
  const style = colorStyles[color] || colorStyles.indigo;

  return (
    <div
      className={`relative p-5 rounded-2xl bg-gradient-to-b ${style.bg} border ${style.border} backdrop-blur-md shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className={`text-2xl font-bold font-mono tracking-tight ${style.valueColor}`}>
              {value}
            </span>
            {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
          </div>
        </div>

        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg} shadow-inner`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>

      {(subtitle || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>{subtitle}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-md font-medium text-[11px] bg-slate-800 border border-slate-700 text-slate-300">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;

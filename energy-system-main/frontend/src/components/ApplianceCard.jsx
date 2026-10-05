import React from 'react';
import { Power, Zap, Clock, IndianRupee, Lightbulb, Wind, Cog, Flame } from 'lucide-react';
import { formatCurrency, formatEnergy, formatPower } from '../utils/formatters';

const getApplianceIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'light':
      return Lightbulb;
    case 'fan':
      return Wind;
    case 'motor':
      return Cog;
    case 'bulb':
      return Flame;
    default:
      return Zap;
  }
};

const ApplianceCard = ({ appliance, onToggle, loading }) => {
  const Icon = getApplianceIcon(appliance.type);
  const isOn = appliance.status === 'ON';

  return (
    <div
      className={`relative p-5 rounded-2xl border transition-all duration-200 backdrop-blur-md ${
        isOn
          ? 'bg-gradient-to-b from-indigo-950/40 to-slate-900/90 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
              isOn
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 text-sm">{appliance.name}</h4>
            <span className="text-[11px] font-mono text-slate-400">
              Pin {appliance.relayPin || 0} • Rated {appliance.powerRating}W
            </span>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => onToggle(appliance._id, appliance.status === 'ON' ? 'OFF' : 'ON')}
          disabled={loading}
          className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            isOn ? 'bg-indigo-600' : 'bg-slate-700'
          }`}
          title={isOn ? 'Switch OFF' : 'Switch ON'}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              isOn ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Real-time Status Badge */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-slate-400">State:</span>
        <span
          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] tracking-wide font-mono ${
            isOn
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {isOn ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}
        </span>
      </div>

      {/* Key Metrics Grid */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
          <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Active Power</span>
          </div>
          <p className="mt-1 font-mono font-bold text-slate-200">
            {formatPower(appliance.currentPower || (isOn ? appliance.powerRating : 0))}
          </p>
        </div>

        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
          <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Runtime</span>
          </div>
          <p className="mt-1 font-mono font-bold text-slate-200">
            {(appliance.runtimeHours || 0).toFixed(1)} hrs
          </p>
        </div>

        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
          <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Total Energy</span>
          </div>
          <p className="mt-1 font-mono font-bold text-slate-200">
            {formatEnergy(appliance.totalEnergy || 0)}
          </p>
        </div>

        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
          <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
            <IndianRupee className="w-3 h-3 text-rose-400" />
            <span>Accrued Cost</span>
          </div>
          <p className="mt-1 font-mono font-bold text-slate-200">
            {formatCurrency(appliance.totalCost || 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApplianceCard;

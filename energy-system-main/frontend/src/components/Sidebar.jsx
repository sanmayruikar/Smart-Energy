import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Zap,
  BarChart3,
  Database,
  BrainCircuit,
  AlertTriangle,
  Bot,
  Bell,
  FileSpreadsheet,
  Settings,
  Cpu,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Live Monitoring', path: '/live', icon: Activity },
  { name: 'Appliances', path: '/appliances', icon: Zap },
  { name: 'Energy Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Historical Data', path: '/history', icon: Database },
  { name: 'ML Predictions', path: '/predictions', icon: BrainCircuit },
  { name: 'Anomaly Detection', path: '/anomalies', icon: AlertTriangle },
  { name: 'AI Energy Assistant', path: '/ai-assistant', icon: Bot },
  { name: 'Alerts', path: '/alerts', icon: Bell, badge: true },
  { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = () => {
  const { unreadAlerts, systemMode } = useSystem();
  const isHardware = systemMode === 'LIVE HARDWARE MODE';

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen sticky top-0 backdrop-blur-md z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base text-slate-100 leading-tight">Smart Energy</h1>
          <p className="text-xs text-indigo-400 font-medium tracking-wide">IoT • ML • AI System</p>
        </div>
      </div>

      {/* Mode Indicator Banner */}
      <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
        <div className="flex items-center space-x-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isHardware ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
            }`}
          />
          <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">
            {systemMode}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && unreadAlerts > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                  {unreadAlerts}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Project Attribution */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-center">
        <p className="text-[11px] text-slate-400 font-medium">Final-Year Engineering Project</p>
        <p className="text-[10px] text-slate-500">ESP32 + PZEM-017 + ML</p>
      </div>
    </aside>
  );
};

export default Sidebar;

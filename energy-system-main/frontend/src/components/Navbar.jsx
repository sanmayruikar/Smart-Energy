import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Wifi, WifiOff, IndianRupee, ShieldCheck, LogOut } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useSystem } from '../context/SystemContext';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/': 'System Overview & Live Dashboard',
  '/live': 'Real-Time Hardware Telemetry Stream',
  '/appliances': 'Appliance Load Management & Relays',
  '/analytics': 'Comprehensive Energy Analytics',
  '/history': 'Historical Sensor Telemetry Logs',
  '/predictions': 'Machine Learning Consumption Forecasting',
  '/anomalies': 'Isolation Forest Anomaly Detection',
  '/ai-assistant': 'AI Energy Conservation Assistant',
  '/alerts': 'System Warnings & Threshold Alerts',
  '/reports': 'Audit Reports & CSV Data Export',
  '/settings': 'System Parameters & Calibration',
};

const Navbar = () => {
  const location = useLocation();
  const { isConnected } = useSocket();
  const { systemMode, tariff, unreadAlerts, dbStatus } = useSystem();
  const { user, logout } = useAuth();

  const title = pageTitles[location.pathname] || 'Smart Energy System';
  const isHardware = systemMode === 'LIVE HARDWARE MODE';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title */}
      <div>
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        {/* Database Status Badge */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono border transition-all ${
            dbStatus?.status === 'connected'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
          title={
            dbStatus?.status === 'connected'
              ? `Database: Connected (${dbStatus.databaseMode})`
              : 'Database: Disconnected (Active Fallback: Demo In-Memory Store)'
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dbStatus?.status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span>
            {dbStatus?.status === 'connected'
              ? `DB: CONNECTED (${dbStatus.databaseMode})`
              : 'DB: DEMO (IN-MEMORY)'}
          </span>
        </div>

        {/* Mode Badge */}
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            isHardware
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isHardware ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'
            }`}
          />
          <span>{systemMode}</span>
        </div>

        {/* WebSocket Connection Status */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${
            isConnected
              ? 'bg-slate-800/80 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-950/40 text-rose-400 border-rose-800/40'
          }`}
          title={isConnected ? 'Real-Time WebSocket Connected' : 'Disconnected from WebSocket'}
        >
          {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isConnected ? 'WS LIVE' : 'WS OFFLINE'}</span>
        </div>

        {/* Electricity Tariff Chip */}
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-amber-300">
          <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
          <span>{tariff.toFixed(2)}/kWh</span>
        </div>

        {/* Alerts Button */}
        <Link
          to="/alerts"
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          title="System Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </span>
          )}
        </Link>

        {/* User Info / Logout */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-semibold text-indigo-300">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

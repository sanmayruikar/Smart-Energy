import React from 'react';
import {
  Activity,
  Zap,
  Gauge,
  Thermometer,
  Radio,
  Clock,
  Wifi,
  Cpu,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useSocket } from '../context/SocketContext';
import { useSystem } from '../context/SystemContext';
import GaugeCard from '../components/GaugeCard';
import { formatDateTime } from '../utils/formatters';

const LiveMonitoring = () => {
  const { latestData, telemetryHistory, isConnected } = useSocket();
  const { systemMode, settings } = useSystem();

  const voltage = latestData?.voltage ?? 12.4;
  const current = latestData?.current ?? 1.8;
  const power = latestData?.power ?? 230.0;
  const energy = latestData?.energy ?? 125.4;
  const temperature = latestData?.temperature ?? 29.5;
  const timestamp = latestData?.timestamp ?? new Date();
  const activeAppliances = latestData?.activeAppliances ?? ['LED Light', 'Ceiling Fan'];

  return (
    <div className="space-y-6">
      {/* Telemetry Status Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Radio className="w-8 h-8 text-indigo-400" />
            <span
              className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-100 text-sm">IoT Telemetry Node:</h3>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                {latestData?.deviceId || settings.deviceId || 'ESP32-PZEM-01'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Protocol: Modbus RTU / RS485 &bull; Transmit Interval: 3.0 seconds
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300 flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date(timestamp).toLocaleTimeString()}</span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg border font-semibold ${
              systemMode === 'LIVE HARDWARE MODE'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
            }`}
          >
            {systemMode}
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>{isConnected ? 'ONLINE' : 'DISCONNECTED'}</span>
          </div>
        </div>
      </div>

      {/* Real-time Visual Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GaugeCard
          title="Line Voltage"
          value={voltage}
          unit="V"
          min={0}
          max={voltage > 50 ? 260 : 20}
          color="#38bdf8"
          status={voltage >= 11.5 && voltage <= 13.5 ? 'NOMINAL 12V' : 'ACTIVE'}
        />

        <GaugeCard
          title="Load Current"
          value={current}
          unit="A"
          min={0}
          max={10}
          color="#a855f7"
          status={current < 5 ? 'NORMAL' : 'HIGH LOAD'}
        />

        <GaugeCard
          title="Active Power"
          value={power}
          unit="W"
          min={0}
          max={1800}
          color="#f59e0b"
          status={power > settings.powerThreshold ? 'OVERLOAD' : 'NORMAL'}
        />

        <GaugeCard
          title="Module Temperature"
          value={temperature}
          unit="°C"
          min={0}
          max={65}
          color="#ef4444"
          status={temperature > settings.temperatureThreshold ? 'THERMAL ALERT' : 'OPTIMAL'}
        />
      </div>

      {/* Multi-Parameter Live Telemetry Line Chart */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Live Multi-Variable Telemetry Buffer</h3>
            <p className="text-xs text-slate-400">Sliding window of consecutive measurements</p>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-3 text-xs font-mono text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Power (W)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Voltage (V)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>Current (A)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={telemetryHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={10} unit="W" />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="power"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="Power (W)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="voltage"
                stroke="#38bdf8"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="Voltage (V)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="current"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="Current (A)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Appliances on the Bus */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <h4 className="text-sm font-semibold text-slate-100 mb-3 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Active Circuit Loads Contributed to Telemetry</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {activeAppliances.length > 0 ? (
            activeAppliances.map((app, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs font-medium flex items-center space-x-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{app}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">Standby baseload only (No major appliances ON)</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;

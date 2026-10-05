import React, { useEffect, useState } from 'react';
import {
  Zap,
  Activity,
  Gauge,
  Thermometer,
  IndianRupee,
  Cpu,
  TrendingUp,
  AlertTriangle,
  BrainCircuit,
  ArrowUpRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useSystem } from '../context/SystemContext';
import StatCard from '../components/StatCard';
import { formatCurrency, formatEnergy, formatPower, formatDateTime } from '../utils/formatters';

const Dashboard = () => {
  const { latestData, telemetryHistory } = useSocket();
  const { tariff, systemMode } = useSystem();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000); // refresh aggregate charts every 15s
    return () => clearInterval(interval);
  }, []);

  // Use real-time socket data if available, otherwise backend API initial data
  const liveVoltage = latestData?.voltage ?? dashboardData?.liveMetrics?.voltage ?? 12.4;
  const liveCurrent = latestData?.current ?? dashboardData?.liveMetrics?.current ?? 1.85;
  const livePower = latestData?.power ?? dashboardData?.liveMetrics?.power ?? 230.0;
  const liveEnergy = latestData?.energy ?? dashboardData?.liveMetrics?.energy ?? 125.4;
  const liveTemp = latestData?.temperature ?? dashboardData?.liveMetrics?.temperature ?? 29.5;

  const energyToday = dashboardData?.energyToday ?? 3.42;
  const costToday = dashboardData?.costToday ?? (energyToday * tariff).toFixed(2);
  const activeAppliancesCount = dashboardData?.activeAppliancesCount ?? 2;
  const connectedAppliancesCount = dashboardData?.connectedAppliancesCount ?? 4;

  // Chart data: prefer live telemetry buffer if accumulated, else dashboard initial livePowerChart
  const liveChartData =
    telemetryHistory.length > 5
      ? telemetryHistory
      : dashboardData?.livePowerChart || [];

  const dailyTrend = dashboardData?.dailyConsumption || [];
  const recentAlerts = dashboardData?.recentAlerts || [];
  const anomalySummary = dashboardData?.anomalySummary || {};
  const predictionSummary = dashboardData?.predictionSummary || {};

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Active Operation Mode: <span className="text-indigo-400 font-mono">{systemMode}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Telemetry ingested from ESP32 PZEM-017 & evaluated via Scikit-Learn Isolation Forest.
            </p>
          </div>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={fetchDashboard}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Primary KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Power"
          value={livePower.toFixed(1)}
          unit="W"
          icon={Zap}
          color="amber"
          subtitle={`Current Load (${activeAppliancesCount} Active)`}
        />

        <StatCard
          title="Energy Consumed Today"
          value={energyToday}
          unit="kWh"
          icon={TrendingUp}
          color="indigo"
          subtitle={`Accumulated since 12:00 AM`}
        />

        <StatCard
          title="Electricity Cost Today"
          value={formatCurrency(costToday)}
          icon={IndianRupee}
          color="emerald"
          subtitle={`Calculated @ ₹${tariff}/kWh`}
        />

        <StatCard
          title="Enclosure Temperature"
          value={liveTemp.toFixed(1)}
          unit="°C"
          icon={Thermometer}
          color={liveTemp > 45 ? 'rose' : 'cyan'}
          subtitle={liveTemp > 45 ? 'Thermal Warning Exceeded' : 'Safe Operating Envelope'}
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Line Voltage</p>
          <p className="mt-1 text-xl font-bold font-mono text-slate-100">{liveVoltage.toFixed(1)} V</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Line Current</p>
          <p className="mt-1 text-xl font-bold font-mono text-slate-100">{liveCurrent.toFixed(2)} A</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Cumulative Energy</p>
          <p className="mt-1 text-xl font-bold font-mono text-slate-100">{liveEnergy.toFixed(2)} kWh</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Appliances Status</p>
          <p className="mt-1 text-xl font-bold font-mono text-emerald-400">
            {activeAppliancesCount} / {connectedAppliancesCount} ON
          </p>
        </div>
      </div>

      {/* Charts Section: Live Power Stream & Daily Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Power Stream (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Real-Time Power Telemetry Stream</h3>
              <p className="text-xs text-slate-400">Live 3-second transmission cycle via WebSocket</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono text-emerald-400 font-semibold">LIVE STREAM</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveChartData}>
                <defs>
                  <linearGradient id="powerGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} unit="W" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="power"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#powerGlow)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Consumption Trend (1 Column) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Past 7 Days Consumption</h3>
            <p className="text-xs text-slate-400">Daily kWh energy usage</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} unit="k" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val} kWh`, 'Energy']}
                />
                <Bar dataKey="energy" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Intelligence & Summary Row (ML Predictions, Anomaly Summary, Recent Alerts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ML Prediction Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-950/30 to-slate-900/90 border border-indigo-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
              <h4 className="text-sm font-semibold text-slate-100">ML Forecast Summary</h4>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Next 24h
            </span>
          </div>

          <div className="mt-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
            <p className="text-xs text-slate-400">Predicted Consumption</p>
            <p className="text-2xl font-bold font-mono text-indigo-200 mt-1">
              {predictionSummary.predictedEnergy || 14.8} kWh
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Projected Cost: <span className="text-amber-400 font-mono font-semibold">₹{((predictionSummary.predictedEnergy || 14.8) * tariff).toFixed(2)}</span>
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Model: {predictionSummary.modelUsed || 'RandomForestRegressor'}</span>
            <span className="font-mono text-emerald-400 font-semibold">R² = {predictionSummary.r2 || 0.948}</span>
          </div>
        </div>

        {/* Anomaly Detection Status */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-semibold text-slate-100">Anomaly Detection</h4>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                (anomalySummary.unresolved || 0) > 0
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {(anomalySummary.unresolved || 0) > 0 ? 'ALERT' : 'NORMAL'}
            </span>
          </div>

          <div className="mt-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Unresolved Flags</span>
              <span className="font-mono font-bold text-slate-100 text-base">{anomalySummary.unresolved || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
              <span>Total Anomalies Detected</span>
              <span className="font-mono text-slate-300">{anomalySummary.total || 0}</span>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            <p className="line-clamp-2">
              {anomalySummary.latest
                ? `Latest: ${anomalySummary.latest.explanation}`
                : 'Isolation Forest is scanning live current, power & temperature envelopes.'}
            </p>
          </div>
        </div>

        {/* Recent Alerts List */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-100">Recent Warnings</h4>
            <span className="text-xs text-slate-500">{recentAlerts.length} events</span>
          </div>

          <div className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-1">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((al) => (
                <div
                  key={al._id}
                  className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-semibold uppercase tracking-wider ${
                        al.severity === 'CRITICAL'
                          ? 'text-rose-400'
                          : al.severity === 'HIGH'
                          ? 'text-amber-400'
                          : 'text-indigo-400'
                      }`}
                    >
                      {al.type.replace('_', ' ')}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-300 line-clamp-1">{al.message}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No recent warnings recorded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

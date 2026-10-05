import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  IndianRupee,
  Zap,
  Clock,
  TrendingDown,
  TrendingUp,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import api from '../services/api';
import { useSystem } from '../context/SystemContext';
import { formatCurrency, formatEnergy, formatPower } from '../utils/formatters';

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6'];

const EnergyAnalytics = () => {
  const { tariff } = useSystem();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('hourly'); // 'hourly' | 'daily' | 'appliance'

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const res = await api.get(`/analytics?${queryParams.toString()}`);
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const summary = analytics?.summary || {
    minConsumption: 85,
    maxConsumption: 1680,
    averageConsumption: 420.5,
    totalConsumption: 70.6,
    estimatedCost: 564.8,
    peakConsumptionTime: 'Today, 08:30 PM',
  };

  const hourlyData = analytics?.hourly || [];
  const dailyData = analytics?.daily || [];
  const applianceData = analytics?.applianceBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Date Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Energy Analytics Engine</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate diurnal cycles, load distribution, and appliance-wise expenditure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition flex items-center space-x-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Apply Filter</span>
          </button>
        </div>
      </div>

      {/* Key Analytical Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Energy</span>
          <p className="mt-1 text-lg font-bold font-mono text-indigo-300">
            {formatEnergy(summary.totalConsumption)}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Calculated Cost</span>
          <p className="mt-1 text-lg font-bold font-mono text-emerald-300">
            {formatCurrency(summary.estimatedCost)}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Average Power</span>
          <p className="mt-1 text-lg font-bold font-mono text-slate-200">
            {formatPower(summary.averageConsumption)}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Peak Demand (Max)</span>
          <p className="mt-1 text-lg font-bold font-mono text-rose-400">
            {formatPower(summary.maxConsumption)}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Min Baseload</span>
          <p className="mt-1 text-lg font-bold font-mono text-cyan-400">
            {formatPower(summary.minConsumption)}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Peak Time</span>
          <p className="mt-1 text-xs font-bold font-mono text-amber-300 truncate">
            {summary.peakConsumptionTime}
          </p>
        </div>
      </div>

      {/* Analytics Tabs Selector */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('hourly')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'hourly'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Hourly Diurnal Profile (24h)
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'daily'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Daily Trends & Cost
        </button>
        <button
          onClick={() => setActiveTab('appliance')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'appliance'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Appliance-Wise Share
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'hourly' && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <h4 className="text-sm font-semibold text-slate-200 mb-4">
            Hourly Load Profile (Watts over 24 Hours)
          </h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="hourlyGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="W" />
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
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="url(#hourlyGlow)"
                  name="Average Power (W)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'daily' && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <h4 className="text-sm font-semibold text-slate-200 mb-4">
            Daily Consumption (kWh) and Accrued Cost (₹)
          </h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={11} unit="kWh" />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} unit="₹" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="energy" fill="#6366f1" name="Energy (kWh)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="cost" fill="#10b981" name="Cost (₹)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'appliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart (1 Col) */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col justify-between">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Appliance Energy Distribution</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={applianceData}
                    dataKey="energy"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    labelLine={false}
                  >
                    {applianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val} kWh`, 'Energy']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Table (2 Cols) */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md overflow-x-auto">
            <h4 className="text-sm font-semibold text-slate-200 mb-4">Appliance Expenditure Breakdown</h4>
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3">Appliance</th>
                  <th className="pb-3">Rated Power</th>
                  <th className="pb-3">Runtime</th>
                  <th className="pb-3">Total Energy</th>
                  <th className="pb-3">Calculated Cost</th>
                  <th className="pb-3">Load Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {applianceData.map((app, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-3 font-sans font-medium text-slate-100">{app.name}</td>
                    <td className="py-3">{app.powerRating} W</td>
                    <td className="py-3">{app.runtimeHours} hrs</td>
                    <td className="py-3 text-indigo-300 font-bold">{app.energy} kWh</td>
                    <td className="py-3 text-emerald-400 font-bold">₹{app.cost}</td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-10">{app.percentage}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${app.percentage}%`,
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnergyAnalytics;

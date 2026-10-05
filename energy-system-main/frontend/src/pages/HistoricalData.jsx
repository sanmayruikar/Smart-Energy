import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Calendar,
} from 'lucide-react';
import api from '../services/api';
import { exportToCSV } from '../utils/exportUtils';
import { formatDateTime } from '../utils/formatters';

const HistoricalData = () => {
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      });

      if (search) params.append('search', search);
      if (mode !== 'ALL') params.append('mode', mode);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/energy/history?${params.toString()}`);
      if (res.success) {
        setReadings(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, [mode, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory(1);
  };

  const handleExport = () => {
    const formatted = readings.map((r) => ({
      Timestamp: new Date(r.timestamp).toISOString(),
      Device: r.deviceId,
      Mode: r.mode,
      Voltage_V: r.voltage,
      Current_A: r.current,
      Power_W: r.power,
      Energy_kWh: r.energy,
      Temperature_C: r.temperature,
      ActiveAppliances: (r.activeAppliances || []).join('; '),
    }));
    exportToCSV(formatted, `smart-energy-telemetry-${Date.now()}.csv`);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Historical Sensor Telemetry Database</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified records with timestamped voltage, current, power, and active load envelopes.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by device ID or appliance..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </form>

          {/* Mode Selector */}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Modes</option>
            <option value="HARDWARE">Live Hardware Only</option>
            <option value="SIMULATION">Simulation Only</option>
          </select>

          {/* Date Picker Range */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-700">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-200 text-[11px] focus:outline-none"
            />
            <span className="text-slate-500 text-[11px]">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-200 text-[11px] focus:outline-none"
            />
          </div>

          {/* Apply Button */}
          <button
            onClick={() => fetchHistory(1)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Historical Telemetry Table */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
            <tr>
              <th className="pb-3 cursor-pointer select-none" onClick={() => toggleSort('timestamp')}>
                <div className="flex items-center space-x-1">
                  <span>Timestamp</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="pb-3">Device Node</th>
              <th className="pb-3">Active Loads</th>
              <th className="pb-3 cursor-pointer select-none" onClick={() => toggleSort('voltage')}>
                <div className="flex items-center space-x-1">
                  <span>Voltage (V)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="pb-3 cursor-pointer select-none" onClick={() => toggleSort('current')}>
                <div className="flex items-center space-x-1">
                  <span>Current (A)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="pb-3 cursor-pointer select-none" onClick={() => toggleSort('power')}>
                <div className="flex items-center space-x-1">
                  <span>Power (W)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="pb-3">Energy (kWh)</th>
              <th className="pb-3">Temp (°C)</th>
              <th className="pb-3">Mode</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  Loading telemetry records...
                </td>
              </tr>
            ) : readings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  No telemetry records found matching your filters.
                </td>
              </tr>
            ) : (
              readings.map((r) => (
                <tr key={r._id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 text-slate-400 font-sans">
                    {new Date(r.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                  </td>
                  <td className="py-3 font-sans font-semibold text-slate-200">{r.deviceId}</td>
                  <td className="py-3 font-sans text-indigo-300 max-w-xs truncate">
                    {r.activeAppliances && r.activeAppliances.length > 0
                      ? r.activeAppliances.join(', ')
                      : 'Standby'}
                  </td>
                  <td className="py-3 text-slate-100 font-bold">{r.voltage.toFixed(1)}</td>
                  <td className="py-3 text-slate-100 font-bold">{r.current.toFixed(2)}</td>
                  <td className="py-3 font-bold text-amber-400">{r.power.toFixed(1)}</td>
                  <td className="py-3 text-indigo-300 font-bold">{r.energy.toFixed(3)}</td>
                  <td className="py-3">
                    <span className={r.temperature > 45 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {r.temperature.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                        r.mode === 'HARDWARE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      {r.mode}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="text-slate-200 font-bold">{readings.length}</span> of{' '}
            <span className="text-slate-200 font-bold">{pagination.total}</span> total entries
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchHistory(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <button
              onClick={() => fetchHistory(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalData;

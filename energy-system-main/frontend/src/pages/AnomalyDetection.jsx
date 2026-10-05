import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  CheckCircle,
  Clock,
  Filter,
  Flame,
  Zap,
  Activity,
} from 'lucide-react';
import api from '../services/api';
import { getSeverityBadgeClass, formatDateTime } from '../utils/formatters';

const AnomalyDetection = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState({ total: 0, unresolved: 0, critical: 0, status: 'Normal' });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const url = severityFilter === 'ALL' ? '/anomalies' : `/anomalies?severity=${severityFilter}`;
      const res = await api.get(url);
      if (res.success) {
        setAnomalies(res.data);
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to fetch anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [severityFilter]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await api.post('/anomalies/scan');
      if (res.success) {
        alert(res.message);
        fetchAnomalies();
      }
    } catch (err) {
      alert(`Scan error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      const res = await api.put(`/anomalies/${id}/resolve`);
      if (res.success) {
        setAnomalies((prev) =>
          prev.map((a) => (a._id === id ? { ...a, isResolved: true } : a))
        );
        setStats((prev) => ({
          ...prev,
          unresolved: Math.max(0, prev.unresolved - 1),
        }));
      }
    } catch (err) {
      alert(`Error resolving anomaly: ${err.message}`);
    }
  };

  const isAnomalyPresent = stats.unresolved > 0;

  return (
    <div className="space-y-6">
      {/* Header and System Status Hero */}
      <div
        className={`p-6 rounded-2xl border backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all ${
          isAnomalyPresent
            ? 'bg-rose-950/20 border-rose-500/30 shadow-lg shadow-rose-950/20'
            : 'bg-emerald-950/20 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
        }`}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isAnomalyPresent
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {isAnomalyPresent ? (
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-100">
                Isolation Forest Anomaly Status:
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tracking-wider ${
                  isAnomalyPresent
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {isAnomalyPresent ? 'ANOMALY DETECTED' : 'NORMAL ENVELOPE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Unsupervised multi-variable outlier detection tracking power spikes, thermal anomalies, and duty cycles.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Evaluating Live Buffer...' : 'Trigger Model Scan'}</span>
          </button>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Unresolved Flags</p>
          <p className="mt-1 text-2xl font-bold font-mono text-rose-400">{stats.unresolved}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Critical Severity</p>
          <p className="mt-1 text-2xl font-bold font-mono text-amber-400">{stats.critical}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total Identified</p>
          <p className="mt-1 text-2xl font-bold font-mono text-slate-200">{stats.total}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Model Algorithm</p>
          <p className="mt-1 text-sm font-bold font-mono text-indigo-300">Isolation Forest (Scikit-Learn)</p>
        </div>
      </div>

      {/* Filter and Anomaly Log */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-100">Anomaly Diagnostic Log</h4>
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>
          </div>
        </div>

        {/* Anomaly Cards List */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-8">Loading anomaly records...</p>
          ) : anomalies.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              No anomalies detected. All operations remain within safe mathematical thresholds.
            </div>
          ) : (
            anomalies.map((item) => (
              <div
                key={item._id}
                className={`p-4 rounded-xl border transition-all ${
                  item.isResolved
                    ? 'bg-slate-950/40 border-slate-800 opacity-60'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-mono ${getSeverityBadgeClass(
                        item.severity
                      )}`}
                    >
                      {item.severity}
                    </span>

                    <div>
                      <h5 className="font-semibold text-slate-200 text-sm">
                        {item.appliance} &bull;{' '}
                        <span className="text-indigo-400 font-mono text-xs">{item.metric?.toUpperCase()} FAULT</span>
                      </h5>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Logged: {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    {item.isResolved ? (
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Resolved</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleResolve(item._id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-400 text-slate-300 border border-slate-700 text-xs font-semibold transition"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-300 leading-relaxed">{item.explanation}</p>

                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px]">Actual Value:</span>
                    <p className="font-bold text-rose-400">{item.actualValue} {item.metric === 'power' ? 'W' : (item.metric === 'temperature' ? '°C' : 'V')}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Expected Envelope:</span>
                    <p className="text-slate-300">
                      {item.expectedRange?.min} – {item.expectedRange?.max} {item.metric === 'power' ? 'W' : (item.metric === 'temperature' ? '°C' : 'V')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Device Node:</span>
                    <p className="text-slate-300">{item.deviceId || 'ESP32-PZEM-01'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetection;

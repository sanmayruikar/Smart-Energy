import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Filter,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  Thermometer,
  Zap,
} from 'lucide-react';
import api from '../services/api';
import { useSystem } from '../context/SystemContext';
import { getSeverityBadgeClass, formatDateTime } from '../utils/formatters';

const Alerts = () => {
  const { setUnreadAlerts } = useSystem();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (severityFilter !== 'ALL') params.append('severity', severityFilter);
      if (statusFilter !== 'ALL') params.append('isRead', statusFilter === 'READ' ? 'true' : 'false');

      const res = await api.get(`/alerts?${params.toString()}`);
      if (res.success) {
        setAlerts(res.data);
        setUnreadAlerts(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.put(`/alerts/${id}/read`);
      if (res.success) {
        setAlerts((prev) =>
          prev.map((al) => (al._id === id ? { ...al, isRead: true } : al))
        );
        setUnreadAlerts((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      alert(`Error updating alert: ${err.message}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/alerts/read-all');
      if (res.success) {
        setAlerts((prev) => prev.map((al) => ({ ...al, isRead: true })));
        setUnreadAlerts(0);
      }
    } catch (err) {
      alert(`Error updating alerts: ${err.message}`);
    }
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-100">System Warnings & Alerts</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time threshold triggers for power surges, thermal limits, and anomalous behavior.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Filters:</span>
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="UNREAD">Unread Only</option>
          <option value="READ">Read Only</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-slate-500 text-center py-12">Loading system alerts...</p>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            No alerts found matching your criteria.
          </div>
        ) : (
          alerts.map((al) => (
            <div
              key={al._id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                al.isRead
                  ? 'bg-slate-950/40 border-slate-800 opacity-65'
                  : 'bg-slate-950/80 border-slate-800 shadow-md hover:border-slate-700'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span
                  className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 uppercase tracking-wider ${getSeverityBadgeClass(
                    al.severity
                  )}`}
                >
                  {al.severity}
                </span>

                <div>
                  <div className="flex items-center space-x-2">
                    <h5 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                      {al.type.replace(/_/g, ' ')}
                    </h5>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(al.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">{al.message}</p>
                </div>
              </div>

              {!al.isRead && (
                <button
                  onClick={() => handleMarkAsRead(al._id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold self-end sm:self-auto transition shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;

import React, { useEffect, useState } from 'react';
import { Plus, Zap, Power, RefreshCw, X, AlertCircle } from 'lucide-react';
import api from '../services/api';
import ApplianceCard from '../components/ApplianceCard';
import { useSocket } from '../context/SocketContext';

const Appliances = () => {
  const { socket } = useSocket();
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New appliance form state
  const [newApp, setNewApp] = useState({
    name: '',
    type: 'light',
    relayPin: 13,
    powerRating: 60,
  });

  const fetchAppliances = async () => {
    try {
      const res = await api.get('/appliances');
      if (res.success && res.data) {
        setAppliances(res.data);
      }
    } catch (err) {
      console.error('Failed to load appliances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppliances();

    if (socket) {
      socket.on('appliance_status_change', (updated) => {
        setAppliances((prev) =>
          prev.map((app) =>
            app._id === updated.id
              ? { ...app, status: updated.status, currentPower: updated.currentPower }
              : app
          )
        );
      });
      socket.on('appliance_added', (added) => {
        setAppliances((prev) => [...prev, added]);
      });
      socket.on('appliance_deleted', (id) => {
        setAppliances((prev) => prev.filter((a) => a._id !== id));
      });
    }

    return () => {
      if (socket) {
        socket.off('appliance_status_change');
        socket.off('appliance_added');
        socket.off('appliance_deleted');
      }
    };
  }, [socket]);

  const handleToggle = async (id, newStatus) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/appliances/${id}/control`, { status: newStatus });
      if (res.success && res.data) {
        setAppliances((prev) =>
          prev.map((a) => (a._id === id ? res.data : a))
        );
      }
    } catch (err) {
      alert(`Error toggling appliance: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAppliance = async (e) => {
    e.preventDefault();
    if (!newApp.name) return;

    try {
      const res = await api.post('/appliances', newApp);
      if (res.success && res.data) {
        setAppliances((prev) => [...prev, res.data]);
        setShowAddModal(false);
        setNewApp({ name: '', type: 'light', relayPin: 13, powerRating: 60 });
      }
    } catch (err) {
      alert(`Error adding appliance: ${err.message}`);
    }
  };

  const totalConnectedWatts = appliances.reduce((sum, a) => sum + (a.powerRating || 0), 0);
  const activeWatts = appliances
    .filter((a) => a.status === 'ON')
    .reduce((sum, a) => sum + (a.currentPower || a.powerRating || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Appliance Load Management</h3>
          <p className="text-xs text-slate-400 mt-1">
            Actuate physical relays on ESP32 or simulated loads in real-time.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAppliances}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh Appliances"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Appliance</span>
          </button>
        </div>
      </div>

      {/* Load Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Connected Loads</p>
          <p className="mt-1 text-2xl font-bold font-mono text-slate-100">{appliances.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Total registered devices</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Currently Active Load</p>
          <p className="mt-1 text-2xl font-bold font-mono text-amber-400">{activeWatts.toFixed(1)} W</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {appliances.filter((a) => a.status === 'ON').length} appliances drawing power
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total Connected Capacity</p>
          <p className="mt-1 text-2xl font-bold font-mono text-indigo-400">{totalConnectedWatts} W</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Max concurrent theoretical draw</p>
        </div>
      </div>

      {/* Appliances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {appliances.map((appliance) => (
          <ApplianceCard
            key={appliance._id}
            appliance={appliance}
            onToggle={handleToggle}
            loading={actionLoading}
          />
        ))}
      </div>

      {/* Add Appliance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-100">Register New Appliance</h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppliance} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Appliance Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AC, Water Heater, Smart Lamp"
                  value={newApp.name}
                  onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Type</label>
                  <select
                    value={newApp.type}
                    onChange={(e) => setNewApp({ ...newApp, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="light">Light</option>
                    <option value="fan">Fan</option>
                    <option value="motor">Motor</option>
                    <option value="bulb">Bulb</option>
                    <option value="ac">Air Conditioner</option>
                    <option value="heater">Heater</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Rated Power (Watts)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="5000"
                    value={newApp.powerRating}
                    onChange={(e) => setNewApp({ ...newApp, powerRating: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ESP32 GPIO Relay Pin</label>
                <input
                  type="number"
                  min="0"
                  max="39"
                  value={newApp.relayPin}
                  onChange={(e) => setNewApp({ ...newApp, relayPin: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 font-semibold"
                >
                  Save Appliance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appliances;

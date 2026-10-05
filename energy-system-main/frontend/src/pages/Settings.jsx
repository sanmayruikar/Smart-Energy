import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle,
  IndianRupee,
  Zap,
  Thermometer,
  Cpu,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';

const Settings = () => {
  const { settings, updateSettings, refreshSettings } = useSystem();
  const [formData, setFormData] = useState({
    electricityTariff: 8.0,
    powerThreshold: 1500,
    temperatureThreshold: 45.0,
    anomalySensitivity: 'MEDIUM',
    simulationMode: true,
    deviceId: 'ESP32-PZEM-01',
    samplingIntervalSeconds: 3,
    notifyEmail: 'admin@smartenergy.local',
    alertNotificationsEnabled: true,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        electricityTariff: settings.electricityTariff || 8.0,
        powerThreshold: settings.powerThreshold || 1500,
        temperatureThreshold: settings.temperatureThreshold || 45.0,
        anomalySensitivity: settings.anomalySensitivity || 'MEDIUM',
        simulationMode: settings.simulationMode ?? true,
        deviceId: settings.deviceId || 'ESP32-PZEM-01',
        samplingIntervalSeconds: settings.samplingIntervalSeconds || 3,
        notifyEmail: settings.notifyEmail || 'admin@smartenergy.local',
        alertNotificationsEnabled: settings.alertNotificationsEnabled ?? true,
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await updateSettings({
        ...formData,
        electricityTariff: parseFloat(formData.electricityTariff),
        powerThreshold: parseFloat(formData.powerThreshold),
        temperatureThreshold: parseFloat(formData.temperatureThreshold),
      });

      if (res.success) {
        setSaved(true);
        refreshSettings();
        setTimeout(() => setSaved(false), 3500);
      } else {
        alert(`Failed to save settings: ${res.message}`);
      }
    } catch (err) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-100">System Settings & Calibration</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure tariff formulas, threshold limits, telemetry simulation, and IoT hardware bindings.
          </p>
        </div>

        {saved && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tariff & Electrical Thresholds */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
          <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <IndianRupee className="w-4 h-4 text-amber-400" />
            <span>Tariff & Electrical Safety Thresholds</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Electricity Tariff (₹ per kWh)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="50"
                value={formData.electricityTariff}
                onChange={(e) => setFormData({ ...formData, electricityTariff: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Standard Indian grid rate: ₹8.00</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Power Surge Threshold (Watts)</label>
              <input
                type="number"
                min="100"
                max="10000"
                value={formData.powerThreshold}
                onChange={(e) => setFormData({ ...formData, powerThreshold: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Triggers Overload Alert (Default: 1500W)</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Temperature Cutoff (°C)</label>
              <input
                type="number"
                step="0.5"
                min="30"
                max="85"
                value={formData.temperatureThreshold}
                onChange={(e) => setFormData({ ...formData, temperatureThreshold: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Safety limit for electronics (Default: 45°C)</span>
            </div>
          </div>
        </div>

        {/* Machine Learning & Simulation Mode */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
          <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Operational Mode & ML Sensitivity</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Simulation Mode Toggle */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Simulation / Demo Mode</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Generate realistic telemetry when ESP32 hardware is disconnected.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.simulationMode}
                onChange={(e) => setFormData({ ...formData, simulationMode: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Anomaly Detection Sensitivity */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Isolation Forest Sensitivity</label>
              <select
                value={formData.anomalySensitivity}
                onChange={(e) => setFormData({ ...formData, anomalySensitivity: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">Low (Strict Contamination - 1% threshold)</option>
                <option value="MEDIUM">Medium (Balanced Operational Envelope - 3%)</option>
                <option value="HIGH">High (Aggressive Outlier Flagging - 5%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hardware & IoT Ingestion Config */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
          <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>IoT Hardware Device Identifier</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Bound Device ID</label>
              <input
                type="text"
                value={formData.deviceId}
                onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Administrator Email for Alerts</label>
              <input
                type="email"
                value={formData.notifyEmail}
                onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Calibration...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

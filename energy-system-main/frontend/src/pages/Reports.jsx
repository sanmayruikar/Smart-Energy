import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  Zap,
  IndianRupee,
  BrainCircuit,
  AlertTriangle,
  Bell,
  CheckCircle,
} from 'lucide-react';
import api from '../services/api';
import { exportToCSV } from '../utils/exportUtils';
import { useSystem } from '../context/SystemContext';
import { formatCurrency, formatEnergy } from '../utils/formatters';

const Reports = () => {
  const { tariff } = useSystem();
  const [reportType, setReportType] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [downloading, setDownloading] = useState(false);

  // Quick stats preview
  const [summaryData, setSummaryData] = useState({
    totalKwh: 68.4,
    totalCost: 547.2,
    appliancesCount: 4,
    anomaliesCount: 3,
    alertsCount: 5,
  });

  useEffect(() => {
    // Fetch overview statistics for report preview
    const loadPreview = async () => {
      try {
        const [dashRes, appRes, anomRes, alRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/appliances'),
          api.get('/anomalies'),
          api.get('/alerts'),
        ]);

        if (dashRes.success) {
          const totalKwh = dashRes.data.dailyConsumption
            ? dashRes.data.dailyConsumption.reduce((a, b) => a + b.energy, 0)
            : 68.4;
          setSummaryData({
            totalKwh: +totalKwh.toFixed(2),
            totalCost: +(totalKwh * tariff).toFixed(2),
            appliancesCount: appRes.data?.length || 4,
            anomaliesCount: anomRes.data?.length || 0,
            alertsCount: alRes.data?.length || 0,
          });
        }
      } catch (err) {
        console.error('Error loading report preview:', err);
      }
    };
    loadPreview();
  }, [tariff]);

  const handleGenerateReport = async () => {
    setDownloading(true);
    try {
      if (reportType === 'all' || reportType === 'consumption') {
        const res = await api.get('/energy/history?limit=100');
        if (res.success && res.data) {
          const data = res.data.map((r) => ({
            Timestamp: new Date(r.timestamp).toISOString(),
            Device: r.deviceId,
            Voltage_V: r.voltage,
            Current_A: r.current,
            Power_W: r.power,
            Energy_kWh: r.energy,
            Temperature_C: r.temperature,
            Cost_INR: +(r.energy * tariff).toFixed(2),
            Mode: r.mode,
            ActiveAppliances: (r.activeAppliances || []).join('; '),
          }));
          exportToCSV(data, `energy-consumption-report-${Date.now()}.csv`);
        }
      }

      if (reportType === 'all' || reportType === 'appliances') {
        const res = await api.get('/appliances');
        if (res.success && res.data) {
          const data = res.data.map((a) => ({
            Appliance_Name: a.name,
            Type: a.type,
            Relay_Pin: a.relayPin,
            Status: a.status,
            Power_Rating_W: a.powerRating,
            Active_Power_W: a.currentPower,
            Total_Energy_kWh: a.totalEnergy,
            Runtime_Hours: a.runtimeHours,
            Total_Cost_INR: a.totalCost,
          }));
          exportToCSV(data, `appliances-usage-report-${Date.now()}.csv`);
        }
      }

      if (reportType === 'all' || reportType === 'anomalies') {
        const res = await api.get('/anomalies');
        if (res.success && res.data) {
          const data = res.data.map((an) => ({
            Timestamp: new Date(an.timestamp).toISOString(),
            Appliance: an.appliance,
            Power_W: an.power,
            Expected_Min: an.expectedRange?.min,
            Expected_Max: an.expectedRange?.max,
            Actual_Value: an.actualValue,
            Severity: an.severity,
            Metric: an.metric,
            Explanation: an.explanation,
            Is_Resolved: an.isResolved ? 'YES' : 'NO',
          }));
          exportToCSV(data, `anomaly-audit-report-${Date.now()}.csv`);
        }
      }

      if (reportType === 'all' || reportType === 'alerts') {
        const res = await api.get('/alerts');
        if (res.success && res.data) {
          const data = res.data.map((al) => ({
            Timestamp: new Date(al.timestamp).toISOString(),
            Alert_Type: al.type,
            Severity: al.severity,
            Message: al.message,
            Is_Read: al.isRead ? 'YES' : 'NO',
          }));
          exportToCSV(data, `alerts-warnings-report-${Date.now()}.csv`);
        }
      }

      alert('Report generated and downloaded successfully!');
    } catch (err) {
      alert(`Report export failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-100">Audit Reports & Data Export</h3>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Export standardized CSV files containing historical telemetry, load expenditure, anomalies, and model forecasts.
        </p>
      </div>

      {/* Report Configuration Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Select Report Scope */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Report Dataset
            </label>
            <div className="space-y-2">
              {[
                { id: 'all', label: 'Complete Audit Package (All Datasets)', icon: Layers },
                { id: 'consumption', label: 'Energy Consumption & Telemetry', icon: Zap },
                { id: 'appliances', label: 'Appliance Duty Cycles & Cost Breakdown', icon: IndianRupee },
                { id: 'anomalies', label: 'Isolation Forest Anomalies Log', icon: AlertTriangle },
                { id: 'alerts', label: 'Warning & Safety Alert Logs', icon: Bell },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => setReportType(item.id)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center space-x-3 transition ${
                      reportType === item.id
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeframe & Preview Summary */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Audit Time Window
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="24h">Past 24 Hours</option>
                <option value="7d">Past 7 Days (Standard)</option>
                <option value="30d">Past 30 Days (Monthly Cycle)</option>
                <option value="all">All Available Historical Data</option>
              </select>
            </div>

            {/* Preview Box */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-300 block mb-2">Dataset Preview Summary</span>
              <div className="flex justify-between text-slate-400">
                <span>Total Calculated Energy:</span>
                <span className="font-mono text-indigo-300 font-bold">{formatEnergy(summaryData.totalKwh)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Projected Expenditure:</span>
                <span className="font-mono text-emerald-400 font-bold">{formatCurrency(summaryData.totalCost)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Monitored Appliances:</span>
                <span className="font-mono text-slate-200">{summaryData.appliancesCount} Units</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Logged Anomalies:</span>
                <span className="font-mono text-rose-400 font-bold">{summaryData.anomaliesCount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Warning Events:</span>
                <span className="font-mono text-amber-400 font-bold">{summaryData.alertsCount}</span>
              </div>
            </div>

            {/* Export Trigger */}
            <button
              onClick={handleGenerateReport}
              disabled={downloading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Preparing CSV Files...' : 'Generate & Download CSV Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

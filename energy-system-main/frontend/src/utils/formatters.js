/**
 * Formatting utilities for electrical values, currencies, and dates
 */

export const formatCurrency = (val, tariff = 8) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatEnergy = (kwh) => {
  const num = Number(kwh) || 0;
  return `${num.toFixed(2)} kWh`;
};

export const formatPower = (watts) => {
  const num = Number(watts) || 0;
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)} kW`;
  }
  return `${num.toFixed(1)} W`;
};

export const formatVoltage = (volts) => {
  const num = Number(volts) || 0;
  return `${num.toFixed(1)} V`;
};

export const formatCurrent = (amps) => {
  const num = Number(amps) || 0;
  return `${num.toFixed(2)} A`;
};

export const formatTemperature = (tempC) => {
  const num = Number(tempC) || 0;
  return `${num.toFixed(1)} °C`;
};

export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDateTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
};

export const getSeverityBadgeClass = (severity) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
    case 'HIGH':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'LOW':
    default:
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  }
};

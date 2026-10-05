import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';

const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
  const { latestData, incomingAlert } = useSocket();
  const [settings, setSettings] = useState({
    electricityTariff: 8.0,
    powerThreshold: 1500,
    temperatureThreshold: 45.0,
    simulationMode: true,
    deviceId: 'ESP32-PZEM-01',
  });
  const [systemMode, setSystemMode] = useState('SIMULATION MODE');
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [dbStatus, setDbStatus] = useState({
    status: 'connected',
    databaseMode: 'MongoDB',
  });

  const fetchDbHealth = async () => {
    try {
      const res = await api.get('/health');
      if (res && res.database) {
        setDbStatus({
          status: res.database,
          databaseMode: res.databaseMode || (res.database === 'connected' ? 'MongoDB' : 'DEMO_IN_MEMORY'),
        });
      }
    } catch (e) {
      setDbStatus({ status: 'disconnected', databaseMode: 'DEMO_IN_MEMORY' });
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (e) {
      console.warn('Using default settings');
    }
  };

  const fetchAlertCount = async () => {
    try {
      const res = await api.get('/alerts?limit=1');
      if (res.success) {
        setUnreadAlerts(res.unreadCount || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchDbHealth();
    fetchSettings();
    fetchAlertCount();
  }, []);

  // Update system mode dynamically based on latest real-time packet
  useEffect(() => {
    if (latestData) {
      if (latestData.mode === 'HARDWARE') {
        setSystemMode('LIVE HARDWARE MODE');
      } else {
        setSystemMode('SIMULATION MODE');
      }
    }
  }, [latestData]);

  // Bump alert count on incoming socket alert
  useEffect(() => {
    if (incomingAlert) {
      setUnreadAlerts((prev) => prev + 1);
    }
  }, [incomingAlert]);

  const updateSettings = async (newSettings) => {
    try {
      const res = await api.put('/settings', newSettings);
      if (res.success && res.data) {
        setSettings(res.data);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return (
    <SystemContext.Provider
      value={{
        settings,
        systemMode,
        tariff: settings.electricityTariff || 8.0,
        unreadAlerts,
        setUnreadAlerts,
        dbStatus,
        refreshSettings: fetchSettings,
        updateSettings,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => useContext(SystemContext);

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5001'
    : window.location.origin);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [incomingAlert, setIncomingAlert] = useState(null);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      console.log('[Socket] Connected with ID:', s.id);
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setIsConnected(false);
    });

    s.on('live_energy_data', (data) => {
      setLatestData(data);
      setTelemetryHistory((prev) => {
        const point = {
          time: new Date(data.timestamp || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          power: data.power,
          voltage: data.voltage,
          current: data.current,
          temperature: data.temperature,
          energy: data.energy,
        };
        const next = [...prev, point];
        return next.length > 25 ? next.slice(next.length - 25) : next;
      });
    });

    s.on('new_alert', (alert) => {
      setIncomingAlert(alert);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        latestData,
        telemetryHistory,
        incomingAlert,
        clearIncomingAlert: () => setIncomingAlert(null),
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

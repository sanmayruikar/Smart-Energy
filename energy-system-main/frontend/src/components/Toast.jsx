import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const Toast = () => {
  const { incomingAlert, clearIncomingAlert } = useSocket();

  useEffect(() => {
    if (incomingAlert) {
      const timer = setTimeout(() => {
        clearIncomingAlert();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [incomingAlert, clearIncomingAlert]);

  if (!incomingAlert) return null;

  const isCritical = incomingAlert.severity === 'CRITICAL';
  const isHigh = incomingAlert.severity === 'HIGH';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-short">
      <div
        className={`p-4 rounded-xl shadow-2xl border backdrop-blur-lg flex items-start space-x-3 ${
          isCritical
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-900/40'
            : isHigh
            ? 'bg-amber-950/90 border-amber-500/50 text-amber-100 shadow-amber-900/40'
            : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-100 shadow-indigo-900/40'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isCritical ? (
            <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-xs uppercase tracking-wider">
              {incomingAlert.severity} Alert
            </h5>
            <span className="text-[10px] opacity-75 font-mono">Just Now</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed">{incomingAlert.message}</p>
        </div>

        <button
          onClick={clearIncomingAlert}
          className="text-slate-400 hover:text-white transition p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;

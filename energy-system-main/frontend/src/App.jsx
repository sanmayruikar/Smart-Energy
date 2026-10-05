import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SystemProvider } from './context/SystemContext';
import MainLayout from './layouts/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import Appliances from './pages/Appliances';
import EnergyAnalytics from './pages/EnergyAnalytics';
import HistoricalData from './pages/HistoricalData';
import MLPredictions from './pages/MLPredictions';
import AnomalyDetection from './pages/AnomalyDetection';
import AIAssistant from './pages/AIAssistant';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <SystemProvider>
          <Router>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="live" element={<LiveMonitoring />} />
                <Route path="appliances" element={<Appliances />} />
                <Route path="analytics" element={<EnergyAnalytics />} />
                <Route path="history" element={<HistoricalData />} />
                <Route path="predictions" element={<MLPredictions />} />
                <Route path="anomalies" element={<AnomalyDetection />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SystemProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

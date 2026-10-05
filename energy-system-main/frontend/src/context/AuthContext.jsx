import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('energy_user');
    return saved ? JSON.parse(saved) : { name: 'Demo Engineer', email: 'admin@smartenergy.com', role: 'admin' };
  });
  const [token, setToken] = useState(() => localStorage.getItem('energy_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('energy_token', token);
    } else {
      localStorage.removeItem('energy_token');
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success && res.data) {
        setUser(res.data);
        setToken(res.data.token);
        localStorage.setItem('energy_user', JSON.stringify(res.data));
        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.success && res.data) {
        setUser(res.data);
        setToken(res.data.token);
        localStorage.setItem('energy_user', JSON.stringify(res.data));
        return { success: true };
      }
      return { success: false, message: 'Registration failed' };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('energy_user');
    localStorage.removeItem('energy_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

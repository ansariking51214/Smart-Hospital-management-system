import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_USERS = [
  {
    role: 'ADMIN',
    label: 'Super Admin',
    email: 'admin@hms.hospital',
    password: 'Admin@12345',
    color: 'red',
    badge: 'Full Access',
  },
  {
    role: 'DOCTOR',
    label: 'Dr. Sarah (Cardiology)',
    email: 'dr.sarah@hms.hospital',
    password: 'Password@123',
    color: 'emerald',
    badge: 'Clinical / EHR',
  },
  {
    role: 'DOCTOR',
    label: 'Dr. Ahmed (Pediatrics)',
    email: 'dr.ahmed@hms.hospital',
    password: 'Password@123',
    color: 'teal',
    badge: 'OPD / Triage',
  },
  {
    role: 'RECEPTIONIST',
    label: 'Receptionist',
    email: 'receptionist@hms.hospital',
    password: 'Password@123',
    color: 'blue',
    badge: 'Desk / Intake',
  },
  {
    role: 'NURSE',
    label: 'Nurse Maria',
    email: 'nurse.maria@hms.hospital',
    password: 'Password@123',
    color: 'purple',
    badge: 'Vitals & Wards',
  },
  {
    role: 'PATIENT',
    label: 'David Miller (MRN-0001)',
    email: 'david.miller@gmail.com',
    password: 'Password@123',
    color: 'amber',
    badge: 'Patient Portal',
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hms_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sync session on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('hms_token');
      if (savedToken) {
        try {
          const res = await authAPI.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            setToken(savedToken);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Initial session validation failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await authAPI.login({ email, password });
      if (res.success && res.token) {
        localStorage.setItem('hms_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user, token: res.token };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const res = await authAPI.register(userData);
      if (res.success && res.token) {
        localStorage.setItem('hms_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user, token: res.token };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      const msg =
        err.response?.data?.errors?.join(', ') ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout().catch(() => {});
      }
    } finally {
      localStorage.removeItem('hms_token');
      setToken(null);
      setUser(null);
      setAuthError(null);
    }
  };

  const quickLogin = async (email, password) => {
    return await login(email, password);
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      const res = await authAPI.changePassword({ oldPassword, newPassword });
      return { success: true, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Password update failed';
      return { success: false, message: msg };
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!user && !!token,
    loading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    quickLogin,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

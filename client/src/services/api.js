import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT Authorization Bearer header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
      console.warn('Session expired. Token is no longer valid.');
    }
    return Promise.reject(error);
  }
);

// Schema & Diagnostics (Day 1)
export const fetchHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const fetchSchemaDetails = async () => {
  const response = await api.get('/schema');
  return response.data;
};

// Authentication Endpoints (Day 2)
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  getMe: async (customToken) => {
    const headers = customToken ? { Authorization: `Bearer ${customToken}` } : {};
    const response = await api.get('/auth/me', { headers });
    return response.data;
  },
  changePassword: async (passwords) => {
    const response = await api.post('/auth/change-password', passwords);
    return response.data;
  },
  inspectToken: async (token) => {
    const response = await api.post('/auth/inspect-token', { token });
    return response.data;
  },
  getAuditLogs: async () => {
    const response = await api.get('/auth/audit-logs');
    return response.data;
  },
};

// Role-Based Access Control (RBAC) Endpoints (Day 3)
export const rbacAPI = {
  getMatrix: async () => {
    const response = await api.get('/rbac/matrix');
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get('/rbac/users');
    return response.data;
  },
  updateUserRole: async (userId, newRole) => {
    const response = await api.patch(`/rbac/users/${userId}/role`, { newRole });
    return response.data;
  },
  updateUserStatus: async (userId, isActive) => {
    const response = await api.patch(`/rbac/users/${userId}/status`, { isActive });
    return response.data;
  },
  testRoleGuard: async (roleType, customToken) => {
    const headers = customToken ? { Authorization: `Bearer ${customToken}` } : {};
    const response = await api.get(`/rbac/guard/${roleType}`, { headers });
    return response.data;
  },
};

export default api;

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

// Patient Registration & Demographic Endpoints (Day 4)
export const patientsAPI = {
  register: async (patientData) => {
    const response = await api.post('/patients/register', patientData);
    return response.data;
  },
  getAll: async (params = {}) => {
    const response = await api.get('/patients', { params });
    return response.data;
  },
  getByIdOrMrn: async (idOrMrn) => {
    const response = await api.get(`/patients/${idOrMrn}`);
    return response.data;
  },
  update: async (id, updateData) => {
    const response = await api.put(`/patients/${id}`, updateData);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/patients/stats/overview');
    return response.data;
  },
};

// Patient Search, Medical History & Emergency Contacts (Day 5)
export const medicalHistoryAPI = {
  searchPatients: async (params = {}) => {
    const response = await api.get('/medical-history/search', { params });
    return response.data;
  },
  getHistory: async (idOrMrn) => {
    const response = await api.get(`/medical-history/patient/${idOrMrn}`);
    return response.data;
  },
  updateBaseline: async (patientId, data) => {
    const response = await api.patch(`/medical-history/patient/${patientId}/medical-baseline`, data);
    return response.data;
  },
  updateEmergencyContact: async (patientId, data) => {
    const response = await api.patch(`/medical-history/patient/${patientId}/emergency-contact`, data);
    return response.data;
  },
};

// Doctor Profile & Shift Roster Endpoints (Module 2 Day 1)
export const doctorRosterAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/doctors', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },
  create: async (doctorData) => {
    const response = await api.post('/doctors', doctorData);
    return response.data;
  },
  updateRoster: async (id, rosterData) => {
    const response = await api.put(`/doctors/${id}/roster`, rosterData);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/doctors/stats/overview');
    return response.data;
  },
};

// Slot Booking Engine & OPD Appointments (Module 2 Day 2)
export const appointmentsAPI = {
  getAvailableSlots: async (doctorId, date, slotDuration = 30) => {
    const response = await api.get('/appointments/slots', {
      params: { doctorId, date, slotDuration },
    });
    return response.data;
  },
  book: async (bookingData) => {
    const response = await api.post('/appointments/book', bookingData);
    return response.data;
  },
  getAll: async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },
  reschedule: async (id, rescheduleData) => {
    const response = await api.patch(`/appointments/${id}/reschedule`, rescheduleData);
    return response.data;
  },
  cancel: async (id, cancellationData = {}) => {
    const response = await api.patch(`/appointments/${id}/cancel`, cancellationData);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/appointments/stats/overview');
    return response.data;
  },
};

// OPD Live Queue & Token Display System (Module 2 Day 3)
export const opdQueueAPI = {
  getLiveBoard: async (params = {}) => {
    const response = await api.get('/queue/live', { params });
    return response.data;
  },
  callNext: async (doctorId) => {
    const response = await api.post('/queue/call-next', { doctorId });
    return response.data;
  },
  updateStatus: async (tokenId, status) => {
    const response = await api.patch(`/queue/token/${tokenId}/status`, { status });
    return response.data;
  },
  issueWalkIn: async (walkInData) => {
    const response = await api.post('/queue/issue-walkin', walkInData);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/queue/stats/overview');
    return response.data;
  },
};

export default api;

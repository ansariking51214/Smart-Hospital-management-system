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

// Nurse Vitals Triage Desk & Early Warning System (Module 2 Day 4)
export const triageAPI = {
  recordVitals: async (vitalsData) => {
    const response = await api.post('/triage/vitals', vitalsData);
    return response.data;
  },
  getQueue: async () => {
    const response = await api.get('/triage/queue');
    return response.data;
  },
  getPatientHistory: async (patientId) => {
    const response = await api.get(`/triage/patient/${patientId}/history`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/triage/stats/overview');
    return response.data;
  },
};

// Appointment Status & Consultation Flow (Module 2 Day 5)
export const appointmentFlowAPI = {
  getBoard: async (params = {}) => {
    const response = await api.get('/appointment-flow/board', { params });
    return response.data;
  },
  updateStatus: async (id, statusData) => {
    const response = await api.patch(`/appointment-flow/${id}/status`, statusData);
    return response.data;
  },
  recordNote: async (id, noteData) => {
    const response = await api.post(`/appointment-flow/${id}/consultation-note`, noteData);
    return response.data;
  },
  getTimeline: async (id) => {
    const response = await api.get(`/appointment-flow/${id}/timeline`);
    return response.data;
  },
  scheduleFollowUp: async (id, followUpData) => {
    const response = await api.post(`/appointment-flow/${id}/schedule-followup`, followUpData);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/appointment-flow/stats/lifecycle');
    return response.data;
  },
};

// Doctor Consultation UI & Clinical Workspace (Module 3 Day 1)
export const consultationAPI = {
  getActivePatientSnapshot: async (patientId) => {
    const response = await api.get(`/consultation/active-patient/${patientId}`);
    return response.data;
  },
  getDoctorWorklist: async (params = {}) => {
    const response = await api.get('/consultation/doctor-worklist', { params });
    return response.data;
  },
  startEncounter: async (encounterData) => {
    const response = await api.post('/consultation/encounter/start', encounterData);
    return response.data;
  },
  getHistoryDrawer: async (patientId) => {
    const response = await api.get(`/consultation/patient/${patientId}/history-drawer`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/consultation/stats/overview');
    return response.data;
  },
  getClinicalCatalog: async (params = {}) => {
    const response = await api.get('/consultation/clinical-catalog', { params });
    return response.data;
  },
  checkClinicalSafety: async (payload) => {
    const response = await api.post('/consultation/clinical-safety/check', payload);
    return response.data;
  },
  issuePrescription: async (payload) => {
    const response = await api.post('/consultation/prescriptions', payload);
    return response.data;
  },
  getPatientPrescriptions: async (patientId) => {
    const response = await api.get(`/consultation/prescriptions/patient/${patientId}`);
    return response.data;
  },
  getPrescriptionPdfUrl: (prescriptionId) => {
    const base = api.defaults.baseURL || '/api';
    return `${base}/consultation/prescriptions/${prescriptionId}/pdf`;
  },
  getClinicalSummary: async (patientId) => {
    const response = await api.get(`/consultation/patient/${patientId}/clinical-summary`);
    return response.data;
  },
  getClinicalSummaryExportUrl: (patientId) => {
    const base = api.defaults.baseURL || '/api';
    return `${base}/consultation/patient/${patientId}/clinical-summary/export`;
  },
};

// Diagnostic Lab & Radiology Orders & Results Tracking (Module 3 Day 5)
export const labOrdersAPI = {
  getCatalog: async (params = {}) => {
    const response = await api.get('/consultation/lab-orders/catalog', { params });
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post('/consultation/lab-orders', payload);
    return response.data;
  },
  getByPatient: async (patientId) => {
    const response = await api.get(`/consultation/lab-orders/patient/${patientId}`);
    return response.data;
  },
  getAll: async (params = {}) => {
    const response = await api.get('/consultation/lab-orders', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/consultation/lab-orders/${id}`);
    return response.data;
  },
  updateStatus: async (id, payload) => {
    const response = await api.patch(`/consultation/lab-orders/${id}/status`, payload);
    return response.data;
  },
};

// Pharmacy Inventory & Stock Management (Module 4 Day 1)
export const pharmacyAPI = {
  getMedicines: async (params = {}) => {
    const response = await api.get('/pharmacy/medicines', { params });
    return response.data;
  },
  addMedicine: async (medicineData) => {
    const response = await api.post('/pharmacy/medicines', medicineData);
    return response.data;
  },
  updateMedicine: async (id, updateData) => {
    const response = await api.put(`/pharmacy/medicines/${id}`, updateData);
    return response.data;
  },
  deleteMedicine: async (id) => {
    const response = await api.delete(`/pharmacy/medicines/${id}`);
    return response.data;
  },
  getBatches: async () => {
    const response = await api.get('/pharmacy/batches');
    return response.data;
  },
  addBatch: async (batchData) => {
    const response = await api.post('/pharmacy/batches', batchData);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/pharmacy/stats');
    return response.data;
  },
};

// Inpatient (IPD) Ward & Bed Allocation Matrix (Module 4 Day 2)
export const ipdAPI = {
  getWards: async () => {
    const response = await api.get('/ipd/wards');
    return response.data;
  },
  createWard: async (wardData) => {
    const response = await api.post('/ipd/wards', wardData);
    return response.data;
  },
  getBeds: async (params = {}) => {
    const response = await api.get('/ipd/beds', { params });
    return response.data;
  },
  createBed: async (bedData) => {
    const response = await api.post('/ipd/beds', bedData);
    return response.data;
  },
  allocateBed: async (allocationData) => {
    const response = await api.post('/ipd/allocations', allocationData);
    return response.data;
  },
  dischargeBed: async (allocationId, dischargeData = {}) => {
    const response = await api.post(`/ipd/allocations/${allocationId}/discharge`, dischargeData);
    return response.data;
  },
  getActiveAllocations: async () => {
    const response = await api.get('/ipd/allocations/active');
    return response.data;
  },
};

// Integrated Billing & Printable PDF Invoices (Module 4 Day 3 & 4)
export const billingAPI = {
  getUnbilledCharges: async (patientId) => {
    const response = await api.get(`/billing/unbilled-charges/${patientId}`);
    return response.data;
  },
  createInvoice: async (invoiceData) => {
    const response = await api.post('/billing/invoices', invoiceData);
    return response.data;
  },
  getInvoices: async (params = {}) => {
    const response = await api.get('/billing/invoices', { params });
    return response.data;
  },
  getInvoiceById: async (id) => {
    const response = await api.get(`/billing/invoices/${id}`);
    return response.data;
  },
  recordPayment: async (id, paymentData) => {
    const response = await api.post(`/billing/invoices/${id}/payment`, paymentData);
    return response.data;
  },
  getPdfData: async (id) => {
    const response = await api.get(`/billing/invoices/${id}/pdf-data`);
    return response.data;
  },
};

export default api;


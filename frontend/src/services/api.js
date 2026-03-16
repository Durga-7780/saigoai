/**
 * API Service
 * Handles all API calls to the backend
 */
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://saigoai.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Attendance
export const attendanceAPI = {
  checkIn: (data) => api.post('/attendance/check-in', data),
  checkOut: (data) => api.post('/attendance/check-out', data),
  getMyAttendance: (params) => api.get('/attendance/my-attendance', { params }),
  getTodayAttendance: () => api.get('/attendance/today'),
  getStats: (params) => api.get('/attendance/stats', { params }),
};

// Leave
export const leaveAPI = {
  applyLeave: (data) => api.post('/leaves/apply', data),
  getMyLeaves: (params) => api.get('/leaves/my-leaves', { params }),
  getBalance: () => api.get('/leaves/balance'),
  cancelLeave: (leaveId) => api.delete(`/leaves/${leaveId}`),
  approveLeave: (data) => api.post('/leaves/approve', data),
  getAllLeaves: (params) => api.get('/leaves/all', { params }),
};

// Employee
export const employeeAPI = {
  getProfile: () => api.get('/employees/me'),
  updateProfile: (data) => api.put('/employees/me', data),
  getAllEmployees: (params) => api.get('/employees/all', { params }),
  createEmployee: (data) => api.post('/employees/', data),
  updateEmployeeAdmin: (employeeId, data) => api.put(`/employees/${employeeId}`, data),
  unlockBankDetails: (employeeId) => api.post(`/employees/${employeeId}/unlock-bank-details`),
  lockBankDetails: (employeeId) => api.post(`/employees/${employeeId}/lock-bank-details`),
};

// Chatbot
export const chatbotAPI = {
  ask: (data) => api.post('/chatbot/ask', data),
  getSuggestions: () => api.get('/chatbot/suggestions'),
  getVoiceConfig: () => api.get('/chatbot/voice/config'),
  createVoiceSession: () => api.post('/chatbot/voice/sessions'),
  listVoiceSessions: () => api.get('/chatbot/voice/sessions'),
  getVoiceSession: (sessionId) => api.get(`/chatbot/voice/sessions/${sessionId}`),
  sendVoiceTurn: (sessionId, audioBlob, options = {}) => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    if (options.inputLanguage) {
      formData.append('input_language', options.inputLanguage);
    }
    if (options.responseLanguage) {
      formData.append('response_language', options.responseLanguage);
    }
    formData.append('audio', audioBlob, 'voice.webm');
    return api.post('/chatbot/voice/turn', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
  },
  getVoiceIdleGreeting: (sessionId) => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    return api.post('/chatbot/voice/idle-greeting', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
  },
};

// Dashboard
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getAdminStats: () => api.get('/dashboard/admin/stats'),
};

// Holidays
export const holidayAPI = {
  getAll: () => api.get('/holidays'),
  create: (data) => api.post('/holidays', data),
  update: (id, data) => api.put(`/holidays/${id}`, data),
  delete: (id) => api.delete(`/holidays/${id}`),
};

// Notifications
export const notificationAPI = {
  getMyNotifications: (unreadOnly = false) => api.get('/notifications', { params: { unread_only: unreadOnly } }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  clearAll: () => api.delete('/notifications/clear-all'),
};

export const announcementAPI = {
    getAll: () => api.get('/announcements/'),
    create: (data) => api.post('/announcements/', data),
    delete: (id) => api.delete(`/announcements/${id}`),
};

export const requestAPI = {
    create: (data) => api.post('/requests/', data),
    getAll: (params) => api.get('/requests/', { params }),
    updateStatus: (id, data) => api.patch(`/requests/${id}`, data),
};

export const payrollAPI = {
    updateSalaryDetails: (employeeId, data) => api.put(`/payroll/salary/${employeeId}`, data),
    generatePayslip: (data) => api.post('/payroll/generate', data),
    getMyPayslips: () => api.get('/payroll/my'),
    getAllPayslips: () => api.get('/payroll/all'),
    getPayslip: (id) => api.get(`/payroll/${id}`),
    deletePayslip: (id) => api.delete(`/payroll/${id}`),
    bulkGeneratePayslips: (data) => api.post('/payroll/generate/bulk', data),
};
export const mealAPI = {
    book: (data) => api.post('/meals/', data),
    getMyMeals: (params) => api.get('/meals/my', { params }),
    getAll: (params) => api.get('/meals/all', { params }), // for admin
    getStats: (params) => api.get('/meals/stats', { params }),
    cancel: (id) => api.delete(`/meals/${id}`),
    scan: (data) => api.post('/meals/scan', data),
    getMenu: (date) => api.get(`/meals/menu/${date}`),
    createMenu: (data) => api.post('/meals/menu', data),
};


export const companyAPI = {
    getSettings: () => api.get('/company/'),
    updateSettings: (data) => api.put('/company/', data, {
        headers: {
            'Content-Type': data instanceof FormData ? undefined : 'application/json'
        }
    }),
};

export const documentsAPI = {
    generate: (data) => api.post('/documents/generate', data, {
        headers: {
            'Content-Type': undefined, // Let browser handle boundary
        }
    }),
    create: (data) => api.post('/documents/', data),
    getMy: () => api.get('/documents/my'),
    getAll: () => api.get('/documents/all'), // For HR
};

export default api;

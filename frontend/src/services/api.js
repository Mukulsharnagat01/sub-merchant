import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
};

// Merchant API
export const merchantAPI = {
  create: (data) => api.post('/merchant/create', data),
  getById: (id) => api.get(`/merchant/${id}`),
  getList: (params) => api.get('/merchant/list', { params }),
  update: (id, data) => api.put(`/merchant/${id}`, data),
  delete: (id) => api.delete(`/merchant/${id}`),
  getStats: () => api.get('/merchant/stats')
};

// KYC API
export const kycAPI = {
  initiate: (merchantId, data) => api.post(`/kyc/initiate/${merchantId}`, data),
  getStatus: (merchantId) => api.get(`/kyc/status/${merchantId}`),
  submitBankDetails: (merchantId, data) => api.post(`/kyc/bank-details/${merchantId}`, data),
  refresh: (merchantId) => api.post(`/kyc/refresh/${merchantId}`)
};

export default api;

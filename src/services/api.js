import axios from 'axios';

// The API Gateway routes all requests to GCP GKE Gateway or local fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://35.234.210.54:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically inject JWT Token from local storage
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

// Intercept unauthorized requests to clear stale sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      // Token might be expired or invalid
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        localStorage.clear();
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

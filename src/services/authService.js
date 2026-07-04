import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/users/login', { email, password });
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        email: response.data.email,
        role: response.data.role,
        userId: response.data.userId,
      }));
    }
    return response.data;
  },

  register: async (name, email, password, role) => {
    const response = await api.post('/api/users/register', { name, email, password, role });
    return response.data;
  },

  googleLogin: async (idToken) => {
    const response = await api.post('/api/users/google-login', { idToken });
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        email: response.data.email,
        role: response.data.role,
        userId: response.data.userId,
      }));
    }
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await api.get(`/api/users/verify?token=${token}`);
    return response.data;
  },

  logout: () => {
    localStorage.clear();
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return localStorage.getItem('token') !== null;
  }
};

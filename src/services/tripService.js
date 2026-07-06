import api from './api';

export const tripService = {
  requestTrip: async (bookingDetails) => {
    const response = await api.post('/api/trips', bookingDetails);
    return response.data;
  },

  updateTripStatus: async (tripId, status) => {
    const response = await api.put(`/api/trips/${tripId}/status?status=${status}`);
    return response.data;
  },

  getTripDetails: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}`);
    return response.data;
  },

  getRiderTrips: async () => {
    const response = await api.get('/api/trips/rider');
    return response.data;
  },

  getDriverTrips: async () => {
    const response = await api.get('/api/trips/driver');
    return response.data;
  },

  getAllTrips: async () => {
    const response = await api.get('/api/trips/all');
    return response.data;
  },

  // 📈 Audit timeline logs (consumed from cab-audit-service)
  getTripHistoryTimeline: async (tripId) => {
    const response = await api.get(`/api/audit/trip/${tripId}`);
    return response.data;
  },

  // 💳 Billing details (consumed from cab-billing-service)
  getTripInvoice: async (tripId) => {
    const response = await api.get(`/api/billing/invoice/trip/${tripId}`);
    return response.data;
  },

  payTripInvoice: async (invoiceId, paymentId) => {
    const response = await api.post('/api/billing/payment', { invoiceId, paymentId });
    return response.data;
  },

  getInvoicePdfUrl: (invoiceId) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${API_BASE_URL}/api/billing/invoice/${invoiceId}/pdf`;
  }
};

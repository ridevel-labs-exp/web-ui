import api from './api';

export const driverService = {
  submitOnboarding: async (onboardingData) => {
    const formData = new FormData();
    formData.append('licenseNumber', onboardingData.licenseNumber);
    formData.append('insurancePolicy', onboardingData.insurancePolicy);
    formData.append('rcNumber', onboardingData.rcNumber);
    formData.append('photoFront', onboardingData.photoFront);
    formData.append('photoSide', onboardingData.photoSide);
    formData.append('photoBack', onboardingData.photoBack);
    formData.append('photoRcFront', onboardingData.photoRcFront);
    formData.append('photoRcBack', onboardingData.photoRcBack);
    formData.append('photoLicense', onboardingData.photoLicense);
    formData.append('photoInsurance', onboardingData.photoInsurance);
    if (onboardingData.photoPollution) {
      formData.append('photoPollution', onboardingData.photoPollution);
    }

    const response = await api.post('/api/drivers/onboarding', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/drivers/profile');
    return response.data;
  },

  getAllDrivers: async () => {
    const response = await api.get('/api/drivers');
    return response.data;
  },

  reviewOnboarding: async (driverId, status) => {
    const response = await api.put(`/api/drivers/onboarding/review/${driverId}`, { status });
    return response.data;
  },

  // Serving documents helper URL
  getFileUrl: (virtualPath) => {
    const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
    return `${API_BASE_URL}${virtualPath}`;
  }
};

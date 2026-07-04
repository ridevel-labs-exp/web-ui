import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import RiderDashboard from './pages/RiderDashboard';
import DriverOnboarding from './pages/DriverOnboarding';
import AdminDashboard from './pages/AdminDashboard';
import { authService } from './services/authService';
import { requestNotificationPermission } from './services/firebase';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');

  useEffect(() => {
    // 1. Check if we are intercepting email verification token route
    const params = new URLSearchParams(window.location.search);
    if (params.has('token')) {
      setCurrentPage('verify');
      return;
    }

    // 2. Auto-login session recovery logic on startup
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      if (user) {
        // Request FCM web push notification permission from user
        requestNotificationPermission().catch(err => console.log('FCM setup bypassed: ', err));

        if (user.role === 'ROLE_ADMIN') {
          setCurrentPage('admin');
        } else if (user.role === 'ROLE_DRIVER') {
          setCurrentPage('driver');
        } else {
          setCurrentPage('rider');
        }
      }
    }
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);
    // Clear query parameters when manually navigating
    if (page !== 'verify') {
      window.history.pushState({}, document.title, window.location.pathname);
    }
    if (page === 'rider' || page === 'driver' || page === 'admin') {
      requestNotificationPermission().catch(err => console.log('FCM setup bypassed: ', err));
    }
  };

  // Simple Router
  switch (currentPage) {
    case 'login':
      return <Login onNavigate={navigateTo} />;
    case 'register':
      return <Register onNavigate={navigateTo} />;
    case 'verify':
      return <VerifyEmail onNavigate={navigateTo} />;
    case 'rider':
      return <RiderDashboard />;
    case 'driver':
      return <DriverOnboarding />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Login onNavigate={navigateTo} />;
  }
}
